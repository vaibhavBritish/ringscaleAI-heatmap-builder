import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const performance = await prisma.sEOPerformance.findMany({
      where: { projectId },
      orderBy: { date: 'asc' },
      take: 30, // Last 30 days
    })

    return NextResponse.json({ performance })
  } catch (error) {
    console.error('GSC Data Error:', error.message)
    return NextResponse.json({ error: 'Failed to fetch GSC data' }, { status: 500 })
  }
}
