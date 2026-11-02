import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { isManagedClient } from '@/lib/agency'

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

    const [agency, managedBy] = await Promise.all([
      user.role === 'partner' && user.companyId ? getAgencySummary(user) : null,
      isManagedClient(user) ? getManagingAgency(user.companyId) : null,
    ])

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
        role: user.role,
      },
      cardInfo,
      paymentHistory,
      agency,
      managedBy,
    })
  } catch (error) {
    console.error('Billing details error:', error)
    return NextResponse.json({ error: 'Failed to fetch billing details' }, { status: 500 })
  }
}

// Credit pool overview for a partner: every client in their company and the businesses they run
async function getAgencySummary(partner) {
  const clients = await prisma.user.findMany({
    where: { companyId: partner.companyId, role: 'user' },
    select: {
      id: true, name: true, email: true, plan: true, credits: true,
      trialEndsAt: true, planEndsAt: true, createdAt: true,
    },
    orderBy: { createdAt: 'desc' }
  })

  const projects = await prisma.project.findMany({
    where: { userId: { in: [partner.id, ...clients.map(c => c.id)] } },
    select: { userId: true }
  })
  const businessesByUser = {}
  for (const p of projects) businessesByUser[p.userId] = (businessesByUser[p.userId] || 0) + 1

  return {
    clients: clients.map(c => ({ ...c, businesses: businessesByUser[c.id] || 0 })),
    totals: {
      clients: clients.length,
      allocatedCredits: clients.reduce((sum, c) => sum + (c.credits || 0), 0),
      businesses: projects.length,
      ownBusinesses: businessesByUser[partner.id] || 0,
    }
  }
}

async function getManagingAgency(companyId) {
  const company = await prisma.company.findUnique({
    where: { oid: companyId },
    select: { name: true, email: true, phone: true, website: true }
  })
  if (company?.email) return company

  // Fall back to the partner's own email when the company has no contact email
  const partner = await prisma.user.findFirst({
    where: { companyId, role: 'partner' },
    select: { email: true }
  })
  return { ...company, email: partner?.email || null }
}
