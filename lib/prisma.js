import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

const prisma = globalForPrisma.prisma ?? new PrismaClient()

// Force refresh for new models (GlobalSetting)
// timestamp: 2026-03-31T07:27:00Z
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
