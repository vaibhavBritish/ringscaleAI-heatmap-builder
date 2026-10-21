import { getGmbMongoClient } from '@/lib/gmb-connector-db'
import { ObjectId } from 'mongodb'

export async function GET(req, { params }) {
  const { id } = await params
  if (!id) {
    return new Response('Not found', { status: 404 })
  }

  try {
    const client = await getGmbMongoClient()
    const db = client.db('gmb-connector')

    let mediaDoc = null
    try {
      mediaDoc = await db.collection('LocalMedia').findOne({
        _id: new ObjectId(id)
      })
    } catch {}

    if (!mediaDoc) {
      mediaDoc = await db.collection('LocalMedia').findOne({
        _id: id
      })
    }

    if (mediaDoc && mediaDoc.data) {
      const buffer = Buffer.isBuffer(mediaDoc.data)
        ? mediaDoc.data
        : (mediaDoc.data.buffer ? Buffer.from(mediaDoc.data.buffer) : Buffer.from(mediaDoc.data))

      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': mediaDoc.mimeType || 'image/jpeg',
          'Cache-Control': 'public, max-age=604800, immutable'
        }
      })
    }

    // Fallback: proxy from connect.ringscale.ai
    try {
      const remoteRes = await fetch(`https://connect.ringscale.ai/api/media/${id}`, {
        cache: 'force-cache'
      })
      if (remoteRes.ok) {
        const contentType = remoteRes.headers.get('content-type') || 'image/jpeg'
        const arrayBuf = await remoteRes.arrayBuffer()
        return new Response(arrayBuf, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=604800, immutable'
          }
        })
      }
    } catch {}

    return new Response('Media not found', { status: 404 })
  } catch (err) {
    console.warn('[gmb-media] Error streaming media:', err.message)
    return new Response('Error loading media', { status: 500 })
  }
}
