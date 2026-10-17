import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import redis from '@/lib/redis'

export async function GET(req, props) {
  const params = await props.params
  try {
    const { id: projectId } = params
    const { searchParams } = new URL(req.url)
    const forceRefresh = searchParams.get('refresh') === 'true'

    // Check Redis Cache First
    const cacheKey = `audit:project:${projectId}`
    if (redis && !forceRefresh) {
      try {
        const cached = await redis.get(cacheKey)
        if (cached) {
          const cachedData = JSON.parse(cached)
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
        console.warn('[Public Audit] [Redis Error] Get failed:', e.message)
      }
    }

    // Check Database
    const recentAudit = await prisma.businessAudit.findUnique({
      where: { id: projectId }
    })

    if (recentAudit && !forceRefresh) {
      const auditData = JSON.parse(recentAudit.auditDataJson)
      
      // If visibility metrics are 0, dynamically repair them with baseline data
      const hasZeroVisibility = !auditData.metrics?.visibilityScore || 
                                auditData.metrics?.visibilityScore === 0 || 
                                !auditData.metrics?.top3Coverage || 
                                auditData.metrics?.top3Coverage === 0 ||
                                !auditData.metrics?.averageRank ||
                                auditData.metrics?.averageRank === 0

      if (hasZeroVisibility) {
        try {
          const project = await prisma.project.findFirst({
            where: { OR: [{ id: projectId }, { id: recentAudit.projectId || '' }] }
          })
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
          console.error('[Public Audit API] Repair visibility error:', repairErr)
        }
      }

      if (redis) {
        try { 
          await redis.set(cacheKey, JSON.stringify(auditData), 'EX', 3600) 
        } catch (e) {}
      }
      
      return NextResponse.json(auditData)
    }

    // If forceRefresh or not found in DB/Redis, regenerate it
    if (forceRefresh || !recentAudit) {
      try {
        const { generateAndStoreAuditReport } = await import('@/lib/audit-generator')
        const auditReport = await generateAndStoreAuditReport(projectId)
        
        if (redis) {
          try { await redis.set(cacheKey, JSON.stringify(auditReport), 'EX', 3600) } catch (e) {}
        }
        
        return NextResponse.json(auditReport)
      } catch (genError) {
        console.error('Error generating audit in public route:', genError)
        // If regeneration fails but we have a recent audit, return it as fallback
        if (recentAudit) {
          return NextResponse.json(JSON.parse(recentAudit.auditDataJson))
        }
        throw genError
      }
    }

    return NextResponse.json({ error: 'Audit not found or not yet generated' }, { status: 404 })

  } catch (error) {
    console.error('API /public/audit error:', error)
    return NextResponse.json({ error: 'Failed to fetch audit report' }, { status: 500 })
  }
}
