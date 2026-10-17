import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { fetchGmbKeywordsForProject, extractCityOrRegion, cleanKeywordsList } from '@/lib/gmb-connector-db'
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

    const rawKeywords = []

    // 1. Existing keywords from Prisma Keyword table
    if (project?.id) {
      const storedKeywords = await prisma.keyword.findMany({
        where: { projectId: project.id },
        select: { keyword: true }
      })
      storedKeywords.forEach(k => {
        if (k.keyword && k.keyword.trim()) rawKeywords.push(k.keyword.trim())
      })
    }

    // 2. Existing keywords from auditDataJson
    if (Array.isArray(auditData.keywords?.activeCampaign)) {
      auditData.keywords.activeCampaign.forEach(k => {
        if (k && typeof k === 'string' && k.trim()) rawKeywords.push(k.trim())
      })
    }

    // 3. Fetch fresh keywords directly from GMB Connector Database
    try {
      const gmbKeywords = await fetchGmbKeywordsForProject({
        businessName: businessNameQuery,
        placeId: project?.placeId,
        email: user?.email,
        address: project?.address || auditData.businessInfo?.address || ''
      })

      if (Array.isArray(gmbKeywords) && gmbKeywords.length > 0) {
        rawKeywords.push(...gmbKeywords)
      }
    } catch (gmbErr) {
      console.error('[Keywords API] Error fetching from GMB Connector DB:', gmbErr)
    }

    // 4. Resolve City/Region dynamically from GMB address, project address, or business details
    const resolvedCity = extractCityOrRegion(
      project?.address,
      auditData.businessInfo?.address,
      project?.businessName,
      auditData.businessInfo?.name
    )

    // 5. Clean all placeholders [city/region], [your city], etc. and deduplicate
    const activeCampaign = cleanKeywordsList(rawKeywords, resolvedCity)

    // 6. Update Prisma Keyword records if placeholders existed or keywords need sync
    if (project?.id && activeCampaign.length > 0) {
      try {
        const currentKeywords = await prisma.keyword.findMany({
          where: { projectId: project.id }
        })
        const hasPlaceholdersOrDuplicates = currentKeywords.some(k => 
          k.keyword.includes('[') || k.keyword.includes('(')
        ) || currentKeywords.length > activeCampaign.length

        if (hasPlaceholdersOrDuplicates) {
          // Delete old placeholder/duplicate records
          await prisma.keyword.deleteMany({
            where: { projectId: project.id }
          })
          // Insert clean unique keywords
          for (const kw of activeCampaign) {
            await prisma.keyword.create({
              data: {
                id: uuidv4(),
                projectId: project.id,
                keyword: kw,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            }).catch(() => {})
          }
        } else {
          // Ensure every active keyword exists
          const existingSet = new Set(currentKeywords.map(k => k.keyword.toLowerCase()))
          for (const kw of activeCampaign) {
            if (!existingSet.has(kw.toLowerCase())) {
              await prisma.keyword.create({
                data: {
                  id: uuidv4(),
                  projectId: project.id,
                  keyword: kw,
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
              }).catch(() => {})
            }
          }
        }
      } catch (dbErr) {
        console.error('[Keywords API] Error updating prisma keywords:', dbErr)
      }
    }

    // 7. Update auditDataJson with the clean, active keywords
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

