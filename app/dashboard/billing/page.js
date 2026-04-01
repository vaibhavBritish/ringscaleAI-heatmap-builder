import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import BillingClient from './BillingClient'

export default async function BillingPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const headersList = await headers()
  const country = headersList.get('cf-ipcountry') || headersList.get('x-vercel-ip-country') || 'US'
  const isIndia = country === 'IN'

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Billing & Plans</h1>
        <p className="text-slate-600 mt-2">Manage your subscription, credits, and payment methods.</p>
      </div>

      <BillingClient session={session} isIndia={isIndia} />
    </div>
  )
}
