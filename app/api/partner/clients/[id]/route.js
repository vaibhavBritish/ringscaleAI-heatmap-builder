import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = "force-dynamic"

async function checkPartner() {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'partner' && session.user.role !== 'admin')) {
        return null
    }
    return session
}

export async function PATCH(request, { params }) {
    const session = await checkPartner()
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const resolvedParams = await params
    const id = resolvedParams.id

    try {
        const body = await request.json()
        const { name, email, credits } = body

        // Only update allowed fields
        const user = await prisma.user.update({
            where: { id },
            data: {
                name,
                email,
                credits: credits !== undefined ? parseInt(credits) : undefined
            }
        })

        return NextResponse.json(user)
    } catch (error) {
        console.error('Error updating client:', error)
        return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
    }
}

export async function DELETE(request, { params }) {
    const session = await checkPartner()
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const resolvedParams = await params
    const id = resolvedParams.id

    try {
        const user = await prisma.user.findUnique({
            where: { id }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Verify the user belongs to the partner's company if they are not an admin
        if (session.user.role !== 'admin' && user.companyId !== session.user.companyId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // Delete the user
        await prisma.user.delete({
            where: { id }
        })

        return NextResponse.json({ message: "Client deleted successfully" })
    } catch (error) {
        console.error('Error deleting client:', error)
        return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
    }
}
