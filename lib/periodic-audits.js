import prisma from './prisma'
import redis from './redis'
import { generateAndStoreAuditReport } from './audit-generator'
import { sendWeeklyAuditEmail } from './mail'
import {
  FIRST_MILESTONE_DAYS,
  AUDIT_EMAIL_INTERVAL_DAYS,
  getLastAuditEmailSentAt
} from './audit-milestones'

const DAY_MS = 24 * 60 * 60 * 1000
// The job runs once a day, a few minutes later or earlier each time. A half-day grace
// keeps each business on a steady weekly rhythm instead of slipping to 8 days.
const EMAIL_DUE_AFTER_MS = (AUDIT_EMAIL_INTERVAL_DAYS - 0.5) * DAY_MS
// Small pause between emails so the SMTP provider doesn't throttle a large batch.
const SEND_GAP_MS = 1000
// Max audit emails per run. Gmail SMTP allows ~500 (free) / ~2,000 (Workspace) emails a
// day for the WHOLE account; hitting that also blocks sign-up OTP and welcome emails.
// Businesses over the cap stay due and are emailed on the next daily run.
const DAILY_EMAIL_LIMIT = parseInt(process.env.AUDIT_EMAIL_DAILY_LIMIT || '300', 10)

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const daysSince = (date) => Math.max(0, Math.floor((Date.now() - new Date(date || Date.now()).getTime()) / DAY_MS))

/** Kill switch: set AUDIT_EMAILS_ENABLED=false to stop all automatic audit emails. */
export function isAuditEmailEnabled() {
  return process.env.AUDIT_EMAILS_ENABLED !== 'false'
}

/**
 * Sends the weekly audit email for one business and records it on the stored audit
 * (periodicReports.weeklyEmail), which is what schedules the next one 7 days later.
 */
export async function deliverAuditEmail({ project, toEmail, toName, report }) {
  const periodic = report?.periodicReports || {}
  const score = report?.metrics?.optimizationScore ?? report?.optimizationScore ?? 0
  const previousScore = periodic.weeklyEmail?.lastScore ?? periodic.initial?.optimizationScore
  const delta = typeof previousScore === 'number' ? score - previousScore : null

  const sent = await sendWeeklyAuditEmail(toEmail, toName, report, {
    businessName: project.businessName,
    projectId: project.id,
    scoreDelta: delta === null ? null : (delta >= 0 ? `+${delta}` : `${delta}`)
  })
  if (!sent) return false

  // Re-read the stored audit so we only touch the email bookkeeping
  try {
    const stored = await prisma.businessAudit.findUnique({
      where: { id: project.id },
      select: { auditDataJson: true }
    })
    if (stored?.auditDataJson) {
      const data = JSON.parse(stored.auditDataJson)
      data.periodicReports = data.periodicReports || {}
      data.periodicReports.weeklyEmail = {
        lastSentAt: new Date().toISOString(),
        lastScore: score,
        count: (data.periodicReports.weeklyEmail?.count || 0) + 1
      }
      await prisma.businessAudit.update({
        where: { id: project.id },
        data: { auditDataJson: JSON.stringify(data), updatedAt: new Date() }
      })
    }
  } catch (err) {
    console.error(`[Audit Emails] Sent but could not record email for project ${project.id}:`, err.message)
  }

  // Dashboard lists are cached; clear so "Last sent" shows the new date right away
  if (redis && project.userId) {
    try { await redis.del(`user:projects:${project.userId}`, `user:stats:${project.userId}`) } catch {}
  }
  return true
}

/**
 * Generates due milestone reports and emails every customer whose last audit email is
 * 7+ days old (starting once their business is 7 days old). Safe to run repeatedly:
 * a business is only emailed again once its 7 days are up.
 */
