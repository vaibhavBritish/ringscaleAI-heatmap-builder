import { v4 as uuidv4 } from 'uuid'
import { getDB } from './mongodb'
import { generateHeatmapGrid } from './heatmap-utils'
import { searchKeywordAtPoint } from './google-places'

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
  const db = await getDB()
  
  try {
    // Get scan job details
    const scanJob = await db.collection('scan_jobs').findOne({ id: scanJobId })
    if (!scanJob) {
      throw new Error('Scan job not found')
    }
    
    // Update status to processing
    await db.collection('scan_jobs').updateOne(
      { id: scanJobId },
      { 
        $set: { 
          status: 'processing',
          startedAt: new Date()
        } 
      }
    )
    
    // Get project and keyword
    const project = await db.collection('projects').findOne({ id: scanJob.projectId })
    const keyword = await db.collection('keywords').findOne({ id: scanJob.keywordId })
    
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
    await db.collection('scan_jobs').updateOne(
      { id: scanJobId },
      { $set: { totalPoints: gridPoints.length } }
    )
    
    // Save scan points
    const scanPoints = gridPoints.map((point, index) => ({
      id: uuidv4(),
      scanJobId,
      rowIndex: point.row || 0,
      colIndex: point.col || 0,
      latitude: point.latitude,
      longitude: point.longitude,
      createdAt: new Date()
    }))
    
    await db.collection('scan_points').insertMany(scanPoints)
    
    // Process each point
    const results = []
    for (const point of scanPoints) {
      // Check for cancellation
      const currentJob = await db.collection('scan_jobs').findOne({ id: scanJobId })
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
      
      await db.collection('scan_results').insertOne(scanResult)
      results.push(scanResult)
      
      // Update progress
      await db.collection('scan_jobs').updateOne(
        { id: scanJobId },
        { $set: { processedPoints: results.length } }
      )
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    // Mark job as completed
    await db.collection('scan_jobs').updateOne(
      { id: scanJobId },
      { 
        $set: { 
          status: 'completed',
          completedAt: new Date()
        } 
      }
    )
    
    return { success: true, resultsCount: results.length }
  } catch (error) {
    console.error('Scan job error:', error)
    
    await db.collection('scan_jobs').updateOne(
      { id: scanJobId },
      { 
        $set: { 
          status: 'failed',
          errorMessage: error.message,
          completedAt: new Date()
        } 
      }
    )
    
    return { success: false, error: error.message }
  }
}
