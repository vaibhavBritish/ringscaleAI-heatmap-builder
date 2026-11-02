import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { resolveCitationProject, getProjectIdParam, findCitationProfile } from '@/lib/citation-access';

async function getSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

export async function GET(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { project, error, status } = await resolveCitationProject(session, getProjectIdParam(request));
  if (error) return NextResponse.json({ error }, { status });

  try {
    const profile = await findCitationProfile(project.id);
    return NextResponse.json({ data: profile, project });
  } catch (error) {
    console.error('[citation-profile] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { project, error, status } = await resolveCitationProject(session, getProjectIdParam(request));
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { id, oid, userId, projectId, createdAt, updatedAt, ...body } = await request.json();

    const existing = await findCitationProfile(project.id);
    const profile = existing
      ? await prisma.businessProfile.update({ where: { id: existing.id }, data: body })
      : await prisma.businessProfile.create({
          data: { ...body, userId: project.userId, projectId: project.id },
        });

    return NextResponse.json({ data: profile });
  } catch (error) {
    console.error('[citation-profile] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Resets a business's citation data: its profile and every directory submission
export async function DELETE(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { project, error, status } = await resolveCitationProject(session, getProjectIdParam(request));
  if (error) return NextResponse.json({ error }, { status });

  try {
    const [profiles, submissions] = await prisma.$transaction([
      prisma.businessProfile.deleteMany({ where: { projectId: project.id } }),
      prisma.citationSubmission.deleteMany({ where: { projectId: project.id } }),
    ]);
    return NextResponse.json({ data: { profiles: profiles.count, submissions: submissions.count } });
  } catch (error) {
    console.error('[citation-profile] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
