import { v4 as uuidv4 } from 'uuid'
import prisma from './prisma'
import { generateHeatmapGrid } from './heatmap-utils'
import { searchKeywordAtPoint } from './google-places'
import redis from './redis'

// Process a single scan point
async function processScanPoint(point, keyword, targetPlaceId, searchRadius, skipCache = false) {
  try {
    // 1. Point Caching Logic
    // Round to 4 decimal places (approx 11m precision) to increase cache hits
    const lat = parseFloat(point.latitude.toFixed(4))
    const lng = parseFloat(point.longitude.toFixed(4))
    const cacheKey = `scan:point:${keyword.toLowerCase().trim()}:${lat}:${lng}`
    
    if (redis && !skipCache) {
      try {
        const cached = await redis.get(cacheKey)
        if (cached) {
          console.log(`[Scan Engine] 🎯 Cache Hit for "${keyword}": (${lat}, ${lng}) - 0 Google API calls used`)
          const results = JSON.parse(cached)
          const targetIndex = results.findIndex(r => r.placeId === targetPlaceId)
          const found = targetIndex !== -1
          const rank = found ? targetIndex + 1 : null
          
          return {
            found,
            rank,
            competitors: results.filter(r => r.placeId !== targetPlaceId).slice(0, 5),
            rawResults: results.slice(0, 10),
            error: null,
            fromCache: true
          }
        }
      } catch (e) {
        console.warn('Redis Cache Read Error:', e)
      }
    }

    // 2. Fetch from Google if not cached
    const results = await searchKeywordAtPoint(
      keyword,
      point.latitude,
      point.longitude,
      searchRadius
    )

    // 3. Save to Cache (Expires in 7 days to reduce API billing)
    if (redis && results.length > 0) {
      try {
        await redis.set(cacheKey, JSON.stringify(results), 'EX', 604800)
      } catch (e) {
        console.warn('Redis Cache Write Error:', e)
      }
    }

    // Find target business in results
    const targetIndex = results.findIndex(r => r.placeId === targetPlaceId)
    const found = targetIndex !== -1
    const rank = found ? targetIndex + 1 : null

    // Get top 5 competitors (excluding target if found)
    const competitors = results
      .filter(r => r.placeId !== targetPlaceId)
      .slice(0, 5)
      .map(r => ({
        placeId: r.placeId,
        name: r.name,
        address: r.address,
        rank: r.rank,
        rating: r.rating,
        reviewCount: r.reviewCount
      }))

    return {
      found,
      rank,
      competitors,
      rawResults: results.slice(0, 10),
      error: null
    }
  } catch (error) {
    console.error(`Error processing point (${point.row}, ${point.col}):`, error)
    if (error.message === 'DAILY_QUOTA_REACHED') {
      return {
        found: false,
        rank: null,
        competitors: [],
        rawResults: [],
        error: 'Daily Google API limit reached. Scans are paused to prevent billing.'
      }
    }
    return {
      found: false,
      rank: null,
      competitors: [],
      rawResults: [],
      error: error.message
    }
  }
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2-lat1) * Math.PI / 180;
  const dLon = (lon2-lon1) * Math.PI / 180; 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

