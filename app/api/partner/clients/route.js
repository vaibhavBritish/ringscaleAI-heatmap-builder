// Last Updated: 2026-05-01T23:32:00Z
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"

export const dynamic = "force-dynamic"

async function checkPartner() {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'partner' && session.user.role !== 'admin')) {
        return null
    }
    return session
}

export async function GET(request) {
    const session = await checkPartner()
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const search = searchParams.get("search") || ""
        
        // Partners can only see users linked to their company
        // Note: admin can see all if we don't filter, but here we want partner-specific view
        const companyId = session.user.companyId

        if (!companyId && session.user.role !== 'admin') {
            return NextResponse.json({ users: [] })
        }

        const where = {
            ...(companyId ? { companyId } : {}),
            ...(search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } }
                ]
            } : {})
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                plan: true,
                credits: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ users })
    } catch (error) {
        console.error('Error fetching partner clients:', error)
        return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }
}

export async function POST(request) {
    const session = await checkPartner()
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { name, email, password, plan, credits } = body

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
        }

        if (!session.user.companyId && session.user.role !== 'admin') {
            return NextResponse.json({ error: "You are not associated with a company" }, { status: 400 })
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        })

        if (existingUser) {
            return NextResponse.json({ error: "User already exists" }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const creditAmount = credits !== undefined ? parseInt(credits) : 300

        const result = await prisma.$transaction(async (tx) => {
            const partner = await tx.user.findUnique({
                where: { id: session.user.id }
            })

            if (!partner || (partner.role !== 'admin' && partner.credits < creditAmount)) {
                throw new Error("Insufficient credits in your account")
            }

            if (partner.role !== 'admin') {
                await tx.user.update({
                    where: { id: session.user.id },
                    data: { credits: { decrement: creditAmount } }
                })
            }

            return await tx.user.create({
                data: {
                    id: uuidv4(),
                    name,
                    email: email.toLowerCase(),
                    password: hashedPassword,
                    role: 'user',
                    companyId: session.user.companyId,
                    plan: plan || 'trial',
                    credits: creditAmount,
                }
            })
        })

        return NextResponse.json({
            message: "Client created successfully",
            user: { id: result.id, name: result.name, email: result.email }
        })
    } catch (error) {
        console.error('Error creating partner client:', error)
        return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
    }
}
