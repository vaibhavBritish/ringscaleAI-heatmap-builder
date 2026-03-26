/**
 * Generates a grid of coordinates around a center point.
 * 
 * @param {Object} center - { lat, lng }
 * @param {String} shape - 'circle' or 'square'
 * @param {Number} density - Total number of pins (e.g., 133, 225)
 * @param {Number} radiusKm - Radius of the grid in kilometers
 * @returns {Array} - Array of { lat, lng } coordinates
 */
export function generateHeatmapGrid(center, shape = 'circle', density = 133, radiusKm = 1) {
  if (!center || typeof center.lat !== 'number' || typeof center.lng !== 'number') return []
  
  const points = []
  const R = 6371 // Earth radius in km
  
  if (shape === 'square') {
    const sideLength = Math.sqrt(density)
    const stepCount = Math.floor(sideLength)
    const stepSizeKm = (radiusKm * 2) / Math.max(1, stepCount - 1)
    const halfSize = radiusKm
    
    for (let i = 0; i < stepCount; i++) {
      for (let j = 0; j < stepCount; j++) {
        const dLat = (i * stepSizeKm - halfSize) / R
        const dLng = (j * stepSizeKm - halfSize) / (R * Math.cos(Math.PI * center.lat / 180))
        
        points.push({
          latitude: center.lat + (dLat * 180 / Math.PI),
          longitude: center.lng + (dLng * 180 / Math.PI),
          id: `pin-${i}-${j}`,
          row: i,
          col: j,
          index: i * stepCount + j,
          rank: null
        })
      }
    }
  } else {
    // Fermat's Spiral (Vogel's Method) for uniform distribution on a disk
    const phi = Math.PI * (3 - Math.sqrt(5))
    
    for (let i = 0; i < density; i++) {
       const r = i === 0 ? 0 : radiusKm * Math.sqrt(i / (density - 1))
       const theta = i * phi
       
       const dLat = (r * Math.cos(theta)) / R
       const dLng = (r * Math.sin(theta)) / (R * Math.cos(Math.PI * center.lat / 180))
       
       points.push({
         latitude: center.lat + (dLat * 180 / Math.PI),
         longitude: center.lng + (dLng * 180 / Math.PI),
         id: `pin-${i}`,
         row: Math.floor(i / Math.sqrt(density)),
         col: i % Math.floor(Math.sqrt(density)),
         index: i,
         rank: null
       })
    }
  }
  
  return points.slice(0, density)
}
