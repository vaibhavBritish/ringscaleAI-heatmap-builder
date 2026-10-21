import prisma from './prisma.js'
import { v4 as uuidv4 } from 'uuid'
import { getPlaceDetails } from './google-places.js'
import Anthropic from '@anthropic-ai/sdk'
import { getSecret } from './secrets.js'
import { fetchGmbPostsForProject } from './gmb-connector-db.js'

// In-memory fallbacks if database is temporarily unavailable
const fallbackPostStore = new Map()
const fallbackReviewStore = new Map()

/**
 * Generate a clean URL slug from business name
 */
export function generateSlug(businessName, fallbackId = '') {
  if (!businessName) {
    return fallbackId ? `profile-${fallbackId.slice(0, 8)}` : `profile-${uuidv4().slice(0, 8)}`
  }
  const clean = businessName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return clean ? clean : `profile-${uuidv4().slice(0, 8)}`
}

/**
 * Calculate rating distribution based on real reviews array
 */
export function calculateRatingDistribution(reviews = []) {
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  if (Array.isArray(reviews)) {
    reviews.forEach(r => {
      const star = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5)))
      counts[star] = (counts[star] || 0) + 1
    })
  }
  return counts
}

/**
 * Resolve project by slug, clientSlug, or id
 */
export async function findProjectBySlugOrId(slugOrId, userId = null) {
  if (!slugOrId) return null

  try {
    const whereConditions = [
      { clientSlug: slugOrId },
      { id: slugOrId }
    ]

    // If userId provided and not admin, filter by userId
    let project = await prisma.project.findFirst({
      where: {
        OR: whereConditions,
        ...(userId ? { userId } : {})
      }
    })

    if (!project) {
      // Try matching prefix if uniqueSlug had random suffix
      project = await prisma.project.findFirst({
        where: {
          clientSlug: { startsWith: slugOrId.split('-')[0], mode: 'insensitive' },
          ...(userId ? { userId } : {})
        }
      })
    }

    if (!project) {
      // Try matching businessName directly from slug words
      const cleanName = slugOrId.replace(/[-_]+/g, ' ').trim()
      project = await prisma.project.findFirst({
        where: {
          businessName: { equals: cleanName, mode: 'insensitive' },
          ...(userId ? { userId } : {})
        }
      })
    }

    if (!project) {
      const firstWord = slugOrId.split('-')[0]
      if (firstWord && firstWord.length > 2) {
        project = await prisma.project.findFirst({
          where: {
            businessName: { contains: firstWord, mode: 'insensitive' },
            ...(userId ? { userId } : {})
          }
        })
      }
    }

    if (project) {
      // Ensure project has a clientSlug
      if (!project.clientSlug) {
        const cleanSlug = generateSlug(project.businessName, project.id)
        project = await prisma.project.update({
          where: { id: project.id },
          data: { clientSlug: cleanSlug }
        })
      }
      return project
    }
  } catch (err) {
    console.warn('[ProfileService] DB findProject error (falling back):', err.message)
  }

  // Project not found
  return null
}

/**
 * Fetch all profiles with their slugs and overview metrics
 */
