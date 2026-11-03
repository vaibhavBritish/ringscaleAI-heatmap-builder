import { v4 as uuidv4 } from 'uuid'
import prisma from './prisma'
import { generateHeatmapGrid } from './heatmap-utils'
import {
  searchKeywordAtPoint,
  searchBusinessByText,
  getNearbyCompetitors,
  checkQuota
} from './google-places'
import redis from './redis'

// ─── TUNING ──────────────────────────────────────────────────────────────────
// How many grid points one scan job works on at the same time.
const POINT_CONCURRENCY = Math.max(1, parseInt(process.env.SCAN_POINT_CONCURRENCY || '5', 10))
// Process-wide ceiling on live Google Places searches (shared by ALL running scans),
// so several partners scanning at once stay under the per-minute quota instead of
// tripping 429s and slow retry backoffs. <= 0 disables the limiter.
const GOOGLE_MAX_QPM = parseInt(process.env.GOOGLE_PLACES_MAX_QPM || '240', 10)
// Results are written in small batches instead of one insert per point.
const FLUSH_EVERY_POINTS = 5
const FLUSH_INTERVAL_MS = 1000
// A running job refreshes heartbeatAt at least this often, even when no point finished.
const HEARTBEAT_INTERVAL_MS = 30 * 1000
// A queued/processing job whose heartbeat is older than this is considered orphaned
// (e.g. the server restarted mid-scan) and gets resumed or closed out.
const STALE_MS = parseInt(process.env.SCAN_STALE_MS || String(2 * 60 * 1000), 10)
// Orphaned jobs younger than this are resumed; older ones are marked failed.
const RESUME_WINDOW_MS = 6 * 60 * 60 * 1000

const TERMINAL_STATUSES = ['completed', 'failed', 'cancelled']
const ACTIVE_STATUSES = ['queued', 'processing']

// Shared across every route bundle in this Node process.
const ACTIVE_JOBS = (globalThis.__rsActiveScanJobs ||= new Set())
const limiterState = (globalThis.__rsGoogleLimiter ||= { next: 0 })
const projectRecoveryRuns = (globalThis.__rsProjectRecoveryRuns ||= new Map())

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/** Waits for the next free Google Places slot (FIFO, shared by all scans in this process). */
async function acquireGoogleSlot() {
  if (!(GOOGLE_MAX_QPM > 0)) return
  const interval = 60000 / GOOGLE_MAX_QPM
  const now = Date.now()
  const slot = Math.max(now, limiterState.next)
  limiterState.next = slot + interval
  if (slot > now) await sleep(slot - now)
}

const pointKey = (lat, lng) => `${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`

function parseGridSettings(project) {
  if (!project?.gridSettings) return {}
  if (typeof project.gridSettings === 'string') {
    try { return JSON.parse(project.gridSettings) } catch { return {} }
  }
  return project.gridSettings
}

function buildPointResult(results, targetPlaceId, targetName, extra = {}) {
  const normalizedTarget = targetName ? targetName.toLowerCase().trim() : null
  const targetIndex = results.findIndex(r =>
    r.placeId === targetPlaceId ||
    (normalizedTarget && r.name && r.name.toLowerCase().trim() === normalizedTarget)
  )
  const found = targetIndex !== -1

  const competitors = results
    .filter(r => r.placeId !== targetPlaceId)
    .slice(0, 5)
    .map(r => ({
      placeId: r.placeId,
      name: r.name,
      address: r.address,
      rank: r.rank,
      rating: r.rating,
      reviewCount: r.reviewCount
    }))

  return {
    found,
    rank: found ? targetIndex + 1 : null,
    competitors,
    rawResults: results.slice(0, 10),
    error: null,
    ...extra
  }
}

