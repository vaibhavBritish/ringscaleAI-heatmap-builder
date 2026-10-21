import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getProfilesList } from '@/lib/profile-service'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || null
    const isAdmin = ['admin', 'superadmin'].includes(session?.user?.role)

    const profiles = await getProfilesList(userId, isAdmin)

    return NextResponse.json({
      success: true,
      count: profiles.length,
      profiles
    })
  } catch (error) {
    console.error('Error in /api/profiles:', error)
    return NextResponse.json({
      error: 'Failed to fetch profiles',
      details: error.message
    }, { status: 500 })
  }
}
