'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [companyBranding, setCompanyBranding] = useState(null)
  const [isBrandingLoading, setIsBrandingLoading] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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
      } catch (e) {
        // Silently fail, fallback to default
      } finally {
        setIsBrandingLoading(false)
      }
    }
    fetchBranding()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      })

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Welcome back!')
        router.push('/dashboard')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4"
      style={companyBranding?.branding?.colors?.primary ? { 
        background: `linear-gradient(to bottom, ${companyBranding.branding.colors.primary}10, white)`
      } : {}}
    >
      <Card className="w-full max-w-md shadow-xl border-none ring-1 ring-slate-200">
        <CardHeader className="text-center">
          {isBrandingLoading ? (
            <div className="flex justify-center mb-10">
              <div className="h-28 w-full max-w-[280px] rounded-2xl bg-slate-200 animate-pulse" />
            </div>
          ) : companyBranding?.logo ? (
            <div className="flex justify-center mb-10">
              <div className="h-28 w-full max-w-[280px] flex items-center justify-center p-4 rounded-2xl bg-white/50 backdrop-blur-sm border border-slate-100/50 shadow-sm transition-all hover:shadow-md group">
                <Image 
                  src={companyBranding.logo} 
                  alt={companyBranding.name}
                  width={200}
                  height={100}
                  className="h-full w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                  priority
                />
              </div>
            </div>
          ) : (
            <Link href="/" className="inline-flex items-center gap-2 justify-center mb-4">
              <div className="h-16 flex items-center justify-center overflow-hidden px-4">
                <Image
                  src="/logo.png"
                  alt="Ringscale AI"
                  width={200}
                  height={100}
                  className="h-32  w-auto object-contain"
                />
              </div>
            </Link>
          )}
          
          <CardTitle className="text-2xl font-black text-slate-900">
            {isBrandingLoading ? (
              <div className="h-8 w-48 bg-slate-200 animate-pulse mx-auto rounded" />
            ) : companyBranding ? (
              `${companyBranding.name} Portal`
            ) : (
              'Welcome Back'
            )}
          </CardTitle>
          
          <CardDescription className="mt-2">
            {isBrandingLoading ? (
              <div className="h-4 w-64 bg-slate-100 animate-pulse mx-auto rounded mt-2" />
            ) : companyBranding ? (
              `Sign in to access your dashboard`
            ) : (
              'Sign in to your Local Rank Heatmap account'
            )}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className={`w-full ${!companyBranding?.branding?.colors?.accent ? 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800' : ''}`}
              style={companyBranding?.branding?.colors?.accent ? { backgroundColor: companyBranding.branding.colors.accent } : {}}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
            </Button>
            <p className="text-sm text-slate-600">
              Don't have an account?{' '}
              <Link href="/register" className="text-blue-600 hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
