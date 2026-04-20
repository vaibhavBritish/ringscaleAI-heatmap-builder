import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

// Helper to login to external Review-Gen API
async function loginExternal() {
  const url = process.env.EXTERNAL_REVIEW_GEN_URL
  const email = process.env.EXTERNAL_REVIEW_GEN_EMAIL
  const password = process.env.EXTERNAL_REVIEW_GEN_PASSWORD

  const response = await fetch(`${url}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || 'External login failed')
  return data.access_token
}

// Helper to create client on external Review-Gen API
async function createExternalClient(token, payload) {
  const url = process.env.EXTERNAL_REVIEW_GEN_URL
  const response = await fetch(`${url}/api/clients`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || 'External client creation failed')
  return data
}

export async function POST(request) {
  try {
    // 1. Verify Admin Auth
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 })
    }

    const { 
      businessName, 
      industry, 
      description, 
      gmb_link, 
      brand_color = "#1E3A8A", 
      accent_color = "#EFF6FF",
      key_features = [],
      hero_image = "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80"
    } = await request.json()

    if (!businessName) {
      return NextResponse.json({ error: 'Business Name is required' }, { status: 400 })
    }

    // 2. Prepare payload for external API
    const slug = businessName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    const uniqueSlug = `${slug}-${Math.random().toString(36).substring(2, 6)}`
    
    const externalPayload = {
      slug: uniqueSlug,
      name: businessName,
      description: description || `Experience professional ${industry} services at ${businessName}.`,
      industry: industry || "Business",
      key_features: Array.isArray(key_features) ? key_features : key_features.split(',').map(f => f.trim()),
      gmb_link: gmb_link || "",
      brand_color,
      accent_color,
      hero_image
    }

    // 3. Call External API
    console.log(`[Marketing] Sycing with external API: ${uniqueSlug}`)
    const token = await loginExternal()
    const externalClient = await createExternalClient(token, externalPayload)

    // 4. Mirror data locally in Prisma (Failsafe)
    const projectData = {
      id: uuidv4(),
      userId: session.user.id,
      businessName,
      placeId: "external_sync",
      latitude: 0,
      longitude: 0,
      industry: externalPayload.industry,
      description: externalPayload.description,
      gmbLink: externalPayload.gmb_link,
      brandColor: externalPayload.brand_color,
      accentColor: externalPayload.accent_color,
      heroImage: externalPayload.hero_image,
      clientSlug: uniqueSlug,
      reviewPageUrl: `/review/${uniqueSlug}`,
      qrCodeUrl: `/q/${uniqueSlug}`,
      keyFeatures: externalPayload.key_features
    }

    try {
      await prisma.project.create({ data: projectData })
    } catch (prismaErr) {
      console.warn("Local DB Mirror failed, but external creation succeeded. Attempting direct fallback...")
      try {
        await prisma.$runCommandRaw({
          insert: "projects",
          documents: [{
            ...projectData,
            _id: { $oid: (await prisma.$queryRaw`SELECT ObjectId()`).toString() }, // Simplified ObjectId for Mongo bypass
            createdAt: new Date(),
            updatedAt: new Date()
          }]
        })
      } catch (f) {
        console.error("Local mirror hard failure:", f.message)
      }
    }

    return NextResponse.json({
      success: true,
      externalClient,
      reviewUrl: `/review/${uniqueSlug}`,
      qrUrl: `/q/${uniqueSlug}`
    })

  } catch (error) {
    console.error('External API Integration Error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate assets on external server', 
      details: error.message 
    }, { status: 500 })
  }
}
