import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/seoos-auth';
import { fetchSerpRankings } from '@/lib/serp';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { projectId, businessUrl, keyword, location } = await request.json();
    if (!projectId || !businessUrl || !keyword) {
      return NextResponse.json({ error: 'projectId, businessUrl, and keyword are required' }, { status: 400 });
    }

    const data = await fetchSerpRankings(keyword, businessUrl, location);

    // Update or create ranking record
    const existing = await prisma.keywordRank.findFirst({
      where: { projectId, keyword }
    });

    if (existing) {
      await prisma.keywordRank.update({
        where: { id: existing.id },
        data: {
          rank: data.rank,
          bestRank: existing.bestRank ? (data.rank ? Math.min(existing.bestRank, data.rank) : existing.bestRank) : data.rank,
          url: data.url || existing.url,
          updatedAt: new Date(),
        }
      });
    } else {
      await prisma.keywordRank.create({
        data: {
          id: uuidv4(),
          projectId,
          keyword,
          rank: data.rank,
          bestRank: data.rank,
          url: data.url,
          location: location || 'United States',
        }
      });
    }

    return NextResponse.json({ success: true, rank: data.rank });
  } catch (error) {
    console.error('SERP Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const rankings = await prisma.keywordRank.findMany({
    where: { projectId },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ rankings });
}