export async function getProfilesList(userId = null, isAdmin = false) {
  const cacheKey = `profiles:list:${isAdmin ? 'admin' : (userId || 'public')}`
  if (redis) {
    try {
      const cached = await redis.get(cacheKey)
      if (cached) return JSON.parse(cached)
    } catch {}
  }

  let projects = []
  try {
    const where = (!isAdmin && userId) ? { userId } : {}
    projects = await prisma.project.findMany({
      where,
      select: {
        id: true,
        clientSlug: true,
        businessName: true,
        address: true,
        primaryType: true,
        placeId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Cap to latest 100 for high performance
    })
  } catch (err) {
    console.warn('[ProfileService] DB getProfilesList error:', err.message)
  }

  // If no projects found, return empty list
  if (!projects || projects.length === 0) {
    return []
  }

  // Batch query post and review counts in 2 instant queries instead of N+1
  const projectIds = projects.map(p => p.id)
  let postCountMap = new Map()
  let reviewCountMap = new Map()

  try {
    const [postCounts, reviewCounts] = await Promise.all([
      prisma.gmbPost.groupBy({
        by: ['projectId'],
        where: { projectId: { in: projectIds } },
        _count: { id: true }
      }),
      prisma.gmbReview.groupBy({
        by: ['projectId'],
        where: { projectId: { in: projectIds } },
        _count: { id: true }
      })
    ])

    postCounts.forEach(pc => postCountMap.set(pc.projectId, pc._count.id))
    reviewCounts.forEach(rc => reviewCountMap.set(rc.projectId, rc._count.id))
  } catch (batchErr) {
    console.warn('[ProfileService] Batch counts error:', batchErr.message)
  }

  // Enrich projects with slug and real post/review metrics
  const profiles = projects.map(p => {
    const slug = p.clientSlug || generateSlug(p.businessName, p.id)
    const dbPosts = postCountMap.get(p.id) || 0
    const dbReviews = reviewCountMap.get(p.id) || 0

    return {
      id: p.id,
      slug: slug,
      businessName: p.businessName,
      address: p.address || 'Address on file',
      category: p.primaryType || 'Business',
      placeId: p.placeId,
      postCount: dbPosts,
      reviewCount: dbReviews,
      avgRating: 0,
      responseRate: 0,
      reviewPageUrl: `/review/${slug}`,
      profileHubUrl: `/dashboard/profiles/${slug}`,
      publicPortalUrl: `/profile/${slug}`,
      scansUrl: `/dashboard/projects/${p.id}`,
      auditUrl: `/dashboard/audit/${p.id}`,
      createdAt: p.createdAt
    }
  })

  // Cache list for 60 seconds
  if (redis && profiles.length > 0) {
    try {
      await redis.set(cacheKey, JSON.stringify(profiles), 'EX', 60)
    } catch {}
  }

  return profiles
}

/**
 * Fetch full profile details, GMB posts, reviews with pagination, and connected links by slug
 */
export async function getFullProfileData(slugOrId, userId = null, options = {}) {
  const {
    page = 1,
    limit = 10,
    filter = 'all',
    search = ''
  } = options

  const project = await findProjectBySlugOrId(slugOrId, userId)
  if (!project) return null

  const slug = project.clientSlug || generateSlug(project.businessName, project.id)
  const projectId = project.id

  // 1. Fetch Posts from GMB Connector MongoDB (Source of Truth for live Google Posts)
  let mongoPosts = []
  try {
    mongoPosts = await fetchGmbPostsForProject({
      businessName: project.businessName,
      placeId: project.placeId,
      slug: slug,
      address: project.address
    })
  } catch (err) {
    console.warn('[ProfileService] Error fetching GMB posts from connector:', err.message)
  }


  // Also fetch user-created custom posts from SQLite DB
  let dbPosts = []
  try {
    dbPosts = await prisma.gmbPost.findMany({
      where: {
        OR: [
          { projectId: projectId },
          { slug: slug }
        ]
      },
      orderBy: { publishedAt: 'desc' }
    })
  } catch (err) {
    console.warn('[ProfileService] Error fetching posts from DB:', err.message)
  }

  // Filter out dummy seed posts ('post-1-', 'post-2-', 'post-3-')
  const customDbPosts = dbPosts.filter(p => !p.id.startsWith('post-1-') && !p.id.startsWith('post-2-') && !p.id.startsWith('post-3-'))

  // Combine real mongo posts + custom db posts
  const combinedPosts = [...customDbPosts, ...mongoPosts]

  // Deduplicate by id or title
  const seenPostKeys = new Set()
  let posts = []
  for (const p of combinedPosts) {
    const key = (p.id || p.title || '').trim().toLowerCase()
    if (!seenPostKeys.has(key)) {
      seenPostKeys.add(key)
      posts.push({
        ...p,
        projectId: projectId,
        slug: slug
      })
    }
  }

  // Sync real posts to SQLite in background for caching/persistence only if DB has not cached them yet
  if (mongoPosts.length > 0 && dbPosts.length === 0) {
    Promise.all(mongoPosts.map(mp =>
      prisma.gmbPost.upsert({
        where: { id: mp.id },
        update: {},
        create: {
          id: mp.id,
          projectId: projectId,
          slug: slug,
          title: mp.title,
          content: mp.content,
          postType: mp.postType,
          ctaType: mp.ctaType,
          ctaUrl: mp.ctaUrl,
          imageUrl: mp.imageUrl,
          status: mp.status,
          publishedAt: mp.publishedAt,
          views: mp.views,
          clicks: mp.clicks,
          createdAt: mp.createdAt,
          updatedAt: mp.updatedAt
        }
      }).catch(() => {})
    )).catch(() => {})
  }


  // 2. Fetch Place Details from Google for live ratings and review counts
  let placeDetails = null
  if (project.placeId && !project.placeId.startsWith('gmb_') && !project.placeId.startsWith('place_')) {
    try {
      placeDetails = await getPlaceDetails(project.placeId)
    } catch (e) {
      console.warn('[ProfileService] Google Place details fetch error:', e.message)
    }
  }

  // 3. Fetch Reviews from DB
  let dbReviews = []
  try {
    dbReviews = await prisma.gmbReview.findMany({
      where: {
        OR: [
          { projectId: projectId },
          { slug: slug }
        ]
      },
      orderBy: { reviewDate: 'desc' }
    })
  } catch (err) {
    console.warn('[ProfileService] Error fetching reviews from DB:', err.message)
  }

  // Filter out any lingering dummy reviews
  const realDbReviews = (dbReviews || []).filter(r => 
    !r.id.startsWith('rev-') && 
    !r.id.startsWith('gmb-rev-') &&
    !['Marcus Vance', 'Sarah Jenkins', 'David Chen', 'Elena Rodriguez', 'James Wilson'].includes(r.reviewerName)
  )

  // Map real Google reviews from Google Places API
  const googleReviews = (placeDetails?.reviews || []).map((gr, idx) => {
    const revId = gr.name ? gr.name.split('/').pop() : `google-rev-${idx}`
    const pubDate = gr.publishTime ? new Date(gr.publishTime) : new Date()
    const text = gr.text?.text || gr.originalText?.text || ''
    
    // Check if there is an owner reply in DB for this review
    const dbMatch = realDbReviews.find(dr => dr.id === revId || dr.externalReviewId === revId)

    return {
      id: revId,
      projectId: projectId,
      slug: slug,
      reviewerName: gr.authorAttribution?.displayName || 'Google User',
      reviewerPhoto: gr.authorAttribution?.photoUri || null,
      rating: gr.rating || 5,
      comment: text,
      reviewDate: pubDate,
      replyText: dbMatch?.replyText || null,
      repliedAt: dbMatch?.repliedAt || null,
      repliedBy: dbMatch?.repliedBy || null,
      replyStatus: dbMatch?.replyStatus || (dbMatch?.replyText ? 'replied' : 'pending'),
      createdAt: pubDate,
      updatedAt: dbMatch?.updatedAt || pubDate,
      source: 'google'
    }
  })

  // Merge any custom real DB reviews not already in googleReviews
  const googleRevIds = new Set(googleReviews.map(r => r.id))
  const additionalDbReviews = realDbReviews.filter(dr => !googleRevIds.has(dr.id) && !googleRevIds.has(dr.externalReviewId))
  const allReviews = [...googleReviews, ...additionalDbReviews]

  // 4. Rating & review counts strictly from real Google Place details or real reviews
  const totalReviews = placeDetails?.reviewCount ?? allReviews.length
  const averageRating = placeDetails?.rating 
    ? Number(placeDetails.rating.toFixed(1)) 
    : (allReviews.length > 0 ? Number((allReviews.reduce((sum, r) => sum + (r.rating || 5), 0) / allReviews.length).toFixed(1)) : 0)
  const ratingDistribution = calculateRatingDistribution(allReviews)

  // 5. Compute exact filter counts matching the real review pool
  const filterCounts = {
    all: allReviews.length,
    pending: allReviews.filter(r => r.replyStatus === 'pending' || !r.replyText).length,
    replied: allReviews.filter(r => r.replyStatus === 'replied' || (r.replyText && r.replyText.trim().length > 0)).length,
    fiveStar: allReviews.filter(r => r.rating === 5).length,
    fourStar: allReviews.filter(r => r.rating === 4).length,
    threeStar: allReviews.filter(r => r.rating === 3).length,
    critical: allReviews.filter(r => r.rating <= 2).length
  }

  // 6. Apply filtering
  let filtered = allReviews
  if (filter === 'pending') {
    filtered = filtered.filter(r => r.replyStatus === 'pending' || !r.replyText)
  } else if (filter === 'replied') {
    filtered = filtered.filter(r => r.replyStatus === 'replied' || (r.replyText && r.replyText.trim().length > 0))
  } else if (filter === '5') {
    filtered = filtered.filter(r => r.rating === 5)
  } else if (filter === '4') {
    filtered = filtered.filter(r => r.rating === 4)
  } else if (filter === '3') {
    filtered = filtered.filter(r => r.rating === 3)
  } else if (filter === 'negative') {
    filtered = filtered.filter(r => r.rating <= 2)
  }

  // 7. Apply search
  const cleanSearch = (search || '').trim().toLowerCase()
  if (cleanSearch) {
    filtered = filtered.filter(r =>
      (r.comment || '').toLowerCase().includes(cleanSearch) ||
      (r.reviewerName || '').toLowerCase().includes(cleanSearch) ||
      (r.replyText || '').toLowerCase().includes(cleanSearch)
    )
  }

  // 8. Calculate pagination
  const totalFiltered = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / limit))
  const validPage = Math.max(1, Math.min(page, totalPages))
  const startIndex = (validPage - 1) * limit
  const paginatedReviews = filtered.slice(startIndex, startIndex + limit)

  const pagination = {
    page: validPage,
    limit,
    total: totalFiltered,
    totalOverall: allReviews.length,
    totalPages,
    hasNextPage: validPage < totalPages,
    hasPrevPage: validPage > 1
  }

  // 9. Compute accurate overall metrics
  const responseRate = allReviews.length > 0
    ? Math.round((filterCounts.replied / allReviews.length) * 100)
    : 0
  const totalPosts = posts.length
  const totalPostViews = posts.reduce((sum, p) => sum + (p.views || 0), 0)
  const totalPostClicks = posts.reduce((sum, p) => sum + (p.clicks || 0), 0)

  // 10. Connected Page Links ("information on another pages")
  const latestScan = await prisma.scanJob.findFirst({
    where: { projectId: project.id, status: 'completed' },
    orderBy: { createdAt: 'desc' }
  }).catch(() => null)

  const navigationLinks = {
    profileHub: `/dashboard/profiles/${slug}`,
    publicPortal: `/profile/${slug}`,
    heatmapScans: latestScan ? `/dashboard/scans/${latestScan.id}` : `/dashboard/projects/${project.id}`,
    seoAudit: `/dashboard/audit/${project.id}`,
    reviewBooster: `/review/${slug}`,
    qrReview: `/dashboard/seoos/qr-generator`,
    citations: `/dashboard/citations`,
    gbpSuite: `/dashboard/seoos/gbp-suite`,
    externalGmb: project.gmbLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.businessName + ' ' + (project.address || ''))}`
  }

  return {
    project: {
      ...project,
      slug: slug
    },
    metrics: {
      totalReviews: totalReviews,
      averageRating,
      responseRate,
      repliedCount: filterCounts.replied,
      pendingCount: filterCounts.pending,
      filterCounts,
      totalPosts,
      totalPostViews,
      totalPostClicks,
      ratingDistribution
    },
    posts,
    reviews: paginatedReviews,
    pagination,
    filterCounts,
    navigationLinks
  }
}

/**
 * Create a new GMB Post
 */
export async function createGmbPost(data) {
  const {
    projectId,
    slug,
    title,
    content,
    postType = 'update',
    ctaType = 'LEARN_MORE',
    ctaUrl,
    imageUrl,
    status = 'published',
    scheduledFor
  } = data

  const newPost = {
    id: `post-${uuidv4().slice(0, 10)}`,
    projectId: projectId || slug,
    slug: slug,
    title: title || 'Google Business Profile Update',
    content: content || '',
    postType: postType,
    ctaType: ctaType,
    ctaUrl: ctaUrl || '',
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80',
    status: status,
    publishedAt: status === 'published' ? new Date() : null,
    scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
    views: 0,
    clicks: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  try {
    const saved = await prisma.gmbPost.create({
      data: newPost
    })
    return saved
  } catch (err) {
    console.warn('[ProfileService] DB post creation error, saving to memory fallback:', err.message)
    const existing = fallbackPostStore.get(slug) || []
    fallbackPostStore.set(slug, [newPost, ...existing])
    return newPost
  }
}

/**
 * Add or update owner reply to a review
 */
export async function replyToGmbReview({ reviewId, slug, replyText, repliedBy = 'Business Owner' }) {
  const now = new Date()

  try {
    const updated = await prisma.gmbReview.upsert({
      where: { id: reviewId },
      update: {
        replyText: replyText,
        repliedAt: now,
        repliedBy: repliedBy,
        replyStatus: 'replied',
        updatedAt: now
      },
      create: {
        id: reviewId,
        slug: slug,
        reviewerName: 'Google User',
        rating: 5,
        comment: '',
        reviewDate: now,
        replyText: replyText,
        repliedAt: now,
        repliedBy: repliedBy,
        replyStatus: 'replied',
        createdAt: now,
        updatedAt: now
      }
    })
    return updated
  } catch (err) {
    console.warn('[ProfileService] DB review reply error, updating in memory fallback:', err.message)
    const list = fallbackReviewStore.get(slug) || []
    const updatedList = list.map(r => {
      if (r.id === reviewId) {
        return {
          ...r,
          replyText,
          repliedAt: now,
          repliedBy,
          replyStatus: 'replied',
          updatedAt: now
        }
      }
      return r
    })
    fallbackReviewStore.set(slug, updatedList)
    return {
      id: reviewId,
      replyText,
      repliedAt: now,
      repliedBy,
      replyStatus: 'replied'
    }
  }
}

/**
 * AI Post Generator using Anthropic (or intelligent fallback)
 */
export async function generateAIPost({ businessName, category, location, topic, offer, ctaType }) {
  const apiKey = getSecret('ANTHROPIC_API_KEY')
  
  if (apiKey) {
    try {
      const anthropic = new Anthropic({ apiKey })
      const prompt = `You are a Google My Business local SEO expert. Write an engaging Google Business Profile post for:
