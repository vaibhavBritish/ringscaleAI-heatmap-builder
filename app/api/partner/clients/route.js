// Last Updated: 2026-05-01T23:32:00Z
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"
import { ADMIN_ROLES, getPartnerSession, partnerClientsWhere, hasUnlimitedPool } from "@/lib/partner-clients"

export const dynamic = "force-dynamic"

const MAX_PAGE_SIZE = 50

export async function GET(request) {
    const session = await getPartnerSession()
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const search = (searchParams.get("search") || "").trim()
        const status = searchParams.get("status") || "all"
        const page = Math.max(1, parseInt(searchParams.get("page")) || 1)
        const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(searchParams.get("pageSize")) || 10))

        if (!session.user.companyId && !ADMIN_ROLES.includes(session.user.role)) {
            return NextResponse.json({ users: [], total: 0, page, pageSize, totalPages: 0 })
        }

        const where = {
            ...partnerClientsWhere(session),
            ...(status === 'active' ? { credits: { gt: 0 } } : {}),
            ...(status === 'no_credits' ? { credits: { lte: 0 } } : {}),
            ...(search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } }
                ]
            } : {})
        }

        const [total, users] = await Promise.all([
            prisma.user.count({ where }),
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    plan: true,
                    credits: true,
                    trialEndsAt: true,
                    planEndsAt: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize
            })
        ])

        const projects = await prisma.project.findMany({
            where: { userId: { in: users.map(u => u.id) } },
            select: { userId: true }
        })
        const businessesByUser = {}
        for (const p of projects) businessesByUser[p.userId] = (businessesByUser[p.userId] || 0) + 1

        return NextResponse.json({
            users: users.map(u => ({ ...u, businesses: businessesByUser[u.id] || 0 })),
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize)
        })
    } catch (error) {
        console.error('Error fetching partner clients:', error)
        return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }
}

export async function POST(request) {
    const session = await getPartnerSession()
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const body = await request.json()
        const name = (body.name || '').trim()
        const email = (body.email || '').trim().toLowerCase()
        const password = body.password || ''
        const creditAmount = body.credits !== undefined && body.credits !== '' ? parseInt(body.credits) : 300

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
        }
        if (password.length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
        }
        if (!Number.isInteger(creditAmount) || creditAmount < 0) {
            return NextResponse.json({ error: "Initial credits must be zero or a positive number" }, { status: 400 })
        }

        if (!session.user.companyId && !ADMIN_ROLES.includes(session.user.role)) {
            return NextResponse.json({ error: "You are not associated with a company" }, { status: 400 })
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const result = await prisma.$transaction(async (tx) => {
            const partner = await tx.user.findUnique({
                where: { id: session.user.id }
            })

            if (!partner || (!hasUnlimitedPool(partner) && partner.credits < creditAmount)) {
                throw new Error("Insufficient credits in your agency pool")
            }

            if (!hasUnlimitedPool(partner) && creditAmount > 0) {
                await tx.user.update({
                    where: { id: session.user.id },
                    data: { credits: { decrement: creditAmount } }
                })
            }

            return await tx.user.create({
                data: {
                    id: uuidv4(),
                    name,
                    email,
                    password: hashedPassword,
                    plainPassword: password,
                    role: 'user',
                    companyId: session.user.companyId,
                    plan: body.plan || 'trial',
                    credits: creditAmount,
                }
            })
        })

        // Onboarding email with the login details the partner just set
        // (same welcome-with-credentials email admins send when they create an account)
        let welcomeEmailSent = false
        try {
            const { sendGMBWelcomeEmail } = await import('@/lib/mail')
            const sent = await sendGMBWelcomeEmail(result.email, result.name, result.plan || 'trial', result.credits, password)
            welcomeEmailSent = !!sent
        } catch (mailError) {
            console.error('Error sending partner client welcome email:', mailError)
        }
        if (!welcomeEmailSent) {
            console.error(`[Partner Clients] Welcome email NOT delivered to ${result.email} (check SMTP settings / logs above)`)
        }

        return NextResponse.json({
            message: "Client created successfully",
            welcomeEmailSent,
            user: { id: result.id, name: result.name, email: result.email }
        })
    } catch (error) {
        console.error('Error creating partner client:', error)
        const message = error.message?.startsWith('Insufficient') ? error.message : 'Failed to create client'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
