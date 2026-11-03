import prisma from './prisma'

/**
 * Prisma only creates MongoDB indexes on `prisma db push`, which the deploy
 * pipeline never runs. Without them every lookup by id / projectId / scanJobId
 * is a full collection scan, and the app gets slower as data grows.
 *
 * This creates the hot-path indexes declared in prisma/schema.prisma, using
 * Prisma's own index names so a later `prisma db push` treats them as existing.
 * It is idempotent: indexes that already exist (by name or by key) are skipped.
 */
const INDEXES = {
  users: [
    { name: 'users_id_key', key: { id: 1 }, unique: true },
    { name: 'users_companyId_idx', key: { companyId: 1 } }
  ],
  projects: [
    { name: 'projects_id_key', key: { id: 1 }, unique: true },
    { name: 'projects_userId_idx', key: { userId: 1 } },
    { name: 'projects_companyId_idx', key: { companyId: 1 } }
  ],
  keywords: [
    { name: 'keywords_id_key', key: { id: 1 }, unique: true },
    { name: 'keywords_projectId_idx', key: { projectId: 1 } }
  ],
  scan_jobs: [
    { name: 'scan_jobs_id_key', key: { id: 1 }, unique: true },
    { name: 'scan_jobs_projectId_idx', key: { projectId: 1 } },
    { name: 'scan_jobs_keywordId_idx', key: { keywordId: 1 } },
    { name: 'scan_jobs_status_idx', key: { status: 1 } },
    { name: 'scan_jobs_projectId_createdAt_idx', key: { projectId: 1, createdAt: 1 } },
    { name: 'scan_jobs_keywordId_createdAt_idx', key: { keywordId: 1, createdAt: 1 } }
  ],
  scan_results: [
    { name: 'scan_results_id_key', key: { id: 1 }, unique: true },
    { name: 'scan_results_scanJobId_idx', key: { scanJobId: 1 } },
    { name: 'scan_results_scanJobId_rowIndex_colIndex_idx', key: { scanJobId: 1, rowIndex: 1, colIndex: 1 } }
  ],
  business_audits: [
    { name: 'business_audits_id_key', key: { id: 1 }, unique: true },
    { name: 'business_audits_projectId_idx', key: { projectId: 1 } }
  ]
}

const sameKey = (a, b) => JSON.stringify(a) === JSON.stringify(b)

export async function ensureIndexes() {
  if (globalThis.__rsIndexesEnsured) return
  globalThis.__rsIndexesEnsured = true
  if (process.env.SKIP_ENSURE_INDEXES === 'true') return

  for (const [collection, indexes] of Object.entries(INDEXES)) {
    let existing = []
    try {
      const res = await prisma.$runCommandRaw({ listIndexes: collection })
      existing = res?.cursor?.firstBatch || []
    } catch (err) {
      // Collection does not exist yet — Mongo creates it (and Prisma its indexes) later
      continue
    }

    for (const idx of indexes) {
      if (existing.some(e => e.name === idx.name || sameKey(e.key, idx.key))) continue
      try {
        await prisma.$runCommandRaw({ createIndexes: collection, indexes: [idx] })
        console.log(`[DB Indexes] Created ${collection}.${idx.name}`)
      } catch (err) {
        console.warn(`[DB Indexes] Could not create ${collection}.${idx.name}: ${err.message}`)
      }
    }
  }
}
