'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle, Lock } from 'lucide-react'
import { toast } from 'sonner'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      toast.error('Invalid reset link. Please request a new one.')
    }
  }, [token])

  // Password strength checks
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  }
  const strength = Object.values(checks).filter(Boolean).length
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]
  const strengthColor = ['', '#ef4444', '#f59e0b', '#22c55e', '#16a34a'][strength]

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!token) {
      toast.error('Invalid or missing reset token. Please request a new link.')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Something went wrong.')
      } else {
        setSuccess(true)
        setTimeout(() => router.push('/login'), 3000)
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-xl border-none ring-1 ring-slate-200 text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-slate-900">Invalid Link</CardTitle>
            <CardDescription>This reset link is missing or invalid. Please request a new one.</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link href="/forgot-password">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-700">Request New Link</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-xl border-none ring-1 ring-slate-200">
        <CardHeader className="text-center">
          <Link href="/" className="inline-flex items-center justify-center mb-4">
            <div className="h-16 flex items-center overflow-hidden px-4">
              <Image src="/logo.png" alt="Ringscale AI" width={200} height={100} className="h-32 w-auto object-contain" />
            </div>
          </Link>

          {success ? (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-black text-slate-900">Password Reset!</CardTitle>
              <CardDescription className="mt-2">
                Your password has been updated. Redirecting you to login...
              </CardDescription>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-black text-slate-900">Set new password</CardTitle>
              <CardDescription className="mt-2">
                Choose a strong password for your account.
              </CardDescription>
            </>
          )}
        </CardHeader>

        {!success && (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">
              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength bar */}
                {password && (
                  <div className="space-y-2 pt-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-1.5 flex-1 rounded-full transition-all duration-300"
                          style={{ backgroundColor: i <= strength ? strengthColor : '#e2e8f0' }}
                        />
                      ))}
                    </div>
                    <p className="text-xs font-semibold" style={{ color: strengthColor }}>
                      {strengthLabel}
                    </p>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { label: '8+ characters', ok: checks.length },
                        { label: 'Uppercase letter', ok: checks.uppercase },
                        { label: 'Lowercase letter', ok: checks.lowercase },
                        { label: 'Number', ok: checks.number },
                      ].map(({ label, ok }) => (
                        <div key={label} className="flex items-center gap-1.5">
                          {ok
                            ? <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                            : <XCircle className="w-3 h-3 text-slate-300 shrink-0" />}
                          <span className={`text-xs ${ok ? 'text-green-700' : 'text-slate-400'}`}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`pr-10 ${confirmPassword && password !== confirmPassword ? 'ring-1 ring-red-400' : ''}`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500 font-medium">Passwords don't match</p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
                disabled={isLoading || (confirmPassword !== '' && password !== confirmPassword)}
              >
                {isLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Resetting...</>
                  : 'Reset Password'
                }
              </Button>
              <Link href="/login" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">
                Back to login
              </Link>
            </CardFooter>
          </form>
        )}

        {success && (
          <CardFooter className="justify-center pt-0">
            <Link href="/login">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-700">Go to Login</Button>
            </Link>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
