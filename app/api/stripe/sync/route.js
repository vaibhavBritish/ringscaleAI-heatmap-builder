import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import Stripe from 'stripe'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    // Find all completed checkout sessions for this user
    const sessions = await stripe.checkout.sessions.list({ limit: 50 })
    const userSessions = sessions.data.filter(
      s => s.metadata?.userId === session.user.id && s.payment_status === 'paid'
    )

    if (userSessions.length === 0) {
      return NextResponse.json({ message: 'No completed payments found.', synced: false })
    }

    const existingPayments = await prisma.payment.findMany({
      where: { userId: session.user.id }
    })
    const existingSessionIds = new Set(existingPayments.map(p => p.stripeSessionId))

    let totalNewCredits = 0
    let latestPlan = null
    let latestCustomerId = null
    let latestCard = null
    let newPaymentsCount = 0

    for (const stripeSession of userSessions) {
      if (existingSessionIds.has(stripeSession.id)) continue

      const { planId, credits } = stripeSession.metadata || {}
      if (!credits) continue

      let cardDetails = null
      let receiptUrl = null
      let invoicePdf = null

      try {
        if (stripeSession.payment_intent) {
          const pi = await stripe.paymentIntents.retrieve(stripeSession.payment_intent, {
            expand: ['payment_method', 'latest_charge']
          })
          if (pi.payment_method?.card) {
            cardDetails = {
              brand: pi.payment_method.card.brand,
              last4: pi.payment_method.card.last4,
              expMonth: pi.payment_method.card.exp_month,
              expYear: pi.payment_method.card.exp_year,
            }
          }
          if (pi.latest_charge) {
            const charge = typeof pi.latest_charge === 'string'
              ? await stripe.charges.retrieve(pi.latest_charge)
              : pi.latest_charge
            receiptUrl = charge.receipt_url
          }
        }
        if (stripeSession.invoice) {
          const inv = await stripe.invoices.retrieve(stripeSession.invoice)
          invoicePdf = inv.invoice_pdf
        }
      } catch (e) {
        console.error('Sync: Error fetching details:', e.message)
      }

      totalNewCredits += Number(credits)
      latestPlan = planId
      latestCustomerId = stripeSession.customer
      if (cardDetails) latestCard = cardDetails
      newPaymentsCount++

      await prisma.payment.create({
        data: {
          userId: session.user.id,
          provider: 'stripe',
          stripeSessionId: stripeSession.id,
          stripeCustomerId: stripeSession.customer,
          stripePaymentIntentId: stripeSession.payment_intent,
          stripeInvoiceId: stripeSession.invoice,
          planId,
          credits: Number(credits),
          amountTotal: stripeSession.amount_total,
          currency: stripeSession.currency,
          customerEmail: stripeSession.customer_details?.email,
          paymentStatus: stripeSession.payment_status,
          status: 'completed',
          cardBrand: cardDetails?.brand,
          cardLast4: cardDetails?.last4,
          cardExpMonth: cardDetails?.expMonth,
          cardExpYear: cardDetails?.expYear,
          receiptUrl,
          invoicePdf,
          syncedManually: true,
          createdAt: new Date(stripeSession.created * 1000),
          syncedAt: new Date()
        }
      })
    }

    if (newPaymentsCount > 0) {
      const updateData = {
        updatedAt: new Date(),
        credits: { increment: totalNewCredits },
        ...(latestPlan && { plan: latestPlan }),
        ...(latestCustomerId && { stripeCustomerId: latestCustomerId }),
        ...(latestCard && {
          cardBrand: latestCard.brand,
          cardLast4: latestCard.last4,
          cardExpMonth: latestCard.expMonth,
          cardExpYear: latestCard.expYear,
        })
      }

      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: updateData
      })

      return NextResponse.json({
        message: `Synced ${newPaymentsCount} payment(s). Added ${totalNewCredits} credits.`,
        synced: true,
        newCredits: totalNewCredits,
        totalCredits: updatedUser.credits,
        plan: updatedUser.plan
      })
    }

    return NextResponse.json({ message: 'All payments already synced.', synced: false })
  } catch (error) {
    console.error('Stripe sync error:', error)
    return NextResponse.json({ error: 'Failed to sync payments' }, { status: 500 })
  }
}
