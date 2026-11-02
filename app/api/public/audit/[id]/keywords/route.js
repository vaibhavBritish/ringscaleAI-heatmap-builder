import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { fetchGmbKeywordsForProject, extractCityOrRegion, cleanKeywordsList } from '@/lib/gmb-connector-db'
import { syncProjectKeywords } from '@/lib/keyword-sync'

export async function GET(req, props) {
  const params = await props.params
  try {
    const { id: projectId } = params

    let recentAudit = await prisma.businessAudit.findUnique({
      where: { id: projectId }
    })

    if (!recentAudit) {
      recentAudit = await prisma.businessAudit.findFirst({
        where: { projectId: projectId }
      })
    }

    if (!recentAudit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    }
    
    const project = await prisma.project.findUnique({
      where: { id: recentAudit.projectId || projectId }
    })

    const auditData = JSON.parse(recentAudit.auditDataJson || '{}')
    const businessNameQuery = project?.businessName || auditData.businessInfo?.name || ''

    // 1. GMB Connector is the source of truth: when this business is connected there,
    //    mirror its keyword list exactly (keywords removed in GMB disappear here too)
    let activeCampaign = await fetchGmbKeywordsForProject({
      businessName: businessNameQuery,
      placeId: project?.placeId,
      address: project?.address || auditData.businessInfo?.address || ''
    })

    // 2. Not connected to GMB Connector: fall back to locally stored keywords
    if (!activeCampaign) {
      const rawKeywords = []
      if (project?.id) {
        const storedKeywords = await prisma.keyword.findMany({
          where: { projectId: project.id },
          select: { keyword: true }
        })
        storedKeywords.forEach(k => {
          if (k.keyword && k.keyword.trim()) rawKeywords.push(k.keyword.trim())
        })
      }
      if (Array.isArray(auditData.keywords?.activeCampaign)) {
        auditData.keywords.activeCampaign.forEach(k => {
          if (k && typeof k === 'string' && k.trim()) rawKeywords.push(k.trim())
        })
      }

      // Resolve City/Region to clean placeholders like [city/region], [your city], etc.
      const resolvedCity = extractCityOrRegion(
        project?.address,
        auditData.businessInfo?.address,
        project?.businessName,
        auditData.businessInfo?.name
      )
      activeCampaign = cleanKeywordsList(rawKeywords, resolvedCity)
    }

    // 3. Make the project's Keyword records match the active list
    if (project?.id && activeCampaign.length > 0) {
      try {
        await syncProjectKeywords(project.id, activeCampaign)
      } catch (dbErr) {
        console.error('[Keywords API] Error syncing prisma keywords:', dbErr)
      }
    }

    // 4. Update auditDataJson with the clean, active keywords
    if (JSON.stringify(activeCampaign) !== JSON.stringify(auditData.keywords?.activeCampaign)) {
      if (!auditData.keywords) auditData.keywords = {}
      auditData.keywords.activeCampaign = activeCampaign
      await prisma.businessAudit.update({
        where: { id: recentAudit.id },
        data: { auditDataJson: JSON.stringify(auditData) }
      })
    }

    return NextResponse.json({ activeCampaign })
  } catch (error) {
    console.error('API /public/audit/[id]/keywords error:', error)
    return NextResponse.json({ error: 'Failed to fetch keywords' }, { status: 500 })
  }
}

