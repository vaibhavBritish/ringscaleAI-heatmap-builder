import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/seoos-auth'
import prisma from "@/lib/prisma"
import { v4 as uuidv4 } from 'uuid'

export async function GET(request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const type = searchParams.get('type')

  const where = {}
  if (projectId) where.projectId = projectId
  if (type) where.type = type

  const logs = await prisma.sEOChangeLog.findMany({
    where,
    orderBy: { happenedAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({ logs })
}

export async function POST(request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { projectId, type, title, description, pageUrl, beforeValue, afterValue, happenedAt } = body

  if (!projectId || !type || !title) {
    return NextResponse.json({ error: 'projectId, type, and title required' }, { status: 400 })
  }

  const log = await prisma.sEOChangeLog.create({
    data: {
      id: uuidv4(),
      projectId,
      type,
      title,
      description: description || null,
      pageUrl: pageUrl || null,
      beforeValue: beforeValue || null,
      afterValue: afterValue || null,
      recordedBy: session.user.id,
      happenedAt: happenedAt ? new Date(happenedAt) : new Date(),
    }
  })

  return NextResponse.json({ log })
}