// Process a single scan point
async function processScanPoint(point, keyword, targetPlaceId, targetName, searchRadius, skipCache = false) {
  try {
    // Round to 4 decimal places (approx 11m precision) to increase cache hits
    const lat = parseFloat(point.latitude.toFixed(4))
    const lng = parseFloat(point.longitude.toFixed(4))
    const cacheKey = `scan:point:${keyword.toLowerCase().trim()}:${lat}:${lng}`

    if (redis && !skipCache) {
      try {
        const cached = await redis.get(cacheKey)
        if (cached) {
          return buildPointResult(JSON.parse(cached), targetPlaceId, targetName, { fromCache: true })
        }
      } catch (e) {
        console.warn('Redis Cache Read Error:', e.message)
      }
    }

    // Only live Google calls go through the shared rate limiter; cache hits are instant.
    await acquireGoogleSlot()
    const results = (await searchKeywordAtPoint(keyword, point.latitude, point.longitude, searchRadius)) || []

    // Cache for 7 days to reduce API billing
    if (redis && results.length > 0) {
      try {
        await redis.set(cacheKey, JSON.stringify(results), 'EX', 604800)
      } catch (e) {
        console.warn('Redis Cache Write Error:', e.message)
      }
    }

    return buildPointResult(results, targetPlaceId, targetName)
  } catch (error) {
    if (error.message === 'DAILY_QUOTA_REACHED') {
      throw error
    }
    console.error(`Error processing point (${point.row}, ${point.col}):`, error.message)
    return {
      found: false,
      rank: null,
      competitors: [],
      rawResults: [],
      error: error.message
    }
  }
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371 // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function generateMockResult(point, project, greenPinPercentage, realCompetitors = []) {
  const distance = getDistanceFromLatLonInKm(
    project.latitude,
    project.longitude,
    point.latitude,
    point.longitude
  )

  const gridSettings = parseGridSettings(project)
  const rawRadius = gridSettings.radius || 5
  const unit = gridSettings.unit || 'km'
  const radiusInKm = unit === 'mi' ? rawRadius * 1.60934 : rawRadius

  // Green Zone Radius: linear threshold based on percentage
  const greenRadius = radiusInKm * (greenPinPercentage / 100)

  let rank
  if (distance <= greenRadius) {
    rank = Math.floor(Math.random() * 3) + 1
  } else {
    const ratio = (distance - greenRadius) / Math.max(0.001, radiusInKm - greenRadius)
    const minRank = 4
    const maxRank = 20
    rank = Math.floor(minRank + (ratio * (maxRank - minRank)) + (Math.random() * 3 - 1))
    rank = Math.max(4, Math.min(20, rank))
  }

  // Use real competitors if provided, fallback to mock names but keep the structure
  const baseCompetitors = realCompetitors.length > 0
    ? realCompetitors
    : [
        { placeId: 'mock-1', name: 'Competitor A', address: '123 Fake St', rating: 4.5, reviewCount: 120 },
        { placeId: 'mock-2', name: 'Competitor B', address: '456 Mock Rd', rating: 4.2, reviewCount: 85 },
        { placeId: 'mock-3', name: 'Competitor C', address: '789 Test Ave', rating: 4.0, reviewCount: 50 },
        { placeId: 'mock-4', name: 'Competitor D', address: '101 Error Ln', rating: 3.8, reviewCount: 30 },
        { placeId: 'mock-5', name: 'Competitor E', address: '202 Bug Blvd', rating: 3.5, reviewCount: 15 }
      ]

  const adjustedCompetitors = baseCompetitors.map((c, i) => {
    let cRank = i + 1
    if (cRank >= rank) cRank += 1
    return { ...c, rank: cRank }
  })

  return {
    found: true,
    rank,
    competitors: adjustedCompetitors.slice(0, 5),
    rawResults: adjustedCompetitors,
    error: null
  }
}

// Fetch real competitors once for a mock scan to provide a "real time" feel
async function discoverMockCompetitors(project, keyword, searchRadiusMeters) {
  let results = []
  const radius = Math.max(5000, searchRadiusMeters)

  const attempts = [
    () => searchKeywordAtPoint(keyword.keyword, project.latitude, project.longitude, radius),
    () => searchBusinessByText(`${keyword.keyword} near ${project.address || project.businessName}`),
    () => project.primaryType
      ? getNearbyCompetitors(project.latitude, project.longitude, project.primaryType, project.placeId)
      : [],
    () => searchBusinessByText(project.businessName)
  ]

  for (const attempt of attempts) {
    if (results && results.length > 0) break
    try {
      results = await attempt()
    } catch (err) {
      console.error(`[Mock Scan] Competitor discovery attempt failed: ${err.message}`)
    }
  }

  return (results || [])
    .filter(r => r.placeId !== project.placeId)
    .slice(0, 10)
    .map(r => ({
      placeId: r.placeId || `mock-${Math.random().toString(36).substr(2, 9)}`,
      name: r.name || 'Unknown Competitor',
      address: r.address || '',
      rating: r.rating || (3.5 + Math.random() * 1.5).toFixed(1),
      reviewCount: r.reviewCount || Math.floor(Math.random() * 100) + 10
    }))
}

