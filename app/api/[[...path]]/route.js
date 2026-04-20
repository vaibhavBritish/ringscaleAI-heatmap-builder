import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { searchBusinessByText, getPlaceDetails, searchKeywordAtPoint } from '@/lib/google-places'
import { generateGrid, calculateAnalytics } from '@/lib/grid-utils'
import { runScanJob } from '@/lib/scan-engine'
import prisma from '@/lib/prisma'
import redis from '@/lib/redis'
import { rateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'

let legacyProjectIndexCleanupAttempted = false

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

async function cleanupLegacyProjectClientSlugIndex() {
  if (legacyProjectIndexCleanupAttempted) return
  legacyProjectIndexCleanupAttempted = true

  try {
    await prisma.$runCommandRaw({
      dropIndexes: 'projects',
      index: 'projects_clientSlug_key'
    })
    console.info('[projects] Dropped legacy index projects_clientSlug_key')
  } catch (error) {
    // If index is already removed or command is not supported in this environment, continue.
    console.warn('[projects] Legacy index cleanup skipped:', error?.message || error)
  }
}

// Get authenticated user
async function getAuthUser(request) {
  const session = await getServerSession(authOptions)
  return session?.user || null
}

// ─── AUTOMATION HELPERS ──────────────────────────────────────────────────────

async function triggerExternalSetup(project, user) {
  const logPath = "/Users/vaibhav/Documents/seo-heatman copy/Seo-heatmap-builder/debug-automation.log"
  let currentStep = "Initialization"
  
  try {
    console.log(`[Automation] 🚀 Starting Internal Monolith for: ${project?.businessName}`)
    
    if (!project?.businessName) {
      throw new Error("Missing business name")
    }

    currentStep = "Slug & Content Generation"
    const slug = project.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    const uniqueSlug = `${slug}-${Math.random().toString(36).substring(2, 6)}`
    
    // Fetch deep data from Google
    let place = null
    if (project.placeId) {
      try {
        place = await getPlaceDetails(project.placeId)
        console.log("[Automation] ✅ Fetched Google data locally.")
      } catch (e) {
        console.warn("[Automation] ⚠️ Google fetch failed:", e.message)
      }
    }

    const industry = place?.primaryType || project.primaryType || "Global Business"
    const description = place?.summary || `Experience quality ${industry} services at ${project.businessName}.`
    const website = place?.website || ""
    const gmbLink = project.placeId ? `https://www.google.com/maps/place/?q=place_id:${project.placeId}` : ""

    currentStep = "Database Entry"
    await prisma.project.update({
      where: { id: project.id },
      data: {
        clientSlug: uniqueSlug,
        industry: industry,
        description: description,
        gmbLink: gmbLink,
        heroImage: place?.heroImage || "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80",
        reviewPageUrl: `/review/${uniqueSlug}`,
        qrCodeUrl: `/q/${uniqueSlug}`,
        keyFeatures: ["Verified Reviews", "Mobile Optimized", "AI Enhanced Feedback"]
      }
    })

    console.log("[Automation] 🎉 MONOLITH SETUP COMPLETE.")
    return { 
      success: true, 
      reviewUrl: `/review/${uniqueSlug}`, 
      qrUrl: `/q/${uniqueSlug}` 
    }

  } catch (err) {
    const errorMsg = `[Monolith Error] ${currentStep}: ${err.message}`
    console.error(errorMsg)
    
    try {
      require('fs').appendFileSync(logPath, `\n[${new Date().toISOString()}] ${errorMsg}\n`)
    } catch(e) {}

    return { success: false, error: err.message, step: currentStep }
  }
}

// ─────────────────────────────────────────────────────────────────────────────

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Route handler function
async function handleRoute(request, props) {
  const params = await props.params
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    // ==================== PUBLIC ROUTES ====================

    // Root endpoint
    if ((route === '/' || route === '/root') && method === 'GET') {
      return handleCORS(NextResponse.json({ message: 'Local Rank Heatmap API', version: '1.0.0' }))
    }

    // Health check
    if (route === '/health' && method === 'GET') {
      return handleCORS(NextResponse.json({ status: 'healthy', timestamp: new Date().toISOString() }))
    }

    // ==================== AUTH ROUTES ====================
    // Auth routes (register, me, login) are now handled by specific route handlers
    // in the app/api/auth directory for better performance and route isolation.


    // ==================== PROTECTED ROUTES ====================

    // Check authentication for protected routes
    const protectedPrefixes = ['/projects', '/keywords', '/scans', '/reports', '/dashboard', '/google']
    const isProtectedRoute = protectedPrefixes.some(prefix => route.startsWith(prefix))

    let currentUser = null
    if (isProtectedRoute) {
      currentUser = await getAuthUser(request)
      if (!currentUser) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
    }

    // Helper to check if plan/trial is expired (Time OR Credits)
    const isPlanExpired = (user) => {
      if (!user) return true
      const now = new Date()
      // Use planEndsAt if available, otherwise fallback to trialEndsAt
      const expiryDate = user.planEndsAt || user.trialEndsAt
      const isTimeExpired = expiryDate && new Date(expiryDate) < now
      const isCreditsExpired = (user.credits || 0) <= 0
      
      return isTimeExpired || isCreditsExpired
    }

    // Helper to get max radius based on plan (in miles)
    const getMaxRadius = (plan) => {
      const p = (plan || 'trial')
        .toLowerCase()
        .replace('plan_', '')
        .replace(' ', '_')
        .replace('lite', 'advance')

      const limits = {
        'trial': 5,
        'advance': 5,
        'pro': 10,
        'pro_plus': 20
      }
      return limits[p] || 5
    }

    // Helper to verify project ownership
    const verifyProject = async (projectId, userId) => {
      const project = await prisma.project.findFirst({ where: { id: projectId, userId } })
      return !!project
    }

    // Helper to verify scan ownership
    const verifyScan = async (scanId, userId) => {
      const scan = await prisma.scanJob.findFirst({ where: { id: scanId } })
      if (!scan) return false
      return verifyProject(scan.projectId, userId)
    }

    // ==================== PROXY ROUTES ====================

    // Image proxy for PDF generation (CORS bypass)
    if (route === '/proxy/image' && method === 'GET') {
      const { searchParams } = new URL(request.url)
      const imageUrl = searchParams.get('url')

      if (!imageUrl) {
        return handleCORS(NextResponse.json({ error: 'URL is required' }, { status: 400 }))
      }

      try {
        const headers = new Headers()
        const referer = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('referer') || ''
        if (referer) headers.set('Referer', referer)

        const response = await fetch(imageUrl, { headers })

        if (!response.ok) {
          const text = await response.text().catch(() => 'No error body')
          console.error('Google Map Proxy Error:', response.status, text)
          const errorMsg = text.length > 500 ? `Status ${response.status}` : text
          return handleCORS(NextResponse.json({ error: `Google Map Error: ${errorMsg}`, status: response.status }, { status: response.status }))
        }

        const blob = await response.blob()
        const responseHeaders = new Headers()
        responseHeaders.set('Content-Type', response.headers.get('Content-Type') || 'image/png')
        responseHeaders.set('Cache-Control', 'public, max-age=86400')

        const nextResponse = new NextResponse(blob, { status: 200, headers: responseHeaders })
        return handleCORS(nextResponse)
      } catch (error) {
        console.error('Proxy error:', error)
        return handleCORS(NextResponse.json({ error: 'Proxy error: ' + error.message }, { status: 500 }))
      }
    }

    // ==================== GOOGLE API ROUTES ====================

    // Search businesses
    if (route === '/google/search-business' && method === 'POST') {
      // RATE LIMIT: 10 searches per 60 seconds
      const limiter = await rateLimit(currentUser.id, 'search-business', 10, 60)
      if (!limiter.success) {
        return handleCORS(NextResponse.json({ 
          error: 'Too many search attempts. Please wait a minute.',
          code: 'RATE_LIMIT_EXCEEDED'
        }, { status: 429 }))
      }
      const body = await request.json()
      const { query } = body

      if (!query) {
        return handleCORS(NextResponse.json({ error: 'Query is required' }, { status: 400 }))
      }

      const cacheKey = `google:search:business:${query.toLowerCase().trim()}`
      if (redis) {
        try {
          const cached = await redis.get(cacheKey)
          if (cached) return handleCORS(NextResponse.json({ results: JSON.parse(cached), cached: true }))
        } catch (e) {}
      }

      const results = await searchBusinessByText(query)

      if (redis && results?.length > 0) {
        try { await redis.set(cacheKey, JSON.stringify(results), 'EX', 3600) } catch (e) {}
      }

      return handleCORS(NextResponse.json({ results }))
    }

    // Get place details
    if (route === '/google/place-details' && method === 'POST') {
      const body = await request.json()
      const { placeId } = body

      if (!placeId) {
        return handleCORS(NextResponse.json({ error: 'Place ID are required' }, { status: 400 }))
      }

      const cacheKey = `google:place:${placeId}`
      if (redis) {
        try {
          const cached = await redis.get(cacheKey)
          if (cached) return handleCORS(NextResponse.json(JSON.parse(cached)))
        } catch (e) {}
      }

      const details = await getPlaceDetails(placeId)

      if (redis && details) {
        try { await redis.set(cacheKey, JSON.stringify(details), 'EX', 86400) } catch (e) {}
      }

      return handleCORS(NextResponse.json(details))
    }

    // Keyword suggestions
    if (route === '/google/keyword-suggestions' && method === 'GET') {
      const { searchParams } = new URL(request.url)
      const query = searchParams.get('q')

      if (!query) {
        return handleCORS(NextResponse.json({ results: [] }))
      }

      const cacheKey = `google:suggestions:${query.toLowerCase().trim()}`
      if (redis) {
        try {
          const cached = await redis.get(cacheKey)
          if (cached) return handleCORS(NextResponse.json({ results: JSON.parse(cached), cached: true }))
        } catch (e) {}
      }

      const { getQuerySuggestions } = require('@/lib/google-places')
      const results = await getQuerySuggestions(query)

      if (redis && results?.length > 0) {
        try { await redis.set(cacheKey, JSON.stringify(results), 'EX', 86400) } catch (e) {}
      }

      return handleCORS(NextResponse.json({ results }))
    }

    // ==================== PROJECT ROUTES ====================

    if (route === '/projects' && method === 'GET') {
      const cacheKey = `user:projects:${currentUser.id}`
      if (redis) {
        try {
          const cached = await redis.get(cacheKey)
          if (cached) return handleCORS(NextResponse.json(JSON.parse(cached)))
        } catch (e) {}
      }

      const projects = await prisma.project.findMany({
        where: { userId: currentUser.id },
        select: {
          id: true,
          businessName: true,
          address: true,
          latitude: true,
          longitude: true,
          createdAt: true
          // we omit gridSettings here as it's not needed for the list view
        },
        orderBy: { createdAt: 'desc' }
      })

      // Get keyword counts and latest scan for each project
      const enrichedProjects = await Promise.all(projects.map(async (project) => {
        const keywordCount = await prisma.keyword.count({ where: { projectId: project.id } })
        const latestScan = await prisma.scanJob.findFirst({
          where: { projectId: project.id },
          orderBy: { createdAt: 'desc' }
        })

        return {
          ...project,
          keywordCount,
          latestScanDate: latestScan?.createdAt || null,
          latestScanStatus: latestScan?.status || null
        }
      }))

      const projectsResponse = { projects: enrichedProjects }
      if (redis) {
        try { await redis.set(cacheKey, JSON.stringify(projectsResponse), 'EX', 300) } catch (e) {}
      }

      return handleCORS(NextResponse.json(projectsResponse))
    }

    // Create or update project
    if (route === '/projects' && method === 'POST') {
      // RATE LIMIT: 5 projects per 60 seconds (generous but prevents rapid-fire)
      const limiter = await rateLimit(currentUser.id, 'create-project', 5, 60)
      if (!limiter.success) {
        return handleCORS(NextResponse.json({ 
          error: 'Too many project creation attempts. Please wait a minute.',
          code: 'RATE_LIMIT_EXCEEDED'
        }, { status: 429 }))
      }

      const body = await request.json()
      const businessName = body.businessName || body.name
      const placeId = body.placeId || body.businessId
      const coordinates = body.coordinates || { lat: body.latitude, lng: body.longitude }
      const { address, primaryType, keywords = [], gridSettings } = body

      if (!businessName || !placeId) {
        return handleCORS(NextResponse.json({ error: 'Business name and place ID are required' }, { status: 400 }))
      }

      if (isPlanExpired(currentUser)) {
        return handleCORS(NextResponse.json({
          error: 'Plan expired or out of credits. Please upgrade to continue scanning.',
          code: 'PLAN_EXPIRED',
          credits: currentUser.credits
        }, { status: 403 }))
      }

      // Check for existing project with this placeId for this user
      let project = await prisma.project.findFirst({ where: { placeId, userId: currentUser.id } })

      let projectId
      if (project) {
        projectId = project.id
        project = await prisma.project.update({
          where: { id: projectId },
          data: {
            businessName,
            address: address || project.address,
            latitude: coordinates?.lat || project.latitude,
            longitude: coordinates?.lng || project.longitude,
            gridSettings: gridSettings || project.gridSettings,
            updatedAt: new Date()
          }
        })
      } else {
        projectId = uuidv4()
        try {
          project = await prisma.project.create({
            data: {
              id: projectId,
              userId: currentUser.id,
              businessName,
              placeId,
              address: address || '',
              latitude: coordinates?.lat || 0,
              longitude: coordinates?.lng || 0,
              primaryType: primaryType || '',
              gridSettings: gridSettings || null,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          })
        } catch (createError) {
          const isLegacyClientSlugConflict =
            createError?.code === 'P2002' &&
            String(createError?.meta?.target || '').includes('projects_clientSlug_key')

          if (!isLegacyClientSlugConflict) throw createError

          await cleanupLegacyProjectClientSlugIndex()

          // Retry once after cleaning up stale DB index.
          project = await prisma.project.create({
            data: {
              id: projectId,
              userId: currentUser.id,
              businessName,
              placeId,
              address: address || '',
              latitude: coordinates?.lat || 0,
              longitude: coordinates?.lng || 0,
              primaryType: primaryType || '',
              gridSettings: gridSettings || null,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          })
        }
      }

      // Radius validation
      const maxAllowedRadius = getMaxRadius(currentUser.plan)
      const requestedRadius = gridSettings?.radius || 5
      if (requestedRadius > maxAllowedRadius) {
        return handleCORS(NextResponse.json({
          error: `Your current plan allows a maximum search radius of ${maxAllowedRadius} miles. Please upgrade for more.`,
          maxAllowedRadius
        }, { status: 403 }))
      }

      // Automatically add keywords and start scan jobs
      const scanJobIds = []
      if (keywords.length > 0) {
        // Credit check: 100 credits per keyword
        const creditsNeeded = keywords.length * 100
        const userDoc = await prisma.user.findUnique({ where: { id: currentUser.id } })
        if ((userDoc?.credits || 0) < creditsNeeded) {
          return handleCORS(NextResponse.json({
            error: `Not enough credits. You need ${creditsNeeded} credits for ${keywords.length} keyword(s). You have ${userDoc?.credits || 0}.`,
            creditsNeeded,
            creditsAvailable: userDoc?.credits || 0
          }, { status: 402 }))
        }

        let keywordsAdded = 0
        for (const kw of keywords) {
          let kwDoc = await prisma.keyword.findFirst({ where: { projectId, keyword: kw } })

          if (!kwDoc) {
            kwDoc = await prisma.keyword.create({
              data: {
                id: uuidv4(),
                projectId,
                keyword: kw,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            })
            keywordsAdded++
          }

          // Create a new scan job for this keyword
          const scanJobId = uuidv4()
          const radius = gridSettings?.radius || 5
          const unit = gridSettings?.unit || 'km'
          const calculatedRadiusMeters = unit === 'mi' ? Math.round(radius * 1609.34) : Math.round(radius * 1000)

          await prisma.scanJob.create({
            data: {
              id: scanJobId,
              projectId,
              keywordId: kwDoc.id,
              status: 'queued',
              processedPoints: 0,
              totalPoints: gridSettings?.density || 133,
              searchRadiusMeters: calculatedRadiusMeters,
              createdAt: new Date()
            }
          })
          scanJobIds.push(scanJobId)

          // Trigger the job in background
          runScanJob(scanJobId).catch(err => console.error('Background scan error:', err))
        }

        // Deduct credits for newly added keywords only
        if (keywordsAdded > 0) {
          await prisma.user.update({
            where: { id: currentUser.id },
            data: { credits: { decrement: keywordsAdded * 100 } }
          })
        }
      }

      const updatedUser = await prisma.user.findUnique({ where: { id: currentUser.id } })

      // TRIGGER AUTOMATION IN BACKGROUND
      triggerExternalSetup(project, updatedUser).catch(err => console.error('Automation trigger error:', err))

      // Invalidate dashboard stats
      if (redis) {
        try { 
          await redis.del(`user:stats:${currentUser.id}`)
          await redis.del(`user:projects:${currentUser.id}`)
        } catch (e) {}
      }

      return handleCORS(NextResponse.json({ project, scanJobIds, creditsRemaining: updatedUser?.credits || 0 }))
    }

    // Get single project
    const projectMatch = route.match(/^\/projects\/([^/]+)$/)
    if (projectMatch && method === 'GET') {
      const projectId = projectMatch[1]
      const project = await prisma.project.findFirst({ where: { id: projectId, userId: currentUser.id } })

      if (!project) {
        return handleCORS(NextResponse.json({ error: 'Project not found' }, { status: 404 }))
      }

      const keywords = await prisma.keyword.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' }
      })
      const scans = await prisma.scanJob.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        take: 10
      })

      return handleCORS(NextResponse.json({ project, keywords, scans }))
    }

    // Delete project
    if (projectMatch && method === 'DELETE') {
      const projectId = projectMatch[1]
      await prisma.project.deleteMany({ where: { id: projectId, userId: currentUser.id } })
      await prisma.keyword.deleteMany({ where: { projectId } })
      await prisma.scanJob.deleteMany({ where: { projectId } })

      // Invalidate dashboard stats
      if (redis) {
        try { 
          await redis.del(`user:stats:${currentUser.id}`)
          await redis.del(`user:projects:${currentUser.id}`)
        } catch (e) {}
      }

      return handleCORS(NextResponse.json({ success: true }))
    }

    // SETUP ASSETS (Review Page + QR) - MANUAL TRIGGER
    const setupAssetsMatch = route.match(/^\/projects\/([^/]+)\/setup-assets$/)
    if (setupAssetsMatch && method === 'POST') {
      const projectId = setupAssetsMatch[1]
      const project = await prisma.project.findFirst({ where: { id: projectId, userId: currentUser.id } })

      if (!project) {
        return handleCORS(NextResponse.json({ error: 'Project not found' }, { status: 404 }))
      }

      const result = await triggerExternalSetup(project, currentUser)
      if (!result || result.success === false) {
        return handleCORS(NextResponse.json({ 
          error: result?.error || 'Failed to generate assets. Unknown error occurred.',
          details: result?.step ? `Failed at step: ${result.step}` : 'Ensure services are online.' 
        }, { status: 500 }))
      }

      return handleCORS(NextResponse.json(result))
    }

    // ==================== KEYWORD ROUTES ====================

    // List keywords for project
    const keywordsMatch = route.match(/^\/projects\/([^/]+)\/keywords$/)
    if (keywordsMatch && method === 'GET') {
      const projectId = keywordsMatch[1]
      if (!(await verifyProject(projectId, currentUser.id))) {
        return handleCORS(NextResponse.json({ error: 'Project not found' }, { status: 404 }))
      }

      const keywords = await prisma.keyword.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' }
      })
      return handleCORS(NextResponse.json({ keywords }))
    }

    // Create keyword
    if (keywordsMatch && method === 'POST') {
      const projectId = keywordsMatch[1]
      if (!(await verifyProject(projectId, currentUser.id))) {
        return handleCORS(NextResponse.json({ error: 'Project not found' }, { status: 404 }))
      }

      const body = await request.json()
      const { keyword } = body

      if (!keyword) {
        return handleCORS(NextResponse.json({ error: 'Keyword is required' }, { status: 400 }))
      }

      // Check for existing keyword in this project (case-insensitive)
      const existingKeyword = await prisma.keyword.findFirst({
        where: {
          projectId,
          keyword: { equals: keyword.trim(), mode: 'insensitive' }
        }
      })

      if (existingKeyword) {
        const userDoc = await prisma.user.findUnique({ where: { id: currentUser.id } })
        return handleCORS(NextResponse.json({ ...existingKeyword, creditsRemaining: userDoc?.credits || 0 }))
      }

      // Credit check: 100 credits per new keyword
      const KEYWORD_COST = 100
      const userDoc = await prisma.user.findUnique({ where: { id: currentUser.id } })
      const currentCredits = userDoc?.credits || 0

      if (currentCredits < KEYWORD_COST) {
        return handleCORS(NextResponse.json({
          error: `Not enough credits. Adding a keyword costs ${KEYWORD_COST} credits. You have ${currentCredits}.`,
          creditsRemaining: currentCredits,
          creditsNeeded: KEYWORD_COST
        }, { status: 402 }))
      }

      const keywordDoc = await prisma.keyword.create({
        data: {
          id: uuidv4(),
          projectId,
          keyword,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Deduct credits
      const updatedUser = await prisma.user.update({
        where: { id: currentUser.id },
        data: { credits: { decrement: KEYWORD_COST } }
      })

      return handleCORS(NextResponse.json({
        ...keywordDoc,
        creditsDeducted: KEYWORD_COST,
        creditsRemaining: updatedUser.credits
      }))
    }

    // Delete keyword
    const keywordDeleteMatch = route.match(/^\/keywords\/([^/]+)$/)
    if (keywordDeleteMatch && method === 'DELETE') {
      const keywordId = keywordDeleteMatch[1]
      const keywordDoc = await prisma.keyword.findFirst({ where: { id: keywordId } })
      if (!keywordDoc || !(await verifyProject(keywordDoc.projectId, currentUser.id))) {
        return handleCORS(NextResponse.json({ error: 'Keyword not found' }, { status: 404 }))
      }
      await prisma.keyword.delete({ where: { id: keywordId } })
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ==================== SCAN ROUTES ====================

    // Create scan job(s)
    if (route === '/scans' && method === 'POST') {
      // RATE LIMIT: 5 scans per 10 seconds
      const limiter = await rateLimit(currentUser.id, 'create-scan', 5, 10)
      if (!limiter.success) {
        return handleCORS(NextResponse.json({ 
          error: 'Too many requests. Please wait a few seconds before starting another scan.',
          code: 'RATE_LIMIT_EXCEEDED'
        }, { status: 429 }))
      }

      const body = await request.json()
      const { 
        projectId, 
        keywordId, 
        keywordIds, 
        gridSize = 3, 
        spacingMeters = 1000, 
        searchRadiusMeters: bodyRadiusMeters,
        radius,
        unit = 'km'
      } = body

      let searchRadiusMeters = bodyRadiusMeters
      if (!searchRadiusMeters && radius) {
        searchRadiusMeters = unit === 'mi' ? Math.round(radius * 1609.34) : Math.round(radius * 1000)
      } else if (!searchRadiusMeters) {
        searchRadiusMeters = 5000
      }

      if (!projectId || (!keywordId && (!keywordIds || !keywordIds.length))) {
        return handleCORS(NextResponse.json({ error: 'Project ID and keyword ID(s) are required' }, { status: 400 }))
      }

      if (!(await verifyProject(projectId, currentUser.id))) {
        return handleCORS(NextResponse.json({ error: 'Project not found' }, { status: 404 }))
      }

      // Radius validation
      const maxAllowedRadius = getMaxRadius(currentUser.plan)
      const requestedRadius = radius || (bodyRadiusMeters ? bodyRadiusMeters / 1609.34 : 5)
      if (requestedRadius > maxAllowedRadius) {
        return handleCORS(NextResponse.json({
          error: `Your current plan allows a maximum search radius of ${maxAllowedRadius} miles. Please upgrade for more.`,
          maxAllowedRadius
        }, { status: 403 }))
      }

      if (isPlanExpired(currentUser)) {
        return handleCORS(NextResponse.json({
          error: 'Plan expired or out of credits. Please upgrade to continue scanning.',
          code: 'PLAN_EXPIRED',
          credits: currentUser.credits
        }, { status: 403 }))
      }

      const idsToProcess = keywordIds || [keywordId]
      const scanJobs = []

      for (const id of idsToProcess) {
        const scanJob = await prisma.scanJob.create({
          data: {
            id: uuidv4(),
            projectId,
            keywordId: id,
            status: 'queued',
            gridSize,
            spacingMeters,
            searchRadiusMeters,
            processedPoints: 0,
            totalPoints: gridSize * gridSize,
            createdAt: new Date()
          }
        })
        // Start scan in background (async)
        runScanJob(scanJob.id).catch(err => console.error('Background scan error:', err))
        scanJobs.push(scanJob)
      }

      // Invalidate dashboard stats
      if (redis) {
        try { 
          await redis.del(`user:stats:${currentUser.id}`)
          await redis.del(`user:projects:${currentUser.id}`)
        } catch (e) {}
      }

      return handleCORS(NextResponse.json(scanJobs.length === 1 ? scanJobs[0] : { success: true, count: scanJobs.length, scans: scanJobs }))
    }

    // Cancel scan job
    const scanCancelMatch = route.match(/^\/scans\/([^/]+)\/cancel$/)
    if (scanCancelMatch && method === 'POST') {
      const scanJobId = scanCancelMatch[1]
      if (!(await verifyScan(scanJobId, currentUser.id))) {
        return handleCORS(NextResponse.json({ error: 'Scan not found' }, { status: 404 }))
      }
      await prisma.scanJob.update({
        where: { id: scanJobId },
        data: { status: 'cancelled', completedAt: new Date() }
      })
      return handleCORS(NextResponse.json({ success: true }))
    }

    // Get scan job status
    const scanStatusMatch = route.match(/^\/scans\/([^/]+)$/)
    if (scanStatusMatch && method === 'GET') {
      const scanId = scanStatusMatch[1]
      const scanJob = await prisma.scanJob.findFirst({ where: { id: scanId } })

      if (!scanJob || !(await verifyProject(scanJob.projectId, currentUser.id))) {
        return handleCORS(NextResponse.json({ error: 'Scan job not found' }, { status: 404 }))
      }

      return handleCORS(NextResponse.json(scanJob))
    }

    // Get scan results
    const scanResultsMatch = route.match(/^\/scans\/([^/]+)\/results$/)
    if (scanResultsMatch && method === 'GET') {
      const scanId = scanResultsMatch[1]

      const scanJob = await prisma.scanJob.findFirst({ where: { id: scanId } })
      if (!scanJob || !(await verifyProject(scanJob.projectId, currentUser.id))) {
        return handleCORS(NextResponse.json({ error: 'Scan job not found' }, { status: 404 }))
      }

      const urlObj = new URL(request.url)
      const isAggregate = urlObj.searchParams.get('aggregate') === 'true'

      const cacheKey = `scan:results:${scanId}${isAggregate ? ':aggregate' : ''}`
      if (redis) {
        try {
          const cached = await redis.get(cacheKey)
          if (cached) {
            return handleCORS(NextResponse.json(JSON.parse(cached)))
          }
        } catch (e) {
          console.warn('Redis Cache Get Error:', e)
        }
      }

      const project = await prisma.project.findFirst({ where: { id: scanJob.projectId } })
      const keyword = await prisma.keyword.findFirst({ where: { id: scanJob.keywordId } })

      // Fetch all results for this scan job
      const scanResults = await prisma.scanResult.findMany({ 
        where: { scanJobId: scanId },
        select: {
          id: true,
          scanJobId: true,
          rowIndex: true,
          colIndex: true,
          latitude: true,
          longitude: true,
          found: true,
          rank: true,
          errorMessage: true,
          competitorsJson: true
        },
        orderBy: [{ rowIndex: 'asc' }, { colIndex: 'asc' }]
      })

      let mergedResults = []

      if (isAggregate) {
        // Fetch ALL scan jobs for this project to get project-wide best ranks
        const allProjectScanJobIds = (await prisma.scanJob.findMany({
          where: { projectId: scanJob.projectId },
          select: { id: true }
        })).map(j => j.id)

        // Fetch ALL results across ALL jobs, but exclude competitorsJson for the first pass to save memory
        const allResults = await prisma.scanResult.findMany({
          where: { scanJobId: { in: allProjectScanJobIds } },
          select: {
            id: true,
            rowIndex: true,
            colIndex: true,
            latitude: true,
            longitude: true,
            found: true,
            rank: true,
            scanJobId: true
          }
        })

        // Group by coordinate (row,col) and pick BEST RANK ID
        const bestResultMap = new Map()
        
        allResults.forEach(r => {
          if (r.rowIndex === null) return 

          const coordKey = `${r.rowIndex},${r.colIndex}`
          const existing = bestResultMap.get(coordKey)

          if (!r.found && (!existing || !existing.found)) {
            if (!existing) bestResultMap.set(coordKey, r)
            return
          }
          
          if (!existing || !existing.found || (r.rank && (!existing.rank || r.rank < existing.rank))) {
            bestResultMap.set(coordKey, r)
          }
        })

        // Fetch competitorsJson only for the best results to save significant memory
        const bestIds = Array.from(bestResultMap.values()).map(r => r.id)
        const detailedResults = await prisma.scanResult.findMany({
          where: { id: { in: bestIds } },
          select: {
            id: true,
            competitorsJson: true,
            errorMessage: true
          }
        })
        const detailMap = new Map(detailedResults.map(d => [d.id, d]))

        mergedResults = Array.from(bestResultMap.values()).sort((a, b) => {
          if (a.rowIndex !== b.rowIndex) return a.rowIndex - b.rowIndex
          return a.colIndex - b.colIndex
        }).map(r => {
          const detail = detailMap.get(r.id)
          return {
            ...r,
            competitors: detail?.competitorsJson ? JSON.parse(detail.competitorsJson) : [],
            error: detail?.errorMessage || null
          }
        })
      } else {
        // Standard single-scan result (Hybrid)
        // For backward compatibility, check if we need points
        const needsPoints = scanResults.some(r => r.rowIndex === null && r.scanPointId)
        let pointMap = new Map()
        if (needsPoints) {
          const points = await prisma.scanPoint.findMany({ where: { scanJobId: scanId } })
          pointMap = new Map(points.map(p => [p.id, p]))
        }

        mergedResults = scanResults.map(r => {
          let row = r.rowIndex, col = r.colIndex, lat = r.latitude, lng = r.longitude
          if (row === null && r.scanPointId) {
            const p = pointMap.get(r.scanPointId)
            if (p) {
              row = p.rowIndex; col = p.colIndex; lat = p.latitude; lng = p.longitude
            }
          }

          return {
            id: r.id,
            scanJobId: r.scanJobId,
            rowIndex: row,
            colIndex: col,
            latitude: lat,
            longitude: lng,
            found: r.found,
            rank: r.rank,
            competitors: r.competitorsJson ? JSON.parse(r.competitorsJson) : [],
            error: r.errorMessage || null
          }
        })
      }

      const analytics = calculateAnalytics(mergedResults)

      // Get all keywords for this project with their latest scans
      const allKeywords = await prisma.keyword.findMany({ where: { projectId: scanJob.projectId } })
      const projectScans = await Promise.all(allKeywords.map(async (kw) => {
        let latestJob = await prisma.scanJob.findFirst({
          where: { keywordId: kw.id },
          orderBy: { createdAt: 'desc' }
        })

        // Auto-heal occasional stuck jobs: if all points are processed but status never flipped.
        if (
          latestJob &&
          ['queued', 'processing'].includes(latestJob.status) &&
          (latestJob.totalPoints || 0) > 0 &&
          (latestJob.processedPoints || 0) >= (latestJob.totalPoints || 0)
        ) {
          latestJob = await prisma.scanJob.update({
            where: { id: latestJob.id },
            data: { status: 'completed', completedAt: new Date() }
          })
        }

        return {
          keyword: kw.keyword,
          keywordId: kw.id,
          scanId: latestJob?.id || null,
          status: latestJob?.status || 'none',
          processedPoints: latestJob?.processedPoints || 0,
          totalPoints: latestJob?.totalPoints || 0
        }
      }))

      // Get all competitors across all points
      const allCompetitors = new Map()
      mergedResults.forEach(r => {
        r.competitors.forEach(c => {
          if (!allCompetitors.has(c.placeId)) {
            allCompetitors.set(c.placeId, { ...c, appearances: 0, totalRank: 0 })
          }
          const comp = allCompetitors.get(c.placeId)
          comp.appearances++
          comp.totalRank += c.rank
        })
      })
      const topCompetitors = Array.from(allCompetitors.values())
        .map(c => ({
          ...c,
          avgRank: c.totalRank / c.appearances
        }))
        .sort((a, b) => b.appearances - a.appearances)
        .slice(0, 10)

      const finalResponse = {
        scanJob,
        project,
        keyword,
        results: mergedResults,
        analytics,
        topCompetitors,
        projectScans
      }

      if (redis && scanJob.status === 'completed') {
        try {
          // Random TTL between 15-30 minutes (900-1800 seconds)
          const randomTTL = Math.floor(Math.random() * 900) + 900
          await redis.set(cacheKey, JSON.stringify(finalResponse), 'EX', randomTTL)
        } catch (e) {
          console.warn('Redis Cache Set Error:', e)
        }
      }

      return handleCORS(NextResponse.json(finalResponse))
    }

    // Rescan project keyword
    if (route === '/scans/rescan' && method === 'POST') {
      const body = await request.json()
      const { projectId, keywordId } = body

      if (!projectId || !keywordId) {
        return handleCORS(NextResponse.json({ error: 'Project ID and Keyword ID are required' }, { status: 400 }))
      }

      if (isPlanExpired(currentUser)) {
        return handleCORS(NextResponse.json({
          error: 'Plan expired or out of credits. Please upgrade to continue scanning.',
          code: 'PLAN_EXPIRED',
          credits: currentUser.credits
        }, { status: 403 }))
      }

      const project = await prisma.project.findFirst({ where: { id: projectId, userId: currentUser.id } })
      if (!project) {
        return handleCORS(NextResponse.json({ error: 'Project not found' }, { status: 404 }))
      }

      const scanJobId = uuidv4()
      await prisma.scanJob.create({
        data: {
          id: scanJobId,
          projectId,
          keywordId,
          status: 'queued',
          processedPoints: 0,
          totalPoints: project.gridSettings?.density || 133,
          searchRadiusMeters: (project.gridSettings?.radius || 5) * 1000,
          createdAt: new Date()
        }
      })

      // Trigger background worker
      runScanJob(scanJobId).catch(err => console.error('Rescan error:', err))

      return handleCORS(NextResponse.json({ success: true, scanJobId }))
    }

    // List scan history for project
    const scanHistoryMatch = route.match(/^\/projects\/([^/]+)\/scans$/)
    if (scanHistoryMatch && method === 'GET') {
      const projectId = scanHistoryMatch[1]
      if (!(await verifyProject(projectId, currentUser.id))) {
        return handleCORS(NextResponse.json({ error: 'Project not found' }, { status: 404 }))
      }

      const scans = await prisma.scanJob.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' }
      })

      // Enrich with keyword info and basic analytics
      const enrichedScans = await Promise.all(scans.map(async (scan) => {
        const kw = await prisma.keyword.findFirst({ where: { id: scan.keywordId } })
        const results = await prisma.scanResult.findMany({ where: { scanJobId: scan.id } })
        const analytics = calculateAnalytics(results.map(r => ({ found: r.found, rank: r.rank })))

        return {
          ...scan,
          keyword: kw?.keyword || 'Unknown',
          analytics
        }
      }))

      return handleCORS(NextResponse.json({ scans: enrichedScans }))
    }

    // Get Project-wide aggregate results (equivalent to aggregate scan results)
    const projectResultsMatch = route.match(/^\/projects\/([^/]+)\/results$/)
    if (projectResultsMatch && method === 'GET') {
      const projectId = projectResultsMatch[1]
      if (!(await verifyProject(projectId, currentUser.id))) {
        return handleCORS(NextResponse.json({ error: 'Project not found' }, { status: 404 }))
      }

      // Fetch latest scan job of this project just to have a reference Job
      const scanJob = await prisma.scanJob.findFirst({
        where: { projectId },
        orderBy: { createdAt: 'desc' }
      })

      if (!scanJob) {
        return handleCORS(NextResponse.json({ error: 'No scan jobs found for this project' }, { status: 404 }))
      }

      const project = await prisma.project.findFirst({ where: { id: projectId } })
      const allProjectScanJobIds = (await prisma.scanJob.findMany({
        where: { projectId },
        select: { id: true }
      })).map(j => j.id)

      const allResults = await prisma.scanResult.findMany({
        where: { scanJobId: { in: allProjectScanJobIds } },
        select: { id: true, rowIndex: true, colIndex: true, latitude: true, longitude: true, found: true, rank: true, scanJobId: true }
      })

      const bestResultMap = new Map()
      allResults.forEach(r => {
        if (r.rowIndex === null) return
        const coordKey = `${r.rowIndex},${r.colIndex}`
        const existing = bestResultMap.get(coordKey)
        if (!r.found && (!existing || !existing.found)) {
          if (!existing) bestResultMap.set(coordKey, r)
          return
        }
        if (!existing || !existing.found || (r.rank && (!existing.rank || r.rank < existing.rank))) {
          bestResultMap.set(coordKey, r)
        }
      })

      const bestIds = Array.from(bestResultMap.values()).map(r => r.id)
      const detailedResults = await prisma.scanResult.findMany({
        where: { id: { in: bestIds } },
        select: { id: true, competitorsJson: true, errorMessage: true }
      })
      const detailMap = new Map(detailedResults.map(d => [d.id, d]))

      const mergedResults = Array.from(bestResultMap.values()).sort((a, b) => {
        if (a.rowIndex !== b.rowIndex) return a.rowIndex - b.rowIndex
        return a.colIndex - b.colIndex
      }).map(r => {
        const detail = detailMap.get(r.id)
        return {
          ...r,
          competitors: detail?.competitorsJson ? JSON.parse(detail.competitorsJson) : [],
          error: detail?.errorMessage || null
        }
      })

      const analytics = calculateAnalytics(mergedResults)
      const allKeywords = await prisma.keyword.findMany({ where: { projectId } })
      const projectScans = await Promise.all(allKeywords.map(async (kw) => {
        const latestJob = await prisma.scanJob.findFirst({ where: { keywordId: kw.id }, orderBy: { createdAt: 'desc' } })
        return { keyword: kw.keyword, keywordId: kw.id, scanId: latestJob?.id || null, status: latestJob?.status || 'none', processedPoints: latestJob?.processedPoints || 0, totalPoints: latestJob?.totalPoints || 0 }
      }))

      // Aggregating top competitors
      const allCompetitors = new Map()
      mergedResults.forEach(r => {
        r.competitors.forEach(c => {
          if (!allCompetitors.has(c.placeId)) allCompetitors.set(c.placeId, { ...c, appearances: 0, totalRank: 0 })
          const comp = allCompetitors.get(c.placeId)
          comp.appearances++; comp.totalRank += c.rank
        })
      })
      const topCompetitors = Array.from(allCompetitors.values()).map(c => ({ ...c, avgRank: c.totalRank / c.appearances })).sort((a, b) => b.appearances - a.appearances).slice(0, 10)

      return handleCORS(NextResponse.json({ project, results: mergedResults, analytics, topCompetitors, projectScans }))
    }

    // ==================== DASHBOARD ROUTES ====================

    if (route === '/dashboard/stats' && method === 'GET') {
      const cacheKey = `user:stats:${currentUser.id}`
      if (redis) {
        try {
          const cached = await redis.get(cacheKey)
          if (cached) {
            return handleCORS(NextResponse.json(JSON.parse(cached)))
          }
        } catch (e) {
          console.warn('Redis Stats Get Error:', e)
        }
      }

      const totalProjects = await prisma.project.count({ where: { userId: currentUser.id } })

      // Fetch FRESH user from DB — session/JWT may be stale after admin credit updates
      const freshUser = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { credits: true, plan: true, planEndsAt: true, trialEndsAt: true, planStartedAt: true, stripeCustomerId: true }
      })

      // Get all project IDs for this user
      const userProjectIds = (await prisma.project.findMany({
        where: { userId: currentUser.id },
        select: { id: true }
      })).map(p => p.id)

      const totalScans = await prisma.scanJob.count({
        where: { projectId: { in: userProjectIds } }
      })

      const recentScanJobs = await prisma.scanJob.findMany({
        where: { projectId: { in: userProjectIds } },
        select: {
          id: true,
          projectId: true,
          keywordId: true,
          status: true,
          processedPoints: true,
          totalPoints: true,
          createdAt: true,
          completedAt: true
          // omit gridSize, spacingMeters, searchRadiusMeters, errorMessage for the condensed list
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })

      // Enrich each scan with project and keyword info
      const recentScans = await Promise.all(recentScanJobs.map(async (scan) => {
        const project = await prisma.project.findFirst({ where: { id: scan.projectId } })
        const keywordDoc = await prisma.keyword.findFirst({ where: { id: scan.keywordId } })
        return { ...scan, keyword: keywordDoc?.keyword, project }
      }))

      const statsResponse = { 
        totalProjects, 
        totalScans, 
        recentScans,
        user: {
          credits: freshUser?.credits ?? currentUser.credits,
          plan: freshUser?.plan ?? currentUser.plan,
          planEndsAt: freshUser?.planEndsAt ?? currentUser.planEndsAt,
          trialEndsAt: freshUser?.trialEndsAt ?? currentUser.trialEndsAt,
          planStartedAt: freshUser?.planStartedAt ?? currentUser.planStartedAt,
          stripeCustomerId: freshUser?.stripeCustomerId ?? currentUser.stripeCustomerId
        }
      }

      if (redis) {
        try {
          // Random TTL between 2-5 minutes (120-300 seconds)
          const randomTTL = Math.floor(Math.random() * 180) + 120
          await redis.set(cacheKey, JSON.stringify(statsResponse), 'EX', randomTTL)
        } catch (e) {
          console.warn('Redis Stats Set Error:', e)
        }
      }

      return handleCORS(NextResponse.json(statsResponse))
    }

    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Route ${route} not found` },
      { status: 404 }
    ))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    ))
  }
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
