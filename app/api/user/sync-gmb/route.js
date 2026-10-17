import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { syncCustomerGMBBusinesses } from '@/lib/gmb-customer-sync'

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await syncCustomerGMBBusinesses(session.user)

    return NextResponse.json({
      success: true,
      message: 'GMB businesses and audit reports synced successfully',
      ...result
    })
  } catch (error) {
    console.error('Error in /api/user/sync-gmb:', error)
    return NextResponse.json({ error: 'Failed to sync GMB businesses' }, { status: 500 })
  }
}
