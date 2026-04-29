import { NextResponse } from 'next/server';
import { getDB } from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const db = await getDB();

    // 1. Check NEW Dynamic QR Generator Collection
    const qrResult = await db.collection('qr_codes').findOneAndUpdate(
      { shortId: id, isActive: true },
      { $inc: { scans: 1 }, $set: { lastScannedAt: new Date() } },
      { returnDocument: 'after' }
    );

    const qrCode = qrResult;
    
    if (qrCode && qrCode.targetUrl) {
      return NextResponse.redirect(new URL(qrCode.targetUrl));
    }

    // 2. Check LEGACY Project Review Slugs
    const projectResult = await db.collection('projects').findOneAndUpdate(
      { clientSlug: id },
      { $inc: { scanCount: 1 } },
      { returnDocument: 'after' }
    );

    const project = projectResult;

    if (project && project.clientSlug) {
      return NextResponse.redirect(new URL(`/review/${project.clientSlug}`, request.url));
    }

    // 3. Fallback: Not Found
    console.warn(`QR Redirection: No match found for ID "${id}"`);
    return NextResponse.redirect(new URL('/', request.url));

  } catch (error) {
    console.error('QR Redirection Error:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
