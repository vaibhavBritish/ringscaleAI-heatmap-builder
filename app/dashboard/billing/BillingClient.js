'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Check, CreditCard, Zap, Loader2, ExternalLink, RefreshCw, 
  Download, Mail, Shield, Calendar, Receipt, ChevronRight,
  Wallet, Clock, BadgeCheck
} from 'lucide-react'
import { toast } from 'sonner'

export default function BillingClient({ session: initialSession, isIndia }) {
  const { data: session, update } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [hasRefreshed, setHasRefreshed] = useState(false)
  const [billingData, setBillingData] = useState(null)
  const [billingLoading, setBillingLoading] = useState(true)

  // Fetch billing details on mount
  useEffect(() => {
    fetchBillingDetails()
  }, [])

  // Refresh session when coming back from successful checkout
  useEffect(() => {
    if (searchParams.get('success') === 'true' && !hasRefreshed) {
      setHasRefreshed(true)
      toast.success('Payment successful! Your account is being updated...')
      const timer = setTimeout(async () => {
        // Sync payments first
        try {
          await fetch('/api/stripe/sync', { method: 'POST' })
        } catch (e) {}
        await update()
        fetchBillingDetails()
        router.replace('/dashboard/billing', { scroll: false })
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [searchParams, update, hasRefreshed, router])

  const fetchBillingDetails = async () => {
    try {
      setBillingLoading(true)
      const res = await fetch('/api/stripe/billing')
      if (res.ok) {
        const data = await res.json()
        setBillingData(data)
      }
    } catch (err) {
      console.error('Failed to fetch billing details:', err)
    } finally {
      setBillingLoading(false)
    }
  }

  const currentSession = session || initialSession
  const isTrial = currentSession?.user?.plan === 'trial'
  const trialEndsAt = currentSession?.user?.trialEndsAt ? new Date(currentSession.user.trialEndsAt) : null
  const isTrialExpired = isTrial && trialEndsAt && trialEndsAt < new Date()
  const hasPaid = billingData?.paymentHistory?.length > 0

  const plans = [
    {
      id: 'plan_lite',
      name: 'Lite',
      credits: '5,000',
      priceUSD: 2,
      priceINR: 160,
      features: ['5,000 Credits', '1 GBP connection', '1 SERP Tracker', 'Local Pack Tracker']
    },
    {
      id: 'plan_pro',
      name: 'Pro',
      credits: '36,000',
      priceUSD: 97,
      priceINR: 7900,
      popular: true,
      features: ['36,000 Credits', 'Rolling Credits', '25 GBP connections', '7 SERP Trackers', 'Local Pack Tracker']
    }
  ]

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handleManageBilling = async () => {
    setLoading('portal')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to open billing portal')
      window.location.href = data.url
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(null)
    }
  }

  const handleSyncPayments = async () => {
    setLoading('refresh')
    try {
      const syncRes = await fetch('/api/stripe/sync', { method: 'POST' })
      const syncData = await syncRes.json()
      if (syncData.synced) {
        toast.success(syncData.message)
      } else {
        toast.info(syncData.message || 'No new payments to sync')
      }
      await update()
      await fetchBillingDetails()
    } catch (err) {
      toast.error('Failed to sync. Please try again.')
    }
    setLoading(null)
  }

  const handleCheckout = async (plan) => {
    setLoading(plan.id)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, isIndia })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Checkout failed')

      if (isIndia) {
        const resLoaded = await loadRazorpay()
        if (!resLoaded) {
          toast.error('Razorpay SDK failed to load. Are you online?')
          setLoading(false)
          return
        }
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: data.amount,
          currency: data.currency,
          name: 'Local Rank Heatmap',
          description: `Subscribe to ${plan.name} Plan`,
          order_id: data.id,
          handler: function (response) {
            toast.success('Payment successful! Your account is being upgraded.')
            setTimeout(async () => {
              await update()
              fetchBillingDetails()
            }, 2000)
          },
          prefill: {
            name: currentSession?.user?.name || '',
            email: currentSession?.user?.email || '',
          },
          theme: { color: '#2563EB' }
        }
        const paymentObject = new window.Razorpay(options)
        paymentObject.open()
      } else {
        window.location.href = data.url
      }
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Failed to initiate checkout.')
    } finally {
      setLoading(null)
    }
  }

  const formatCurrency = (amount, currency) => {
    if (!amount) return '$0.00'
    const value = amount / 100
    if (currency?.toUpperCase() === 'INR') return `₹${value.toFixed(2)}`
    return `$${value.toFixed(2)}`
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    })
  }

  const getPlanDisplayName = (planId) => {
    if (planId === 'plan_lite') return 'Lite'
    if (planId === 'plan_pro') return 'Pro'
    if (planId === 'trial') return 'Trial'
    return planId || 'Free'
  }

  const cardBrandIcon = (brand) => {
    const brands = {
      visa: '💳 Visa',
      mastercard: '💳 Mastercard',
      amex: '💳 Amex',
      discover: '💳 Discover',
    }
    return brands[brand] || `💳 ${brand || 'Card'}`
  }

  return (
    <div className="space-y-8">
      {/* ━━━ Current Plan Box ━━━ */}
      <div className={`p-6 md:p-8 rounded-2xl border ${isTrialExpired ? 'bg-red-50 border-red-200' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'} shadow-sm`}>
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${isTrialExpired ? 'bg-red-500' : 'bg-gradient-to-br from-blue-500 to-indigo-600'} shadow-lg`}>
              {isTrial ? <Zap className="w-7 h-7" /> : <CreditCard className="w-7 h-7" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`text-xl font-black ${isTrialExpired ? 'text-red-900' : 'text-blue-900'}`}>
                  {getPlanDisplayName(currentSession?.user?.plan).toUpperCase()} PLAN
                </h3>
                {!isTrialExpired && (
                  <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3" /> Active
                  </span>
                )}
              </div>
              {isTrial && trialEndsAt && (
                <p className={`text-sm font-bold mt-1 ${isTrialExpired ? 'text-red-600' : 'text-blue-700'}`}>
                  {isTrialExpired ? 'Trial expired. Upgrade to continue.' : `Trial ends ${trialEndsAt.toLocaleDateString()}`}
                </p>
              )}
              <p className="text-sm text-slate-500 mt-1 font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                {currentSession?.user?.credits?.toLocaleString() || 0} Credits remaining
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Button 
              variant="ghost" size="sm"
              className="text-slate-500 hover:text-blue-600 text-xs font-bold gap-1.5"
              onClick={handleSyncPayments}
              disabled={loading === 'refresh'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading === 'refresh' ? 'animate-spin' : ''}`} />
              Sync
            </Button>
            {!isIndia && currentSession?.user?.stripeCustomerId && (
              <Button 
                variant="outline"
                className="h-10 px-5 rounded-xl font-bold gap-2 border-blue-200 hover:bg-blue-100 hover:text-blue-700 text-sm"
                onClick={handleManageBilling}
                disabled={loading === 'portal'}
              >
                {loading === 'portal' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                Manage Billing
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ━━━ Payment Method & Billing Info ━━━ */}
      {billingLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-3 text-slate-500 font-medium">Loading billing details...</span>
        </div>
      ) : hasPaid && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Payment Method Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-violet-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Payment Method</h3>
            </div>

            {billingData?.cardInfo ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {billingData.cardInfo.brand === 'visa' ? '💙' : billingData.cardInfo.brand === 'mastercard' ? '🧡' : '💳'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm capitalize">
                        {billingData.cardInfo.brand} •••• {billingData.cardInfo.last4}
                      </p>
                      <p className="text-xs text-slate-500">
                        Expires {String(billingData.cardInfo.expMonth).padStart(2, '0')}/{billingData.cardInfo.expYear}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                    Active
                  </span>
                </div>
                {!isIndia && currentSession?.user?.stripeCustomerId && (
                  <Button
                    variant="ghost" size="sm"
                    className="w-full mt-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs font-bold gap-1.5"
                    onClick={handleManageBilling}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Update Payment Method
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400">
                <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No saved payment method</p>
                <p className="text-xs mt-1">Card info will appear after your next payment</p>
              </div>
            )}
          </div>

          {/* Billing Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Billing Summary</h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-sm text-slate-500 font-medium">Current Plan</span>
                <span className="text-sm font-bold text-slate-900">{getPlanDisplayName(currentSession?.user?.plan)} Plan</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-sm text-slate-500 font-medium">Credits Balance</span>
                <span className="text-sm font-bold text-emerald-600">{currentSession?.user?.credits?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-sm text-slate-500 font-medium">Total Payments</span>
                <span className="text-sm font-bold text-slate-900">{billingData?.paymentHistory?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-sm text-slate-500 font-medium">Payment Mode</span>
                <span className="text-sm font-bold text-slate-900 capitalize">{isIndia ? 'Razorpay (INR)' : 'Stripe (USD)'}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-slate-500 font-medium">Billing Email</span>
                <span className="text-sm font-bold text-slate-900">{billingData?.user?.email || currentSession?.user?.email}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ━━━ Payment History / Invoices ━━━ */}
      {hasPaid && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Payment History & Invoices</h3>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {billingData?.paymentHistory?.map((payment) => (
              <div key={payment.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <BadgeCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">
                      {getPlanDisplayName(payment.planId)} Plan — {payment.credits?.toLocaleString()} credits
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(payment.date)}
                      </span>
                      {payment.cardBrand && (
                        <span className="text-xs text-slate-400 capitalize">
                          {payment.cardBrand} •••• {payment.cardLast4}
                        </span>
                      )}
                      <span className="text-xs text-slate-400 capitalize">{payment.provider}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <p className="font-black text-slate-900">{formatCurrency(payment.amount, payment.currency)}</p>
                    <p className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">{payment.status}</p>
                  </div>

                  <div className="flex gap-1.5">
                    {/* Invoice download — Stripe PDF, receipt URL, or our custom invoice */}
                    <a
                      href={payment.invoicePdf || payment.receiptUrl || `/api/invoice?id=${payment.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-slate-500 transition-colors"
                      title="Download Invoice PDF"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => {
                        const link = payment.invoicePdf || payment.receiptUrl || `${window.location.origin}/api/invoice?id=${payment.id}`
                        navigator.clipboard.writeText(link)
                        toast.success('Invoice link copied! Share via email.')
                      }}
                      className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-slate-500 transition-colors"
                      title="Copy Invoice Link to Email"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ━━━ Pricing Cards ━━━ */}
      <div>
        <h2 className="text-xl font-black text-slate-900 mb-1">{hasPaid ? 'Add More Credits' : 'Choose a Plan'}</h2>
        <p className="text-sm text-slate-500 mb-6">Select a plan to {hasPaid ? 'top up your' : 'get'} credits.</p>
        
        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className={`bg-white rounded-[2rem] p-8 border ${plan.popular ? 'border-blue-600 shadow-xl relative scale-[1.02]' : 'border-slate-200'} flex flex-col`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                  Most Popular
                </div>
              )}
              
              <h3 className="text-2xl font-black text-slate-900 mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black text-slate-900">
                  {isIndia ? '₹' : '$'}{isIndia ? plan.priceINR : plan.priceUSD}
                </span>
                <span className="text-slate-500 font-bold text-sm">/mo</span>
              </div>

              <div className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-blue-600 font-bold" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => handleCheckout(plan)}
                disabled={!!loading}
                className={`w-full h-12 rounded-xl font-bold text-base transition-all ${
                  plan.popular 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                }`}
              >
                {loading === plan.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    {hasPaid ? `Buy ${plan.name}` : `Upgrade to ${plan.name}`}
                  </span>
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
