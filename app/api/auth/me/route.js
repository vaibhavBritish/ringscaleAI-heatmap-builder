import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const freshUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!freshUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    return NextResponse.json({
      id: freshUser.id,
      email: freshUser.email,
      name: freshUser.name,
      plan: freshUser.plan,
      credits: freshUser.credits,
      trialEndsAt: freshUser.trialEndsAt,
      planEndsAt: freshUser.planEndsAt,
      stripeCustomerId: freshUser.stripeCustomerId
    })
  } catch (error) {
    console.error('Auth Me Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
