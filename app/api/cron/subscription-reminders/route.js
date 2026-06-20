import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { 
  sendTrialEndingEmail,
  sendSubscriptionEndingReminderEmail, 
  sendSubscriptionEndingAdminNotification 
} from '@/lib/mail'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  // Validate cron secret to prevent unauthorised calls
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find users whose plan or trial ends between 6 and 7 days from now
    const now = new Date()
    const sixDaysFromNow = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000)
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const rawExpiringUsers = await prisma.user.findMany({
      where: {
        OR: [
          // Paid plans expiring in 6-7 days
          {
            planEndsAt: {
              gte: sixDaysFromNow,
              lt: sevenDaysFromNow
            }
          },
          // Trial accounts expiring in 6-7 days
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

    const adminEmail = process.env.ADMIN_EMAIL || 'sales@ringscale.ai'

    const results = {
      attempted: rawExpiringUsers.length,
      successes: 0,
      failures: 0
    }

    const planNames = {
      'plan_lite': 'Advance',
      'plan_pro': 'Pro',
      'advance': 'Advance',
      'pro': 'Pro',
      'pro_plus': 'Pro Plus',
      'trial': 'Trial'
    }

    for (const user of rawExpiringUsers) {
      try {
        const planName = planNames[user.plan] || user.plan
        const isTrial = user.plan === 'trial'

        if (isTrial) {
          // Send trial-specific expiry email
          await sendTrialEndingEmail(
            user.email,
            user.name,
            user.trialEndsAt
          )
        } else {
          // Send generic subscription-ending reminder for paid plans
          await sendSubscriptionEndingReminderEmail(
            user.email,
            user.name,
            planName,
            user.planEndsAt
          )
        }

        // Always notify admin regardless of plan type
        await sendSubscriptionEndingAdminNotification(
          adminEmail,
          { ...user, planEndsAt: user.planEndsAt || user.trialEndsAt },
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
