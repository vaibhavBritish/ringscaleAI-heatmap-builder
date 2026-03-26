import { NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/prisma'

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

    console.log(`Razorpay webhook received: ${event.event}`)

    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payment = event.payload.payment?.entity || event.payload.order?.entity
      const notes = payment.notes

      const userId = notes?.userId
      const planId = notes?.planId
      const credits = notes?.credits

      if (userId && credits) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: planId,
            updatedAt: new Date(),
            credits: { increment: Number(credits) }
          }
        })

        console.log(`Razorpay webhook: User updated for userId=${userId}`)

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

        console.log(`Razorpay webhook: Payment record stored for user ${userId}`)
      }
    }

    return NextResponse.json({ received: true })
  } else {
    console.error('Razorpay signature mismatch')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
}
