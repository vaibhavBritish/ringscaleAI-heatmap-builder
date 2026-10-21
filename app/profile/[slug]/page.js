'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Store,
  MapPin,
  Star,
  MessageSquare,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Share2,
  TrendingUp,
  ShieldCheck,
  Eye,
  MousePointerClick,
  ArrowRight,
  Phone,
  Globe,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

export default function PublicClientProfilePage() {
  const { slug } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('posts')
  const [mounted, setMounted] = useState(false)

  // Reviews Pagination State
  const [reviewsList, setReviewsList] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [paginationInfo, setPaginationInfo] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  })
  const [reviewsLoading, setReviewsLoading] = useState(false)

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

  useEffect(() => {
    if (slug) {
      fetch(`/api/profiles/${slug}?page=1&limit=10`)
        .then(res => {
          if (!res.ok) throw new Error('Profile not found')
          return res.json()
        })
        .then(d => {
          setData(d)
          setReviewsList(d.reviews || [])
          if (d.pagination) {
            setPaginationInfo(d.pagination)
            setCurrentPage(d.pagination.page)
          }
          setLoading(false)
        })
        .catch(err => {
          setError(err.message)
          setLoading(false)
        })
    }
  }, [slug])

  const fetchReviewsPage = async (targetPage = 1) => {
    try {
      setReviewsLoading(true)
      const res = await fetch(`/api/profiles/${slug}?page=${targetPage}&limit=10`)
      if (!res.ok) throw new Error('Failed to load reviews')
      const d = await res.json()
      if (d.reviews) {
        setReviewsList(d.reviews)
      }
      if (d.pagination) {
        setPaginationInfo(d.pagination)
        setCurrentPage(d.pagination.page)
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
    fetchReviewsPage(newPage)
    const el = document.getElementById('public-reviews-anchor')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
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

  const copyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Profile link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-48 rounded-3xl" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
          <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900">Profile Not Found</h2>
          <p className="text-sm text-slate-500 mt-2">
            The profile you are looking for does not exist or may have been updated.
          </p>
          <Link href="/dashboard/profiles" className="inline-block mt-5">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const { project, metrics, posts = [], reviews = [], navigationLinks = {} } = data

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* ─── Top Brand Header ─── */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-sm">
              R
            </div>
            <span className="font-black text-slate-900 text-sm tracking-tight">Ringscale AI</span>
            <span className="text-xs text-slate-400 font-medium">| Client Performance Portal</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyLink}
              className="rounded-xl text-xs gap-1.5 border-slate-200 h-8"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
            </Button>
            <Link href={navigationLinks.reviewBooster || `/review/${slug}`} target="_blank">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs h-8 gap-1.5 shadow-sm">
                <Star className="w-3.5 h-3.5 fill-white" />
                Leave a Review
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-8 space-y-8">
        {/* Profile Showcase Card */}
        <div className="rounded-3xl bg-slate-900 text-white p-6 md:p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4 md:gap-5">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-3xl flex items-center justify-center shadow-lg border border-white/10 shrink-0">
                {project.businessName?.charAt(0) || 'G'}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-xs">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1 text-blue-400" />
                    Verified Google Profile
                  </Badge>
                  <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-md">
                    slug: /{slug}
                  </span>
                </div>

                <h1 className="text-2xl md:text-3xl font-black text-white">
                  {project.businessName}
                </h1>

                <div className="flex items-center gap-4 text-xs md:text-sm text-slate-400 flex-wrap">
                  {project.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {project.address}
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>{metrics.averageRating}</span>
                    <span className="text-slate-400 font-normal">({metrics.totalReviews} reviews)</span>
                  </div>
                </div>
              </div>
            </div>

            <Link href={navigationLinks.externalGmb || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.businessName || slug)}`} target="_blank">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs gap-1.5 shadow-lg shadow-blue-600/30">
                <ExternalLink className="w-3.5 h-3.5" />
                View on Google Maps
              </Button>
            </Link>
          </div>
        </div>

        {/* Highlights Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
            <span className="text-xs font-bold uppercase text-slate-400">Google Rating</span>
            <div className="text-3xl font-black text-slate-900 mt-1 flex items-center justify-center gap-1">
              <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
              <span>{metrics.averageRating}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">{metrics.totalReviews} Google Reviews</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
            <span className="text-xs font-bold uppercase text-slate-400">Owner Response</span>
            <div className="text-3xl font-black text-emerald-600 mt-1">
              {metrics.responseRate}%
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">{metrics.repliedCount} Reviews Replied</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
            <span className="text-xs font-bold uppercase text-slate-400">Google Posts</span>
            <div className="text-3xl font-black text-slate-900 mt-1">
              {metrics.totalPosts}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Live Updates & Offers</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
            <span className="text-xs font-bold uppercase text-slate-400">Total Post Views</span>
            <div className="text-3xl font-black text-purple-600 mt-1">
              {metrics.totalPostViews?.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">{metrics.totalPostClicks} Customer Clicks</p>
          </div>
        </div>

        {/* Showcase Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1 rounded-2xl h-12 shadow-sm">
            <TabsTrigger
              value="posts"
              className="rounded-xl px-6 font-bold text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-2"
            >
              <Store className="w-4 h-4" />
              <span>GMB Posts ({posts.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="rounded-xl px-6 font-bold text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Reviews & Owner Replies ({metrics.totalReviews || reviews.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="mt-0">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Card key={post.id} className="rounded-3xl border border-slate-200/90 overflow-hidden bg-white shadow-sm flex flex-col justify-between">
                  <div>
                    {post.imageUrl && (
                      <div className="h-48 w-full bg-slate-100 overflow-hidden">
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <Badge variant="secondary" className="text-[10px] uppercase font-bold px-2 py-0.5">
                          {post.postType}
                        </Badge>
                        <span>{formatTimeAgo(post.publishedAt)}</span>
                      </div>
                      <h3 className="text-base font-black text-slate-900">{post.title}</h3>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-0">
                      <p className="text-xs md:text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                        {post.content}
                      </p>
                      {post.ctaType && (
                        <Link href={post.ctaUrl || navigationLinks.externalGmb || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.businessName || slug)}`} target="_blank">
                          <Button variant="outline" size="sm" className="w-full text-xs font-bold text-blue-600 border-blue-200 hover:bg-blue-50 rounded-xl gap-1">
                            {post.ctaType.replace(/_/g, ' ')}
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </div>
                  <div className="border-t border-slate-100 bg-slate-50/70 p-3 px-6 flex items-center justify-between text-xs text-slate-500">
                    <span>{post.views || 0} views</span>
                    <span>{post.clicks || 0} clicks</span>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6 mt-0">
            {/* Rating Breakdown Banner */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="text-center sm:border-r border-slate-200/80 pr-6">
                  <div className="text-4xl sm:text-5xl font-black text-slate-900 leading-none">
                    {metrics.averageRating || '0.0'}
                  </div>
                  <div className="flex items-center justify-center gap-0.5 text-amber-400 my-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${star <= Math.round(metrics.averageRating || 0) ? 'fill-amber-400' : 'text-slate-200'}`}
                      />
                    ))}
                  </div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {metrics.totalReviews || 0} Total Reviews
                  </div>
                </div>

                {/* Star Distribution */}
                <div className="space-y-1.5 w-44 sm:w-56 text-xs font-semibold text-slate-600">
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

              {navigationLinks.externalGmb && (
                <div className="text-center sm:text-right shrink-0">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold mb-2">
                    ✓ Google Maps Verified
                  </Badge>
                  <div>
                    <a
                      href={navigationLinks.externalGmb}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline font-bold inline-flex items-center gap-1"
                    >
                      View on Google Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div id="public-reviews-anchor" />

            {/* Pagination count indicator */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>
                Showing <strong>{(paginationInfo.page - 1) * paginationInfo.limit + 1} - {Math.min(paginationInfo.page * paginationInfo.limit, paginationInfo.total)}</strong> of <strong>{paginationInfo.total}</strong> reviews
              </span>
              <span className="text-slate-400">
                Page {paginationInfo.page} of {paginationInfo.totalPages}
              </span>
            </div>

            {reviewsList.map((review) => (
              <Card key={review.id} className="rounded-3xl border border-slate-200/90 bg-white shadow-sm">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                        {review.reviewerName?.charAt(0) || 'G'}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{review.reviewerName}</h4>
                        <div className="flex items-center gap-2">
                          <div className="flex text-amber-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${s <= review.rating ? 'fill-amber-400' : 'text-slate-200'}`}
                              />
                            ))}
                          </div>
                            <span className="text-[11px] text-slate-400">
                              {formatTimeAgo(review.reviewDate)}
                            </span>
                        </div>
                      </div>
                    </div>

                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                      Verified Google Review
                    </Badge>
                  </div>

                  <p className="text-slate-700 text-sm leading-relaxed">
                    "{review.comment}"
                  </p>

                  {/* Owner Reply */}
                  {review.replyText && (
                    <div className="ml-4 sm:ml-6 mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                      <div className="text-xs font-bold text-blue-600 flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5" />
                        Response from {review.repliedBy || `${project.businessName} (Owner)`}
                      </div>
                      <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                        {review.replyText}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Pagination Controls */}
            {paginationInfo.totalPages > 1 && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                <div className="text-xs text-slate-600">
                  Showing <strong>{(paginationInfo.page - 1) * paginationInfo.limit + 1}</strong> to <strong>{Math.min(paginationInfo.page * paginationInfo.limit, paginationInfo.total)}</strong> of <strong>{paginationInfo.total}</strong> reviews
                </div>

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
      </main>
    </div>
  )
}
