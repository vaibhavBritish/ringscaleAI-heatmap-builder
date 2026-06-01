import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendSubscriptionEndingReminderEmail, sendSubscriptionEndingAdminNotification } from '@/lib/mail'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    // Check for authorization header if needed, for cron job security
    // const authHeader = request.headers.get('authorization')
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // We want to find users whose plan ends between 6 and 7 days from now
    const now = new Date()
    const sixDaysFromNow = new Date()
    sixDaysFromNow.setDate(now.getDate() + 6)
    
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(now.getDate() + 7)

    const rawExpiringUsers = await prisma.user.findMany({
      where: {
        OR: [
          {
            planEndsAt: {
              gte: sixDaysFromNow,
              lt: sevenDaysFromNow
            }
          },
          {
            plan: 'trial',
            trialEndsAt: {
              gte: sixDaysFromNow,
              lt: sevenDaysFromNow
            }
          }
        ]
      }
    })

    // Map planEndsAt so the email receives the correct date
    const expiringUsers = rawExpiringUsers.map(u => ({
      ...u,
      planEndsAt: u.planEndsAt || u.trialEndsAt
    }))

    const adminEmail = process.env.ADMIN_EMAIL || 'sales@ringscale.ai'

    const results = {
      attempted: expiringUsers.length,
      successes: 0,
      failures: 0
    }

    const planNames = {
      'plan_lite': 'Advance',
      'plan_pro': 'Pro',
      'trial': 'Trial'
    }

    for (const user of expiringUsers) {
      try {
        const planName = planNames[user.plan] || user.plan

        // Send to user
        await sendSubscriptionEndingReminderEmail(
          user.email,
          user.name,
          planName,
          user.planEndsAt
        )

        // Send to admin
        await sendSubscriptionEndingAdminNotification(
          adminEmail,
          user,
          planName
        )

        results.successes++
      } catch (err) {
        console.error(`Failed to send reminder for user ${user.email}:`, err)
        results.failures++
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription reminders processed successfully',
      results
    })

  } catch (error) {
    console.error('Error in subscription reminder cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
