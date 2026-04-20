'use client'

import { useState } from 'react'
import { 
  Zap, 
  Sparkles, 
  Building2, 
  Globe, 
  FileText, 
  Palette, 
  Loader2, 
  CheckCircle2, 
  ExternalLink,
  QrCode,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  ListPlus
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import Link from 'next/link'

export default function AdminAIBuilder() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [formData, setFormData] = useState({
    businessName: '',
    industry: '',
    description: '',
    gmb_link: '',
    brand_color: '#1E3A8A',
    accent_color: '#EFF6FF',
    key_features: ''
  })

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!formData.businessName) return toast.error('Business Name is required')
    
    setLoading(true)
    try {
      const res = await fetch('/api/marketing/setup-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'External server sync failed')
      
      setResult(data)
      toast.success('AI Marketing Assets synced to External Server!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <ShieldCheck size={20} />
            <span className="text-sm font-bold uppercase tracking-wider">Production Sync Studio</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">External Asset Builder</h1>
          <p className="text-slate-500 mt-2 text-lg">Push data directly to the Review-Gen production server.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-none shadow-2xl overflow-hidden rounded-[2.5rem]">
            <CardHeader className="bg-slate-900 text-white p-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                  <Sparkles className="text-blue-400" size={20} />
                </div>
                <CardTitle className="text-2xl font-bold">Client Profiling</CardTitle>
              </div>
              <CardDescription className="text-slate-400">Data entered here will be synced to review-gen.ringscaleai.com</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleGenerate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-700 font-bold">
                      <Building2 size={16} className="text-blue-500" />
                      Business Name
                    </Label>
                    <Input 
                      placeholder="e.g., Green Leaf Cafe" 
                      className="rounded-xl h-12"
                      value={formData.businessName}
                      onChange={e => setFormData({...formData, businessName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-700 font-bold">
                      <Globe size={16} className="text-blue-500" />
                      Industry
                    </Label>
                    <Input 
                      placeholder="e.g., Restaurant" 
                      className="rounded-xl h-12"
                      value={formData.industry}
                      onChange={e => setFormData({...formData, industry: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-700 font-bold">
                    <FileText size={16} className="text-blue-500" />
                    Description (External Payload)
                  </Label>
                  <Textarea 
                    placeholder="Short summary for the external server..." 
                    className="rounded-xl min-h-[100px]"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-700 font-bold">
                    <ListPlus size={16} className="text-blue-500" />
                    Key Features (Comma Separated)
                  </Label>
                  <Input 
                    placeholder="Organic Coffee, Outdoor Seating, Fast WiFi" 
                    className="rounded-xl h-12"
                    value={formData.key_features}
                    onChange={e => setFormData({...formData, key_features: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-700 font-bold">
                    <ExternalLink size={16} className="text-blue-500" />
                    Google Maps (GMB) URL
                  </Label>
                  <Input 
                    placeholder="https://maps.app.goo.gl/..." 
                    className="rounded-xl h-12"
                    value={formData.gmb_link}
                    onChange={e => setFormData({...formData, gmb_link: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-700 font-bold">
                      <Palette size={16} className="text-blue-500" />
                      Brand Color
                    </Label>
                    <div className="flex gap-2">
                      <Input 
                        type="color"
                        className="w-12 h-12 p-1 rounded-lg cursor-pointer"
                        value={formData.brand_color}
                        onChange={e => setFormData({...formData, brand_color: e.target.value})}
                      />
                      <Input 
                        value={formData.brand_color}
                        className="rounded-lg h-12 font-mono"
                        onChange={e => setFormData({...formData, brand_color: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-700 font-bold">
                      <Palette size={16} className="text-indigo-500" />
                      Accent Color
                    </Label>
                    <div className="flex gap-2">
                      <Input 
                        type="color"
                        className="w-12 h-12 p-1 rounded-lg cursor-pointer"
                        value={formData.accent_color}
                        onChange={e => setFormData({...formData, accent_color: e.target.value})}
                      />
                      <Input 
                        value={formData.accent_color}
                        className="rounded-lg h-12 font-mono"
                        onChange={e => setFormData({...formData, accent_color: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-lg shadow-xl active:scale-[0.98] transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Syncing External Server...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-5 w-5 fill-current" />
                      Build & Push Asset
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-5">
          {result ? (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-8 text-center bg-gradient-to-br from-emerald-50 to-teal-50">
                <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 size={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-black text-emerald-900">Push Successful!</h3>
                <p className="text-emerald-700 mt-2">Asset created on external production server for <strong>{result.externalClient?.name}</strong>.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Link href={result.reviewUrl} target="_blank">
                  <Card className="hover:border-blue-500 transition-all cursor-pointer group rounded-2xl">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <MessageSquare size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-500 uppercase tracking-tighter">AI Review Page</p>
                          <p className="text-slate-900 font-black">View Online</p>
                        </div>
                      </div>
                      <ArrowRight size={20} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </CardContent>
                  </Card>
                </Link>

                <Link href={result.qrUrl} target="_blank">
                  <Card className="hover:border-indigo-500 transition-all cursor-pointer group rounded-2xl">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <QrCode size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-500 uppercase tracking-tighter">Trackable QR Code</p>
                          <p className="text-slate-900 font-black">Open QR</p>
                        </div>
                      </div>
                      <ArrowRight size={20} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                    </CardContent>
                  </Card>
                </Link>
              </div>

              <Button 
                variant="ghost" 
                onClick={() => setResult(null)}
                className="w-full text-slate-400 hover:text-slate-600"
              >
                Create Another Sync
              </Button>
            </div>
          ) : (
            <div className="h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center bg-slate-50/50">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                <Zap size={32} className="text-slate-300" />
              </div>
              <h4 className="text-xl font-bold text-slate-400">Ready for Production</h4>
              <p className="text-slate-400 mt-2 max-w-xs">Enter client details to provision review assets on the external production server.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
