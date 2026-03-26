'use client'

import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Shield, User } from 'lucide-react'
import PlanTimer from '@/components/dashboard/PlanTimer'
import Link from 'next/link'

export default function SettingsPage() {
  const { data: session } = useSession()
  const isTrial = session?.user?.plan === 'trial'

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-1">Manage your account settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={session?.user?.name || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={session?.user?.email || ''} disabled />
          </div>
        </CardContent>
      </Card>

      {(session?.user?.planEndsAt || session?.user?.trialEndsAt) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Plan & Usage
            </CardTitle>
            <CardDescription>Your current subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PlanTimer 
              expiryDate={session?.user?.planEndsAt || session?.user?.trialEndsAt} 
              planName={session?.user?.plan === 'trial' ? '7-Day Trial' : (session?.user?.plan === 'plan_lite' ? 'Advance Plan' : 'Pro Plan')} 
            />
            <Link href="/dashboard/billing">
              <Button variant="outline" className="w-full">
                {session?.user?.plan === 'trial' ? 'Upgrade Plan' : 'Manage Subscription'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
