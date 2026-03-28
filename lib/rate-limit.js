import redis from './redis';

/**
 * Redis-based Rate Limiter for Next.js API Routes
 * 
 * @param {string} identifier - A unique ID for the user (e.g., user.id or IP)
 * @param {string} key - A key for the specific action (e.g., 'create-project')
 * @param {number} limit - Max requests allowed in the window
 * @param {number} windowSeconds - The time window in seconds
 * @returns {Promise<{ success: boolean, remaining: number, reset: number }>}
 */
export async function rateLimit(identifier, key, limit = 5, windowSeconds = 60) {
  if (!redis) {
    // Fallback if Redis is down - allow but log
    console.warn('[Rate Limit] Redis disconnected, skipping check');
    return { success: true, remaining: limit, reset: Date.now() + (windowSeconds * 1000) };
  }

  const redisKey = `ratelimit:${key}:${identifier}`;
  
  try {
    const requests = await redis.incr(redisKey);
    
    if (requests === 1) {
      await redis.expire(redisKey, windowSeconds);
    }
    
    const remaining = Math.max(0, limit - requests);
    const reset = Date.now() + (await redis.ttl(redisKey) * 1000);

    return {
      success: requests <= limit,
      remaining,
      reset
    };
  } catch (error) {
    console.error('[Rate Limit] Error:', error);
    // On error, we fail open (allow request) to ensure user experience isn't broken
    return { success: true, remaining: 1, reset: Date.now() };
  }
}
