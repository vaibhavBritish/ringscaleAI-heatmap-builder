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

    // Generate grid points using the same logic as the UI
    const gridPoints = generateHeatmapGrid(
      { lat: project.latitude, lng: project.longitude },
      project.gridSettings?.shape || 'circle',
      project.gridSettings?.density || 133,
      project.gridSettings?.radius || 5
    )

    // Update totalPoints in case it was estimated differently
    await prisma.scanJob.update({
      where: { id: scanJobId },
      data: { totalPoints: gridPoints.length }
    })

    // Save scan points
    const scanPoints = gridPoints.map((point) => ({
      id: uuidv4(),
      scanJobId,
      rowIndex: point.row || 0,
      colIndex: point.col || 0,
      latitude: point.latitude,
      longitude: point.longitude,
      createdAt: new Date()
    }))

    await prisma.scanPoint.createMany({ data: scanPoints })

    // Process each point
    const results = []
    for (const point of scanPoints) {
      // Check for cancellation
      const currentJob = await prisma.scanJob.findUnique({ where: { id: scanJobId } })
      if (currentJob?.status === 'cancelled') {
        console.log(`Scan job ${scanJobId} was cancelled by user. Stopping.`)
        return { success: false, error: 'Cancelled' }
      }

      const result = await processScanPoint(
        { latitude: point.latitude, longitude: point.longitude, row: point.rowIndex, col: point.colIndex },
        keyword.keyword,
        project.placeId,
        searchRadiusMeters
      )

      const scanResult = {
        id: uuidv4(),
        scanPointId: point.id,
        scanJobId,
        found: result.found,
        rank: result.rank,
        competitorsJson: JSON.stringify(result.competitors),
        rawResultsJson: JSON.stringify(result.rawResults),
        errorMessage: result.error,
        createdAt: new Date()
      }

      await prisma.scanResult.create({ data: scanResult })
      results.push(scanResult)

      // Update progress
      await prisma.scanJob.update({
        where: { id: scanJobId },
        data: { processedPoints: results.length }
      })

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    // Mark job as completed
    await prisma.scanJob.update({
      where: { id: scanJobId },
      data: { status: 'completed', completedAt: new Date() }
    })

    // Invalidate caches
    if (redis) {
      try {
        // Invalidate specific results
        await redis.del(`scan:results:${scanJobId}`)
        await redis.del(`scan:results:${scanJobId}:aggregate`)
        // Invalidate dashboard stats again to show completed status
        const project = await prisma.project.findUnique({ where: { id: scanJob.projectId } })
        if (project) {
          await redis.del(`user:stats:${project.userId}`)
        }
      } catch (e) {
        console.warn('Redis Invalidation Error:', e)
      }
    }

    return { success: true, resultsCount: results.length }
  } catch (error) {
    console.error('Scan job error:', error)

    await prisma.scanJob.update({
      where: { id: scanJobId },
      data: {
        status: 'failed',
        errorMessage: error.message,
        completedAt: new Date()
      }
    })

    return { success: false, error: error.message }
  }
}
