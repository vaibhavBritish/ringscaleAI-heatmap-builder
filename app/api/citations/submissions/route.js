import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { resolveCitationProject, getProjectIdParam, upsertCitationSubmission } from '@/lib/citation-access';

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
    const submissions = await prisma.citationSubmission.findMany({
      where: { projectId: project.id },
    });

    // Fetch all directories and merge in JS as Prisma MongoDB doesn't support joins natively
    const directories = await prisma.citationDirectory.findMany();

    const data = submissions.map(sub => {
      const dir = directories.find(d => d.id === sub.directoryId);
      return { ...sub, directory: dir || null };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[citation-submissions] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { project, error, status } = await resolveCitationProject(session, getProjectIdParam(request));
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { directoryId, status: submissionStatus } = await request.json();

    if (!directoryId) {
      return NextResponse.json({ error: 'directoryId is required' }, { status: 400 });
    }

    const submission = await upsertCitationSubmission(project, directoryId, {
      status: submissionStatus || 'not_started'
    });

    return NextResponse.json({ data: submission });
  } catch (error) {
    console.error('[citation-submissions] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
