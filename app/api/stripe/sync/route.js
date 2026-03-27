import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import Stripe from 'stripe'
import { sendSubscriptionEmail } from '@/lib/mail'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    console.log(`Sync Request: sessionId=${sessionId}, userId=${session.user.id}`)

    let userSessions = []

    if (sessionId) {
      try {
        const stripeSession = await stripe.checkout.sessions.retrieve(sessionId)
        console.log(`Sync: Retrieved session ${sessionId}, status=${stripeSession.payment_status}`)
        if (stripeSession && stripeSession.payment_status === 'paid') {
          userSessions = [stripeSession]
        }
      } catch (e) {
        console.error('Sync: Error retrieving specific session:', e.message)
      }
    } else {
      // Increase limit to 100 to find older missing payments
      const sessions = await stripe.checkout.sessions.list({ limit: 100 })
      userSessions = sessions.data.filter(
        s => s.metadata?.userId === session.user.id && s.payment_status === 'paid'
      )
      console.log(`Sync: Found ${userSessions.length} paid sessions for user in last 100`)
    }

    if (userSessions.length === 0) {
      console.log('Sync: No new paid sessions to process')
      return NextResponse.json({ message: 'No completed payments found.', synced: false })
    }

    // Sort sessions by creation date (ascending) to process them in order for stacking
    userSessions.sort((a, b) => a.created - b.created)

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    const existingPayments = await prisma.payment.findMany({
      where: { userId: session.user.id }
    })
    const existingSessionIds = new Set(existingPayments.map(p => p.stripeSessionId))

    let totalNewCredits = 0
    let currentPlanEndsAt = user?.planEndsAt ? new Date(user.planEndsAt) : null
    let latestPlan = user?.plan
    let latestCustomerId = user?.stripeCustomerId
    let latestCard = null
    let anyUpdates = false

    for (const stripeSession of userSessions) {
      const { planId, credits } = stripeSession.metadata || {}
      
      if (existingSessionIds.has(stripeSession.id)) {
        console.log(`Sync: Session ${stripeSession.id} already exists in DB`)
        // Still update latest info if this is a recent session
        if (planId) latestPlan = planId
        if (stripeSession.customer) latestCustomerId = stripeSession.customer
        continue
      }

      console.log(`Sync: Processing NEW session ${stripeSession.id}, planId=${planId}, credits=${credits}`)
      anyUpdates = true
      
      // Calculate stacking expiration
      // If the current plan is still active, start from its end date.
      // Otherwise, start from the session creation date.
      const sessionCreated = new Date(stripeSession.created * 1000)
      let baseDate = (currentPlanEndsAt && currentPlanEndsAt > sessionCreated) 
        ? currentPlanEndsAt 
        : sessionCreated

      let sessionEndsAt = new Date(baseDate)
      if (planId === 'plan_lite') {
        sessionEndsAt.setMonth(sessionEndsAt.getMonth() + 1)
      } else if (planId === 'plan_pro') {
        sessionEndsAt.setMonth(sessionEndsAt.getMonth() + 3)
      } else if (planId === 'trial' || planId === 'plan_trial') {
        sessionEndsAt.setDate(sessionEndsAt.getDate() + 7)
      }

      currentPlanEndsAt = sessionEndsAt
      if (planId) latestPlan = planId

      if (!credits) {
        console.warn(`Sync: Missing credits in metadata for ${stripeSession.id}`)
      }

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

      if (credits) totalNewCredits += Number(credits)
      latestCustomerId = stripeSession.customer
      if (cardDetails) latestCard = cardDetails

      await prisma.payment.create({
        data: {
          userId: session.user.id,
          provider: 'stripe',
          stripeSessionId: stripeSession.id,
          stripeCustomerId: stripeSession.customer,
          stripePaymentIntentId: stripeSession.payment_intent,
          stripeInvoiceId: stripeSession.invoice,
          planId,
          credits: Number(credits || 0),
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

      // Send confirmation email
      try {
        const planNames = {
          'plan_lite': 'Advance',
          'plan_pro': 'Pro',
          'plan_trial': 'Trial',
          'trial': 'Trial'
        }

        await sendSubscriptionEmail(stripeSession.customer_details?.email || session.user.email, {
          planName: planNames[planId] || planId,
          credits: Number(credits || 0),
          amount: stripeSession.amount_total / 100,
          currency: stripeSession.currency,
          planEndsAt: currentPlanEndsAt,
          receiptUrl: receiptUrl,
          invoicePdf: invoicePdf
        })
      } catch (e) {
        console.error('Sync: Email failed:', e.message)
      }
    }

    if (anyUpdates) {
      console.log(`Sync: Updating user ${session.user.id} with ${totalNewCredits} new credits and exp ${currentPlanEndsAt}`)
      const updateData = {
        updatedAt: new Date(),
        credits: { increment: totalNewCredits },
        ...(latestPlan && { plan: latestPlan }),
        ...(currentPlanEndsAt && { planEndsAt: currentPlanEndsAt }),
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
        message: totalNewCredits > 0 
          ? `Synced new payments. Added ${totalNewCredits} credits.` 
          : `Refreshed plan status. Valid until ${latestPlanEndsAt.toLocaleDateString()}.`,
        synced: true,
        newCredits: totalNewCredits,
        totalCredits: updatedUser.credits,
        plan: updatedUser.plan,
        planEndsAt: updatedUser.planEndsAt
      })
    }

    console.log('Sync: No updates needed')
    return NextResponse.json({ message: 'All payments already synced.', synced: false })
  } catch (error) {
    console.error('Stripe sync error:', error)
    return NextResponse.json({ error: 'Failed to sync payments' }, { status: 500 })
  }
}
