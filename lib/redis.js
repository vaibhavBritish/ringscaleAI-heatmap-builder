import Redis from 'ioredis'

let redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

// If REDIS_URL mentions 'redis' as hostname, and we're not inside Docker (indicated by /etc/hosts common hostnames)
// ioredis handles the reconnect itself, but ENOTFOUND is common when running locally vs docker.
let redis = null

try {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null; // Stop retrying after 3 times if it's completely down
      return Math.min(times * 200, 2000)
    },
    // Prevent app from crashing if Redis is down
    reconnectOnError(err) {
      if (err.message.includes('ENOTFOUND')) return false; // Don't reconnect if hostname is just wrong
      return true
    }
  })

  redis.on('error', (err) => {
    // Only log essential errors, silence common 'ENOTFOUND' to keep logs clean when running locally
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      if (process.env.NODE_ENV === 'development') {
        // Just a subtle warning in dev if Redis is missing
        console.warn(`[Redis Notice] Could not connect to ${redisUrl}. Caching disabled.`)
      }
    } else {
      console.error('Redis Error:', err)
    }
  })

  redis.on('connect', () => {
    console.log('Successfully connected to Redis')
  })
} catch (error) {
  console.error('Failed to initialize Redis:', error)
}

export default redis
