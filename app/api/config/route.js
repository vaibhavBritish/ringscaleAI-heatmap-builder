import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSecret } from '@/lib/secrets'

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

    // Fetch secrets using our secure helper
    const googleMapsApiKey = getSecret('GOOGLE_API_KEY') || getSecret('NEXT_PUBLIC_GOOGLE_API_KEY');
    const razorpayKeyId = getSecret('RAZORPAY_KEY_ID') || getSecret('NEXT_PUBLIC_RAZORPAY_KEY_ID');

    // IMPORTANT: Google Maps API Keys are technically "public" for interactive maps to work.
    // To secure this key, you MUST set "HTTP Referrer Restrictions" in your Google Cloud Console 
    // to restrict usage to "https://ringscale.ai/*" only. 
    // Even if encrypted in .env, it must be decrypted before sending to the browser.
    return NextResponse.json({
      googleMapsApiKey,
      razorpayKeyId,
      baseUrl: process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || '',
      appUrl: process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || '',
    })
  } catch (error) {
    console.error('Config fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch public config' }, { status: 500 })
  }
}
