'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState('details') // 'details' or 'otp'
  const [otpValue, setOtpValue] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

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

  const startResendTimer = () => setResendTimer(60)

  const handleSendOTP = async (e) => {
    if (e) e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 justify-center mb-4">
            <div className="w-32 h-10 rounded-xl flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Ringscale AI"
                width={360}
                height={260}
                className="h-48 w-auto object-contain"
              />
            </div>
          </Link>
          <CardTitle className="text-2xl font-black text-slate-900">
            {step === 'details' ? 'Create Your Account' : 'Verify Email'}
          </CardTitle>
          <CardDescription className="text-slate-500 font-medium">
            {step === 'details' 
              ? 'Start tracking your local rankings today' 
              : `Enter the code we sent to ${formData.email}`}
          </CardDescription>
        </CardHeader>

        {step === 'details' ? (
          <form onSubmit={handleSendOTP}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700 font-bold text-xs uppercase tracking-wider">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className="rounded-xl border-slate-200 focus:ring-blue-500"
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
                  className="rounded-xl border-slate-200 focus:ring-blue-500"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-bold text-xs uppercase tracking-wider">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="rounded-xl border-slate-200 focus:ring-blue-500"
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
                  className="rounded-xl border-slate-200 focus:ring-blue-500"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Get Verification Code'}
              </Button>
              <p className="text-sm text-slate-500 font-medium">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-600 hover:text-blue-700 hover:underline font-bold">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-6 flex flex-col items-center">
              <div className="space-y-4 w-full flex flex-col items-center">
                <div className="flex gap-2">
                  {[...Array(6)].map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      maxLength={1}
                      autoFocus={i === 0}
                      className="w-12 h-14 text-center text-2xl font-black border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all tabular-nums"
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
                  className="text-sm font-bold text-blue-600 hover:text-blue-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                  {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
                </button>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20"
                disabled={isLoading || otpValue.length !== 6}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Create Account'}
              </Button>
              <button
                type="button"
                className="text-xs font-bold text-slate-500 hover:text-slate-700"
                onClick={() => setStep('details')}
              >
                ← Back to registration
              </button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}
