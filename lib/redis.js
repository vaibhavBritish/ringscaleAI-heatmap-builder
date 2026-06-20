import Redis from 'ioredis'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

// Singleton pattern for Redis client in Next.js development
const globalForRedis = global

const createRedisInstance = () => {
  try {
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 10,
      retryStrategy(times) {
        if (times > 20) return null // Give it 20 retries (~10 seconds) to allow docker container to fully boot
        return Math.min(times * 500, 2000)
      },
      reconnectOnError(err) {
        const targetError = 'READONLY'
        if (err.message.includes(targetError)) return true
        return false
      }
    })

    client.on('error', (err) => {
      // Only log severe errors to keep dev logs clean
      if (err.code !== 'ENOTFOUND' && err.code !== 'ECONNREFUSED') {
        console.error('Redis Error:', err)
      }
    })

    return client
  } catch (error) {
    console.error('Failed to initialize Redis:', error)
    return null
  }
}

const redis = globalForRedis.redis || createRedisInstance()

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis
}

export default redis
