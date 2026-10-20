import { getSecret } from './secrets.js'
import redis from './redis.js'
import prisma from './prisma.js'
import { reportSystemError } from './error-reporter.js'

const GOOGLE_API_KEY = getSecret('GOOGLE_API_KEY')
const DAILY_LIMIT = parseInt(process.env.DAILY_GOOGLE_API_LIMIT || '250')
const APP_REFERER = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://ringscale.ai/'
export async function getQuotaUsage() {
  const today = new Date().toISOString().split('T')[0]
  const key = `quota:google:${today}`
  const limitKey = `config:google:dailyLimit`

  if (!redis) {
    return {
      current: 0,
      limit: DAILY_LIMIT,
      remaining: DAILY_LIMIT,
      isUnlimited: false,
      isExceeded: false,
      today
    }
  }

  const currentVal = await redis.get(key)
  const current = currentVal ? parseInt(currentVal, 10) : 0

  let limit = DAILY_LIMIT
  try {
    const cachedLimit = await redis.get(limitKey)
    if (cachedLimit !== null && cachedLimit !== undefined) {
      limit = parseInt(cachedLimit, 10)
    } else {
      const setting = await prisma.globalSetting.findUnique({
        where: { key: 'google_quota' }
      })
      if (setting && setting.value?.dailyLimit !== undefined) {
        limit = parseInt(setting.value.dailyLimit, 10)
        await redis.set(limitKey, limit.toString(), 'EX', 600)
      }
    }
  } catch (e) {
    console.error('Error fetching quota limit:', e.message)
  }

  // A limit <= 0 means quota check is disabled (unlimited)
  const isUnlimited = limit <= 0
  const isExceeded = !isUnlimited && current >= limit
  const remaining = isUnlimited ? Infinity : Math.max(0, limit - current)

  return {
    current,
    limit,
    remaining,
    isUnlimited,
    isExceeded,
    today
  }
}

export async function resetDailyQuota() {
  if (!redis) return { success: true }
  const today = new Date().toISOString().split('T')[0]
  const key = `quota:google:${today}`
  await redis.del(key)
  return { success: true, message: `Google API daily quota counter reset for ${today}` }
}

export async function checkQuota(options = {}) {
  if (!redis) return true
  const consume = typeof options === 'boolean' ? options : (options.consume !== false)

  const { current, limit, isUnlimited, isExceeded, today } = await getQuotaUsage()

  if (isExceeded) {
    console.error(`[CRITICAL] Google API Daily Limit Reached (${limit}). Current usage: ${current}. Stopping all requests.`)
    const error = new Error('DAILY_QUOTA_REACHED')
    reportSystemError('GOOGLE_PLACES_API_QUOTA', error, { limit, current })
    throw error
  }

  // Increment and set expiry for 24h ONLY when actually consuming a quota unit
  if (consume) {
    const key = `quota:google:${today}`
    await redis.incr(key)
    await redis.expire(key, 86400)
  }
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
        'Referer': APP_REFERER,
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
  if (!placeId || typeof placeId !== 'string' || placeId.startsWith('locations/') || placeId.startsWith('accounts/') || placeId.startsWith('gmb_') || placeId.includes('/')) {
    return null
  }

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
        'Referer': APP_REFERER,
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,primaryType,types,rating,userRatingCount,websiteUri,nationalPhoneNumber,photos,editorialSummary,reviews,businessStatus'
      }
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      console.warn(`Place details API returned status ${response.status} for placeId ${placeId}`)
      return null
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

export async function searchKeywordAtPoint(keyword, lat, lng, radiusMeters = 5000, maxRetries = 2) {
  // Check Quota
  await checkQuota()

  const url = 'https://places.googleapis.com/v1/places:searchText'

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000)

    try {
      const response = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        referrer: APP_REFERER,
        headers: {
          'Content-Type': 'application/json',
          'Referer': APP_REFERER,
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
        const errorText = await response.text()
        if (response.status === 429 && attempt < maxRetries) {
          const waitMs = (attempt + 1) * 2000
          console.warn(`[Google Places] Rate limit (429) at (${lat}, ${lng}). Retrying in ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})...`)
          await new Promise(r => setTimeout(r, waitMs))
          continue
        }
        console.error('Search at point error:', errorText)
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
      if (attempt >= maxRetries) {
        throw error
      }
    }
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
        'Referer': APP_REFERER,
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
  
  // Check Quota
  await checkQuota({ consume: true })

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
        'Referer': APP_REFERER,
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
