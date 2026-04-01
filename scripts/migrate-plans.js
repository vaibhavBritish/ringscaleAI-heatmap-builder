import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migratePlans() {
  console.log("Starting plan name migration...")
  
  // 1. Convert 'trail' (lowercase) to 'Trial' (Capitalized)
  const trailResult = await prisma.user.updateMany({
    where: {
      plan: {
        in: ['trail', 'trial'] // cover both since 'trial' was likely used too
      }
    },
    data: {
      plan: 'Trial'
    }
  })
  console.log(`Updated ${trailResult.count} users from 'trail/trial' to 'Trial'`)

  // 2. Map old 'plan_pro' to 'pro' (or 'Pro' if we are following the new convention)
  // According to the user's recent edits, they kept 'pro', 'advance', 'pro_plus' lowercase in the mapping but 'Trial' uppercase.
  // Wait, let's look at their edits again.
  /*
    const names = {
      Trial: "Trial",
      advance: "Advance",
      pro: "Pro",
      pro_plus: "Pro Plus"
    }
  */
  // So the internal IDs are 'Trial', 'advance', 'pro', 'pro_plus'.

  const proResult = await prisma.user.updateMany({
    where: {
      plan: 'plan_pro'
    },
    data: {
      plan: 'pro'
    }
  })
  console.log(`Updated ${proResult.count} users from 'plan_pro' to 'pro'`)

  const liteResult = await prisma.user.updateMany({
    where: {
      plan: 'plan_lite'
    },
    data: {
      plan: 'Trial' // Mapping lite to Trial as it's the closest lower tier
    }
  })
  console.log(`Updated ${liteResult.count} users from 'plan_lite' to 'Trial'`)

  console.log("Migration complete.")
}

migratePlans()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
