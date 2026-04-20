import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request, { params }) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    let project
    try {
      // Standard Prisma lookup
      project = await prisma.project.findUnique({
        where: { clientSlug: slug }
      })
    } catch (err) {
      console.warn("Client API: Stale schema detected, using Failsafe...")
      // Direct MongoDB bypass
      try {
        const result = await prisma.$runCommandRaw({
          find: "projects",
          filter: { clientSlug: slug },
          limit: 1
        })
        if (result.cursor?.firstBatch?.length > 0) {
          project = result.cursor.firstBatch[0]
        }
      } catch (f) {
        console.error("Client API Failsafe error:", f)
      }
    }

    if (!project) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error('API Error fetching client:', error)
    return NextResponse.json({ error: 'Failed to fetch client data' }, { status: 500 })
  }
}
