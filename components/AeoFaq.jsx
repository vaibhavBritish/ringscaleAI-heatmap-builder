'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { aeoFaqEndpoint, isAeoPath, normalizeAeoPath } from '@/lib/aeo'

const AeoFaqContext = createContext('')

// Holds the FAQ HTML for the current page. The first page load gets server-rendered
// HTML (visible to crawlers); client-side navigations refetch for the new path.
export function AeoFaqProvider({ initialPath, initialHtml = '', children }) {
  const pathname = usePathname()
  const [faq, setFaq] = useState({ path: normalizeAeoPath(initialPath), html: initialHtml })

  useEffect(() => {
    const path = normalizeAeoPath(pathname)
    if (path === faq.path) return

    if (!isAeoPath(path)) {
      setFaq({ path, html: '' })
      return
    }

    const controller = new AbortController()
    fetch(aeoFaqEndpoint(path), { signal: controller.signal })
      .then(res => (res.ok ? res.text() : ''))
      .then(html => setFaq({ path, html }))
      .catch(err => {
        if (err.name !== 'AbortError') setFaq({ path, html: '' })
      })
    return () => controller.abort()
  }, [pathname, faq.path])

  const html = faq.path === normalizeAeoPath(pathname) ? faq.html : ''
  return <AeoFaqContext.Provider value={html}>{children}</AeoFaqContext.Provider>
}

// Renders the FAQ block (nothing if the page has no FAQs configured).
export function AeoFaq() {
  const html = useContext(AeoFaqContext)
  if (!html) return null
  return (
    <section className="py-16 px-6 bg-white">
      <div className="container mx-auto max-w-4xl" dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  )
}
