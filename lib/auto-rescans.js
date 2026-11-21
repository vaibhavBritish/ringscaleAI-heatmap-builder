import { v4 as uuidv4 } from 'uuid'
import prisma from './prisma'
import redis from './redis'
import { runScanJob } from './scan-engine'

// Every tracked keyword is re-scanned automatically this often, so the Keywords page
// can show a fresh "after" grid against the baseline. Change this one value to move it.
export const AUTO_RESCAN_INTERVAL_DAYS = 15

const DAY_MS = 24 * 60 * 60 * 1000
// The job runs once a day; a half-day grace keeps each keyword on a steady 15-day rhythm.
const RESCAN_DUE_AFTER_MS = (AUTO_RESCAN_INTERVAL_DAYS - 0.5) * DAY_MS
// Max automatic scans per run. Each scan uses one Google request per grid point, so this
// protects the daily Google budget. Keywords over the cap stay due and run tomorrow.
const DAILY_RESCAN_LIMIT = parseInt(process.env.AUTO_RESCAN_DAILY_LIMIT || '100', 10)
// Automatic scans always use a 5x5 grid (25 Google requests), whatever grid the project
// uses for manual scans, so they never cost more API calls than this per keyword.
export const AUTO_RESCAN_GRID_SIZE = 5
const AUTO_RESCAN_POINTS = AUTO_RESCAN_GRID_SIZE * AUTO_RESCAN_GRID_SIZE

/** Kill switch: set AUTO_RESCANS_ENABLED=false to stop all automatic re-scans. */
export function isAutoRescanEnabled() {
  return process.env.AUTO_RESCANS_ENABLED !== 'false'
}

/** When a keyword's next automatic scan is due, given its latest scan date. */
export function getNextAutoScanAt(lastScanAt) {
  if (!lastScanAt) return null
  return new Date(new Date(lastScanAt).getTime() + AUTO_RESCAN_INTERVAL_DAYS * DAY_MS).toISOString()
}

function isPlanActive(user) {
  if (!user) return false
  if (['admin', 'superadmin'].includes(user.role)) return true
  const expiry = user.planEndsAt || user.trialEndsAt
  if (expiry && new Date(expiry) < new Date()) return false
  return (user.credits || 0) > 0
}

function radiusMetersFor(project) {
  let gs = project.gridSettings
  if (typeof gs === 'string') {
    try { gs = JSON.parse(gs) } catch { gs = {} }
  }
  gs = gs || {}
  const raw = gs.radius || 5
  return {
    searchRadiusMeters: gs.unit === 'mi' ? Math.round(raw * 1609.34) : Math.round(raw * 1000)
  }
}

/**
 * Starts a new scan for every keyword whose latest scan is 15+ days old.
 * Only keywords that already have at least one scan (the baseline) are re-scanned,
 * and only for owners whose plan is active. Scans run one at a time so a large batch
 * never floods the Google API. Safe to run repeatedly.
 */
