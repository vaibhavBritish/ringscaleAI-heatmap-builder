import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/seoos-auth'
import prisma from "@/lib/prisma"
import Anthropic from '@anthropic-ai/sdk'
import { v4 as uuidv4 } from 'uuid'

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set in environment variables')
  }
  return new Anthropic({ apiKey })
}

const SYSTEM_PROMPT = `You are an expert SEO consultant. Generate precise, actionable SEO recommendations.
Always respond with valid JSON only — no markdown, no preamble.
All recommendations should be:
- Unique and specific to the provided context
- Free of keyword stuffing  
- Compliant with Google Webmaster Guidelines
- Concise but complete`

const TYPE_PROMPTS = {
  title: (ctx) => `Generate an optimized title tag for this page.
Business: ${ctx.businessName}
Current title: ${ctx.currentText || 'None'}
Page URL: ${ctx.pageUrl || 'Homepage'}
Target keywords: ${ctx.keywords?.join(', ') || 'not specified'}
Location: ${ctx.location || 'not specified'}

Respond with JSON: {"suggestedText": "...", "reasoning": "...", "confidenceScore": 0-100, "riskScore": 0-100}`,

  meta: (ctx) => `Generate an optimized meta description for this page.
Business: ${ctx.businessName}
Current meta: ${ctx.currentText || 'None'}
Page URL: ${ctx.pageUrl || 'Homepage'}
Target keywords: ${ctx.keywords?.join(', ') || 'not specified'}
Location: ${ctx.location || 'not specified'}

Respond with JSON: {"suggestedText": "...", "reasoning": "...", "confidenceScore": 0-100, "riskScore": 0-100}`,

  h1: (ctx) => `Generate an optimized H1 heading for this page.
Business: ${ctx.businessName}
Current H1: ${ctx.currentText || 'None'}
Page URL: ${ctx.pageUrl || 'Homepage'}
Target keywords: ${ctx.keywords?.join(', ') || 'not specified'}

Respond with JSON: {"suggestedText": "...", "reasoning": "...", "confidenceScore": 0-100, "riskScore": 0-100}`,

  faq: (ctx) => `Generate 3 relevant FAQ items for this business page.
Business: ${ctx.businessName}
Service/Topic: ${ctx.topic || 'general services'}
Location: ${ctx.location || 'not specified'}

Respond with JSON: {"suggestedText": "Q: ...\\nA: ...\\n\\nQ: ...\\nA: ...\\n\\nQ: ...\\nA: ...", "reasoning": "...", "confidenceScore": 0-100, "riskScore": 0-100}`,

  gbp_description: (ctx) => `Write an optimized Google Business Profile description.
Business: ${ctx.businessName}
Category: ${ctx.category || 'not specified'}
Services: ${ctx.services || 'not specified'}
Location: ${ctx.location || 'not specified'}
Current description: ${ctx.currentText || 'None'}

Keep it under 750 characters. Include primary service keywords naturally. No links, no promotional claims.
Respond with JSON: {"suggestedText": "...", "reasoning": "...", "confidenceScore": 0-100, "riskScore": 0-100}`,

  gbp_post: (ctx) => `Write a Google Business Profile post.
Business: ${ctx.businessName}
Topic/Offer: ${ctx.topic || 'general update'}
Location: ${ctx.location || 'not specified'}

Keep it 100-200 words, engaging, includes a soft call to action.
Respond with JSON: {"suggestedText": "...", "reasoning": "...", "confidenceScore": 0-100, "riskScore": 0-100}`,

  content: (ctx) => `Rewrite and improve this page content section for better SEO.
Business: ${ctx.businessName}
Current content: ${ctx.currentText || 'No content provided'}
Target keywords: ${ctx.keywords?.join(', ') || 'not specified'}
Location: ${ctx.location || 'not specified'}

Improve clarity, keyword coverage, and user value. Avoid stuffing.
Respond with JSON: {"suggestedText": "...", "reasoning": "...", "confidenceScore": 0-100, "riskScore": 0-100}`,

  keyword_cluster: (ctx) => `Cluster these keywords by search intent and topic.
Keywords: ${ctx.keywords?.join(', ')}
Business: ${ctx.businessName}
Location: ${ctx.location || 'not specified'}

Group into clusters: branded, local_service, informational, transactional, question.
Respond with JSON: {"clusters": [{"name": "...", "intent": "branded|local_service|informational|transactional|question", "keywords": ["..."]}], "reasoning": "..."}`,

  keyword_suggest: (ctx) => `Suggest high-value SEO keywords for this business to rank for.
Business: ${ctx.businessName}
Industry/Category: ${ctx.category || 'not specified'}
Location: ${ctx.location || 'not specified'}
Services: ${ctx.services || 'not specified'}
Existing keywords: ${ctx.keywords?.join(', ') || 'none yet'}

Generate 10-15 keyword suggestions that the business should target but is NOT already targeting.
Include a mix of:
- High-volume head terms
- Long-tail keywords with buying intent
- Local keywords with location modifiers
- Question-based keywords for FAQ/blog content
- "Near me" and geo-specific variants

For each keyword, estimate the search intent and difficulty.
Respond with JSON: {"suggestions": [{"keyword": "...", "intent": "branded|local_service|informational|transactional|question", "difficulty": "low|medium|high", "priority": "high|medium|low", "reason": "..."}], "strategy": "..."}`,
}

