'use client'

import { SessionProvider } from 'next-auth/react'
import { createContext, useContext, useEffect, useState } from 'react'

const SettingsContext = createContext({
  settings: {
    branding: {
      appName: 'Ringscale AI',
      contactEmail: 'support@ringscaleai.com',
      contactPhone: '',
      address: '',
      logoUrl: '/logo.png',
      faviconUrl: '/favicon_logo.png'
    },
    maintenanceMode: false
  },
  loading: true
})

export function useSettings() {
  return useContext(SettingsContext)
}

export function Providers({ children }) {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/admin/settings')
        const data = await res.json()
        if (data.settings) {
          // Normalize settings structure
          const formatted = {
            branding: data.settings.branding || {},
            maintenanceMode: data.settings.branding?.maintenanceMode || false
          }
          setSettings(formatted)
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  return (
    <SessionProvider>
      <SettingsContext.Provider value={{ settings, loading }}>
        {children}
      </SettingsContext.Provider>
    </SessionProvider>
  )
}
