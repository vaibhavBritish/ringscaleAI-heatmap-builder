import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Stripe from 'stripe'
import prisma from '@/lib/prisma'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })

    if (!user || !user.stripeCustomerId) {
      return NextResponse.json({
        error: 'No active Stripe billing found. Please make a payment first.'
      }, { status: 400 })
    }

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
    }

    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin')}/dashboard/billing`,
      })
      return NextResponse.json({ url: portalSession.url })
    } catch (stripeError) {
      if (stripeError.code === 'resource_missing' || stripeError.raw?.code === 'resource_missing') {
        await prisma.user.update({
          where: { id: session.user.id },
          data: { stripeCustomerId: null }
        })
        return NextResponse.json({
          error: 'Your billing record was from a different Stripe environment. We have cleared it—please make a new payment to link your live account.',
          cleared: true
        }, { status: 400 })
      }
      throw stripeError
    }
  } catch (error) {
    console.error('Stripe Portal error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create portal session' }, { status: 500 })
  }
}
