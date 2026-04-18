import prisma from '../lib/prisma.js';

const directories = [
  { name: 'Hotfrog', submissionUrl: 'https://www.hotfrog.in', hasApi: false, requiresManual: true, supportsBacklink: true, domainAuthority: 52, country: 'India' },
  { name: 'Justdial', submissionUrl: 'https://www.justdial.com/add-business', hasApi: false, requiresManual: true, supportsBacklink: true, domainAuthority: 72, country: 'India' },
  { name: 'IndiaMART', submissionUrl: 'https://seller.indiamart.com', hasApi: false, requiresManual: true, supportsBacklink: true, domainAuthority: 74, country: 'India' },
  { name: 'Sulekha', submissionUrl: 'https://www.sulekha.com/list-your-business', hasApi: false, requiresManual: true, supportsBacklink: true, domainAuthority: 58, country: 'India' },
  { name: 'TradeIndia', submissionUrl: 'https://www.tradeindia.com', hasApi: false, requiresManual: true, supportsBacklink: true, domainAuthority: 55, country: 'India' },
  { name: 'Yellowpages India', submissionUrl: 'https://www.yellowpages.co.in', hasApi: false, requiresManual: true, supportsBacklink: true, domainAuthority: 48, country: 'India' },
  { name: 'IndiaBizClub', submissionUrl: 'https://www.indiabizclub.com', hasApi: false, requiresManual: true, supportsBacklink: true, domainAuthority: 38, country: 'India' },
  { name: 'Exporters India', submissionUrl: 'https://www.exportersindia.com', hasApi: false, requiresManual: true, supportsBacklink: false, domainAuthority: 41, country: 'India' },
  { name: 'Cylex India', submissionUrl: 'https://www.cylex.in', hasApi: false, requiresManual: true, supportsBacklink: true, domainAuthority: 45, country: 'India' },
  { name: 'Grotal', submissionUrl: 'https://www.grotal.com', hasApi: false, requiresManual: true, supportsBacklink: true, domainAuthority: 36, country: 'India' },
  { name: 'Bizify', submissionUrl: 'https://www.bizify.in', hasApi: false, requiresManual: true, supportsBacklink: true, domainAuthority: 30, country: 'India' },
  { name: 'Brownbook', submissionUrl: 'https://www.brownbook.net', hasApi: false, requiresManual: true, supportsBacklink: true, domainAuthority: 47, country: 'global' },
  { name: 'Yelp', submissionUrl: 'https://biz.yelp.com/claim', hasApi: false, requiresManual: true, supportsBacklink: true, domainAuthority: 93, country: 'global' },
];

async function main() {
  console.log('Seeding directories...');
  let created = 0;
  let updated = 0;

  // Clean up any directories that are no longer in our simple list
  const activeNames = directories.map(d => d.name);
  const deleteResult = await prisma.citationDirectory.deleteMany({
    where: { 
      name: { notIn: activeNames } 
    }
  });
  console.log(`Deleted ${deleteResult.count} standard/complex directories from DB.`);

  for (const dir of directories) {
    const existing = await prisma.citationDirectory.findFirst({
      where: { name: dir.name }
    });

    if (existing) {
      await prisma.citationDirectory.update({
        where: { id: existing.id },
        data: dir
      });
      updated++;
    } else {
      await prisma.citationDirectory.create({
        data: dir
      });
      created++;
    }
  }

  console.log(`Seeding complete. Created: ${created}, Updated: ${updated}. Total directories: ${directories.length}`);
}

main()
  .catch((e) => {
    console.error('Error seeding directories:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
