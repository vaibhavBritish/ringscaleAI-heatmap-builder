import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import crypto from 'crypto'
import { sendPasswordResetEmail } from '@/lib/mail'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    // Always return success to prevent email enumeration attacks
    // (don't reveal whether the email exists in the system)
    if (!user) {
      return NextResponse.json({
        message: 'If an account with that email exists, a reset link has been sent.'
      })
    }

    // Generate a secure random token
    const rawToken = crypto.randomBytes(32).toString('hex')
    // Store a SHA-256 hash of the token (never store raw tokens)
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: expiresAt,
      }
    })

    // Send the RAW token in the email link (user never sees the hash)
    await sendPasswordResetEmail(user.email, user.name, rawToken)

    return NextResponse.json({
      message: 'If an account with that email exists, a reset link has been sent.'
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
