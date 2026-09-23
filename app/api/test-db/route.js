import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function GET() {
  try {
    const client = new MongoClient(process.env.GMB_CONNECTOR_DB_URL || "mongodb+srv://gmb-connector:pSPvm9sIU0x37mfG@cluster0.mbawxnc.mongodb.net/gmb-connector?retryWrites=true&w=majority")
    await client.connect()
    const db = client.db('gmb-connector')
    const biz = await db.collection('Business').findOne({ businessName: /safetrader/i })
    let locs = [];
    if (biz) {
      locs = await db.collection('BusinessLocation').find({ businessId: biz._id }).toArray()
      if (locs.length === 0) {
        locs = await db.collection('BusinessLocation').find({ businessId: biz._id.toString() }).toArray()
      }
    }
    await client.close();
    return NextResponse.json({ biz, locs });
  } catch (err) {
    return NextResponse.json({ error: err.message });
  }
}