async function invalidateUserStats(userId) {
  if (!redis || !userId) return
  try {
    await redis.del(`user:stats:${userId}`, `user:projects:${userId}`)
  } catch (e) {
    console.warn('Redis Stats Invalidation Error:', e.message)
  }
}

export function isScanJobActive(scanJobId) {
  return ACTIVE_JOBS.has(scanJobId)
}

/**
 * Runs (or resumes) a scan job. Safe to call more than once for the same job:
 * a job already running in this process is never started twice.
 */
export async function runScanJob(scanJobId, options = {}) {
  if (ACTIVE_JOBS.has(scanJobId)) {
    return { success: false, error: 'Scan is already running' }
  }
  ACTIVE_JOBS.add(scanJobId)
  try {
    return await executeScanJob(scanJobId, options)
  } finally {
    ACTIVE_JOBS.delete(scanJobId)
  }
}

async function executeScanJob(scanJobId, options = {}) {
  const { skipCache = false, resume = false } = options
  let heartbeatTimer = null

  try {
    const scanJob = await prisma.scanJob.findUnique({ where: { id: scanJobId } })
    if (!scanJob) {
      throw new Error('Scan job not found')
    }
    if (TERMINAL_STATUSES.includes(scanJob.status)) {
      return { success: false, error: `Scan already ${scanJob.status}` }
    }

    const [project, keyword] = await Promise.all([
      prisma.project.findUnique({ where: { id: scanJob.projectId } }),
      prisma.keyword.findUnique({ where: { id: scanJob.keywordId } })
    ])

    if (!project || !keyword) {
      throw new Error('Project or keyword not found')
    }

    await prisma.scanJob.update({
      where: { id: scanJobId },
      data: {
        status: 'processing',
        startedAt: scanJob.startedAt || new Date(),
        heartbeatAt: new Date()
      }
    })
    await invalidateUserStats(project.userId)

    const gridSettings = parseGridSettings(project)
    const isMock = gridSettings.isMock === true
    const searchRadiusMeters = scanJob.searchRadiusMeters || (gridSettings.radius || 5) * 1000

    // Fail fast if today's Google budget is already used up (does not consume quota)
    if (!isMock) {
      try {
        await checkQuota({ consume: false })
      } catch (quotaError) {
        if (quotaError.message === 'DAILY_QUOTA_REACHED') throw quotaError
      }
    }

    const realCompetitors = isMock
      ? await discoverMockCompetitors(project, keyword, searchRadiusMeters)
      : []

    // Generate grid points using the same logic as the UI (respecting miles/km)
    const rawRadius = gridSettings.radius || 5
    const unit = gridSettings.unit || 'km'
    const radiusInKm = unit === 'mi' ? rawRadius * 1.60934 : rawRadius

    const gridPoints = generateHeatmapGrid(
      { lat: project.latitude, lng: project.longitude },
      gridSettings.shape || 'circle',
      gridSettings.density || 25,
      radiusInKm
    )

    // When resuming an interrupted job, skip the points that were already saved
    let pending = gridPoints
    if (resume) {
      const existing = await prisma.scanResult.findMany({
        where: { scanJobId },
        select: { latitude: true, longitude: true }
      })
      const done = new Set(existing.map(r => pointKey(r.latitude, r.longitude)))
      pending = gridPoints.filter(p => !done.has(pointKey(p.latitude, p.longitude)))
      console.log(`[Scan Engine] Resuming job ${scanJobId}: ${gridPoints.length - pending.length}/${gridPoints.length} points already saved`)
    }

    let persisted = gridPoints.length - pending.length

    await prisma.scanJob.update({
      where: { id: scanJobId },
      data: { totalPoints: gridPoints.length, processedPoints: persisted }
    })

    // ── Concurrent point processing with batched writes ──────────────────────
    const state = { cancelled: false, fatal: null }
    const buffer = []
    let lastFlushAt = Date.now()
    let flushChain = Promise.resolve()

    // Writes buffered results + progress + heartbeat. Serialized through flushChain.
    const flush = () => {
      lastFlushAt = Date.now()
      flushChain = flushChain.then(async () => {
        const docs = buffer.splice(0, buffer.length)
        if (docs.length > 0) {
          await prisma.scanResult.createMany({ data: docs })
          persisted += docs.length
        }
        const job = await prisma.scanJob.update({
          where: { id: scanJobId },
          data: { processedPoints: persisted, heartbeatAt: new Date() },
          select: { status: true }
        })
        if (job.status === 'cancelled') state.cancelled = true
      }).catch(err => {
        if (!state.fatal) state.fatal = err
      })
      return flushChain
    }

    heartbeatTimer = setInterval(() => { flush() }, HEARTBEAT_INTERVAL_MS)
    heartbeatTimer.unref?.()

    let cursor = 0
    const worker = async () => {
      while (!state.cancelled && !state.fatal) {
        const index = cursor++
        if (index >= pending.length) return
        const point = pending[index]

        let result
        try {
          result = isMock
            ? generateMockResult(point, project, gridSettings.greenPinPercentage || 50, realCompetitors)
            : await processScanPoint(
                point,
                keyword.keyword,
                project.placeId,
                project.businessName,
                searchRadiusMeters,
                skipCache
              )
        } catch (pointError) {
          if (pointError.message === 'DAILY_QUOTA_REACHED') {
            if (!state.fatal) state.fatal = pointError
            return
          }
          result = { found: false, rank: null, competitors: [], rawResults: [], error: pointError.message }
        }

        buffer.push({
          id: uuidv4(),
          scanJobId,
          scanPointId: null, // Legacy field
          rowIndex: point.row,
          colIndex: point.col,
          latitude: point.latitude,
          longitude: point.longitude,
          found: result.found,
          rank: result.rank,
          competitorsJson: JSON.stringify(result.competitors || []),
          rawResultsJson: JSON.stringify(result.rawResults || []),
          errorMessage: result.error,
          createdAt: new Date()
        })

        if (buffer.length >= FLUSH_EVERY_POINTS || Date.now() - lastFlushAt >= FLUSH_INTERVAL_MS) {
          flush()
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(POINT_CONCURRENCY, pending.length || 1) }, worker))
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
    await flush()

    if (state.fatal) throw state.fatal
    if (state.cancelled) {
      await invalidateUserStats(project.userId)
      return { success: false, error: 'Cancelled' }
    }

    // Only flip to completed if nobody cancelled it in the meantime
    await prisma.scanJob.updateMany({
      where: { id: scanJobId, status: { in: ACTIVE_STATUSES } },
      data: { status: 'completed', completedAt: new Date(), processedPoints: persisted }
    })

    // If this is a mock/random scan, delete any existing audit report
    // so the user sees the new mock results immediately in the "Full Report"
    if (isMock) {
      await prisma.businessAudit.deleteMany({ where: { projectId: project.id } })
    }

    if (redis) {
      try {
        await redis.del(`scan:results:${scanJobId}`, `scan:results:${scanJobId}:aggregate`)
      } catch (e) {
        console.warn('Redis Invalidation Error:', e.message)
      }
    }
    await invalidateUserStats(project.userId)

    return { success: true, resultsCount: persisted }
  } catch (error) {
    if (heartbeatTimer) clearInterval(heartbeatTimer)
    console.error(`Scan job ${scanJobId} failed:`, error.message)

    const isQuotaError = error.message === 'DAILY_QUOTA_REACHED'
    const finalErrorMessage = isQuotaError
      ? 'Daily Google API safety limit reached. Scan paused to prevent unexpected charges. Please increase or reset the daily limit in Settings.'
      : error.message

    try {
      await prisma.scanJob.updateMany({
        where: { id: scanJobId, status: { in: ACTIVE_STATUSES } },
        data: {
          status: 'failed',
          errorMessage: finalErrorMessage,
          completedAt: new Date()
        }
      })
    } catch (updateError) {
      console.error('Failed to mark scan job as failed:', updateError.message)
    }

    return { success: false, error: finalErrorMessage }
  }
}

