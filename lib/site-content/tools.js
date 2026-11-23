// Copy for the free tools under /tools/*. The interactive parts live in components/site/Tools.jsx.

export const tools = {
  'credit-estimator': {
    eyebrow: 'Credit Estimator',
    title: 'How many credits',
    highlight: 'do you need?',
    metaTitle: 'Credit Estimator: Pick the Right Ringscale Plan',
    metaDescription: 'Estimate how many Ringscale credits you need based on locations, keywords and scan radius, and find the right plan.',
    intro: 'Tell us how many locations and keywords you want to track and how far your customers travel. We will calculate your credits and recommend the right plan.',
    primaryCta: { label: 'Start Free Trial', href: '/register' },
    secondaryCta: { label: 'See Pricing', href: '/#pricing' },
    sections: [
      {
        type: 'article',
        eyebrow: 'How credits work',
        title: 'Understanding Ringscale credits',
        blocks: [
          { p: ['Credits are used when you add a keyword to track. Each tracked keyword uses 100 credits, regardless of grid size. Once a keyword is tracked, Ringscale re-scans it automatically every 15 days at no extra credit cost.'] },
          { h: 'Plan allowances', list: ['7-Day Trial: 300 credits, up to 5-mile radius', 'Advance: 1,200 credits, up to 5-mile radius', 'Pro: 2,400 credits, up to 10-mile radius', 'Pro Plus: 5,000 credits, up to 20-mile radius'] },
          { h: 'How many keywords should I track?', p: ['Most single-location businesses get great insight from 5–10 keywords: your main services, a couple of “near me” variations and one or two high-value niche terms. Agencies typically track 5–15 per client.'] }
        ]
      }
    ],
    faqs: [
      { q: 'Do re-scans cost credits?', a: 'No. Automatic re-scans every 15 days are included once a keyword is tracked.' },
      { q: 'Does a bigger grid cost more credits?', a: 'No. A tracked keyword uses 100 credits whatever the grid density. Your plan sets the maximum radius.' },
      { q: 'What if I need more than 5,000 credits?', a: 'Request a custom package and we will build one around your volume.' }
    ]
  },
  'keyword-generator': {
    eyebrow: 'Free Keyword Generator',
    title: 'Generate local keywords',
    highlight: 'in seconds.',
    metaTitle: 'Free Local Keyword Generator | Ringscale AI',
    metaDescription: 'Free local SEO keyword generator. Combine your services, locations and modifiers into hundreds of local keyword ideas. Copy or download as CSV.',
    intro: 'Combine your services, locations and common search modifiers into a full list of local keyword ideas. Free, instant and nothing to sign up for.',
    primaryCta: { label: 'Track These Keywords', href: '/register' },
    secondaryCta: { label: 'Local SEO Checklist', href: '/local-seo-checklist-2026' },
    sections: [
      {
        type: 'article',
        eyebrow: 'Guide',
        title: 'How to choose local keywords that bring customers',
        blocks: [
          { h: 'Start with services, not industries', p: ['People search for what they need: “root canal”, “AC gas refill”, “bridal makeup”, not “dental industry” or “HVAC”. List every service you want more of.'] },
          { h: 'Add location intent', p: ['Local searches either include a place (“in Brampton”) or imply one (“near me”). Google uses the searcher’s location for “near me” queries, so geo-grid tracking is the only reliable way to measure them.'] },
          { h: 'Use modifiers that signal buying intent', list: ['Urgency: emergency, 24 hour, open now, same day', 'Quality: best, top rated, certified', 'Price: affordable, cost, price', 'Proximity: near me, nearby, close to'] },
          { h: 'Then prioritise', p: ['You don’t need to track every combination. Pick the 5–15 that match your most profitable services and track them with geo-grid scans. Use the rest as ideas for service pages, FAQs and Google posts.'] }
        ]
      }
    ],
    faqs: [
      { q: 'Is this keyword generator free?', a: 'Yes. It runs entirely in your browser and is free to use.' },
      { q: 'Does it show search volume?', a: 'No. It generates keyword ideas. For local keywords, search volume is often too low to measure accurately; your geo-grid ranking for high-intent terms matters more.' },
      { q: 'How many keywords should I track?', a: 'Most local businesses should start with 5–10 high-value keywords.' }
    ]
  },
  'schema-generator': {
    eyebrow: 'Free Schema Generator',
    title: 'Local business schema,',
    highlight: 'without code.',
    metaTitle: 'Free Local Business Schema Generator (JSON-LD) | Ringscale AI',
    metaDescription: 'Generate LocalBusiness and FAQPage JSON-LD schema markup for free. Help Google and AI assistants understand your business.',
    intro: 'Fill in your business details and get valid LocalBusiness and FAQPage JSON-LD markup to paste into your website. Helps Google and AI assistants read your facts correctly.',
    primaryCta: { label: 'Start Free Trial', href: '/register' },
    secondaryCta: { label: 'ChatGPT Visibility Guide', href: '/chatgpt-visibility-guide' },
    sections: [
      {
        type: 'article',
        eyebrow: 'Guide',
        title: 'What is local business schema?',
        blocks: [
          { p: ['Schema markup is structured data, a standard vocabulary from schema.org, that tells search engines exactly what the information on your page means. LocalBusiness schema describes your business name, address, phone, hours, location and more in a format machines read without guessing.'] },
          { h: 'Why it matters for local SEO and AI', p: ['Google uses structured data to understand and sometimes enhance your listing in search results. AI assistants also benefit from clear, machine-readable facts. Schema doesn’t guarantee rankings, but it removes ambiguity.'] },
          { h: 'Best practices', list: ['Use the most specific business type available', 'Make sure every value matches what is visible on the page', 'Keep your name, address and phone identical to your Google Business Profile', 'Add FAQPage schema only for FAQs shown on the page', 'Validate with Google’s Rich Results Test after publishing'] }
        ]
      }
    ],
    faqs: [
      { q: 'Where do I put the schema code?', a: 'Paste it into the <head> of the relevant page, or use your CMS or SEO plugin’s custom code option.' },
      { q: 'Should I add schema to every page?', a: 'Add LocalBusiness schema to your home or contact page (and each location page). Add FAQPage schema to pages that show FAQs.' },
      { q: 'Is my data stored?', a: 'No. The generator runs entirely in your browser.' }
    ]
  },
  'google-index-checker': {
    eyebrow: 'Free Google Index Checker',
    title: 'Can Google index',
    highlight: 'your page?',
    metaTitle: 'Free Google Index Checker | Ringscale AI',
    metaDescription: 'Check whether a page can be indexed by Google. Detect noindex tags, robots.txt blocks, canonical issues and HTTP errors for free.',
    intro: 'Enter any page URL and we will check it the way Googlebot would: status code, noindex tags, X-Robots-Tag headers, robots.txt rules and canonical tags.',
    primaryCta: { label: 'Run a Full Site Audit', href: '/features/360-local-seo-audit' },
    secondaryCta: { label: 'Local SEO Checklist', href: '/local-seo-checklist-2026' },
    sections: [
      {
        type: 'article',
        eyebrow: 'Guide',
        title: 'Why isn’t my page on Google?',
        blocks: [
          { p: ['A page can only rank if Google has crawled and indexed it. When a page is missing, the cause is usually one of the issues below.'] },
          { h: 'Common technical blockers', list: ['A noindex meta tag or X-Robots-Tag header', 'robots.txt disallowing the URL', 'A canonical tag pointing to another page', 'Server errors (5xx) or not-found (404) responses', 'Redirect chains or loops'] },
          { h: 'Common quality reasons', list: ['Thin or duplicate content', 'The page is new and hasn’t been crawled yet', 'No internal links pointing to the page', 'The page isn’t in your XML sitemap'] },
          { h: 'How to get a page indexed', p: ['Fix any blockers this tool finds, add internal links from important pages, include the URL in your sitemap, then use the URL Inspection tool in Google Search Console to request indexing.'] }
        ]
      }
    ],
    faqs: [
      { q: 'Does this tool check Google’s index directly?', a: 'It checks whether anything on your page or server prevents indexing. To confirm the page is actually indexed, use the site: search link in the results or Search Console’s URL Inspection tool.' },
      { q: 'Why does a canonical warning matter?', a: 'If the canonical tag points to a different URL, Google will usually index that URL instead of the one you checked.' },
      { q: 'Is there a limit?', a: 'To keep the tool fast for everyone, checks are rate limited per visitor.' }
    ]
  }
}
