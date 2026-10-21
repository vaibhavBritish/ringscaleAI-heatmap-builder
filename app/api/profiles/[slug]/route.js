import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import redis from '@/lib/redis'
import {
  getFullProfileData,
  createGmbPost,
  replyToGmbReview,
  generateAIPost,
  generateAIReply
} from '@/lib/profile-service'

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  try {
    const { slug } = await params
    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || null

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const filter = searchParams.get('filter') || 'all'
    const search = searchParams.get('search') || ''

    // Fast Redis cache lookup
    const cacheKey = `profile:${slug}:p${page}:l${limit}:f${filter}:s${encodeURIComponent(search)}`
    if (redis) {
      try {
        const cached = await redis.get(cacheKey)
        if (cached) {
          return NextResponse.json(JSON.parse(cached))
        }
      } catch {}
    }

    const data = await getFullProfileData(slug, userId, { page, limit, filter, search })

    if (!data) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const responsePayload = {
      success: true,
      ...data
    }

    if (redis) {
      try {
        await redis.set(cacheKey, JSON.stringify(responsePayload), 'EX', 120) // 2 minutes TTL
      } catch {}
    }

    return NextResponse.json(responsePayload)
  } catch (error) {
    console.error('Error in GET /api/profiles/[slug]:', error)
    return NextResponse.json({
      error: 'Failed to retrieve profile data',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const { slug } = await params
    const body = await request.json()
    const { action } = body

    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 })
    }

    // Invalidate cached profile on write operations
    if (redis) {
      try {
        const keys = await redis.keys(`profile:${slug}:*`)
        if (keys && keys.length > 0) {
          await redis.del(...keys)
        }
      } catch {}
    }

    // 1. Create a new GMB Post
    if (action === 'create_post') {
      const {
        title,
        content,
        postType,
        ctaType,
        ctaUrl,
        imageUrl,
        status,
        scheduledFor,
        projectId
      } = body

      if (!content || !content.trim()) {
        return NextResponse.json({ error: 'Post content is required' }, { status: 400 })
      }

      const post = await createGmbPost({
        projectId: projectId || slug,
        slug,
        title,
        content,
        postType,
        ctaType,
        ctaUrl,
        imageUrl,
        status,
        scheduledFor
      })

      return NextResponse.json({
        success: true,
        message: 'GMB Post created successfully',
        post
      })
    }

    // 2. Reply to a review
    if (action === 'reply_review') {
      const { reviewId, replyText, repliedBy } = body
      if (!reviewId || !replyText) {
        return NextResponse.json({ error: 'reviewId and replyText are required' }, { status: 400 })
      }

      const updated = await replyToGmbReview({
        reviewId,
        slug,
        replyText: replyText.trim(),
        repliedBy: repliedBy || 'Business Owner'
      })

      return NextResponse.json({
        success: true,
        message: 'Review reply saved successfully',
        review: updated
      })
    }

    // 3. AI Generate a GMB Post
    if (action === 'generate_ai_post') {
      const { businessName, category, location, topic, offer, ctaType } = body
      const generated = await generateAIPost({
        businessName: businessName || 'Our Business',
        category,
        location,
        topic,
        offer,
        ctaType
      })

      return NextResponse.json({
        success: true,
        generated
      })
    }

    // 4. AI Generate Review Reply
    if (action === 'generate_ai_reply') {
      const { reviewerName, rating, reviewText, businessName } = body
      const reply = await generateAIReply({
        reviewerName,
        rating: rating || 5,
        reviewText,
        businessName: businessName || 'Our Business'
      })

      return NextResponse.json({
        success: true,
        reply
      })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (error) {
    console.error('Error in POST /api/profiles/[slug]:', error)
    return NextResponse.json({
      error: 'Failed to process request',
      details: error.message
    }, { status: 500 })
  }
}
