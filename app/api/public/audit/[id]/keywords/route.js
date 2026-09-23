import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { MongoClient } from 'mongodb'

export async function GET(req, props) {
  const params = await props.params
  try {
    const { id: projectId } = params

    const recentAudit = await prisma.businessAudit.findUnique({
      where: { id: projectId },
      include: { project: true }
    })

    if (!recentAudit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    }

    const auditData = JSON.parse(recentAudit.auditDataJson)
    const businessNameQuery = auditData.businessInfo?.name || recentAudit.project?.businessName

    if (!businessNameQuery) {
      return NextResponse.json({ activeCampaign: auditData.keywords?.activeCampaign || [] })
    }

    // Connect to GMB Connector DB
    let activeCampaign = auditData.keywords?.activeCampaign || []
    
    try {
      const gmbApiUrl = process.env.NEXT_PUBLIC_BASE_URL?.includes('connect.ringscale.ai') 
        ? `https://connect.ringscale.ai/api/keywords?businessName=${encodeURIComponent(businessNameQuery)}`
        : (process.env.GMB_API_URL ? `${process.env.GMB_API_URL}?businessName=${encodeURIComponent(businessNameQuery)}` : null);

      if (gmbApiUrl) {
        const res = await fetch(gmbApiUrl);
        if (res.ok) {
          const businesses = await res.json();
          if (businesses.length > 0 && businesses[0].keywords) {
            activeCampaign = businesses[0].keywords;
          }
        }
      } else {
        const client = new MongoClient(process.env.GMB_CONNECTOR_DB_URL || "mongodb+srv://gmb-connector:pSPvm9sIU0x37mfG@cluster0.mbawxnc.mongodb.net/gmb-connector?retryWrites=true&w=majority")
        await client.connect()
        const db = client.db('gmb-connector')
        
        const business = await db.collection('Business').findOne({ 
          businessName: { $regex: new RegExp(`^${businessNameQuery.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}$`, 'i') } 
        })
        
        if (business) {
          const allKeywords = new Set(business.keywords || [])
          const locations = await db.collection('BusinessLocation').find({ businessId: business._id }).toArray()
          for (const loc of locations) {
            if (loc.keywords && Array.isArray(loc.keywords)) {
              loc.keywords.forEach(k => allKeywords.add(k))
            }
          }
          if (allKeywords.size > 0) {
            activeCampaign = Array.from(allKeywords)
          }
        }
        await client.close()
      }
    } catch (err) {
      console.error('Failed to sync GMB keywords:', err)
    }

    // Update DB with fresh keywords
    if (JSON.stringify(activeCampaign) !== JSON.stringify(auditData.keywords?.activeCampaign)) {
      if (!auditData.keywords) auditData.keywords = {}
      auditData.keywords.activeCampaign = activeCampaign
      await prisma.businessAudit.update({
        where: { id: projectId },
        data: { auditDataJson: JSON.stringify(auditData) }
      })
    }

    return NextResponse.json({ activeCampaign })
  } catch (error) {
    console.error('API /public/audit/[id]/keywords error:', error)
    return NextResponse.json({ error: 'Failed to fetch keywords' }, { status: 500 })
  }
}
