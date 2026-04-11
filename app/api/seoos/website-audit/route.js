import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/seoos-auth'
import prisma from "@/lib/prisma"
import { v4 as uuidv4 } from 'uuid'

// ─── Website Audit Engine ─────────────────────────────────────────────────────

const ISSUE_CHECKS = {
  // Title checks
  checkTitle: (html, url) => {
    const issues = []
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    if (!titleMatch) {
      issues.push({ type: 'on-page', severity: 'critical', title: 'Missing Title Tag', description: 'No <title> tag found on this page.', pageUrl: url, impact: 'high', effort: 'low' })
    } else {
      const title = titleMatch[1].trim()
      if (title.length < 30) issues.push({ type: 'on-page', severity: 'warning', title: 'Title Too Short', description: `Title is only ${title.length} chars. Aim for 50–60.`, pageUrl: url, impact: 'medium', effort: 'low' })
      if (title.length > 65) issues.push({ type: 'on-page', severity: 'warning', title: 'Title Too Long', description: `Title is ${title.length} chars. Keep under 65.`, pageUrl: url, impact: 'medium', effort: 'low' })
    }
    return issues
  },

  checkMeta: (html, url) => {
    const issues = []
    const metaMatch = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)/i)
    if (!metaMatch) {
      issues.push({ type: 'on-page', severity: 'critical', title: 'Missing Meta Description', description: 'No meta description found.', pageUrl: url, impact: 'high', effort: 'low' })
    } else {
      const meta = metaMatch[1].trim()
      if (meta.length < 70) issues.push({ type: 'on-page', severity: 'warning', title: 'Meta Description Too Short', description: `Meta is ${meta.length} chars. Aim for 120–160.`, pageUrl: url, impact: 'medium', effort: 'low' })
      if (meta.length > 165) issues.push({ type: 'on-page', severity: 'warning', title: 'Meta Description Too Long', description: `Meta is ${meta.length} chars. Keep under 165.`, pageUrl: url, impact: 'low', effort: 'low' })
    }
    return issues
  },

  checkH1: (html, url) => {
    const issues = []
    const h1Matches = html.match(/<h1[^>]*>/gi) || []
    if (h1Matches.length === 0) issues.push({ type: 'on-page', severity: 'critical', title: 'Missing H1 Tag', description: 'No H1 tag found. Every page should have exactly one H1.', pageUrl: url, impact: 'high', effort: 'low' })
    if (h1Matches.length > 1) issues.push({ type: 'on-page', severity: 'warning', title: 'Multiple H1 Tags', description: `Found ${h1Matches.length} H1 tags. Use only one per page.`, pageUrl: url, impact: 'medium', effort: 'low' })
    return issues
  },

  checkImages: (html, url) => {
    const issues = []
    const imgTags = html.match(/<img[^>]+>/gi) || []
    const missingAlt = imgTags.filter(img => !img.match(/alt=["'][^"']+["']/i))
    if (missingAlt.length > 0) {
      issues.push({ type: 'on-page', severity: 'warning', title: 'Images Missing Alt Text', description: `${missingAlt.length} image(s) have missing or empty alt attributes.`, pageUrl: url, impact: 'medium', effort: 'medium' })
    }
    return issues
  },

  checkCanonical: (html, url) => {
    const issues = []
    const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']*)/i)
    if (!canonical) issues.push({ type: 'technical', severity: 'warning', title: 'Missing Canonical Tag', description: 'No canonical link element found. Helps prevent duplicate content issues.', pageUrl: url, impact: 'medium', effort: 'low' })
    return issues
  },

  checkSchema: (html, url) => {
    const issues = []
    const hasSchema = html.includes('application/ld+json') || html.includes('itemtype')
    if (!hasSchema) issues.push({ type: 'schema', severity: 'info', title: 'No Structured Data / Schema Markup', description: 'No JSON-LD or Microdata schema found. Schema markup can enhance search result appearance.', pageUrl: url, impact: 'medium', effort: 'medium' })
    return issues
  },

  checkViewport: (html, url) => {
    const issues = []
    const viewport = html.match(/<meta[^>]+name=["']viewport["']/i)
    if (!viewport) issues.push({ type: 'technical', severity: 'critical', title: 'Missing Viewport Meta Tag', description: 'No viewport meta tag found. This affects mobile usability.', pageUrl: url, impact: 'high', effort: 'low' })
    return issues
  },

  checkRobots: (html, url) => {
    const issues = []
    const noindex = html.match(/<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i)
    if (noindex) issues.push({ type: 'technical', severity: 'critical', title: 'Page has NOINDEX', description: 'The page robots meta tag includes noindex — search engines will not index this page.', pageUrl: url, impact: 'high', effort: 'low' })
    return issues
  },

  checkContentLength: (html, url) => {
    const issues = []
    const textContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    const wordCount = textContent.split(' ').filter(w => w.length > 3).length
    if (wordCount < 300) issues.push({ type: 'content', severity: 'warning', title: 'Thin Content', description: `Page has roughly ${wordCount} meaningful words. Aim for at least 300+ for SEO value.`, pageUrl: url, impact: 'high', effort: 'high' })
    return issues
  }
}

function scoreAudit(issues) {
  const byType = {
    technical: issues.filter(i => i.type === 'technical'),
    'on-page': issues.filter(i => i.type === 'on-page'),
    content: issues.filter(i => i.type === 'content'),
    schema: issues.filter(i => i.type === 'schema'),
    performance: issues.filter(i => i.type === 'performance'),
  }

  const typeScore = (typeIssues, checks) => {
    const critical = typeIssues.filter(i => i.severity === 'critical').length
    const warning = typeIssues.filter(i => i.severity === 'warning').length
    return Math.max(0, 100 - (critical * 25) - (warning * 10))
  }

  return {
    techScore: typeScore(byType.technical, 3),
    onPageScore: typeScore(byType['on-page'], 4),
    contentScore: typeScore(byType.content, 2),
    schemaScore: typeScore(byType.schema, 1),
    perfScore: 72, // Placeholder — would need PageSpeed API for real score
  }
}

export async function GET(request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  const where = projectId ? { projectId } : {}
  const runs = await prisma.websiteAuditRun.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return NextResponse.json({ runs })
}

export async function POST(request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { url, projectId } = await request.json()
  if (!url || !projectId) return NextResponse.json({ error: 'url and projectId required' }, { status: 400 })

  // Create audit run record
  const run = await prisma.websiteAuditRun.create({
    data: { id: uuidv4(), projectId, url, status: 'running' }
  })

  // Run the audit (server-side fetch)
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'SEOOS-Audit-Bot/1.0 (SEO Audit Scanner)' }
    })
    clearTimeout(timeout)

    const html = await res.text()
    const allIssues = [
      ...ISSUE_CHECKS.checkTitle(html, url),
      ...ISSUE_CHECKS.checkMeta(html, url),
      ...ISSUE_CHECKS.checkH1(html, url),
      ...ISSUE_CHECKS.checkImages(html, url),
      ...ISSUE_CHECKS.checkCanonical(html, url),
      ...ISSUE_CHECKS.checkSchema(html, url),
      ...ISSUE_CHECKS.checkViewport(html, url),
      ...ISSUE_CHECKS.checkRobots(html, url),
      ...ISSUE_CHECKS.checkContentLength(html, url),
    ]

    const scores = scoreAudit(allIssues)

    // Save issues
    if (allIssues.length > 0) {
      await prisma.sEOIssue.createMany({
        data: allIssues.map(issue => ({
          id: uuidv4(),
          auditRunId: run.id,
          projectId,
          ...issue,
        }))
      })
    }

    // Update run status
    const updatedRun = await prisma.websiteAuditRun.update({
      where: { id: run.id },
      data: {
        status: 'complete',
        ...scores,
        totalIssues: allIssues.length,
        completedAt: new Date(),
      }
    })

    return NextResponse.json({ run: updatedRun, issues: allIssues })
  } catch (err) {
    await prisma.websiteAuditRun.update({
      where: { id: run.id },
      data: { status: 'failed', errorMessage: err.message }
    })
    return NextResponse.json({ error: 'Audit failed: ' + err.message }, { status: 500 })
  }
}
