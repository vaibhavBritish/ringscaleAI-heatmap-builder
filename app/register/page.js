'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Loader2, ChevronDown, RefreshCw } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import Image from 'next/image'
import VisualDashboard from '@/components/VisualDashboard'

const countryCodes = [
  { code: '+91', country: 'IN', label: '🇮🇳 +91', id: '+91-IN' },
  { code: '+1', country: 'US', label: '🇺🇸 +1', id: '+1-US' },
  { code: '+44', country: 'UK', label: '🇬🇧 +44', id: '+44-UK' },
  { code: '+61', country: 'AU', label: '🇦🇺 +61', id: '+61-AU' },
  { code: '+971', country: 'AE', label: '🇦🇪 +971', id: '+971-AE' },
  { code: '+65', country: 'SG', label: '🇸🇬 +65', id: '+65-SG' },
  { code: '+1', country: 'CA', label: '🇨🇦 +1', id: '+1-CA' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [companyBranding, setCompanyBranding] = useState(null)
  const [isBrandingLoading, setIsBrandingLoading] = useState(true)
  const [step, setStep] = useState('details') // 'details' or 'otp'
  const [otpValue, setOtpValue] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+1-US',
    password: '',
    confirmPassword: '',
    smsConsent: false
  })

  // Fetch branding if on a subdomain
  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search)
        const testSubdomain = searchParams.get('test_subdomain')
        const apiUrl = testSubdomain 
          ? `/api/company/branding?test_subdomain=${testSubdomain}`
          : '/api/company/branding'

        const res = await fetch(apiUrl)
        if (res.ok) {
          const data = await res.json()
          setCompanyBranding(data)
        }
      } finally {
        setIsBrandingLoading(false)
      }
    }
    fetchBranding()
  }, [])

  // Handle Resend Timer
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer])

  // Get Geolocation
  useEffect(() => {
    const fetchGeo = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data.country === 'IN') {
          setFormData(prev => ({ ...prev, countryCode: '+91-IN' }));
        } else if (data.country === 'CA') {
          setFormData(prev => ({ ...prev, countryCode: '+1-CA' }));
        } else {
          setFormData(prev => ({ ...prev, countryCode: '+1-US' }));
        }
      } catch (err) {
        console.error('Geo error:', err);
      }
    };
    fetchGeo();
  }, [])

  const startResendTimer = () => setResendTimer(60)

  const handleSendOTP = async (e) => {
    if (e) e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (!formData.smsConsent) {
      toast.error('Please agree to receive SMS messages')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP')
      }

      toast.success('OTP sent to your email!')
      setStep('otp')
      startResendTimer()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (resendTimer > 0) return
    await handleSendOTP()
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (otpValue.length !== 6) {
      toast.error('Please enter a 6-digit OTP')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: `${formData.countryCode.split('-')[0]}${formData.phone}`,
          password: formData.password,
          otp: otpValue
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      toast.success('Account created successfully!')

      // Auto sign in
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      })

      if (result?.ok) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Left Marketing Panel - Only visible on large screens or as a top section on mobile */}
      <div className="lg:w-[45%] bg-[#EBF1FF] p-8 lg:p-16 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="max-w-md w-full text-center space-y-8 relative z-10 transition-all duration-700 animate-in fade-in slide-in-from-left-8">
          <h1 className="text-3xl lg:text-5xl font-black text-slate-900 leading-tight">
            Your spot in the <span className="text-blue-600 underline decoration-blue-200 underline-offset-8">Top 3</span> starts here
          </h1>

          <div className="relative mt-12 transform hover:scale-105 transition-transform duration-500 drop-shadow-2xl">
            <div className="scale-75 origin-top w-[130%] -ml-[15%]">
              <VisualDashboard />
            </div>
          </div>
        </div>

        {/* Subtle decorative elements for the left panel */}
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-blue-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-5%] right-[-5%] w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Right Registration Panel */}
      <div className="flex-1 p-8 lg:p-16 flex flex-col items-center justify-start overflow-y-auto">
        <div className="max-w-xl w-full space-y-12">
          {/* Header & Headlines */}
          <div className="space-y-6 text-center lg:text-left pt-8">
            {isBrandingLoading ? (
              <div className="flex justify-center lg:justify-start mb-10">
                <div className="h-28 w-full max-w-[280px] rounded-2xl bg-slate-200 animate-pulse" />
              </div>
            ) : companyBranding?.logo && (
              <div className="flex justify-center lg:justify-start mb-10">
                <div className="h-28 w-full max-w-[280px] flex items-center justify-center p-4 rounded-2xl bg-white/50 backdrop-blur-sm border border-slate-100/50 shadow-sm transition-all hover:shadow-md group">
                  <Image
                    src={companyBranding.logo}
                    alt={companyBranding.name}
                    width={300}
                    height={100}
                    className="h-full w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                    priority
                  />
                </div>
              </div>
            )}
            <div className="space-y-4">
              <h2 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
                {isBrandingLoading ? (
                  <div className="h-12 w-3/4 bg-slate-200 animate-pulse rounded mb-4 mx-auto lg:mx-0" />
                ) : companyBranding ? (
                  <>Access the <span style={{ color: companyBranding.branding?.colors?.accent || '#2563eb' }}>{companyBranding.name}</span> AI Platform</>
                ) : (
                  <>Our <span className="text-blue-600">AI-Powered</span> SaaS Platform Gets You in the Top 3</>
                )}
              </h2>
              <p className="text-lg text-slate-500 font-medium">
                {isBrandingLoading ? (
                  <div className="h-4 w-full bg-slate-100 animate-pulse rounded mx-auto lg:mx-0" />
                ) : companyBranding ? (
                  `Join ${companyBranding.name} and get AI-driven insights to grow your business visibility.`
                ) : (
                  "We'll analyze your location and show how our AI-driven insights can move your business toward Top 3 visibility"
                )}
              </p>
            </div>
          </div>

          <div className="space-y-8 bg-white rounded-3xl p-2 lg:p-0">
            <div className="space-y-4 text-center lg:text-left">
              <h3 className="text-2xl font-black text-slate-900">
                {step === 'details' ? "Let's see if your location is available first" : "Almost there! Verify your email"}
              </h3>
              {step === 'otp' && (
                <p className="text-slate-500 font-medium italic">
                  Enter the code we sent to <span className="text-blue-600 font-bold">{formData.email}</span>
                </p>
              )}
            </div>

            {step === 'details' ? (
              <form onSubmit={handleSendOTP} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-700 font-bold text-xs uppercase tracking-wider">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      className="h-12 rounded-xl border-slate-200 focus:ring-blue-500 bg-slate-50/50"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700 font-bold text-xs uppercase tracking-wider">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="h-12 rounded-xl border-slate-200 focus:ring-blue-500 bg-slate-50/50"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-700 font-bold text-xs uppercase tracking-wider">Phone Number (as listed on Google)</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.countryCode}
                      onValueChange={(val) => setFormData({ ...formData, countryCode: val })}
                    >
                      <SelectTrigger className="w-[110px] h-12 rounded-xl border-slate-200 focus:ring-blue-500 font-bold bg-slate-50/50">
                        <SelectValue placeholder="+91" />
                      </SelectTrigger>
                      <SelectContent>
                        {countryCodes.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="font-bold">
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your business phone"
                      className="h-12 flex-1 rounded-xl border-slate-200 focus:ring-blue-500 bg-slate-50/50"
                      value={formData.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setFormData({ ...formData, phone: val });
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-700 font-bold text-xs uppercase tracking-wider">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="h-12 rounded-xl border-slate-200 focus:ring-blue-500 bg-slate-50/50"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-slate-700 font-bold text-xs uppercase tracking-wider">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="h-12 rounded-xl border-slate-200 focus:ring-blue-500 bg-slate-50/50"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-start gap-4 pt-2 group">
                  <Checkbox
                    id="smsConsent"
                    checked={formData.smsConsent}
                    onCheckedChange={(checked) => setFormData({ ...formData, smsConsent: checked })}
                    className="mt-1 w-5 h-5 rounded-md border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 transition-all cursor-pointer"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="smsConsent"
                      className="text-xs leading-relaxed text-slate-500 font-medium cursor-pointer select-none group-hover:text-slate-600 transition-colors"
                    >
                      I agree to receive SMS messages from Ringscale AI. By providing your phone number and submitting this form, you consent to receive text messages from Ringscale AI regarding your account and services. Message frequency varies. Message and data rates may apply. Reply STOP to cancel or HELP for help. View our <Link href="/privacy-policy" className="text-blue-600 hover:underline font-bold">Privacy Policy</Link> | <Link href="/terms-and-conditions" className="text-blue-600 hover:underline font-bold">Terms of Service</Link>.
                    </label>
                  </div>
                </div>

                <div className="pt-4 space-y-4">
                  <Button
                    type="submit"
                    className={`w-full h-14 ${!companyBranding?.branding?.colors?.accent ? 'bg-blue-600 hover:bg-blue-700' : ''} text-white font-black text-lg rounded-xl shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 group`}
                    style={companyBranding?.branding?.colors?.accent ? { 
                      backgroundColor: companyBranding.branding.colors.accent,
                      boxShadow: `0 10px 25px -5px ${companyBranding.branding.colors.accent}40`
                    } : {}}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        Get Verification Code
                        <ChevronDown className="w-5 h-5 -rotate-90 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                  <p className="text-center text-sm text-slate-400 font-bold tracking-tight">
                    Already have an account?{' '}
                    <Link href="/login" className="text-blue-600 hover:text-blue-700 transition-colors hover:underline underline-offset-4">
                      Sign in
                    </Link>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-6 flex flex-col items-center">
                  <div className="flex gap-2">
                    {[...Array(6)].map((_, i) => (
                      <input
                        key={i}
                        type="text"
                        maxLength={1}
                        autoFocus={i === 0}
                        className="w-12 h-14 lg:w-16 lg:h-16 text-center text-3xl font-black border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all tabular-nums bg-slate-50/50"
                        value={otpValue[i] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!/^\d*$/.test(val)) return;
                          const newOtp = otpValue.split('');
                          newOtp[i] = val.slice(-1);
                          setOtpValue(newOtp.join(''));
                          if (val && e.target.nextSibling) e.target.nextSibling.focus();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !otpValue[i] && e.target.previousSibling) {
                            e.target.previousSibling.focus();
                          }
                        }}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={resendTimer > 0 || isLoading}
                    className="flex items-center gap-2 text-sm font-black text-blue-600 hover:text-blue-700 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${resendTimer > 0 ? '' : 'animate-spin-slow'}`} />
                    {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code now'}
                  </button>
                </div>

                <div className="space-y-4 pt-4">
                  <Button
                    type="submit"
                    className={`w-full h-14 ${!companyBranding?.branding?.colors?.accent ? 'bg-emerald-600 hover:bg-emerald-700' : ''} text-white font-black text-lg rounded-xl shadow-xl transition-all transform active:scale-95`}
                    style={companyBranding?.branding?.colors?.accent ? { 
                      backgroundColor: companyBranding.branding.colors.accent,
                      boxShadow: `0 10px 25px -5px ${companyBranding.branding.colors.accent}40`
                    } : {}}
                    disabled={isLoading || otpValue.length !== 6}
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Create Account'}
                  </Button>
                  <button
                    type="button"
                    className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors py-2"
                    onClick={() => setStep('details')}
                  >
                    ← Back to registration details
                  </button>
                </div>
              </form>
            )}

            <div className="pt-8 text-center border-t border-slate-50">
              {/* <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                No credit card, website access, or contract needed
              </p> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
