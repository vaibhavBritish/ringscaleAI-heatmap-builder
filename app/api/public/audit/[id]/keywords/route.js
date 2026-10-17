import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { fetchGmbKeywordsForProject } from '@/lib/gmb-connector-db'
import { v4 as uuidv4 } from 'uuid'

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

    const user = project?.userId ? await prisma.user.findUnique({
      where: { id: project.userId },
      select: { email: true, name: true }
    }) : null

    const auditData = JSON.parse(recentAudit.auditDataJson || '{}')
    const businessNameQuery = project?.businessName || auditData.businessInfo?.name || ''

    const allKeywords = new Set()

    // 1. Existing keywords from Prisma Keyword table
    if (project?.id) {
      const storedKeywords = await prisma.keyword.findMany({
        where: { projectId: project.id },
        select: { keyword: true }
      })
      storedKeywords.forEach(k => {
        if (k.keyword && k.keyword.trim()) allKeywords.add(k.keyword.trim())
      })
    }

    // 2. Existing keywords from auditDataJson
    if (Array.isArray(auditData.keywords?.activeCampaign)) {
      auditData.keywords.activeCampaign.forEach(k => {
        if (k && typeof k === 'string' && k.trim()) allKeywords.add(k.trim())
      })
    }

    // 3. Fetch fresh keywords directly from GMB Connector Database
    try {
      const gmbKeywords = await fetchGmbKeywordsForProject({
        businessName: businessNameQuery,
        placeId: project?.placeId,
        email: user?.email
      })

      if (Array.isArray(gmbKeywords) && gmbKeywords.length > 0) {
        for (const kw of gmbKeywords) {
          if (kw && typeof kw === 'string' && kw.trim()) {
            const trimmed = kw.trim()
            allKeywords.add(trimmed)

            // Save to Prisma Keyword if project exists
            if (project?.id) {
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
                }).catch(() => {})
              }
            }
          }
        }
      }
    } catch (gmbErr) {
      console.error('[Keywords API] Error fetching from GMB Connector DB:', gmbErr)
    }

    // 4. Update auditDataJson with the merged, active keywords
    const activeCampaign = Array.from(allKeywords)
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