// ─── STUCK-JOB RECOVERY ──────────────────────────────────────────────────────
// Scans run inside the web server process. If that process restarts (deploy,
// crash, OOM) mid-scan, the job used to stay "processing" forever and the UI
// sat at 99%. These helpers find such orphaned jobs and resume or close them.

async function claimRecovery(scanJobId) {
  if (!redis) return true
  try {
    const ok = await redis.set(`scan:recover:${scanJobId}`, '1', 'EX', 60, 'NX')
    return ok === 'OK'
  } catch {
    return true // runScanJob still refuses to double-start inside this process
  }
}

export async function recoverStaleScanJobs({ projectId } = {}) {
  const where = { status: { in: ACTIVE_STATUSES } }
  if (projectId) where.projectId = projectId

  const jobs = await prisma.scanJob.findMany({
    where,
    select: {
      id: true,
      projectId: true,
      processedPoints: true,
      totalPoints: true,
      createdAt: true,
      startedAt: true,
      heartbeatAt: true
    },
    take: 200
  })

  const now = Date.now()
  const summary = { resumed: 0, completed: 0, failed: 0 }

  for (const job of jobs) {
    if (ACTIVE_JOBS.has(job.id)) continue
    const lastBeat = new Date(job.heartbeatAt || job.startedAt || job.createdAt).getTime()
    if (now - lastBeat < STALE_MS) continue
    if (!(await claimRecovery(job.id))) continue
    if (ACTIVE_JOBS.has(job.id)) continue

    try {
      if (job.totalPoints > 0 && job.processedPoints >= job.totalPoints) {
        await prisma.scanJob.updateMany({
          where: { id: job.id, status: { in: ACTIVE_STATUSES } },
          data: { status: 'completed', completedAt: new Date() }
        })
        summary.completed++
      } else if (now - new Date(job.createdAt).getTime() < RESUME_WINDOW_MS) {
        console.warn(`[Scan Engine] Resuming orphaned scan job ${job.id} (${job.processedPoints}/${job.totalPoints})`)
        runScanJob(job.id, { resume: true }).catch(err => console.error('Resume scan error:', err))
        summary.resumed++
      } else {
        await prisma.scanJob.updateMany({
          where: { id: job.id, status: { in: ACTIVE_STATUSES } },
          data: {
            status: 'failed',
            errorMessage: 'Scan was interrupted before it finished. Please run it again.',
            completedAt: new Date()
          }
        })
        summary.failed++
      }
    } catch (err) {
      console.error(`[Scan Engine] Recovery failed for job ${job.id}:`, err.message)
    }
  }

  return summary
}

