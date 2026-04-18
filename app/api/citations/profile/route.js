import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

async function getSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

export async function GET(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const profile = await prisma.businessProfile.findUnique({
      where: { userId: session.user.id },
    });
    return NextResponse.json({ data: profile });
  } catch (error) {
    console.error('[citation-profile] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    
    // We use findFirst/update/create or simple upsert. 
    // Since userId is @unique, upsert is perfectly safe.
    const profile = await prisma.businessProfile.upsert({
      where: { userId: session.user.id },
      update: body,
      create: { 
        ...body, 
        userId: session.user.id 
      },
    });
    
    return NextResponse.json({ data: profile });
  } catch (error) {
    console.error('[citation-profile] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
