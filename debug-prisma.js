import prisma from "./lib/prisma.js"

async function main() {
  console.log("Prisma keys:", Object.keys(prisma))
  try {
    const count = await prisma.user.count()
    console.log("User count works:", count)
    
    // Check if globalSetting exists
    if (prisma.globalSetting) {
      console.log("globalSetting exists mapping works")
    } else {
      console.log("globalSetting is UNDEFINED")
    }
  } catch (err) {
    console.error("Prisma check failed:", err)
  } finally {
    process.exit()
  }
}

main()
