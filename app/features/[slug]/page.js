import { notFound } from 'next/navigation'
import MarketingPage, { buildMetadata } from '@/components/site/MarketingPage'
import { features } from '@/lib/site-content/features'

export const dynamicParams = false

export function generateStaticParams() {
  return Object.keys(features).map(slug => ({ slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const page = features[slug]
  return page ? buildMetadata(page, `/features/${slug}`) : {}
}

export default async function FeaturePage({ params }) {
  const { slug } = await params
  const page = features[slug]
  if (!page) notFound()
  return <MarketingPage page={page} />
}
