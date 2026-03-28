import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, email, password, phone, otp } = body

    if (!email || !password || !otp) {
      return NextResponse.json(
        { error: 'Email, password, and OTP are required' },
        { status: 400 }
      )
    }

    // Verify OTP using Redis
    const redis = (await import('@/lib/redis')).default
    if (redis) {
      const storedOtp = await redis.get(`otp:${email.toLowerCase()}`)
      if (!storedOtp || storedOtp !== otp) {
        return NextResponse.json(
          { error: 'Invalid or expired OTP' },
          { status: 400 }
        )
      }
      // OTP verified successfully, delete it to prevent reuse
      await redis.del(`otp:${email.toLowerCase()}`)
    } else {
      console.warn('Redis is not available. OTP verification skipped.')
      return NextResponse.json({ error: 'System busy. Please try again later.' }, { status: 503 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const now = new Date()
    const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        phone: phone || null,
        password: hashedPassword,
        plan: 'trial',
        credits: 300,
        trialEndsAt,
        createdAt: now,
        updatedAt: now
      }
    })

    // Send welcome email (async, don't await to avoid delaying the response)
    const { sendWelcomeEmail } = await import('@/lib/mail')
    sendWelcomeEmail(user.email, user.name).catch(err => {
      console.error('Error sending welcome email after registration:', err)
    })

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
