import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req) {
  const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripe || !endpointSecret) {
    console.error('Stripe webhook: Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET')
    return NextResponse.json({ error: 'Stripe keys not configured' }, { status: 500 })
  }

  const body = await req.text()
  const sig = headers().get('stripe-signature')

  let event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  console.log(`Stripe webhook received: ${event.type}`)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const { userId, planId, credits } = session.metadata || {}

    console.log(`Stripe webhook: checkout.session.completed for userId=${userId}, planId=${planId}, credits=${credits}`)

    if (userId && credits) {
      // Fetch payment intent to get card details
      let cardDetails = null
      let receiptUrl = null
      let invoicePdf = null

      try {
        if (session.payment_intent) {
          const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent, {
            expand: ['payment_method', 'latest_charge']
          })

          if (paymentIntent.payment_method?.card) {
            cardDetails = {
              brand: paymentIntent.payment_method.card.brand,
              last4: paymentIntent.payment_method.card.last4,
              expMonth: paymentIntent.payment_method.card.exp_month,
              expYear: paymentIntent.payment_method.card.exp_year,
              funding: paymentIntent.payment_method.card.funding,
            }
          }

          if (paymentIntent.latest_charge) {
            const charge = typeof paymentIntent.latest_charge === 'string'
              ? await stripe.charges.retrieve(paymentIntent.latest_charge)
              : paymentIntent.latest_charge
            receiptUrl = charge.receipt_url
          }
        }

        if (session.invoice) {
          const invoice = await stripe.invoices.retrieve(session.invoice)
          invoicePdf = invoice.invoice_pdf
        }
      } catch (err) {
        console.error('Stripe webhook: Error fetching payment details:', err.message)
      }

      // Update user's plan, credits, and card info
      const updateResult = await prisma.user.update({
        where: { id: userId },
        data: {
          plan: planId,
          stripeCustomerId: session.customer,
          updatedAt: new Date(),
          credits: { increment: Number(credits) },
          ...(cardDetails && {
            cardBrand: cardDetails.brand,
            cardLast4: cardDetails.last4,
            cardExpMonth: cardDetails.expMonth,
            cardExpYear: cardDetails.expYear,
          })
        }
      })

      console.log(`Stripe webhook: User updated for userId=${userId}`)

      // Store payment record with full details
      await prisma.payment.create({
        data: {
          userId,
          provider: 'stripe',
          stripeSessionId: session.id,
          stripeCustomerId: session.customer,
          stripePaymentIntentId: session.payment_intent,
          stripeInvoiceId: session.invoice,
          planId,
          credits: Number(credits),
          amountTotal: session.amount_total,
          currency: session.currency,
          customerEmail: session.customer_details?.email || session.customer_email,
          paymentStatus: session.payment_status,
          status: 'completed',
          cardBrand: cardDetails?.brand,
          cardLast4: cardDetails?.last4,
          cardExpMonth: cardDetails?.expMonth,
          cardExpYear: cardDetails?.expYear,
          receiptUrl,
          invoicePdf,
          createdAt: new Date()
        }
      })

      console.log(`Stripe webhook: Payment record stored for user ${userId}`)
    } else {
      console.error('Stripe webhook: Missing userId or credits in metadata', session.metadata)
    }
  }

  return NextResponse.json({ received: true })
}
