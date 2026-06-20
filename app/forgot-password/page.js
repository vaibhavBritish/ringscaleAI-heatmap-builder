'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Something went wrong. Please try again.')
      } else {
        setSent(true)
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-xl border-none ring-1 ring-slate-200">
        <CardHeader className="text-center">
          <Link href="/" className="inline-flex items-center justify-center mb-4">
            <div className="h-16 flex items-center justify-center overflow-hidden px-4">
              <Image
                src="/logo.png"
                alt="Ringscale AI"
                width={200}
                height={100}
                className="h-32 w-auto object-contain"
              />
            </div>
          </Link>

          {sent ? (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-black text-slate-900">Check your inbox</CardTitle>
              <CardDescription className="mt-2 text-sm text-slate-500 leading-relaxed">
                If an account exists for <span className="font-semibold text-slate-700">{email}</span>,
                we've sent a password reset link. It will expire in <strong>1 hour</strong>.
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-2xl font-black text-slate-900">Forgot your password?</CardTitle>
              <CardDescription className="mt-2">
                Enter your email and we'll send you a reset link.
              </CardDescription>
            </>
          )}
        </CardHeader>

        {!sent ? (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
                disabled={isLoading}
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending link...</>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to login
              </Link>
            </CardFooter>
          </form>
        ) : (
          <CardFooter className="flex flex-col gap-3 pt-0">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => { setSent(false); setEmail('') }}
            >
              Try a different email
            </Button>
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to login
            </Link>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
