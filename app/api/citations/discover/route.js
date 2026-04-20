import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import * as cheerio from 'cheerio';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { searchGoogleResults } from '@/lib/serp';

async function getSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

function toHost(input) {
  if (!input) return '';
  try {
    const normalized = input.startsWith('http') ? input : `https://${input}`;
    return new URL(normalized).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return '';
  }
}

function getRootDomain(host) {
  const normalized = (host || '').toLowerCase();
  const parts = normalized.split('.').filter(Boolean);
  if (parts.length <= 2) return normalized;
  return parts.slice(-2).join('.');
}

function normalizeText(input) {
  return (input || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePhone(input) {
  return (input || '').replace(/\D/g, '');
}

function lastDigits(phone, count = 8) {
  const digits = normalizePhone(phone);
  if (!digits) return '';
  return digits.slice(-Math.min(count, digits.length));
}

function significantNameTokens(name) {
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'pvt', 'ltd', 'llc', 'inc', 'co', 'company', 'services',
    'service', 'private', 'limited', 'india', 'global',
  ]);
  return normalizeText(name)
    .split(' ')
    .filter((t) => t.length >= 3 && !stopWords.has(t));
}

function candidateSignalsFromSerp(profile, item, websiteHost, phoneTail) {
  const text = normalizeText(`${item?.title || ''} ${item?.snippet || ''}`);
  const link = (item?.link || '').toLowerCase();
  const city = normalizeText(profile?.city);
  const state = normalizeText(profile?.state);
  const nameTokens = significantNameTokens(profile?.businessName || '');
  const tokenHits = nameTokens.filter((t) => text.includes(t)).length;
  const tokenCoverage = nameTokens.length ? tokenHits / nameTokens.length : 0;

  // Keep this slightly permissive so we can score/rank candidates instead of dropping early.
  const hasName = nameTokens.length > 0 && tokenHits >= Math.max(1, Math.ceil(nameTokens.length * 0.45));
  const hasStrongName = nameTokens.length > 0 && tokenHits >= Math.max(2, Math.ceil(nameTokens.length * 0.6));
  const hasPhone = Boolean(phoneTail) && normalizePhone(`${item?.title || ''} ${item?.snippet || ''}`).includes(phoneTail);
  const hasWebsite = Boolean(websiteHost) && (link.includes(websiteHost) || text.includes(websiteHost));
  const hasLocation =
    (Boolean(city) && text.includes(city)) ||
    (Boolean(state) && text.includes(state)) ||
    (Boolean(city) && Boolean(state) && text.includes(`${city} ${state}`));

  const position = Number(item?.position || 99);

  return { hasName, hasStrongName, hasPhone, hasWebsite, hasLocation, tokenHits, tokenCoverage, position };
}

async function fetchPageEvidence(url, websiteHost) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; CitationDiscoveryBot/1.0)',
      Accept: 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const plainText = normalizeText($('body').text());
  const relTypes = [];
  let backlinkFound = false;
  let linkType = null;

  $('a').each((_, el) => {
    const href = ($(el).attr('href') || '').toLowerCase();
    if (!websiteHost || !href.includes(websiteHost)) return;

    backlinkFound = true;
    const rel = (($(el).attr('rel') || '') + '').toLowerCase();
    relTypes.push(rel);
    if (rel.includes('nofollow')) {
      if (linkType !== 'dofollow') linkType = 'nofollow';
    } else {
      linkType = 'dofollow';
    }
  });

  return { plainText, backlinkFound, linkType, relTypes };
}

function isStrongBusinessMatch(profile, evidence) {
  const normalizedName = normalizeText(profile.businessName);
  const nameTokens = significantNameTokens(profile.businessName);
  const normalizedCity = normalizeText(profile.city);
  const normalizedState = normalizeText(profile.state);
  const phoneTail = lastDigits(profile.phone, 8);

  const hasExactName = Boolean(normalizedName) && evidence.plainText.includes(normalizedName);
  const tokenHits = nameTokens.filter((t) => evidence.plainText.includes(t)).length;
  const hasTokenName = nameTokens.length > 0 && tokenHits >= Math.max(2, Math.ceil(nameTokens.length * 0.5));
  const hasName = hasExactName || hasTokenName;
  const hasPhone = Boolean(phoneTail) && normalizePhone(evidence.plainText).includes(phoneTail);
  const hasLocation =
    Boolean(normalizedCity) &&
    Boolean(normalizedState) &&
    evidence.plainText.includes(normalizedCity) &&
    evidence.plainText.includes(normalizedState);

  // Confidence score to balance precision and recall.
  let score = 0;
  if (hasExactName) score += 45;
  else if (hasTokenName) score += 28;
  if (hasPhone) score += 35;
  if (evidence.backlinkFound) score += 25;
  if (hasLocation) score += 12;

  // Strong acceptance or medium acceptance with a second corroborating signal.
  const strictPass = score >= 60 || (hasName && hasPhone) || (hasName && evidence.backlinkFound);

  return {
    strictPass,
    score,
    hasName,
    hasExactName,
    hasTokenName,
    tokenHits,
    hasPhone,
    hasLocation,
  };
}

