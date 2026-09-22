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
                                   cachedData.competitors
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
