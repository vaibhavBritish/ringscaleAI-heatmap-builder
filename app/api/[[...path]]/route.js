import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { searchBusinessByText, getPlaceDetails, searchKeywordAtPoint } from '@/lib/google-places'
import { generateGrid, calculateAnalytics } from '@/lib/grid-utils'
import { runScanJob } from '@/lib/scan-engine'
import { getDB } from '@/lib/mongodb'

// Removed redundant MongoClient import and connectToMongo function
// as we now use the shared getDB logic.

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// Get authenticated user
async function getAuthUser(request) {
  const session = await getServerSession(authOptions)
  return session?.user || null
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await getDB()

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

    // Register
    if (route === '/auth/register' && method === 'POST') {
      const body = await request.json()
      const { name, email, password } = body

      if (!email || !password) {
        return handleCORS(NextResponse.json({ error: 'Email and password are required' }, { status: 400 }))
      }

      const existingUser = await db.collection('users').findOne({ email: email.toLowerCase() })
      if (existingUser) {
        return handleCORS(NextResponse.json({ error: 'User already exists' }, { status: 400 }))
      }

      const hashedPassword = await bcrypt.hash(password, 10)
      const now = new Date()
      const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      const user = {
        id: uuidv4(),
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        password: hashedPassword,
        plan: 'trial',
        credits: 5000,
        trialEndsAt: trialEndsAt,
        createdAt: now,
        updatedAt: now
      }

      await db.collection('users').insertOne(user)

      return handleCORS(NextResponse.json({
        id: user.id,
        name: user.name,
        email: user.email
      }))
    }

    // Get current user
    if (route === '/auth/me' && method === 'GET') {
      const user = await getAuthUser(request)
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      return handleCORS(NextResponse.json(user))
    }

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

    // Helper to check if trial is expired
    const isTrialExpired = (user) => {
      if (!user) return false
      return user.plan === 'trial' && new Date(user.trialEndsAt) < new Date()
    }

    // Helper to verify project ownership
    const verifyProject = async (db, projectId, userId) => {
      const project = await db.collection('projects').findOne({ id: projectId, userId })
      return !!project
    }

    // Helper to verify scan ownership
    const verifyScan = async (db, scanId, userId) => {
      const scan = await db.collection('scan_jobs').findOne({ id: scanId })
      if (!scan) return false
      return verifyProject(db, scan.projectId, userId)
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
          // Extract error message from HTML/Text if possible
          const errorMsg = text.length > 500 ? `Status ${response.status}` : text
          return handleCORS(NextResponse.json({ error: `Google Map Error: ${errorMsg}`, status: response.status }, { status: response.status }))
        }

        const blob = await response.blob()
        const responseHeaders = new Headers()
        responseHeaders.set('Content-Type', response.headers.get('Content-Type') || 'image/png')
        responseHeaders.set('Cache-Control', 'public, max-age=3600')
        
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
      const body = await request.json()
      const { query } = body

      if (!query) {
        return handleCORS(NextResponse.json({ error: 'Query is required' }, { status: 400 }))
      }

      const results = await searchBusinessByText(query)
      return handleCORS(NextResponse.json({ results }))
    }

    // Get place details
    if (route === '/google/place-details' && method === 'POST') {
      const body = await request.json()
      const { placeId } = body

      if (!placeId) {
        return handleCORS(NextResponse.json({ error: 'Place ID are required' }, { status: 400 }))
      }

      const details = await getPlaceDetails(placeId)
      return handleCORS(NextResponse.json(details))
    }

    // Keyword suggestions
    if (route === '/google/keyword-suggestions' && method === 'GET') {
      const { searchParams } = new URL(request.url)
      const query = searchParams.get('q')

      if (!query) {
        return handleCORS(NextResponse.json({ results: [] }))
      }

      const { getQuerySuggestions } = require('@/lib/google-places')
      const results = await getQuerySuggestions(query)
      return handleCORS(NextResponse.json({ results }))
    }

    // ==================== PROJECT ROUTES ====================

    // List projects
    if (route === '/projects' && method === 'GET') {
      const projects = await db.collection('projects')
        .find({ userId: currentUser.id })
        .sort({ createdAt: -1 })
        .toArray()

      // Get keyword counts and latest scan for each project
      const enrichedProjects = await Promise.all(projects.map(async (project) => {
        const keywordCount = await db.collection('keywords').countDocuments({ projectId: project.id })
        const latestScan = await db.collection('scan_jobs')
          .findOne({ projectId: project.id }, { sort: { createdAt: -1 } })

        return {
          ...project,
          keywordCount,
          latestScanDate: latestScan?.createdAt || null,
          latestScanStatus: latestScan?.status || null
        }
      }))

      return handleCORS(NextResponse.json({ projects: enrichedProjects }))
    }

    // Create or update project
    if (route === '/projects' && method === 'POST') {
      const body = await request.json()
      const businessName = body.businessName || body.name
      const placeId = body.placeId || body.businessId
      const coordinates = body.coordinates || { lat: body.latitude, lng: body.longitude }
      const { address, primaryType, keywords = [], gridSettings } = body

      if (!businessName || !placeId) {
        return handleCORS(NextResponse.json({ error: 'Business name and place ID are required' }, { status: 400 }))
      }

      if (isTrialExpired(currentUser)) {
        return handleCORS(NextResponse.json({ 
          error: 'Trial expired. Please upgrade your plan to continue scanning.',
          code: 'TRIAL_EXPIRED'
        }, { status: 403 }))
      }

      // Check for existing project with this placeId for this user
      let project = await db.collection('projects').findOne({ 
        placeId, 
        userId: currentUser.id 
      })

      let projectId
      if (project) {
        projectId = project.id
        // Update existing project
        await db.collection('projects').updateOne(
          { id: projectId },
          { 
            $set: { 
              businessName,
              address: address || project.address,
              latitude: coordinates?.lat || project.latitude,
              longitude: coordinates?.lng || project.longitude,
              gridSettings: gridSettings || project.gridSettings,
              updatedAt: new Date()
            } 
          }
        )
        // Fetch the updated document
        project = await db.collection('projects').findOne({ id: projectId })
      } else {
        projectId = uuidv4()
        project = {
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
        await db.collection('projects').insertOne(project)
      }

      // Automatically add keywords and start scan jobs
      const scanJobIds = []
      if (keywords.length > 0) {
        // Credit check: 100 credits per keyword
        const creditsNeeded = keywords.length * 100
        const userDoc = await db.collection('users').findOne({ id: currentUser.id })
        if ((userDoc?.credits || 0) < creditsNeeded) {
          return handleCORS(NextResponse.json({ 
            error: `Not enough credits. You need ${creditsNeeded} credits for ${keywords.length} keyword(s). You have ${userDoc?.credits || 0}.`,
            creditsNeeded,
            creditsAvailable: userDoc?.credits || 0
          }, { status: 402 }))
        }

        let keywordsAdded = 0
        for (const kw of keywords) {
          // Check if keyword already exists for this project
          let kwDoc = await db.collection('keywords').findOne({ 
            projectId, 
            keyword: kw 
          })

          if (!kwDoc) {
            kwDoc = {
              id: uuidv4(),
              projectId: projectId,
              keyword: kw,
              createdAt: new Date(),
              updatedAt: new Date()
            }
            await db.collection('keywords').insertOne(kwDoc)
            keywordsAdded++
          }

          // Create a new scan job for this keyword
          const scanJobId = uuidv4()
          const scanJob = {
            id: scanJobId,
            projectId: projectId,
            keywordId: kwDoc.id,
            status: 'queued',
            processedPoints: 0,
            totalPoints: gridSettings?.density || 133,
            searchRadiusMeters: (gridSettings?.radius || 5) * 1000,
            createdAt: new Date(),
            startedAt: null,
            completedAt: null
          }
          await db.collection('scan_jobs').insertOne(scanJob)
          scanJobIds.push(scanJobId)
          
          // Trigger the job in background
          runScanJob(scanJobId).catch(err => console.error('Background scan error:', err))
        }

        // Deduct credits for newly added keywords only
        if (keywordsAdded > 0) {
          await db.collection('users').updateOne(
            { id: currentUser.id },
            { $inc: { credits: -(keywordsAdded * 100) } }
          )
        }
      }

      const updatedUser = await db.collection('users').findOne({ id: currentUser.id })
      return handleCORS(NextResponse.json({ project, scanJobIds, creditsRemaining: updatedUser?.credits || 0 }))
    }

    // Get single project
    const projectMatch = route.match(/^\/projects\/([^/]+)$/)
    if (projectMatch && method === 'GET') {
      const projectId = projectMatch[1]
      const project = await db.collection('projects').findOne({ id: projectId, userId: currentUser.id })

      if (!project) {
        return handleCORS(NextResponse.json({ error: 'Project not found' }, { status: 404 }))
      }

      const keywords = await db.collection('keywords').find({ projectId }).toArray()
      const scans = await db.collection('scan_jobs')
        .find({ projectId })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray()

      return handleCORS(NextResponse.json({ project, keywords, scans }))
    }

    // Delete project
    if (projectMatch && method === 'DELETE') {
      const projectId = projectMatch[1]
      await db.collection('projects').deleteOne({ id: projectId, userId: currentUser.id })
      await db.collection('keywords').deleteMany({ projectId })
      await db.collection('scan_jobs').deleteMany({ projectId })
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ==================== KEYWORD ROUTES ====================

    // List keywords for project
    const keywordsMatch = route.match(/^\/projects\/([^/]+)\/keywords$/)
    if (keywordsMatch && method === 'GET') {
      const projectId = keywordsMatch[1]
      if (!(await verifyProject(db, projectId, currentUser.id))) {
        return handleCORS(NextResponse.json({ error: 'Project not found' }, { status: 404 }))
      }

      const keywords = await db.collection('keywords')
        .find({ projectId })
        .sort({ createdAt: -1 })
        .toArray()
      return handleCORS(NextResponse.json({ keywords }))
    }

    // Create keyword
    if (keywordsMatch && method === 'POST') {
      const projectId = keywordsMatch[1]
      if (!(await verifyProject(db, projectId, currentUser.id))) {
        return handleCORS(NextResponse.json({ error: 'Project not found' }, { status: 404 }))
      }

      const body = await request.json()
      const { keyword } = body

      if (!keyword) {
        return handleCORS(NextResponse.json({ error: 'Keyword is required' }, { status: 400 }))
      }

      // Check for existing keyword in this project (case-insensitive)
      const existingKeyword = await db.collection('keywords').findOne({
        projectId,
        keyword: { $regex: new RegExp(`^${keyword.trim()}$`, 'i') }
      })

      if (existingKeyword) {
        // Existing keyword — no charge
        const userDoc = await db.collection('users').findOne({ id: currentUser.id })
        return handleCORS(NextResponse.json({ ...existingKeyword, creditsRemaining: userDoc?.credits || 0 }))
      }

      // Credit check: 100 credits per new keyword
      const KEYWORD_COST = 100
      const userDoc = await db.collection('users').findOne({ id: currentUser.id })
      const currentCredits = userDoc?.credits || 0

      if (currentCredits < KEYWORD_COST) {
        return handleCORS(NextResponse.json({ 
          error: `Not enough credits. Adding a keyword costs ${KEYWORD_COST} credits. You have ${currentCredits}.`,
          creditsRemaining: currentCredits,
          creditsNeeded: KEYWORD_COST
        }, { status: 402 }))
      }

      const keywordDoc = {
        id: uuidv4(),
        projectId,
        keyword,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('keywords').insertOne(keywordDoc)

      // Deduct credits
      await db.collection('users').updateOne(
        { id: currentUser.id },
        { $inc: { credits: -KEYWORD_COST } }
      )

      const updatedUser = await db.collection('users').findOne({ id: currentUser.id })

      return handleCORS(NextResponse.json({ 
        ...keywordDoc, 
        creditsDeducted: KEYWORD_COST,
        creditsRemaining: updatedUser?.credits || 0
      }))
    }

    // Delete keyword
    const keywordDeleteMatch = route.match(/^\/keywords\/([^/]+)$/)
    if (keywordDeleteMatch && method === 'DELETE') {
      const keywordId = keywordDeleteMatch[1]
      const keywordDoc = await db.collection('keywords').findOne({ id: keywordId })
      if (!keywordDoc || !(await verifyProject(db, keywordDoc.projectId, currentUser.id))) {
        return handleCORS(NextResponse.json({ error: 'Keyword not found' }, { status: 404 }))
      }
      await db.collection('keywords').deleteOne({ id: keywordId })
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ==================== SCAN ROUTES ====================

    // Create scan job(s)
    if (route === '/scans' && method === 'POST') {
      const body = await request.json()
      const { projectId, keywordId, keywordIds, gridSize = 3, spacingMeters = 1000, searchRadiusMeters = 5000 } = body

      if (!projectId || (!keywordId && (!keywordIds || !keywordIds.length))) {
        return handleCORS(NextResponse.json({ error: 'Project ID and keyword ID(s) are required' }, { status: 400 }))
      }

      if (!(await verifyProject(db, projectId, currentUser.id))) {
        return handleCORS(NextResponse.json({ error: 'Project not found' }, { status: 404 }))
      }

      if (isTrialExpired(currentUser)) {
        return handleCORS(NextResponse.json({ 
          error: 'Trial expired. Please upgrade your plan to continue scanning.',
          code: 'TRIAL_EXPIRED'
        }, { status: 403 }))
      }

      const idsToProcess = keywordIds || [keywordId]
      const scanJobs = []

      for (const id of idsToProcess) {
        const scanJob = {
          id: uuidv4(),
          projectId,
          keywordId: id,
          status: 'queued',
          gridSize,
          spacingMeters,
          searchRadiusMeters,
          processedPoints: 0,
          totalPoints: gridSize * gridSize,
          createdAt: new Date(),
          startedAt: null,
          completedAt: null
        }
        
        await db.collection('scan_jobs').insertOne(scanJob)
        // Start scan in background (async)
        runScanJob(scanJob.id).catch(err => console.error('Background scan error:', err))
        scanJobs.push(scanJob)
      }

      return handleCORS(NextResponse.json(scanJobs.length === 1 ? scanJobs[0] : { success: true, count: scanJobs.length, scans: scanJobs }))
    }

    // Cancel scan job
    const scanCancelMatch = route.match(/^\/scans\/([^/]+)\/cancel$/)
    if (scanCancelMatch && method === 'POST') {
      const scanJobId = scanCancelMatch[1]
      if (!(await verifyScan(db, scanJobId, currentUser.id))) {
        return handleCORS(NextResponse.json({ error: 'Scan not found' }, { status: 404 }))
      }
      await db.collection('scan_jobs').updateOne(
        { id: scanJobId },
        { 
          $set: { 
            status: 'cancelled',
            completedAt: new Date()
          } 
        }
      )
      return handleCORS(NextResponse.json({ success: true }))
    }

    // Get scan job status
    const scanStatusMatch = route.match(/^\/scans\/([^/]+)$/)
    if (scanStatusMatch && method === 'GET') {
      const scanId = scanStatusMatch[1]
      const scanJob = await db.collection('scan_jobs').findOne({ id: scanId })

      if (!scanJob || !(await verifyProject(db, scanJob.projectId, currentUser.id))) {
        return handleCORS(NextResponse.json({ error: 'Scan job not found' }, { status: 404 }))
      }

      return handleCORS(NextResponse.json(scanJob))
    }

    // Get scan results
    const scanResultsMatch = route.match(/^\/scans\/([^/]+)\/results$/)
    if (scanResultsMatch && method === 'GET') {
      const scanId = scanResultsMatch[1]
      
      const scanJob = await db.collection('scan_jobs').findOne({ id: scanId })
      if (!scanJob || !(await verifyProject(db, scanJob.projectId, currentUser.id))) {
        return handleCORS(NextResponse.json({ error: 'Scan job not found' }, { status: 404 }))
      }

      const urlObj = new URL(request.url)
      const isAggregate = urlObj.searchParams.get('aggregate') === 'true'
      
      const project = await db.collection('projects').findOne({ id: scanJob.projectId })
      const keyword = await db.collection('keywords').findOne({ id: scanJob.keywordId })
      
      const scanPoints = await db.collection('scan_points')
        .find({ scanJobId: scanId })
        .sort({ rowIndex: 1, colIndex: 1 })
        .toArray()

      let mergedResults = []

      if (isAggregate) {
        // Fetch ALL results for ALL scan jobs in this project to show aggregate progress
        const allProjectScanJobIds = (await db.collection('scan_jobs').find({ projectId: scanJob.projectId }).toArray()).map(j => j.id)
        const allResults = await db.collection('scan_results')
          .find({ scanJobId: { $in: allProjectScanJobIds } })
          .toArray()

        const allProjectPoints = await db.collection('scan_points')
          .find({ scanJobId: { $in: allProjectScanJobIds } })
          .toArray()
        const projectPointToCoord = new Map(allProjectPoints.map(p => [p.id, `${p.rowIndex},${p.colIndex}`]))

        // Aggregate: Group results by coordinate and pick Best Rank
        const aggregatedMap = new Map()
        allResults.forEach(r => {
          const coord = projectPointToCoord.get(r.scanPointId)
          if (!coord) return
          const existing = aggregatedMap.get(coord)
          if (!r.found && (!existing || !existing.found)) {
            if (!existing) aggregatedMap.set(coord, { ...r, found: false, rank: null })
            return
          }
          if (!existing || !existing.found || (r.rank && (!existing.rank || r.rank < existing.rank))) {
            aggregatedMap.set(coord, r)
          }
        })

        mergedResults = scanPoints.map(point => {
          const coord = `${point.rowIndex},${point.colIndex}`
          const bestResult = aggregatedMap.get(coord) || {}
          return {
            ...point,
            found: bestResult.found || false,
            rank: bestResult.rank || null,
            competitors: bestResult.competitorsJson ? JSON.parse(bestResult.competitorsJson) : [],
            rawResults: bestResult.rawResultsJson ? JSON.parse(bestResult.rawResultsJson) : [],
            error: bestResult.errorMessage || null
          }
        })
      } else {
        // Standard single-scan result
        const scanResults = await db.collection('scan_results')
          .find({ scanJobId: scanId })
          .toArray()

        const resultsMap = new Map(scanResults.map(r => [r.scanPointId, r]))
        mergedResults = scanPoints.map(point => {
          const result = resultsMap.get(point.id) || {}
          return {
            ...point,
            found: result.found || false,
            rank: result.rank || null,
            competitors: result.competitorsJson ? JSON.parse(result.competitorsJson) : [],
            rawResults: result.rawResultsJson ? JSON.parse(result.rawResultsJson) : [],
            error: result.errorMessage || null
          }
        })
      }

      const analytics = calculateAnalytics(mergedResults)

      // Get all keywords for this project with their latest scans
      const allKeywords = await db.collection('keywords').find({ projectId: scanJob.projectId }).toArray()
      const projectScans = await Promise.all(allKeywords.map(async (kw) => {
        const latestJob = await db.collection('scan_jobs')
          .findOne({ keywordId: kw.id }, { sort: { createdAt: -1 } })
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
            allCompetitors.set(c.placeId, { ...c, appearances: 0 })
          }
          allCompetitors.get(c.placeId).appearances++
        })
      })
      const topCompetitors = Array.from(allCompetitors.values())
        .sort((a, b) => b.appearances - a.appearances)
        .slice(0, 10)

      return handleCORS(NextResponse.json({
        scanJob,
        project,
        keyword,
        results: mergedResults,
        analytics,
        topCompetitors,
        projectScans
      }))
    }
    
    // Rescan project keyword
    if (route === '/scans/rescan' && method === 'POST') {
      const body = await request.json()
      const { projectId, keywordId } = body
      
      if (!projectId || !keywordId) {
        return handleCORS(NextResponse.json({ error: 'Project ID and Keyword ID are required' }, { status: 400 }))
      }
      
      if (isTrialExpired(currentUser)) {
        return handleCORS(NextResponse.json({ 
          error: 'Trial expired. Please upgrade your plan to continue scanning.',
          code: 'TRIAL_EXPIRED'
        }, { status: 403 }))
      }
      
      const project = await db.collection('projects').findOne({ id: projectId, userId: currentUser.id })
      if (!project) {
        return handleCORS(NextResponse.json({ error: 'Project not found' }, { status: 404 }))
      }
      
      const scanJobId = uuidv4()
      const scanJob = {
        id: scanJobId,
        projectId: projectId,
        keywordId: keywordId,
        status: 'queued',
        processedPoints: 0,
        totalPoints: project.gridSettings?.density || 133,
        searchRadiusMeters: (project.gridSettings?.radius || 5) * 1000,
        createdAt: new Date(),
        startedAt: null,
        completedAt: null
      }
      
      await db.collection('scan_jobs').insertOne(scanJob)
      
      // Trigger background worker
      runScanJob(scanJobId).catch(err => console.error('Rescan error:', err))
      
      return handleCORS(NextResponse.json({ success: true, scanJobId }))
    }

    // List scan history for project
    const scanHistoryMatch = route.match(/^\/projects\/([^/]+)\/scans$/)
    if (scanHistoryMatch && method === 'GET') {
      const projectId = scanHistoryMatch[1]
      if (!(await verifyProject(db, projectId, currentUser.id))) {
        return handleCORS(NextResponse.json({ error: 'Project not found' }, { status: 404 }))
      }
      const scans = await db.collection('scan_jobs')
        .find({ projectId })
        .sort({ createdAt: -1 })
        .toArray()

      // Enrich with keyword info and basic analytics
      const enrichedScans = await Promise.all(scans.map(async (scan) => {
        const keyword = await db.collection('keywords').findOne({ id: scan.keywordId })
        const results = await db.collection('scan_results').find({ scanJobId: scan.id }).toArray()
        const analytics = calculateAnalytics(results.map(r => ({ found: r.found, rank: r.rank })))

        return {
          ...scan,
          keyword: keyword?.keyword || 'Unknown',
          analytics
        }
      }))

      return handleCORS(NextResponse.json({ scans: enrichedScans }))
    }

    // ==================== DASHBOARD ROUTES ====================

    if (route === '/dashboard/stats' && method === 'GET') {
      const totalProjects = await db.collection('projects').countDocuments({ userId: currentUser.id })
      
      const scanCountResult = await db.collection('scan_jobs').aggregate([
        { $lookup: { from: 'projects', localField: 'projectId', foreignField: 'id', as: 'project' } },
        { $unwind: '$project' },
        { $match: { 'project.userId': currentUser.id } },
        { $group: { _id: null, total: { $sum: 1 } } }
      ]).toArray()
      const totalScans = scanCountResult[0]?.total || 0
      
      const recentScans = await db.collection('scan_jobs')
        .aggregate([
          { $lookup: { from: 'projects', localField: 'projectId', foreignField: 'id', as: 'project' } },
          { $unwind: { path: '$project', preserveNullAndEmptyArrays: true } },
          { $lookup: { from: 'keywords', localField: 'keywordId', foreignField: 'id', as: 'keywordDoc' } },
          { $unwind: { path: '$keywordDoc', preserveNullAndEmptyArrays: true } },
          { $match: { 'project.userId': currentUser.id } },
          { $sort: { createdAt: -1 } },
          { $limit: 10 },
          { $addFields: { keyword: '$keywordDoc.keyword' } }
        ])
        .toArray()

      return handleCORS(NextResponse.json({
        totalProjects,
        totalScans,
        recentScans
      }))
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
