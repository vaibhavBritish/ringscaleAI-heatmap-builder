import prisma from './prisma'
import redis from './redis'
import { isRealPlaceId } from './project-dedupe'

export function isDuplicateKeyError(err) {
  return err?.code === 'P2002' || /E11000|duplicate key/i.test(err?.message || '')
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

/**
 * Creates a project unless the owner already has one for this Google place.
 *
 * Callers do "find, then create", which isn't atomic: requests arriving together (GMB
 * sync + webhook, double clicks) could all miss the find and each create a copy. Here
 * the find is repeated while holding a short Redis lock for this owner + place, so only
 * one request creates and the others get that same project back.
 */
export async function createProjectOnce(data) {
  if (!data.userId || !isRealPlaceId(data.placeId) || !redis) {
    return prisma.project.create({ data })
  }

  const lockKey = `lock:project-create:${data.userId}:${data.placeId}`
  let locked = false
  for (let i = 0; i < 50 && !locked; i++) {
    try {
      locked = (await redis.set(lockKey, '1', 'EX', 30, 'NX')) === 'OK'
    } catch {
      break // Redis unavailable: fall through without the lock
    }
    if (!locked) await sleep(100)
  }

  try {
    const existing = await prisma.project.findFirst({ where: { userId: data.userId, placeId: data.placeId } })
    if (existing) return existing
    return await prisma.project.create({ data })
  } finally {
    if (locked) {
      try { await redis.del(lockKey) } catch {}
    }
  }
}
