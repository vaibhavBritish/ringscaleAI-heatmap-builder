import { MongoClient, ObjectId } from 'mongodb'

let cachedClient = null

/**
 * Returns a connected MongoDB client to the GMB Connector database.
 */
export async function getGmbMongoClient() {
  const uri = process.env.GMB_CONNECTOR_DB_URL || 
    'mongodb+srv://gmb-connector:pSPvm9sIU0x37mfG@cluster0.mbawxnc.mongodb.net/gmb-connector?retryWrites=true&w=majority'

  if (cachedClient) {
    try {
      // Ping to verify connection is alive
      await cachedClient.db('admin').command({ ping: 1 })
      return cachedClient
    } catch {
      cachedClient = null
    }
  }

  const client = new MongoClient(uri, {
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000
  })

  await client.connect()
  cachedClient = client
  return cachedClient
}

/**
 * Extracts a city or region name from address, business details, or service areas.
 */
export function extractCityOrRegion(...sources) {
  for (const src of sources) {
    if (!src || typeof src !== 'string') continue

    // 1. Service Areas: City, Region, Country
    const saMatch = src.match(/Service Areas?:\s*([^,\n]+)/i)
    if (saMatch && saMatch[1]) {
      const candidate = saMatch[1].trim()
      if (candidate && candidate.length > 2 && !/^(USA|Canada|India|UK|United States)$/i.test(candidate)) {
        return candidate
      }
    }

    // 2. Comma-separated address (e.g. "21 Parr Blvd, Bolton, ON L7E 4G3, Canada")
    const parts = src.split(',').map(s => s.trim())
    if (parts.length >= 3) {
      let part1 = parts[1].replace(/^(?:suite|ste|apt|unit|floor|fl|bldg)\s*[\w\-]+/i, '').trim()
      if (part1 && part1.length > 2 && part1.length < 35 && !/^\d+/.test(part1) && !/^(USA|Canada|India|UK)$/i.test(part1)) {
        return part1
      }
      let part0 = parts[0].replace(/^(?:Service Areas?:\s*|Address:\s*)/i, '').trim()
      if (!/^\d+/.test(part0) && part0.length > 2 && part0.length < 35 && !/^(USA|Canada|India|UK)$/i.test(part0)) {
        return part0
      }
    }
    if (parts.length === 2) {
      let part0 = parts[0].replace(/^(?:Service Areas?:\s*|Address:\s*)/i, '').trim()
      if (!/^\d+/.test(part0) && part0.length > 2 && part0.length < 35) {
        return part0
      }
    }

    // 3. Known cities pattern
    const knownCities = /\b(Vancouver|Toronto|Calgary|Edmonton|Montreal|Ottawa|Bolton|Brampton|Caledon|Mississauga|Vaughan|Richmond|Burnaby|Surrey|Boston|Waltham|Lowell|Beverly|Fairhaven|Lynn|Dracut|Roslindale|Delhi|Mumbai|Pune|Bangalore|Janakpuri|New Bedford|Indore|Ujjain|Dehradun|Jaipur|New York|Los Angeles|Chicago|Houston|Phoenix|Philadelphia|San Antonio|San Diego|Dallas|San Jose|Austin|Jacksonville|San Francisco|Columbus|Indianapolis|Fort Worth|Charlotte|Seattle|Denver|Washington|Miami|Atlanta|Orlando)\b/i
    const cityMatch = src.match(knownCities)
    if (cityMatch) return cityMatch[1]
  }
  return ''
}

/**
 * Replaces any bracketed placeholders like [city/region], [city name], [your city] with real city or strips them cleanly.
 */