function isSerpQuotaOrRateLimitError(error) {
  if (!error) return false;
  if (error?.name === 'SerpApiError' && error?.status === 429) return true;
  const msg = (error?.providerMessage || error?.message || '').toLowerCase();
  return error?.status === 429 || msg.includes('too many requests') || msg.includes('run out of searches');
}

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    if (!process.env.SERPAPI_API_KEY) {
      return NextResponse.json({ error: 'SERPAPI_API_KEY is missing' }, { status: 400 });
    }

    const profile = await prisma.businessProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile?.businessName || !profile?.website) {
      return NextResponse.json(
        { error: 'Business profile must include businessName and website' },
        { status: 400 }
      );
    }

    const directories = await prisma.citationDirectory.findMany({
      where: { NOT: { isActive: false } },
      orderBy: [{ domainAuthority: 'desc' }, { name: 'asc' }],
    });

    if (!directories.length) {
      return NextResponse.json({ data: { updatedSubmissions: [], discovered: 0, scanned: 0 } });
    }

    const websiteHost = toHost(profile.website);
    const phoneTail = lastDigits(profile.phone, 8);

    const updates = [];
    const diagnostics = [];
    let possibleMatches = 0;

    for (const dir of directories) {
      const directoryHost = toHost(dir.submissionUrl);
      if (!directoryHost) continue;
      const directoryRootDomain = getRootDomain(directoryHost);

      const queries = [
        [
          `site:${directoryRootDomain}`,
          `"${profile.businessName}"`,
          profile.city ? `"${profile.city}"` : null,
          websiteHost ? `"${websiteHost}"` : null,
        ].filter(Boolean).join(' '),
        [
          `site:${directoryRootDomain}`,
          `"${profile.businessName}"`,
          phoneTail ? `"${phoneTail}"` : null,
        ].filter(Boolean).join(' '),
        [
          `site:${directoryRootDomain}`,
          profile.businessName,
          profile.city || null,
        ].filter(Boolean).join(' '),
      ];

      const resultMap = new Map();
      for (const q of queries) {
        try {
          const results = await searchGoogleResults(q, {
            location: profile.country || 'India',
            gl: (profile.country || '').toLowerCase() === 'india' ? 'in' : 'us',
            hl: 'en',
            num: 20,
          });
          results.forEach((r) => {
            if (r?.link && !resultMap.has(r.link)) resultMap.set(r.link, r);
          });
        } catch (error) {
          if (isSerpQuotaOrRateLimitError(error)) {
            return NextResponse.json(
              {
                error: 'Auto-discovery paused: SerpApi quota exhausted or rate-limited. Please top up/search credits and retry.',
                provider: 'serpapi',
                code: 'SERPAPI_QUOTA_EXCEEDED',
                detail: error?.providerMessage || error?.message || null,
              },
              { status: 429 }
            );
          }
          throw error;
        }
      }
      const results = Array.from(resultMap.values());

      let accepted = null;
      const inspected = [];

      for (const item of results) {
        const candidateUrl = item?.link;
        if (!candidateUrl) continue;

        const candidateHost = toHost(candidateUrl);
        if (!candidateHost.includes(directoryRootDomain)) continue;

        const serpSignals = candidateSignalsFromSerp(profile, item, websiteHost, phoneTail);
        let serpScore = 0;
        if (serpSignals.hasStrongName) serpScore += 34;
        else if (serpSignals.hasName) serpScore += 22;
        if (serpSignals.hasPhone) serpScore += 30;
        if (serpSignals.hasWebsite) serpScore += 26;
        if (serpSignals.hasLocation) serpScore += 10;
        if (serpSignals.position <= 3) serpScore += 8;
        else if (serpSignals.position <= 10) serpScore += 4;

        const metaStrongMatch =
          serpScore >= 52 ||
          (serpSignals.hasStrongName && (serpSignals.hasPhone || serpSignals.hasWebsite || serpSignals.hasLocation)) ||
          (serpSignals.hasName && serpSignals.hasPhone && serpSignals.position <= 10);

        const metaMediumMatch =
          serpScore >= 40 ||
          (serpSignals.hasName && (serpSignals.hasPhone || serpSignals.hasWebsite));

        // Skip only if no business name signal at all.
        if (!serpSignals.hasName && !serpSignals.hasPhone && !serpSignals.hasWebsite) {
          inspected.push({
            url: candidateUrl,
            title: item.title || null,
            strictPass: false,
            hasName: false,
            hasPhone: serpSignals.hasPhone,
            hasWebsite: serpSignals.hasWebsite,
            hasLocation: serpSignals.hasLocation,
            serpScore,
            source: 'serp-meta',
          });
          continue;
        }

        if (metaStrongMatch || metaMediumMatch) possibleMatches++;

        try {
          const evidence = await fetchPageEvidence(candidateUrl, websiteHost);
          const match = isStrongBusinessMatch(profile, evidence);
          const strictPass = match.strictPass || (metaStrongMatch && match.hasName);

          inspected.push({
            url: candidateUrl,
            title: item.title || null,
            strictPass,
            serpScore,
            metaStrongMatch,
            metaMediumMatch,
            ...match,
            source: 'serp+page',
          });

          if (strictPass) {
            accepted = {
              directoryId: dir.id,
              listingUrl: candidateUrl,
              backlinkFound: evidence.backlinkFound,
              linkType: evidence.linkType,
            };
            break;
          }
        } catch {
          // If target page blocks scraping, accept with SERP confidence.
          if (metaStrongMatch || metaMediumMatch) {
            accepted = {
              directoryId: dir.id,
              listingUrl: candidateUrl,
              backlinkFound: null,
              linkType: null,
            };
            inspected.push({
              url: candidateUrl,
              title: item.title || null,
              strictPass: true,
              hasName: serpSignals.hasName,
              hasPhone: serpSignals.hasPhone,
              hasWebsite: serpSignals.hasWebsite,
              hasLocation: serpSignals.hasLocation,
              serpScore,
              metaStrongMatch,
              metaMediumMatch,
              source: 'serp-meta-fallback',
            });
            break;
          }

          inspected.push({
            url: candidateUrl,
            title: item.title || null,
            strictPass: false,
            hasName: serpSignals.hasName,
            hasPhone: serpSignals.hasPhone,
            hasWebsite: serpSignals.hasWebsite,
            hasLocation: serpSignals.hasLocation,
            serpScore,
            source: 'fetch-failed',
          });
        }
      }

      diagnostics.push({
        directoryId: dir.id,
        directoryName: dir.name,
        scanned: inspected.length,
        acceptedUrl: accepted?.listingUrl || null,
      });

      if (accepted) updates.push(accepted);
    }

    const updatedSubmissions = [];
    for (const candidate of updates) {
      const submission = await prisma.citationSubmission.upsert({
        where: {
          userId_directoryId: {
            userId: session.user.id,
            directoryId: candidate.directoryId,
          },
        },
        update: {
          listingUrl: candidate.listingUrl,
          backlinkFound: candidate.backlinkFound,
          linkType: candidate.linkType,
          lastCheckedAt: new Date(),
        },
        create: {
          userId: session.user.id,
          directoryId: candidate.directoryId,
          status: 'not_started',
          listingUrl: candidate.listingUrl,
          backlinkFound: candidate.backlinkFound,
          linkType: candidate.linkType,
          lastCheckedAt: new Date(),
        },
      });
      updatedSubmissions.push(submission);
    }

    return NextResponse.json({
      data: {
        scanned: directories.length,
        discovered: updatedSubmissions.length,
        possibleMatches,
        updatedSubmissions,
        diagnostics,
      },
    });
  } catch (error) {
    console.error('[citation-discover] POST error:', error?.message || error);

    if (isSerpQuotaOrRateLimitError(error)) {
      return NextResponse.json(
        {
          error: 'Auto-discovery paused: SerpApi quota exhausted or rate-limited. Please top up/search credits and retry.',
          provider: 'serpapi',
          code: 'SERPAPI_QUOTA_EXCEEDED',
          detail: error?.providerMessage || error?.message || null,
        },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
