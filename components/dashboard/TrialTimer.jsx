'use client'

import { useState, useEffect } from 'react'

export default function TrialTimer({ trialEndsAt }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    if (!trialEndsAt) return

    const calculateTimeLeft = () => {
      const difference = new Date(trialEndsAt) - new Date()
      
      if (difference <= 0) {
        return 'Trial expired'
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((difference / 1000 / 60) % 60)
      const seconds = Math.floor((difference / 1000) % 60)

      const parts = []
      if (days > 0) parts.push(`${days}d`)
      if (hours > 0 || days > 0) parts.push(`${hours}h`)
      if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`)
      parts.push(`${seconds}s`)

      return parts.join(' ') + ' remaining'
    }

    // Initial calculation
    setTimeLeft(calculateTimeLeft())

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [trialEndsAt])

  if (!trialEndsAt) return null

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <p className="font-semibold text-blue-800">Free Trial</p>
      <p className="text-sm text-blue-700 tabular-nums">
        {timeLeft || 'Calculating...'}
      </p>
    </div>
  )
}
