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
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const { searchParams } = req.nextUrl
    let forceRefresh = searchParams.get('refresh') === 'true'

    // 2. Check Redis Cache First (Only after ownership is verified)
    const cacheKey = `audit:project:${projectId}`
    if (!forceRefresh && redis) {
      try {
        const cached = await redis.get(cacheKey)
        if (cached) {
          const cachedData = JSON.parse(cached)
          // Defensive check: if cache has all required fields, serve it
          const hasRequiredFields = cachedData.businessInfo?.reviews && 
                                   cachedData.businessInfo?.status && 
                                   cachedData.competitors
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
      const recentAudit = await prisma.businessAudit.findUnique({
        where: { id: projectId }
      })

      if (recentAudit) {
        const auditData = JSON.parse(recentAudit.auditDataJson)
        const isFresh = new Date(recentAudit.updatedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        
        const hasRequiredFields = auditData.businessInfo?.reviews && 
                                 auditData.businessInfo?.status && 
                                 auditData.competitors
        
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
    const auditReport = await generateAndStoreAuditReport(projectId)

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
