import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkPlans() {
  const users = await prisma.user.findMany({
    select: { plan: true }
  })
  
  const planCounts = {}
  users.forEach(u => {
    planCounts[u.plan] = (planCounts[u.plan] || 0) + 1
  })
  
  //console.log("Current plans in DB:", JSON.stringify(planCounts, null, 2))
}

checkPlans()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
