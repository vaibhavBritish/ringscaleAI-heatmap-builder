
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSchema() {
  try {
    const project = await prisma.project.findFirst();
    console.log("Database Connection: SUCCESS");
    console.log("Project Fields Found:");
    console.log(Object.keys(project || {}));
    
    // Check for my new fields
    const requiredFields = ['reviewPageUrl', 'qrCodeUrl', 'clientSlug'];
    const missing = requiredFields.filter(f => !project || project[f] === undefined);
    
    if (missing.length > 0 && project) {
      console.error("\nCRITICAL ERROR: The following columns are MISSING from your database table 'Project':");
      console.error(missing.join(', '));
      console.error("\nPlease run: npx prisma db push");
    } else if (!project) {
      console.log("No projects found to check fields.");
    } else {
      console.log("\nAll necessary columns exist in the database.");
    }
  } catch (err) {
    console.error("Database Connection Check FAILED:");
    console.error(err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