export async function runPeriodicAudits({ projectId = null, forceEmail = false } = {}) {
  const results = {
    startedAt: new Date().toISOString(),
    totalEvaluated: 0,
    day15Generated: 0,
    day30Generated: 0,
    emailsSent: 0,
    emailsEnabled: isAuditEmailEnabled(),
    errors: [],
    details: []
  }

  // Only one full run at a time (built-in scheduler and any external cron call)
  const lockKey = 'cron:periodic-audits:running'
  let locked = false
  if (!projectId && redis) {
    try {
      const ok = await redis.set(lockKey, String(Date.now()), 'EX', 2 * 60 * 60, 'NX')
      if (ok !== 'OK') return { ...results, skipped: 'A periodic audit run is already in progress' }
      locked = true
    } catch {}
  }

  try {
    const projects = await prisma.project.findMany({
      where: projectId ? { OR: [{ id: projectId }, { clientSlug: projectId }] } : {},
      select: { id: true, userId: true, businessName: true, createdAt: true }
    })
    results.totalEvaluated = projects.length

    const userIds = [...new Set(projects.map(p => p.userId).filter(Boolean))]
    const users = new Map((await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, name: true }
    })).map(u => [u.id, u]))

    for (const project of projects) {
      try {
        const daysElapsed = daysSince(project.createdAt)

        const existingAudit = await prisma.businessAudit.findUnique({
          where: { id: project.id },
          select: { auditDataJson: true }
        })
        let auditData = {}
        if (existingAudit?.auditDataJson) {
          try { auditData = JSON.parse(existingAudit.auditDataJson) } catch {}
        }

        const periodic = auditData.periodicReports || {}
        const isDay15Due = daysElapsed >= FIRST_MILESTONE_DAYS && !periodic.day15
        const isDay30Due = daysElapsed >= 30 && !periodic.day30

        const user = users.get(project.userId)
        const lastSentAt = getLastAuditEmailSentAt(periodic)
        const emailWouldBeDue = results.emailsEnabled && !!user?.email && (
          forceEmail ||
          (daysElapsed >= FIRST_MILESTONE_DAYS &&
            (!lastSentAt || Date.now() - new Date(lastSentAt).getTime() >= EMAIL_DUE_AFTER_MS))
        )
        const underDailyLimit = !!projectId || !(DAILY_EMAIL_LIMIT > 0) || results.emailsSent < DAILY_EMAIL_LIMIT
        if (emailWouldBeDue && !underDailyLimit) {
          results.deferredByDailyLimit = (results.deferredByDailyLimit || 0) + 1
        }
        const isEmailDue = emailWouldBeDue && underDailyLimit

        let report = auditData
        let wasUpdated = false
        if (isDay15Due || isDay30Due || isEmailDue || !existingAudit) {
          // Fresh audit so the email carries this week's numbers; milestones are recorded once
          report = await generateAndStoreAuditReport(project.id, {
            forceMilestone: isDay30Due ? '30_days' : (isDay15Due ? '15_days' : null)
          })
          wasUpdated = true
          if (isDay15Due) results.day15Generated++
          if (isDay30Due) results.day30Generated++
        }

        let emailSent = false
        if (isEmailDue && report) {
          emailSent = await deliverAuditEmail({ project, toEmail: user.email, toName: user.name, report })
          if (emailSent) {
            results.emailsSent++
          } else {
            results.errors.push({ projectId: project.id, error: 'Email delivery failed (check SMTP settings)' })
          }
          await sleep(SEND_GAP_MS)
        }

        results.details.push({
          projectId: project.id,
          businessName: project.businessName,
          daysElapsed,
          wasUpdated,
          emailSent
        })
      } catch (projErr) {
        console.error(`[Periodic Audits] Error processing project ${project.id}:`, projErr)
        results.errors.push({ projectId: project.id, error: projErr.message })
      }
    }

    results.completedAt = new Date().toISOString()
    return results
  } finally {
    if (locked) {
      try { await redis.del(lockKey) } catch {}
    }
  }
}

/**
 * Runs the periodic audit job once a day inside the app, so weekly emails go out
 * without any external cron. Production only (a local dev server pointed at the live
 * database must never email customers). Settings:
 *   AUDIT_EMAIL_HOUR_UTC   hour of day (UTC) to run, default 13 (6:30pm IST / 9am US Eastern)
 *   AUDIT_EMAIL_SCHEDULER  set to "false" to disable this scheduler
 */
export function startPeriodicAuditScheduler() {
  if (globalThis.__rsAuditSchedulerStarted) return
  globalThis.__rsAuditSchedulerStarted = true

  if (process.env.NODE_ENV !== 'production' || process.env.AUDIT_EMAIL_SCHEDULER === 'false') {
    console.log('[Audit Emails] Daily scheduler disabled (not production or AUDIT_EMAIL_SCHEDULER=false)')
    return
  }

  const runHour = Math.min(23, Math.max(0, parseInt(process.env.AUDIT_EMAIL_HOUR_UTC ?? '13', 10) || 0))

  const tick = async () => {
    const now = new Date()
    if (now.getUTCHours() < runHour) return
    const day = now.toISOString().slice(0, 10)
    if (globalThis.__rsAuditLastRunDay === day) return

    // Claim today's run (survives restarts, prevents double runs)
    if (redis) {
      try {
        const ok = await redis.set(`cron:periodic-audits:day:${day}`, '1', 'EX', 36 * 60 * 60, 'NX')
        if (ok !== 'OK') {
          globalThis.__rsAuditLastRunDay = day
          return
        }
      } catch {}
    }
    globalThis.__rsAuditLastRunDay = day

    try {
      const r = await runPeriodicAudits()
      console.log(`[Audit Emails] Daily run: ${r.totalEvaluated} businesses checked, ${r.emailsSent} emails sent${r.deferredByDailyLimit ? `, ${r.deferredByDailyLimit} moved to tomorrow (daily limit)` : ''}, ${r.errors.length} errors${r.skipped ? ` (${r.skipped})` : ''}`)
    } catch (err) {
      console.error('[Audit Emails] Daily run failed:', err)
    }
  }

  const first = setTimeout(tick, 60 * 1000)
  first.unref?.()
  const timer = setInterval(tick, 10 * 60 * 1000)
  timer.unref?.()
}
