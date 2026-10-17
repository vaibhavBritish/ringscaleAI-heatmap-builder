import prisma from './prisma.js'
import { getPlaceDetails, getNearbyCompetitors, searchBusinessByText } from './google-places.js'
import { fetchGmbKeywordsForProject } from './gmb-connector-db.js'

/**
 * Generates an audit report for a given project, stores it in the database, and returns it.
 *
 * @param {string} projectId - The ID of the project to generate the audit for
 * @returns {Promise<Object>} - The generated audit report object
 */
export async function generateAndStoreAuditReport(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  })

  if (!project) {
    throw new Error('Project not found')
  }

  // 1. Fetch fresh details from Google
  let googleData = null
  let effectivePlaceId = project.placeId

  if (effectivePlaceId && !effectivePlaceId.startsWith('locations/') && !effectivePlaceId.startsWith('gmb_') && !effectivePlaceId.includes('/')) {
    try {
      googleData = await getPlaceDetails(effectivePlaceId)
    } catch (err) {
      console.warn('Failed to fetch Google place details:', err.message)
    }
  }

  // If not found or if placeId was a GMB resource name, resolve via Google Places Search
  if (!googleData) {
    try {
      const queryCandidates = []
      if (project.businessName) {
        if (project.address && !project.address.startsWith('Website:') && !project.address.includes('Phone:')) {
          queryCandidates.push(`${project.businessName} ${project.address}`)
        }
        queryCandidates.push(project.businessName)
      }

      for (const q of queryCandidates) {
        const places = await searchBusinessByText(q)
        if (places && places.length > 0) {
          effectivePlaceId = places[0].placeId
          googleData = await getPlaceDetails(effectivePlaceId)
          if (googleData) {
            // Update project with the resolved real Google Place ID and coordinates
            await prisma.project.update({
              where: { id: project.id },
              data: {
                placeId: effectivePlaceId,
                address: googleData.address || project.address,
                latitude: googleData.latitude || project.latitude,
                longitude: googleData.longitude || project.longitude
              }
            }).catch(() => {})
            break
          }
        }
      }
    } catch (searchErr) {
      console.warn('Failed to resolve Google place via search:', searchErr.message)
    }
  }

  if (!googleData) {
    googleData = {
      name: project.businessName,
      address: project.address,
      latitude: project.latitude || 0,
      longitude: project.longitude || 0,
      primaryType: project.primaryType || 'Business',
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

  // 2. Fetch Competitors
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

  // 3. Get latest scan results for visibility metrics
  const latestScanJob = await prisma.scanJob.findFirst({
    where: { projectId, status: 'completed' },
    orderBy: { completedAt: 'desc' }
  })

  let visibilityMetrics = {
    visibilityScore: 0,
    averageRank: 0,
    top3Coverage: 0
  }
  let latestScanResults = []

  if (latestScanJob) {
    const results = await prisma.scanResult.findMany({
      where: { scanJobId: latestScanJob.id }
    })

    if (results.length > 0) {
      latestScanResults = results.map(r => ({
        latitude: r.latitude,
        longitude: r.longitude,
        rank: r.rank,
        found: r.found
      }))
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

  // 4. Calculate Optimization Score
  const ratingScore = Math.min(((googleData.rating || 0) / 5) * 25, 25)
  const reviewScore = Math.min(((googleData.reviewCount || 0) / 100) * 20, 20)
  const photoScore = Math.min(((googleData.photoCount || 0) / 20) * 15, 15)
  const coverageScore = ((visibilityMetrics.top3Coverage || 0) / 100) * 40
  
  const optimizationScore = Math.round(ratingScore + reviewScore + photoScore + coverageScore)

  // 5. Assemble Audit Report
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
      }))
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
    scanResults: latestScanResults,
    keywords: {
      activeCampaign: [], // will be populated below
      aiSuggested: [
        `Top ${googleData.primaryType ? googleData.primaryType.replace(/_/g, ' ') : 'services'} near me`,
        `Best ${googleData.primaryType ? googleData.primaryType.replace(/_/g, ' ') : 'business'} in area`,
        `${googleData.name || project.businessName} reviews`,
        `Affordable ${googleData.primaryType ? googleData.primaryType.replace(/_/g, ' ') : 'services'}`,
        `Local ${googleData.primaryType ? googleData.primaryType.replace(/_/g, ' ') : 'experts'}`
      ],
      topRanked: [
        `Professional ${googleData.primaryType ? googleData.primaryType.replace(/_/g, ' ') : 'company'}`,
        `${googleData.primaryType ? googleData.primaryType.replace(/_/g, ' ') : 'service'} cost`,
        `Reliable ${googleData.primaryType ? googleData.primaryType.replace(/_/g, ' ') : 'business'}`,
        `${googleData.primaryType ? googleData.primaryType.replace(/_/g, ' ') : 'services'} open now`,
        `Highly rated ${googleData.primaryType ? googleData.primaryType.replace(/_/g, ' ') : 'services'}`
      ]
    },
    lastUpdated: new Date().toISOString(),
    projectId
  }

  // 5.5 Fetch active keywords from GMB Connector Database and Project Keywords
  try {
    const allKeywords = new Set()

    // 1. Existing keywords from Prisma Keyword table
    const storedKeywords = await prisma.keyword.findMany({
      where: { projectId: project.id },
      select: { keyword: true }
    })
    storedKeywords.forEach(k => {
      if (k.keyword && k.keyword.trim()) allKeywords.add(k.keyword.trim())
    })

    // 2. Fetch directly from GMB Connector Database
    const businessNameQuery = googleData.name || project.businessName
    const user = project.userId ? await prisma.user.findUnique({
      where: { id: project.userId },
      select: { email: true }
    }) : null

    const gmbKeywords = await fetchGmbKeywordsForProject({
      businessName: businessNameQuery,
      placeId: project.placeId,
      email: user?.email
    })

    if (Array.isArray(gmbKeywords) && gmbKeywords.length > 0) {
      gmbKeywords.forEach(k => {
        if (k && typeof k === 'string' && k.trim()) allKeywords.add(k.trim())
      })
    }

    if (allKeywords.size > 0) {
      auditReport.keywords.activeCampaign = Array.from(allKeywords)
    }
  } catch (err) {
    console.error('Failed to fetch GMB keywords:', err)
  }

  // 6. Store in Database
  await prisma.businessAudit.upsert({
    where: { id: projectId },
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

  return auditReport
}
