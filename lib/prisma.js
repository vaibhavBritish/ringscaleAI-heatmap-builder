import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

const prisma = globalForPrisma.prisma ?? new PrismaClient()

// Force refresh for new models (GlobalSetting, suggestedKeywords)
// timestamp: 2026-04-14T11:08:00Z
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = undefined // Nuke old instance
  globalForPrisma.prisma = prisma
}

export default prisma
