import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // Safety check: only return sensitive keys if user is logged in
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'You must be logged in to access configuration'
      }, { status: 401 })
    }

    // IMPORTANT: Google Maps API Keys are technically "public" for interactive maps to work.
    // The security comes from setting "HTTP Referrer Restrictions" in your Google Cloud Console 
    // to search for matches on "https://ringscale.ai/*" only.
    return NextResponse.json({
      googleMapsApiKey: process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      baseUrl: process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || '',
      appUrl: process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || '',
    })
  } catch (error) {
    console.error('Config fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch public config' }, { status: 500 })
  }
}
