/**
 * Merges duplicate projects: several project records owned by the same user for the
 * same Google place (same placeId). For each group it keeps one project and moves
 * everything from the others onto it, then deletes the empty copies.
 *
 *   node --env-file=.env scripts/merge-duplicate-projects.mjs              # dry run (report only)
 *   node --env-file=.env scripts/merge-duplicate-projects.mjs --apply      # merge
 *   ... --apply --backup=/path/backup.json                                 # backup location
 *
 * Kept project: the copy with the most scans, then most keywords, then the oldest.
 * Before changing anything, --apply writes every affected record to a JSON backup.
 * Copies whose QR code / review page has been scanned (scanCount > 0) or that have
 * leads are skipped, so printed QR codes keep working; they're listed in the report.
 */
import fs from 'fs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const APPLY = process.argv.includes('--apply')
const backupArg = process.argv.find(a => a.startsWith('--backup='))
const BACKUP_PATH = backupArg ? backupArg.slice(9) : `merge-duplicate-projects-backup-${Date.now()}.json`

const isRealPlaceId = (id) => !!id && id !== 'external_sync' && !id.startsWith('gmb_')

// Tables that simply point at a project: rows are moved to the kept project
const SIMPLE = ['scanJob', 'lead', 'businessProfile', 'citationSubmission', 'websiteAuditRun', 'sEOIssue',
  'aIRecommendation', 'citationRecord', 'sEOTask', 'sEOChangeLog', 'gmbPost', 'gmbReview']

