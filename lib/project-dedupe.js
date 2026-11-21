// Some owners have several project records for the same Google place (older duplicates,
// kept in the database on purpose). Lists show each business once: the copy with the
// most data is shown and the others are hidden. Nothing is deleted.

// Placeholder place IDs are shared by unrelated businesses, so never group on them
export function isRealPlaceId(placeId) {
  return !!placeId && placeId !== 'external_sync' && !placeId.startsWith('gmb_')
}

/**
 * Returns one project per (owner, Google place), keeping the input order.
 * `score(project)` ranks copies; the highest wins, ties go to the oldest.
 * Projects need id, placeId and createdAt; userId is used when present.
 */
export function collapseDuplicateProjects(projects, score = () => 0) {
  const best = new Map()
  for (const p of projects) {
    if (!isRealPlaceId(p.placeId)) continue
    const key = `${p.userId || ''}|${p.placeId}`
    const cur = best.get(key)
    if (!cur) { best.set(key, p); continue }
    const diff = score(p) - score(cur)
    if (diff > 0 || (diff === 0 && new Date(p.createdAt) < new Date(cur.createdAt))) best.set(key, p)
  }
  const keepIds = new Set([...best.values()].map(p => p.id))
  return projects.filter(p => !isRealPlaceId(p.placeId) || keepIds.has(p.id))
}
