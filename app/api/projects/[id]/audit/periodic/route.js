import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { generateAndStoreAuditReport, computeProjectAuditCycle } from '@/lib/audit-generator'
import { send30DayUpdatedAuditEmail } from '@/lib/mail'

export const dynamic = 'force-dynamic'

/**
 * Endpoint for managing and triggering periodic audit reports (15 days & 30 days) and automated emails.
 */
export async function GET(req, props) {
  const params = await props.params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId } = params
    const isAdminOrStaff = ['admin', 'superadmin', 'staff'].includes(session.user?.role)
    const project = await prisma.project.findFirst({
      where: isAdminOrStaff
        ? { OR: [{ id: projectId }, { clientSlug: projectId }] }
        : { OR: [{ id: projectId }, { clientSlug: projectId }], userId: session.user.id }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const audit = await prisma.businessAudit.findFirst({
      where: {
        OR: [
          { id: project.id },
          { projectId: project.id }
        ]
      },
      orderBy: { updatedAt: 'desc' }
    })

    let auditData = null
    if (audit?.auditDataJson) {
      try {
        auditData = JSON.parse(audit.auditDataJson)
      } catch {}
    }

    if (!auditData) {
      auditData = await generateAndStoreAuditReport(project.id)
    }

    const cycleInfo = computeProjectAuditCycle(project, audit)

    return NextResponse.json({
      success: true,
      projectId,
      businessName: project.businessName,
      cycleInfo,
      periodicReports: auditData.periodicReports || {},
      auditCycle: auditData.auditCycle || {},
      optimizationScore: auditData.metrics?.optimizationScore || 0
    })
  } catch (error) {
    console.error('[Periodic Audit GET] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch periodic audit info' }, { status: 500 })
  }
}

export async function POST(req, props) {
  const params = await props.params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId } = params
    const body = await req.json().catch(() => ({}))
    const { action, cycle } = body // action: 'generate_milestone' | 'send_email' | 'refresh'

    const isAdminOrStaff = ['admin', 'superadmin', 'staff'].includes(session.user?.role)
    const project = await prisma.project.findFirst({
      where: isAdminOrStaff
        ? { OR: [{ id: projectId }, { clientSlug: projectId }] }
        : { OR: [{ id: projectId }, { clientSlug: projectId }], userId: session.user.id }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true }
    })
    const projectCreatedAt = new Date(project.createdAt || Date.now())
    const daysElapsed = Math.max(0, Math.floor((Date.now() - projectCreatedAt.getTime()) / (1000 * 60 * 60 * 24)))

    if (action === 'send_email') {
      if (daysElapsed < 30) {
        return NextResponse.json({
          error: `The 30-Day audit report is locked. It will automatically unlock and be emailed in ${30 - daysElapsed} days.`
        }, { status: 400 })
      }

      // Fetch or generate latest audit
      let auditReport = null
      const existingAudit = await prisma.businessAudit.findFirst({
        where: {
          OR: [
            { id: project.id },
            { projectId: project.id }
          ]
        },
        orderBy: { updatedAt: 'desc' }
      })

      if (existingAudit?.auditDataJson) {
        try {
          auditReport = JSON.parse(existingAudit.auditDataJson)
        } catch {}
      }

      if (!auditReport) {
        auditReport = await generateAndStoreAuditReport(project.id, { forceMilestone: '30_days' })
      }

      // Send the 30-day updated report email
      const targetEmail = body.email || user.email
      const sendResult = await send30DayUpdatedAuditEmail(targetEmail, user.name, auditReport, {
        businessName: project.businessName,
        projectId: project.id,
        scoreDelta: auditReport.periodicReports?.day30?.scoreDelta || '+8'
      })

      if (!sendResult) {
        return NextResponse.json({ error: 'Failed to send email. Check SMTP settings.' }, { status: 500 })
      }

      // Mark email sent in DB
      if (auditReport.periodicReports?.day30) {
        auditReport.periodicReports.day30.emailSent = true
        auditReport.periodicReports.day30.emailSentAt = new Date().toISOString()
      }

      if (existingAudit) {
        await prisma.businessAudit.update({
          where: { id: existingAudit.id },
          data: {
            auditDataJson: JSON.stringify(auditReport),
            updatedAt: new Date()
          }
        }).catch(() => {})
      }

      return NextResponse.json({
        success: true,
        message: `30-Day Updated Audit Report successfully sent to ${targetEmail}!`
      })
    }

    // Milestone generation (15_days or 30_days)
    const milestoneCycle = cycle || (action === 'generate_30' ? '30_days' : '15_days')
    if (milestoneCycle === '15_days' && daysElapsed < 15) {
      return NextResponse.json({
        error: `The 15-Day milestone report is locked. It will unlock after 15 days (in ${15 - daysElapsed} days).`
      }, { status: 400 })
    }
    if (milestoneCycle === '30_days' && daysElapsed < 30) {
      return NextResponse.json({
        error: `The 30-Day milestone report is locked. It will unlock after 30 days (in ${30 - daysElapsed} days).`
      }, { status: 400 })
    }

    const updatedAudit = await generateAndStoreAuditReport(project.id, {
      forceMilestone: milestoneCycle
    })

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${milestoneCycle === '30_days' ? '30-Day' : '15-Day'} audit report!`,
      periodicReports: updatedAudit.periodicReports,
      auditCycle: updatedAudit.auditCycle
    })

  } catch (error) {
    console.error('[Periodic Audit POST] Error:', error)
    return NextResponse.json({ error: 'Action failed: ' + error.message }, { status: 500 })
  }
}
