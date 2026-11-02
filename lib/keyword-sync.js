import prisma from './prisma.js'
import { v4 as uuidv4 } from 'uuid'

/**
 * Makes a project's Keyword rows mirror the given list (GMB Connector is the source of truth).
 * - Adds keywords missing from the project
 * - Removes keywords (and duplicates) no longer in the list
 * Keywords that already have heatmap scans are kept so scan history can still resolve them.
 */
export async function syncProjectKeywords(projectId, keywords) {
  const wanted = new Map()
  for (const kw of keywords || []) {
    const trimmed = typeof kw === 'string' ? kw.trim() : ''
    if (trimmed && !wanted.has(trimmed.toLowerCase())) wanted.set(trimmed.toLowerCase(), trimmed)
  }

  const existing = await prisma.keyword.findMany({ where: { projectId } })
  const present = new Set()
  const stale = []
  for (const row of existing) {
    const key = (row.keyword || '').trim().toLowerCase()
    if (wanted.has(key) && !present.has(key)) {
      present.add(key)
    } else {
      stale.push(row)
    }
  }

  let removed = 0
  if (stale.length > 0) {
    const scanned = await prisma.scanJob.findMany({
      where: { keywordId: { in: stale.map(k => k.id) } },
      select: { keywordId: true }
    })
    const scannedIds = new Set(scanned.map(s => s.keywordId))
    const removableIds = stale.filter(k => !scannedIds.has(k.id)).map(k => k.id)
    if (removableIds.length > 0) {
      const result = await prisma.keyword.deleteMany({ where: { id: { in: removableIds } } })
      removed = result.count
    }
  }

  let added = 0
  for (const [key, kw] of wanted) {
    if (present.has(key)) continue
    await prisma.keyword.create({
      data: {
        id: uuidv4(),
        projectId,
        keyword: kw,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    added++
  }

  return { added, removed }
}
