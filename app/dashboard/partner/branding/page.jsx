'use client'

import { useState, useEffect } from 'react'
import { 
  Palette, 
  Upload, 
  Trash2, 
  Save, 
  Loader2, 
  Layout, 
  Check, 
  AlertCircle,
  Building2,
  Image as ImageIcon,
  Type
} from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function BrandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    primaryColor: '#0F172A',
    accentColor: '#3B82F6'
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      fetchBranding()
    }
  }, [status])

  const fetchBranding = async () => {
    try {
      const response = await fetch('/api/partner/branding')
      if (response.ok) {
        const data = await response.json()
        setFormData({
          name: data.name || '',
          logo: data.branding?.logo || '',
          primaryColor: data.branding?.colors?.primary || '#0F172A',
          accentColor: data.branding?.colors?.accent || '#3B82F6'
        })
      }
    } catch (error) {
      console.error('Error fetching branding:', error)
      toast.error('Failed to load branding settings')
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo file too large (max 2MB)')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, logo: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/partner/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          branding: {
            logo: formData.logo,
            colors: {
              primary: formData.primaryColor,
              accent: formData.accentColor
            }
          }
        })
      })

      if (response.ok) {
        toast.success('Branding updated successfully!')
        // Optional: Refresh page to update sidebar logo/name
        router.refresh()
      } else {
        throw new Error('Failed to update')
      }
    } catch (error) {
      console.error('Error saving branding:', error)
      toast.error('Failed to update branding')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-900">White-Label Branding</h1>
          </div>
          <p className="text-slate-500 font-medium ml-1">Customize your portal's look and feel for your clients.</p>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="h-12 px-8 rounded-xl bg-slate-900 hover:bg-black text-white font-bold shadow-xl shadow-slate-200 transition-all active:scale-95"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving Changes...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Branding
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Type className="w-4 h-4 text-blue-600" />
                </div>
                <CardTitle className="text-lg font-black text-slate-800">Identity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-bold text-slate-700">Display Name</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. My Agency Pro"
                  className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500"
                />
                <p className="text-xs text-slate-400">This name will appear in the sidebar and client dashboards.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                </div>
                <CardTitle className="text-lg font-black text-slate-800">Logo & Assets</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <Label className="text-sm font-bold text-slate-700">Company Logo</Label>
                
                <div 
                  className={`
                    relative border-2 border-dashed rounded-2xl transition-all duration-300 flex flex-col items-center justify-center p-10 min-h-[200px]
                    ${formData.logo 
                      ? 'border-indigo-200 bg-indigo-50/30' 
                      : 'border-slate-200 bg-slate-50/50 hover:border-indigo-400 hover:bg-indigo-50'}
                  `}
                >
                  {formData.logo ? (
                    <div className="relative group">
                      <div className="w-40 h-40 bg-white rounded-2xl flex items-center justify-center p-4 shadow-xl border border-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={formData.logo} 
                          alt="Logo Preview" 
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-2 backdrop-blur-[2px]">
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="rounded-full font-bold"
                          onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center pointer-events-none">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                        <Upload size={24} className="text-indigo-500" />
                      </div>
                      <p className="text-slate-900 font-black text-sm mb-1 uppercase tracking-tight">Drop Your Logo</p>
                      <p className="text-slate-400 text-xs font-medium">PNG, SVG or WEBP (Max 2MB)</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleLogoUpload}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Palette className="w-4 h-4 text-indigo-600" />
                </div>
                <CardTitle className="text-lg font-black text-slate-800">Color System</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label className="text-sm font-bold text-slate-700 flex items-center justify-between">
                    Primary Color
                    <Badge variant="outline" className="font-mono text-[10px]">{formData.primaryColor}</Badge>
                  </Label>
                  <div className="flex gap-3">
                    <div className="relative w-14 h-14 shrink-0 rounded-2xl border-4 border-white overflow-hidden shadow-lg">
                      <input 
                        type="color" 
                        value={formData.primaryColor} 
                        onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                      />
                    </div>
                    <Input 
                      value={formData.primaryColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="h-14 rounded-xl font-mono text-sm"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">Used for sidebars and main navigation.</p>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-bold text-slate-700 flex items-center justify-between">
                    Accent Color
                    <Badge variant="outline" className="font-mono text-[10px]">{formData.accentColor}</Badge>
                  </Label>
                  <div className="flex gap-3">
                    <div className="relative w-14 h-14 shrink-0 rounded-2xl border-4 border-white overflow-hidden shadow-lg">
                      <input 
                        type="color" 
                        value={formData.accentColor} 
                        onChange={(e) => setFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                        className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                      />
                    </div>
                    <Input 
                      value={formData.accentColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                      className="h-14 rounded-xl font-mono text-sm"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">Used for buttons, links and highlights.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Preview */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden sticky top-8 bg-slate-900 text-white">
            <CardHeader className="border-b border-white/5">
              <div className="flex items-center gap-3">
                <Layout className="w-5 h-5 text-indigo-400" />
                <CardTitle className="text-lg font-black">Live Preview</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Mini Dashboard Preview */}
              <div className="p-6">
                <div className="bg-slate-800/50 rounded-2xl border border-white/5 overflow-hidden">
                  <div className="flex">
                    {/* Sidebar Preview */}
                    <div 
                      className="w-16 h-48 flex flex-col items-center py-4 gap-4"
                      style={{ backgroundColor: formData.primaryColor }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center p-1.5 overflow-hidden">
                        {formData.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={formData.logo} alt="L" className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full bg-white/30 rounded" />
                        )}
                      </div>
                      <div className="space-y-2 w-full px-4">
                        <div className="h-1.5 w-full bg-white/10 rounded-full" />
                        <div className="h-1.5 w-full bg-white/30 rounded-full" />
                        <div className="h-1.5 w-full bg-white/10 rounded-full" />
                      </div>
                    </div>
                    {/* Content Preview */}
                    <div className="flex-1 p-4 bg-slate-50">
                      <div className="h-2 w-24 bg-slate-200 rounded-full mb-6" />
                      <div className="space-y-3">
                        <div className="h-8 w-full bg-white rounded-xl border border-slate-100 shadow-sm flex items-center px-3 justify-between">
                           <div className="h-2 w-20 bg-slate-100 rounded-full" />
                           <div className="h-4 w-12 rounded-lg" style={{ backgroundColor: formData.accentColor }} />
                        </div>
                        <div className="h-24 w-full bg-white rounded-xl border border-slate-100 shadow-sm" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Display Name</h4>
                  <p className="text-lg font-bold text-white truncate">{formData.name || 'Your Company Name'}</p>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1 p-3 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full mb-1" style={{ backgroundColor: formData.primaryColor }} />
                    <span className="text-[10px] font-bold text-slate-400">Primary</span>
                  </div>
                  <div className="flex-1 p-3 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full mb-1" style={{ backgroundColor: formData.accentColor }} />
                    <span className="text-[10px] font-bold text-slate-400">Accent</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-indigo-50/50 rounded-3xl p-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h4 className="text-sm font-black text-indigo-900 mb-1">Expert Tip</h4>
                <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                  Use a PNG logo with a transparent background for the best results in the sidebar. 
                  Keep your primary color dark for better text contrast.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
