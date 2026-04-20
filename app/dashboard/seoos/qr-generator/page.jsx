'use client'

import { useState, useEffect } from 'react'
import { 
  QrCode, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Check, 
  Download, 
  TrendingUp, 
  Link as LinkIcon,
  Sparkles,
  ArrowLeft,
  Loader2,
  RefreshCcw,
  Globe
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function QrGeneratorPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user?.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [session, status, router])

  const [qrs, setQrs] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    targetUrl: ''
  })

  // Preview State
  const [appUrl, setAppUrl] = useState('')

  useEffect(() => {
    setAppUrl(window.location.origin)
    fetchQrs()
  }, [])

  const fetchQrs = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/seoos/qr')
      const data = await res.json()
      setQrs(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load QR codes')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.targetUrl) return

    try {
      setSubmitting(true)
      const response = await fetch('/api/seoos/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to create QR code')
      
      toast.success('QR Code created successfully!')
      setFormData({ name: '', targetUrl: '' })
      fetchQrs()
    } catch (err) {
      toast.error('Error creating QR code')
    } finally {
      setSubmitting(false)
    }
  }

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('Link copied!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const downloadQR = (shortId, name) => {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(`${appUrl}/q/${shortId}`)}`
    const link = document.createElement('a')
    link.href = url
    link.download = `QR-${name.replace(/\s+/g, '-')}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-900">QR Generator</h1>
          </div>
          <p className="text-slate-500 font-medium ml-[52px]">Create trackable, dynamic QR codes for any destination.</p>
        </div>

        <div className="flex items-center gap-3 ml-[52px] md:ml-0">
           <Button variant="outline" className="rounded-xl font-bold bg-white" onClick={fetchQrs} disabled={loading}>
            <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="studio" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-2xl mb-8">
          <TabsTrigger value="studio" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
            QR Studio
          </TabsTrigger>
          <TabsTrigger value="library" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
            My Library
          </TabsTrigger>
        </TabsList>

        <TabsContent value="studio">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <CardTitle className="text-lg font-black">Configure QR Code</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="name" className="font-bold text-slate-700">QR Name / Label</Label>
                      <Input 
                        id="name"
                        placeholder="e.g. Summer Promo 2025"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="targetUrl" className="font-bold text-slate-700">Destination URL</Label>
                      <div className="relative">
                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                          id="targetUrl"
                          type="url"
                          placeholder="https://your-website.com/promo"
                          value={formData.targetUrl}
                          onChange={(e) => setFormData({...formData, targetUrl: e.target.value})}
                          className="h-12 pl-12 rounded-xl border-slate-200 focus:ring-indigo-500"
                          required
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium px-1">Tip: Use a URL that generates leads or points to your offer page.</p>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={submitting} 
                      className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95"
                    >
                      {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Generate Dynamic QR'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-none shadow-xl bg-slate-900 text-white rounded-3xl overflow-hidden sticky top-8">
                <CardHeader>
                  <CardTitle className="text-lg font-black">Live Preview</CardTitle>
                  <CardDescription className="text-slate-400">Scan to test redirected link.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center pb-8">
                  <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl mb-6">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(formData.targetUrl || appUrl)}`}
                      alt="QR Preview"
                      className="w-48 h-48"
                    />
                  </div>
                  <div className="text-center space-y-2 px-4">
                    <p className="text-xs font-black uppercase tracking-widest text-indigo-400">Tracking Enabled</p>
                    <p className="text-sm font-medium text-slate-300 break-all leading-relaxed">
                      {formData.targetUrl ? formData.targetUrl : 'https://your-destination-link.com'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="library">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                  <p className="text-slate-500 font-bold">Loading your library...</p>
                </div>
              ) : qrs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">QR Asset</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Destination</th>
                        <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Scans</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {qrs.map((qr) => (
                        <tr key={qr._id} className="group hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                                <QrCode className="w-5 h-5 text-indigo-600" />
                              </div>
                              <div>
                                <p className="font-black text-slate-900 leading-none mb-1">{qr.name}</p>
                                <p className="text-[10px] font-bold text-slate-400">ID: {qr.shortId}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600">
                                <Globe className="w-3 h-3" />
                                {qr.targetUrl}
                              </div>
                              <p className="text-[10px] text-slate-400 font-medium">Redirects via {appUrl}/q/{qr.shortId}</p>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="text-xl font-black text-slate-900 leading-none">{qr.scans || 0}</span>
                              <span className="text-[9px] font-bold text-emerald-500 uppercase flex items-center gap-0.5 mt-1">
                                <TrendingUp className="w-2.5 h-2.5" /> Total Scans
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                variant="white" 
                                size="sm" 
                                className="h-9 rounded-lg border-slate-100 shadow-sm"
                                onClick={() => copyToClipboard(`${appUrl}/q/${qr.shortId}`, qr._id)}
                              >
                                {copiedId === qr._id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                <span className="ml-2 font-bold text-xs">{copiedId === qr._id ? 'Copied' : 'Link'}</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                onClick={() => downloadQR(qr.shortId, qr.name)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 gap-4 px-6 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-slate-200">
                    <QrCode className="w-10 h-10 text-slate-200" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-900">No assets found</p>
                    <p className="text-slate-500 font-medium">Your generated QR codes will appear here for tracking.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