function generateMockResult(point, project, greenPinPercentage, realCompetitors = []) {
  const distance = getDistanceFromLatLonInKm(
    project.latitude,
    project.longitude,
    point.latitude,
    point.longitude
  );

  const rawRadius = project.gridSettings?.radius || 5;
  const unit = project.gridSettings?.unit || 'km';
  const radiusInKm = unit === 'mi' ? rawRadius * 1.60934 : rawRadius;

  // Green Zone Radius: linear threshold based on percentage
  const greenRadius = radiusInKm * (greenPinPercentage / 100);

  let rank;
  if (distance <= greenRadius) {
    rank = Math.floor(Math.random() * 3) + 1;
  } else {
    const ratio = (distance - greenRadius) / Math.max(0.001, radiusInKm - greenRadius);
    const minRank = 4;
    const maxRank = 20;
    rank = Math.floor(minRank + (ratio * (maxRank - minRank)) + (Math.random() * 3 - 1));
    rank = Math.max(4, Math.min(20, rank));
  }

  // Use real competitors if provided, fallback to mock names but keep the structure
  const baseCompetitors = realCompetitors.length > 0 
    ? realCompetitors 
    : [
        { placeId: 'mock-1', name: 'Competitor A', address: '123 Fake St', rating: 4.5, reviewCount: 120 },
        { placeId: 'mock-2', name: 'Competitor B', address: '456 Mock Rd', rating: 4.2, reviewCount: 85 },
        { placeId: 'mock-3', name: 'Competitor C', address: '789 Test Ave', rating: 4.0, reviewCount: 50 },
        { placeId: 'mock-4', name: 'Competitor D', address: '101 Error Ln', rating: 3.8, reviewCount: 30 },
        { placeId: 'mock-5', name: 'Competitor E', address: '202 Bug Blvd', rating: 3.5, reviewCount: 15 }
      ];

  const adjustedCompetitors = baseCompetitors.map((c, i) => {
    let cRank = i + 1;
    if (cRank >= rank) cRank += 1;
    return { ...c, rank: cRank };
  });

  return {
    found: true,
    rank,
    competitors: adjustedCompetitors.slice(0, 5),
    rawResults: adjustedCompetitors,
    error: null
  };
}

