import { NextResponse } from 'next/server'
import { runAutoRescans } from '@/lib/auto-rescans'

export const dynamic = 'force-dynamic'
export const maxDuration = 800

/**
 * Re-scans every keyword whose latest scan is 15+ days old.
 *
 * The app already runs this once a day by itself (see startAutoRescanScheduler in
 * lib/auto-rescans.js). This endpoint lets you trigger it manually or from an external
 * cron. Query params: projectId (single business), force=true (ignore the 15-day wait).
 */
export async function GET(request) {
  return handle(request)
}

export async function POST(request) {
  return handle(request)
}

async function handle(request) {
  const authHeader = request.headers.get('authorization')
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token') || searchParams.get('key')

  if (process.env.CRON_SECRET) {
    const ok = authHeader === `Bearer ${process.env.CRON_SECRET}` || token === process.env.CRON_SECRET
    if (!ok) return NextResponse.json({ error: 'Unauthorized cron trigger' }, { status: 401 })
  }

  try {
    const results = await runAutoRescans({
      projectId: searchParams.get('projectId'),
      force: searchParams.get('force') === 'true'
    })
    return NextResponse.json({ success: true, ...results })
  } catch (err) {
    console.error('[Auto Rescans Cron] Error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
