import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/seoos-auth'
import prisma from "@/lib/prisma"

export async function GET(request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const auditRunId = searchParams.get('auditRunId')
  const projectId = searchParams.get('projectId')
  const severity = searchParams.get('severity')
  const type = searchParams.get('type')
  const status = searchParams.get('status')

  const where = {}
  if (auditRunId) where.auditRunId = auditRunId
  if (projectId) where.projectId = projectId
  if (severity) where.severity = severity
  if (type) where.type = type
  if (status) where.status = status

  const issues = await prisma.sEOIssue.findMany({
    where,
    orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
    take: 200,
  })

  return NextResponse.json({ issues })
}

export async function PATCH(request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, status, recommendation } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const updated = await prisma.sEOIssue.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(recommendation && { recommendation }),
    }
  })

  return NextResponse.json({ issue: updated })
}
