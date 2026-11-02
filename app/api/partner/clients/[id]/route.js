import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getPartnerSession, findManagedClient, hasUnlimitedPool } from "@/lib/partner-clients"

export const dynamic = "force-dynamic"

// Updates profile details only; credits change exclusively through /api/partner/credits/transfer
export async function PATCH(request, { params }) {
    const session = await getPartnerSession()
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id } = await params

    try {
        const client = await findManagedClient(session, id)
        if (!client) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 })
        }

        const body = await request.json()
        const data = {}

        if (body.name !== undefined) data.name = String(body.name).trim()

        if (body.email !== undefined) {
            const email = String(body.email).trim().toLowerCase()
            if (!email) {
                return NextResponse.json({ error: "Email is required" }, { status: 400 })
            }
            if (email !== client.email) {
                const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } })
                if (taken) {
                    return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 })
                }
            }
            data.email = email
        }

        if (body.password) {
            if (body.password.length < 6) {
                return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
            }
            data.password = await bcrypt.hash(body.password, 10)
            data.plainPassword = body.password
        }

        const user = await prisma.user.update({
            where: { id },
            data,
            select: { id: true, name: true, email: true, credits: true, plan: true }
        })

        return NextResponse.json(user)
    } catch (error) {
        console.error('Error updating client:', error)
        return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
    }
}

// Deletes the client and returns their unused credits to the partner's pool
export async function DELETE(request, { params }) {
    const session = await getPartnerSession()
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id } = await params

    try {
        const refunded = await prisma.$transaction(async (tx) => {
            const client = await findManagedClient(session, id, tx)
            if (!client) return null

            const partner = await tx.user.findUnique({ where: { id: session.user.id } })
            const refund = Math.max(0, client.credits || 0)

            if (refund > 0 && !hasUnlimitedPool(partner)) {
                await tx.user.update({
                    where: { id: session.user.id },
                    data: { credits: { increment: refund } }
                })
            }

            await tx.user.delete({ where: { id } })
            return refund
        })

        if (refunded === null) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 })
        }

        return NextResponse.json({ message: "Client deleted successfully", refundedCredits: refunded })
    } catch (error) {
        console.error('Error deleting client:', error)
        return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
    }
}
