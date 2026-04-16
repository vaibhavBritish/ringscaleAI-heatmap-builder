import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getGSCPerformance } from '@/lib/gsc'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req) {
  try {
    const { projectId, url } = await req.json()
    
    if (!projectId || !url) {
      return NextResponse.json({ error: 'Project ID and URL are required' }, { status: 400 })
    }

    // Attempt to fetch last 30 days of data from GSC
    const performanceData = await getGSCPerformance(url, 30)

    // Clear old data for the same project/period if needed (or just upsert)
    // For simplicity, we'll upsert based on date/projectId
    for (const row of performanceData) {
      const date = new Date(row.keys[0])
      
      await prisma.sEOPerformance.upsert({
        where: {
          projectId_date: {
            projectId,
            date,
          }
        },
        update: {
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
        },
        create: {
          id: uuidv4(),
          projectId,
          date,
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
        }
      })
    }

    return NextResponse.json({ success: true, count: performanceData.length })
  } catch (error) {
    console.error('GSC Sync Error:', error.message)
    return NextResponse.json({ error: 'Failed to sync GSC: ' + error.message }, { status: 500 })
  }
}
