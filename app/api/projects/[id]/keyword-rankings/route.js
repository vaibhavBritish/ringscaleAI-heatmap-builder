import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { calculateAnalytics } from '@/lib/grid-utils'
import { AUTO_RESCAN_INTERVAL_DAYS, getNextAutoScanAt, isAutoRescanEnabled } from '@/lib/auto-rescans'

export const dynamic = 'force-dynamic'

const PROJECT_SELECT = {
  id: true, userId: true, businessName: true, address: true, placeId: true,
  heroImage: true, gmbLink: true, clientSlug: true, createdAt: true
}

// Placeholder place IDs are shared by unrelated businesses, so never group on them
function isRealPlaceId(placeId) {
  return !!placeId && placeId !== 'external_sync' && !placeId.startsWith('gmb_')
}

/**
 * Keyword ranking history for one business: every keyword with all of its scans
 * (newest first) and summary analytics per completed scan. The Keywords dashboard page
 * picks the "start" and "latest" scans for the selected period from this.
 */
export async function GET(req, props) {
  const { id: projectId } = await props.params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdminOrStaff = ['admin', 'superadmin', 'staff'].includes(session.user.role)
    const project = await prisma.project.findFirst({
      where: isAdminOrStaff
        ? { OR: [{ id: projectId }, { clientSlug: projectId }] }
        : { OR: [{ id: projectId }, { clientSlug: projectId }], userId: session.user.id },
      select: PROJECT_SELECT
    })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // The same Google business can exist as several project records for one owner
    // (older duplicates). Treat them as one business and merge their keywords and scans.
    const siblings = isRealPlaceId(project.placeId)
      ? await prisma.project.findMany({
          where: { userId: project.userId, placeId: project.placeId },
          select: PROJECT_SELECT
        })
      : [project]
    const siblingIds = siblings.map(p => p.id)

    const [keywords, jobs] = await Promise.all([
      prisma.keyword.findMany({
        where: { projectId: { in: siblingIds } },
        select: { id: true, projectId: true, keyword: true, createdAt: true },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.scanJob.findMany({
        where: { projectId: { in: siblingIds } },
        select: {
          id: true, projectId: true, keywordId: true, status: true, createdAt: true, completedAt: true,
          processedPoints: true, totalPoints: true, errorMessage: true
        },
        orderBy: { createdAt: 'desc' }
      })
    ])

    // Main record: the copy with the most scans (oldest on a tie). New keywords and
    // scans go to it; header details fall back to whichever copy has them.
    const scanCount = new Map()
    for (const j of jobs) scanCount.set(j.projectId, (scanCount.get(j.projectId) || 0) + 1)
    const main = [...siblings].sort((a, b) =>
      (scanCount.get(b.id) || 0) - (scanCount.get(a.id) || 0) || new Date(a.createdAt) - new Date(b.createdAt)
    )[0]
    const pick = (field) => main[field] || siblings.find(p => p[field])?.[field] || null
    const mainProject = {
      ...main,
      address: pick('address'),
      heroImage: pick('heroImage'),
      gmbLink: pick('gmbLink'),
      duplicateCount: siblings.length
    }
    delete mainProject.userId

    const completedIds = jobs.filter(j => j.status === 'completed').map(j => j.id)
    const resultRows = completedIds.length
      ? await prisma.scanResult.findMany({
          where: { scanJobId: { in: completedIds } },
          select: { scanJobId: true, found: true, rank: true }
        })
      : []
    const resultsByScan = new Map()
    for (const r of resultRows) {
      if (!resultsByScan.has(r.scanJobId)) resultsByScan.set(r.scanJobId, [])
      resultsByScan.get(r.scanJobId).push(r)
    }

    const jobsByKeyword = new Map()
    for (const j of jobs) {
      if (!jobsByKeyword.has(j.keywordId)) jobsByKeyword.set(j.keywordId, [])
      const a = j.status === 'completed' ? calculateAnalytics(resultsByScan.get(j.id) || []) : null
      jobsByKeyword.get(j.keywordId).push({
        id: j.id,
        status: j.status,
        createdAt: j.createdAt,
        completedAt: j.completedAt,
        processedPoints: j.processedPoints,
        totalPoints: j.totalPoints,
        errorMessage: j.errorMessage,
        analytics: a && {
          averageRank: a.averageRank,
          top3Percentage: a.top3Percentage,
          top10Percentage: a.top10Percentage,
          visibilityScore: a.visibilityScore,
          foundCount: a.foundCount,
          totalPoints: a.totalPoints
        }
      })
    }

    // Merge the same keyword text across copies into one row with a combined history
    const merged = new Map()
    for (const kw of keywords) {
      const key = (kw.keyword || '').trim().toLowerCase()
      if (!key) continue
      const scans = jobsByKeyword.get(kw.id) || []
      const row = merged.get(key)
      if (!row) {
        merged.set(key, { ...kw, scans: [...scans] })
        continue
      }
      row.scans.push(...scans)
      // Keep the keyword record that belongs to the main copy (new scans attach to it)
      if (kw.projectId === main.id && row.projectId !== main.id) {
        row.id = kw.id
        row.projectId = kw.projectId
      }
    }

    const autoEnabled = isAutoRescanEnabled()
    const keywordRows = [...merged.values()].map(kw => {
      const scans = kw.scans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      const lastCompleted = scans.find(s => s.status === 'completed')
      return {
        id: kw.id,
        projectId: kw.projectId,
        keyword: kw.keyword,
        createdAt: kw.createdAt,
        scans,
        latestStatus: scans[0]?.status || null,
        nextAutoScanAt: autoEnabled && lastCompleted ? getNextAutoScanAt(lastCompleted.createdAt) : null
      }
    })

    return NextResponse.json({
      project: mainProject,
      autoRescan: { enabled: autoEnabled, intervalDays: AUTO_RESCAN_INTERVAL_DAYS },
      keywords: keywordRows
    })
  } catch (err) {
    console.error('[keyword-rankings] Error:', err)
    return NextResponse.json({ error: 'Failed to load keyword rankings' }, { status: 500 })
  }
}
