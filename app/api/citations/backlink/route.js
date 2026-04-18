import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import * as cheerio from 'cheerio';

async function getSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { submissionId, listingUrl } = await request.json();
    
    if (!submissionId || !listingUrl) {
      return NextResponse.json({ error: 'Missing submissionId or listingUrl' }, { status: 400 });
    }

    const submission = await prisma.citationSubmission.findUnique({
      where: { id: submissionId }
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (submission.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.businessProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!profile || !profile.website) {
      return NextResponse.json({ error: 'No user website configured in profile' }, { status: 400 });
    }

    const targetWebsite = profile.website;

    let html;
    try {
      const response = await fetch(listingUrl);
      if (!response.ok) {
        throw new Error(`HTTP fetch error: ${response.status}`);
      }
      html = await response.text();
    } catch (err) {
       console.error('Failed to fetch listingUrl:', err);
       return NextResponse.json({ error: 'Could not fetch listing URL' }, { status: 400 });
    }

    const $ = cheerio.load(html);
    let backlinkFound = false;
    let linkType = null;

    const stripProtocolAndWww = (url) => {
      if (!url) return '';
      return url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0];
    };

    const targetDomain = stripProtocolAndWww(targetWebsite);

    $('a').each((i, el) => {
      const href = $(el).attr('href') || '';
      
      // We check if the href includes the target domain anywhere,
      // to account for redirect URLs like /out?url=https%3A%2F%2Ftarget.com
      if (targetDomain && href.toLowerCase().includes(targetDomain.toLowerCase())) {
        backlinkFound = true;
        const rel = $(el).attr('rel') || '';
        
        if (rel.toLowerCase().includes('nofollow')) {
           // If we haven't found a dofollow yet, register it as nofollow
           if (linkType !== 'dofollow') {
             linkType = 'nofollow';
           }
        } else {
           linkType = 'dofollow';
        }
      }
    });

    await prisma.citationSubmission.update({
      where: { id: submissionId },
      data: {
        backlinkFound,
        linkType,
        listingUrl,
        lastCheckedAt: new Date()
      }
    });

    return NextResponse.json({ data: { backlinkFound, linkType } });
  } catch (error) {
    console.error('[citation-backlink] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
