'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { HeroSection } from '@/components/marketing/HeroSection'
import { ReviewCard } from '@/components/marketing/ReviewCard'
import { ActionBar } from '@/components/marketing/ActionBar'
import { Button } from '@/components/ui/button'

export default function ReviewLandingPage() {
  const { slug } = useParams()
  const [project, setProject] = useState(null)
  const [reviews, setReviews] = useState([])
  const [selectedReview, setSelectedReview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generatingReviews, setGeneratingReviews] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/marketing/client/${slug}`)
        if (!res.ok) {
          if (res.status === 404) throw new Error('Business not found')
          throw new Error('Failed to load business information')
        }
        const data = await res.json()
        setProject(data.project)
        
        // Initial reviews
        handleGenerateReviews(data.project.clientSlug)
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }

    if (slug) fetchProject()
  }, [slug])

  const handleGenerateReviews = async (clientSlug) => {
    try {
      setGeneratingReviews(true)
      const res = await fetch('/api/marketing/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: clientSlug || slug })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate reviews')
      
      setReviews(data.reviews)
      setSelectedReview(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setGeneratingReviews(false)
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 text-center">
        <div>
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Oops!</h1>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  if (loading && !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading business info...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <HeroSection client={project} reviewCount={reviews.length} />

      <main className="container mx-auto px-4 md:px-8 max-w-7xl py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Choose Your Review</h2>
            <p className="text-slate-500 mt-1">Copy a suggestion and post it on Google Maps</p>
          </div>

          <Button
            onClick={() => handleGenerateReviews()}
            disabled={generatingReviews}
            variant="outline"
            className="rounded-full px-6 py-5 font-semibold border-2"
            style={{ borderColor: project?.brandColor, color: project?.brandColor }}
          >
            {generatingReviews ? (
              <Loader2 className="mr-2 animate-spin" size={18} />
            ) : (
              <RefreshCw className="mr-2" size={18} />
            )}
            {generatingReviews ? 'Generating...' : 'New Suggestions'}
          </Button>
        </div>

        {generatingReviews ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reviews.map((review, index) => (
              <ReviewCard
                key={index}
                review={review}
                index={index}
                isSelected={selectedReview === review}
                onSelect={setSelectedReview}
                brandColor={project?.brandColor}
              />
            ))}
          </div>
        )}
      </main>

      <ActionBar
        selectedReview={selectedReview}
        gmbLink={project?.gmbLink}
        brandColor={project?.brandColor}
      />
    </div>
  )
}