Business Name: ${businessName}
Category/Niche: ${category || 'Local Business'}
Location: ${location || 'Local Area'}
Topic/Focus: ${topic || 'General Update & Service Highlight'}
Special Offer/Details: ${offer || 'None'}
Call to Action: ${ctaType || 'LEARN_MORE'}

Requirements:
- 120 to 180 words
- Natural, engaging, human tone that drives customer action
- Highlight what makes this business trustworthy and high quality
- Include 2-3 relevant hashtags at the end (e.g. #${businessName.replace(/\s+/g, '')} #LocalBusiness)
- Include a strong, natural call to action sentence matching the CTA

Return ONLY a JSON object:
{
  "title": "A catchy title under 60 chars",
  "content": "The full post text with emojis and hashtags"
}`

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }]
      })

      const raw = response.content[0].text
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.warn('[ProfileService] AI Post generation fallback:', e.message)
    }
  }

  // Dynamic intelligent fallback
  const titles = [
    `Experience 5-Star ${category || 'Service'} with ${businessName}`,
    `Special Update from the Team at ${businessName}`,
    `Why Our Customers Choose ${businessName} in ${location || 'Town'}`
  ]
  const randomTitle = titles[Math.floor(Math.random() * titles.length)]

  return {
    title: randomTitle,
    content: `🌟 Looking for trusted, reliable ${category || 'service'}? The team at ${businessName} is proud to deliver unmatched quality and dedicated customer care across ${location || 'the community'}. \n\nWhether you need expert assistance or personalized guidance, our certified specialists are here to ensure complete satisfaction from start to finish. ${offer ? `Don't miss our special update: ${offer}!` : 'Contact us today to experience the difference.'}\n\n📍 Visit our profile on Google or get in touch right now!\n#${businessName.replace(/[^\w]/g, '')} #${(category || 'Services').replace(/[^\w]/g, '')} #LocalExcellence`
  }
}

