import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import redis from '@/lib/redis'

export async function GET(req, props) {
  const params = await props.params
  try {
    const { id: projectId } = params

    // Check Redis Cache First
    const cacheKey = `audit:project:${projectId}`
    if (redis) {
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

    if (recentAudit) {
      const auditData = JSON.parse(recentAudit.auditDataJson)
      
      if (redis) {
        try { 
          await redis.set(cacheKey, JSON.stringify(auditData), 'EX', 3600) 
        } catch (e) {}
      }
      
      return NextResponse.json(auditData)
    }

    return NextResponse.json({ error: 'Audit not found or not yet generated' }, { status: 404 })

  } catch (error) {
    console.error('API /public/audit error:', error)
    return NextResponse.json({ error: 'Failed to fetch audit report' }, { status: 500 })
  }
}