export async function runAutoRescans({ projectId = null, force = false } = {}) {
  const results = {
    startedAt: new Date().toISOString(),
    enabled: isAutoRescanEnabled(),
    keywordsEvaluated: 0,
    scansStarted: 0,
    scansCompleted: 0,
    deferredByDailyLimit: 0,
    errors: [],
    details: []
  }
  if (!results.enabled && !force) return { ...results, skipped: 'AUTO_RESCANS_ENABLED=false' }

  const lockKey = 'cron:auto-rescans:running'
  let locked = false
  if (!projectId && redis) {
    try {
      const ok = await redis.set(lockKey, String(Date.now()), 'EX', 6 * 60 * 60, 'NX')
      if (ok !== 'OK') return { ...results, skipped: 'An auto re-scan run is already in progress' }
      locked = true
    } catch {}
  }

  try {
    const projects = await prisma.project.findMany({
      where: projectId ? { OR: [{ id: projectId }, { clientSlug: projectId }] } : {},
      select: { id: true, userId: true, businessName: true, placeId: true, gridSettings: true }
    })
    if (projects.length === 0) return results
    const projectById = new Map(projects.map(p => [p.id, p]))
    const projectIds = projects.map(p => p.id)

    const userIds = [...new Set(projects.map(p => p.userId).filter(Boolean))]
    const users = new Map((await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, role: true, credits: true, planEndsAt: true, trialEndsAt: true }
    })).map(u => [u.id, u]))

    const [keywords, jobs] = await Promise.all([
      prisma.keyword.findMany({
        where: { projectId: { in: projectIds } },
        select: { id: true, projectId: true, keyword: true }
      }),
      prisma.scanJob.findMany({
        where: { projectId: { in: projectIds }, status: { in: ['completed', 'queued', 'processing'] } },
        select: { keywordId: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' }
      })
    ])

    // Latest scan per keyword (jobs are newest first)
    const latestByKeyword = new Map()
    for (const j of jobs) {
      if (!latestByKeyword.has(j.keywordId)) latestByKeyword.set(j.keywordId, j)
    }

    const due = []
    for (const kw of keywords) {
      results.keywordsEvaluated++
      const latest = latestByKeyword.get(kw.id)
      if (!latest) continue // no baseline yet: the customer runs the first scan
      if (latest.status !== 'completed') continue // a scan is already running
      const project = projectById.get(kw.projectId)
      if (!isPlanActive(users.get(project?.userId))) continue
      if (!force && Date.now() - new Date(latest.createdAt).getTime() < RESCAN_DUE_AFTER_MS) continue
      due.push({ kw, project, lastScanAt: latest.createdAt })
    }

    // Oldest scans first, so nothing starves when the daily cap is hit
    due.sort((a, b) => new Date(a.lastScanAt) - new Date(b.lastScanAt))

    // Duplicate project records of the same place share keywords: scan each keyword once
    const seen = new Set()
    const unique = due.filter(({ kw, project }) => {
      const place = project.placeId && project.placeId !== 'external_sync' && !project.placeId.startsWith('gmb_')
        ? project.placeId
        : project.id
      const key = `${project.userId}|${place}|${(kw.keyword || '').trim().toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    for (const { kw, project } of unique) {
      if (!projectId && DAILY_RESCAN_LIMIT > 0 && results.scansStarted >= DAILY_RESCAN_LIMIT) {
        results.deferredByDailyLimit++
        continue
      }
      try {
        const { searchRadiusMeters } = radiusMetersFor(project)
        const scanJobId = uuidv4()
        await prisma.scanJob.create({
          data: {
            id: scanJobId,
            projectId: project.id,
            keywordId: kw.id,
            status: 'queued',
            processedPoints: 0,
            totalPoints: AUTO_RESCAN_POINTS,
            gridSize: AUTO_RESCAN_GRID_SIZE,
            maxPoints: AUTO_RESCAN_POINTS,
            searchRadiusMeters,
            createdAt: new Date()
          }
        })
        results.scansStarted++

        const outcome = await runScanJob(scanJobId, { skipCache: true })
        if (outcome?.success) results.scansCompleted++
        else results.errors.push({ keywordId: kw.id, error: outcome?.error || 'Scan failed' })
        results.details.push({ projectId: project.id, keyword: kw.keyword, scanJobId, success: !!outcome?.success })

        // Google's daily budget is shared: stop the batch once it's used up
        if (outcome?.error && /Daily Google API safety limit/i.test(outcome.error)) {
          results.stoppedEarly = 'Daily Google API limit reached'
          break
        }
      } catch (err) {
        console.error(`[Auto Rescans] Keyword ${kw.id} failed:`, err)
        results.errors.push({ keywordId: kw.id, error: err.message })
      }
    }

    results.completedAt = new Date().toISOString()
    return results
  } finally {
    if (locked) {
      try { await redis.del(lockKey) } catch {}
    }
  }
}

/**
 * Runs the auto re-scan job once a day inside the app (production only, so a local dev
 * server pointed at the live database never spends Google quota). Settings:
 *   AUTO_RESCAN_HOUR_UTC   hour of day (UTC) to run, default 20 (1:30am IST)
 *   AUTO_RESCAN_SCHEDULER  set to "false" to disable this scheduler
 */
export function startAutoRescanScheduler() {
  if (globalThis.__rsAutoRescanSchedulerStarted) return
  globalThis.__rsAutoRescanSchedulerStarted = true

  if (process.env.NODE_ENV !== 'production' || process.env.AUTO_RESCAN_SCHEDULER === 'false') {
    console.log('[Auto Rescans] Daily scheduler disabled (not production or AUTO_RESCAN_SCHEDULER=false)')
    return
  }

  const runHour = Math.min(23, Math.max(0, parseInt(process.env.AUTO_RESCAN_HOUR_UTC ?? '20', 10) || 0))

  const tick = async () => {
    const now = new Date()
    if (now.getUTCHours() < runHour) return
    const day = now.toISOString().slice(0, 10)
    if (globalThis.__rsAutoRescanLastRunDay === day) return

    if (redis) {
      try {
        const ok = await redis.set(`cron:auto-rescans:day:${day}`, '1', 'EX', 36 * 60 * 60, 'NX')
        if (ok !== 'OK') {
          globalThis.__rsAutoRescanLastRunDay = day
          return
        }
      } catch {}
    }
    globalThis.__rsAutoRescanLastRunDay = day

    try {
      const r = await runAutoRescans()
      console.log(`[Auto Rescans] Daily run: ${r.keywordsEvaluated} keywords checked, ${r.scansStarted} scans started, ${r.scansCompleted} completed${r.deferredByDailyLimit ? `, ${r.deferredByDailyLimit} moved to tomorrow` : ''}, ${r.errors.length} errors${r.skipped ? ` (${r.skipped})` : ''}`)
    } catch (err) {
      console.error('[Auto Rescans] Daily run failed:', err)
    }
  }

  const first = setTimeout(tick, 2 * 60 * 1000)
  first.unref?.()
  const timer = setInterval(tick, 10 * 60 * 1000)
  timer.unref?.()
}
