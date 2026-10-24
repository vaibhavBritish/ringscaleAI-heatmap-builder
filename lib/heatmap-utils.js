/**
 * Generates a grid of coordinates around a center point.
 * 
 * @param {Object} center - { lat, lng }
 * @param {String} shape - 'circle' or 'square'
 * @param {Number} density - Total number of pins (e.g., 20, 25, 30, 35)
 * @param {Number} radiusKm - Radius of the grid in kilometers
 * @returns {Array} - Array of { lat, lng } coordinates
 */
export function generateHeatmapGrid(center, shape = 'circle', density = 25, radiusKm = 1) {
  if (!center || typeof center.lat !== 'number' || typeof center.lng !== 'number') return []
  
  const points = []
  const R = 6371 // Earth radius in km
  
  if (shape === 'square') {
    let rows, cols
    if (density === 20) {
      rows = 4
      cols = 5
    } else if (density === 25) {
      rows = 5
      cols = 5
    } else if (density === 30) {
      rows = 5
      cols = 6
    } else if (density === 35) {
      rows = 5
      cols = 7
    } else {
      const side = Math.round(Math.sqrt(density)) || 5
      rows = side
      cols = Math.ceil(density / side)
    }

    const stepRowKm = (radiusKm * 2) / Math.max(1, rows - 1)
    const stepColKm = (radiusKm * 2) / Math.max(1, cols - 1)
    const halfSize = radiusKm
    
    let count = 0
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (count >= density) break
        const dLat = (i * stepRowKm - halfSize) / R
        const dLng = (j * stepColKm - halfSize) / (R * Math.cos(Math.PI * center.lat / 180))
        
        points.push({
          latitude: center.lat + (dLat * 180 / Math.PI),
          longitude: center.lng + (dLng * 180 / Math.PI),
          id: `pin-${i}-${j}`,
          row: i,
          col: j,
          index: count,
          rank: null
        })
        count++
      }
    }
  } else {
    // Fermat's Spiral (Vogel's Method) for uniform distribution on a disk
    const phi = Math.PI * (3 - Math.sqrt(5))
    
    for (let i = 0; i < density; i++) {
       const r = i === 0 ? 0 : radiusKm * Math.sqrt(i / Math.max(1, density - 1))
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
