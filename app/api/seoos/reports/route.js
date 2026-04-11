import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/seoos-auth'
import prisma from "@/lib/prisma"

export async function GET(request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  // Portfolio-level stats for SEOOS reports
  const [
    totalProjects,
    totalAuditRuns,
    openIssues,
    resolvedIssues,
    criticalIssues,
    pendingRecs,
    approvedRecs,
    openTasks,
    doneTasks,
    citationsTotal,
    citationsLive,
    recentScans,
  ] = await Promise.all([
    prisma.project.count({ where: projectId ? { id: projectId } : {} }),
    prisma.websiteAuditRun.count({ where: { status: 'complete', ...(projectId ? { projectId } : {}) } }),
    prisma.sEOIssue.count({ where: { status: 'open', ...(projectId ? { projectId } : {}) } }),
    prisma.sEOIssue.count({ where: { status: 'resolved', ...(projectId ? { projectId } : {}) } }),
    prisma.sEOIssue.count({ where: { severity: 'critical', status: 'open', ...(projectId ? { projectId } : {}) } }),
    prisma.aIRecommendation.count({ where: { status: 'pending', ...(projectId ? { projectId } : {}) } }),
    prisma.aIRecommendation.count({ where: { status: 'approved', ...(projectId ? { projectId } : {}) } }),
    prisma.sEOTask.count({ where: { status: { not: 'done' }, ...(projectId ? { projectId } : {}) } }),
    prisma.sEOTask.count({ where: { status: 'done', ...(projectId ? { projectId } : {}) } }),
    prisma.citationRecord.count({ where: projectId ? { projectId } : {} }),
    prisma.citationRecord.count({ where: { status: 'live', ...(projectId ? { projectId } : {}) } }),
    prisma.scanJob.findMany({
      where: { status: 'completed', ...(projectId ? { projectId } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: { id: true, createdAt: true, projectId: true, gridSize: true }
    }),
  ])

  // Latest audit runs
  const latestAudits = await prisma.websiteAuditRun.findMany({
    where: { status: 'complete', ...(projectId ? { projectId } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, url: true, techScore: true, onPageScore: true, contentScore: true, perfScore: true, schemaScore: true, totalIssues: true, createdAt: true }
  })

  const avgScores = latestAudits.length > 0 ? {
    tech: Math.round(latestAudits.reduce((s, a) => s + (a.techScore || 0), 0) / latestAudits.length),
    onPage: Math.round(latestAudits.reduce((s, a) => s + (a.onPageScore || 0), 0) / latestAudits.length),
    content: Math.round(latestAudits.reduce((s, a) => s + (a.contentScore || 0), 0) / latestAudits.length),
    perf: Math.round(latestAudits.reduce((s, a) => s + (a.perfScore || 0), 0) / latestAudits.length),
  } : null

  return NextResponse.json({
    overview: {
      totalProjects,
      totalAuditRuns,
      openIssues,
      resolvedIssues,
      criticalIssues,
      pendingRecs,
      approvedRecs,
      openTasks,
      doneTasks,
      citationCoverage: citationsTotal > 0 ? Math.round((citationsLive / citationsTotal) * 100) : 0,
      taskCompletionRate: (openTasks + doneTasks) > 0 ? Math.round((doneTasks / (openTasks + doneTasks)) * 100) : 0,
      aiApprovalRate: (pendingRecs + approvedRecs) > 0 ? Math.round((approvedRecs / (pendingRecs + approvedRecs)) * 100) : 0,
    },
    avgScores,
    latestAudits,
    recentScans,
  })
}