// Run a complete scan job
export async function runScanJob(scanJobId, options = {}) {
  const { skipCache = false } = options;
  try {
    // Get scan job details
    const scanJob = await prisma.scanJob.findUnique({ where: { id: scanJobId } })
    if (!scanJob) {
      throw new Error('Scan job not found')
    }

    // Update status to processing
    await prisma.scanJob.update({
      where: { id: scanJobId },
      data: { status: 'processing', startedAt: new Date() }
    })

    // Invalidate dashboard stats for the user
    if (redis) {
      try {
        const project = await prisma.project.findUnique({ where: { id: scanJob.projectId } })
        if (project) {
          await redis.del(`user:stats:${project.userId}`)
        }
      } catch (e) {
        console.warn('Redis Stats Invalidation Error:', e)
      }
    }

    // Get project and keyword
    const project = await prisma.project.findUnique({ where: { id: scanJob.projectId } })
    const keyword = await prisma.keyword.findUnique({ where: { id: scanJob.keywordId } })
    const user = project ? await prisma.user.findUnique({ where: { id: project.userId } }) : null

    if (!project || !keyword) {
      throw new Error('Project or keyword not found')
    }

    const searchRadiusMeters = scanJob.searchRadiusMeters || (project.gridSettings?.radius || 5) * 1000

    // Fetch real competitors once if it's a mock scan to provide "real time" feel
    let realCompetitors = []
    // Extract isMock safely from gridSettings which might be a string or object
    const gridSettings = typeof project.gridSettings === 'string' ? JSON.parse(project.gridSettings) : project.gridSettings
    const isMock = gridSettings?.isMock === true
    
    if (isMock) {
      console.log(`[Mock Scan Debug] Starting discovery for job ${scanJobId}`)
      const greenPinPercentage = gridSettings?.greenPinPercentage || 50
      console.log(`[Mock Scan Debug] Green Pin Percentage: ${greenPinPercentage}%`)
      const apiKey = process.env.GOOGLE_API_KEY || "";
      console.log(`[Mock Scan Debug] API Key configured: ${!!apiKey}`)
      
      try {
        const radius = Math.max(5000, searchRadiusMeters)
        let results = []

        // Try 1: searchKeywordAtPoint
        console.log(`[Mock Scan Debug] Try 1: searchKeywordAtPoint...`)
        try {
          results = await searchKeywordAtPoint(
            keyword.keyword,
            project.latitude,
            project.longitude,
            radius
          )
        } catch (err) {
          console.error(`[Mock Scan Debug] Try 1 failed: ${err.message}`)
        }
        
        // Try 2: searchBusinessByText with keyword
        if (!results || results.length === 0) {
          console.log(`[Mock Scan Debug] Try 2: searchBusinessByText with keyword...`)
          try {
            results = await searchBusinessByText(`${keyword.keyword} near ${project.address || project.businessName}`)
          } catch (err) {
            console.error(`[Mock Scan Debug] Try 2 failed: ${err.message}`)
          }
        }

        // Try 3: getNearbyCompetitors by primaryType
        if ((!results || results.length === 0) && project.primaryType) {
          console.log(`[Mock Scan Debug] Try 3: getNearbyCompetitors by type "${project.primaryType}"...`)
          try {
            results = await getNearbyCompetitors(project.latitude, project.longitude, project.primaryType, project.placeId)
          } catch (err) {
            console.error(`[Mock Scan Debug] Try 3 failed: ${err.message}`)
          }
        }

        // Try 4: Last resort - search for the business name itself to get *something*
        if (!results || results.length === 0) {
          console.log(`[Mock Scan Debug] Try 4: Search for business name fallback...`)
          try {
            results = await searchBusinessByText(project.businessName)
          } catch (err) {
            console.error(`[Mock Scan Debug] Try 4 failed: ${err.message}`)
          }
        }

        realCompetitors = (results || [])
          .filter(r => r.placeId !== project.placeId)
          .slice(0, 10)
          .map(r => ({
            placeId: r.placeId || `mock-${Math.random().toString(36).substr(2, 9)}`,
            name: r.name || 'Unknown Competitor',
            address: r.address || '',
            rating: r.rating || (3.5 + Math.random() * 1.5).toFixed(1),
            reviewCount: r.reviewCount || Math.floor(Math.random() * 100) + 10
          }))
        
        console.log(`[Mock Scan Debug] Final Result: ${realCompetitors.length} competitors found`)
        if (realCompetitors.length > 0) {
          console.log(`[Mock Scan Debug] First Competitor: ${realCompetitors[0].name}`)
        }
      } catch (e) {
        console.error('[Mock Scan Debug] UNHANDLED ERROR:', e)
      }
    }

    // Generate grid points using the same logic as the UI (respecting miles/km)
    const rawRadius = gridSettings?.radius || 5
    const unit = gridSettings?.unit || 'km'
    const radiusInKm = unit === 'mi' ? rawRadius * 1.60934 : rawRadius

    const gridPoints = generateHeatmapGrid(
      { lat: project.latitude, lng: project.longitude },
      gridSettings?.shape || 'circle',
      gridSettings?.density || 133,
      radiusInKm
    )

    // Update totalPoints in case it was estimated differently
    await prisma.scanJob.update({
      where: { id: scanJobId },
      data: { totalPoints: gridPoints.length }
    })

    // NEW SLIM STRUCTURE: No more scan_points table creation. 
    // We save coordinates directly into scan_results.
    let processedCount = 0
    let errorOccurred = false
    
    try {
      const BATCH_SIZE = 3
      for (let i = 0; i < gridPoints.length; i += BATCH_SIZE) {
        // 1. Check Quota before starting a new batch (Efficiency)
        try {
          const { checkQuota } = await import('./google-places')
          await checkQuota()
        } catch (quotaError) {
          if (quotaError.message === 'DAILY_QUOTA_REACHED') throw quotaError
        }

        // Check for cancellation once per batch
        const currentJob = await prisma.scanJob.findUnique({ where: { id: scanJobId } })
        if (currentJob?.status === 'cancelled') {
          //console.log(`Scan job ${scanJobId} was cancelled by user. Stopping.`)
          return { success: false, error: 'Cancelled' }
        }

        const batch = gridPoints.slice(i, i + BATCH_SIZE)
        
        await Promise.all(batch.map(async (point) => {
          try {
            let result;
            const gridSettings = typeof project.gridSettings === 'string' ? JSON.parse(project.gridSettings) : project.gridSettings
            const isMock = gridSettings?.isMock === true;
            
            if (isMock) {
              result = generateMockResult(
                { latitude: point.latitude, longitude: point.longitude, row: point.row, col: point.col },
                project,
                gridSettings?.greenPinPercentage || 50,
                realCompetitors
              );
            } else {
              result = await processScanPoint(
                { latitude: point.latitude, longitude: point.longitude, row: point.row, col: point.col },
                keyword.keyword,
                project.placeId,
                searchRadiusMeters,
                skipCache
              );
            }

            const scanResult = {
              id: uuidv4(),
              scanJobId,
              scanPointId: null, // Legacy field
              rowIndex: point.row,
              colIndex: point.col,
              latitude: point.latitude,
              longitude: point.longitude,
              found: result.found,
              rank: result.rank,
              competitorsJson: JSON.stringify(result.competitors),
              rawResultsJson: JSON.stringify(result.rawResults),
              errorMessage: result.error,
              createdAt: new Date()
            }

            await prisma.scanResult.create({ data: scanResult })
          } catch (pointError) {
            if (pointError.message === 'DAILY_QUOTA_REACHED') {
              // Re-throw to be caught by the outer loop and terminate the job
              throw pointError
            }

            console.error(`Error processing point at (${point.row}, ${point.col}) in job ${scanJobId}:`, pointError)
            await prisma.scanResult.create({
              data: {
                id: uuidv4(),
                scanJobId,
                rowIndex: point.row,
                colIndex: point.col,
                latitude: point.latitude,
                longitude: point.longitude,
                found: false,
                rank: null,
                errorMessage: pointError.message,
                createdAt: new Date()
              }
            })
          }
        }))

        processedCount += batch.length

        // Update progress once per batch
        await prisma.scanJob.update({
          where: { id: scanJobId },
          data: { processedPoints: processedCount }
        })

        // Small delay between batches to avoid rate limiting
        if (i + BATCH_SIZE < gridPoints.length) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    } catch (loopError) {
      console.error(`Fatal error in scan job ${scanJobId} loop:`, loopError)
      errorOccurred = true
      throw loopError
    }

    // Mark job as completed ONLY if no fatal error occurred
    if (!errorOccurred) {
      await prisma.scanJob.update({
        where: { id: scanJobId },
        data: { status: 'completed', completedAt: new Date() }
      })

      // CRITICAL: If this is a mock/random scan, we MUST delete any existing audit report
      // so the user sees the new mock results immediately in the "Full Report"
      const gridSettings = typeof project.gridSettings === 'string' ? JSON.parse(project.gridSettings) : project.gridSettings
      if (gridSettings?.isMock) {
        console.log(`[Mock Scan Debug] Clearing stale audit for project ${project.id}`)
        await prisma.businessAudit.deleteMany({ where: { projectId: project.id } })
      }
    }

    // Invalidate caches
    if (redis) {
      try {
        await redis.del(`scan:results:${scanJobId}`)
        await redis.del(`scan:results:${scanJobId}:aggregate`)
        const proj = await prisma.project.findUnique({ where: { id: scanJob.projectId } })
        if (proj) await redis.del(`user:stats:${proj.userId}`)
      } catch (e) {
        console.warn('Redis Invalidation Error:', e)
      }
    }

    return { success: true, resultsCount: processedCount }
  } catch (error) {
    console.error('Scan job error final catch:', error)

    try {
      await prisma.scanJob.update({
        where: { id: scanJobId },
        data: {
          status: 'failed',
          errorMessage: error.message,
          completedAt: new Date()
        }
      })
    } catch (updateError) {
      console.error('Failed to mark scan job as failed:', updateError)
    }

    return { success: false, error: error.message }
  }
}
