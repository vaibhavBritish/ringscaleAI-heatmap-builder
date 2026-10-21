import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import redis from '@/lib/redis'
import { getPlaceDetails, getNearbyCompetitors } from '@/lib/google-places'
import { v4 as uuidv4 } from 'uuid'

export async function GET(req, props) {
  const params = await props.params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId } = params

    // 1. Get project info and verify ownership immediately
    const isAdminOrStaff = ['admin', 'superadmin', 'staff'].includes(session.user?.role)
    const project = await prisma.project.findFirst({
      where: isAdminOrStaff
        ? { OR: [{ id: projectId }, { clientSlug: projectId }] }
        : { OR: [{ id: projectId }, { clientSlug: projectId }], userId: session.user.id }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const { searchParams } = req.nextUrl
    let forceRefresh = searchParams.get('refresh') === 'true'

    // 2. Check Redis Cache First (Only after ownership is verified)
    const cacheKey = `audit:project:${project.id}`
    if (!forceRefresh && redis) {
      try {
        const cached = await redis.get(cacheKey)
        if (cached) {
          const cachedData = JSON.parse(cached)
          // Defensive check: if cache has all required fields and valid non-zero visibility metrics, serve it
          const hasRequiredFields = cachedData.businessInfo?.reviews && 
                                   cachedData.businessInfo?.status && 
                                   cachedData.competitors &&
                                   Number(cachedData.metrics?.visibilityScore) > 0 &&
                                   Number(cachedData.metrics?.top3Coverage) > 0 &&
                                   Number(cachedData.metrics?.averageRank) > 0
          if (hasRequiredFields) {
            return NextResponse.json(cachedData)
          }
        }
      } catch (e) {
        console.warn('[Audit] [Redis Error] Get failed:', e.message)
      }
    }

    // 3. Check Database for recent audit (Freshness: 24 hours)
    if (!forceRefresh) {
      const recentAudit = await prisma.businessAudit.findFirst({
        where: {
          OR: [
            { id: project.id },
            { projectId: project.id }
          ]
        },
        orderBy: { updatedAt: 'desc' }
      })

      if (recentAudit) {
        const auditData = JSON.parse(recentAudit.auditDataJson)
        const isFresh = new Date(recentAudit.updatedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        
        const hasRequiredFields = auditData.businessInfo?.reviews && 
                                 auditData.businessInfo?.status && 
                                 auditData.competitors

        // If visibility metrics are 0, dynamically repair them with baseline data
        const hasZeroVisibility = !auditData.metrics?.visibilityScore || 
                                  auditData.metrics?.visibilityScore === 0 || 
                                  !auditData.metrics?.top3Coverage || 
                                  auditData.metrics?.top3Coverage === 0 ||
                                  !auditData.metrics?.averageRank ||
                                  auditData.metrics?.averageRank === 0

        if (hasZeroVisibility) {
          try {
            const { calculateBaselineVisibility } = await import('@/lib/audit-generator')
            const baseline = calculateBaselineVisibility(auditData.businessInfo, auditData.competitors, project)
            
            auditData.metrics = {
              ...auditData.metrics,
              ...baseline.visibilityMetrics
            }

            if (!auditData.scanResults || auditData.scanResults.length === 0) {
              auditData.scanResults = baseline.scanResults
            }

            // Recalculate optimization score
            const ratingScore = Math.min(((auditData.businessInfo?.rating || 0) / 5) * 25, 25)
            const reviewScore = Math.min(((auditData.businessInfo?.reviewCount || 0) / 100) * 20, 20)
            const photoScore = Math.min(((auditData.businessInfo?.photoCount || 0) / 20) * 15, 15)
            const coverageScore = ((baseline.visibilityMetrics.top3Coverage || 0) / 100) * 40
            auditData.metrics.optimizationScore = Math.round(ratingScore + reviewScore + photoScore + coverageScore)

            // Update auditResults cards
            if (Array.isArray(auditData.auditResults)) {
              auditData.auditResults = auditData.auditResults.map(r => {
                if (r.title === 'Local Visibility') {
                  return {
                    ...r,
                    value: `${baseline.visibilityMetrics.top3Coverage}%`,
                    status: baseline.visibilityMetrics.top3Coverage >= 50 ? 'Pass' : 'Warning',
                    description: baseline.visibilityMetrics.top3Coverage >= 50 
                      ? 'Good visibility across your service area.' 
                      : 'You have moderate visibility in key areas.'
                  }
                }
                return r
              })
            }

            // Persist the repaired audit in DB
            await prisma.businessAudit.update({
              where: { id: recentAudit.id },
              data: {
                auditDataJson: JSON.stringify(auditData),
                optimizationScore: auditData.metrics.optimizationScore,
                updatedAt: new Date()
              }
            }).catch(() => {})
          } catch (repairErr) {
            console.error('[Audit API] Repair visibility error:', repairErr)
          }
        }
        
        if (isFresh && hasRequiredFields) {
          // Populate Redis cache for next time
          if (redis) {
            try { 
              await redis.set(cacheKey, JSON.stringify(auditData), 'EX', 3600) 
            } catch (e) {}
          }
          
          return NextResponse.json(auditData)
        }
      }
    }

    // 4. Fetch fresh details and generate audit
    const { generateAndStoreAuditReport } = await import('@/lib/audit-generator')
    const auditReport = await generateAndStoreAuditReport(project.id)

    // 5. Cache in Redis (TTL: 1 hour)
    if (redis) {
      try { await redis.set(cacheKey, JSON.stringify(auditReport), 'EX', 3600) } catch (e) {}
    }

    return NextResponse.json(auditReport)


  } catch (error) {
    console.error('API /audit error:', error)
    return NextResponse.json({ error: 'Failed to generate audit report' }, { status: 500 })
  }
}
