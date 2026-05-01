// Last Updated: 2026-05-01T23:32:00Z
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request) {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'partner' && session.user.role !== 'admin')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { clientId, amount } = body

        if (!clientId || !amount || amount <= 0) {
            return NextResponse.json({ error: "Client ID and valid positive amount are required" }, { status: 400 })
        }

        const creditAmount = parseInt(amount)

        // Use transaction for atomic transfer
        const result = await prisma.$transaction(async (tx) => {
            // 1. Check partner credits
            const partner = await tx.user.findUnique({
                where: { id: session.user.id }
            })

            if (!partner || (partner.role !== 'admin' && partner.credits < creditAmount)) {
                throw new Error("Insufficient credits in your account")
            }

            // 2. Check if client exists and belongs to the same company
            const client = await tx.user.findUnique({
                where: { id: clientId }
            })

            if (!client) {
                throw new Error("Client not found")
            }

            if (session.user.role !== 'admin' && client.companyId !== session.user.companyId) {
                throw new Error("Unauthorized: Client does not belong to your company")
            }

            // 3. Deduct from partner
            if (partner.role !== 'admin') {
                await tx.user.update({
                    where: { id: session.user.id },
                    data: { credits: { decrement: creditAmount } }
                })
            }

            // 4. Add to client
            const updatedClient = await tx.user.update({
                where: { id: clientId },
                data: { credits: { increment: creditAmount } }
            })

            return { partnerCredits: partner.credits - creditAmount, clientCredits: updatedClient.credits }
        })

        return NextResponse.json({
            message: "Credits transferred successfully",
            ...result
        })

    } catch (error) {
        console.error('Error transferring credits:', error)
        return NextResponse.json({ error: error.message || 'Failed to transfer credits' }, { status: 500 })
    }
}
