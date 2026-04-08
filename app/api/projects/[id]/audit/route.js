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
    const { searchParams } = req.nextUrl
    let forceRefresh = searchParams.get('refresh') === 'true'

    // 1. Check Redis Cache First (Fastest)
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
            // //console.log(`[Audit] [Cache Hit] Serving from Redis for project ${projectId}`)
            return NextResponse.json(cachedData)
          }
          // //console.log(`[Audit] [Cache Stale] Redis data missing fields, checking DB...`)
        }
      } catch (e) {
        console.warn('[Audit] [Redis Error] Get failed:', e.message)
      }
    }

    // 2. Check Database for recent audit (Freshness: 24 hours)
    if (!forceRefresh) {
      const recentAudit = await prisma.businessAudit.findUnique({
        where: { id: projectId }
      })

      if (recentAudit) {
        const auditData = JSON.parse(recentAudit.auditDataJson)
        const isFresh = new Date(recentAudit.updatedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        
        // Defensive check: if DB record is missing reviews, status or competitors, it's "stale" regardless of date
        const hasRequiredFields = auditData.businessInfo?.reviews && 
                                 auditData.businessInfo?.status && 
                                 auditData.competitors
        
        if (isFresh && hasRequiredFields) {
          // //console.log(`[Audit] [DB Hit] Serving from Database for project ${projectId}`)
          
          // Populate Redis cache for next time
          if (redis) {
            try { 
              await redis.set(cacheKey, JSON.stringify(auditData), 'EX', 3600) 
              // //console.log(`[Audit] [Cache Update] Repopulated Redis for ${projectId}`)
            } catch (e) {}
          }
          
          return NextResponse.json(auditData)
        }
        // //console.log(`[Audit] [DB Stale] Record found but stale or missing fields for ${projectId}`)
      }
    }

    // 3. Get project info
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // 4. Fetch fresh details from Google
    // //console.log(`[Audit] Fetching fresh data from Google for project ${projectId}`)
    let googleData = {}
    try {
      googleData = await getPlaceDetails(project.placeId)
    } catch (err) {
      console.error('Failed to fetch Google place details:', err)
      googleData = {
        name: project.businessName,
        address: project.address,
        rating: 0,
        reviewCount: 0,
        photoCount: 0,
        reviews: [],
        photos: [],
        status: 'OPERATIONAL',
        summary: '',
        website: '',
        phone: ''
      }
    }

    // 4.1 Fetch Competitors
    // //console.log(`[Audit] Fetching competitors for ${googleData.primaryType || 'Business'} near project ${projectId}`)
    let competitors = []
    try {
      competitors = await getNearbyCompetitors(
        googleData.latitude || project.latitude, 
        googleData.longitude || project.longitude, 
        googleData.primaryType || 'Business',
        project.placeId
      )
    } catch (err) {
      console.error('Failed to fetch competitors:', err)
    }

    // 5. Get latest scan results for visibility metrics
    const latestScanJob = await prisma.scanJob.findFirst({
      where: { projectId, status: 'completed' },
      orderBy: { completedAt: 'desc' }
    })

    let visibilityMetrics = {
      visibilityScore: 0,
      averageRank: 0,
      top3Coverage: 0
    }

    if (latestScanJob) {
      const results = await prisma.scanResult.findMany({
        where: { scanJobId: latestScanJob.id }
      })

      if (results.length > 0) {
        const rankedResults = results.filter(r => r.found && r.rank > 0)
        const totalPoints = results.length
        const top3Points = results.filter(r => r.found && r.rank <= 3).length
        
        visibilityMetrics = {
          visibilityScore: Math.round((top3Points / totalPoints) * 100),
          averageRank: rankedResults.length > 0 
            ? parseFloat((rankedResults.reduce((acc, r) => acc + r.rank, 0) / rankedResults.length).toFixed(1)) 
            : 20,
          top3Coverage: Math.round((top3Points / totalPoints) * 100)
        }
      }
    }

    // 6. Calculate Optimization Score
    const ratingScore = Math.min(((googleData.rating || 0) / 5) * 25, 25)
    const reviewScore = Math.min(((googleData.reviewCount || 0) / 100) * 20, 20)
    const photoScore = Math.min(((googleData.photoCount || 0) / 20) * 15, 15)
    const coverageScore = ((visibilityMetrics.top3Coverage || 0) / 100) * 40
    
    const optimizationScore = Math.round(ratingScore + reviewScore + photoScore + coverageScore)

    // 7. Assemble Audit Report
    const auditReport = {
      businessInfo: {
        name: googleData.name || project.businessName,
        address: googleData.address || project.address,
        rating: googleData.rating || 0,
        reviewCount: googleData.reviewCount || 0,
        website: googleData.website || '',
        phone: googleData.phone || '',
        summary: googleData.summary || '',
        photoCount: googleData.photoCount || 0,
        status: googleData.status || 'OPERATIONAL',
        reviews: (googleData.reviews || []).map(r => ({
          author: r.authorAttribution?.displayName || 'Anonymous',
          authorPhoto: r.authorAttribution?.photoUri || null,
          rating: r.rating || 0,
          text: r.text?.text || '',
          relativeTime: r.relativePublishTimeDescription || 'a while ago'
        })),
        photos: (googleData.photos || []).map(p => ({
          name: p.name,
          width: p.widthPx,
          height: p.heightPx
        })),
        googleApiKey: process.env.GOOGLE_API_KEY // For direct loading in frontend if needed
      },
      competitors: (competitors || []).map(c => ({
        name: c.name || 'Unknown Competitor',
        address: c.address || '',
        rating: c.rating || 0,
        reviewCount: c.reviewCount || 0
      })),
      metrics: {
        optimizationScore,
        averageCompetitorRating: competitors.length > 0 
          ? parseFloat((competitors.reduce((acc, c) => acc + (c.rating || 0), 0) / competitors.length).toFixed(1))
          : 0,
        topCompetitor: competitors.length > 0
          ? competitors.reduce((prev, current) => ((prev.rating || 0) > (current.rating || 0)) ? prev : current)
          : null,
        ...visibilityMetrics
      },
      auditResults: [
        {
          title: 'Google Rating',
          value: `${googleData.rating || 0} / 5`,
          status: (googleData.rating || 0) >= 4 ? 'Pass' : 'Warning',
          description: (googleData.rating || 0) >= 4 ? 'Great work! Your rating is strong.' : 'Your rating could be improved to build more trust.'
        },
        {
          title: 'Review Volume',
          value: googleData.reviewCount || 0,
          status: (googleData.reviewCount || 0) >= 50 ? 'Pass' : 'Action Required',
          description: (googleData.reviewCount || 0) >= 50 ? 'You have a healthy number of reviews.' : 'Consider asking more customers for reviews.'
        },
        {
          title: 'Photo Count',
          value: googleData.photoCount || 0,
          status: (googleData.photoCount || 0) >= 10 ? 'Pass' : 'Action Required',
          description: (googleData.photoCount || 0) >= 10 ? 'You have enough photos to engage users.' : 'Adding more photos can improve engagement.'
        },
        {
          title: 'Local Visibility',
          value: `${visibilityMetrics.top3Coverage || 0}%`,
          status: (visibilityMetrics.top3Coverage || 0) >= 50 ? 'Pass' : 'Warning',
          description: (visibilityMetrics.top3Coverage || 0) >= 50 ? 'Good visibility across your service area.' : 'You have low visibility in key areas.'
        }
      ],
      lastUpdated: new Date().toISOString()
    }

    // 8. Store in Database
    await prisma.businessAudit.upsert({
      where: { id: projectId }, // Using projectId as ID for simplicity or generate uuid
      update: {
        auditDataJson: JSON.stringify(auditReport),
        optimizationScore,
        updatedAt: new Date()
      },
      create: {
        id: projectId,
        projectId,
        auditDataJson: JSON.stringify(auditReport),
        optimizationScore,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // 9. Cache in Redis (TTL: 1 hour)
    if (redis) {
      try { await redis.set(cacheKey, JSON.stringify(auditReport), 'EX', 3600) } catch (e) {}
    }

    return NextResponse.json(auditReport)
  } catch (error) {
    console.error('API /audit error:', error)
    return NextResponse.json({ error: 'Failed to generate audit report' }, { status: 500 })
  }
}
