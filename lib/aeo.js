// AEO (Answer Engine Optimization) FAQ widget served by aeo.ringscale.ai.
// The key is a publishable (pk_) key, safe to expose in the browser.
const AEO_KEY = process.env.NEXT_PUBLIC_AEO_KEY || 'pk_6895a64c3d4c2f5fc041dfcd'

// Canonical site origin the FAQs are registered against in the AEO dashboard.
const AEO_SITE_URL = (process.env.NEXT_PUBLIC_AEO_SITE_URL || 'https://ringscale.ai').replace(/\/$/, '')

// App-only areas where the public FAQ widget should not appear.
const EXCLUDED_PREFIXES = [
  '/dashboard', '/admin', '/login', '/register', '/forgot-password',
  '/reset-password', '/profile', '/maintenance', '/q', '/review', '/api'
]

// Strip the /us or /in locale prefix the proxy adds, so both map to one canonical page.
export function normalizeAeoPath(pathname = '/') {
  const stripped = pathname.replace(/^\/(us|in)(?=\/|$)/, '') || '/'
  return stripped.length > 1 ? stripped.replace(/\/$/, '') : '/'
}

export function isAeoPath(pathname) {
  const path = normalizeAeoPath(pathname)
  return !EXCLUDED_PREFIXES.some(p => path === p || path.startsWith(`${p}/`))
}

export function aeoFaqEndpoint(pathname) {
  const pageUrl = `${AEO_SITE_URL}${normalizeAeoPath(pathname)}`
  return `https://aeo.ringscale.ai/api/v1/faqs?format=html&key=${AEO_KEY}&url=${encodeURIComponent(pageUrl)}`
}

// Server-side fetch, cached for 10 minutes. Never throws; returns '' on any failure.
export async function fetchAeoFaqHtml(pathname) {
  if (!isAeoPath(pathname)) return ''
  try {
    const res = await fetch(aeoFaqEndpoint(pathname), {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(2500)
    })
    return res.ok ? await res.text() : ''
  } catch {
    return ''
  }
}

// Service pages written by the AEO autopilot, served under /services/[slug].
// Returns the published page ({ title, html, jsonLd, url, ... }) or null.
// Cached for 10 minutes; never throws, so a slow AEO service can't break the site.
export async function fetchAeoServicePage(slug) {
  if (!/^[a-z0-9-]{1,100}$/.test(slug || '')) return null
  try {
    const res = await fetch(
      `https://aeo.ringscale.ai/api/v1/articles?key=${AEO_KEY}&kind=service&slug=${encodeURIComponent(slug)}`,
      { next: { revalidate: 600 }, signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data?.article?.html ? data.article : null
  } catch {
    return null
  }
}
