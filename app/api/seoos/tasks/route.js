import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/seoos-auth'
import prisma from "@/lib/prisma"
import { v4 as uuidv4 } from 'uuid'

export async function GET(request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const status = searchParams.get('status')

  const where = {}
  if (projectId) where.projectId = projectId
  if (status) where.status = status

  const tasks = await prisma.sEOTask.findMany({
    where,
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    take: 100,
  })

  return NextResponse.json({ tasks })
}

export async function POST(request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { projectId, title, description, type, priority, assignedTo, dueDate, issueId, aiRecId } = body

  if (!projectId || !title) return NextResponse.json({ error: 'projectId and title required' }, { status: 400 })

  const task = await prisma.sEOTask.create({
    data: {
      id: uuidv4(),
      projectId,
      title,
      description: description || null,
      type: type || null,
      priority: priority || 'medium',
      assignedTo: assignedTo || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      issueId: issueId || null,
      aiRecId: aiRecId || null,
      createdBy: session.user.id,
      status: 'open',
    }
  })

  return NextResponse.json({ task })
}

export async function PATCH(request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, status, priority, assignedTo, dueDate, title, description } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const updated = await prisma.sEOTask.update({
    where: { id },
    data: {
      ...(status && { status, ...(status === 'done' ? { completedAt: new Date() } : {}) }),
      ...(priority && { priority }),
      ...(assignedTo !== undefined && { assignedTo }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(title && { title }),
      ...(description !== undefined && { description }),
    }
  })

  return NextResponse.json({ task: updated })
}

export async function DELETE(request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await prisma.sEOTask.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
