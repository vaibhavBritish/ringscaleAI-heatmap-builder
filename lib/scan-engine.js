import { v4 as uuidv4 } from 'uuid'
import prisma from './prisma'
import { generateHeatmapGrid } from './heatmap-utils'
import { searchKeywordAtPoint } from './google-places'
import redis from './redis'

// Process a single scan point
async function processScanPoint(point, keyword, targetPlaceId, searchRadius) {
  try {
    const results = await searchKeywordAtPoint(
      keyword,
      point.latitude,
      point.longitude,
      searchRadius
    )

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
    return {
      found: false,
      rank: null,
      competitors: [],
      rawResults: [],
      error: error.message
    }
  }
}

// Run a complete scan job
export async function runScanJob(scanJobId) {
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

    if (!project || !keyword) {
      throw new Error('Project or keyword not found')
    }

    const searchRadiusMeters = scanJob.searchRadiusMeters || (project.gridSettings?.radius || 5) * 1000

    // Generate grid points using the same logic as the UI (respecting miles/km)
    const rawRadius = project.gridSettings?.radius || 5
    const unit = project.gridSettings?.unit || 'km'
    const radiusInKm = unit === 'mi' ? rawRadius * 1.60934 : rawRadius

    const gridPoints = generateHeatmapGrid(
      { lat: project.latitude, lng: project.longitude },
      project.gridSettings?.shape || 'circle',
      project.gridSettings?.density || 133,
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
        // Check for cancellation once per batch
        const currentJob = await prisma.scanJob.findUnique({ where: { id: scanJobId } })
        if (currentJob?.status === 'cancelled') {
          //console.log(`Scan job ${scanJobId} was cancelled by user. Stopping.`)
          return { success: false, error: 'Cancelled' }
        }

        const batch = gridPoints.slice(i, i + BATCH_SIZE)
        
        await Promise.all(batch.map(async (point) => {
          try {
            const result = await processScanPoint(
              { latitude: point.latitude, longitude: point.longitude, row: point.row, col: point.col },
              keyword.keyword,
              project.placeId,
              searchRadiusMeters
            )

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
