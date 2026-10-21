import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req, props) {
  const params = await props.params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId } = params

    // 1. Verify project ownership (supports admins, staff, and clientSlug)
    const isAdminOrStaff = ['admin', 'superadmin', 'staff'].includes(session.user?.role)
    const project = await prisma.project.findFirst({
      where: isAdminOrStaff
        ? { OR: [{ id: projectId }, { clientSlug: projectId }] }
        : { OR: [{ id: projectId }, { clientSlug: projectId }], userId: session.user.id }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // 2. Get all completed scan jobs for this project
    const scanJobs = await prisma.scanJob.findMany({
      where: { projectId: project.id, status: 'completed' }
    })

    if (scanJobs.length === 0) {
      // Fallback to BusinessAudit competitors if available
      const audit = await prisma.businessAudit.findFirst({
        where: { OR: [{ id: project.id }, { projectId: project.id }] },
        orderBy: { updatedAt: 'desc' }
      })
      if (audit?.auditDataJson) {
        try {
          const auditData = JSON.parse(audit.auditDataJson)
          if (Array.isArray(auditData.competitors) && auditData.competitors.length > 0) {
            const competitors = auditData.competitors.map((c, idx) => ({
              placeId: c.placeId || `comp-${idx}`,
              name: c.name,
              address: c.address,
              rating: c.rating,
              userRatingsTotal: c.reviewCount || c.userRatingsTotal || 0,
              appearances: 1,
              avgRank: c.rank || (idx + 1),
              visibility: Math.max(20, 90 - (idx * 15)),
              topRank: idx + 1
            }))
            return NextResponse.json({ competitors, totalPointsScanned: 49 })
          }
        } catch {}
      }
      return NextResponse.json({ competitors: [] })
    }

    const scanJobIds = scanJobs.map(s => s.id)

    // 3. Get all scan results for these jobs
    const scanResults = await prisma.scanResult.findMany({
      where: { scanJobId: { in: scanJobIds } },
      select: { competitorsJson: true, rank: true, found: true }
    })

    // 4. Aggregate competitors
    const competitorMap = new Map()
    const totalPointsScanned = scanResults.length

    scanResults.forEach(result => {
      if (!result.competitorsJson) return

      try {
        const competitors = JSON.parse(result.competitorsJson)
        competitors.forEach(comp => {
          if (!comp.placeId) return

          if (!competitorMap.has(comp.placeId)) {
            competitorMap.set(comp.placeId, {
              placeId: comp.placeId,
              name: comp.name || comp.businessName,
              address: comp.address || comp.vicinity,
              rating: comp.rating,
              userRatingsTotal: comp.userRatingsTotal,
              appearances: 0,
              totalRank: 0,
              ranks: []
            })
          }

          const entry = competitorMap.get(comp.placeId)
          entry.appearances++
          if (comp.rank) {
            entry.totalRank += comp.rank
            entry.ranks.push(comp.rank)
          }
        })
      } catch (e) {
        console.error('Error parsing competitorsJson:', e)
      }
    })

    // 5. Calculate final metrics and sort
    const competitors = Array.from(competitorMap.values()).map(comp => {
      const avgRank = comp.ranks.length > 0
        ? (comp.totalRank / comp.ranks.length).toFixed(1)
        : null

      const visibility = ((comp.appearances / totalPointsScanned) * 100).toFixed(1)

      return {
        placeId: comp.placeId,
        name: comp.name,
        address: comp.address,
        rating: comp.rating,
        userRatingsTotal: comp.userRatingsTotal,
        appearances: comp.appearances,
        avgRank: avgRank ? parseFloat(avgRank) : null,
        visibility: parseFloat(visibility),
        topRank: comp.ranks.length > 0 ? Math.min(...comp.ranks) : null
      }
    })
      .sort((a, b) => b.appearances - a.appearances)
      .slice(0, 50)

    return NextResponse.json({ competitors, totalPointsScanned })
  } catch (error) {
    console.error('API /projects/competitors error:', error)
    return NextResponse.json({ error: 'Failed to fetch competitors' }, { status: 500 })
  }
}
