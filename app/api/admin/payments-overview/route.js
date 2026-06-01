import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic'

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
        const now = new Date()
        
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(now.getDate() + 30)

        // Helper to map and sort users
        const mapAndSort = (users, order = 'asc') => {
            return users
                .map(u => ({
                    ...u,
                    planEndsAt: u.planEndsAt || u.trialEndsAt
                }))
                .sort((a, b) => {
                    const dateA = new Date(a.planEndsAt || 0).getTime()
                    const dateB = new Date(b.planEndsAt || 0).getTime()
                    return order === 'asc' ? dateA - dateB : dateB - dateA
                })
        }

        // 1. Upcoming Payments (Subscriptions ending in the next 30 days)
        const rawUpcomingUsers = await prisma.user.findMany({
            where: {
                OR: [
                    {
                        planEndsAt: {
                            gte: now,
                            lte: thirtyDaysFromNow
                        }
                    },
                    {
                        plan: 'trial',
                        trialEndsAt: {
                            gte: now,
                            lte: thirtyDaysFromNow
                        }
                    }
                ]
            },
            select: {
                id: true,
                name: true,
                email: true,
                plan: true,
                planEndsAt: true,
                trialEndsAt: true,
                createdAt: true
            }
        })
        const upcomingUsers = mapAndSort(rawUpcomingUsers, 'asc')

        // 2. Cancelled / Expired Subscriptions (Subscriptions that have already ended)
        const rawCancelledUsers = await prisma.user.findMany({
            where: {
                OR: [
                    {
                        planEndsAt: { lt: now }
                    },
                    {
                        plan: 'trial',
                        trialEndsAt: { lt: now }
                    }
                ]
            },
            select: {
                id: true,
                name: true,
                email: true,
                plan: true,
                planEndsAt: true,
                trialEndsAt: true,
                createdAt: true
            }
        })
        const cancelledUsers = mapAndSort(rawCancelledUsers, 'desc')

        // 3. Renewed Subscriptions (Users with > 1 payment record, or recently paid)
        const userPaymentsCount = await prisma.payment.groupBy({
            by: ['userId'],
            _count: { _all: true },
            having: { userId: { _count: { gt: 1 } } }
        })

        const renewedUserIds = userPaymentsCount.map(up => up.userId)

        const rawRenewedUsers = await prisma.user.findMany({
            where: { id: { in: renewedUserIds } },
            select: {
                id: true,
                name: true,
                email: true,
                plan: true,
                planEndsAt: true,
                trialEndsAt: true,
                createdAt: true
            }
        })
        const renewedUsers = mapAndSort(rawRenewedUsers, 'desc')

        const responseData = {
            upcoming: upcomingUsers,
            upcomingCount: upcomingUsers.length,
            cancelled: cancelledUsers,
            cancelledCount: cancelledUsers.length,
            renewed: renewedUsers,
            renewedCount: renewedUsers.length
        }

        return NextResponse.json(responseData)
    } catch (error) {
        console.error('Error fetching admin payments overview:', error)
        return NextResponse.json({ error: 'Failed to fetch payments overview' }, { status: 500 })
    }
}
