import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import redis from "@/lib/redis"

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
        const cacheKey = 'admin:stats:summary'
        if (redis) {
            const cached = await redis.get(cacheKey)
            if (cached) return NextResponse.json(JSON.parse(cached))
        }
        const [totalUsers, totalProjects, totalScans, totalCredits] = await Promise.all([
            prisma.user.count(),
            prisma.project.count(),
            prisma.scanJob.count(),
            prisma.user.aggregate({
                _sum: {
                    credits: true
                }
            })
        ])

        const usersByPlan = await prisma.user.groupBy({
            by: ['plan'],
            _count: {
                _all: true
            }
        })

        // Normalize and group plan stats to avoid duplicates (e.g. 'trail' vs 'Trial')
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

        // Get 7-day user growth
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        
        const recentUsersCount = await prisma.user.count({
            where: {
                createdAt: {
                    gte: sevenDaysAgo
                }
            }
        })

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
            stats: [
                { title: "Total Users", value: totalUsers, change: recentUsersCount, period: "last 7 days" },
                { title: "Active Projects", value: totalProjects, change: null },
                { title: "Total Scans", value: totalScans, change: null },
                { title: "Allocated Credits", value: totalCredits._sum.credits || 0, change: null },
            ],
            planStats,
            topKeywords
        }

        if (redis) {
            // Cache for 15 minutes
            await redis.set(cacheKey, JSON.stringify(responseData), 'EX', 900)
        }

        return NextResponse.json(responseData)
    } catch (error) {
        console.error('Error fetching admin stats:', error)
        return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 })
    }
}
