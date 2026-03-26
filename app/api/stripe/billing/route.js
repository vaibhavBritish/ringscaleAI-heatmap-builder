import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDB } from '@/lib/mongodb'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDB()
    const user = await db.collection('users').findOne({ id: session.user.id })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get payment history from DB (includes card info, receipt URLs, invoice PDFs)
    const payments = await db.collection('payments')
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray()

    const paymentHistory = payments.map(p => ({
      id: p._id.toString(),
      provider: p.provider,
      planId: p.planId,
      credits: p.credits,
      amount: p.amountTotal,
      currency: p.currency,
      email: p.customerEmail,
      status: p.status,
      date: p.createdAt,
      cardBrand: p.cardBrand,
      cardLast4: p.cardLast4,
      cardExpMonth: p.cardExpMonth,
      cardExpYear: p.cardExpYear,
      receiptUrl: p.receiptUrl,
      invoicePdf: p.invoicePdf,
    }))

    // Card info from user record (most recent card used)
    const cardInfo = user.cardLast4 ? {
      brand: user.cardBrand,
      last4: user.cardLast4,
      expMonth: user.cardExpMonth,
      expYear: user.cardExpYear,
    } : null

    return NextResponse.json({
      user: {
        plan: user.plan,
        credits: user.credits,
        email: user.email,
        name: user.name,
        stripeCustomerId: user.stripeCustomerId,
        createdAt: user.createdAt,
        trialEndsAt: user.trialEndsAt,
      },
      cardInfo,
      paymentHistory,
    })
  } catch (error) {
    console.error('Billing details error:', error)
    return NextResponse.json({ error: 'Failed to fetch billing details' }, { status: 500 })
  }
}
