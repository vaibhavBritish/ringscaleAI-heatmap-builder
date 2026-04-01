import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const headersList = await headers()

    // Cloudflare sets cf-ipcountry, Vercel sets x-vercel-ip-country
    const country =
      headersList.get('cf-ipcountry') ||
      headersList.get('x-vercel-ip-country') ||
      headersList.get('x-country-code') ||
      'US'

    return NextResponse.json({ country })
  } catch {
    return NextResponse.json({ country: 'US' })
  }
}
