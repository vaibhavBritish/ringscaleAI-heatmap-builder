'use client'

import { useState } from 'react'
import { 
  Sparkles, 
  ArrowLeft, 
  Loader2, 
  Trash2, 
  ExternalLink,
  Plus,
  Info,
  Copy,
  Check,
  Star,
  Image as ImageIcon,
  Palette,
  Zap,
  Building2,
  History
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

export default function ReviewGeneratorPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user?.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [session, status, router])

  const [submitting, setSubmitting] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState(null)
  const [copied, setCopied] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    industry: '',
    gmb_link: '',
    brand_color: '#1E3A8A',
    accent_color: '#EFF6FF',
    hero_image: '',
    key_features: ['']
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (name === 'name') {
      const suggestedSlug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      setFormData(prev => ({ ...prev, slug: suggestedSlug }))
    }
  }

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.key_features]
    newFeatures[index] = value
    setFormData(prev => ({ ...prev, key_features: newFeatures }))
  }

  const addFeatureField = () => {
    setFormData(prev => ({ ...prev, key_features: [...prev.key_features, ''] }))
  }

  const removeFeatureField = (index) => {
    const newFeatures = formData.key_features.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, key_features: newFeatures.length ? newFeatures : [''] }))
  }

  const handleImageUpload = (file) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File is too large. Max 2MB.')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, hero_image: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      
      const cleanedFeatures = formData.key_features.filter(f => f.trim() !== '')
      const submitData = { ...formData, key_features: cleanedFeatures }

      const response = await fetch('/api/review-gen/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      if (!response.ok) {
        throw new Error('Failed to generate review page')
      }

      const url = `https://review-gen.ringscaleai.com/${formData.slug}`
      setGeneratedUrl(url)
      toast.success('Review page generated successfully!')
    } catch (err) {
      console.error('Error:', err)
      toast.error('Failed to generate review page')
    } finally {
      setSubmitting(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Link copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      industry: '',
      gmb_link: '',
      brand_color: '#1E3A8A',
      accent_color: '#EFF6FF',
      hero_image: '',
      key_features: ['']
    })
    setGeneratedUrl(null)
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/dashboard/seoos">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-900">Review Generator</h1>
          </div>
          <p className="text-slate-500 font-medium ml-[52px]">Generate AI-powered review assets for any business instantly.</p>
        </div>

        <div className="flex items-center gap-3 ml-[52px] md:ml-0">
          <Link href="/dashboard/seoos/review-generator/history">
            <Button variant="outline" className="rounded-xl font-bold bg-white border-slate-200">
              <History className="w-4 h-4 mr-2" />
              View History
            </Button>
          </Link>
        </div>
      </div>

      <div>
        {generatedUrl ? (
          <div
            className="max-w-2xl mx-auto py-12"
          >
            <Card className="border-none shadow-2xl shadow-amber-500/10 overflow-hidden rounded-3xl">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-10 text-center text-white">
                <div 
                  className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md"
                >
                  <Star size={40} className="text-white fill-white" />
                </div>
                <h2 className="text-3xl font-black mb-3">Review Page Live!</h2>
                <p className="text-amber-50/80 font-medium max-w-sm mx-auto">Your custom review generator is now active and ready to collect high-quality feedback.</p>
              </div>
              <CardContent className="p-10 space-y-8">
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Generated URL</Label>
                  <div className="flex gap-2 p-1 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="flex-1 px-4 py-3 font-bold text-slate-600 truncate">
                      {generatedUrl}
                    </div>
                    <Button 
                      variant="white"
                      className="rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
                      onClick={() => copyToClipboard(generatedUrl)}
                    >
                      {copied ? <Check className="text-emerald-500 w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      <span className="ml-2 font-bold">{copied ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-4">
                  <Button asChild className="h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-lg transition-all shadow-xl shadow-slate-200">
                    <a href={generatedUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={20} className="mr-3" />
                      View Live Asset
                    </a>
                  </Button>
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant="outline"
                      className="h-12 rounded-xl font-bold border-slate-200"
                      onClick={resetForm}
                    >
                      Create Another
                    </Button>
                    <Link href="/dashboard/seoos" className="w-full">
                      <Button 
                        variant="ghost" 
                        className="h-12 w-full rounded-xl font-bold text-slate-500"
                      >
                        Exit Studio
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <form 
            onSubmit={handleSubmit} 
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20"
          >
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-black">Business Identity</CardTitle>
                      <CardDescription className="font-medium">Primary details and brand positioning.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="font-bold">Business Name</Label>
                      <Input 
                        id="name" 
                        name="name" 
                        placeholder="Enter your business name" 
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="h-11 rounded-xl border-slate-200 focus:ring-amber-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug" className="font-bold">URL Slug</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">/</span>
                        <Input 
                          id="slug" 
                          name="slug" 
                          placeholder="Enter URL slug (e.g. your-business-name)" 
                          value={formData.slug}
                          onChange={handleInputChange}
                          required
                          className="h-11 pl-7 rounded-xl border-slate-200 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="industry" className="font-bold">Industry Segment</Label>
                    <Input 
                      id="industry" 
                      name="industry" 
                      placeholder="Enter your industry segment" 
                      value={formData.industry}
                      onChange={handleInputChange}
                      required
                      className="h-11 rounded-xl border-slate-200 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="font-bold">Core Value Proposition</Label>
                    <Textarea 
                      id="description" 
                      name="description" 
                      placeholder="Describe your business and what makes it stand out" 
                      className="min-h-[100px] rounded-2xl border-slate-200 focus:ring-amber-500 resize-none"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-black">AI Training Data</CardTitle>
                      <CardDescription className="font-medium">Key features for generating authentic reviews.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {formData.key_features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input 
                        placeholder={`Feature highlight #${index + 1}`} 
                        value={feature}
                        onChange={(e) => handleFeatureChange(index, e.target.value)}
                        required
                        className="h-11 rounded-xl border-slate-200"
                      />
                      {formData.key_features.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="shrink-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
                          onClick={() => removeFeatureField(index)}
                        >
                          <Trash2 size={18} />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 rounded-xl h-10 px-4 font-bold border-dashed border-slate-300 text-slate-500"
                    onClick={addFeatureField}
                  >
                    <Plus size={16} className="mr-2" />
                    Add Highlight
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-black">Visual Assets</CardTitle>
                      <CardDescription className="font-medium">Imagery and social connections.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="gmb_link" className="font-bold">Google Business Profile URL</Label>
                    <Input 
                      id="gmb_link" 
                      name="gmb_link" 
                      placeholder="Enter your Google Business Profile URL" 
                      value={formData.gmb_link}
                      onChange={handleInputChange}
                      required
                      className="h-11 rounded-xl border-slate-200"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="hero_url" className="font-bold">Hero Image Reference</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="hero_url" 
                          placeholder="Enter hero image URL" 
                          value={formData.hero_image.startsWith('data:') ? '' : formData.hero_image}
                          onChange={(e) => setFormData(prev => ({ ...prev, hero_image: e.target.value }))}
                          className="h-11 rounded-xl border-slate-200"
                        />
                      </div>
                    </div>

                    <div 
                      className={`
                        relative border-2 border-dashed rounded-2xl transition-all duration-300 flex flex-col items-center justify-center p-8 min-h-[180px]
                        ${formData.hero_image 
                          ? 'border-amber-200 bg-amber-50/30' 
                          : 'border-slate-200 bg-slate-50/50 hover:border-amber-400 hover:bg-amber-50'}
                      `}
                    >
                      {formData.hero_image ? (
                        <div className="relative w-full max-w-sm h-[120px] rounded-xl overflow-hidden shadow-xl shadow-amber-500/10 border-4 border-white group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={formData.hero_image} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button 
                              type="button" 
                              variant="destructive" 
                              size="sm" 
                              className="rounded-full font-bold"
                              onClick={() => setFormData(prev => ({ ...prev, hero_image: '' }))}
                            >
                              <Trash2 size={16} className="mr-2" />
                              Remove Image
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center group pointer-events-none">
                          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                            <Plus size={24} className="text-amber-500" />
                          </div>
                          <p className="text-amber-600 font-black text-sm mb-1 uppercase tracking-tight">Drop Custom Asset</p>
                          <p className="text-slate-400 text-xs font-medium">JPG, PNG or WEBP (Max 2MB)</p>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files[0]
                          if (file) handleImageUpload(file)
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Palette className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-black">Brand Styling</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-3">
                    <Label className="font-bold flex items-center justify-between">
                      Primary Color
                      <Badge variant="outline" className="font-mono text-[10px]">{formData.brand_color}</Badge>
                    </Label>
                    <div className="flex gap-3">
                      <div className="relative w-12 h-12 shrink-0 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
                        <input 
                          type="color" 
                          value={formData.brand_color} 
                          onChange={(e) => setFormData(prev => ({ ...prev, brand_color: e.target.value }))}
                          className="absolute inset-0 w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                        />
                      </div>
                      <Input 
                        value={formData.brand_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, brand_color: e.target.value }))}
                        className="h-12 rounded-xl font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold flex items-center justify-between">
                      Accent Color
                      <Badge variant="outline" className="font-mono text-[10px]">{formData.accent_color}</Badge>
                    </Label>
                    <div className="flex gap-3">
                      <div className="relative w-12 h-12 shrink-0 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
                        <input 
                          type="color" 
                          value={formData.accent_color} 
                          onChange={(e) => setFormData(prev => ({ ...prev, accent_color: e.target.value }))}
                          className="absolute inset-0 w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                        />
                      </div>
                      <Input 
                        value={formData.accent_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, accent_color: e.target.value }))}
                        className="h-12 rounded-xl font-mono text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 text-white border-none shadow-2xl shadow-slate-200 rounded-3xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Sparkles size={120} />
                </div>
                <CardHeader className="relative z-10">
                  <CardTitle className="text-xl font-black">Publish Asset</CardTitle>
                  <CardDescription className="text-slate-400 font-medium font-sm">Finalize and deploy your AI review page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 relative z-10">
                  <Button 
                    type="submit" 
                    disabled={submitting} 
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-7 text-xl rounded-2xl shadow-[0_10px_20px_rgba(37,99,235,0.3)] active:scale-95 transition-all"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-3 animate-spin w-6 h-6" />
                        Generating...
                      </>
                    ) : (
                      'Generate Now'
                    )}
                  </Button>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-3">
                    <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Your page will be hosted at <span className="text-white font-bold">review-gen.ringscaleai.com/{formData.slug || 'slug'}</span> instantly after generation.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

