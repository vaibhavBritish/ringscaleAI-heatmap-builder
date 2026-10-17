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
      const bizKeywords = Array.isArray(biz.keywords) ? biz.keywords : []

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
        locations: locations.map(l => ({
          locationDbId: l._id.toString(),
          locationName: l.locationName || l.businessName || biz.businessName,
          locationId: l.locationId || l.placeId || '',
          storeCode: l.storeCode || '',
          businessNiche: l.businessNiche || biz.businessNiche || 'Business',
          businessDescription: l.businessDescription || biz.businessDescription || '',
          businessDetails: l.businessDetails || biz.businessDetails || '',
          keywords: Array.isArray(l.keywords) ? l.keywords : []
        }))
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
export async function fetchGmbKeywordsForProject({ businessName, placeId, email }) {
  try {
    const client = await getGmbMongoClient()
    const db = client.db('gmb-connector')

    const cleanName = (businessName || '').trim()
    const cleanEmail = (email || '').trim().toLowerCase()
    const cleanPlaceId = (placeId || '').trim()

    const collectedKeywords = new Set()

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
      if (Array.isArray(matchedLoc.keywords)) {
        matchedLoc.keywords.forEach(k => {
          if (k && typeof k === 'string' && k.trim()) collectedKeywords.add(k.trim())
        })
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
        if (parentBiz && Array.isArray(parentBiz.keywords)) {
          parentBiz.keywords.forEach(k => {
            if (k && typeof k === 'string' && k.trim()) collectedKeywords.add(k.trim())
          })
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
        if (Array.isArray(biz.keywords)) {
          biz.keywords.forEach(k => {
            if (k && typeof k === 'string' && k.trim()) collectedKeywords.add(k.trim())
          })
        }

        // If location was not found earlier, check this business's locations
        if (!matchedLoc) {
          const locs = await db.collection('BusinessLocation').find({
            $or: [{ businessId: biz._id }, { businessId: biz._id.toString() }]
          }).toArray()
          for (const loc of locs) {
            if (Array.isArray(loc.keywords)) {
              loc.keywords.forEach(k => {
                if (k && typeof k === 'string' && k.trim()) collectedKeywords.add(k.trim())
              })
            }
          }
        }
      }
    }

    return Array.from(collectedKeywords)
  } catch (err) {
    console.error('[GMB Connector DB] Error fetching keywords for project:', err)
    return []
  }
}
