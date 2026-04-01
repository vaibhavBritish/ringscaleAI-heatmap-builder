import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"
import redis from "@/lib/redis"

async function checkAdmin() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
        return false
    }
    return true
}

export async function PATCH(request, props) {
    const params = await props.params
    if (!await checkAdmin()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const { id } = params
        const body = await request.json()
        const { name, email, password, role, plan, credits } = body

        // Fetch current user to compare changes
        const currentUser = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                plan: true,
                credits: true
            }
        })

        if (!currentUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const updateData = {}

        if (name && name !== currentUser.name) {
            updateData.name = name
        }

        if (email && email.toLowerCase() !== currentUser.email) {
            updateData.email = email.toLowerCase()
        }

        if (password) {
            updateData.password = await bcrypt.hash(password, 10)
        }

        if (role && role !== currentUser.role) {
            updateData.role = role
        }

        // ALWAYS reset plan dates on every save for a "fresh reset"
        const activePlan = (plan || currentUser.plan || 'Trial').toLowerCase().replace('plan_', '')
        const now = new Date()
        
        updateData.planStartedAt = now
        updateData.planEndsAt = null
        updateData.trialEndsAt = null

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
            // Default fail-safe to 1 month
            const date = new Date(now)
            date.setMonth(date.getMonth() + 1)
            updateData.planEndsAt = date
        }

        if (plan) updateData.plan = plan

        if (credits !== undefined && parseInt(credits) !== currentUser.credits) {
            const newCredits = parseInt(credits)
            updateData.credits = newCredits
        }

        // Only perform update if there are changes
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ message: "No changes detected" })
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData
        })

        // Bust the user's dashboard stats cache so changes reflect immediately
        if (redis && (updateData.credits !== undefined || updateData.plan !== undefined)) {
            try { await redis.del(`user:stats:${id}`) } catch (e) {}
        }

        return NextResponse.json({
            message: "User updated successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                credits: user.credits,
                plan: user.plan
            }
        })
    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }
}

export async function DELETE(request, props) {
    const params = await props.params
    if (!await checkAdmin()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const { id } = params
        
        await prisma.user.delete({
            where: { id }
        })

        return NextResponse.json({ message: "User deleted successfully" })
    } catch (error) {
        console.error('Error deleting user:', error)
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }
}
