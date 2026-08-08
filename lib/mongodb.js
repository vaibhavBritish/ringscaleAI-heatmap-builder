import { MongoClient } from 'mongodb'

const MONGO_URL = process.env.MONGO_URL
const DB_NAME = process.env.DB_NAME || 'local_rank_heatmap'

let client
// Cache holder differs by env so hot-reload in dev reuses one client, same
// as before — the fix here is what happens when a connection attempt fails.
const cache = process.env.NODE_ENV === 'development'
  ? (global._mongoCache ||= {})
  : {}

/**
 * Lazily connects and caches the promise, but — unlike a plain
 * `client.connect()` captured once at import — clears the cache on failure
 * so the *next* call retries instead of replaying the same rejected promise
 * forever. Without this, one slow/failed connect at container boot (e.g. a
 * DNS/TLS hiccup right after `docker compose up` recreates the container)
 * permanently breaks every DB-backed route until the process restarts.
 */
function getClientPromise() {
  if (!cache.promise) {
    if (!client) {
      client = new MongoClient(MONGO_URL, {
        connectTimeoutMS: 5000,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 30000,
      })
    }
    cache.promise = client.connect().catch(err => {
      console.error('MongoDB connection failed, will retry on next request:', err.message)
      cache.promise = null
      throw err
    })
  }
  return cache.promise
}

export async function getDB() {
  if (!MONGO_URL) {
    throw new Error('CRITICAL: MONGO_URL not found in environment. Please check your .env or Docker config.')
  }
  try {
    const client = await getClientPromise()
    return client.db(DB_NAME)
  } catch (err) {
    console.error('getDB Error:', err.message)
    throw new Error('Database connection failed. Please check IP Whitelist.')
  }
}
