// Public, unauthenticated indexability check used by /tools/google-index-checker.
// It does NOT query Google (no public API for that). It fetches the page the way a crawler
// would and reports anything that would stop Google indexing it.
//
// Because it fetches user-supplied URLs server-side, it guards against SSRF:
// http/https only, standard ports only, every hostname (including each redirect hop)
// must resolve to public IPs, short timeouts, capped body size, rate limited per IP.

import { NextResponse } from 'next/server'
import dns from 'node:dns/promises'
import net from 'node:net'
import { rateLimit } from '@/lib/rate-limit'

const UA = 'Mozilla/5.0 (compatible; RingscaleIndexChecker/1.0; +https://ringscale.ai/tools/google-index-checker)'
const MAX_BYTES = 1_500_000
const MAX_REDIRECTS = 4
const TIMEOUT_MS = 8000

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number)
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) || a >= 224
  }
  const v = ip.toLowerCase()
  if (v.startsWith('::ffff:')) return isPrivateIp(v.slice(7))
  return v === '::' || v === '::1' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80') || v.startsWith('ff')
}

async function assertPublicUrl(raw) {
  let url
  try { url = new URL(raw) } catch { throw new Error('That doesn’t look like a valid URL.') }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only http and https URLs are supported.')
  if (url.port && !['80', '443'].includes(url.port)) throw new Error('Only standard ports (80/443) are supported.')
  if (url.username || url.password) throw new Error('URLs with credentials are not supported.')
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) throw new Error('Only public websites can be checked.')
  const addrs = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true }).catch(() => [])
  if (!addrs.length) throw new Error('Could not resolve that domain.')
  if (addrs.some(a => isPrivateIp(a.address))) throw new Error('Only public websites can be checked.')
  return url
}

async function fetchSafe(rawUrl, { anyType = false } = {}) {
  let current = rawUrl
  const chain = []
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const url = await assertPublicUrl(current)
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    let res
    try {
      res = await fetch(url, { redirect: 'manual', signal: ctrl.signal, headers: { 'User-Agent': UA, Accept: 'text/html,*/*' } })
    } finally {
      clearTimeout(t)
    }
    chain.push({ url: url.toString(), status: res.status })
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      current = new URL(res.headers.get('location'), url).toString()
      continue
    }
    // Read a capped amount of the body
    let body = ''
    if (res.body && (anyType || (res.headers.get('content-type') || '').includes('html'))) {
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let size = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.length
        body += decoder.decode(value, { stream: true })
        if (size > MAX_BYTES) { reader.cancel(); break }
      }
    }
    return { res, body, chain, finalUrl: url }
  }
  throw new Error('Too many redirects.')
}

// Minimal robots.txt evaluation for Googlebot / * groups (longest-match, allow wins ties)
function robotsAllows(txt, path) {
  const groups = []
  let cur = null
  for (const line of txt.split(/\r?\n/)) {
    const clean = line.replace(/#.*/, '').trim()
    const m = clean.match(/^([a-z-]+)\s*:\s*(.*)$/i)
    if (!m) continue
    const [, k, v] = m
    const key = k.toLowerCase()
    if (key === 'user-agent') {
      if (!cur || cur.rules.length) { cur = { agents: [], rules: [] }; groups.push(cur) }
      cur.agents.push(v.toLowerCase())
    } else if ((key === 'allow' || key === 'disallow') && cur) {
      cur.rules.push({ allow: key === 'allow', path: v })
    }
  }
  const pick = groups.filter(g => g.agents.some(a => a === 'googlebot'))
  const rules = (pick.length ? pick : groups.filter(g => g.agents.includes('*'))).flatMap(g => g.rules)
  let best = null
  for (const r of rules) {
    if (!r.path) continue
    const re = new RegExp('^' + r.path.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'))
    if (re.test(path) && (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow))) best = r
  }
  return best ? best.allow : true
}

const attr = (tag, name) => (tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i')) || [])[1]

export async function POST(request) {
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || request.headers.get('x-real-ip') || 'anon'
  const limiter = await rateLimit(ip, 'index-check', 20, 600)
  if (!limiter.success) return NextResponse.json({ error: 'Too many checks. Please try again in a few minutes.' }, { status: 429 })

  let url
  try {
    ({ url } = await request.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  if (!url || typeof url !== 'string' || url.length > 2048) return NextResponse.json({ error: 'Enter a URL to check.' }, { status: 400 })
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`

  try {
    const { res, body, chain, finalUrl } = await fetchSafe(url)
    const checks = []
    const add = (ok, label, detail, level) => checks.push({ ok, label, detail, level: level || (ok ? 'pass' : 'fail') })

    add(res.status === 200, 'HTTP status', `Final response: ${res.status}${chain.length > 1 ? ` after ${chain.length - 1} redirect(s)` : ''}.`)

    const xRobots = res.headers.get('x-robots-tag') || ''
    add(!/noindex/i.test(xRobots), 'X-Robots-Tag header', xRobots ? `Header found: “${xRobots}”.` : 'No blocking header.')

    const metas = body.match(/<meta[^>]+>/gi) || []
    const robotsMeta = metas.filter(m => /name\s*=\s*["'](robots|googlebot)["']/i.test(m)).map(m => attr(m, 'content') || '').join(', ')
    add(!/noindex/i.test(robotsMeta), 'Meta robots', robotsMeta ? `Meta robots: “${robotsMeta}”.` : 'No noindex meta tag.')

    const canonTag = (body.match(/<link[^>]+rel\s*=\s*["']canonical["'][^>]*>/i) || [])[0]
    const canonical = canonTag ? attr(canonTag, 'href') : null
    if (canonical) {
      let abs = canonical
      try { abs = new URL(canonical, finalUrl).toString() } catch {}
      const same = abs.replace(/\/$/, '') === finalUrl.toString().replace(/\/$/, '')
      add(same, 'Canonical', same ? 'Canonical points to this page.' : `Canonical points elsewhere: ${abs}. Google will usually index that URL instead.`, same ? 'pass' : 'warn')
    } else {
      add(true, 'Canonical', 'No canonical tag. Not a blocker, but recommended.', 'warn')
    }

    let robotsOk = true
    let robotsDetail = 'robots.txt allows Googlebot.'
    try {
      const robotsUrl = new URL('/robots.txt', finalUrl).toString()
      const r = await fetchSafe(robotsUrl, { anyType: true })
      if (r.res.status === 200) {
        robotsOk = robotsAllows(r.body.slice(0, 500_000), finalUrl.pathname + finalUrl.search)
        if (!robotsOk) robotsDetail = 'robots.txt blocks Googlebot from this URL.'
      } else {
        robotsDetail = `No robots.txt (status ${r.res.status}). Googlebot is allowed.`
      }
    } catch {
      robotsDetail = 'Could not read robots.txt.'
    }
    add(robotsOk, 'robots.txt', robotsDetail)

    const title = (body.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]?.trim()
    add(!!title, 'Title tag', title ? `“${title.slice(0, 120)}”` : 'Missing <title>. Add one.', title ? 'pass' : 'warn')

    const blocking = checks.filter(c => c.level === 'fail')
    return NextResponse.json({
      url: finalUrl.toString(),
      indexable: blocking.length === 0,
      checks,
      siteSearch: `https://www.google.com/search?q=${encodeURIComponent('site:' + finalUrl.host + finalUrl.pathname)}`
    })
  } catch (err) {
    const msg = err?.name === 'AbortError' ? 'The site took too long to respond.' : (err?.message || 'Could not check that URL.')
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
