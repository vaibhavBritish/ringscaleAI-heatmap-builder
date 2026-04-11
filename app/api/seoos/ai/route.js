import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/seoos-auth'
import prisma from "@/lib/prisma"
import Anthropic from '@anthropic-ai/sdk'
import { v4 as uuidv4 } from 'uuid'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }]
  })

  let parsed
  try {
    const raw = message.content[0].text.trim()
    parsed = JSON.parse(raw)
  } catch (e) {
    return NextResponse.json({ error: 'AI response parse error', raw: message.content[0].text }, { status: 500 })
  }

  // If it's a keyword cluster, don't save as recommendation
  if (type === 'keyword_cluster') {
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

  return NextResponse.json({ recommendation: updated })
}
