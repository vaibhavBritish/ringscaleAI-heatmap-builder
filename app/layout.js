import './globals.css'
import Script from 'next/script'
import { Toaster } from '@/components/ui/sonner'
import { Providers } from '@/components/providers'

export const metadata = {
  title: 'Local Rank Heatmap - Track Your Google Business Rankings',
  description: 'See exactly where your business ranks across your city with geo-grid heatmap analysis.',
  icons: {
    icon: '/favicon_logo.png',
    shortcut: '/favicon_logo.png',
    apple: '/favicon_logo.png',
  }
}

import { RootScripts } from '@/components/seoos/RootScripts'
import WhatsAppButton from '@/components/WhatsAppButton'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon_logo.png" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster position="bottom-right" />
          <WhatsAppButton />
          <RootScripts />
        </Providers>
      </body>
    </html>
  )
}
