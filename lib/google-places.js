import { getSecret } from './secrets'
import redis from './redis'
import prisma from './prisma'
import { reportSystemError } from './error-reporter'

const GOOGLE_API_KEY = getSecret('GOOGLE_API_KEY')
const DAILY_LIMIT = parseInt(process.env.DAILY_GOOGLE_API_LIMIT || '250')
const APP_REFERER = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://ringscale.ai/'
async function checkQuota() {
  if (!redis) return true
  
  const today = new Date().toISOString().split('T')[0]
  const key = `quota:google:${today}`
  const limitKey = `config:google:dailyLimit`
  
  // 1. Get current usage
  const current = await redis.get(key)
  
  // 2. Get current limit (cached in redis for 10 mins)
  let limit = DAILY_LIMIT
  try {
    const cachedLimit = await redis.get(limitKey)
    if (cachedLimit) {
      limit = parseInt(cachedLimit)
    } else {
      // Fetch from DB if not in cache
      const setting = await prisma.globalSetting.findUnique({
        where: { key: 'google_quota' }
      })
      if (setting && setting.value?.dailyLimit) {
        limit = parseInt(setting.value.dailyLimit)
        // Cache for 10 minutes
        await redis.set(limitKey, limit.toString(), 'EX', 600)
      }
    }
  } catch (e) {
    console.error('Error fetching quota limit:', e.message)
  }
  
  if (current && parseInt(current) >= limit) {
    console.error(`[CRITICAL] Google API Daily Limit Reached (${limit}). Stopping all requests.`)
    const error = new Error('DAILY_QUOTA_REACHED');
    reportSystemError('GOOGLE_PLACES_API_QUOTA', error, { limit, current });
    throw error
  }
  
  // Increment and set expiry for 24h
  await redis.incr(key)
  await redis.expire(key, 86400)
  return true
}

export async function searchBusinessByText(query) {
  const cacheKey = `google:search:business:${query.toLowerCase().trim()}`
  if (redis) {
    try {
      const cached = await redis.get(cacheKey)
      if (cached) return JSON.parse(cached)
    } catch (e) {}
  }

  // Check Quota before making real call
  await checkQuota()

  const url = 'https://places.googleapis.com/v1/places:searchText'
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      referrer: APP_REFERER,
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
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      const error = await response.text()
      console.error('Google Places API Error:', error)
      throw new Error('Failed to search businesses')
    }
    
    const data = await response.json()
    
    const results = (data.places || []).map(place => ({
      placeId: place.id,
      name: place.displayName?.text || '',
      address: place.formattedAddress || '',
      latitude: place.location?.latitude || 0,
      longitude: place.location?.longitude || 0,
      primaryType: place.primaryType || place.types?.[0] || '',
      types: place.types || []
    }))

    if (redis && results.length > 0) {
      try { await redis.set(cacheKey, JSON.stringify(results), 'EX', 86400) } catch (e) {}
    }
    
    return results
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') throw new Error('Request timed out after 15s')
    throw error
  }
}

export async function getPlaceDetails(placeId) {
  const cacheKey = `google:place:${placeId}`
  if (redis) {
    try {
      const cached = await redis.get(cacheKey)
      if (cached) return JSON.parse(cached)
    } catch (e) {}
  }

  // Check Quota
  await checkQuota()

  const url = `https://places.googleapis.com/v1/places/${placeId}`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      referrer: APP_REFERER,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,primaryType,types,rating,userRatingCount,websiteUri,nationalPhoneNumber,photos,editorialSummary,reviews,businessStatus'
      }
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error('Failed to get place details')
    }
    
    const place = await response.json()
    
    const result = {
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
      phone: place.nationalPhoneNumber || '',
      photos: place.photos || [],
      photoCount: place.photos?.length || 0,
      summary: place.editorialSummary?.text || '',
      reviews: place.reviews || [],
      status: place.businessStatus || 'OPERATIONAL'
    }

    if (redis && result) {
      try { await redis.set(cacheKey, JSON.stringify(result), 'EX', 604800) } catch (e) {}
    }

    return result
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') throw new Error('Place details request timed out')
    throw error
  }
}

export async function searchKeywordAtPoint(keyword, lat, lng, radiusMeters = 5000) {
  // Check Quota
  await checkQuota()

  const url = 'https://places.googleapis.com/v1/places:searchText'
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 20000)
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      referrer: APP_REFERER,
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
    
    clearTimeout(timeoutId)
    
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
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      console.error('Google Search at location timed out')
      throw new Error('Search timed out')
    }
    throw error
  }
}

export async function getQuerySuggestions(input) {
  if (!input) return []
  
  const url = 'https://places.googleapis.com/v1/places:autocomplete'
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      referrer: APP_REFERER,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY
      },
      body: JSON.stringify({ input })
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      console.error('v1 Autocomplete error:', await response.text())
      return []
    }
    
    const data = await response.json()
    return (data.suggestions || []).map(s => {
      return s.queryPrediction?.text?.text || s.placePrediction?.text?.text || ''
    }).filter(Boolean)
  } catch (error) {
    clearTimeout(timeoutId)
    return []
  }
}

export async function getNearbyCompetitors(lat, lng, type, excludePlaceId = null) {
  if (!type) return []
  
  const url = 'https://places.googleapis.com/v1/places:searchText'
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      referrer: APP_REFERER,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.location'
      },
      body: JSON.stringify({
        textQuery: type, // Searching for businesses of the same type
        maxResultCount: 6, // Get top 6 to find at least 5 competitors
        locationBias: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: 5000 // 5km search radius
          }
        }
      })
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      console.error('Google Places Competitor Search Error:', await response.text())
      return []
    }
    
    const data = await response.json()
    
    return (data.places || [])
      .filter(place => place.id !== excludePlaceId) // Exclude current business
      .slice(0, 5) // Take top 5 competitors
      .map(place => ({
        placeId: place.id,
        name: place.displayName?.text || '',
        address: place.formattedAddress || '',
        rating: place.rating || 0,
        reviewCount: place.userRatingCount || 0,
        latitude: place.location?.latitude || 0,
        longitude: place.location?.longitude || 0
      }))
  } catch (error) {
    clearTimeout(timeoutId)
    console.error('Failed to fetch competitors:', error)
    return []
  }
}
