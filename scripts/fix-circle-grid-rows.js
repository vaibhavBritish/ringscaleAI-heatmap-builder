// Repairs saved results of circle-grid scans with 20/30/35 pins (any non-square pin count).
//
//   node --env-file=.env scripts/fix-circle-grid-rows.js           # dry run, no writes
//   node --env-file=.env scripts/fix-circle-grid-rows.js --apply   # rewrite rowIndex values
//
// Before the fix in lib/heatmap-utils.js, those grids gave several pins the same
// (rowIndex, colIndex), so they overwrote each other on the map and in the combined
// ("overall") view. The grid now uses row = floor(i / cols), col = i % cols with
// cols = floor(sqrt(pins)). Column numbers never changed; only rows differ.
//
// For each old scan with duplicate positions this recovers every pin's index i from its
// coordinates (Vogel spiral: distance from the centre grows strictly with i, and the old
// row/col narrows each pin to 1-3 candidates), verifies the fit, and rewrites rowIndex.
// Scans that don't fit cleanly are skipped and listed. Safe to run more than once.
const { PrismaClient } = require('@prisma/client');

const APPLY = process.argv.includes('--apply');
const EARTH_KM = 6371;
const TOLERANCE = 0.35; // max allowed |fitted index - assigned index|

const oldKey = (i, d) => `${Math.floor(i / Math.sqrt(d))},${i % Math.floor(Math.sqrt(d))}`;
const isPerfectSquare = (d) => Number.isInteger(Math.sqrt(d));

function distanceKm(p, c) {
  const dy = (p.latitude - c.latitude) * Math.PI / 180 * EARTH_KM;
  const dx = (p.longitude - c.longitude) * Math.PI / 180 * EARTH_KM * Math.cos(c.latitude * Math.PI / 180);
  return Math.sqrt(dx * dx + dy * dy);
}

// Best assignment of group members to distinct candidate indices (groups are tiny)
function bestAssignment(members, candidates) {
  let best = null;
  const used = new Array(candidates.length).fill(false);
  const pick = [];
  (function search(k, cost) {
    if (best && cost >= best.cost) return;
    if (k === members.length) { best = { cost, pick: [...pick] }; return; }
    for (let c = 0; c < candidates.length; c++) {
      if (used[c]) continue;
      used[c] = true; pick.push(candidates[c]);
      search(k + 1, cost + Math.abs(members[k].fit - candidates[c]));
      used[c] = false; pick.pop();
    }
  })(0, 0);
  return best;
}

/**
 * Recovers the spiral index of every result of one old circle-grid scan.
 * Returns { ok: true, indices: Map(resultId -> i) } or { ok: false, reason }.
 */