/** Throttled per-project recovery for request handlers that poll scan status. */
export async function maybeRecoverProjectScans(projectId) {
  if (!projectId) return
  const last = projectRecoveryRuns.get(projectId) || 0
  if (Date.now() - last < 20 * 1000) return
  projectRecoveryRuns.set(projectId, Date.now())
  if (projectRecoveryRuns.size > 5000) projectRecoveryRuns.clear()
  try {
    await recoverStaleScanJobs({ projectId })
  } catch (err) {
    console.warn('[Scan Engine] Project recovery check failed:', err.message)
  }
}

/** Starts a background sweep (once per process) that recovers orphaned scans. */
export function startScanJobSweeper() {
  if (globalThis.__rsScanSweeperStarted) return
  globalThis.__rsScanSweeperStarted = true

  const sweep = async () => {
    try {
      const { resumed, completed, failed } = await recoverStaleScanJobs()
      if (resumed || completed || failed) {
        console.log(`[Scan Engine] Sweeper: resumed ${resumed}, completed ${completed}, failed ${failed}`)
      }
    } catch (err) {
      console.warn('[Scan Engine] Sweeper error:', err.message)
    }
  }

  const first = setTimeout(sweep, 20 * 1000)
  first.unref?.()
  const timer = setInterval(sweep, 60 * 1000)
  timer.unref?.()
}
