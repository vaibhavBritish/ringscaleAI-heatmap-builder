// Content for /compare/[slug].
// Competitor descriptions stick to each product's widely known public positioning.
// We deliberately do NOT state competitor prices or claim features they lack: those
// change often and a wrong claim is a legal and trust risk. Re-check before editing.

const ringscaleStrengths = [
  ['Geo-grid heatmaps (20–35 pins, circle or square)', 'Included on every plan'],
  ['Automatic re-scans', 'Every 15 days, no extra credits'],
  ['Side-by-side scan comparison', 'Included'],
  ['AI scan insights & AI Assist', 'Included'],
  ['Google Business Profile tools', 'Included'],
  ['Citations builder', 'Included'],
  ['SERP tracker + Search Console', 'Included'],
  ['AI visibility tracking & AEO', 'Included / service available'],
  ['White-label agency dashboard', 'Partner plans'],
  ['Local pricing in INR and USD', 'Yes'],
  ['Free trial', '7 days, 300 credits, no card']
]

function build(slug, c) {
  return {
    slug,
    nav: `vs ${c.name}`,
    eyebrow: `Ringscale vs ${c.name}`,
    title: `Ringscale AI vs ${c.name}:`,
    highlight: c.headline,
    metaTitle: `Ringscale AI vs ${c.name}: ${c.metaHook} | Ringscale AI`,
    metaDescription: `Comparing Ringscale AI and ${c.name}. ${c.summary}`,
    intro: c.intro,
    illustration: c.illustration || 'compare',
    primaryCta: { label: 'Try Ringscale Free', href: '/register' },
    secondaryCta: { label: 'See Pricing', href: '/#pricing' },
    sections: [
      {
        type: 'split',
        eyebrow: 'At a glance',
        title: `What ${c.name} is known for`,
        paragraphs: c.about,
        bullets: c.theirStrengths,
        illustration: 'serp'
      },
      {
        type: 'split',
        reverse: true,
        eyebrow: 'The Ringscale difference',
        title: 'Where Ringscale AI stands out',
        paragraphs: c.ours,
        bullets: ['Geo-grid heatmaps', 'Auto re-scans every 15 days', 'GBP, citations & AI tools', 'Built-in agency white label'],
        illustration: 'heatmap'
      },
      {
        type: 'table',
        eyebrow: 'Feature overview',
        title: 'What you get with Ringscale AI',
        text: `A summary of Ringscale capabilities to check against your ${c.name} plan.`,
        columns: ['Capability', 'Ringscale AI', `${c.name}`],
        rows: ringscaleStrengths.map(([k, v]) => [k, v, 'Check current plan']),
        note: `${c.name} features and pricing change over time. Check ${c.name}’s own website for their current offer. Information as of November 2026.`
      },
      {
        type: 'cards',
        eyebrow: 'Decide',
        title: 'Which one is right for you?',
        items: [
          { title: `Choose ${c.name} if…`, text: c.chooseThem },
          { title: 'Choose Ringscale AI if…', text: c.chooseUs },
          { title: 'Use both if…', text: c.both || `You already rely on ${c.name} for part of your workflow and want Ringscale’s geo-grid heatmaps and AI insights alongside it. Many teams start that way.` }
        ]
      },
      {
        type: 'article',
        eyebrow: 'Switching',
        title: `Moving from ${c.name} to Ringscale`,
        blocks: [
          { p: ['Switching local SEO tools doesn’t mean losing momentum. Create your project in Ringscale, add the same keywords you track today, and run a baseline scan. Within minutes you will have a heatmap you can compare against your existing data.', 'From then on, Ringscale re-scans each keyword every 15 days automatically and builds your history. Agencies can set up client accounts, allocate credits and apply their branding from the partner dashboard.'] },
          { h: 'Switching checklist', list: ['Export your keyword list and locations', 'Start a free 7-day Ringscale trial', 'Recreate projects and run baseline scans', 'Connect Google Search Console', 'Set up your white-label branding (agencies)', 'Run both tools side by side for a cycle if you prefer'] }
        ]
      }
    ],
    faqs: [
      { q: `Is Ringscale AI a ${c.name} alternative?`, a: `Yes. ${c.faqAlt}` },
      { q: `What is the main difference between Ringscale AI and ${c.name}?`, a: c.faqDiff },
      { q: 'Can I try Ringscale before switching?', a: 'Yes. The 7-day free trial includes 300 credits, a 5-mile scan radius and the full heatmap dashboard, with no card required.' },
      { q: 'Does Ringscale offer local pricing?', a: 'Yes. Ringscale offers pricing in Indian rupees for customers in India and US dollars elsewhere.' }
    ]
  }
}