function reconstructIndices(results, d, projectCenter) {
  const candidatesByKey = new Map();
  for (let i = 0; i < d; i++) {
    const k = oldKey(i, d);
    if (!candidatesByKey.has(k)) candidatesByKey.set(k, []);
    candidatesByKey.get(k).push(i);
  }

  const groups = new Map();
  for (const r of results) {
    const k = `${r.rowIndex},${r.colIndex}`;
    if (!candidatesByKey.has(k)) return { ok: false, reason: `position ${k} is not part of an old ${d}-pin circle grid` };
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  for (const [k, members] of groups) {
    if (members.length > candidatesByKey.get(k).length) return { ok: false, reason: `too many results at ${k}` };
  }

  // Centre = pin 0. Prefer the project's location when a result sits on it; otherwise the
  // member of the (0,0) group closest to the centroid (pin 0 is the spiral's middle).
  const originGroup = groups.get('0,0') || [];
  let center = null;
  if (projectCenter && originGroup.some(r => distanceKm(r, projectCenter) < 0.002)) {
    center = projectCenter;
  } else if (originGroup.length > 0) {
    const centroid = {
      latitude: results.reduce((s, r) => s + r.latitude, 0) / results.length,
      longitude: results.reduce((s, r) => s + r.longitude, 0) / results.length
    };
    center = originGroup.reduce((a, b) => (distanceKm(a, centroid) <= distanceKm(b, centroid) ? a : b));
  }
  if (!center) return { ok: false, reason: 'centre pin missing' };

  // Grid radius from pins whose old position maps to exactly one index
  const radii = [];
  for (const r of results) {
    const cands = candidatesByKey.get(`${r.rowIndex},${r.colIndex}`);
    if (cands.length === 1 && cands[0] > 0) radii.push(distanceKm(r, center) / Math.sqrt(cands[0] / (d - 1)));
  }
  if (radii.length === 0) return { ok: false, reason: 'cannot determine grid radius' };
  radii.sort((a, b) => a - b);
  const radius = radii[Math.floor(radii.length / 2)];
  if (!(radius > 0)) return { ok: false, reason: 'zero grid radius' };

  const indices = new Map();
  for (const [k, members] of groups) {
    const withFit = members.map(r => ({ r, fit: (distanceKm(r, center) / radius) ** 2 * (d - 1) }));
    const best = bestAssignment(withFit, candidatesByKey.get(k));
    for (let m = 0; m < withFit.length; m++) {
      const i = best.pick[m];
      if (Math.abs(withFit[m].fit - i) > TOLERANCE) {
        return { ok: false, reason: `pin at ${k} does not fit the spiral (fit ${withFit[m].fit.toFixed(2)} vs ${i})` };
      }
      indices.set(withFit[m].r.id, i);
    }
  }
  return { ok: true, indices };
}

async function main() {
  const prisma = new PrismaClient();
  let redis = null;
  if (APPLY && process.env.REDIS_URL) {
    try {
      const Redis = require('ioredis');
      redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1, lazyConnect: true });
      await redis.connect();
    } catch (e) {
      console.warn('Redis not reachable — cached results will expire on their own within 30 minutes.');
      redis = null;
    }
  }

  try {
    const jobs = (await prisma.scanJob.findMany({
      select: { id: true, projectId: true, totalPoints: true }
    })).filter(j => j.totalPoints > 1 && !isPerfectSquare(j.totalPoints));

    const projects = new Map((await prisma.project.findMany({
      where: { id: { in: [...new Set(jobs.map(j => j.projectId))] } },
      select: { id: true, latitude: true, longitude: true }
    })).map(p => [p.id, p]));

    console.log(`${jobs.length} scan(s) with a non-square pin count to check${APPLY ? '' : ' (dry run)'}\n`);
    const stats = { fixed: 0, alreadyOk: 0, skipped: 0, rowsChanged: 0 };
    const touchedProjects = new Set();

    for (const job of jobs) {
      const results = (await prisma.scanResult.findMany({
        where: { scanJobId: job.id },
        select: { id: true, rowIndex: true, colIndex: true, latitude: true, longitude: true }
      })).filter(r => r.rowIndex !== null && r.colIndex !== null && r.latitude !== null && r.longitude !== null);

      const keys = new Set(results.map(r => `${r.rowIndex},${r.colIndex}`));
      if (keys.size === results.length) { stats.alreadyOk++; continue; } // no duplicates: nothing to fix

      const outcome = reconstructIndices(results, job.totalPoints, projects.get(job.projectId));
      if (!outcome.ok) {
        stats.skipped++;
        console.log(`SKIP  scan ${job.id}: ${outcome.reason}`);
        continue;
      }

      const cols = Math.floor(Math.sqrt(job.totalPoints));
      const changes = results
        .map(r => ({ r, row: Math.floor(outcome.indices.get(r.id) / cols) }))
        .filter(({ r, row }) => row !== r.rowIndex);

      console.log(`${APPLY ? 'FIX ' : 'WOULD FIX'}  scan ${job.id} (${job.totalPoints} pins): ${changes.length} row value(s)`);
      if (APPLY) {
        for (const { r, row } of changes) {
          await prisma.scanResult.update({ where: { id: r.id }, data: { rowIndex: row } });
        }
      }
      stats.fixed++;
      stats.rowsChanged += changes.length;
      touchedProjects.add(job.projectId);
    }

    if (APPLY && redis && touchedProjects.size > 0) {
      const projectJobs = await prisma.scanJob.findMany({
        where: { projectId: { in: [...touchedProjects] } },
        select: { id: true }
      });
      const cacheKeys = projectJobs.flatMap(j => [`scan:results:${j.id}`, `scan:results:${j.id}:aggregate`]);
      for (let i = 0; i < cacheKeys.length; i += 500) await redis.del(...cacheKeys.slice(i, i + 500));
      console.log(`\nCleared cached results for ${touchedProjects.size} project(s).`);
    }

    console.log(`\n${APPLY ? 'Fixed' : 'Would fix'} ${stats.fixed} scan(s) (${stats.rowsChanged} rows), ` +
      `${stats.alreadyOk} already fine, ${stats.skipped} skipped.`);
    if (!APPLY && stats.fixed > 0) console.log('Re-run with --apply to write the changes.');
  } finally {
    await prisma.$disconnect();
    if (redis) redis.disconnect();
  }
}

module.exports = { reconstructIndices };

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
