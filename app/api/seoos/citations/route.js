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

  const citations = await prisma.citationRecord.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  // Coverage stats
  const total = await prisma.citationRecord.count({ where: { projectId: projectId || undefined } })
  const live = await prisma.citationRecord.count({ where: { projectId: projectId || undefined, status: 'live' } })
  const pending = await prisma.citationRecord.count({ where: { projectId: projectId || undefined, status: 'pending' } })
  const failed = await prisma.citationRecord.count({ where: { projectId: projectId || undefined, status: 'failed' } })

  return NextResponse.json({
    citations,
    stats: { total, live, pending, failed, coverageScore: total > 0 ? Math.round((live / total) * 100) : 0 }
  })
}

export async function POST(request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { projectId, businessName, address, city, state, zip, country, phone, website, directoryName, directoryUrl, category, status, listingUrl, notes, loginEmail } = body

  if (!projectId || !businessName || !directoryName) {
    return NextResponse.json({ error: 'projectId, businessName, and directoryName required' }, { status: 400 })
  }

  const citation = await prisma.citationRecord.create({
    data: {
      id: uuidv4(),
      projectId,
      businessName,
      address: address || null,
      city: city || null,
      state: state || null,
      zip: zip || null,
      country: country || 'US',
      phone: phone || null,
      website: website || null,
      directoryName,
      directoryUrl: directoryUrl || null,
      category: category || 'general',
      status: status || 'pending',
      listingUrl: listingUrl || null,
      notes: notes || null,
      loginEmail: loginEmail || null,
      submittedAt: status && status !== 'not_submitted' ? new Date() : null,
    }
  })

  return NextResponse.json({ citation })
}

export async function PATCH(request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const validFields = ['status', 'listingUrl', 'notes', 'loginEmail', 'address', 'phone', 'website', 'directoryUrl']
  const data = {}
  validFields.forEach(f => { if (updates[f] !== undefined) data[f] = updates[f] })
  if (updates.status === 'live') data.verifiedAt = new Date()

  const citation = await prisma.citationRecord.update({ where: { id }, data })
  return NextResponse.json({ citation })
}

export async function DELETE(request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await prisma.citationRecord.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
