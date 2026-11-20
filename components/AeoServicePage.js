import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import './aeo-article.css'

// Renders a service page written by the AEO autopilot inside the site's own
// navbar and footer. `page` is the article object from
// https://aeo.ringscale.ai/api/v1/articles (html, jsonLd, title, coverImage...).
// The html already contains the page's FAQ section; the JSON-LD carries the
// Service + FAQPage schema search engines read.
export default function AeoServicePage({ page }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navbar />

      <main>
        <section className="pt-40 pb-12 px-6 bg-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-3xl pointer-events-none" />
          <div className="container mx-auto max-w-4xl relative z-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-[1.1] tracking-tight">
              {page.title}
            </h1>
            {page.metaDescription && (
              <p className="text-xl text-slate-500 font-medium leading-relaxed">{page.metaDescription}</p>
            )}
          </div>
        </section>

        <section className="pb-24 px-6 bg-white">
          <div className="container mx-auto max-w-4xl">
            {page.coverImage && (
              <figure className="mb-12">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={page.coverImage.url}
                  alt={page.coverImage.alt || ''}
                  className="w-full rounded-[2rem] border-4 border-white shadow-2xl object-cover aspect-video"
                />
                {page.coverImage.credit && (
                  <figcaption className="mt-2 text-xs text-slate-400">
                    Photo:{' '}
                    <a href={page.coverImage.credit.url} target="_blank" rel="noopener noreferrer" className="underline">
                      {page.coverImage.credit.name}
                    </a>
                  </figcaption>
                )}
              </figure>
            )}
            <div className="aeo-content" dangerouslySetInnerHTML={{ __html: page.html }} />
          </div>
        </section>
      </main>

      {page.jsonLd && (
        <script
          type="application/ld+json"
          // Escape "<" so the JSON can never close the script tag early.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(page.jsonLd).replace(/</g, '\\u003c') }}
        />
      )}

      <Footer />
    </div>
  )
}
