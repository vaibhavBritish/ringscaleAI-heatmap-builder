import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(request) {
    const session = await getServerSession(authOptions)
    
    // We can also allow fetching by slug for public review pages or white-labeled domains
    const { searchParams } = new URL(request.url)
    let slug = searchParams.get("slug")

    // Automatic subdomain detection
    const hostname = request.headers.get('host')
    const testSubdomain = searchParams.get("test_subdomain")
    
    if (testSubdomain) {
        slug = testSubdomain
    } else if (!slug && hostname) {
        const mainDomains = ['ringscale.ai', 'localhost:3000', '0.0.0.0:3000', '127.0.0.1:3000']
        if (!mainDomains.includes(hostname)) {
            const parts = hostname.split('.')
            if (parts.length > 2 || (hostname.includes('localhost') && parts.length > 1)) {
                slug = parts[0]
            }
        }
    }

    try {
        let company = null
        
        if (slug && slug !== 'www') {
            company = await prisma.company.findUnique({
                where: { slug },
                select: { name: true, logo: true, branding: true, id: true }
            })
        } else if (session?.user?.companyId) {
            company = await prisma.company.findUnique({
                where: { oid: session.user.companyId },
                select: { name: true, logo: true, branding: true, id: true }
            })
        }

        if (!company) {
            return NextResponse.json({ error: "No company branding found" }, { status: 404 })
        }

        return NextResponse.json(company)
    } catch (error) {
        console.error('Error fetching branding:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PATCH(request) {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'partner' && session.user.role !== 'admin')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (!session.user.companyId && session.user.role !== 'admin') {
        return NextResponse.json({ error: "No company associated with this account" }, { status: 400 })
    }

    try {
        const body = await request.json()
        const { name, logo, branding } = body

        // If admin, they might need to specify which company, but for now we follow the session
        const companyId = session.user.companyId

        if (!companyId) {
             return NextResponse.json({ error: "Company ID missing" }, { status: 400 })
        }

        const updatedCompany = await prisma.company.update({
            where: { oid: companyId },
            data: {
                name,
                logo,
                branding
            }
        })

        return NextResponse.json(updatedCompany)
    } catch (error) {
        console.error('Error updating branding:', error)
        return NextResponse.json({ error: 'Failed to update branding' }, { status: 500 })
    }
}
