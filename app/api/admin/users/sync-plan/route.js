import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import redis from "@/lib/redis"

export async function POST(request) {
    const authHeader = request.headers.get("authorization")
    const internalSecret = process.env.RINGSCALE_INTERNAL_SECRET || process.env.SERVICE_SECRET_KEY
    const isWebhookAuthorized = authHeader && internalSecret && authHeader === `Bearer ${internalSecret}`

    if (!isWebhookAuthorized) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { email, plan, credits } = body

        if (!email || !plan) {
            return NextResponse.json({ error: "Email and plan are required" }, { status: 400 })
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        })

        if (!currentUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const activePlan = plan.toLowerCase().replace('plan_', '')
        const now = new Date()
        
        const updateData = {
            plan: activePlan,
            planStartedAt: now,
            planEndsAt: null,
            trialEndsAt: null,
        }

        if (credits !== undefined) {
            updateData.credits = parseInt(credits)
        }

        if (activePlan.includes('lite') || activePlan.includes('advance')) {
            const date = new Date(now)
            date.setMonth(date.getMonth() + 1)
            updateData.planEndsAt = date
        } else if (activePlan.includes('pro_plus') || activePlan.includes('pro plus')) {
            const date = new Date(now)
            date.setMonth(date.getMonth() + 3)
            updateData.planEndsAt = date
        } else if (activePlan.includes('pro')) {
            const date = new Date(now)
            date.setMonth(date.getMonth() + 3)
            updateData.planEndsAt = date
        } else if (activePlan.includes('trial')) {
            const date = new Date(now)
            date.setDate(date.getDate() + 7)
            updateData.trialEndsAt = date
        } else {
            const date = new Date(now)
            date.setMonth(date.getMonth() + 1)
            updateData.planEndsAt = date
        }

        const user = await prisma.user.update({
            where: { id: currentUser.id },
            data: updateData
        })

        // Bust cache
        if (redis) {
            try { await redis.del(`user:stats:${user.id}`) } catch (e) {}
        }

        return NextResponse.json({ message: "Plan synchronized successfully", user })
    } catch (error) {
        console.error('Error syncing plan:', error)
        return NextResponse.json({ error: 'Failed to sync plan' }, { status: 500 })
    }
}
