import { NextResponse } from 'next/server'

export async function proxy(request) {
  const { pathname } = request.nextUrl
  
  // 0. Skip maintenance check for maintenance page itself and static assets
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') ||
    pathname.match(/\.(.*)$/) ||
    pathname.includes('/maintenance') ||
    pathname.includes('/reset-password') ||
    pathname.includes('/forgot-password')
  ) {
    return NextResponse.next()
  }

  // 1. Check Maintenance Mode via env var (avoids self-HTTP-fetch SSL errors in Docker)
  // To enable: set MAINTENANCE_MODE=true in your docker-compose.yml / .env and restart
  if (!pathname.startsWith('/admin') && process.env.MAINTENANCE_MODE === 'true') {
    return NextResponse.redirect(new URL('/maintenance', request.url))
  }

  // 2. Skip paths that ALREADY have the country code
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/in') ||
    pathname.startsWith('/us')
  ) {
    return NextResponse.next()
  }

  // Check Cloudflare header first (standard for VPS), then Vercel, then fallback to 'US'
  const country = request.headers.get('cf-ipcountry') || 
                  request.headers.get('x-vercel-ip-country') || 
                  'US'
                  
  const locale = country === 'IN' ? 'in' : 'us'
  
  // Clone URL and update pathname to prefix with locale
  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`
  
  return NextResponse.redirect(url)
}

// Ensure proxy only strictly intercepts non-static paths
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}