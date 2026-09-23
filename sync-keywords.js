const { PrismaClient } = require('@prisma/client');
const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting keyword sync...');
  
  const gmbUrl = process.env.GMB_CONNECTOR_DB_URL || "mongodb+srv://gmb-connector:pSPvm9sIU0x37mfG@cluster0.mbawxnc.mongodb.net/gmb-connector?retryWrites=true&w=majority";
  
  let mongoClient;
  try {
    mongoClient = new MongoClient(gmbUrl);
    await mongoClient.connect();
    const gmbDb = mongoClient.db('gmb-connector');
    
    // Get all projects
    const projects = await prisma.project.findMany();
    console.log(`Found ${projects.length} projects in Ringscale.`);
    
    let addedCount = 0;
    
    for (const project of projects) {
      if (!project.businessName) continue;
      
      // Find business in GMB
      // Using a regex for case-insensitive match, but escaping special characters
      const escapedName = project.businessName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const business = await gmbDb.collection('Business').findOne({ 
        businessName: { $regex: new RegExp(escapedName, 'i') } 
      });
      
      if (business) {
        const allKeywords = new Set(business.keywords || [])
        // Fetch locations for this business
        const locations = await gmbDb.collection('BusinessLocation').find({
          $or: [
            { businessId: business._id },
            { businessId: business._id.toString() }
          ]
        }).toArray()
        for (const loc of locations) {
          if (loc.keywords && Array.isArray(loc.keywords)) {
            loc.keywords.forEach(k => allKeywords.add(k))
          }
        }
        
        if (allKeywords.size > 0) {
          // Fetch existing keywords for this project
          const existingKeywords = await prisma.keyword.findMany({
            where: { projectId: project.id }
          });
          const existingKeywordSet = new Set(existingKeywords.map(k => k.keyword.toLowerCase()));
          
          for (const kw of Array.from(allKeywords)) {
            if (!existingKeywordSet.has(kw.toLowerCase())) {
              await prisma.keyword.create({
                data: {
                  id: uuidv4(),
                  projectId: project.id,
                  keyword: kw
                }
              });
              addedCount++;
              console.log(`Added keyword "${kw}" to project "${project.businessName}"`);
            }
          }
        }
      }
    }
    
    console.log(`Sync complete! Added ${addedCount} new keywords.`);
    
  } catch (err) {
    console.error('Error during sync:', err);
  } finally {
    if (mongoClient) await mongoClient.close();
    await prisma.$disconnect();
  }
}

main();
