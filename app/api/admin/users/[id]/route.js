import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"

async function checkAdmin() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
        return false
    }
    return true
}

export async function PATCH(request, { params }) {
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

        if (plan && plan !== currentUser.plan) {
            updateData.plan = plan
        }

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


        return NextResponse.json({
            message: "User updated successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        })
    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }
}

export async function DELETE(request, { params }) {
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
