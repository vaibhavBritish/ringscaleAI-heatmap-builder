'use client'

import { Star, MapPin } from "lucide-react"

export const HeroSection = ({ client, reviewCount }) => {
  if (!client) return null

  return (
    <section 
      className="relative min-h-[40vh] py-12 md:py-16 lg:py-20 overflow-hidden"
    >
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={client.heroImage || "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80"}
          alt={client.businessName}
          className="w-full h-full object-cover"
        />
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${client.accentColor}f2 0%, ${client.accentColor}dd 50%, rgba(248, 250, 252, 0.9) 100%)`
          }}
        />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="flex flex-col items-start gap-6">
          {/* Badge */}
          <div 
            className="px-4 py-1.5 text-sm font-semibold rounded-full flex items-center"
            style={{ 
              backgroundColor: `${client.brandColor}15`,
              color: client.brandColor 
            }}
          >
            <Star size={14} className="mr-1.5" fill="currentColor" />
            Review Suggestions
          </div>

          {/* Title */}
          <h1 
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight"
            style={{ color: client.brandColor }}
          >
            {client.businessName}
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl leading-relaxed">
            We'd love to hear about your experience! Select a review below that best matches 
            how you feel, copy it, and post it on Google Maps.
          </p>

          {/* Industry badge */}
          <div className="flex items-center gap-2 text-slate-500">
            <MapPin size={18} />
            <span className="font-medium">{client.industry}</span>
            {reviewCount > 0 && (
              <span className="text-slate-400">
                • {reviewCount} review suggestions ready
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
