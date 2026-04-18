import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const directories = await prisma.citationDirectory.findMany({
      where: { isActive: true },
      orderBy: [
        { domainAuthority: 'desc' },
        { name: 'asc' },
      ],
    });
    return NextResponse.json({ data: directories });
  } catch (error) {
    console.error('[citation-directories] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
