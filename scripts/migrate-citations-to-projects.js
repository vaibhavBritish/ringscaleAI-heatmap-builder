// Moves citation data from one-per-user to one-per-business (project).
//
//   node --env-file=.env scripts/migrate-citations-to-projects.js           # dry run, no writes
//   node --env-file=.env scripts/migrate-citations-to-projects.js --apply   # perform migration
//
// 1. Drops the old unique indexes (business_profiles.userId, citation_submissions.userId+directoryId)
//    so a user can hold citation data for several businesses.
// 2. Creates the new lookup indexes on projectId.
// 3. Assigns each existing profile to the owner's project with a matching business name;
//    submissions follow their profile's project. Unmatched data is left untouched and listed.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const APPLY = process.argv.includes('--apply');

const NEW_INDEXES = {
  business_profiles: [
    { key: { userId: 1 }, name: 'business_profiles_userId_idx' },
    { key: { projectId: 1 }, name: 'business_profiles_projectId_idx' },
  ],
  citation_submissions: [
    { key: { userId: 1 }, name: 'citation_submissions_userId_idx' },
    { key: { projectId: 1, directoryId: 1 }, name: 'citation_submissions_projectId_directoryId_idx' },
  ],
};

const unsetProject = { OR: [{ projectId: null }, { projectId: { isSet: false } }] };
const normalize = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const namesMatch = (a, b) => {
  const [x, y] = [normalize(a), normalize(b)];
  return Boolean(x && y) && (x === y || x.includes(y) || y.includes(x));
};

async function migrateIndexes() {
  for (const [collection, indexes] of Object.entries(NEW_INDEXES)) {
    const res = await prisma.$runCommandRaw({ listIndexes: collection });
    const existing = res.cursor.firstBatch;

    const stale = existing.filter(idx => idx.unique && Object.keys(idx.key).includes('userId'));
    for (const idx of stale) {
      console.log(`${APPLY ? 'Dropping' : 'Would drop'} unique index ${collection}.${idx.name}`);
      if (APPLY) await prisma.$runCommandRaw({ dropIndexes: collection, index: idx.name });
    }

    const missing = indexes.filter(idx => !existing.some(e => e.name === idx.name));
    for (const idx of missing) {
      console.log(`${APPLY ? 'Creating' : 'Would create'} index ${collection}.${idx.name}`);
    }
    if (APPLY && missing.length) {
      await prisma.$runCommandRaw({ createIndexes: collection, indexes: missing });
    }
  }
}

async function migrateData() {
  const profiles = await prisma.businessProfile.findMany({ where: unsetProject });
  const submissions = await prisma.citationSubmission.findMany({ where: unsetProject });
  const userIds = [...new Set([...profiles, ...submissions].map(r => r.userId))];

  const projects = await prisma.project.findMany({
    where: { userId: { in: userIds } },
    select: { id: true, userId: true, businessName: true },
    orderBy: { createdAt: 'asc' },
  });
  const projectsByUser = {};
  for (const p of projects) (projectsByUser[p.userId] ||= []).push(p);

  const projectForUser = {};
  for (const profile of profiles) {
    const owned = projectsByUser[profile.userId] || [];
    const project = owned.find(p => normalize(p.businessName) === normalize(profile.businessName))
      || owned.find(p => namesMatch(p.businessName, profile.businessName));
    if (!project) {
      console.log(`  ! Profile "${profile.businessName}" (user ${profile.userId}) matches none of their projects, left unassigned`);
      continue;
    }
    projectForUser[profile.userId] = project;
    console.log(`  Profile "${profile.businessName}" -> project "${project.businessName}"`);
    if (APPLY) await prisma.businessProfile.update({ where: { id: profile.id }, data: { projectId: project.id } });
  }

  let assigned = 0;
  let skipped = 0;
  for (const sub of submissions) {
    const project = projectForUser[sub.userId];
    if (!project) {
      skipped++;
      continue;
    }
    const duplicate = await prisma.citationSubmission.findFirst({
      where: { projectId: project.id, directoryId: sub.directoryId },
      select: { id: true },
    });
    if (duplicate) {
      skipped++;
      continue;
    }
    assigned++;
    if (APPLY) await prisma.citationSubmission.update({ where: { id: sub.id }, data: { projectId: project.id } });
  }

  console.log(`Profiles: ${profiles.length} without project. Submissions: ${assigned} assigned, ${skipped} left unassigned (no matching project or duplicate).`);
}

async function main() {
  console.log(APPLY ? 'Applying citation migration...' : 'Dry run (pass --apply to write changes)...');
  await migrateIndexes();
  await migrateData();
  console.log('Done.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