/**
 * AI Review Reply Generator using Anthropic (or intelligent fallback)
 */
export async function generateAIReply({ reviewerName, rating, reviewText, businessName }) {
  const apiKey = getSecret('ANTHROPIC_API_KEY')
  const author = reviewerName || 'valued customer'
  const isPositive = rating >= 4

  if (apiKey) {
    try {
      const anthropic = new Anthropic({ apiKey })
      const prompt = `You are the business owner of ${businessName}. Write a warm, professional, authentic Google review reply to:
Reviewer: ${author}
Star Rating: ${rating}/5
Review: "${reviewText || 'Great experience'}"

Tone guidelines:
${isPositive ? '- Express sincere appreciation and enthusiasm.\n- Mention how proud the team is to serve them.\n- Keep it warm and personal in 2-4 sentences.' : '- Express genuine empathy and apologize for not meeting expectations.\n- State that high standards are important to the business.\n- Invite them to contact the team directly to resolve any concerns.\n- Keep it polite, constructive, and under 4 sentences.'}

Return ONLY the reply text, no quotes, no extra formatting.`

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      })

      return response.content[0].text.trim()
    } catch (e) {
      console.warn('[ProfileService] AI Reply generation fallback:', e.message)
    }
  }

  // Dynamic intelligent fallback
  if (isPositive) {
    return `Thank you so much, ${author}! The entire team at ${businessName} is thrilled to hear about your great experience with us. Providing five-star service is our passion, and we look forward to welcoming you back again soon!`
  } else {
    return `Hello ${author}, thank you for your feedback. At ${businessName}, we hold ourselves to the highest standards, and we sincerely apologize that your experience fell short. We would welcome the chance to speak with you directly and make things right—please reach out to us at your earliest convenience.`
  }
}

// timestamp: 1792579575205
