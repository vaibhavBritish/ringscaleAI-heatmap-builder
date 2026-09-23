const { MongoClient } = require('mongodb');

async function main() {
  const client = new MongoClient("mongodb+srv://gmb-connector:pSPvm9sIU0x37mfG@cluster0.mbawxnc.mongodb.net/gmb-connector?retryWrites=true&w=majority");
  await client.connect();
  const db = client.db('gmb-connector');
  const businesses = await db.collection('Business').find({}, { projection: { businessName: 1, keywords: 1 } }).toArray();
  console.log("Businesses:", JSON.stringify(businesses, null, 2));
  
  const locations = await db.collection('BusinessLocation').find({}, { projection: { businessId: 1, locationName: 1, keywords: 1 } }).toArray();
  console.log("Locations:", JSON.stringify(locations, null, 2));

  await client.close();
}
main().catch(console.error);