export async function POST(request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { type, projectId, context, saveToDb = true } = body

  if (!type || !projectId || !context) {
    return NextResponse.json({ error: 'type, projectId, and context required' }, { status: 400 })
  }

  const promptFn = TYPE_PROMPTS[type]
  if (!promptFn) return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 })

  const userPrompt = promptFn(context)

  let message
  try {
    const anthropic = getAnthropicClient()
    message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: SYSTEM_PROMPT + "\nIMPORTANT: LIMIT TO 8 SUGGESTIONS MAX. Your response MUST be valid JSON and MUST NOT be truncated. Keep 'reason' fields extremely short (max 10 words).",
      messages: [{ role: 'user', content: userPrompt }]
    })
  } catch (err) {
    console.error('Anthropic API error:', err.message)
    return NextResponse.json(
      { error: err.message || 'AI service unavailable' },
      { status: 500 }
    )
  }

  let parsed
  try {
    const textBlock = message.content.find(b => b.type === 'text')
    if (!textBlock) throw new Error('No text content in response')
    
    let raw = textBlock.text.trim()
    console.log('AI Raw Response (First 200 chars):', raw.substring(0, 200))

    // More aggressive JSON extraction: find first { and last }
    const firstBrace = raw.indexOf('{')
    const lastBrace = raw.lastIndexOf('}')
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      raw = raw.substring(firstBrace, lastBrace + 1)
    }

    parsed = JSON.parse(raw)
  } catch (e) {
    const fullContent = message.content?.map(c => c.text).join('\n') || 'empty'
    console.error('Parse error:', e.message)
    console.error('Full response that failed to parse:', fullContent)
    return NextResponse.json({ 
      error: 'AI response parse error', 
      details: e.message,
      raw: fullContent.substring(0, 1000) // Send snippet to frontend for debugging
    }, { status: 500 })
  }

  // If it's a keyword cluster or suggestion, don't save as recommendation
  if (type === 'keyword_cluster' || type === 'keyword_suggest') {
    return NextResponse.json({ result: parsed })
  }

  // Save recommendation to DB
  let rec = null
  if (saveToDb) {
    rec = await prisma.aIRecommendation.create({
      data: {
        id: uuidv4(),
        projectId,
        issueId: context.issueId || null,
        type,
        pageUrl: context.pageUrl || null,
        originalText: context.currentText || null,
        suggestedText: parsed.suggestedText,
        reasoning: parsed.reasoning,
        confidenceScore: parsed.confidenceScore,
        riskScore: parsed.riskScore,
        status: 'pending',
      }
    })
  }

  return NextResponse.json({ recommendation: rec || parsed, raw: parsed })
}

export async function GET(request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const status = searchParams.get('status')
  const type = searchParams.get('type')

  const where = {}
  if (projectId) where.projectId = projectId
  if (status) where.status = status
  if (type) where.type = type

  const recommendations = await prisma.aIRecommendation.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ recommendations })
}

export async function PATCH(request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, status, approvedText } = await request.json()
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })

  const updated = await prisma.aIRecommendation.update({
    where: { id },
    data: {
      status,
      approvedText: approvedText || null,
      approvedBy: status !== 'pending' ? session.user.id : null,
      approvedAt: status !== 'pending' ? new Date() : null,
    }
  })

  // If approved and has issueId, mark issue as resolved
  if (status === 'approved' && updated.issueId) {
    await prisma.sEOIssue.update({
      where: { id: updated.issueId },
      data: { status: 'resolved' }
    })
  }

  // Also log to changelog if approved
  if (status === 'approved') {
    await prisma.sEOChangeLog.create({
      data: {
        id: uuidv4(),
        projectId: updated.projectId,
        type: 'content',
        title: `Applied AI Recommendation: ${updated.type}`,
        description: `AI suggested ${updated.type} was approved and applied.`,
        afterValue: approvedText || updated.suggestedText,
        recordedBy: session.user.id,
      }
    })
  }

  return NextResponse.json({ recommendation: updated })
}
