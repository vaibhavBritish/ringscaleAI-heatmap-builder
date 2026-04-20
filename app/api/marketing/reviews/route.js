import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateAIReviews } from '@/lib/ai-marketing'

export async function POST(request) {
  try {
    const { slug, count = 5 } = await request.json()

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    const project = await prisma.project.findUnique({
      where: { clientSlug: slug }
    })

    if (!project) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const reviews = await generateAIReviews(project, count)
    
    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('API Error generating reviews:', error)
    return NextResponse.json({ 
      error: 'Failed to generate reviews', 
      details: error.message 
    }, { status: 500 })
  }
}
