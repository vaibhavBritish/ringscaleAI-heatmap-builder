// Last Updated: 2026-05-01T23:32:00Z
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getPartnerSession, findManagedClient, hasUnlimitedPool } from "@/lib/partner-clients"

// direction 'add' moves credits from the partner's pool to a client,
// 'reclaim' returns unused client credits to the pool
export async function POST(request) {
    const session = await getPartnerSession()
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { clientId, direction = 'add' } = body
        const creditAmount = parseInt(body.amount)

        if (!clientId || !Number.isInteger(creditAmount) || creditAmount <= 0) {
            return NextResponse.json({ error: "Client ID and valid positive amount are required" }, { status: 400 })
        }
        if (!['add', 'reclaim'].includes(direction)) {
            return NextResponse.json({ error: "Invalid transfer direction" }, { status: 400 })
        }

        const result = await prisma.$transaction(async (tx) => {
            const partner = await tx.user.findUnique({
                where: { id: session.user.id }
            })
            if (!partner) throw new Error("Partner account not found")

            const client = await findManagedClient(session, clientId, tx)
            if (!client) throw new Error("Client not found in your agency")

            const unlimited = hasUnlimitedPool(partner)

            if (direction === 'add') {
                if (!unlimited && partner.credits < creditAmount) {
                    throw new Error("Insufficient credits in your agency pool")
                }
                if (!unlimited) {
                    await tx.user.update({
                        where: { id: session.user.id },
                        data: { credits: { decrement: creditAmount } }
                    })
                }
                const updatedClient = await tx.user.update({
                    where: { id: clientId },
                    data: { credits: { increment: creditAmount } }
                })
                return { partnerCredits: unlimited ? partner.credits : partner.credits - creditAmount, clientCredits: updatedClient.credits }
            }

            if (client.credits < creditAmount) {
                throw new Error(`Client only has ${client.credits} credits to reclaim`)
            }
            const updatedClient = await tx.user.update({
                where: { id: clientId },
                data: { credits: { decrement: creditAmount } }
            })
            if (!unlimited) {
                await tx.user.update({
                    where: { id: session.user.id },
                    data: { credits: { increment: creditAmount } }
                })
            }
            return { partnerCredits: unlimited ? partner.credits : partner.credits + creditAmount, clientCredits: updatedClient.credits }
        })

        return NextResponse.json({
            message: direction === 'add' ? "Credits transferred successfully" : "Credits reclaimed successfully",
            ...result
        })

    } catch (error) {
        console.error('Error transferring credits:', error)
        return NextResponse.json({ error: error.message || 'Failed to transfer credits' }, { status: 400 })
    }
}
