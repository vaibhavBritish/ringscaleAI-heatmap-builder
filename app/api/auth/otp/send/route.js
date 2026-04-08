import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import redis from '@/lib/redis'
import { sendOTPEmail } from '@/lib/mail'
import { rateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'

export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Rate limiting: 3 OTPs per hour per email/IP
    const ip = (await headers()).get('x-forwarded-for') || '127.0.0.1'
    const identifier = `${email.toLowerCase()}_${ip}`
    const limiter = await rateLimit(identifier, 'otp-send', 3, 3600)
    
    if (!limiter.success) {
      return NextResponse.json({ 
        error: 'Too many OTP requests. Please try again after an hour.',
        code: 'RATE_LIMIT_EXCEEDED'
      }, { status: 429 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Store in Redis with 10 minute expiry
    // Key: otp:useremail
    if (redis) {
      await redis.set(`otp:${email.toLowerCase()}`, otp, 'EX', 600)
    } else {
      console.warn('Redis is not available. OTP verification will be skipped or limited.')
      // If redis is down, we might want to fail the request for security
      // Or fallback to a database storage, but redis is better.
      return NextResponse.json({ error: 'System busy. Please try again later.' }, { status: 503 })
    }

    // Send email
    await sendOTPEmail(email, otp)

    return NextResponse.json({ message: 'OTP sent successfully' })
  } catch (error) {
    console.error('OTP Send error:', error)
    return NextResponse.json({ error: error.message || 'Failed to send OTP' }, { status: 500 })
  }
}
