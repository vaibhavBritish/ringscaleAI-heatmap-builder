import { NextResponse } from 'next/server';
import { getDB } from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const REVIEWGEN_API_BASE = 'https://api.review-gen.ringscaleai.com/api';
const REVIEWGEN_ADMIN_KEY = process.env.REVIEWGEN_ADMIN_KEY;

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
    const assets = await db.collection('review_assets')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(assets);
  } catch (error) {
    console.error('Proxy GET Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error during local data retrieval' },
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

    // 1. External Broadcast
    const response = await fetch(`${REVIEWGEN_API_BASE}/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': REVIEWGEN_ADMIN_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Failed to generate review page' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // 2. Local Sync
    try {
      const db = await getDB();
      const assetData = {
        slug: body.slug,
        name: body.name,
        description: body.description,
        industry: body.industry,
        keyFeatures: body.key_features,
        gmbLink: body.gmb_link,
        brandColor: body.brand_color,
        accentColor: body.accent_color,
        heroImage: body.hero_image,
        createdAt: new Date(),
        updatedAt: new Date(),
        externalId: data._id || data.id
      };

      await db.collection('review_assets').updateOne(
        { slug: body.slug },
        { $set: assetData },
        { upsert: true }
      );
    } catch (dbError) {
      console.error('Local DB Sync Error (non-blocking):', dbError);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy POST Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error during API proxying' },
      { status: 500 }
    );
  }
}

// Full Sync Method
export async function PUT() {
  try {
    if (!await checkAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const response = await fetch(`${REVIEWGEN_API_BASE}/clients`, {
      headers: { 'X-Admin-Key': REVIEWGEN_ADMIN_KEY },
    });
    if (!response.ok) throw new Error('Failed to fetch from external server');

    const externalClients = await response.json();
    const clients = Array.isArray(externalClients) ? externalClients : (externalClients.clients || []);

    const db = await getDB();
    const ops = clients.map(client => ({
      updateOne: {
        filter: { slug: client.slug },
        update: {
          $set: {
            ...client,
            updatedAt: new Date(),
            keyFeatures: client.key_features || client.keyFeatures,
            gmbLink: client.gmb_link || client.gmbLink,
            brandColor: client.brand_color || client.brandColor,
            accentColor: client.accent_color || client.accentColor,
            heroImage: client.hero_image || client.heroImage,
          }
        },
        upsert: true
      }
    }));

    if (ops.length > 0) {
      await db.collection('review_assets').bulkWrite(ops);
    }

    return NextResponse.json({ success: true, count: ops.length });
  } catch (error) {
    console.error('Proxy PUT Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
