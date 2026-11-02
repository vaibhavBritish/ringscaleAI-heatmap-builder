import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { fetchGmbKeywordsForProject } from '@/lib/gmb-connector-db';
import { syncProjectKeywords } from '@/lib/keyword-sync';

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin' || session?.user?.role === 'superadmin';
}

// Mirrors every connected project's keywords from GMB Connector (adds new, removes deleted)
export async function POST() {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const projects = await prisma.project.findMany();
    let addedCount = 0;
    let removedCount = 0;
    let syncedProjects = 0;

    for (const project of projects) {
      if (!project.businessName) continue;

      const gmbKeywords = await fetchGmbKeywordsForProject({
        businessName: project.businessName,
        placeId: project.placeId,
        address: project.address || ''
      });
      if (!gmbKeywords) continue;

      const { added, removed } = await syncProjectKeywords(project.id, gmbKeywords);
      addedCount += added;
      removedCount += removed;
      syncedProjects++;
    }

    return NextResponse.json({ success: true, addedCount, removedCount, syncedProjects });
  } catch (error) {
    console.error('Error syncing keywords:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
