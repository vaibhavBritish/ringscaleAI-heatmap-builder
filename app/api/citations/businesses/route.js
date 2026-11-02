import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getCitationProjects } from '@/lib/citation-access';

export const dynamic = 'force-dynamic';

// Citation progress summary for every business (project) the user can manage
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const projects = await getCitationProjects(session);
    const projectIds = projects.map(p => p.id);
    const ownerIds = [...new Set(projects.map(p => p.userId))];

    const [owners, profiles, submissions, totalDirectories] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: ownerIds } },
        select: { id: true, name: true, email: true },
      }),
      prisma.businessProfile.findMany({
        where: { projectId: { in: projectIds } },
        select: { projectId: true, businessName: true, city: true, state: true, website: true },
      }),
      prisma.citationSubmission.findMany({
        where: { projectId: { in: projectIds } },
        select: { projectId: true, status: true, backlinkFound: true },
      }),
      prisma.citationDirectory.count({ where: { NOT: { isActive: false } } }),
    ]);

    const ownerById = Object.fromEntries(owners.map(o => [o.id, o]));
    const profileByProject = Object.fromEntries(profiles.map(p => [p.projectId, p]));
    const statsByProject = {};
    for (const sub of submissions) {
      const stats = statsByProject[sub.projectId] ||= { inProgress: 0, submitted: 0, verified: 0, backlinks: 0 };
      if (sub.status === 'in_progress') stats.inProgress++;
      if (sub.status === 'submitted') stats.submitted++;
      if (sub.status === 'verified') stats.verified++;
      if (sub.backlinkFound) stats.backlinks++;
    }

    const businesses = projects.map(project => {
      const stats = statsByProject[project.id] || { inProgress: 0, submitted: 0, verified: 0, backlinks: 0 };
      const completed = stats.submitted + stats.verified;
      return {
        id: project.id,
        businessName: project.businessName,
        address: project.address,
        isOwn: project.userId === session.user.id,
        owner: ownerById[project.userId] || null,
        profile: profileByProject[project.id] || null,
        stats: {
          ...stats,
          completed,
          progress: totalDirectories ? Math.round((completed / totalDirectories) * 100) : 0,
        },
      };
    });

    return NextResponse.json({ businesses, totalDirectories });
  } catch (error) {
    console.error('[citation-businesses] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
