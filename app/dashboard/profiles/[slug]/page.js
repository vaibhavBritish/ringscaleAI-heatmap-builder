'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Store,
  MapPin,
  Star,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Plus,
  CheckCircle2,
  Clock,
  Eye,
  MousePointerClick,
  Share2,
  Calendar,
  AlertCircle,
  TrendingUp,
  Flame,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Building2,
  BarChart3,
  Search,
  Filter,
  Send,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Copy,
  RefreshCw,
  Phone,
  Globe,
  Layers
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow, format } from 'date-fns'

export default function ProfileSlugPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug

  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState(null)
  const [activeTab, setActiveTab] = useState('posts')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const formatTimeAgo = (date) => {
    if (!mounted || !date) return 'Recently'
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true })
    } catch {
      return 'Recently'
    }
  }

  // Posts State
  const [posts, setPosts] = useState([])
  const [postTypeFilter, setPostTypeFilter] = useState('all')
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [creatingPost, setCreatingPost] = useState(false)
  const [generatingAiPost, setGeneratingAiPost] = useState(false)
  const [newPostData, setNewPostData] = useState({
    title: '',
    content: '',
    postType: 'update',
    ctaType: 'LEARN_MORE',
    ctaUrl: '',
    imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80',
    aiTopic: '',
    aiOffer: ''
  })

  // Reviews & Pagination State
  const [reviews, setReviews] = useState([])
  const [reviewFilter, setReviewFilter] = useState('all') // all | replied | pending | 5 | 4 | 3 | negative
  const [reviewSearch, setReviewSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [paginationInfo, setPaginationInfo] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalOverall: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  })
  const [reviewsLoading, setReviewsLoading] = useState(false)

  const [replyModalOpen, setReplyModalOpen] = useState(false)
  const [activeReviewForReply, setActiveReviewForReply] = useState(null)
  const [replyInputText, setReplyInputText] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [generatingAiReply, setGeneratingAiReply] = useState(false)

  // Profiles list for quick switcher
  const [allProfiles, setAllProfiles] = useState([])

  useEffect(() => {
    if (slug) {
      loadProfileData()
      loadAllProfiles()
    }
  }, [slug])

  const loadProfileData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/profiles/${slug}?page=1&limit=${pageSize}`)
      if (!res.ok) {
        if (res.status === 404) throw new Error('Profile not found')
        throw new Error('Failed to load profile data')
      }
      const data = await res.json()
      setProfileData(data)
      setPosts(data.posts || [])
      setReviews(data.reviews || [])
      if (data.pagination) {
        setPaginationInfo(data.pagination)
        setCurrentPage(data.pagination.page)
      }
    } catch (err) {
      console.error('Error loading profile:', err)
      toast.error(err.message || 'Error loading profile')
    } finally {
      setLoading(false)
    }
  }

  // Fetch paginated reviews dynamically
  const fetchReviewsPage = async (targetPage = 1, targetFilter = reviewFilter, targetSearch = reviewSearch, targetLimit = pageSize) => {
    try {
      setReviewsLoading(true)
      const params = new URLSearchParams({
        page: targetPage.toString(),
        limit: targetLimit.toString(),
        filter: targetFilter,
        search: (targetSearch || '').trim()
      })
      const res = await fetch(`/api/profiles/${slug}?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load reviews')
      const data = await res.json()
      if (data.reviews) {
        setReviews(data.reviews)
      }
      if (data.pagination) {
        setPaginationInfo(data.pagination)
        setCurrentPage(data.pagination.page)
      }
      if (data.filterCounts) {
        setProfileData(prev => ({
          ...prev,
          filterCounts: data.filterCounts,
          metrics: {
            ...(prev?.metrics || {}),
            ...data.metrics,
            filterCounts: data.filterCounts
          }
        }))
      }
    } catch (e) {
      console.warn('Error fetching reviews page:', e)
    } finally {
      setReviewsLoading(false)
    }
  }

  const handlePageChange = (newPage) => {
    if (newPage === currentPage || newPage < 1 || newPage > paginationInfo.totalPages) return
    setCurrentPage(newPage)
    fetchReviewsPage(newPage, reviewFilter, reviewSearch, pageSize)
    const el = document.getElementById('reviews-anchor')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleFilterChange = (newFilter) => {
    setReviewFilter(newFilter)
    setCurrentPage(1)
    fetchReviewsPage(1, newFilter, reviewSearch, pageSize)
  }

  const handlePageSizeChange = (newLimit) => {
    setPageSize(newLimit)
    setCurrentPage(1)
    fetchReviewsPage(1, reviewFilter, reviewSearch, newLimit)
  }

  const getPageNumbers = (current, total) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1)
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total]
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
    }
    return [1, '...', current - 1, current, current + 1, '...', total]
  }

  const loadAllProfiles = async () => {
    try {
      const res = await fetch('/api/profiles')
      const data = await res.json()
      if (data.profiles) {
        setAllProfiles(data.profiles)
      }
    } catch (e) {}
  }

  const copyToClipboard = (label) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const portalUrl = `${origin}${profileData?.navigationLinks?.publicPortal || `/profile/${slug}`}`
    navigator.clipboard.writeText(portalUrl)
    toast.success(`${label} copied to clipboard!`)
  }

  // Handle Create Post
  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!newPostData.content.trim()) {
      toast.error('Post content is required')
      return
    }

    setCreatingPost(true)
    try {
      const res = await fetch(`/api/profiles/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_post',
          projectId: profileData?.project?.id,
          title: newPostData.title || `${profileData?.project?.businessName} Update`,
          content: newPostData.content,
          postType: newPostData.postType,
          ctaType: newPostData.ctaType,
          ctaUrl: newPostData.ctaUrl || profileData?.navigationLinks?.externalGmb,
          imageUrl: newPostData.imageUrl,
          status: 'published'
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create post')

      setPosts([data.post, ...posts])
      toast.success('GMB Post published successfully!')
      setIsCreatePostOpen(false)
      setNewPostData({
        title: '',
        content: '',
        postType: 'update',
        ctaType: 'LEARN_MORE',
        ctaUrl: '',
        imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80',
        aiTopic: '',
        aiOffer: ''
      })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCreatingPost(false)
    }
  }

  // Handle AI Generate Post
  const handleGenerateAiPost = async () => {
    setGeneratingAiPost(true)
    try {
      const res = await fetch(`/api/profiles/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_ai_post',
          businessName: profileData?.project?.businessName,
          category: profileData?.project?.primaryType,
          location: profileData?.project?.address,
          topic: newPostData.aiTopic || 'Special Services & Customer Care',
          offer: newPostData.aiOffer || 'Exclusive Consultation',
          ctaType: newPostData.ctaType
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'AI generation failed')

      setNewPostData(prev => ({
        ...prev,
        title: data.generated.title || prev.title,
        content: data.generated.content || prev.content
      }))
      toast.success('AI crafted a fresh GMB post!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setGeneratingAiPost(false)
    }
  }

  // Open Reply Modal
  const openReplyModal = (review) => {
    setActiveReviewForReply(review)
    setReplyInputText(review.replyText || '')
    setReplyModalOpen(true)
  }

  // Handle AI Generate Reply
  const handleGenerateAiReply = async () => {
    if (!activeReviewForReply) return
    setGeneratingAiReply(true)
    try {
      const res = await fetch(`/api/profiles/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_ai_reply',
          businessName: profileData?.project?.businessName,
          reviewerName: activeReviewForReply.reviewerName,
          rating: activeReviewForReply.rating,
          reviewText: activeReviewForReply.comment
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'AI reply failed')

      setReplyInputText(data.reply)
      toast.success('AI drafted an authentic owner response!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setGeneratingAiReply(false)
    }
  }

  // Submit Review Reply
  const handleSubmitReply = async () => {
    if (!activeReviewForReply || !replyInputText.trim()) {
      toast.error('Reply text cannot be empty')
      return
    }

    setSubmittingReply(true)
    try {
      const res = await fetch(`/api/profiles/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply_review',
          reviewId: activeReviewForReply.id,
          replyText: replyInputText.trim(),
          repliedBy: `${profileData?.project?.businessName || 'Business'} (Owner)`
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit reply')

      // Update reviews state
      setReviews(prev => prev.map(r => {
        if (r.id === activeReviewForReply.id) {
          return {
            ...r,
            replyText: replyInputText.trim(),
            repliedAt: new Date(),
            repliedBy: `${profileData?.project?.businessName || 'Business'} (Owner)`,
            replyStatus: 'replied'
          }
        }
        return r
      }))

      toast.success('Reply published to Google review!')
      setReplyModalOpen(false)
      setActiveReviewForReply(null)
      setReplyInputText('')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmittingReply(false)
    }
  }

  // Filter Posts
  const filteredPosts = posts.filter(p => {
    if (postTypeFilter === 'all') return true
    return p.postType === postTypeFilter
  })

  // Reviews are dynamically filtered and paginated on the server
  const displayedReviews = reviews

  if (loading && !profileData) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        <Skeleton className="h-48 rounded-3xl" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => (
            <Skeleton key={n} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    )
  }

  if (!loading && !profileData) {
    return (
      <div className="text-center py-24 bg-white rounded-3xl border border-slate-200/80 p-8 max-w-lg mx-auto my-12 shadow-sm">
        <Store className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-800">Profile Not Found</h3>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          The requested profile &quot;{slug}&quot; could not be found or has not been synced yet.
        </p>
        <Link href="/dashboard/profiles">
          <Button className="bg-slate-900 hover:bg-blue-600 text-white font-bold rounded-xl">
            Back to Profiles List
          </Button>
        </Link>
      </div>
    )
  }

  const project = profileData?.project || {}
  const metrics = profileData?.metrics || {}
  const navLinks = profileData?.navigationLinks || {}
  const filterCounts = profileData?.filterCounts || metrics?.filterCounts || {
    all: metrics.totalReviews || 0,
    pending: metrics.pendingCount || 0,
    replied: metrics.repliedCount || 0,
    fiveStar: metrics.ratingDistribution?.[5] || 0,
    fourStar: metrics.ratingDistribution?.[4] || 0,
    threeStar: metrics.ratingDistribution?.[3] || 0,
    critical: ((metrics.ratingDistribution?.[1] || 0) + (metrics.ratingDistribution?.[2] || 0)) || 0
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* ─── 1. TOP HEADER & PROFILE BANNER ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl p-6 md:p-8">
        {/* Glow Gradients */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4 md:gap-6">
            {/* Avatar / Brand Icon */}
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl md:text-3xl shadow-xl shadow-blue-500/20 shrink-0 border border-white/10">
              {project.businessName?.charAt(0) || 'G'}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-xs font-semibold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  Verified Google Profile
                </Badge>

                <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-md border border-slate-700/60">
                  slug: /{slug}
                </span>

                {project.primaryType && (
                  <Badge variant="outline" className="border-slate-700 text-slate-300 text-xs">
                    {project.primaryType}
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white">
                {project.businessName}
              </h1>

              <div className="flex items-center gap-4 text-xs md:text-sm text-slate-400 flex-wrap">
                {project.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {project.address}
                  </span>
                )}
                <div className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>{metrics.averageRating || '0.0'}</span>
                  <span className="text-slate-400 font-normal">({metrics.totalReviews || 0} reviews)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Profile Switcher & Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {allProfiles.length > 1 && (
              <Select
                value={slug}
                onValueChange={(newSlug) => router.push(`/dashboard/profiles/${newSlug}`)}
              >
                <SelectTrigger className="w-full sm:w-[220px] bg-slate-800/90 border-slate-700 text-white rounded-xl text-xs h-10">
                  <SelectValue placeholder="Switch Profile..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  {allProfiles.map((p) => (
                    <SelectItem key={p.slug} value={p.slug} className="text-xs hover:bg-slate-800">
                      {p.businessName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard('Client Portal Link')}
              className="bg-slate-800/80 border-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs h-10 gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5 text-blue-400" />
              Copy Slug Link
            </Button>

            <Link href={navLinks.publicPortal || `/profile/${slug}`} target="_blank">
              <Button
                size="sm"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs h-10 gap-1.5 shadow-lg shadow-blue-600/30"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Live Client Portal
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── 2. KEY METRICS RIBBON ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Rating Card */}
        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-white p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Google Rating</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{metrics.averageRating}</span>
            <span className="text-sm font-semibold text-slate-400">/ 5.0</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Based on {metrics.totalReviews} verified Google reviews</p>
        </Card>

        {/* Response Rate Card */}
        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-white p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Response Rate</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600">{metrics.responseRate}%</span>
            <span className="text-xs font-bold text-slate-400">Replied</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
            <span>{metrics.repliedCount} Replied</span>
            <span className="text-amber-600 font-bold">{metrics.pendingCount} Pending</span>
          </div>
        </Card>

        {/* GMB Posts Card */}
        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-white p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">GMB Posts</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{metrics.totalPosts}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Published
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Regular updates posted on Google</p>
        </Card>

        {/* Post Engagement Card */}
        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-white p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Post Views & Clicks</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{metrics.totalPostViews?.toLocaleString()}</span>
            <span className="text-xs text-slate-400">views</span>
          </div>
          <p className="text-xs text-purple-600 font-semibold mt-1">
            {metrics.totalPostClicks?.toLocaleString()} customer CTA clicks
          </p>
        </Card>
      </div>

      {/* ─── 3. QUICK NAVIGATION HUB ("INFORMATION ON ANOTHER PAGES") ─── */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 p-6 rounded-3xl border border-slate-200/90 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              Connected Information Pages
            </h2>
            <p className="text-xs text-slate-500">
              Access deep audits, rankings, and marketing assets generated for this profile
            </p>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-100/70 px-2.5 py-1 rounded-full">
            Single-Page Hub
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 pt-1">
          {/* Heatmap Link */}
          <Link href={navLinks.heatmapScans || '/dashboard/projects'} className="group">
            <div className="bg-white hover:bg-blue-600 hover:text-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm transition-all duration-200 text-center flex flex-col items-center justify-center gap-1.5 h-full">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-white/20 group-hover:text-white flex items-center justify-center transition-colors">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="text-xs font-black">Heatmap Scans</span>
              <span className="text-[10px] text-slate-400 group-hover:text-white/80">Local Rank Grid</span>
            </div>
          </Link>

          {/* Audit Link */}
          <Link href={navLinks.seoAudit || '/dashboard/audit'} className="group">
            <div className="bg-white hover:bg-indigo-600 hover:text-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm transition-all duration-200 text-center flex flex-col items-center justify-center gap-1.5 h-full">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-white/20 group-hover:text-white flex items-center justify-center transition-colors">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-black">SEO Audit</span>
              <span className="text-[10px] text-slate-400 group-hover:text-white/80">Health Report</span>
            </div>
          </Link>

          {/* Citations Link */}
          <Link href={navLinks.citations || '/dashboard/citations'} className="group">
            <div className="bg-white hover:bg-amber-600 hover:text-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm transition-all duration-200 text-center flex flex-col items-center justify-center gap-1.5 h-full">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-white/20 group-hover:text-white flex items-center justify-center transition-colors">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-black">Citations</span>
              <span className="text-[10px] text-slate-400 group-hover:text-white/80">Directory Sync</span>
            </div>
          </Link>

          {/* External GMB Maps Link */}
          <Link href={navLinks.externalGmb || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.businessName || slug)}`} target="_blank" className="group">
            <div className="bg-white hover:bg-rose-600 hover:text-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm transition-all duration-200 text-center flex flex-col items-center justify-center gap-1.5 h-full">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-white/20 group-hover:text-white flex items-center justify-center transition-colors">
                <ExternalLink className="w-4 h-4" />
              </div>
              <span className="text-xs font-black">Google Maps</span>
              <span className="text-[10px] text-slate-400 group-hover:text-white/80">Live GMB Page</span>
            </div>
          </Link>
        </div>
      </div>

      {/* ─── 4. MAIN WORKSPACE TABS: POSTS & REVIEWS ─── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <TabsList className="bg-slate-100 p-1 rounded-2xl h-12 w-full sm:w-auto">
            <TabsTrigger
              value="posts"
              className="rounded-xl px-6 font-bold text-sm data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm flex items-center gap-2"
            >
              <Store className="w-4 h-4" />
              <span>GMB Posts ({posts.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="rounded-xl px-6 font-bold text-sm data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Reviews & Replies ({metrics.totalReviews || reviews.length})</span>
              {reviews.filter(r => r.replyStatus === 'pending' || !r.replyText).length > 0 && (
                <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {reviews.filter(r => r.replyStatus === 'pending' || !r.replyText).length} pending
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {activeTab === 'posts' && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsCreatePostOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md shadow-blue-600/20 gap-2 h-10 px-4"
              >
                <Plus className="w-4 h-4" /> Create GMB Post
              </Button>
            </div>
          )}
        </div>

        {/* ─── TAB 1: GMB POSTS CONTENT ─── */}
        <TabsContent value="posts" className="space-y-6 mt-0">
          {/* Post Type Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setPostTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${postTypeFilter === 'all' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                All Posts ({posts.length})
              </button>
              <button
                onClick={() => setPostTypeFilter('update')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${postTypeFilter === 'update' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Updates ({posts.filter(p => p.postType === 'update').length})
              </button>
              <button
                onClick={() => setPostTypeFilter('offer')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${postTypeFilter === 'offer' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Offers & Promos ({posts.filter(p => p.postType === 'offer').length})
              </button>
              <button
                onClick={() => setPostTypeFilter('event')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${postTypeFilter === 'event' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Events ({posts.filter(p => p.postType === 'event').length})
              </button>

            </div>

            <div className="text-xs text-slate-400 font-medium">
              Customers can view published GMB posts directly on Google Search & Maps
            </div>
          </div>

          {/* Posts Grid */}
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8">
              <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">No posts in this category</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                Create a new update, special offer, or event post to show customers your active posting work.
              </p>
              <Button
                onClick={() => setIsCreatePostOpen(true)}
                className="mt-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Create First Post
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <Card
                  key={post.id}
                  className="rounded-3xl border border-slate-200/90 overflow-hidden hover:border-blue-400/80 transition-all duration-200 hover:shadow-xl bg-white flex flex-col justify-between"
                >
                  <div>
                    {/* Media Image */}
                    {post.imageUrl && (
                      <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                        <img
                          src={post.imageUrl}
                          alt={post.title || 'GMB Post'}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80'
                          }}
                        />
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <Badge className="bg-slate-900/80 backdrop-blur-md text-white border-0 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5">
                            {post.postType}
                          </Badge>
                          <Badge className="bg-emerald-500 text-white border-0 text-[11px] font-bold px-2 py-0.5 flex items-center gap-1 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            Live on Google
                          </Badge>
                        </div>
                      </div>
                    )}

                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatTimeAgo(post.publishedAt)}
                        </span>
                        <span className="font-semibold text-slate-500">Google Business Post</span>
                      </div>
                      <h3 className="text-base font-black text-slate-900 line-clamp-2 leading-snug">
                        {post.title}
                      </h3>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-0">
                      <p className="text-xs md:text-sm text-slate-600 whitespace-pre-line leading-relaxed line-clamp-4">
                        {post.content}
                      </p>

                      {post.ctaType && (
                        <div className="pt-1">
                          <Link href={post.ctaUrl || navLinks.externalGmb || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.businessName || slug)}`} target="_blank">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs font-bold text-blue-600 border-blue-200 hover:bg-blue-50 rounded-xl gap-1.5 h-9"
                            >
                              <span>{post.ctaType.replace(/_/g, ' ')}</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </div>

                  {/* Post Metrics Footer */}
                  <div className="border-t border-slate-100 bg-slate-50/70 p-3.5 px-6 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold text-slate-700">{post.views || 0}</span> views
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MousePointerClick className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold text-slate-700">{post.clicks || 0}</span> clicks
                    </div>
                    <div className="font-bold text-emerald-600">
                      {post.views > 0 ? `${((post.clicks / post.views) * 100).toFixed(1)}%` : '0%'} CTR
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── TAB 2: REVIEWS & REPLIES CONTENT ─── */}
        <TabsContent value="reviews" className="space-y-6 mt-0">
          {/* Reviews Rating Breakdown Header */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="text-center md:border-r border-slate-200/80 pr-6">
                <div className="text-4xl md:text-5xl font-black text-slate-900 leading-none">
                  {metrics.averageRating}
                </div>
                <div className="flex items-center justify-center gap-0.5 text-amber-400 my-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${star <= Math.round(metrics.averageRating) ? 'fill-amber-400' : 'text-slate-300'}`}
                    />
                  ))}
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {metrics.totalReviews} Total Reviews
                </div>
              </div>

              {/* Star Distribution Bars */}
              <div className="space-y-1.5 w-48 sm:w-64 text-xs font-semibold text-slate-600">
                {[5, 4, 3, 2, 1].map((s) => {
                  const count = metrics.ratingDistribution?.[s] || 0
                  const pct = metrics.totalReviews > 0 ? Math.round((count / metrics.totalReviews) * 100) : 0
                  return (
                    <div key={s} className="flex items-center gap-2">
                      <span className="w-5 text-right font-bold text-slate-500">{s}★</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-[11px] text-slate-400">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Response Rate Summary Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-2xl border border-emerald-100 text-center w-full md:w-64">
              <div className="text-xs font-black uppercase text-emerald-800 tracking-wider mb-1">
                Owner Response Rate
              </div>
              <div className="text-3xl font-black text-emerald-600">
                {metrics.responseRate}%
              </div>
              <p className="text-[11px] text-emerald-700 mt-1">
                {metrics.repliedCount} of {metrics.totalReviews} reviews responded to
              </p>
              {metrics.pendingCount > 0 && (
                <div className="mt-2 text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full inline-block">
                  ⚠️ {metrics.pendingCount} need replies
                </div>
              )}
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold w-full sm:w-auto">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${reviewFilter === 'all' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                All ({filterCounts.all})
              </button>
              <button
                onClick={() => handleFilterChange('pending')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${reviewFilter === 'pending' ? 'bg-white text-amber-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <AlertCircle className="w-3 h-3 text-amber-500" />
                Needs Reply ({filterCounts.pending})
              </button>
              <button
                onClick={() => handleFilterChange('replied')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${reviewFilter === 'replied' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Replied ({filterCounts.replied})
              </button>
              <button
                onClick={() => handleFilterChange('5')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors ${reviewFilter === '5' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                5★ ({filterCounts.fiveStar})
              </button>
              <button
                onClick={() => handleFilterChange('4')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors ${reviewFilter === '4' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                4★ ({filterCounts.fourStar})
              </button>
              <button
                onClick={() => handleFilterChange('3')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors ${reviewFilter === '3' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                3★ ({filterCounts.threeStar})
              </button>
              <button
                onClick={() => handleFilterChange('negative')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors ${reviewFilter === 'negative' ? 'bg-white text-rose-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Critical (≤2★) ({filterCounts.critical})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                placeholder="Search reviews..."
                value={reviewSearch}
                onChange={(e) => {
                  const val = e.target.value
                  setReviewSearch(val)
                  setCurrentPage(1)
                  fetchReviewsPage(1, reviewFilter, val, pageSize)
                }}
                className="pl-9 bg-slate-50 border-slate-200 text-xs h-9 rounded-xl"
              />
            </div>
          </div>

          <div id="reviews-anchor" />

          {/* Google Maps Live Sync Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs text-slate-500">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Google Places Live Sync
              </Badge>
              <span>
                Showing <strong>{(paginationInfo.page - 1) * paginationInfo.limit + 1} - {Math.min(paginationInfo.page * paginationInfo.limit, paginationInfo.total)}</strong> of <strong>{paginationInfo.total}</strong> reviews • Synced with <strong>{metrics.totalReviews} total reviews</strong> on Google Maps ({metrics.averageRating}★)
              </span>
            </div>
            {navLinks.externalGmb && (
              <a
                href={navLinks.externalGmb}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 shrink-0"
              >
                View all on Google Maps
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Reviews List */}
          {displayedReviews.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">No reviews found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                No reviews match your current filter criteria.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedReviews.map((review) => {
                const hasReply = !!review.replyText
                return (
                  <Card
                    key={review.id}
                    className={`rounded-3xl border transition-all duration-200 bg-white shadow-sm overflow-hidden ${
                      hasReply ? 'border-slate-200/90' : 'border-amber-300/80 ring-1 ring-amber-100'
                    }`}
                  >
                    <CardContent className="p-6 space-y-4">
                      {/* Reviewer Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {review.reviewerPhoto ? (
                            <img
                              src={review.reviewerPhoto}
                              alt={review.reviewerName}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 font-black flex items-center justify-center text-sm border border-blue-200">
                              {review.reviewerName?.charAt(0) || 'G'}
                            </div>
                          )}

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-slate-900 text-sm">{review.reviewerName}</h4>
                              <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] py-0 px-1.5 font-medium">
                                Google Review
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex items-center text-amber-400">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-amber-400' : 'text-slate-200'}`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-slate-400">
                                {formatTimeAgo(review.reviewDate)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {hasReply ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs py-1 px-3 flex items-center gap-1.5 rounded-xl">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              Replied by Business
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs py-1 px-3 flex items-center gap-1.5 rounded-xl">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                              Awaiting Owner Reply
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Customer Review Comment */}
                      <p className="text-slate-700 text-sm md:text-base leading-relaxed pl-1">
                        "{review.comment}"
                      </p>

                      {/* ─── OWNER REPLY BOX ─── */}
                      {hasReply ? (
                        <div className="ml-2 sm:ml-6 mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 relative">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                            <span className="flex items-center gap-1.5 text-blue-600">
                              <Store className="w-3.5 h-3.5" />
                              Response from {review.repliedBy || `${project.businessName} (Owner)`}
                            </span>
                            <div className="flex items-center gap-3 text-slate-400 font-normal">
                              <span>
                                {formatTimeAgo(review.repliedAt)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openReplyModal(review)}
                                className="h-6 px-2 text-[11px] text-slate-500 hover:text-blue-600 gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                Edit Reply
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                            {review.replyText}
                          </p>
                        </div>
                      ) : (
                        <div className="ml-2 sm:ml-6 mt-2 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="text-xs text-amber-800">
                            <span className="font-bold">No reply published yet.</span> Replying to customer reviews increases Google local ranking authority.
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button
                              size="sm"
                              onClick={() => openReplyModal(review)}
                              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold h-8 flex-1 sm:flex-none gap-1"
                            >
                              <Send className="w-3 h-3" />
                              Reply Now
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setActiveReviewForReply(review)
                                setReplyModalOpen(true)
                                setTimeout(() => handleGenerateAiReply(), 100)
                              }}
                              className="bg-white border-amber-300 text-amber-900 hover:bg-amber-50 rounded-xl text-xs font-bold h-8 flex-1 sm:flex-none gap-1"
                            >
                              <Sparkles className="w-3 h-3 text-amber-600" />
                              AI Draft Reply
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* ─── PAGINATION CONTROLS ─── */}
          {paginationInfo.totalPages > 1 && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              {/* Left: Summary & Per-Page Selector */}
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span>
                  Showing{' '}
                  <strong className="text-slate-900 font-bold">
                    {(paginationInfo.page - 1) * paginationInfo.limit + 1}
                  </strong>{' '}
                  to{' '}
                  <strong className="text-slate-900 font-bold">
                    {Math.min(paginationInfo.page * paginationInfo.limit, paginationInfo.total)}
                  </strong>{' '}
                  of{' '}
                  <strong className="text-slate-900 font-bold">
                    {paginationInfo.total}
                  </strong>{' '}
                  reviews
                </span>

                <span className="text-slate-300">|</span>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="bg-slate-50 border border-slate-200 rounded-lg text-xs py-1 px-2 text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {/* Right: Page Buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={paginationInfo.page <= 1 || reviewsLoading}
                  onClick={() => handlePageChange(1)}
                  className="h-8 px-2.5 text-xs rounded-lg text-slate-600 hover:text-slate-900 border-slate-200 disabled:opacity-40"
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={paginationInfo.page <= 1 || reviewsLoading}
                  onClick={() => handlePageChange(paginationInfo.page - 1)}
                  className="h-8 px-2.5 text-xs rounded-lg text-slate-600 hover:text-slate-900 border-slate-200 disabled:opacity-40 flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </Button>

                {/* Page Numbers Window */}
                <div className="flex items-center gap-1 mx-1">
                  {getPageNumbers(paginationInfo.page, paginationInfo.totalPages).map((p, idx) => {
                    if (p === '...') {
                      return (
                        <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-400 text-xs font-bold">
                          …
                        </span>
                      )
                    }
                    const isCurrent = p === paginationInfo.page
                    return (
                      <button
                        key={p}
                        disabled={reviewsLoading}
                        onClick={() => handlePageChange(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                          isCurrent
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={paginationInfo.page >= paginationInfo.totalPages || reviewsLoading}
                  onClick={() => handlePageChange(paginationInfo.page + 1)}
                  className="h-8 px-2.5 text-xs rounded-lg text-slate-600 hover:text-slate-900 border-slate-200 disabled:opacity-40 flex items-center gap-1"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={paginationInfo.page >= paginationInfo.totalPages || reviewsLoading}
                  onClick={() => handlePageChange(paginationInfo.totalPages)}
                  className="h-8 px-2.5 text-xs rounded-lg text-slate-600 hover:text-slate-900 border-slate-200 disabled:opacity-40"
                >
                  Last
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── MODAL 1: CREATE GMB POST ─── */}
      <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
        <DialogContent className="max-w-xl rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Store className="w-5 h-5 text-blue-600" />
              Publish Google Business Profile Post
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Post updates, promotions, or events for {project.businessName}. Posts will appear directly on Google Maps and Search.
            </DialogDescription>
          </DialogHeader>

          {/* AI Helper Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                AI Content Assistant
              </span>
              <Button
                size="sm"
                type="button"
                onClick={handleGenerateAiPost}
                disabled={generatingAiPost}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl h-7 px-3 gap-1 shadow-sm"
              >
                {generatingAiPost ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                ✨ Write Post with AI
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Input
                placeholder="Topic (e.g. Spring special, new equipment)..."
                value={newPostData.aiTopic}
                onChange={(e) => setNewPostData({ ...newPostData, aiTopic: e.target.value })}
                className="h-8 bg-white border-blue-200 text-xs rounded-lg"
              />
              <Input
                placeholder="Special Offer (e.g. 15% off first visit)..."
                value={newPostData.aiOffer}
                onChange={(e) => setNewPostData({ ...newPostData, aiOffer: e.target.value })}
                className="h-8 bg-white border-blue-200 text-xs rounded-lg"
              />
            </div>
          </div>

          <form onSubmit={handleCreatePost} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Post Type</label>
                <Select
                  value={newPostData.postType}
                  onValueChange={(val) => setNewPostData({ ...newPostData, postType: val })}
                >
                  <SelectTrigger className="rounded-xl text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="update">What's New (Update)</SelectItem>
                    <SelectItem value="offer">Special Offer / Promotion</SelectItem>
                    <SelectItem value="event">Upcoming Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Call to Action (CTA)</label>
                <Select
                  value={newPostData.ctaType}
                  onValueChange={(val) => setNewPostData({ ...newPostData, ctaType: val })}
                >
                  <SelectTrigger className="rounded-xl text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LEARN_MORE">Learn More</SelectItem>
                    <SelectItem value="CALL_NOW">Call Now</SelectItem>
                    <SelectItem value="BOOK">Book Online</SelectItem>
                    <SelectItem value="SIGN_UP">Sign Up</SelectItem>
                    <SelectItem value="ORDER">Order Now</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Post Title / Headline</label>
              <Input
                placeholder="Catchy headline for Google Maps..."
                value={newPostData.title}
                onChange={(e) => setNewPostData({ ...newPostData, title: e.target.value })}
                className="rounded-xl text-xs h-9"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Post Content *</label>
              <Textarea
                placeholder="Write your GMB post text, promotions, or click 'Write Post with AI' above..."
                rows={5}
                value={newPostData.content}
                onChange={(e) => setNewPostData({ ...newPostData, content: e.target.value })}
                className="rounded-xl text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Image URL</label>
                <Input
                  placeholder="https://..."
                  value={newPostData.imageUrl}
                  onChange={(e) => setNewPostData({ ...newPostData, imageUrl: e.target.value })}
                  className="rounded-xl text-xs h-9"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">CTA Action Link</label>
                <Input
                  placeholder="https://... (defaults to website or GMB)"
                  value={newPostData.ctaUrl}
                  onChange={(e) => setNewPostData({ ...newPostData, ctaUrl: e.target.value })}
                  className="rounded-xl text-xs h-9"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreatePostOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creatingPost}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold gap-1.5"
              >
                {creatingPost && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Publish on Google
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 2: REPLY TO REVIEW ─── */}
      <Dialog open={replyModalOpen} onOpenChange={setReplyModalOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Reply to Customer Review
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Your response will appear publicly under the review on Google Maps.
            </DialogDescription>
          </DialogHeader>

          {activeReviewForReply && (
            <div className="space-y-4">
              {/* Customer Review Summary */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{activeReviewForReply.reviewerName}</span>
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${s <= activeReviewForReply.rating ? 'fill-amber-400' : 'text-slate-200'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600 italic">"{activeReviewForReply.comment}"</p>
              </div>

              {/* AI Auto-Suggest Button */}
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Official Owner Response</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateAiReply}
                  disabled={generatingAiReply}
                  className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-bold h-7 rounded-lg gap-1"
                >
                  {generatingAiReply ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  ✨ AI Auto-Draft Reply
                </Button>
              </div>

              <Textarea
                placeholder="Thank the customer, address any concerns, and sign off warmly..."
                rows={5}
                value={replyInputText}
                onChange={(e) => setReplyInputText(e.target.value)}
                className="rounded-2xl text-xs"
              />

              <div className="text-[11px] text-slate-400">
                Signing as: <strong className="text-slate-700">{project.businessName} (Owner)</strong>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReplyModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmitReply}
                  disabled={submittingReply}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold gap-1.5"
                >
                  {submittingReply && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save & Publish Reply
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
