import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import redis from "@/lib/redis"

export const dynamic = 'force-dynamic'

async function getAuth() {
    const session = await getServerSession(authOptions)
    if (!session || !['superadmin', 'admin', 'staff'].includes(session.user.role)) {
        return null
    }
    return session
}

export async function GET(request) {
    const session = await getAuth()
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

        const url = new URL(request.url)
        const period = url.searchParams.get('period') || 'all'

        if (session.user.role === 'staff') {
            let dateFilter = {}
            if (period === 'daily') {
                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);
                dateFilter = { createdAt: { gte: startOfDay } }
            } else if (period === 'weekly') {
                const startOfWeek = new Date();
                startOfWeek.setDate(startOfWeek.getDate() - 7);
                dateFilter = { createdAt: { gte: startOfWeek } }
            } else if (period === 'monthly') {
                const startOfMonth = new Date();
                startOfMonth.setMonth(startOfMonth.getMonth() - 1);
                dateFilter = { createdAt: { gte: startOfMonth } }
            }

            // Fetch Sales Stats for Staff
            const sales = await prisma.salesRecord.findMany({
                where: { staffId: user.oid, ...dateFilter }
            })
            const totalLeads = sales.length
            const converted = sales.filter(s => s.status === 'Converted').length
            
            const salesUSD = sales.filter(s => s.currency === 'USD' || !s.currency)
            const salesINR = sales.filter(s => s.currency === 'INR')

            const totalRevenueUSD = salesUSD.reduce((acc, curr) => acc + curr.totalPayment, 0)
            const totalRemainingUSD = salesUSD.reduce((acc, curr) => acc + curr.remainingPayment, 0)

            const totalRevenueINR = salesINR.reduce((acc, curr) => acc + curr.totalPayment, 0)
            const totalRemainingINR = salesINR.reduce((acc, curr) => acc + curr.remainingPayment, 0)

            // Calculate growth compared to last 7 days for the whole period (if applicable)
            const recentSales = sales.filter(s => s.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))

            const responseData = {
                role: 'staff',
                stats: [
                    { title: "Total Leads", value: totalLeads, change: recentSales.length, period: "new this week" },
                    { title: "Converted Clients", value: converted, change: null },
                    { title: "Revenue (USD)", value: `$${totalRevenueUSD.toLocaleString()}`, change: null },
                    { title: "Revenue (INR)", value: `₹${totalRevenueINR.toLocaleString()}`, change: null },
                    { title: "Pending (USD)", value: `$${totalRemainingUSD.toLocaleString()}`, change: null },
                    { title: "Pending (INR)", value: `₹${totalRemainingINR.toLocaleString()}`, change: null },
                ],
                planStats: [], // Not applicable for staff
                topKeywords: []
            }
            return NextResponse.json(responseData)
        }

        // --- PLATFORM STATS FOR SUPERADMIN & ADMIN ---
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const [totalUsers, totalProjects, totalScans, totalCredits, oldUsersCount] = await Promise.all([
            prisma.user.count(),
            prisma.project.count(),
            prisma.scanJob.count(),
            prisma.user.aggregate({
                _sum: {
                    credits: true
                }
            }),
            prisma.user.count({
                where: {
                    createdAt: {
                        lt: sevenDaysAgo
                    }
                }
            })
        ])

        const usersByPlan = await prisma.user.groupBy({
            by: ['plan'],
            _count: {
                _all: true
            }
        })

        // Normalize and group plan stats to avoid duplicates
        const normalizedStats = {}
        usersByPlan.forEach(item => {
            let rawName = (item.plan || 'Trial').trim()
            let normalizedName = 'Trial' 
            
            const lowerName = rawName.toLowerCase()
            if (lowerName === 'trial' || lowerName === 'trail' || lowerName === 'plan_lite') {
                normalizedName = 'Trial'
            } else if (lowerName === 'advance') {
                normalizedName = 'Advance'
            } else if (lowerName === 'pro' || lowerName === 'plan_pro') {
                normalizedName = 'Pro'
            } else if (lowerName === 'pro_plus') {
                normalizedName = 'Pro Plus'
            } else {
                normalizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1)
            }

            normalizedStats[normalizedName] = (normalizedStats[normalizedName] || 0) + item._count._all
        })

        const planStats = Object.entries(normalizedStats).map(([name, count]) => ({
            name,
            count
        }))

        // Calculate actual growth percentage
        const newUserCount = totalUsers - oldUsersCount
        const growthPct = oldUsersCount === 0 ? (totalUsers > 0 ? 100 : 0) : Math.round((newUserCount / oldUsersCount) * 100)

        // Get Top Keywords by scan count
        const topKeywordStats = await prisma.scanJob.groupBy({
            by: ['keywordId'],
            _count: {
                _all: true
            },
            orderBy: {
                _count: {
                    keywordId: 'desc'
                }
            },
            take: 10
        })

        const keywordDetails = await prisma.keyword.findMany({
            where: {
                id: { in: topKeywordStats.map(s => s.keywordId) }
            },
            select: {
                id: true,
                keyword: true
            }
        })

        const topKeywords = topKeywordStats.map(stat => {
            const detail = keywordDetails.find(d => d.id === stat.keywordId)
            return {
                keyword: detail?.keyword || 'Unknown',
                count: stat._count._all
            }
        })

        const responseData = {
            role: session.user.role,
            stats: [
                { title: "Total Users", value: totalUsers, change: growthPct, period: "last 7 days" },
                { title: "Active Projects", value: totalProjects, change: null },
                { title: "Total Scans", value: totalScans, change: null },
                { title: "Allocated Credits", value: totalCredits._sum.credits || 0, change: null },
            ],
            planStats,
            topKeywords
        }

        return NextResponse.json(responseData)
    } catch (error) {
        console.error('Error fetching admin stats:', error)
        return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 })
    }
}
