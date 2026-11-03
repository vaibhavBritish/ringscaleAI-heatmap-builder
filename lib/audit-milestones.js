// Days after a business is added before its first milestone audit report unlocks.
// Change this one value to move the milestone (server, cron and dashboard all read it).
//
// Note: internally the milestone keeps its original identifiers (`day15`, '15_days',
// isDay15Available, daysToDay15…) so previously stored reports keep working; only the
// timing and the user-facing "7-Day" wording changed.
export const FIRST_MILESTONE_DAYS = 7

// Customers automatically receive an updated audit report by email this often,
// starting once the first milestone unlocks.
export const AUDIT_EMAIL_INTERVAL_DAYS = 7

// When the last automatic/manual audit email went out for a stored audit report.
// Falls back to the old 30-day email timestamp for reports created before weekly emails.
export function getLastAuditEmailSentAt(periodicReports) {
  const weekly = periodicReports?.weeklyEmail?.lastSentAt
  const monthly = periodicReports?.day30?.emailSentAt
  const times = [weekly, monthly].filter(Boolean).map(t => new Date(t).getTime()).filter(Number.isFinite)
  return times.length ? new Date(Math.max(...times)).toISOString() : null
}
