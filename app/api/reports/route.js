import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit')) || 50

    // 1. Get all projects for the user
    const projects = await prisma.project.findMany({
      where: { userId: session.user.id }
    })

    if (projects.length === 0) {
      return NextResponse.json({ reports: [] })
    }

    const projectIds = projects.map(p => p.id)
    const projectMap = projects.reduce((acc, p) => {
      acc[p.id] = p
      return acc
    }, {})

    // 2. Get all completed scan jobs for these projects
    const scanJobs = await prisma.scanJob.findMany({
      where: { projectId: { in: projectIds }, status: 'completed' },
      orderBy: { completedAt: 'desc' },
      take: limit
    })

    if (scanJobs.length === 0) {
      return NextResponse.json({ reports: [] })
    }

    // 3. Get associated keywords
    const keywordIds = scanJobs.map(s => s.keywordId)
    const keywords = await prisma.keyword.findMany({
      where: { id: { in: keywordIds } }
    })

    const keywordMap = keywords.reduce((acc, k) => {
      acc[k.id] = k.keyword
      return acc
    }, {})

    // 4. Assemble the reports
    const reports = scanJobs.map(scan => ({
      id: scan.id,
      projectId: scan.projectId,
      projectName: projectMap[scan.projectId]?.businessName || 'Unknown Project',
      keywordId: scan.keywordId,
      keyword: keywordMap[scan.keywordId] || 'Unknown Keyword',
      totalPoints: scan.totalPoints,
      searchRadiusMeters: scan.searchRadiusMeters,
      gridSettings: projectMap[scan.projectId]?.gridSettings || null,
      createdAt: scan.createdAt,
      completedAt: scan.completedAt,
    }))

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('API /reports block error:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
