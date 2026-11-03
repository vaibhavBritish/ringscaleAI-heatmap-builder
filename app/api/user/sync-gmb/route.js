import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { syncCustomerGMBBusinesses } from '@/lib/gmb-customer-sync'
import redis from '@/lib/redis'

// The dashboard fires this on every load. A full sync queries the remote GMB
// Connector DB and touches every project, so background syncs are limited to
// one per user per window. The manual "Sync" button sends { force: true }.
const AUTO_SYNC_WINDOW_SECONDS = 10 * 60
const inFlight = (globalThis.__rsGmbSyncInFlight ||= new Map())

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let force = false
    try {
      const body = await req.json()
      force = body?.force === true
    } catch {}

    const userId = session.user.id

    // Never run two syncs for the same user at once — join the running one
    if (inFlight.has(userId)) {
      const result = await inFlight.get(userId)
      return NextResponse.json({ success: true, message: 'GMB sync already in progress', ...result, synced: 0 })
    }

    if (!force && redis) {
      try {
        const claimed = await redis.set(`gmb:autosync:${userId}`, '1', 'EX', AUTO_SYNC_WINDOW_SECONDS, 'NX')
        if (claimed !== 'OK') {
          return NextResponse.json({ success: true, skipped: true, synced: 0, message: 'Recently synced' })
        }
      } catch {}
    }

    const syncPromise = syncCustomerGMBBusinesses(session.user)
    inFlight.set(userId, syncPromise)
    let result
    try {
      result = await syncPromise
    } finally {
      inFlight.delete(userId)
    }

    if (force && redis) {
      try { await redis.set(`gmb:autosync:${userId}`, '1', 'EX', AUTO_SYNC_WINDOW_SECONDS) } catch {}
    }

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
