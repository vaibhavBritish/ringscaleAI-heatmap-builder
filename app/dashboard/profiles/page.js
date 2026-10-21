'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Store,
  MapPin,
  Star,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Search,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Share2,
  Copy,
  Layers,
  FileText,
  BarChart3,
  Flame,
  Plus
} from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilesListPage() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchProfiles()
  }, [])

  const fetchProfiles = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/profiles')
      const data = await res.json()
      if (data.profiles) {
        setProfiles(data.profiles)
      }
    } catch (err) {
      console.error('Error fetching profiles:', err)
      toast.error('Failed to load profiles')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (portalPath, label) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const full = `${origin}${portalPath}`
    navigator.clipboard.writeText(full)
    toast.success(`${label} copied to clipboard!`)
  }

  const filteredProfiles = profiles.filter(p => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      (p.businessName || '').toLowerCase().includes(q) ||
      (p.slug || '').toLowerCase().includes(q) ||
      (p.address || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-8 md:p-10 text-white shadow-2xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" /> Google Business Profile Hub
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-2">
              Profiles, Posts & Review Hub
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Showcase Google Business Profile posts, verified reviews, and owner responses on dedicated single-page hubs with individual custom slugs for every customer.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/dashboard/projects/new">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/30 gap-2 rounded-xl">
                <Plus className="w-4 h-4" /> Add New Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by business name, category, or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-50 border-slate-200 focus:bg-white rounded-xl text-sm"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Showing <span className="text-slate-900 font-bold">{filteredProfiles.length}</span> profiles
        </div>
      </div>

      {/* Profiles Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-72 rounded-3xl" />
          ))}
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8">
          <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No profiles found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery ? 'Try adjusting your search query.' : 'Create a project or connect a GMB account to view its profile.'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((profile) => {
            return (
              <Card
                key={profile.id}
                className="group relative overflow-hidden border border-slate-200/90 hover:border-blue-400/80 rounded-3xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white flex flex-col justify-between"
              >
                {/* Card Top Accent */}
                <div className="h-2 w-full bg-gradient-to-r from-blue-600 to-indigo-600" />

                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/50 text-[11px] font-semibold px-2 py-0.5 rounded-lg">
                          {profile.category}
                        </Badge>
                        <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          /{profile.slug}
                        </span>
                      </div>
                      <h2 className="text-xl font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {profile.businessName}
                      </h2>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-2 line-clamp-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {profile.address}
                  </p>
                </CardHeader>

                <CardContent className="space-y-5 pt-0">
                  {/* Highlights Grid */}
                  <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 text-amber-500 font-black text-sm">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{profile.avgRating}</span>
                      </div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">
                        {profile.reviewCount} Reviews
                      </div>
                    </div>

                    <div className="border-x border-slate-200/60">
                      <div className="text-emerald-600 font-black text-sm flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{profile.responseRate}%</span>
                      </div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">
                        Replied
                      </div>
                    </div>

                    <div>
                      <div className="text-blue-600 font-black text-sm">
                        {profile.postCount}
                      </div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">
                        GMB Posts
                      </div>
                    </div>
                  </div>

                  {/* Open Profile Hub Action */}
                  <div className="pt-2">
                    <Link href={profile.profileHubUrl} className="block w-full">
                      <Button className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold rounded-xl shadow-md transition-all gap-2 group-hover:shadow-blue-500/20">
                        <span>Open Profile Hub</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </div>

                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
