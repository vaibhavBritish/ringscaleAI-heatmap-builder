import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

export async function POST(req) {
  try {
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    const isWebhookAuthorized = token && token === process.env.RINGSCALE_INTERNAL_SECRET

    const body = await req.json().catch(() => ({}))
    const { businessName, email } = body

    if (!businessName && !email) {
      return NextResponse.json({ error: 'businessName or email is required' }, { status: 400 })
    }

    // 1. Find or create User
    const targetEmail = (email || `${businessName.toLowerCase().replace(/[^a-z0-9]/g, '')}@client.ringscale.ai`).trim()
    const targetName = businessName || 'Business Owner'

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: targetEmail.toLowerCase() },
          ...(businessName ? [{ name: { equals: businessName, mode: 'insensitive' } }] : [])
        ]
      }
    })

    const rawPassword = `RS_${Math.random().toString(36).substring(2, 7).toUpperCase()}!#${Math.floor(100 + Math.random() * 900)}`

    if (!user) {
      const hashedPassword = await bcrypt.hash(rawPassword, 10)
      user = await prisma.user.create({
        data: {
          id: uuidv4(),
          name: targetName,
          email: targetEmail.toLowerCase(),
          password: hashedPassword,
          plainPassword: rawPassword,
          role: 'user',
          plan: 'trial',
          credits: 500,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    }

    const { syncCustomerGMBBusinesses } = await import('@/lib/gmb-customer-sync')
    const syncResult = await syncCustomerGMBBusinesses(user)

    return NextResponse.json({
      success: true,
      businessName: user.name,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plainPassword: user.plainPassword || rawPassword
      },
      ...syncResult
    })
  } catch (error) {
    console.error('Error in /api/admin/sync-gmb-locations:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
