import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = "force-dynamic"

async function checkAdmin() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
        return false
    }
    return true
}

export async function GET(request, { params }) {
    const resolvedParams = await params
    const id = resolvedParams.id
    
    if (!await checkAdmin()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const company = await prisma.company.findUnique({
            where: { id },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        createdAt: true
                    }
                },
                _count: {
                    select: { projects: true }
                }
            }
        })

        if (!company) {
            return NextResponse.json({ error: "Company not found" }, { status: 404 })
        }

        return NextResponse.json(company)
    } catch (error) {
        console.error('Error fetching company:', error)
        return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 })
    }
}

export async function PATCH(request, { params }) {
    const resolvedParams = await params
    const id = resolvedParams.id
    
    if (!await checkAdmin()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { name, slug, email, phone, website, isActive, branding } = body

        const company = await prisma.company.update({
            where: { id },
            data: {
                name,
                slug,
                email,
                phone,
                website,
                isActive,
                branding
            }
        })

        return NextResponse.json(company)
    } catch (error) {
        console.error('Error updating company:', error)
        return NextResponse.json({ error: 'Failed to update company' }, { status: 500 })
    }
}

export async function DELETE(request, { params }) {
    console.log("[DELETE] Attempting deletion for company params:", params)
    const resolvedParams = await params
    const id = resolvedParams.id
    console.log("[DELETE] Resolved ID:", id)

    if (!await checkAdmin()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (!id) {
        return NextResponse.json({ error: "Missing company ID" }, { status: 400 })
    }

    try {
        // Find company first
        const company = await prisma.company.findUnique({
            where: { id }
        })

        if (!company) {
            return NextResponse.json({ error: "Company not found" }, { status: 404 })
        }

        // Delete associated projects and users (or just set companyId to null)
        // For companies, we might want to delete the whole thing.
        // We'll use a transaction.
        await prisma.$transaction([
            prisma.user.deleteMany({
                where: { companyId: company.oid }
            }),
            prisma.project.deleteMany({
                where: { companyId: company.oid }
            }),
            prisma.company.delete({
                where: { id }
            })
        ], {
            timeout: 10000 // 10 seconds
        })

        return NextResponse.json({ message: "Company deleted successfully" })
    } catch (error) {
        console.error('Error deleting company:', error)
        return NextResponse.json({ error: error.message || 'Failed to delete company' }, { status: 500 })
    }
}
