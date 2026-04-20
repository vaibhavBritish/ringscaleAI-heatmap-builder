'use client'

import { useState, useEffect } from 'react'
import { 
  History, 
  ArrowLeft, 
  ExternalLink, 
  Copy, 
  Check, 
  Search,
  Building2,
  Calendar,
  Globe,
  Loader2,
  RefreshCcw,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function ReviewHistoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user?.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [session, status, router])

  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  const fetchClients = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/review-gen/clients')
      if (!response.ok) throw new Error('Failed to fetch assets')
      const data = await response.json()
      setClients(Array.isArray(data) ? data : (data.clients || []))
    } catch (err) {
      console.error(err)
      toast.error('Failed to load review history')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/review-gen/clients', { method: 'PUT' })
      if (!response.ok) throw new Error('Sync failed')
      const result = await response.json()
      toast.success(`Successfully synced ${result.count} assets from server`)
      fetchClients()
    } catch (err) {
      console.error(err)
      toast.error('Failed to sync with server')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('Link copied to clipboard')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredClients = clients.filter(client => 
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/dashboard/seoos/review-generator">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <History className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-900">Review History</h1>
          </div>
          <p className="text-slate-500 font-medium ml-[52px]">Track and manage all AI-generated review assets.</p>
        </div>

        <div className="flex items-center gap-3 ml-[52px] md:ml-0">
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-xl font-bold bg-white text-blue-600 border-blue-100 hover:bg-blue-50"
            onClick={handleSync}
            disabled={loading}
          >
            <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sync with Server
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-xl font-bold bg-white"
            onClick={fetchClients}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
            Refresh
          </Button>
          <Link href="/dashboard/seoos/review-generator">
            <Button size="sm" className="rounded-xl bg-slate-900 hover:bg-black font-bold">
              Create New
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Badge className="bg-blue-500/20 text-blue-400 border-none">Total Generated</Badge>
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-4xl font-black">{clients.length}</p>
            <p className="text-slate-400 text-xs mt-1 font-medium italic">Active Review Assets</p>
          </CardContent>
        </Card>

        <div className="md:col-span-3 flex items-end">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input 
              placeholder="Search by business name, industry, or slug..." 
              className="h-16 pl-12 pr-4 rounded-2xl border-none shadow-sm focus-visible:ring-blue-500 font-medium text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* List */}
      <Card className="border-none shadow-sm overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              <p className="text-slate-500 font-bold">Fetching your assets...</p>
            </div>
          ) : filteredClients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">Business</th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">Identity</th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">Slug / Link</th>
                    <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredClients.map((client) => {
                    const reviewUrl = `https://review-gen.ringscaleai.com/${client.slug}`
                    return (
                      <tr key={client._id || client.slug} className="group hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                              <Building2 className="w-5 h-5 text-slate-500" />
                            </div>
                            <div>
                              <p className="font-black text-slate-900">{client.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                  {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline" className="w-fit font-bold text-[10px] tracking-tight border-slate-200">
                              {client.industry || 'General Business'}
                            </Badge>
                            <p className="text-xs text-slate-500 font-medium line-clamp-1 max-w-[200px]">
                              {client.description || 'No description provided'}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <div className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-black border border-blue-100/50">
                              /{client.slug}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="white" 
                              size="sm" 
                              className="h-9 rounded-lg shadow-sm border border-slate-100 font-bold text-xs"
                              onClick={() => copyToClipboard(reviewUrl, client._id || client.slug)}
                            >
                              {copiedId === (client._id || client.slug) ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              <span className="ml-2">{copiedId === (client._id || client.slug) ? 'Copied' : 'Link'}</span>
                            </Button>
                            <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-blue-50 hover:text-blue-600">
                              <a href={reviewUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-200">
                <Globe className="w-8 h-8 text-slate-300" />
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-slate-900">No Review Assets Found</p>
                <p className="text-slate-500 font-medium text-sm">Start generating AI review pages to see them here.</p>
              </div>
              <Link href="/dashboard/seoos/review-generator" className="mt-2">
                <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 font-bold px-8">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
      
      <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] pb-10">
        Review Generator Engine v1.0 · Powered by Ringscale AI
      </p>
    </div>
  )
}
