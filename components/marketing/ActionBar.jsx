'use client'

import { ExternalLink, CheckCircle2 } from "lucide-react"

export const ActionBar = ({ selectedReview, gmbLink, brandColor }) => {
  if (!selectedReview) return null

  return (
    <div
      className="fixed bottom-8 left-0 right-0 z-50 flex justify-center px-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 md:p-6 max-w-2xl w-full flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="text-green-600" size={24} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800">Review Copied!</h4>
            <p className="text-sm text-slate-500">The text is ready. Now just post it on Google Maps.</p>
          </div>
        </div>

        <a
          href={gmbLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition-all hover:scale-105 active:scale-95 w-full md:w-auto shadow-lg"
          style={{ backgroundColor: brandColor }}
        >
          Post on Google 
          <ExternalLink size={20} />
        </a>
      </div>
    </div>
  )
}
