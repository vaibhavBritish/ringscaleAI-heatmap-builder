import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl
  
  // Skip internal next.js paths, api, static files, and paths that ALREADY have the country code
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') ||
    pathname.match(/\.(.*)$/) || // skip files with extensions
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

// Ensure middleware only strictly intercepts non-static paths
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
