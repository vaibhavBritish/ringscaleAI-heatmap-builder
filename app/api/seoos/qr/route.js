import { NextResponse } from 'next/server';
import { getDB } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin';
}

export async function GET() {
  try {
    if (!await checkAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const db = await getDB();
    const qrCodes = await db.collection('qr_codes')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(qrCodes);
  } catch (error) {
    console.error('QR GET Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    if (!await checkAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const body = await request.json();
    const { name, targetUrl } = body;

    if (!name || !targetUrl) {
      return NextResponse.json(
        { error: 'Name and Target URL are required' },
        { status: 400 }
      );
    }

    const db = await getDB();
    
    // Generate a unique shortId
    const shortId = uuidv4().split('-')[0]; // Simple 8-char short ID

    const qrData = {
      name,
      targetUrl,
      shortId,
      scans: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('qr_codes').insertOne(qrData);

    return NextResponse.json({ 
      success: true, 
      id: result.insertedId,
      shortId,
      targetUrl 
    });
  } catch (error) {
    console.error('QR POST Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
