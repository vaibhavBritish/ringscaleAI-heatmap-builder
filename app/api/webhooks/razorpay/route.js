import { NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { sendSubscriptionEmail } from '@/lib/mail'

export const dynamic = 'force-dynamic'

export async function POST(req) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Razorpay webhook secret not configured' }, { status: 500 })
  }

  const body = await req.text()
  const sig = req.headers.get('x-razorpay-signature')

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')

  if (expectedSignature === sig) {
    const event = JSON.parse(body)

    //console.log(`Razorpay webhook received: ${event.event}`)

    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payment = event.payload.payment?.entity || event.payload.order?.entity
      const notes = payment.notes

      const userId = notes?.userId
      const planId = notes?.planId
      const credits = notes?.credits

      if (userId && credits) {
        // Calculate plan expiration
        let planEndsAt = new Date()
        if (planId === 'plan_lite') {
          planEndsAt.setMonth(planEndsAt.getMonth() + 1) // 1 month for Advance
        } else if (planId === 'plan_pro') {
          planEndsAt.setMonth(planEndsAt.getMonth() + 3) // 3 months for Pro
        } else if (planId === 'trial') {
          planEndsAt.setDate(planEndsAt.getDate() + 7) // 7 days for Trial
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: planId,
            updatedAt: new Date(),
            planEndsAt: planEndsAt,
            credits: { increment: Number(credits) }
          }
        })

        //console.log(`Razorpay webhook: User updated for userId=${userId}`)

        await prisma.payment.create({
          data: {
            userId,
            provider: 'razorpay',
            razorpayPaymentId: payment.id,
            razorpayOrderId: payment.order_id,
            planId,
            credits: Number(credits),
            amountTotal: payment.amount,
            currency: payment.currency,
            customerEmail: payment.email,
            paymentStatus: payment.status,
            status: 'completed',
            createdAt: new Date()
          }
        })

        //console.log(`Razorpay webhook: Payment record stored for user ${userId}`)

        // Send confirmation email
        try {
          const planNames = {
            'plan_lite': 'Advance',
            'plan_pro': 'Pro',
            'trial': 'Trial'
          }

          await sendSubscriptionEmail(payment.email || notes?.email, {
            planName: planNames[planId] || planId,
            credits: Number(credits),
            amount: payment.amount / 100, // Razorpay amount is in paise
            currency: payment.currency,
            planEndsAt: planEndsAt,
            receiptUrl: null, // Razorpay doesn't provide a direct receipt URL in the same way via simple webhook entity
            invoicePdf: null
          })
          //console.log(`Razorpay webhook: Confirmation email sent to ${payment.email || notes?.email}`)
        } catch (emailError) {
          console.error('Razorpay webhook: Failed to send confirmation email:', emailError.message)
        }
      }
    }

    return NextResponse.json({ received: true })
  } else {
    console.error('Razorpay signature mismatch')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
}
