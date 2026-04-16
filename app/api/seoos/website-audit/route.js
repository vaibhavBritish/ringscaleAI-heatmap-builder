import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/seoos-auth'
import prisma from "@/lib/prisma"
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import axios from 'axios'
import { fetchSerpRankings } from '@/lib/serp'

// ─── Website Audit Engine ─────────────────────────────────────────────────────

const ISSUE_CHECKS = {
  // Title checks
  checkTitle: ($, url) => {
    const issues = []
    const title = $('title').text().trim()
    
    if (!title) {
      issues.push({ type: 'on-page', severity: 'critical', title: 'Missing Title Tag', description: 'No <title> tag found on this page.', pageUrl: url, impact: 'high', effort: 'low' })
    } else {
      if (title.length < 30) issues.push({ type: 'on-page', severity: 'warning', title: 'Title Too Short', description: `Title is only ${title.length} chars. Aim for 50–60.`, pageUrl: url, impact: 'medium', effort: 'low' })
      if (title.length > 65) issues.push({ type: 'on-page', severity: 'warning', title: 'Title Too Long', description: `Title is ${title.length} chars. Keep under 65.`, pageUrl: url, impact: 'medium', effort: 'low' })
    }
    return issues
  },

  checkMeta: ($, url) => {
    const issues = []
    const description = $('meta[name="description" i]').attr('content') || $('meta[property="og:description" i]').attr('content')
    
    if (!description) {
      issues.push({ type: 'on-page', severity: 'critical', title: 'Missing Meta Description', description: 'No meta description found.', pageUrl: url, impact: 'high', effort: 'low' })
    } else {
      const meta = description.trim()
      if (meta.length < 70) issues.push({ type: 'on-page', severity: 'warning', title: 'Meta Description Too Short', description: `Meta is ${meta.length} chars. Aim for 120–160.`, pageUrl: url, impact: 'medium', effort: 'low' })
      if (meta.length > 165) issues.push({ type: 'on-page', severity: 'warning', title: 'Meta Description Too Long', description: `Meta is ${meta.length} chars. Keep under 165.`, pageUrl: url, impact: 'low', effort: 'low' })
    }
    return issues
  },

  checkH1: ($, url) => {
    const issues = []
    const h1s = $('h1')
    if (h1s.length === 0) issues.push({ type: 'on-page', severity: 'critical', title: 'Missing H1 Tag', description: 'No H1 tag found. Every page should have exactly one H1.', pageUrl: url, impact: 'high', effort: 'low' })
    if (h1s.length > 1) issues.push({ type: 'on-page', severity: 'warning', title: 'Multiple H1 Tags', description: `Found ${h1s.length} H1 tags. Use only one per page.`, pageUrl: url, impact: 'medium', effort: 'low' })
    return issues
  },

  checkImages: ($, url) => {
    const issues = []
    const missingAlt = $('img:not([alt]), img[alt=""]')
    if (missingAlt.length > 0) {
      issues.push({ type: 'on-page', severity: 'warning', title: 'Images Missing Alt Text', description: `${missingAlt.length} image(s) have missing or empty alt attributes.`, pageUrl: url, impact: 'medium', effort: 'medium' })
    }
    return issues
  },

  checkCanonical: ($, url) => {
    const issues = []
    const canonical = $('link[rel="canonical" i]').attr('href')
    if (!canonical) issues.push({ type: 'technical', severity: 'warning', title: 'Missing Canonical Tag', description: 'No canonical link element found. Helps prevent duplicate content issues.', pageUrl: url, impact: 'medium', effort: 'low' })
    return issues
  },

  checkSchema: ($, url, rawHtml = '') => {
    const issues = []
    const rawStr = String(rawHtml)
    
    // 1. Standard DOM Check (JSON-LD scripts and Microdata)
    const hasDomSchema = $('script[type="application/ld+json"]').length > 0 || $('[itemtype]').length > 0
    
    // 2. Universal "Fingerprint" Check 
    // We look for core schema indicators anyplace in the raw source strings.
    // This catches Next.js/React/Vite data islands even if they use unusual escaping.
    const hasSchemaWord = /schema\.org/i.test(rawStr)
    const hasLdJsonWord = /ld\+json/i.test(rawStr)
    const hasContextWord = /"@context"/i.test(rawStr)
    const hasTypeWord = /"@type"/i.test(rawStr)
    
    const hasRawSchema = hasSchemaWord || hasLdJsonWord || (hasContextWord && hasTypeWord)
    
    console.log(`[Schema Check] URL: ${url} | DOM: ${hasDomSchema} | Raw: ${hasRawSchema} (Keywords: ${hasSchemaWord}/${hasLdJsonWord}/${hasContextWord})`);

    if (!hasDomSchema && !hasRawSchema) {
      issues.push({ 
        type: 'schema', 
        severity: 'info', 
        title: 'No Structured Data / Schema Markup', 
        description: 'No JSON-LD or Microdata schema found. Schema markup can enhance search result appearance.', 
        pageUrl: url, 
        impact: 'medium', 
        effort: 'medium' 
      })
    }
    return issues
  },

  checkViewport: ($, url) => {
    const issues = []
    const viewport = $('meta[name="viewport" i]').length > 0
    if (!viewport) issues.push({ type: 'technical', severity: 'critical', title: 'Missing Viewport Meta Tag', description: 'No viewport meta tag found. This affects mobile usability.', pageUrl: url, impact: 'high', effort: 'low' })
    return issues
  },

  checkRobots: ($, url) => {
    const issues = []
    const robots = $('meta[name="robots" i]').attr('content') || ''
    if (robots.toLowerCase().includes('noindex')) {
      issues.push({ type: 'technical', severity: 'critical', title: 'Page has NOINDEX', description: 'The page robots meta tag includes noindex — search engines will not index this page.', pageUrl: url, impact: 'high', effort: 'low' })
    }
    return issues
  },

  checkContentLength: ($, url) => {
    const issues = []
    const textContent = $('body').text().replace(/\s+/g, ' ').trim()
    const wordCount = textContent.split(' ').filter(w => w.length > 3).length
    if (wordCount < 300) issues.push({ type: 'content', severity: 'warning', title: 'Thin Content', description: `Page has roughly ${wordCount} meaningful words. Aim for at least 300+ for SEO value.`, pageUrl: url, impact: 'high', effort: 'high' })
    return issues
  },

  checkHeadingSequence: ($, url) => {
    const issues = []
    const headings = $('h1, h2, h3, h4, h5, h6')
    let lastLevel = 0
    headings.each((i, el) => {
      const level = parseInt(el.tagName.substring(1))
      if (level > lastLevel + 1 && lastLevel !== 0) {
        issues.push({ type: 'on-page', severity: 'info', title: 'Skipped Heading Level', description: `Heading H${level} follows H${lastLevel}. Avoid skipping levels for better structure.`, pageUrl: url, impact: 'low', effort: 'low' })
      }
      lastLevel = level
    })
    return issues
  },

  checkLinks: ($, url) => {
    const issues = []
    const brokenLinks = $('a[href="#"], a[href^="javascript:"]')
    if (brokenLinks.length > 0) {
      issues.push({ type: 'technical', severity: 'warning', title: 'Placeholder Links Found', description: `Found ${brokenLinks.length} placeholder links (e.g. href="#"). These should be replaced with real URLs.`, pageUrl: url, impact: 'medium', effort: 'low' })
    }
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

  const typeScore = (typeIssues) => {
    const critical = typeIssues.filter(i => i.severity === 'critical').length
    const warning = typeIssues.filter(i => i.severity === 'warning').length
    return Math.max(0, 100 - (critical * 25) - (warning * 10))
  }

  return {
    techScore: typeScore(byType.technical),
    onPageScore: typeScore(byType['on-page']),
    contentScore: typeScore(byType.content),
    schemaScore: typeScore(byType.schema),
    perfScore: 72, // Placeholder
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

  const { url: startUrl, projectId: rawProjectId } = await request.json()
  if (!startUrl) return NextResponse.json({ error: 'url required' }, { status: 400 })
  
  // Normalize start URL
  const baseUrl = new URL(startUrl.startsWith('http') ? startUrl : `https://${startUrl}`)
  const domain = baseUrl.hostname.replace('www.', '')
  
  let projectId = rawProjectId
  
  // Auto-project lookup/creation if missing
  if (!projectId) {
    const existingProject = await prisma.project.findFirst({
        where: { businessName: { contains: domain, mode: 'insensitive' } }
    });
    
    if (existingProject) {
        projectId = existingProject.id;
    } else {
        // Create a minimal project for this domain
        const newProjId = uuidv4();
        await prisma.project.create({
            data: {
                id: newProjId,
                userId: session.user.id,
                businessName: domain,
                placeId: `auto-${domain}`,
                latitude: 0,
                longitude: 0,
                address: domain,
            }
        });
        projectId = newProjId;
    }
  }

  // Create audit run record
  const run = await prisma.websiteAuditRun.create({
    data: { id: uuidv4(), projectId, url: startUrl, status: 'running' }
  })

  let updatedRun = run; // Initialize early!

  // Crawler State
  const queue = [startUrl]
  const visited = new Set()
  const allIssues = []
  const discoveredKeywords = new Set()
  const maxPages = 15
  let pagesProcessed = 0

  try {
    while (queue.length > 0 && pagesProcessed < maxPages) {
      const currentUrl = queue.shift()
      
      // Normalize current URL for visited check
      const normUrl = currentUrl.replace(/\/$/, '').toLowerCase()
      if (visited.has(normUrl)) continue
      visited.add(normUrl)
      
      pagesProcessed++

      try {
        const response = await axios.get(currentUrl, {
          timeout: 10000,
          maxRedirects: 5,
          validateStatus: (status) => status >= 200 && status < 400,
          headers: {
            'User-Agent': 'SEOOS-Auditor/1.0',
          }
        })

        const html = response.data
        const $ = cheerio.load(html)
        
        // 1. Discover Keywords
        const pageTitle = $('title').text().trim()
        const h1 = $('h1').first().text().trim()
        const metaKeywords = $('meta[name="keywords"]').attr('content')
        
        if (pageTitle) discoveredKeywords.add(pageTitle.split('|')[0].split('-')[0].trim())
        if (h1) discoveredKeywords.add(h1)
        if (metaKeywords) {
          metaKeywords.split(',').forEach(k => discoveredKeywords.add(k.trim()))
        }

        // 2. Run SEO checks on this page
        const pageIssues = [
          ...ISSUE_CHECKS.checkTitle($, currentUrl),
          ...ISSUE_CHECKS.checkMeta($, currentUrl),
          ...ISSUE_CHECKS.checkH1($, currentUrl),
          ...ISSUE_CHECKS.checkImages($, currentUrl),
          ...ISSUE_CHECKS.checkCanonical($, currentUrl),
          ...ISSUE_CHECKS.checkSchema($, currentUrl, html),
          ...ISSUE_CHECKS.checkViewport($, currentUrl),
          ...ISSUE_CHECKS.checkRobots($, currentUrl),
          ...ISSUE_CHECKS.checkContentLength($, currentUrl),
          ...ISSUE_CHECKS.checkHeadingSequence($, currentUrl),
          ...ISSUE_CHECKS.checkLinks($, currentUrl),
        ]

        allIssues.push(...pageIssues)

        // Find internal links to add to queue
        $('a[href]').each((_, el) => {
          try {
            const href = $(el).attr('href')
            const absoluteUrl = new URL(href, currentUrl).href
            const targetUrlObj = new URL(absoluteUrl)
            
            // Only internal links, same domain, not the same URL, and no weird extensions
            if (
              targetUrlObj.hostname === domain && 
              !visited.has(absoluteUrl.replace(/\/$/, '').toLowerCase()) &&
              !absoluteUrl.match(/\.(pdf|jpg|jpeg|png|gif|svg|zip|css|js)$/i) &&
              !absoluteUrl.includes('#')
            ) {
              queue.push(absoluteUrl)
            }
          } catch (e) {
            // Invalid URL, skip
          }
        })
      } catch (err) {
        console.error(`Failed to crawl ${currentUrl}:`, err.message)
        // Continue to next page in queue
      }
    }

    const scores = scoreAudit(allIssues)
    
    // Clean up discovered keywords (Filter out short ones, junk, and limit to top 10)
    const finalKeywords = Array.from(discoveredKeywords)
      .filter(k => k && k.length > 3 && k.length < 50)
      .slice(0, 10)

    // Save issues in bulk
    if (allIssues.length > 0) {
      // Create records in chunks to avoid MongoDB payload limits if issues are many
      const chunks = []
      for (let i = 0; i < allIssues.length; i += 50) {
        chunks.push(allIssues.slice(i, i + 50))
      }

      for (const chunk of chunks) {
        await prisma.sEOIssue.createMany({
          data: chunk.map(issue => ({
            id: uuidv4(),
            auditRunId: run.id,
            projectId,
            ...issue,
          }))
        })
      }
    }

    // 3. Finalize results with smart fallback for stale environments
    try {
      updatedRun = await prisma.websiteAuditRun.update({
        where: { id: run.id },
        data: {
          status: 'complete',
          ...scores,
          totalIssues: allIssues.length,
          suggestedKeywords: finalKeywords,
          completedAt: new Date(),
        }
      })
    } catch (dbError) {
      if (dbError.message?.includes('suggestedKeywords') || dbError.message?.includes('Unknown argument')) {
        console.warn('Stale Prisma Client detected. Falling back to basic update.')
        updatedRun = await prisma.websiteAuditRun.update({
          where: { id: run.id },
          data: {
            status: 'complete',
            ...scores,
            totalIssues: allIssues.length,
            completedAt: new Date(),
          }
        })
      } else {
        throw dbError
      }
    }

    // ─── Automated Keyword Discovery ──────────────────────────────────────────
    
    // Background tracking for each keyword (don't wait for all if too many)
    if (!process.env.SERPAPI_API_KEY) {
      console.log('Skipping auto-ranking track: SERPAPI_API_KEY is missing.');
    } else {
      for (const kw of discoveredKeywords) {
      try {
        const ranking = await fetchSerpRankings(kw, startUrl);
        await prisma.keywordRank.upsert({
          where: { projectId_keyword: { projectId, keyword: kw } },
          update: {
            rank: ranking.rank,
            url: ranking.url,
            bestRank: ranking.rank ? (ranking.rank < (ranking.bestRank || 100) ? ranking.rank : ranking.bestRank) : ranking.bestRank,
            updatedAt: new Date(),
          },
          create: {
            id: uuidv4(),
            projectId,
            keyword: kw,
            rank: ranking.rank,
            bestRank: ranking.rank,
            url: ranking.url,
          }
        });
      } catch (e) {
        console.error(`Failed to auto-track ranking for ${kw}:`, e.message);
      }
      }
    }
    // ─── Automated GSC Sync ───────────────────────────────────────────────────
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const syncUrl = `${baseUrl.replace(/\/$/, '')}/api/seoos/gsc-sync`
      const gscRes = await fetch(syncUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, url: startUrl })
      });
      if (!gscRes.ok) console.warn('GSC Sync failed during audit:', await gscRes.text());
    } catch (e) {
      console.warn('GSC Sync skipped:', e.message);
    }

    return NextResponse.json({ run: updatedRun, issues: allIssues, projectId })
  } catch (err) {
    const errorMessage = err.message
    await prisma.websiteAuditRun.update({
      where: { id: run.id },
      data: { status: 'failed', errorMessage: errorMessage }
    })
    return NextResponse.json({ error: 'Audit failed: ' + errorMessage }, { status: 500 })
  }
}

function extractKeywords($, url) {
  const keywords = new Set();
  
  // 1. From Title (usually contains main keywords)
  const titleText = $('title').text().trim().split('|')[0].split('-')[0].trim();
  if (titleText.length > 3) keywords.add(titleText);

  // 2. From H1
  $('h1').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 3 && text.length < 50) keywords.add(text);
  });

  // 3. From Meta Keywords (if present)
  const metaKws = $('meta[name="keywords"]').attr('content');
  if (metaKws) {
    metaKws.split(',').slice(0, 3).forEach(k => {
      const kw = k.trim();
      if (kw.length > 3) keywords.add(kw);
    });
  }

  // Fallback if none found
  if (keywords.size === 0) {
    const domain = new URL(url).hostname.replace('www.', '').split('.')[0];
    keywords.add(domain);
  }

  return Array.from(keywords).slice(0, 5); // Limit to top 5
}