export function cleanKeyword(kw, city = '') {
  if (!kw || typeof kw !== 'string') return ''
  const placeholderRegex = /\[\s*(?:(?:your\s+)?city(?:[\/\s]+(?:region|area|neighborhood|town|name))?|region|area|town|location|your\s+city)\s*\]/gi
  const parenPlaceholderRegex = /\(\s*(?:(?:your\s+)?city(?:[\/\s]+(?:region|area|neighborhood|town|name))?|region|area|town|location|your\s+city)\s*\)/gi
  const genericPlaceholderRegex = /\[(?:city|region|location|area)[^\]]*\]/gi

  let cleaned = kw
    .replace(placeholderRegex, city ? city : '')
    .replace(parenPlaceholderRegex, city ? city : '')
    .replace(genericPlaceholderRegex, city ? city : '')

  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  return cleaned
}

/**
 * Cleans and deduplicates a list of keywords using a resolved city/region.
 */
export function cleanKeywordsList(list, city = '') {
  const seen = new Set()
  const results = []
  for (const item of (list || [])) {
    const cleaned = cleanKeyword(item, city)
    if (cleaned && !seen.has(cleaned.toLowerCase())) {
      seen.add(cleaned.toLowerCase())
      results.push(cleaned)
    }
  }
  return results
}

/**
 * Fetches all businesses and their respective locations for a user from GMB Connector.
 * Matches by contactEmail, user email, business name, project names, or location names.
 */
export async function fetchGmbBusinessesForUser({ email, name, projectNames = [] }) {
  try {
    const client = await getGmbMongoClient()
    const db = client.db('gmb-connector')

    const cleanEmail = (email || '').trim().toLowerCase()
    const cleanName = (name || '').trim()
    const namesToSearch = [
      ...(cleanName ? [cleanName] : []),
      ...projectNames.filter(Boolean).map(n => n.trim())
    ]

    const bizFilter = []
    if (cleanEmail) {
      bizFilter.push({ contactEmail: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } })
    }
    for (const n of namesToSearch) {
      if (n.length >= 3) {
        bizFilter.push({ businessName: { $regex: new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } })
      }
    }

    // Also check if any locationName in BusinessLocation matches the user's name or projects
    const matchedParentBizIds = new Set()
    for (const n of namesToSearch) {
      if (n.length >= 3) {
        const matchingLocs = await db.collection('BusinessLocation').find({
          locationName: { $regex: new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
        }).limit(10).toArray()

        for (const loc of matchingLocs) {
          if (loc.businessId) {
            matchedParentBizIds.add(loc.businessId)
          }
        }
      }
    }

    if (matchedParentBizIds.size > 0) {
      const parentIdList = Array.from(matchedParentBizIds).map(id => {
        try {
          return typeof id === 'string' ? new ObjectId(id) : id
        } catch {
          return id
        }
      })
      bizFilter.push({ _id: { $in: parentIdList } })
    }

    if (bizFilter.length === 0) {
      return []
    }

    const businesses = await db.collection('Business').find({ $or: bizFilter }).toArray()
    if (!businesses || businesses.length === 0) {
      return []
    }

    const results = []
    for (const biz of businesses) {
      const bizId = biz._id
      const bizCity = extractCityOrRegion(biz.businessDetails, biz.address, biz.businessName)
      const bizKeywords = cleanKeywordsList(Array.isArray(biz.keywords) ? biz.keywords : [], bizCity)

      // Fetch all locations belonging to this business
      const locations = await db.collection('BusinessLocation').find({
        $or: [
          { businessId: bizId },
          { businessId: bizId.toString() }
        ]
      }).toArray()

      results.push({
        businessId: biz._id.toString(),
        businessName: biz.businessName,
        contactEmail: biz.contactEmail,
        keywords: bizKeywords,
        locations: locations.map(l => {
          const locCity = extractCityOrRegion(l.businessDetails, l.address, l.locationName, biz.businessDetails, biz.address, biz.businessName)
          return {
            locationDbId: l._id.toString(),
            locationName: l.locationName || l.businessName || biz.businessName,
            locationId: l.locationId || l.placeId || '',
            storeCode: l.storeCode || '',
            businessNiche: l.businessNiche || biz.businessNiche || 'Business',
            businessDescription: l.businessDescription || biz.businessDescription || '',
            businessDetails: l.businessDetails || biz.businessDetails || '',
            keywords: cleanKeywordsList(Array.isArray(l.keywords) ? l.keywords : [], locCity)
          }
        })
      })
    }

    return results
  } catch (err) {
    console.error('[GMB Connector DB] Error fetching businesses for user:', err)
    return []
  }
}

