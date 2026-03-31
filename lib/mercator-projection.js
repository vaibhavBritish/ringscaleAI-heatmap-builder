/**
 * Mercator Projection utilities for Google Static Maps marker overlay
 */

export const project = (lat, lng, zoom) => {
    const TILE_SIZE = 256;
    let x = (lng + 180) / 360 * TILE_SIZE * Math.pow(2, zoom);
    
    let latRad = lat * Math.PI / 180;
    let y = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * TILE_SIZE * Math.pow(2, zoom);
    
    return { x, y };
};

export const getPixelCoordinate = (lat, lng, centerLat, centerLng, zoom, mapWidth, mapHeight, scale = 1) => {
    const centerPoint = project(centerLat, centerLng, zoom);
    const point = project(lat, lng, zoom);
    
    const dx = (point.x - centerPoint.x) * scale;
    const dy = (point.y - centerPoint.y) * scale;
    
    const pixelX = (mapWidth / 2) + dx;
    const pixelY = (mapHeight / 2) + dy;
    
    return { x: pixelX, y: pixelY };
};
