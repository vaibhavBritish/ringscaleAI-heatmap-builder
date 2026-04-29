import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function useCountry() {
  const [country, setCountry] = useState(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    // 1. Check URL path first for explicit region override
    if (pathname?.startsWith('/in')) {
      setCountry('IN')
      setLoading(false)
      return
    }
    if (pathname?.startsWith('/us')) {
      setCountry('US')
      setLoading(false)
      return
    }

    // 2. Fallback to IP Geolocation
    async function fetchCountry() {
      try {
        const res = await fetch('https://api.country.is')
        const data = await res.json()
        if (data.country) {
          setCountry(data.country)
        } else {
          setCountry('US') // fallback
        }
      } catch (err) {
        console.error('Failed to fetch country:', err)
        setCountry('US') // fallback
      } finally {
        setLoading(false)
      }
    }
    fetchCountry()
  }, [pathname])

  // Default to false initially, then update based on state
  return { country, loading, isIndia: country === 'IN' }
}
