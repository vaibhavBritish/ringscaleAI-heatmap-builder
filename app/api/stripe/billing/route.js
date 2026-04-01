import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get payment history from DB (includes card info, receipt URLs, invoice PDFs)
    const payments = await prisma.payment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    const paymentHistory = payments.map(p => ({
      id: p.oid,
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
        planStartedAt: user.planStartedAt,
        planEndsAt: user.planEndsAt,
      },
      cardInfo,
      paymentHistory,
    })
  } catch (error) {
    console.error('Billing details error:', error)
    return NextResponse.json({ error: 'Failed to fetch billing details' }, { status: 500 })
  }
}
