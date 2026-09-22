import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin' || session?.user?.role === 'superadmin';
}

export async function POST() {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const projects = await prisma.project.findMany();
    let addedCount = 0;
    
    // Attempt HTTP Fetch First
    const gmbApiUrl = process.env.NEXT_PUBLIC_BASE_URL?.includes('connect.ringscale.ai') 
      ? 'https://connect.ringscale.ai/api/keywords'
      : (process.env.GMB_API_URL || 'https://connect.ringscale.ai/api/keywords');

    try {
      const res = await fetch(gmbApiUrl);
      if (res.ok) {
        const businesses = await res.json();
        const businessMap = new Map();
        for (const b of businesses) {
          businessMap.set(b.businessName.toLowerCase(), b);
        }

        for (const project of projects) {
          if (!project.businessName) continue;
          
          const business = businessMap.get(project.businessName.toLowerCase());
          
          if (business && business.keywords && Array.isArray(business.keywords)) {
            const existingKeywords = await prisma.keyword.findMany({
              where: { projectId: project.id }
            });
            const existingKeywordSet = new Set(existingKeywords.map(k => k.keyword.toLowerCase()));
            
            for (const kw of business.keywords) {
              if (!existingKeywordSet.has(kw.toLowerCase())) {
                await prisma.keyword.create({
                  data: {
                    id: uuidv4(),
                    projectId: project.id,
                    keyword: kw
                  }
                });
                addedCount++;
              }
            }
          }
        }
        return NextResponse.json({ success: true, addedCount, method: 'http' });
      }
    } catch (httpErr) {
      console.warn('HTTP Fetch failed, trying direct MongoDB connection...', httpErr.message);
    }

    // Fallback: Direct MongoDB Connection
    let mongoClient;
    try {
      const gmbUrl = process.env.GMB_CONNECTOR_DB_URL || "mongodb+srv://gmb-connector:pSPvm9sIU0x37mfG@cluster0.mbawxnc.mongodb.net/gmb-connector?retryWrites=true&w=majority";
      mongoClient = new MongoClient(gmbUrl);
      await mongoClient.connect();
      const gmbDb = mongoClient.db('gmb-connector');
      
      for (const project of projects) {
        if (!project.businessName) continue;
        
        const escapedName = project.businessName.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
        const business = await gmbDb.collection('Business').findOne({ 
          businessName: { $regex: new RegExp(`^${escapedName}$`, 'i') } 
        });
        
        if (business && business.keywords && Array.isArray(business.keywords)) {
          const existingKeywords = await prisma.keyword.findMany({
            where: { projectId: project.id }
          });
          const existingKeywordSet = new Set(existingKeywords.map(k => k.keyword.toLowerCase()));
          
          for (const kw of business.keywords) {
            if (!existingKeywordSet.has(kw.toLowerCase())) {
              await prisma.keyword.create({
                data: {
                  id: uuidv4(),
                  projectId: project.id,
                  keyword: kw
                }
              });
              addedCount++;
            }
          }
        }
      }
      return NextResponse.json({ success: true, addedCount, method: 'mongodb' });
    } finally {
      if (mongoClient) await mongoClient.close();
    }
  } catch (error) {
    console.error('Error syncing keywords:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