async function main() {
  const projects = await prisma.project.findMany({
    select: { id: true, userId: true, placeId: true, businessName: true, clientSlug: true, scanCount: true, createdAt: true }
  })
  const groups = new Map()
  for (const p of projects) {
    if (!isRealPlaceId(p.placeId)) continue
    const key = `${p.userId}|${p.placeId}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(p)
  }
  const dupGroups = [...groups.values()].filter(g => g.length > 1)
  if (dupGroups.length === 0) {
    console.log('No duplicate projects found.')
    return
  }

  const allIds = dupGroups.flat().map(p => p.id)
  const [scanCounts, kwCounts, leadCounts] = await Promise.all([
    prisma.scanJob.groupBy({ by: ['projectId'], where: { projectId: { in: allIds } }, _count: true }),
    prisma.keyword.groupBy({ by: ['projectId'], where: { projectId: { in: allIds } }, _count: true }),
    prisma.lead.groupBy({ by: ['projectId'], where: { projectId: { in: allIds } }, _count: true })
  ])
  const toMap = (rows) => new Map(rows.map(r => [r.projectId, r._count]))
  const scans = toMap(scanCounts), kws = toMap(kwCounts), leads = toMap(leadCounts)

  const plan = []
  let totalDelete = 0, totalProtected = 0
  for (const group of dupGroups) {
    const sorted = [...group].sort((a, b) =>
      (scans.get(b.id) || 0) - (scans.get(a.id) || 0) ||
      (kws.get(b.id) || 0) - (kws.get(a.id) || 0) ||
      new Date(a.createdAt) - new Date(b.createdAt))
    const keep = sorted[0]
    const others = sorted.slice(1)
    const merge = others.filter(p => !(p.scanCount > 0) && !(leads.get(p.id) > 0))
    const protectedOnes = others.filter(p => p.scanCount > 0 || leads.get(p.id) > 0)
    totalDelete += merge.length
    totalProtected += protectedOnes.length
    plan.push({ keep, merge, protectedOnes })
  }

  console.log(`${dupGroups.length} businesses have duplicates. ${totalDelete} copies will be merged and deleted, ${totalProtected} kept (QR scanned or has leads).\n`)
  for (const { keep, merge, protectedOnes } of plan.sort((a, b) => b.merge.length - a.merge.length)) {
    const moving = merge.reduce((s, p) => s + (scans.get(p.id) || 0), 0)
    const movingKw = merge.reduce((s, p) => s + (kws.get(p.id) || 0), 0)
    console.log(`- ${keep.businessName.slice(0, 60)}: keep 1 (${scans.get(keep.id) || 0} scans, ${kws.get(keep.id) || 0} keywords), merge ${merge.length} copies (${moving} scans, ${movingKw} keywords move)${protectedOnes.length ? `, ${protectedOnes.length} left alone: ${protectedOnes.map(p => `${p.clientSlug} (${p.scanCount || 0} QR scans, ${leads.get(p.id) || 0} leads)`).join(', ')}` : ''}`)
  }

  if (!APPLY) {
    console.log('\nDry run only. Re-run with --apply to merge.')
    return
  }

  // ── Backup everything that will change ──────────────────────────────────────
  const mergeIds = plan.flatMap(x => x.merge.map(p => p.id))
  const keepIds = plan.map(x => x.keep.id)
  const touched = [...mergeIds, ...keepIds]
  const backup = { createdAt: new Date().toISOString(), plan: plan.map(x => ({ keep: x.keep.id, merge: x.merge.map(p => p.id) })) }
  backup.projects = await prisma.project.findMany({ where: { id: { in: mergeIds } } })
  backup.keywords = await prisma.keyword.findMany({ where: { projectId: { in: touched } } })
  backup.keywordRanks = await prisma.keywordRank.findMany({ where: { projectId: { in: touched } } })
  backup.seoPerformance = await prisma.sEOPerformance.findMany({ where: { projectId: { in: touched } } })
  backup.businessAudits = await prisma.businessAudit.findMany({ where: { OR: [{ id: { in: touched } }, { projectId: { in: touched } }] } })
  for (const model of SIMPLE) {
    backup[model] = await prisma[model].findMany({ where: { projectId: { in: mergeIds } } })
  }
  fs.writeFileSync(BACKUP_PATH, JSON.stringify(backup))
  console.log(`\nBackup written to ${BACKUP_PATH}`)

  // ── Merge ───────────────────────────────────────────────────────────────────
  for (const { keep, merge } of plan) {
    if (merge.length === 0) continue
    const ids = merge.map(p => p.id)

    // Keywords: same text as one the kept project has -> point its scans there; else move it
    const keepKws = await prisma.keyword.findMany({ where: { projectId: keep.id } })
    const keepByText = new Map(keepKws.map(k => [k.keyword.trim().toLowerCase(), k.id]))
    const dupKws = await prisma.keyword.findMany({ where: { projectId: { in: ids } } })
    for (const kw of dupKws) {
      const text = kw.keyword.trim().toLowerCase()
      const target = keepByText.get(text)
      if (target) {
        await prisma.scanJob.updateMany({ where: { keywordId: kw.id }, data: { keywordId: target } })
        await prisma.keyword.delete({ where: { id: kw.id } })
      } else {
        await prisma.keyword.update({ where: { id: kw.id }, data: { projectId: keep.id } })
        keepByText.set(text, kw.id)
      }
    }

    for (const model of SIMPLE) {
      await prisma[model].updateMany({ where: { projectId: { in: ids } }, data: { projectId: keep.id } })
    }

    // Unique per project: move only rows the kept project doesn't already have
    for (const [model, field] of [['keywordRank', 'keyword'], ['sEOPerformance', 'date']]) {
      const existing = new Set((await prisma[model].findMany({ where: { projectId: keep.id }, select: { [field]: true } }))
        .map(r => String(r[field])))
      for (const row of await prisma[model].findMany({ where: { projectId: { in: ids } } })) {
        if (existing.has(String(row[field]))) {
          await prisma[model].delete({ where: { id: row.id } })
        } else {
          await prisma[model].update({ where: { id: row.id }, data: { projectId: keep.id } })
          existing.add(String(row[field]))
        }
      }
    }

    // Audit reports are stored under the project's id. If the kept project has none,
    // adopt the newest one from a copy; then remove the copies' reports.
    const keepAudit = await prisma.businessAudit.findUnique({ where: { id: keep.id } })
    const dupAudits = await prisma.businessAudit.findMany({
      where: { OR: [{ id: { in: ids } }, { projectId: { in: ids } }] },
      orderBy: { updatedAt: 'desc' }
    })
    if (!keepAudit && dupAudits[0]) {
      const { oid, id, projectId, ...rest } = dupAudits[0]
      await prisma.businessAudit.create({ data: { ...rest, id: keep.id, projectId: keep.id } })
    }
    if (dupAudits.length) {
      await prisma.businessAudit.deleteMany({ where: { id: { in: dupAudits.map(a => a.id) } } })
    }

    await prisma.project.deleteMany({ where: { id: { in: ids } } })
    console.log(`Merged ${ids.length} copies into ${keep.businessName.slice(0, 50)}`)
  }

  console.log('\nDone. Restart the app or wait ~5 minutes for cached project lists to refresh.')
}

main()
  .catch(err => { console.error(err); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