const raw = {
  'local-falcon': {
    name: 'Local Falcon',
    headline: 'geo-grid tracking and beyond.',
    metaHook: 'Geo-Grid Rank Tracker Comparison',
    summary: 'Both offer geo-grid rank tracking; Ringscale adds GBP management, citations, AI tools and auto re-scans in one platform.',
    intro: 'Local Falcon is one of the best-known names in geo-grid rank tracking. Ringscale offers the same kind of map-based visibility, plus Google Business Profile tools, citations, SERP tracking and AI insights in one platform, with automatic re-scans built in.',
    about: ['Local Falcon popularised the geo-grid approach to Google Maps rank tracking: plotting a grid of points around a business and checking its position from each one. It is widely used by local SEO agencies and has a strong reputation for its scan data and reporting.', 'It is primarily focused on rank tracking and visibility analysis, with additional features for reporting and, more recently, AI-related visibility.'],
    theirStrengths: ['Established geo-grid pioneer', 'Agency-focused reporting', 'Well-known in local SEO', 'Large user community'],
    ours: ['Ringscale combines geo-grid heatmaps with the tools you use to improve them: GBP management, a citations builder, website audits, a SERP tracker and AI Assist. You can diagnose a weak area and fix it without leaving the platform.', 'Every tracked keyword is automatically re-scanned every 15 days, so your history builds itself. Plans are priced in both INR and USD.'],
    chooseThem: 'You only need geo-grid rank tracking, already have a workflow built around it, and use separate tools for GBP management and citations.',
    chooseUs: 'You want rank tracking plus the tools to act on it in one place, value automatic re-scans, or work in the Indian market and want INR pricing.',
    faqAlt: 'Ringscale provides geo-grid heatmap rank tracking similar to Local Falcon, along with GBP management, citations and AI features.',
    faqDiff: 'Local Falcon is best known for focused geo-grid rank tracking. Ringscale combines geo-grid tracking with GBP management, citation building, SERP tracking, AI insights and automatic re-scans in one platform.'
  },
  'local-viking': {
    name: 'Local Viking',
    headline: 'GBP management meets heatmaps.',
    metaHook: 'GBP Management & Geo-Grid Comparison',
    summary: 'Both combine Google Business Profile management with geo-grid tracking; Ringscale adds AI tools, citations and SERP tracking.',
    intro: 'Local Viking is a Google Business Profile management platform with geo-grid rank tracking, popular with agencies managing many profiles. Ringscale covers similar ground and adds AI Assist, a citations builder, website audits and SERP tracking.',
    about: ['Local Viking is known for helping agencies manage Google Business Profiles at scale, including posting and geo-grid rank tracking. It has a loyal following among local SEO practitioners.', 'Its focus is on GBP operations and visibility tracking.'],
    theirStrengths: ['GBP posting at scale', 'Geo-grid tracking', 'Agency workflows', 'Practitioner community'],
    ours: ['Ringscale offers GBP tools and heatmaps alongside AI-powered analysis, a citation builder, website audits and organic SERP tracking, so the whole local SEO workflow lives in one place.', 'Automatic 15-day re-scans, white-label reports and INR or USD pricing round it out.'],
    chooseThem: 'Your main need is high-volume GBP posting and you have other tools for audits, citations and organic tracking.',
    chooseUs: 'You want GBP management, heatmaps, citations, audits and AI insights in one platform.',
    faqAlt: 'Ringscale covers GBP management and geo-grid tracking like Local Viking, and adds AI insights, citations and SERP tracking.',
    faqDiff: 'Local Viking focuses on GBP management and geo-grid tracking. Ringscale adds AI Assist, Scan Analyzer, a citations builder, website audits and organic SERP tracking.'
  },
  'search-atlas': {
    name: 'Search Atlas',
    headline: 'local-first vs all-in-one.',
    metaHook: 'Local SEO vs All-in-One SEO Suite',
    summary: 'Search Atlas is a broad SEO suite; Ringscale is built specifically for local search visibility.',
    intro: 'Search Atlas is a broad SEO platform covering many areas of search marketing, including automation through its OTTO assistant. Ringscale is purpose-built for local businesses and the agencies that serve them, with geo-grid heatmaps at its core.',
    about: ['Search Atlas offers a wide SEO toolkit spanning keyword research, site auditing, content, backlinks and automation, with local SEO features as part of that larger suite.', 'It suits teams who want one platform for many types of SEO work.'],
    theirStrengths: ['Broad SEO suite', 'Automation (OTTO)', 'Content & backlink tools', 'Enterprise features'],
    ours: ['Ringscale is focused on one thing: helping businesses win local search and AI recommendations. Every feature, from heatmaps and GBP tools to citations and AI visibility, serves that goal.', 'That focus keeps it simpler to learn and more affordable for local businesses, with INR pricing for India.'],
    chooseThem: 'You need a wide SEO suite for national or content-heavy SEO, and local is only one part of your work.',
    chooseUs: 'Your customers are local, and you want a focused, simpler platform built around map rankings and local visibility.',
    faqAlt: 'For local businesses and local SEO agencies, Ringscale is a focused alternative to broad suites like Search Atlas.',
    faqDiff: 'Search Atlas is a broad SEO platform. Ringscale is purpose-built for local search, centred on geo-grid heatmaps, GBP tools and local AI visibility.'
  },
  'brightlocal': {
    name: 'BrightLocal',
    headline: 'two takes on local SEO.',
    metaHook: 'Local SEO Platform Comparison',
    summary: 'Both are local SEO platforms; Ringscale centres on geo-grid heatmaps and AI tools with automatic re-scans.',
    intro: 'BrightLocal is a long-established local SEO platform known for citations, audits, reputation tools and reporting. Ringscale puts geo-grid heatmaps and AI at the centre, with automatic re-scans and INR pricing.',
    about: ['BrightLocal has been a staple of local SEO for many years, offering rank tracking, citation building and auditing, review management and white-label reporting.', 'It is widely used by agencies and multi-location businesses.'],
    theirStrengths: ['Long-established platform', 'Citation services', 'Reputation tools', 'Agency reporting'],
    ours: ['Ringscale is built around the geo-grid heatmap: the clearest way to see local visibility. AI Assist and Scan Analyzer explain the results and suggest fixes, and automatic re-scans keep your data fresh.', 'Citations, GBP tools, audits and white-label reports are included, with pricing in INR and USD.'],
    chooseThem: 'You need BrightLocal’s specific citation services or reputation features and are already embedded in its ecosystem.',
    chooseUs: 'You want heatmap-first local tracking with AI insights and a simpler, all-in-one workflow.',
    faqAlt: 'Ringscale is a local SEO platform covering rank tracking, citations, GBP tools and reporting, with geo-grid heatmaps and AI at its core.',
    faqDiff: 'BrightLocal is a broad, long-established local SEO toolkit. Ringscale is heatmap-first, with AI analysis and automatic re-scans built in.'
  },
  'se-ranking': {
    name: 'SE Ranking',
    headline: 'specialist vs generalist.',
    metaHook: 'Local SEO vs SEO Platform',
    summary: 'SE Ranking is a general SEO platform with local add-ons; Ringscale specialises in local and map visibility.',
    intro: 'SE Ranking is a popular all-round SEO platform with rank tracking, audits and competitor research, plus local marketing features. Ringscale specialises in local: geo-grid heatmaps, GBP, citations and AI visibility.',
    about: ['SE Ranking offers a broad SEO toolkit covering keyword rank tracking, website audits, backlink analysis, competitor research and content tools. Local marketing features are available as part of its offering.', 'It is popular with agencies and in-house teams who need general SEO tools.'],
    theirStrengths: ['General SEO toolkit', 'Website auditing', 'Competitor research', 'Agency features'],
    ours: ['If your success is measured in calls, visits and map-pack positions, Ringscale’s local focus gives you deeper insight: pin-level heatmaps, local pack competitor data and AI explanations.', 'You also get GBP tools, citations, a SERP tracker and AI visibility tracking without needing a general SEO suite.'],
    chooseThem: 'You mainly need general SEO tools for websites competing nationally or globally.',
    chooseUs: 'You or your clients compete locally and want map rankings at the centre of your workflow.',
    faqAlt: 'For local businesses, Ringscale is a specialist alternative to general SEO platforms like SE Ranking.',
    faqDiff: 'SE Ranking is a general SEO platform with local features. Ringscale is built specifically for local search, centred on geo-grid heatmaps.'
  },
  'seo-neo': {
    name: 'SEO Neo',
    headline: 'different tools, different jobs.',
    metaHook: 'Tool Comparison',
    summary: 'SEO Neo focuses on SEO automation; Ringscale focuses on measuring and improving local visibility.',
    intro: 'SEO Neo is an SEO automation tool aimed at content and link-building tasks. Ringscale measures and improves local visibility with heatmaps, GBP tools, citations and AI insights. They solve different problems.',
    about: ['SEO Neo is positioned as an automation tool for SEO tasks such as creating and distributing content and links.', 'It appeals to practitioners who want to automate off-page activity.'],
    theirStrengths: ['SEO task automation', 'Content distribution', 'Off-page workflows'],
    ours: ['Ringscale is built to show and grow local visibility: where you rank across your service area, why, and what to fix. Its tools focus on trusted local signals: your Business Profile, consistent citations, reviews and clear website content.', 'That approach aligns with Google’s guidance and with what AI assistants rely on.'],
    chooseThem: 'You specifically need automation for off-page SEO tasks and understand the risks involved.',
    chooseUs: 'You want to measure and improve local map rankings and AI visibility with white-hat local SEO.',
    both: 'You use automation tools for some SEO tasks but need a clear, trustworthy view of local rankings. Ringscale’s heatmaps will show the real effect of any activity.',
    faqAlt: 'They serve different purposes. Ringscale is a local SEO platform for tracking and improving map rankings.',
    faqDiff: 'SEO Neo focuses on SEO automation. Ringscale focuses on local visibility: geo-grid heatmaps, GBP tools, citations and AI insights.'
  },
  'gmb-crush': {
    name: 'GMB Crush',
    headline: 'profile tools vs full local stack.',
    metaHook: 'GBP Tool Comparison',
    summary: 'GMB Crush focuses on Google Business Profile optimisation; Ringscale adds heatmaps, citations, audits and AI.',
    intro: 'GMB Crush is focused on Google Business Profile optimisation and activity. Ringscale includes GBP tools as part of a complete local platform with geo-grid heatmaps to prove what your profile work achieves.',
    about: ['GMB Crush is known for tools that help optimise Google Business Profiles and keep them active.', 'It suits users whose priority is profile-level optimisation.'],
    theirStrengths: ['GBP optimisation focus', 'Profile activity tools'],
    ours: ['Profile work matters, but you need to see its effect. Ringscale pairs GBP tools with heatmaps, side-by-side comparisons and AI analysis, so every change can be measured.', 'Citations, audits, SERP tracking and white-label reporting complete the picture.'],
    chooseThem: 'You only want a dedicated tool for Google Business Profile activity.',
    chooseUs: 'You want GBP tools plus the rank tracking and reporting to prove they work.',
    faqAlt: 'Ringscale includes Google Business Profile tools as part of a complete local SEO platform.',
    faqDiff: 'GMB Crush focuses on Google Business Profile optimisation. Ringscale covers GBP plus geo-grid tracking, citations, audits, SERP tracking and AI insights.'
  },
  'localo': {
    name: 'Localo',
    headline: 'DIY app vs pro platform.',
    metaHook: 'Local SEO App Comparison',
    summary: 'Localo is a guided local SEO app for small businesses; Ringscale serves both businesses and agencies with deeper tracking.',
    intro: 'Localo is a guided local SEO app that helps small business owners improve their Google presence with tasks and tips. Ringscale offers deeper geo-grid tracking, AI analysis and agency features while staying easy to use.',
    about: ['Localo positions itself as a simple, guided way for small business owners to improve their Google Business Profile and local visibility, with suggested tasks and tracking.', 'It is designed to be approachable for non-experts.'],
    theirStrengths: ['Beginner-friendly', 'Guided tasks', 'Small business focus'],
    ours: ['Ringscale is easy enough for a business owner but deep enough for an agency: configurable grids up to 20 miles, pin-level competitor data, side-by-side comparisons, AI insights, citations and white-label reporting.', 'Automatic re-scans and INR pricing make it practical for Indian businesses too.'],
    chooseThem: 'You are a single small business owner who wants a very simple guided app.',
    chooseUs: 'You want detailed heatmaps, competitor data and AI insights, or you manage multiple businesses.',
    faqAlt: 'Ringscale is a more in-depth alternative to guided local SEO apps like Localo, suitable for both businesses and agencies.',
    faqDiff: 'Localo is a guided app for small business owners. Ringscale offers configurable geo-grid tracking, AI analysis, citations and agency white-label features.'
  },
  'seo-utils': {
    name: 'SEO Utils',
    headline: 'desktop toolkit vs local cloud platform.',
    metaHook: 'Tool Comparison',
    summary: 'SEO Utils is a general SEO toolkit; Ringscale is a cloud platform for local search visibility.',
    intro: 'SEO Utils is a general-purpose SEO toolkit for practitioners. Ringscale is a cloud-based local SEO platform centred on Google Maps visibility, GBP and AI recommendations.',
    about: ['SEO Utils offers a collection of SEO utilities for practitioners, covering a range of general SEO tasks.', 'It appeals to hands-on SEOs who like a toolkit approach.'],
    theirStrengths: ['General SEO utilities', 'Practitioner-focused'],
    ours: ['Ringscale is cloud-based, collaborative and focused on local results: heatmaps from real GPS points, automatic re-scans, GBP tools, citations and AI insights, with client accounts for agencies.'],
    chooseThem: 'You want a general SEO utility toolkit for a range of tasks.',
    chooseUs: 'Your work is about local rankings and you want cloud-based tracking, reporting and client access.',
    faqAlt: 'For local search work, Ringscale is a focused cloud platform alternative.',
    faqDiff: 'SEO Utils is a general SEO toolkit. Ringscale is a cloud platform for local visibility: heatmaps, GBP, citations and AI.'
  },
  'wiremo': {
    name: 'Wiremo',
    headline: 'reviews vs local visibility.',
    metaHook: 'Reviews & Local SEO Comparison',
    summary: 'Wiremo focuses on collecting and displaying reviews; Ringscale focuses on local search visibility.',
    intro: 'Wiremo is a review platform for collecting and displaying customer reviews. Ringscale focuses on local search visibility: where you rank, why, and how to improve, including review strategy.',
    about: ['Wiremo helps businesses collect customer reviews and display them on their websites with widgets and rich snippets.', 'It is centred on review collection and social proof.'],
    theirStrengths: ['Review collection', 'Review widgets', 'On-site social proof'],
    ours: ['Reviews are one input to local rankings. Ringscale measures the output: your visibility across your area, against competitors. It includes a review generator, review benchmarking and AI-drafted replies alongside heatmaps, GBP tools and citations.'],
    chooseThem: 'Your main goal is collecting and showcasing reviews on your own website.',
    chooseUs: 'Your goal is to rank higher in Google Maps and AI search, with reviews as part of the strategy.',
    both: 'You want a dedicated review widget on your website and Ringscale’s tracking to measure how reviews affect your rankings.',
    faqAlt: 'They do different jobs. Ringscale is a local SEO platform, and includes review generation tools as part of it.',
    faqDiff: 'Wiremo focuses on review collection and display. Ringscale focuses on local search visibility, with geo-grid heatmaps, GBP tools, citations and AI insights.'
  }
}

export const competitors = Object.fromEntries(Object.entries(raw).map(([slug, c]) => [slug, build(slug, c)]))
export const competitorList = Object.values(competitors)
