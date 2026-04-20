'use client'

import { Copy, Check, Quote } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export const ReviewCard = ({ review, index, isSelected, onSelect, brandColor }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(review)
    setCopied(true)
    toast.success("Review copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
    onSelect(review)
  }

  return (
    <div
      onClick={() => onSelect(review)}
      className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${
        isSelected 
          ? 'bg-white shadow-xl scale-[1.02]' 
          : 'bg-white/50 hover:bg-white border-transparent hover:shadow-lg'
      }`}
      style={{ 
        borderColor: isSelected ? brandColor : 'transparent',
      }}
    >
      <div className="absolute top-4 right-4 opacity-10">
        <Quote size={48} style={{ color: brandColor }} />
      </div>

      <div className="relative z-10">
        <p className="text-slate-700 text-lg leading-relaxed mb-6 italic">
          "{review}"
        </p>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1 text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} fill="currentColor" />
            ))}
          </div>

          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              copied 
                ? 'bg-green-500 text-white' 
                : 'hover:bg-slate-100 text-slate-600'
            }`}
            style={!copied ? { color: brandColor } : {}}
          >
            {copied ? (
              <>
                <Check size={16} />
                Copied
              </>
            ) : (
              <>
                <Copy size={16} />
                Copy Text
              </>
            )}
          </button>
        </div>
      </div>

      {isSelected && (
        <div 
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg"
          style={{ backgroundColor: brandColor }}
        >
          <Check size={18} />
        </div>
      )}
    </div>
  )
}

const Star = ({ size, fill }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill={fill} 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)
