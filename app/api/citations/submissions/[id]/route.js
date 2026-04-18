import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

async function getSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Next.js >= 15 requires params to be awaited
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    const body = await request.json();
    const { status, listingUrl, notes } = body;

    const existing = await prisma.citationSubmission.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (listingUrl !== undefined) updateData.listingUrl = listingUrl;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await prisma.citationSubmission.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('[citation-submissions-id] PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
