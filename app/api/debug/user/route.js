import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const userById = await prisma.user.findUnique({ where: { id: session.user.id } })
  const userByEmail = await prisma.user.findUnique({ where: { email: session.user.email } })

  return NextResponse.json({
    sessionUserId: session.user.id,
    sessionPlan: session.user.plan,
    sessionCredits: session.user.credits,
    dbUserById: userById ? {
      id: userById.id,
      oid: userById.oid,
      plan: userById.plan,
      credits: userById.credits,
      stripeCustomerId: userById.stripeCustomerId
    } : null,
    dbUserByEmail: userByEmail ? {
      id: userByEmail.id,
      oid: userByEmail.oid,
      plan: userByEmail.plan,
      credits: userByEmail.credits,
      stripeCustomerId: userByEmail.stripeCustomerId
    } : null,
  })
}
