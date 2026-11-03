import { NextResponse } from 'next/server'
import { runPeriodicAudits } from '@/lib/periodic-audits'

export const dynamic = 'force-dynamic'

/**
 * Periodic audit job: generates 7-day / 30-day milestone reports and emails every
 * customer an updated audit report every 7 days.
 *
 * The app already runs this once a day by itself (see startPeriodicAuditScheduler in
 * lib/periodic-audits.js). This endpoint lets you trigger it manually or from an
 * external cron. Query params: projectId (single business), forceEmail=true.
 */
export async function GET(request) {
  return handlePeriodicCron(request)
}

export async function POST(request) {
  return handlePeriodicCron(request)
}

async function handlePeriodicCron(request) {
  const authHeader = request.headers.get('authorization')
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token') || searchParams.get('key')
  const projectId = searchParams.get('projectId')
  const forceEmail = searchParams.get('forceEmail') === 'true'

  // Validate cron secret if defined
  if (process.env.CRON_SECRET) {
    const isAuthorized =
      authHeader === `Bearer ${process.env.CRON_SECRET}` ||
      token === process.env.CRON_SECRET

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized cron trigger' }, { status: 401 })
    }
  }

  try {
    const results = await runPeriodicAudits({ projectId, forceEmail })
    return NextResponse.json({ success: true, ...results })
  } catch (err) {
    console.error('[Periodic Cron] Global handler error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
