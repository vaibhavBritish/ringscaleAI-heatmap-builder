'use client'

import { useState, useEffect } from 'react'

let cachedConfig = process.env.NEXT_PUBLIC_GOOGLE_API_KEY ? {
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY
} : null

export function useConfig() {
  const [config, setConfig] = useState(cachedConfig)
  const [loading, setLoading] = useState(!cachedConfig && !process.env.NEXT_PUBLIC_GOOGLE_API_KEY)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (cachedConfig) {
      setLoading(false)
      return
    }

    async function fetchConfig() {
      try {
        const res = await fetch('/api/config')
        if (!res.ok) throw new Error('Failed to fetch config')
        const data = await res.json()
        cachedConfig = data
        setConfig(data)
      } catch (err) {
        console.error('useConfig Error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [])

  return { config, loading, error }
}
