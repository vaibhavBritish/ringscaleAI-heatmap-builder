import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDB } from '@/lib/mongodb'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const db = await getDB()

  // Try finding user by the session ID
  const userById = await db.collection('users').findOne({ id: session.user.id })

  // Also try by email as fallback
  const userByEmail = await db.collection('users').findOne({ email: session.user.email })

  return NextResponse.json({
    sessionUserId: session.user.id,
    sessionPlan: session.user.plan,
    sessionCredits: session.user.credits,
    dbUserById: userById ? {
      id: userById.id,
      _id: userById._id?.toString(),
      plan: userById.plan,
      credits: userById.credits,
      stripeCustomerId: userById.stripeCustomerId
    } : null,
    dbUserByEmail: userByEmail ? {
      id: userByEmail.id,
      _id: userByEmail._id?.toString(),
      plan: userByEmail.plan,
      credits: userByEmail.credits,
      stripeCustomerId: userByEmail.stripeCustomerId
    } : null,
  })
}
