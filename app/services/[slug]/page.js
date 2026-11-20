import { notFound } from 'next/navigation'
import { services } from '@/lib/services'
import { fetchAeoServicePage } from '@/lib/aeo'
import AeoServicePage from '@/components/AeoServicePage'
import ServicePageClient from './ServicePageClient'

// /services/[slug] serves two kinds of page:
//  1. the built-in industry pages in lib/services.js (rendered as before), and
//  2. service pages written by the AEO autopilot (aeo.ringscale.ai), fetched by slug.
// Anything else is a 404.

const isBuiltIn = slug => services.some(s => s.slug === slug)

export async function generateMetadata({ params }) {
  const { slug } = await params
  if (isBuiltIn(slug)) return {}
  const page = await fetchAeoServicePage(slug)
  if (!page) return {}
  return {
    title: page.title,
    description: page.metaDescription || page.summary,
    alternates: { canonical: page.url },
    openGraph: {
      title: page.title,
      description: page.metaDescription || page.summary,
      url: page.url,
      type: 'article',
      ...(page.coverImage ? { images: [{ url: page.coverImage.url, alt: page.coverImage.alt }] } : {}),
    },
  }
}

export default async function ServicePage({ params }) {
  const { slug } = await params
  if (isBuiltIn(slug)) return <ServicePageClient />

  const page = await fetchAeoServicePage(slug)
  if (!page) notFound()
  return <AeoServicePage page={page} />
}
