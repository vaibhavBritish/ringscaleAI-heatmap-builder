import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"

export const dynamic = "force-dynamic"

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
                { slug: { contains: search, mode: 'insensitive' } }
            ]
        } : {}

        const [companies, total] = await Promise.all([
            prisma.company.findMany({
                where,
                include: {
                    _count: {
                        select: { users: true, projects: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.company.count({ where })
        ])

        return NextResponse.json({
            companies,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: page,
                limit
            }
        })
    } catch (error) {
        console.error('Error fetching companies:', error)
        return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
    }
}

export async function POST(request) {
    if (!await checkAdmin()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { name, email, phone, website, logo, slug: customSlug } = body

        if (!name || !email || !logo) {
            return NextResponse.json({ error: "Name, email, and logo are required" }, { status: 400 })
        }

        const slug = customSlug || name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '')
        
        // Check if company exists
        const existingCompany = await prisma.company.findFirst({
            where: { OR: [{ slug }, { name }] }
        })

        if (existingCompany) {
            return NextResponse.json({ error: "Company with this name or slug already exists" }, { status: 400 })
        }

        // Check if admin user exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        })

        if (existingUser) {
            return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 })
        }

        // Create Company and Admin User in a transaction
        const result = await prisma.$transaction(async (tx) => {
            const company = await tx.company.create({
                data: {
                    name,
                    slug,
                    logo,
                    email,
                    phone,
                    website,
                }
            })

            const tempPassword = Math.random().toString(36).slice(-10)
            const hashedPassword = await bcrypt.hash(tempPassword, 10)

            const user = await tx.user.create({
                data: {
                    id: uuidv4(),
                    name: `${name} Admin`,
                    email: email.toLowerCase(),
                    password: hashedPassword,
                    role: 'partner',
                    companyId: company.oid,
                    plan: 'pro',
                    credits: 5000,
                }
            })

            return { company, user, tempPassword }
        })

        // Send Welcome email with credentials
        try {
            const { sendWelcomeEmail } = await import('@/lib/mail')
            await sendWelcomeEmail(email, `${name} Admin`, 'Partner', 5000)
        } catch (err) {
            console.error('Error sending welcome email:', err)
        }

        return NextResponse.json({
            message: "Company and Admin created successfully",
            company: result.company,
            adminEmail: email,
            tempPassword: result.tempPassword
        })
    } catch (error) {
        console.error('Error creating company:', error)
        return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
    }
}
