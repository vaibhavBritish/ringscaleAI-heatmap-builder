import prisma from './prisma.js'
import { v4 as uuidv4 } from 'uuid'
import { generateAndStoreAuditReport } from './audit-generator.js'
import { fetchGmbBusinessesForUser } from './gmb-connector-db.js'

/**
 * Automatically syncs all GMB businesses and profiles/locations for a customer.
 * - Connects directly to GMB Connector MongoDB (with HTTP API fallback)
 * - Finds all profiles/locations (e.g., 7 profiles for Smiley Dental)
 * - Creates a separate Project in Ringscale for each profile/location
 * - Syncs all SEO keywords from GMB Connector into Ringscale's Keywords section
 * - Automatically generates comprehensive audit reports for all businesses
 */
export async function syncCustomerGMBBusinesses(user) {
  if (!user || (!user.email && !user.name)) {
    return { synced: 0 }
  }

  try {
    const userEmail = (user.email || '').trim().toLowerCase()
    const userName = (user.name || '').trim()

    let projectNames = []
    if (user.id) {
      try {
        const userProjects = await prisma.project.findMany({
          where: { userId: user.id },
          select: { businessName: true }
        })
        projectNames = userProjects.map(p => p.businessName).filter(Boolean)
      } catch {}
    }

    // 1. First, fetch from direct GMB Connector DB
    let matchedBusinesses = await fetchGmbBusinessesForUser({
      email: userEmail,
      name: userName,
      projectNames
    })

    // 2. Fallback to HTTP API if DB returned empty
    if (!matchedBusinesses || matchedBusinesses.length === 0) {
      try {
        const gmbApiBase = process.env.GMB_API_URL || 'https://connect.ringscale.ai/api/keywords'
        const res = await fetch(gmbApiBase, {
          headers: { 'Accept': 'application/json' },
          cache: 'no-store'
        })

        if (res.ok) {
          const allApiBusinesses = await res.json()
          if (Array.isArray(allApiBusinesses)) {
            matchedBusinesses = allApiBusinesses.filter(b => {
              const bEmail = (b.contactEmail || b.email || '').toLowerCase().trim()
              const bName = (b.businessName || '').toLowerCase().trim()
              const emailMatch = userEmail && bEmail && bEmail === userEmail
              const nameMatch = userName && bName && (
                bName === userName.toLowerCase() ||
                userName.toLowerCase().includes(bName) ||
                bName.includes(userName.toLowerCase())
              )
              return emailMatch || nameMatch
            })
          }
        }
      } catch (apiErr) {
        console.warn('[Auto-Sync] HTTP API fallback error:', apiErr.message)
      }
    }

    if (!matchedBusinesses || matchedBusinesses.length === 0) {
      return { synced: 0 }
    }

    let totalProjectsSynced = 0
    let totalKeywordsSynced = 0
    let auditsQueued = 0

    for (const biz of matchedBusinesses) {
      const bizName = biz.businessName || 'Business'
      const bizKeywords = Array.isArray(biz.keywords) ? biz.keywords : []

      // If business has separate locations (e.g., 7 locations), create a project for EACH location
      const locations = Array.isArray(biz.locations) && biz.locations.length > 0
        ? biz.locations
        : [{
            locationName: bizName,
            locationId: `gmb_${uuidv4().substring(0, 8)}`,
            keywords: bizKeywords,
            address: biz.address || '',
            businessNiche: biz.businessNiche || 'Business'
          }]

      for (const loc of locations) {
        const locName = (loc.locationName || loc.businessName || bizName).trim()
        const locId = (loc.locationId || loc.placeId || '').trim()

        let project = null
        if (locId) {
          project = await prisma.project.findFirst({
            where: { userId: user.id, placeId: locId }
          })
        }
        if (!project) {
          project = await prisma.project.findFirst({
            where: { 
              userId: user.id, 
              businessName: { equals: locName, mode: 'insensitive' } 
            }
          })
        }

        if (!project) {
          project = await prisma.project.create({
            data: {
              id: uuidv4(),
              userId: user.id,
              businessName: locName,
              placeId: locId || `gmb_${uuidv4().substring(0, 8)}`,
              address: loc.address || loc.businessDetails || '',
              latitude: parseFloat(loc.latitude) || 0,
              longitude: parseFloat(loc.longitude) || 0,
              primaryType: loc.businessNiche || 'Business',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          })
        }

        totalProjectsSynced++

        // Combine location-specific keywords AND parent business keywords
        const allKeywordsSet = new Set([
          ...(Array.isArray(loc.keywords) ? loc.keywords : []),
          ...bizKeywords
        ])

        for (const kw of allKeywordsSet) {
          if (kw && typeof kw === 'string' && kw.trim()) {
            const trimmed = kw.trim()
            const existing = await prisma.keyword.findFirst({
              where: { projectId: project.id, keyword: trimmed }
            })
            if (!existing) {
              await prisma.keyword.create({
                data: {
                  id: uuidv4(),
                  projectId: project.id,
                  keyword: trimmed,
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
              })
              totalKeywordsSynced++
            }
          }
        }

        // Check if an audit report exists or needs refresh
        const existingAudit = await prisma.businessAudit.findUnique({
          where: { id: project.id }
        })

        if (!existingAudit) {
          auditsQueued++
          generateAndStoreAuditReport(project.id).catch(err => {
            console.error(`[Auto-Sync] Audit generation failed for project ${project.id} (${locName}):`, err)
          })
        } else {
          // If audit exists, ensure its activeCampaign has the keywords
          try {
            const auditData = JSON.parse(existingAudit.auditDataJson || '{}')
            if (!auditData.keywords?.activeCampaign || auditData.keywords.activeCampaign.length === 0) {
              if (!auditData.keywords) auditData.keywords = {}
              auditData.keywords.activeCampaign = Array.from(allKeywordsSet)
              await prisma.businessAudit.update({
                where: { id: project.id },
                data: {
                  auditDataJson: JSON.stringify(auditData),
                  updatedAt: new Date()
                }
              })
            }
          } catch {}
        }
      }
    }

    return { 
      synced: totalProjectsSynced, 
      businessesFound: matchedBusinesses.length,
      keywordsSynced: totalKeywordsSynced,
      auditsQueued 
    }
  } catch (err) {
    console.error('[Auto-Sync] Error in syncCustomerGMBBusinesses:', err)
    return { synced: 0, error: err.message }
  }
}