/**
 * Fetches all SEO keywords for a specific project/location or business name.
 * Checks both BusinessLocation and Business collections in GMB Connector.
 */
export async function fetchGmbKeywordsForProject({ businessName, placeId, email, address = '' }) {
  try {
    const client = await getGmbMongoClient()
    const db = client.db('gmb-connector')

    const cleanName = (businessName || '').trim()
    const cleanEmail = (email || '').trim().toLowerCase()
    const cleanPlaceId = (placeId || '').trim()

    const rawKeywords = []
    const contextSources = [address, cleanName]

    // 1. Try to find matching BusinessLocation
    const locFilter = []
    if (cleanPlaceId) {
      locFilter.push({ locationId: cleanPlaceId })
      locFilter.push({ placeId: cleanPlaceId })
    }
    if (cleanName) {
      locFilter.push({ locationName: { $regex: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } })
      locFilter.push({ locationName: { $regex: new RegExp(cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } })
    }

    let matchedLoc = null
    if (locFilter.length > 0) {
      matchedLoc = await db.collection('BusinessLocation').findOne({ $or: locFilter })
    }

    if (matchedLoc) {
      contextSources.push(matchedLoc.businessDetails, matchedLoc.address, matchedLoc.locationName)
      if (Array.isArray(matchedLoc.keywords)) {
        rawKeywords.push(...matchedLoc.keywords)
      }

      // Also get parent business keywords
      if (matchedLoc.businessId) {
        let parentBiz = null
        try {
          const parentId = typeof matchedLoc.businessId === 'string' ? new ObjectId(matchedLoc.businessId) : matchedLoc.businessId
          parentBiz = await db.collection('Business').findOne({ _id: parentId })
        } catch {}
        if (!parentBiz) {
          parentBiz = await db.collection('Business').findOne({ _id: matchedLoc.businessId.toString() })
        }
        if (parentBiz) {
          contextSources.push(parentBiz.businessDetails, parentBiz.address, parentBiz.businessName)
          if (Array.isArray(parentBiz.keywords)) {
            rawKeywords.push(...parentBiz.keywords)
          }
        }
      }
    }

    // 2. If not found in location or additionally check Business collection
    if (cleanEmail || cleanName) {
      const bizFilter = []
      if (cleanEmail) {
        bizFilter.push({ contactEmail: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } })
      }
      if (cleanName) {
        bizFilter.push({ businessName: { $regex: new RegExp(cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } })
      }

      const matchedBusinesses = await db.collection('Business').find({ $or: bizFilter }).toArray()
      for (const biz of matchedBusinesses) {
        contextSources.push(biz.businessDetails, biz.address, biz.businessName)
        if (Array.isArray(biz.keywords)) {
          rawKeywords.push(...biz.keywords)
        }

        // If location was not found earlier, check this business's locations
        if (!matchedLoc) {
          const locs = await db.collection('BusinessLocation').find({
            $or: [{ businessId: biz._id }, { businessId: biz._id.toString() }]
          }).toArray()
          for (const loc of locs) {
            contextSources.push(loc.businessDetails, loc.address, loc.locationName)
            if (Array.isArray(loc.keywords)) {
              rawKeywords.push(...loc.keywords)
            }
          }
        }
      }
    }

    const resolvedCity = extractCityOrRegion(...contextSources)
    return cleanKeywordsList(rawKeywords, resolvedCity)
  } catch (err) {
    console.error('[GMB Connector DB] Error fetching keywords for project:', err)
    return []
  }
}

