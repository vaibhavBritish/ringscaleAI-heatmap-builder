'use client'

import { useEffect, useRef, useState, memo } from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

export default function GoogleMap({ 
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
      apiKey,
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

    // Efficiently update markers
    // For large grids, we don't want to destroy and recreate everything every time
    // But for now, we'll do simple cleanup since it's easier to maintain
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []

    if (markers.length === 0) return

    markers.forEach((markerData) => {
      if (typeof markerData.latitude !== 'number' || typeof markerData.longitude !== 'number') return

      const isPin = markerData.id?.startsWith('pin-')
      const hasRank = typeof markerData.rank === 'number'
      
      // Determine color based on rank (matching grid-utils logic)
      let pinColor = '#3b82f6' // Default blue
      if (hasRank) {
        if (markerData.rank <= 3) pinColor = '#22c55e' // Green
        else if (markerData.rank <= 10) pinColor = '#eab308' // Yellow
        else if (markerData.rank < 20) pinColor = '#f97316' // Orange
        else pinColor = '#94a3b8' // Gray for >= 20
      }

      const marker = new Marker({
        position: { lat: markerData.latitude, lng: markerData.longitude },
        map,
        title: hasRank ? `Rank: ${markerData.rank}` : (markerData.name || ''),
        animation: (!isPin && !hasRank) ? Animation.DROP : null,
        zIndex: markerData.selected ? 9999 : (hasRank ? 10 : 1),
        label: hasRank ? {
          text: String(markerData.rank),
          color: markerData.rank <= 10 && markerData.rank > 3 ? '#000000' : '#ffffff',
          fontSize: '10px',
          fontWeight: 'bold'
        } : (markerData.found === false ? {
          text: 'X',
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: 'black'
        } : null),
        icon: isPin ? {
          path: SymbolPath.CIRCLE,
          fillColor: markerData.found === false ? '#94a3b8' : pinColor,
          fillOpacity: (hasRank || markerData.found === false) ? 0.9 : 0.1,
          strokeColor: markerData.found === false ? '#64748b' : pinColor,
          strokeWeight: (hasRank || markerData.found === false) ? 1 : 2,
          scale: markerData.found === false ? 12 : (hasRank ? 14 : 11)
        } : (markerData.selected ? {
          path: SymbolPath.CIRCLE,
          fillColor: '#b91c1c',  // Strong red fill
          fillOpacity: 1,
          strokeColor: '#3b82f6', // Bright blue outline
          strokeWeight: 5,       // Thick visible outline
          scale: 16              // Larger scale than normal pins
        } : {
          path: SymbolPath.CIRCLE,
          fillColor: '#0c4bb0',
          fillOpacity: 0.8,
          strokeColor: '#0c4bb0',
          strokeWeight: 2,
          scale: 9
        })
      })

      if (!isPin) {
        marker.addListener('click', () => onMarkerClick(markerData))
      }

      markersRef.current.push(marker)
    })

    // Bounds handling
    // Bounds handling
    if (markers.length > 1) {
      const bounds = new LatLngBounds()
      markers.forEach(m => bounds.extend({ lat: m.latitude, lng: m.longitude }))
      map.fitBounds(bounds)
      
      // Ensure we don't zoom in *too* closely if pins are very tight
      const listener = window.google.maps.event.addListener(map, "idle", () => { 
        if (map.getZoom() > 18) map.setZoom(18); 
        window.google.maps.event.removeListener(listener); 
      });
    } else if (markers.length === 1) {
      map.panTo({ lat: markers[0].latitude, lng: markers[0].longitude })
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
}
