import { NextResponse } from 'next/server'

export async function proxy(request) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host')

  // 1. Skip paths for static assets and specific routes
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

  // 2. Identify Subdomain
  const mainDomains = [
    'ringscale.ai',
    'www.ringscale.ai',
    'localhost:3000',
    '0.0.0.0:3000',
    '127.0.0.1:3000'
  ]

  let subdomain = null
  if (!mainDomains.includes(hostname)) {
    const parts = hostname.split('.')
    // Handles company.ringscale.ai
    if (parts.length > 2) {
       subdomain = parts[0]
    }
    // Handles company.localhost:3000
    else if (hostname.includes('localhost') && parts.length > 1) {
       subdomain = parts[0]
    }
  }

  // 3. Maintenance Mode (Skipping for admin)
  if (!pathname.startsWith('/admin') && process.env.MAINTENANCE_MODE === 'true') {
    return NextResponse.redirect(new URL('/maintenance', request.url))
  }

  // 4. Subdomain Handling
  if (subdomain && subdomain !== 'www') {
    return NextResponse.next()
  }

  // 5. Country/Locale Logic (only for main domain)
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/in') ||
    pathname.startsWith('/us')
  ) {
    return NextResponse.next()
  }

  const country = request.headers.get('cf-ipcountry') || 
                  request.headers.get('x-vercel-ip-country') || 
                  'US'
                  
  const locale = country === 'IN' ? 'in' : 'us'
  
  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`
  
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
