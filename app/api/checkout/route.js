import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Stripe from 'stripe'
import Razorpay from 'razorpay'
import prisma from '@/lib/prisma'

// Initialize SDKs only if keys are present to avoid startup crashes
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

const razorpay = (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
  ? new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  })
  : null

// Define plan pricing securely on the server
const PLANS = {
  'plan_lite': {
    priceUSD: 499,
    priceINR: 8000,
    credits: 1200,
    name: 'Advance Plan',
    durationMonths: 1
  },
  'plan_pro': {
    priceUSD: 799,
    priceINR: 40000,
    credits: 2400,
    name: 'Pro Plan',
    durationMonths: 3
  },
  'plan_pro_plus': {
    priceUSD: 1299,
    priceINR: 60000,
    credits: 5000,
    name: 'Pro Plus',
    durationMonths: 3
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let { planId, isIndia } = await request.json()
    
    // Normalize planId to handle typos/variations from frontend
    const id = (planId || '').toLowerCase()
    if (id.includes('lite') || id.includes('advance')) {
      planId = 'plan_lite'
    } else if (id.includes('pro_plus') || id.includes('pro plus')) {
      planId = 'plan_pro_plus'
    } else if (id.includes('pro')) {
      planId = 'plan_pro'
    }
    
    const plan = PLANS[planId]

    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    if (isIndia) {
      // RAZORPAY FLOW
      if (!razorpay) {
        return NextResponse.json({ error: 'Razorpay is not configured' }, { status: 500 })
      }

      const options = {
        amount: plan.priceINR * 100,
        currency: 'INR',
        receipt: `rcpt_${session.user.id}_${Date.now()}`,
        notes: {
          userId: session.user.id,
          planId: planId,
          credits: plan.credits
        }
      }

      const order = await razorpay.orders.create(options)

      return NextResponse.json({
        id: order.id,
        amount: order.amount,
        currency: order.currency
      })

    } else {
      // STRIPE FLOW
      if (!stripe) {
        return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
      }

      const user = await prisma.user.findUnique({ where: { id: session.user.id } })

      // Create or reuse Stripe customer so cards & invoices persist
      let customerId = user?.stripeCustomerId
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: session.user.email,
          name: session.user.name || session.user.email.split('@')[0],
          metadata: { userId: session.user.id }
        })
        customerId = customer.id
        await prisma.user.update({
          where: { id: session.user.id },
          data: { stripeCustomerId: customerId }
        })
      }

      const sessionConfig = {
        payment_method_types: ['card'],
        customer: customerId,
        client_reference_id: session.user.id,
        payment_intent_data: {
          setup_future_usage: 'on_session',
        },
        invoice_creation: {
          enabled: true,
        },
        metadata: {
          userId: session.user.id,
          planId: planId,
          credits: plan.credits
        },
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: plan.name,
                description: `${plan.credits} Local Rank Heatmap Credits`,
              },
              unit_amount: plan.priceUSD * 100,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        allow_promotion_codes: true,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin')}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}&userId=${session.user.id}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin')}/dashboard/billing?canceled=true`,
      }

      let checkoutSession
      try {
        checkoutSession = await stripe.checkout.sessions.create(sessionConfig)
      } catch (stripeError) {
        if (customerId && (stripeError.code === 'resource_missing' || stripeError.raw?.code === 'resource_missing')) {
          const customer = await stripe.customers.create({
            email: session.user.email,
            name: session.user.name || session.user.email.split('@')[0],
            metadata: { userId: session.user.id }
          })
          customerId = customer.id
          await prisma.user.update({
            where: { id: session.user.id },
            data: { stripeCustomerId: customerId }
          })
          sessionConfig.customer = customerId
          checkoutSession = await stripe.checkout.sessions.create(sessionConfig)
        } else {
          throw stripeError
        }
      }

      return NextResponse.json({ url: checkoutSession.url })
    }
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
