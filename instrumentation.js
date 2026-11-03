// Runs once when the Next.js server starts.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const { ensureIndexes } = await import('./lib/db-indexes')
  const { startScanJobSweeper } = await import('./lib/scan-engine')

  // Don't block server startup on index creation
  ensureIndexes().catch(err => console.warn('[Startup] ensureIndexes failed:', err.message))

  // Resume or close scans that were orphaned by a restart/deploy (the "stuck at 99%" case)
  startScanJobSweeper()

  // Daily job that emails customers their updated audit report every 7 days
  const { startPeriodicAuditScheduler } = await import('./lib/periodic-audits')
  startPeriodicAuditScheduler()
}
