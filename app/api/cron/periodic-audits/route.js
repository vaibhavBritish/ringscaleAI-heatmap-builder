import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateAndStoreAuditReport } from '@/lib/audit-generator'
import { send30DayUpdatedAuditEmail } from '@/lib/mail'

export const dynamic = 'force-dynamic'

/**
 * Automated Cron endpoint for 15-day and 30-day periodic audit reports.
 * 
 * - Generates updated audit reports for projects hitting 15 and 30 day milestones.
 * - Automatically emails the 30-day updated audit report to customers every 30 days.
 * - Can be scheduled via external cron / Vercel cron or triggered on-demand.
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
  const specificProjectId = searchParams.get('projectId')
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

  const results = {
    startedAt: new Date().toISOString(),
    totalEvaluated: 0,
    day15Generated: 0,
    day30Generated: 0,
    emailsSent: 0,
    errors: [],
    details: []
  }

  try {
    const query = specificProjectId 
      ? { where: { id: specificProjectId } }
      : {}

    const projects = await prisma.project.findMany(query)
    results.totalEvaluated = projects.length

    for (const project of projects) {
      try {
        const projectCreatedAt = new Date(project.createdAt || Date.now())
        const daysElapsed = Math.max(0, Math.floor((Date.now() - projectCreatedAt.getTime()) / (1000 * 60 * 60 * 24)))

        // Fetch existing audit
        const existingAudit = await prisma.businessAudit.findUnique({
          where: { id: project.id }
        })

        let auditData = {}
        if (existingAudit?.auditDataJson) {
          try {
            auditData = JSON.parse(existingAudit.auditDataJson)
          } catch {}
        }

        const periodic = auditData.periodicReports || {}
        const isDay15Due = (daysElapsed >= 15 && !periodic.day15)
        const isDay30Due = (daysElapsed >= 30)
        
        let lastEmailSentAt = null
        if (periodic.day30?.emailSentAt) {
          lastEmailSentAt = new Date(periodic.day30.emailSentAt)
        }

        const daysSinceLastEmail = lastEmailSentAt 
          ? Math.floor((Date.now() - lastEmailSentAt.getTime()) / (1000 * 60 * 60 * 24))
          : null

        // 30-day email is due if daysElapsed >= 30 AND (never sent OR > 25 days since last email)
        const isEmailDue = forceEmail || (isDay30Due && (daysSinceLastEmail === null || daysSinceLastEmail >= 25))

        let wasUpdated = false
        let updatedReport = auditData

        if (isDay15Due || isDay30Due || isEmailDue || !existingAudit) {
          // Generate fresh audit and record milestone
          updatedReport = await generateAndStoreAuditReport(project.id, {
            forceMilestone: isDay30Due ? '30_days' : (isDay15Due ? '15_days' : null)
          })
          wasUpdated = true

          if (isDay15Due) results.day15Generated++
          if (isDay30Due) results.day30Generated++
        }

        // Send 30-day updated audit email if due
        let emailSuccess = false
        if (isEmailDue) {
          const user = project.userId ? await prisma.user.findUnique({
            where: { id: project.userId },
            select: { email: true, name: true }
          }) : null

          if (user?.email) {
            const sendResult = await send30DayUpdatedAuditEmail(user.email, user.name, updatedReport, {
              businessName: project.businessName,
              projectId: project.id,
              scoreDelta: updatedReport.periodicReports?.day30?.scoreDelta
            })

            if (sendResult) {
              emailSuccess = true
              results.emailsSent++

              // Mark email sent in audit record
              if (updatedReport.periodicReports?.day30) {
                updatedReport.periodicReports.day30.emailSent = true
                updatedReport.periodicReports.day30.emailSentAt = new Date().toISOString()
                
                await prisma.businessAudit.update({
                  where: { id: project.id },
                  data: {
                    auditDataJson: JSON.stringify(updatedReport),
                    updatedAt: new Date()
                  }
                }).catch(() => {})
              }
            }
          }
        }

        results.details.push({
          projectId: project.id,
          businessName: project.businessName,
          daysElapsed,
          wasUpdated,
          isDay15Available: daysElapsed >= 15 || !!periodic.day15,
          isDay30Available: daysElapsed >= 30 || !!periodic.day30,
          emailSent: emailSuccess
        })

      } catch (projErr) {
        console.error(`[Periodic Cron] Error processing project ${project.id}:`, projErr)
        results.errors.push({ projectId: project.id, error: projErr.message })
      }
    }

    results.completedAt = new Date().toISOString()
    return NextResponse.json({ success: true, ...results })

  } catch (err) {
    console.error('[Periodic Cron] Global handler error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
