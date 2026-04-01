import { NextResponse } from 'next/server'

export async function middleware(request) {
  const { pathname } = request.nextUrl
  
  // 0. Skip maintenance check for maintenance page itself and static assets
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') ||
    pathname.match(/\.(.*)$/) ||
    pathname.includes('/maintenance')
  ) {
    return NextResponse.next()
  }

  // 1. Check Maintenance Mode (only for non-admin paths)
  if (!pathname.startsWith('/admin')) {
    try {
      // In a real production environment with high traffic, you'd use a faster store like Redis
      // For now, we fetch from our internal status API
      const origin = request.nextUrl.origin
      const maintenanceRes = await fetch(`${origin}/api/admin/settings/maintenance-status`, {
        next: { revalidate: 0 } // Don't cache the maintenance check
      })
      const { maintenanceMode } = await maintenanceRes.json()
      
      if (maintenanceMode) {
        return NextResponse.redirect(new URL('/maintenance', request.url))
      }
    } catch (err) {
      console.error("Maintenance check failed:", err)
    }
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

// Ensure middleware only strictly intercepts non-static paths
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
