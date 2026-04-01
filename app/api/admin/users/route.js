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
    if (!session || session.user.role !== 'admin') {
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

        const where = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ]
        } : {}

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    plan: true,
                    credits: true,
                    role: true,
                    trialEndsAt: true,
                    planEndsAt: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.user.count({ where })
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
    if (!await checkAdmin()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { name, email, password, role, plan, credits } = body

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        })

        if (existingUser) {
            return NextResponse.json({ error: "User already exists" }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        // Fetch dynamic plan credits from settings
        const planSettings = await prisma.globalSetting.findUnique({
            where: { key: "plans" }
        })
        
        const config = planSettings?.value || {
            Trial: { credits: 300 },
            advance: { credits: 1200 },
            pro: { credits: 2400 },
            pro_plus: { credits: 5000 }
        }

        const selectedPlan = plan || 'Trial'
        const initialCredits = credits !== undefined ? parseInt(credits) : (config[selectedPlan]?.credits || 0)

        const user = await prisma.user.create({
            data: {
                id: uuidv4(),
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
                role: role || 'user',
                plan: selectedPlan,
                credits: initialCredits,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        })

        return NextResponse.json({
            message: "User created successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        })
    } catch (error) {
        console.error('Error creating user:', error)
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }
}