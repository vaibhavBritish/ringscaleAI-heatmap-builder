'use client'

import React from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AgenticPlatformContent from '@/components/marketing/AgenticPlatformContent'

const AgenticMarketingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-20">
        <AgenticPlatformContent />
      </main>
      <Footer />
    </div>
  )
}

export default AgenticMarketingPage
