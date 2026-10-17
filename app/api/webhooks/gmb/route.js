import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"

export const dynamic = "force-dynamic"

/**
 * Webhook handler for GMB connection
 * Handles:
 * 1. Automatic account creation by business name
 * 2. Sending login credentials to email
 * 3. Storing plain password in DB
 */
export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization") || request.headers.get("x-service-key") || request.headers.get("x-api-key")
    const internalSecret = process.env.RINGSCALE_INTERNAL_SECRET || process.env.SERVICE_SECRET_KEY || "ringscale_secret_2024"
    
    const isWebhookAuthorized = authHeader && (
      authHeader === `Bearer ${internalSecret}` || 
      authHeader === internalSecret ||
      authHeader === `Bearer ringscale_secret_2024` ||
      authHeader === "ringscale_secret_2024" ||
      authHeader === "Bearer 1c53ba2c8075e2c3314d3a72bf4f28adacae7bac725c70dd7b94933739b92fb57ab517d9abc82a5028d625af9e6857a9b8cd23c6eb6267e842b6b3022e7c6b69f74ccc5bc7b60477308b69ac35e7f406"
    )

    if (!isWebhookAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { 
      name, 
      email, 
      password, 
      role = "user", 
      plan = "trial", 
      credits, 
      businessName, 
      business_name,
      locationName,
      placeId, 
      place_id,
      address, 
      latitude, 
      longitude, 
      primaryType,
      primary_type
    } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const effectiveBusinessName = (businessName || business_name || locationName || '').trim()
    const effectivePlaceId = placeId || place_id || ''
    const effectiveAddress = address || ''
    const effectiveLatitude = latitude
    const effectiveLongitude = longitude
    const effectivePrimaryType = primaryType || primary_type || ''

    // Requirement: Account is created automatically by their business name
    const accountName = effectiveBusinessName || (name && name.trim()) || email.split('@')[0]

    // Auto-generate temporary password if not provided
    const rawPassword = (password && password.trim()) 
      ? password.trim() 
      : `RS_${Math.random().toString(36).substring(2, 7).toUpperCase()}!#${Math.floor(100 + Math.random() * 900)}`

    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    let isNewUser = false

    if (user) {
      // User exists: update name to business name if unset, and save plainPassword if missing
      const updateData = {}
      if (effectiveBusinessName && (!user.name || user.name === user.email.split('@')[0])) {
        updateData.name = effectiveBusinessName
      }
      if (!user.plainPassword && rawPassword) {
        updateData.plainPassword = rawPassword
      }
      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData
        })
      }
    } else {
      isNewUser = true
      const hashedPassword = await bcrypt.hash(rawPassword, 10)

      // Fetch dynamic plan credits
      const planSettings = await prisma.globalSetting.findUnique({
        where: { key: "plans" }
      })
      const config = planSettings?.value || {
        trial: { credits: 300 },
        advance: { credits: 1200 },
        pro: { credits: 2400 },
        pro_plus: { credits: 5000 }
      }

      const selectedPlan = (plan || 'trial').toLowerCase()
      const initialCredits = credits !== undefined ? parseInt(credits) : (config[selectedPlan]?.credits || 0)
      const trialEndsAt = selectedPlan === 'trial' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null

      user = await prisma.user.create({
        data: {
          id: uuidv4(),
          name: accountName, // Created by business name
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          plainPassword: rawPassword, // Stored in DB
          role: role || 'user',
          plan: selectedPlan,
          credits: initialCredits,
          ...(trialEndsAt && { trialEndsAt }),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Send login credentials to their email
      const { sendGMBWelcomeEmail } = await import('@/lib/mail')
      sendGMBWelcomeEmail(email, accountName, selectedPlan, initialCredits, rawPassword).catch(err => {
        console.error('Error sending GMB welcome credentials email:', err)
      })
    }

    // Attach projects / locations to user (supports multiple locations, e.g. 60 GMBs)
    const rawLocations = Array.isArray(body.locations) && body.locations.length > 0
      ? body.locations
      : (effectiveBusinessName ? [{
          businessName: effectiveBusinessName,
          placeId: effectivePlaceId,
          address: effectiveAddress,
          latitude: effectiveLatitude,
          longitude: effectiveLongitude,
          primaryType: effectivePrimaryType,
          keywords: body.keywords || []
        }] : [])

    let createdProjects = []

    for (const loc of rawLocations) {
      const locName = (loc.businessName || loc.locationName || effectiveBusinessName).trim()
      if (!locName) continue

      const locPlaceId = (loc.placeId || loc.place_id || loc.locationId || '').trim()
      const locAddress = (loc.address || '').trim()
      const locLat = parseFloat(loc.latitude) || 0
      const locLng = parseFloat(loc.longitude) || 0
      const locType = loc.primaryType || loc.primary_type || 'Business'

      let project = null
      if (locPlaceId) {
        project = await prisma.project.findFirst({
          where: { userId: user.id, placeId: locPlaceId }
        })
      }
      if (!project) {
        project = await prisma.project.findFirst({
          where: { 
            userId: user.id, 
            businessName: { equals: locName, mode: 'insensitive' }
          }
        })
      }

      if (!project) {
        project = await prisma.project.create({
          data: {
            id: uuidv4(),
            userId: user.id,
            businessName: locName,
            placeId: locPlaceId || `gmb_${uuidv4().substring(0, 8)}`,
            address: locAddress,
            latitude: locLat,
            longitude: locLng,
            primaryType: locType,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
      }

      createdProjects.push(project)

      // Save any keywords provided for this location
      const locKeywords = Array.isArray(loc.keywords) ? loc.keywords : (Array.isArray(body.keywords) ? body.keywords : [])
      for (const kw of locKeywords) {
        if (kw && typeof kw === 'string' && kw.trim()) {
          const trimmed = kw.trim()
          const existingKw = await prisma.keyword.findFirst({
            where: { projectId: project.id, keyword: trimmed }
          })
          if (!existingKw) {
            await prisma.keyword.create({
              data: {
                id: uuidv4(),
                projectId: project.id,
                keyword: trimmed,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            })
          }
        }
      }

      // Generate audit report for every business location
      const targetProjectId = project.id
      const isFirstProject = createdProjects.length === 1
      import('@/lib/audit-generator').then(async ({ generateAndStoreAuditReport }) => {
        try {
          const auditReport = await generateAndStoreAuditReport(targetProjectId)
          if (isNewUser && isFirstProject) {
            const { sendGMBAuditEmail } = await import('@/lib/mail')
            await sendGMBAuditEmail(email, accountName, auditReport)
          }
        } catch (err) {
          console.error(`Error generating audit for project ${targetProjectId} (${locName}):`, err)
        }
      }).catch(err => console.error('Failed to load audit generator:', err))
    }

    // Asynchronously perform full GMB multi-location & keywords sync from MongoDB
    import('@/lib/gmb-customer-sync').then(({ syncCustomerGMBBusinesses }) => {
      syncCustomerGMBBusinesses(user).catch(err => {
        console.error('Background GMB customer sync error in webhook:', err)
      })
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      message: "GMB Account processed successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plainPassword: user.plainPassword || rawPassword
      }
    })
  } catch (error) {
    console.error("GMB Webhook Error:", error)
    return NextResponse.json({ error: "Failed to process GMB webhook" }, { status: 500 })
  }
}
