import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"

export const dynamic = "force-dynamic"

// Middleware to check if user is admin
async function checkAdmin() {
    const session = await getServerSession(authOptions)
    if (!session || !['superadmin', 'admin'].includes(session.user.role)) {
        return false
    }
    return true
}

export async function GET(request) {
    if (!await checkAdmin()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "10")
        const search = searchParams.get("search") || ""
        const skip = (page - 1) * limit

        const where = {
            role: 'user',
            ...(search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { company: { name: { contains: search, mode: 'insensitive' } } }
                ]
            } : {})
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where: where,
                select: {
                    oid: true,
                    id: true,
                    name: true,
                    email: true,
                    plainPassword: true,
                    phone: true,
                    plan: true,
                    credits: true,
                    role: true,
                    trialEndsAt: true,
                    planStartedAt: true,
                    planEndsAt: true,
                    createdAt: true,
                    company: {
                        select: {
                            name: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip: skip,
                take: limit
            }),
            prisma.user.count({ where: where })
        ])

        // Fetch projects and keywords for these users to show aggregate info
        const userIds = users.reduce((acc, u) => {
            acc.push(u.id)
            if (u.oid) acc.push(u.oid)
            return acc
        }, [])

        const projects = await prisma.project.findMany({
            where: { userId: { in: userIds } },
            select: { id: true, oid: true, userId: true, businessName: true }
        })

        const allProjectIds = [
            ...projects.map(p => p.id),
            ...projects.map(p => p.oid).filter(Boolean)
        ]

        const [keywords, scanCounts] = await Promise.all([
            prisma.keyword.findMany({
                where: { projectId: { in: allProjectIds } },
                select: { id: true, keyword: true, projectId: true }
            }),
            prisma.scanJob.groupBy({
                by: ['keywordId'],
                _count: {
                    _all: true
                },
                where: {
                    projectId: { in: allProjectIds }
                }
            })
        ])

        // Map keywords to users
        const usersWithKeywords = users.map(user => {
            const userProjectIdsForFilter = [user.id, user.oid].filter(Boolean)
            const userProjectList = projects.filter(p => userProjectIdsForFilter.includes(p.userId))

            // Build a descriptive summary: "Business Name: kw1 (5), kw2 (10)..."
            const userKeywordsData = userProjectList.map(p => {
                const pIds = [p.id, p.oid].filter(Boolean)
                const pKeywords = keywords.filter(k => pIds.includes(k.projectId))

                const kwList = pKeywords.map(k => {
                    const count = scanCounts.find(s => s.keywordId === k.id)?._count._all || 0
                    return { text: k.keyword, count }
                })

                return {
                    businessName: p.businessName,
                    keywords: kwList
                }
            })

            const businessSummaries = userKeywordsData.map(data => {
                if (data.keywords.length === 0) return null
                const displayKws = data.keywords.slice(0, 3).map(k => `${k.text} (${k.count})`)
                return `${data.businessName}: ${displayKws.join(', ')}${data.keywords.length > 3 ? '...' : ''}`
            }).filter(Boolean)

            return {
                ...user,
                keywordCount: keywords.filter(k => {
                    const p = projects.find(proj => proj.id === k.projectId || proj.oid === k.projectId)
                    return p && userProjectIdsForFilter.includes(p.userId)
                }).length,
                keywordSummary: businessSummaries.length > 0
                    ? businessSummaries.join(' | ')
                    : 'No keywords',
                fullKeywords: userKeywordsData
            }
        })

        return NextResponse.json({
            users: usersWithKeywords,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: page,
                limit
            }
        })
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
}

export async function POST(request) {
    const isAdmin = await checkAdmin()

    // Support internal API authentication for server-to-server sync from gmb-connector
    const authHeader = request.headers.get("authorization") || request.headers.get("x-service-key") || request.headers.get("x-api-key")
    const internalSecret = process.env.RINGSCALE_INTERNAL_SECRET || process.env.SERVICE_SECRET_KEY || "ringscale_secret_2024"
    const isWebhookAuthorized = authHeader && (
        authHeader === `Bearer ${internalSecret}` || 
        authHeader === internalSecret ||
        authHeader === `Bearer ringscale_secret_2024` ||
        authHeader === "ringscale_secret_2024" ||
        authHeader === "Bearer 1c53ba2c8075e2c3314d3a72bf4f28adacae7bac725c70dd7b94933739b92fb57ab517d9abc82a5028d625af9e6857a9b8cd23c6eb6267e842b6b3022e7c6b69f74ccc5bc7b60477308b69ac35e7f406"
    )

    if (!isAdmin && !isWebhookAuthorized) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { 
            name, 
            email, 
            password, 
            role, 
            plan, 
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

        // Account is created automatically by their business name if available
        const accountName = effectiveBusinessName || (name && name.trim()) || email.split('@')[0]

        // Auto-generate strong temporary password if not provided
        const rawPassword = (password && password.trim()) 
            ? password.trim() 
            : `RS_${Math.random().toString(36).substring(2, 7).toUpperCase()}!#${Math.floor(100 + Math.random() * 900)}`

        let user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() }
        })

        let isNewUser = false

        if (user) {
            if (!isWebhookAuthorized && !isAdmin) {
                return NextResponse.json({ error: "User already exists" }, { status: 400 })
            }
            // Update existing user's business name and plainPassword if missing
            const updateUserData = {}
            if (effectiveBusinessName && (!user.name || user.name === user.email.split('@')[0])) {
                updateUserData.name = effectiveBusinessName
            }
            if (!user.plainPassword && rawPassword) {
                updateUserData.plainPassword = rawPassword
            }
            if (Object.keys(updateUserData).length > 0) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: updateUserData
                })
            }
        } else {
            isNewUser = true

            const hashedPassword = await bcrypt.hash(rawPassword, 10)

            // Fetch dynamic plan credits from settings
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

            // Set trial expiry date (7 days from now) for trial accounts
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
                    updatedAt: new Date(),
                }
            })

            // Send credentials to email
            const { sendWelcomeEmail, sendGMBWelcomeEmail } = await import('@/lib/mail')
            if (isWebhookAuthorized || effectiveBusinessName) {
                sendGMBWelcomeEmail(email, accountName, selectedPlan, initialCredits, rawPassword).catch(err => {
                    console.error('Error sending GMB welcome email with credentials:', err)
                })
            } else {
                sendWelcomeEmail(email, accountName, selectedPlan, initialCredits).catch(err => {
                    console.error('Error sending welcome email:', err)
                })
            }
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

        return NextResponse.json({
            message: "User account processed successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                plainPassword: user.plainPassword || rawPassword
            }
        })
    } catch (error) {
        console.error('Error creating user from GMB / Admin:', error)
        return NextResponse.json({ error: 'Failed to process user' }, { status: 500 })
    }
}