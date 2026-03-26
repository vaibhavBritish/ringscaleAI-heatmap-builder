// Earth's radius in meters
const EARTH_RADIUS = 6371000

// Convert degrees to radians
function toRadians(degrees) {
  return degrees * (Math.PI / 180)
}

// Convert radians to degrees
function toDegrees(radians) {
  return radians * (180 / Math.PI)
}

// Calculate new coordinate given distance and bearing
function destinationPoint(lat, lng, distance, bearing) {
  const lat1 = toRadians(lat)
  const lng1 = toRadians(lng)
  const brng = toRadians(bearing)
  const angularDistance = distance / EARTH_RADIUS
  
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
    Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(brng)
  )
  
  const lng2 = lng1 + Math.atan2(
    Math.sin(brng) * Math.sin(angularDistance) * Math.cos(lat1),
    Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
  )
  
  return {
    latitude: toDegrees(lat2),
    longitude: toDegrees(lng2)
  }
}

// Generate grid points around a center coordinate
export function generateGrid(centerLat, centerLng, gridSize, spacingMeters) {
  const points = []
  const halfGrid = Math.floor(gridSize / 2)
  
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      // Calculate offset from center
      const rowOffset = row - halfGrid
      const colOffset = col - halfGrid
      
      // Calculate distance in each direction
      const northDistance = -rowOffset * spacingMeters // Negative because row 0 is north
      const eastDistance = colOffset * spacingMeters
      
      // Start from center and move north/south
      let point = destinationPoint(centerLat, centerLng, Math.abs(northDistance), northDistance >= 0 ? 0 : 180)
      
      // Then move east/west
      point = destinationPoint(point.latitude, point.longitude, Math.abs(eastDistance), eastDistance >= 0 ? 90 : 270)
      
      points.push({
        row,
        col,
        latitude: point.latitude,
        longitude: point.longitude
      })
    }
  }
  
  return points
}

// Get color for rank
export function getRankColor(rank, found) {
  if (!found || rank === null || rank === undefined) {
    return { bg: '#6b7280', text: '#ffffff', label: 'Not Found' } // Gray
  }
  if (rank <= 3) {
    return { bg: '#22c55e', text: '#ffffff', label: 'Top 3' } // Green
  }
  if (rank <= 10) {
    return { bg: '#eab308', text: '#000000', label: 'Top 10' } // Yellow
  }
  if (rank <= 20) {
    return { bg: '#f97316', text: '#ffffff', label: 'Top 20' } // Orange
  }
  return { bg: '#ef4444', text: '#ffffff', label: '20+' } // Red
}

// Calculate visibility score
export function calculateVisibilityScore(results) {
  if (!results || results.length === 0) return 0
  
  const foundResults = results.filter(r => r.found)
  if (foundResults.length === 0) return 0
  
  // Weighted scoring: rank 1 = 100 points, rank 20 = 5 points, not found = 0
  const totalPossibleScore = results.length * 100
  
  const actualScore = results.reduce((sum, r) => {
    if (!r.found) return sum
    // Higher rank = lower score. Rank 1 = 100, Rank 20 = 5
    const rankScore = Math.max(5, 100 - (r.rank - 1) * 5)
    return sum + rankScore
  }, 0)
  
  return Math.round((actualScore / totalPossibleScore) * 100)
}

// Calculate analytics from scan results
export function calculateAnalytics(results) {
  if (!results || results.length === 0) {
    return {
      totalPoints: 0,
      foundCount: 0,
      notFoundCount: 0,
      averageRank: 0,
      top3Percentage: 0,
      top10Percentage: 0,
      top20Percentage: 0,
      visibilityScore: 0,
      bestRank: null,
      worstRank: null
    }
  }
  
  const totalPoints = results.length
  const foundResults = results.filter(r => r.found)
  const foundCount = foundResults.length
  const notFoundCount = totalPoints - foundCount
  
  const ranks = foundResults.map(r => r.rank).filter(r => r !== null && r !== undefined)
  
  const averageRank = ranks.length > 0 
    ? Math.round((ranks.reduce((a, b) => a + b, 0) / ranks.length) * 10) / 10 
    : 0
  
  const top3Count = ranks.filter(r => r <= 3).length
  const top10Count = ranks.filter(r => r <= 10).length
  const top20Count = ranks.filter(r => r <= 20).length
  
  const top3Percentage = totalPoints > 0 ? Math.round((top3Count / totalPoints) * 100) : 0
  const top10Percentage = totalPoints > 0 ? Math.round((top10Count / totalPoints) * 100) : 0
  const top20Percentage = totalPoints > 0 ? Math.round((top20Count / totalPoints) * 100) : 0
  
  const visibilityScore = calculateVisibilityScore(results)
  
  const bestRank = ranks.length > 0 ? Math.min(...ranks) : null
  const worstRank = ranks.length > 0 ? Math.max(...ranks) : null
  
  return {
    totalPoints,
    foundCount,
    notFoundCount,
    averageRank,
    top3Percentage,
    top10Percentage,
    top20Percentage,
    visibilityScore,
    bestRank,
    worstRank
  }
}
