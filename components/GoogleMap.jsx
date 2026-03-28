'use client'

import { useEffect, useRef, useState, memo } from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

const GoogleMap = memo(function GoogleMap({ 
  center = { lat: 39.8283, lng: -98.5795 }, // USA Center
  zoom = 4, 
  markers = [], 
  onMarkerClick = () => {},
  onMapClick = () => {},
  mapType = 'roadmap',
  showControls = false
}) {
  const mapContainerRef = useRef(null)
  const [map, setMap] = useState(null)
  const [googleRefs, setGoogleRefs] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const markersRef = useRef([])

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
    if (!apiKey) {
      setLoadError("Google Maps API Key missing")
      return
    }

    setOptions({
      key:apiKey,
      version: 'weekly',
    })

    const loadLibraries = async () => {
      try {
        const { Map } = await importLibrary('maps')
        const { Marker, Animation } = await importLibrary('marker')
        const { LatLngBounds, SymbolPath } = await importLibrary('core')
        
        if (!mapContainerRef.current) return

        const gMap = new Map(mapContainerRef.current, {
          center,
          zoom,
          mapTypeId: mapType,
          disableDefaultUI: !showControls,
          zoomControl: showControls,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            {
              "featureType": "all",
              "elementType": "labels.text.fill",
              "stylers": [{ "color": "#0c4bb0" }, { "lightness": "-10" }]
            },
            {
               "featureType": "water",
               "elementType": "geometry",
               "stylers": [{ "color": "#a2daf2" }]
            },
            {
               "featureType": "landscape",
               "elementType": "geometry",
               "stylers": [{ "color": "#e9f1f4" }]
            }
          ]
        })

        gMap.addListener('click', (e) => {
          onMapClick({
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
          })
        })

        setGoogleRefs({ Marker, Animation, SymbolPath, LatLngBounds })
        setMap(gMap)
      } catch (err) {
        console.error("Error loading Google Maps libraries:", err)
        setLoadError(err.message || "Failed to load Google Maps")
      }
    }

    loadLibraries()

    return () => {
      markersRef.current.forEach(m => m.setMap(null))
    }
  }, [])

  useEffect(() => {
    if (!map || !googleRefs) return

    const { Marker, Animation, SymbolPath, LatLngBounds } = googleRefs

    // --- RECONCILIATION LOGIC ---
    // Instead of destroying everything, we update existing markers
    const getMarkerId = (m) => m.id || m.placeId || `temp-${m.latitude}-${m.longitude}`
    
    // Filter out invalid coordinates
    const validMarkers = markers.filter(m => 
      m && typeof m.latitude === 'number' && typeof m.longitude === 'number' &&
      !isNaN(m.latitude) && !isNaN(m.longitude)
    )

    const newMarkerIds = new Set(validMarkers.map(getMarkerId))
    
    // 1. Remove markers that are no longer in the list
    const markersMap = markersRef.current // Map { id => google.maps.Marker }
    if (!(markersMap instanceof Map)) {
      // Initialize if first run or coming from legacy array
      markersRef.current = new Map()
    }
    
    for (const [id, marker] of markersRef.current.entries()) {
      if (!newMarkerIds.has(id)) {
        marker.setMap(null)
        markersRef.current.delete(id)
      }
    }

    // 2. Add or update markers
    validMarkers.forEach((markerData) => {
      const id = getMarkerId(markerData)
      let marker = markersRef.current.get(id)
      
      const hasRank = typeof markerData.rank === 'number'
      const isPin = markerData.id?.startsWith('pin-')
      
      // Determine color based on rank
      let pinColor = '#3b82f6'
      if (hasRank) {
        if (markerData.rank <= 3) pinColor = '#22c55e'
        else if (markerData.rank <= 10) pinColor = '#eab308'
        else if (markerData.rank < 20) pinColor = '#f97316'
        else pinColor = '#94a3b8'
      }

      const label = hasRank ? {
        text: String(markerData.rank),
        color: markerData.rank <= 10 && markerData.rank > 3 ? '#000000' : '#ffffff',
        fontSize: '10px',
        fontWeight: 'bold'
      } : (markerData.found === false ? {
        text: 'X',
        color: '#ffffff',
        fontSize: '12px',
        fontWeight: 'black'
      } : null)

      const icon = isPin ? {
        path: SymbolPath.CIRCLE,
        fillColor: markerData.found === false ? '#94a3b8' : pinColor,
        fillOpacity: (hasRank || markerData.found === false) ? 0.9 : 0.1,
        strokeColor: markerData.found === false ? '#64748b' : pinColor,
        strokeWeight: (hasRank || markerData.found === false) ? 1 : 2,
        scale: markerData.found === false ? 12 : (hasRank ? 14 : 11)
      } : (markerData.selected ? {
        path: SymbolPath.CIRCLE,
        fillColor: '#b91c1c',
        fillOpacity: 1,
        strokeColor: '#3b82f6',
        strokeWeight: 5,
        scale: 16
      } : {
        path: SymbolPath.CIRCLE,
        fillColor: '#0c4bb0',
        fillOpacity: 0.8,
        strokeColor: '#0c4bb0',
        strokeWeight: 2,
        scale: 9
      })

      if (marker) {
        // Update existing marker
        marker.setPosition({ lat: markerData.latitude, lng: markerData.longitude })
        marker.setIcon(icon)
        marker.setLabel(label)
        marker.setZIndex(markerData.selected ? 9999 : (hasRank ? 10 : 1))
      } else {
        // Create new marker
        marker = new Marker({
          position: { lat: markerData.latitude, lng: markerData.longitude },
          map,
          title: hasRank ? `Rank: ${markerData.rank}` : (markerData.name || ''),
          animation: (!isPin && !hasRank) ? Animation.DROP : null,
          zIndex: markerData.selected ? 9999 : (hasRank ? 10 : 1),
          label,
          icon
        })

        if (!isPin) {
          marker.addListener('click', () => onMarkerClick(markerData))
        }

        markersRef.current.set(id, marker)
      }
    })

    // Bounds handling
    if (validMarkers.length > 1) {
      const bounds = new LatLngBounds()
      validMarkers.forEach(m => bounds.extend({ lat: m.latitude, lng: m.longitude }))
      map.fitBounds(bounds)
      
      // Ensure we don't zoom in *too* closely if pins are very tight
      const listener = window.google.maps.event.addListener(map, "idle", () => { 
        if (map.getZoom() > 18) map.setZoom(18); 
        window.google.maps.event.removeListener(listener); 
      });
    } else if (validMarkers.length === 1) {
      map.panTo({ lat: validMarkers[0].latitude, lng: validMarkers[0].longitude })
      map.setZoom(16)
    }
  }, [map, markers, googleRefs])

  useEffect(() => {
    if (map) {
      map.setMapTypeId(mapType)
    }
  }, [map, mapType])

  return (
    <div className="w-full h-full min-h-[400px] rounded-xl overflow-hidden shadow-inner relative bg-slate-100">
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />
      
      {!map && !loadError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Initializing Map...</p>
          </div>
        </div>
      )}
      
      {loadError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-red-50/90 backdrop-blur-sm p-6 text-center">
          <div className="flex flex-col items-center gap-3 max-w-sm">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <span className="text-xl font-bold">!</span>
            </div>
            <p className="text-sm font-medium text-red-900">{loadError}</p>
            <p className="text-xs text-red-600">Please check your internet connection and API key configuration.</p>
          </div>
        </div>
      )}
    </div>
  )
})

export default GoogleMap
