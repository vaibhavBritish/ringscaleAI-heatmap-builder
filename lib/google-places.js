const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY

export async function searchBusinessByText(query) {
  const url = 'https://places.googleapis.com/v1/places:searchText'
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.types'
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: 10
    })
  })
  
  if (!response.ok) {
    const error = await response.text()
    console.error('Google Places API Error:', error)
    throw new Error('Failed to search businesses')
  }
  
  const data = await response.json()
  
  return (data.places || []).map(place => ({
    placeId: place.id,
    name: place.displayName?.text || '',
    address: place.formattedAddress || '',
    latitude: place.location?.latitude || 0,
    longitude: place.location?.longitude || 0,
    primaryType: place.primaryType || place.types?.[0] || '',
    types: place.types || []
  }))
}

export async function getPlaceDetails(placeId) {
  const url = `https://places.googleapis.com/v1/places/${placeId}`
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,primaryType,types,rating,userRatingCount,websiteUri,nationalPhoneNumber'
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to get place details')
  }
  
  const place = await response.json()
  
  return {
    placeId: place.id,
    name: place.displayName?.text || '',
    address: place.formattedAddress || '',
    latitude: place.location?.latitude || 0,
    longitude: place.location?.longitude || 0,
    primaryType: place.primaryType || '',
    types: place.types || [],
    rating: place.rating || 0,
    reviewCount: place.userRatingCount || 0,
    website: place.websiteUri || '',
    phone: place.nationalPhoneNumber || ''
  }
}

export async function searchKeywordAtPoint(keyword, lat, lng, radiusMeters = 5000) {
  const url = 'https://places.googleapis.com/v1/places:searchText'
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount'
    },
    body: JSON.stringify({
      textQuery: keyword,
      maxResultCount: 20,
      locationBias: {
        circle: {
          center: {
            latitude: lat,
            longitude: lng
          },
          radius: radiusMeters
        }
      }
    })
  })
  
  if (!response.ok) {
    const error = await response.text()
    console.error('Search at point error:', error)
    throw new Error('Failed to search at location')
  }
  
  const data = await response.json()
  
  return (data.places || []).map((place, index) => ({
    rank: index + 1,
    placeId: place.id,
    name: place.displayName?.text || '',
    address: place.formattedAddress || '',
    latitude: place.location?.latitude || 0,
    longitude: place.location?.longitude || 0,
    rating: place.rating || 0,
    reviewCount: place.userRatingCount || 0
  }))
}

export async function getQuerySuggestions(input) {
  if (!input) return []
  
  const url = 'https://places.googleapis.com/v1/places:autocomplete'
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY
    },
    body: JSON.stringify({ input })
  })
  
  if (!response.ok) {
    console.error('v1 Autocomplete error:', await response.text())
    return []
  }
  
  const data = await response.json()
  return (data.suggestions || []).map(s => {
    return s.queryPrediction?.text?.text || s.placePrediction?.text?.text || ''
  }).filter(Boolean)
}
