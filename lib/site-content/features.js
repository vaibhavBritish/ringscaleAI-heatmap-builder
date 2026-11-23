// Content for /features/[slug]. Rendered by components/site/MarketingPage.jsx.
// Product facts used here (keep in sync with the app): 20–35 pin grids, circle or square
// shape, radius capped by plan (5 / 10 / 20 miles), automatic re-scans every 15 days,
// 100 credits per tracked keyword.

import {
  MapPin, Grid3x3, Clock, TrendingUp, Layers, Target, Star, MessageSquare, Image as ImageIcon,
  CalendarClock, Building2, Globe, ShieldCheck, RefreshCw, Send, FileText, Palette, Users,
  Mail, Bot, Sparkles, PenLine, Lightbulb, ScanSearch, AlertTriangle, Compass, ClipboardCheck,
  Gauge, Link2, BarChart3, PieChart, Columns2, History, Eye, Search, LineChart, Smartphone,
  Bell, Quote, Network, Briefcase, Store, Zap, Award, Phone
} from 'lucide-react'

const trial = { label: 'Start 7-Day Free Trial', href: '/register' }
const pricing = { label: 'See Pricing', href: '/#pricing' }

export const features = {
  'google-maps-rank-tracker': {
    nav: 'Google Maps Rank Tracker',
    eyebrow: 'Google Maps Rank Tracker',
    title: 'See exactly where you rank on Google Maps,',
    highlight: 'street by street.',
    metaTitle: 'Google Maps Rank Tracker with Geo-Grid Heatmaps | Ringscale AI',
    metaDescription: 'Track your Google Maps and local pack rankings from dozens of real GPS points across your service area. Geo-grid heatmaps, automatic re-scans and AI insights.',
    intro: 'Your Google Maps ranking is not one number. It changes every few hundred metres. Ringscale drops a grid of GPS pins across your service area, searches Google from each one, and paints the results as a colour-coded heatmap, so you finally see where customers can find you, and where they can’t.',
    illustration: 'heatmap',
    primaryCta: trial,
    secondaryCta: pricing,
    stats: [['20–35', 'GPS pins per scan'], ['Up to 20 mi', 'Scan radius'], ['15 days', 'Auto re-scan cycle'], ['2 min', 'Typical first scan']],
    sections: [
      {
        type: 'split',
        eyebrow: 'Why ordinary rank trackers lie',
        title: 'A single ranking hides most of the story.',
        paragraphs: [
          'Traditional rank trackers check your position from one location, usually the centre of a city or your own address. Google Maps doesn’t work that way. It ranks local businesses by relevance, prominence and, above all, proximity to the person searching.',
          'That means a plumber can be #1 for “plumber near me” on their own street and invisible two miles away, where most of their customers live. One number averages all of that away. A geo-grid shows it.',
          'Ringscale runs the same search from every pin on a grid around your business, records your exact position at each one, and turns it into a map you can read at a glance: green where you win, red where competitors take the call.'
        ],
        bullets: ['Rank at every grid point', 'Circle or square grids', 'Miles or kilometres', 'Plan-based radius up to 20 mi'],
        illustration: 'localpack'
      },
      {
        type: 'features',
        eyebrow: 'What you get',
        title: 'Everything a serious local rank tracker needs.',
        items: [
          { icon: Grid3x3, title: 'Geo-grid heatmaps', text: 'Choose 20, 25, 30 or 35 pins in a circle or square, set the radius, and see your rank at every point in one colour-coded view.' },
          { icon: Target, title: 'Pin-level detail', text: 'Click any pin to see who outranks you from that exact spot: the businesses in the local pack and their positions.' },
          { icon: RefreshCw, title: 'Automatic re-scans', text: 'Every tracked keyword is re-scanned automatically every 15 days, so you build a ranking history without lifting a finger.' },
          { icon: Columns2, title: 'Before & after comparison', text: 'Put any two scans side by side and watch red turn green as your optimisation work pays off.' },
          { icon: Sparkles, title: 'AI scan insights', text: 'Ringscale’s AI reads the heatmap for you and explains the pattern, then suggests what to fix first.' },
          { icon: FileText, title: 'Shareable reports', text: 'Export a clean report for your team, your boss or your clients. Agencies can add their own branding.' }
        ]
      },
      {
        type: 'steps',
        eyebrow: 'How it works',
        title: 'From sign-up to your first heatmap in minutes.',
        items: [
          { title: 'Find your business', text: 'Search for your Google Business Profile by name. Ringscale pulls in your location, category and pin automatically.' },
          { title: 'Add keywords', text: 'Enter the searches customers really use: “emergency dentist”, “AC repair near me”, “best biryani in Vikaspuri”.' },
          { title: 'Set the grid', text: 'Pick a shape, the number of pins and a radius that matches how far your customers travel.' },
          { title: 'Run the scan', text: 'Ringscale searches Google Maps from every pin and records the full local pack at each point.' },
          { title: 'Read the heatmap', text: 'Green pins are top-3 positions, yellow is page one, red means you are hard to find. Average rank and visibility are calculated for you.' },
          { title: 'Improve and re-scan', text: 'Fix what the scan reveals. Automatic re-scans every 15 days show whether it worked.' }
        ]
      },
      {
        type: 'article',
        eyebrow: 'Guide',
        title: 'How to read a Google Maps heatmap',
        blocks: [
          { h: 'The colours', p: ['Each pin shows your position in the Google Maps results for one keyword when searched from that spot. Positions 1–3 are the local pack, the three businesses Google shows above the organic results, and they get the overwhelming majority of clicks and calls. Ringscale colours those green. Positions 4–10 are visible but need a scroll, and appear in yellow and amber. Anything beyond is orange or red: practically invisible.'] },
          { h: 'The patterns that matter', p: ['A strong green centre that fades to red at the edges is normal: proximity is Google’s heaviest local ranking factor. What you want to see over time is that green circle getting bigger.', 'A lopsided map, green on one side and red on the other, usually means a competitor is dominant in that direction, or a geographic barrier like a river or highway is splitting your market. A map that is red even next to your own location is a relevance or profile problem: the wrong category, a thin profile, or too few reviews.'], illustration: 'analyzer' },
          { h: 'Metrics to track', list: ['Average rank across all pins: your headline number', 'Top-3 share: how many pins put you in the local pack', 'Visibility: how many pins show you on page one at all', 'Best and worst areas, so you know where to focus content and reviews'] },
          { h: 'How often to scan', p: ['Local rankings move as you collect reviews, post updates and as competitors do the same. Ringscale re-scans each keyword every 15 days automatically, which is frequent enough to catch real trends without reacting to day-to-day noise. You can always trigger a manual scan after a big change.'] }
        ]
      }
    ],
    faqs: [
      { q: 'What is a Google Maps rank tracker?', a: 'A Google Maps rank tracker records where your business appears in Google Maps and local pack results for a given keyword. Ringscale goes further by checking that ranking from many GPS points across your service area, so you see how it changes by location rather than a single averaged number.' },
      { q: 'What is a geo-grid scan?', a: 'A geo-grid scan places a grid of pins (20 to 35 in Ringscale) around your business, runs the same Google Maps search from each pin, and records your position at every point. The result is a heatmap of your local visibility.' },
      { q: 'How large an area can I scan?', a: 'The maximum radius depends on your plan: 5 miles on Advance, 10 miles on Pro and 20 miles on Pro Plus. You can scan in miles or kilometres and choose a circle or square grid.' },
      { q: 'How many credits does tracking a keyword use?', a: 'Adding a keyword to track uses 100 credits. Automatic re-scans of that keyword every 15 days are included, so you keep building history without extra cost.' },
      { q: 'Can I track my competitors?', a: 'Yes. Every pin records the full local pack, so you can see which competitors outrank you in each area and how their positions change over time.' },
      { q: 'Is there a free trial?', a: 'Yes. The 7-day trial includes 300 credits, a 5-mile radius and the full heatmap dashboard, with no card required.' }
    ]
  },

  'local-pack': {
    nav: 'Local Pack',
    eyebrow: 'Local Pack Tracking',
    title: 'Win the three spots that get',
    highlight: 'the calls.',
    metaTitle: 'Local Pack Rank Tracker: Track Google 3-Pack Rankings | Ringscale AI',
    metaDescription: 'Track and win the Google local 3-pack. See who holds the top three spots from every point in your service area and what it takes to replace them.',
    intro: 'When someone searches for a local service, Google shows a map and three businesses above everything else. That is the local pack, and it is where the clicks, calls and direction requests happen. Ringscale shows you exactly where you are in it, who is beating you, and how to get in.',
    illustration: 'localpack',
    primaryCta: trial,
    secondaryCta: { label: 'How the 3-pack works', href: '#guide' },
    sections: [
      {
        type: 'features',
        eyebrow: 'Local pack intelligence',
        title: 'Know who owns the pack, everywhere.',
        items: [
          { icon: Award, title: 'Top-3 share', text: 'See what percentage of your service area puts you in the local pack, and track that share as it grows.' },
          { icon: Users, title: 'Competitor line-up per pin', text: 'For every grid point, see the three businesses Google shows, with their ratings and review counts.' },
          { icon: TrendingUp, title: 'Movement tracking', text: 'See where you entered or dropped out of the pack between scans, and when a new competitor appears.' },
          { icon: Star, title: 'Review benchmarking', text: 'Compare your rating and review volume with the businesses that hold the pack around you.' },
          { icon: MapPin, title: 'Area-level focus', text: 'Identify the neighbourhoods where you are just outside the top three, the easiest wins.' },
          { icon: LineChart, title: 'History over time', text: 'Automatic re-scans every 15 days build a timeline of your local pack presence.' }
        ]
      },
      {
        type: 'article',
        id: 'guide',
        eyebrow: 'Guide',
        title: 'What decides who gets into the local pack?',
        blocks: [
          { p: ['Google has said publicly that local results are based mainly on three things: relevance, distance and prominence. Understanding each one tells you which levers you can pull.'] },
          { h: '1. Relevance', p: ['How well your Business Profile matches what the person searched for. Your primary category is the strongest relevance signal, followed by secondary categories, services, the business description and the words customers use in reviews. A bakery listed as “Cafe” will struggle for “bakery near me”.'] },
          { h: '2. Distance', p: ['How far your business is from the searcher, or from the location in their query. You can’t move your premises, but you can see exactly how far your pull extends with a geo-grid, and expand it with stronger relevance and prominence.'] },
          { h: '3. Prominence', p: ['How well known and trusted the business is. Google looks at review count and rating, links and mentions across the web, consistent citations, and how complete and active your profile is. This is where most businesses can make the biggest gains.'], illustration: 'gbp' },
          { h: 'A practical plan to break into the 3-pack', list: ['Pick the most specific accurate primary category', 'Fill every section of your Business Profile: services, products, attributes, hours', 'Ask every happy customer for a review, and reply to every review', 'Post updates and photos weekly', 'Make your name, address and phone identical on every directory', 'Build a location page on your website with LocalBusiness schema', 'Re-scan and compare: double down on what moves the map'] }
        ]
      },
      {
        type: 'split',
        reverse: true,
        eyebrow: 'Prove it',
        title: 'Show the before and after.',
        paragraphs: ['Local SEO is slow to show up in revenue reports but fast to show up on a heatmap. Compare any two scans side by side and you can see, pin by pin, where you have entered the local pack since the work started.', 'It is the clearest way to keep a client, a franchise owner or your own team confident that the effort is working.'],
        bullets: ['Side-by-side scans', 'Top-3 share change', 'Average rank change', 'Exportable report'],
        illustration: 'compare'
      }
    ],
    faqs: [
      { q: 'What is the Google local pack?', a: 'The local pack (also called the 3-pack or map pack) is the block of three local businesses Google shows with a map for searches with local intent, such as “dentist near me” or “pizza in Mississauga”. It appears above the regular organic results.' },
      { q: 'Why does my local pack position change across town?', a: 'Because distance from the searcher is a major ranking factor. Your position can vary a lot within a few miles, which is why Ringscale measures it from a grid of points instead of one location.' },
      { q: 'How long does it take to get into the local pack?', a: 'It depends on competition and your starting point. Fixing categories and profile completeness can show movement within weeks; building review volume and citations is an ongoing effort over months. Regular scans show you the trend.' },
      { q: 'Does Ringscale track the local finder beyond the top 3?', a: 'Yes. Each pin records your exact position, so you can see when you are at 4–10 and close to breaking into the pack.' }
    ]
  },

  'gbp-management': {
    nav: 'GBP Management',
    eyebrow: 'Google Business Profile Management',
    title: 'Run every Google Business Profile',
    highlight: 'from one place.',
    metaTitle: 'Google Business Profile Management Software | Ringscale AI',
    metaDescription: 'Manage Google Business Profiles at scale: posts, photos, reviews, Q&A and profile optimisation, with heatmap tracking to prove the impact.',
    intro: 'Your Google Business Profile is your most-viewed web page, often seen more than your website. Ringscale’s GBP suite helps you keep it complete, active and persuasive: posting, review replies, profile audits and AI-written content, all tied back to your ranking heatmaps.',
    illustration: 'gbp',
    primaryCta: trial,
    secondaryCta: pricing,
    sections: [
      {
        type: 'features',
        eyebrow: 'GBP suite',
        title: 'Everything your profile needs to rank and convert.',
        items: [
          { icon: ClipboardCheck, title: 'Profile completeness audit', text: 'A checklist of every field Google rewards: categories, services, attributes, hours, description, photos and more.' },
          { icon: CalendarClock, title: 'Post scheduling', text: 'Plan offers, updates and events ahead of time so your profile never looks abandoned.' },
          { icon: MessageSquare, title: 'Review replies', text: 'See new reviews in one inbox and reply quickly with AI-drafted responses in your own tone.' },
          { icon: ImageIcon, title: 'Photo management', text: 'Keep fresh photos flowing. Profiles with recent images look alive to both customers and Google.' },
          { icon: Sparkles, title: 'AI descriptions & posts', text: 'Generate keyword-aware descriptions, service text and posts in seconds, then edit before publishing.' },
          { icon: Building2, title: 'Multi-location ready', text: 'Agencies and brands can manage many profiles from a single dashboard.' }
        ]
      },
      {
        type: 'split',
        eyebrow: 'Why it matters',
        title: 'An active profile is a ranking signal.',
        paragraphs: ['Google wants to show searchers businesses that are open, accurate and trusted. A profile with current hours, regular posts, fresh photos and answered reviews sends exactly that signal. An untouched profile sends the opposite.', 'Ringscale ties GBP work to ranking data, so you’re not guessing. Post consistently for a month, add services and categories, then compare your heatmaps to see what changed.'],
        bullets: ['Weekly posting cadence', 'Fast review replies', 'Complete service list', 'Accurate hours & attributes'],
        illustration: 'heatmap'
      },
      {
        type: 'checklist',
        eyebrow: 'Checklist',
        title: 'The Google Business Profile optimisation checklist',
        text: 'Work through this list for every location. Ringscale’s profile audit checks most of it for you.',
        groups: [
          { title: 'Foundations', items: ['Business name exactly as on your signage (no keyword stuffing)', 'Most specific primary category', 'Relevant secondary categories', 'Correct address or service area', 'Local phone number', 'Website link with UTM tracking'] },
          { title: 'Content', items: ['750-character description that reads naturally', 'Every service listed with a short description', 'Products with photos and prices where relevant', 'All applicable attributes ticked', 'Opening and holiday hours kept current'] },
          { title: 'Activity', items: ['At least one post a week', 'New photos every month', 'Questions & Answers seeded and monitored', 'Messaging enabled with a fast response time'] },
          { title: 'Reputation', items: ['Steady flow of new reviews', 'Reply to every review within 48 hours', 'Handle negative reviews calmly and publicly', 'Use review keywords naturally in replies'] }
        ]
      }
    ],
    faqs: [
      { q: 'What is Google Business Profile management?', a: 'It is the ongoing work of keeping your Google Business Profile complete, accurate and active: categories, services, hours, posts, photos, reviews and Q&A. Done well, it improves both your local rankings and how many viewers turn into customers.' },
      { q: 'Can I manage multiple locations?', a: 'Yes. Ringscale is built for agencies and multi-location brands, with each location tracked and managed from the same dashboard.' },
      { q: 'Will AI write my posts and replies automatically?', a: 'AI drafts them for you; you stay in control and can edit or approve before anything is published.' },
      { q: 'How often should I post on Google Business Profile?', a: 'At least once a week is a good baseline. Regular activity keeps your profile fresh for customers and signals to Google that the business is active.' }
    ]
  },

  'citations-builder': {
    nav: 'Citations Builder',
    eyebrow: 'Citations Builder',
    title: 'Consistent listings everywhere,',
    highlight: 'without the spreadsheet.',
    metaTitle: 'Local Citation Builder & NAP Consistency Tool | Ringscale AI',
    metaDescription: 'Build and clean up local citations on the directories that matter. Fix NAP inconsistencies, track submissions and strengthen local rankings.',
    intro: 'Every directory that lists your business name, address and phone number (NAP) is a citation. When they agree, Google and AI assistants trust you. When they don’t, your rankings suffer. Ringscale finds the directories that matter, keeps one master profile, and tracks every submission.',
    illustration: 'citations',
    primaryCta: trial,
    secondaryCta: pricing,
    sections: [
      {
        type: 'features',
        eyebrow: 'What it does',
        title: 'Citation building, organised.',
        items: [
          { icon: Compass, title: 'Directory discovery', text: 'Find the general, industry and country-specific directories that are relevant for your business.' },
          { icon: Building2, title: 'One master profile', text: 'Store your business details once and use them everywhere, so every listing matches exactly.' },
          { icon: Send, title: 'Submission tracking', text: 'Track every directory from pending to live in one workspace, with notes and links.' },
          { icon: AlertTriangle, title: 'NAP inconsistency checks', text: 'Spot old addresses, wrong phone numbers and name variations that confuse search engines.' },
          { icon: Link2, title: 'Backlink value', text: 'Many citations also give you a link back to your website, adding authority.' },
          { icon: Globe, title: 'India, US & Canada', text: 'Directory lists cover the markets our customers serve, including Justdial, Yelp and Yellow Pages.' }
        ]
      },
      {
        type: 'article',
        eyebrow: 'Guide',
        title: 'Why citations still matter in 2026',
        blocks: [
          { p: ['Citations are one of the oldest local SEO signals, and they’ve become more important, not less, with AI search. Large language models and answer engines build their picture of your business from everything published about it. If ten directories say one thing and three say another, the engine is less confident recommending you.'] },
          { h: 'Consistency beats volume', p: ['Fifty accurate listings are worth far more than two hundred messy ones. Start with the core platforms (Google, Bing, Apple Maps, Facebook, Yelp) and the top directories in your industry and country. Get those perfect before chasing the long tail.'] },
          { h: 'The most common citation problems', list: ['An old address still listed after a move', 'Tracking or call-forwarding numbers that differ from the main number', 'Name variations like “& Co.” vs “and Company”', 'Duplicate listings created by different staff over the years', 'Wrong categories on niche directories'] },
          { h: 'How to fix them', p: ['Create one master record with the exact format of your name, address and phone. Audit existing listings against it, claim and correct what you can, and remove duplicates. Then build new citations from the same master record. Ringscale’s citation workspace is built around exactly this workflow.'] }
        ]
      },
      {
        type: 'steps',
        eyebrow: 'Workflow',
        title: 'Your citation workflow in Ringscale',
        items: [
          { title: 'Create your business profile', text: 'Enter your official name, address, phone, website, hours, categories and description once.' },
          { title: 'Discover directories', text: 'Get a list of relevant directories for your country and industry.' },
          { title: 'Submit and track', text: 'Submit using the master profile and track each listing through to live.' },
          { title: 'Audit and fix', text: 'Flag mismatches on existing listings and correct them.' },
          { title: 'Measure the impact', text: 'Compare heatmaps before and after your citation clean-up.' },
          { title: 'Maintain', text: 'Update every listing from one place whenever your details change.' }
        ]
      }
    ],
    faqs: [
      { q: 'What is a local citation?', a: 'A local citation is any online mention of your business name, address and phone number, usually on directories, maps apps, social platforms and industry sites.' },
      { q: 'What does NAP stand for?', a: 'Name, Address, Phone number. Keeping NAP identical across the web is a core local SEO practice.' },
      { q: 'How many citations do I need?', a: 'There is no magic number. Focus on accuracy on the major platforms and the best directories for your industry and country first, then expand.' },
      { q: 'Do citations help with AI search?', a: 'Yes. AI assistants pull business facts from many sources. Consistent citations make it more likely they describe and recommend your business accurately.' }
    ]
  },

  'white-label-reporting': {
    nav: 'White Label Reporting',
    eyebrow: 'White Label Reporting',
    title: 'Client-ready reports with',
    highlight: 'your brand on them.',
    metaTitle: 'White Label Local SEO Reporting for Agencies | Ringscale AI',
    metaDescription: 'Send branded local SEO reports with heatmaps, rankings and results. White label branding for agencies, client accounts and credit management.',
    intro: 'Agencies win renewals with proof. Ringscale lets you present heatmaps, rank changes and wins under your own logo and colours, and manage every client account, and their credits, from one partner dashboard.',
    illustration: 'report',
    primaryCta: { label: 'Become a Partner', href: '/partners' },
    secondaryCta: trial,
    sections: [
      {
        type: 'features',
        eyebrow: 'Built for agencies',
        title: 'Look like you built the software yourself.',
        items: [
          { icon: Palette, title: 'Your branding', text: 'Upload your logo and set brand colours so reports and client dashboards carry your identity.' },
          { icon: Users, title: 'Client accounts', text: 'Create accounts for each client, with access to their own projects and reports.' },
          { icon: Zap, title: 'Credit management', text: 'Allocate credits to clients from your partner balance and keep usage under control.' },
          { icon: FileText, title: 'Heatmap reports', text: 'Include geo-grid scans, before-and-after comparisons and keyword trends in one document.' },
          { icon: Sparkles, title: 'AI summaries', text: 'Plain-English explanations of what changed and why, so clients understand the results.' },
          { icon: Mail, title: 'Easy sharing', text: 'Export and send reports on your schedule, or let clients view them in their dashboard.' }
        ]
      },
      {
        type: 'split',
        reverse: true,
        eyebrow: 'Why it works',
        title: 'Heatmaps sell local SEO better than words.',
        paragraphs: ['A spreadsheet of positions rarely impresses a business owner. A map of their own neighbourhood turning from red to green does. White-label heatmap reports make the value of your work obvious in seconds.', 'Because the reports carry your brand, they reinforce your agency’s expertise every month, instead of a tool vendor’s.'],
        bullets: ['Branded PDFs', 'Before/after maps', 'Keyword trends', 'Client dashboards'],
        illustration: 'compare'
      },
      {
        type: 'article',
        eyebrow: 'Best practice',
        title: 'What to put in a monthly local SEO report',
        blocks: [
          { h: 'Lead with outcomes', p: ['Start with the numbers the client cares about: calls, direction requests, website visits from Google Business Profile, and leads. Then show the ranking work that drove them.'] },
          { h: 'Show the map', p: ['Include the latest heatmap for each priority keyword and a comparison with the starting scan. Highlight areas where the client has entered the local pack.'] },
          { h: 'Explain, don’t just display', p: ['Two or three sentences per section explaining what happened and what you will do next build more trust than pages of charts.'] },
          { h: 'A simple structure', list: ['Summary of wins this month', 'Heatmap comparisons for key keywords', 'Keyword ranking table', 'Profile activity: posts, reviews, photos', 'Citations and website work completed', 'Plan for next month'] }
        ]
      }
    ],
    faqs: [
      { q: 'What is white label reporting?', a: 'White label reporting lets an agency deliver reports and dashboards under its own brand instead of the software provider’s.' },
      { q: 'Can my clients log in?', a: 'Yes. You can create client accounts that see their own projects and reports, managed from your partner dashboard.' },
      { q: 'How do credits work for agencies?', a: 'Partners hold a credit balance and can allocate credits to client accounts, so you control how much each client can scan.' },
      { q: 'Is there a partner programme?', a: 'Yes. Visit the Partners page to learn about agency pricing and the partner dashboard.' }
    ]
  },

  'ai-assist': {
    nav: 'AI Assist',
    eyebrow: 'AI Assist',
    title: 'Your local SEO strategist,',
    highlight: 'on call 24/7.',
    metaTitle: 'AI Assist: AI Local SEO Assistant | Ringscale AI',
    metaDescription: 'Ask questions, get action plans and generate content with an AI assistant that understands your rankings, profile and competitors.',
    intro: 'AI Assist is an AI local SEO assistant built into Ringscale. Ask it what to do next, why a ranking dropped, or to write a Google post, and it answers with context from your own data, not generic advice.',
    illustration: 'ai',
    primaryCta: trial,
    secondaryCta: pricing,
    sections: [
      {
        type: 'features',
        eyebrow: 'What you can ask',
        title: 'From “what should I do?” to done.',
        items: [
          { icon: Lightbulb, title: 'Action plans', text: '“What are the three most important things to improve my rankings this month?” Get a prioritised list.' },
          { icon: ScanSearch, title: 'Ranking diagnosis', text: '“Why am I red in the north of my service area?” AI Assist reads your heatmap and competitor data.' },
          { icon: PenLine, title: 'Content writing', text: 'Generate GBP posts, service descriptions, FAQs and location page drafts in your tone of voice.' },
          { icon: MessageSquare, title: 'Review replies', text: 'Draft thoughtful, on-brand replies to positive and negative reviews.' },
          { icon: Search, title: 'Keyword ideas', text: 'Find the search phrases customers in your area are likely to use.' },
          { icon: Bot, title: 'Plain-English answers', text: 'Ask any local SEO question and get a clear explanation without jargon.' }
        ]
      },
      {
        type: 'split',
        eyebrow: 'Context matters',
        title: 'Generic chatbots don’t know your map. AI Assist does.',
        paragraphs: ['A general AI chatbot can tell you to “get more reviews”. AI Assist can tell you that you’re ranking 8th to 12th in a specific area where a competitor with twice your reviews dominates, and suggest a targeted plan for that area.', 'Everything it produces is a draft you control. Edit, approve, and publish when you are happy.'],
        bullets: ['Uses your scan data', 'Knows your competitors', 'Writes in your tone', 'You approve everything'],
        illustration: 'analyzer'
      },
      {
        type: 'cards',
        eyebrow: 'Example prompts',
        title: 'Try asking AI Assist…',
        items: [
          { title: '“Write 4 Google posts for Diwali offers”', text: 'Seasonal posts with a clear call to action, ready to schedule.' },
          { title: '“Reply to this 2-star review”', text: 'A calm, professional reply that addresses the issue and invites the customer back.' },
          { title: '“Which keywords should a physio in Toronto track?”', text: 'A list of high-intent local keywords grouped by service.' },
          { title: '“Explain my last scan to my client”', text: 'A short, non-technical summary you can paste into an email.' },
          { title: '“Draft a location page for Brampton”', text: 'A structured page with services, FAQs and local details to customise.' },
          { title: '“What changed since last month?”', text: 'A comparison of your two most recent scans with likely causes.' }
        ]
      }
    ],
    faqs: [
      { q: 'What AI model powers AI Assist?', a: 'AI Assist uses leading large language models, combined with your Ringscale data, to give context-aware answers.' },
      { q: 'Will it publish anything without my approval?', a: 'No. AI Assist creates drafts and recommendations. You decide what gets published.' },
      { q: 'Is AI-written content bad for SEO?', a: 'Google’s guidance focuses on whether content is helpful, not how it was made. Use AI drafts as a starting point and add your real expertise, details and photos.' },
      { q: 'Is AI Assist included in my plan?', a: 'AI features are available across Ringscale plans, including the free trial.' }
    ]
  },

  'scan-analyzer': {
    nav: 'Scan Analyzer',
    eyebrow: 'Scan Analyzer',
    title: 'Heatmaps that explain',
    highlight: 'themselves.',
    metaTitle: 'Scan Analyzer: AI Analysis of Local Rank Heatmaps | Ringscale AI',
    metaDescription: 'Turn geo-grid heatmaps into clear insights. Scan Analyzer finds patterns, weak areas and competitor strongholds, and tells you what to fix first.',
    intro: 'A heatmap shows what is happening. Scan Analyzer tells you why, and what to do about it. It reviews every pin, every competitor and every change since your last scan, then summarises the insight in plain English.',
    illustration: 'analyzer',
    primaryCta: trial,
    secondaryCta: pricing,
    sections: [
      {
        type: 'features',
        eyebrow: 'Insights',
        title: 'What Scan Analyzer looks for',
        items: [
          { icon: Compass, title: 'Directional weakness', text: 'Detects when one side of your service area underperforms and points to the likely cause.' },
          { icon: Users, title: 'Competitor strongholds', text: 'Identifies which competitors dominate which pins and how strong their profiles are.' },
          { icon: Gauge, title: 'Core strength', text: 'Measures how far your top-3 radius extends from your location.' },
          { icon: History, title: 'Change detection', text: 'Highlights pins that improved or dropped since your previous scan.' },
          { icon: Lightbulb, title: 'Prioritised fixes', text: 'Ranks recommended actions by likely impact so you start with what matters.' },
          { icon: FileText, title: 'Report-ready summaries', text: 'Copy insights straight into client reports or team updates.' }
        ]
      },
      {
        type: 'article',
        eyebrow: 'Patterns explained',
        title: 'Five heatmap patterns and what they mean',
        blocks: [
          { h: '1. The bullseye', p: ['Green in the middle, red at the edges. Normal and healthy. Grow it by improving prominence: more reviews, better citations and stronger website signals.'] },
          { h: '2. The half moon', p: ['Strong on one side, weak on the other. Usually a dominant competitor or a natural barrier. Target that area with location content, local links and reviews from customers there.'] },
          { h: '3. All red', p: ['Weak even next to your own address. Typically a relevance problem: wrong primary category, a sparse profile, or a keyword that doesn’t match what Google thinks you do.'] },
          { h: '4. Scattered', p: ['Random greens and reds. Often a sign of a volatile market or a keyword where Google is still testing results. Watch the trend across several scans rather than reacting to one.'] },
          { h: '5. Sudden drop', p: ['Green last scan, red now. Check for profile edits, suspensions, a new competitor, a category change, or a Google update. Scan Analyzer flags these changes automatically.'] }
        ]
      }
    ],
    faqs: [
      { q: 'Does Scan Analyzer cost extra credits?', a: 'No. Analysis runs on scans you have already performed.' },
      { q: 'How accurate are the recommendations?', a: 'They are based on your scan data, competitor data and established local SEO principles. Treat them as an expert starting point and use follow-up scans to confirm what works.' },
      { q: 'Can I share the analysis with clients?', a: 'Yes. Summaries are written to be easy to paste into reports and emails.' }
    ]
  },

  '360-local-seo-audit': {
    nav: '360 Local SEO Audit',
    eyebrow: '360° Local SEO Audit',
    title: 'Every local ranking factor,',
    highlight: 'checked in one audit.',
    metaTitle: '360° Local SEO Audit Tool | Ringscale AI',
    metaDescription: 'Audit your Google Business Profile, website, citations, reviews and rankings in one place, with a prioritised list of fixes.',
    intro: 'Most audits look at one thing: your website, or your listing, or your reviews. Customers and Google see all of it at once. Ringscale’s 360° audit checks every part of your local presence and turns the findings into a clear, prioritised to-do list.',
    illustration: 'audit',
    primaryCta: trial,
    secondaryCta: pricing,
    sections: [
      {
        type: 'features',
        eyebrow: 'What we audit',
        title: 'Six areas, one score.',
        items: [
          { icon: Building2, title: 'Google Business Profile', text: 'Categories, completeness, photos, posts, Q&A and review responses.' },
          { icon: Globe, title: 'Website', text: 'Technical health, page speed, mobile usability, title tags, location pages and schema.' },
          { icon: Link2, title: 'Citations', text: 'NAP consistency across major and industry directories.' },
          { icon: Star, title: 'Reviews', text: 'Rating, volume, velocity and response rate compared with competitors.' },
          { icon: Grid3x3, title: 'Rankings', text: 'Geo-grid visibility for your priority keywords.' },
          { icon: Sparkles, title: 'AI visibility', text: 'Whether AI assistants have the facts they need to recommend you.' }
        ]
      },
      {
        type: 'split',
        eyebrow: 'Output',
        title: 'Findings you can act on today.',
        paragraphs: ['Every issue comes with an explanation, why it matters, and how to fix it. Issues are sorted by impact so your first hour of work makes the biggest difference.', 'Re-run the audit after your fixes and watch the score climb alongside your heatmaps.'],
        bullets: ['Overall score', 'Per-area scores', 'Prioritised fixes', 'Re-audit anytime'],
        illustration: 'checklist'
      },
      {
        type: 'steps',
        eyebrow: 'Process',
        title: 'How the audit works',
        items: [
          { title: 'Connect your business', text: 'Select your Business Profile and enter your website.' },
          { title: 'Automated checks', text: 'Ringscale crawls your site, reviews your profile and checks citations and rankings.' },
          { title: 'Scoring', text: 'Each area gets a score, combined into one overall local SEO score.' },
          { title: 'Task list', text: 'Issues are turned into tasks you can assign and tick off.' },
          { title: 'Fix', text: 'Use Ringscale’s GBP, citation and AI tools to resolve issues quickly.' },
          { title: 'Re-audit', text: 'Measure progress and keep improving.' }
        ]
      }
    ],
    faqs: [
      { q: 'How long does an audit take?', a: 'Most audits complete in a few minutes, depending on the size of your website.' },
      { q: 'Is the audit useful for agencies?', a: 'Yes. A 360° audit is an excellent sales tool for prospects and a baseline for new clients.' },
      { q: 'How often should I run an audit?', a: 'Run one at the start, after major changes, and at least quarterly to catch new issues.' }
    ]
  },

  'local-seo-reporting': {
    nav: 'Local SEO Reporting',
    eyebrow: 'Local SEO Reporting',
    title: 'Reporting that shows',
    highlight: 'real local growth.',
    metaTitle: 'Local SEO Reporting Software | Ringscale AI',
    metaDescription: 'Automated local SEO reports with geo-grid heatmaps, keyword rankings, Google Business Profile activity and website performance.',
    intro: 'Pull rankings, heatmaps, Google Business Profile activity and website performance into one clear report. Ringscale does the data gathering so you can spend your time on the work, and the story.',
    illustration: 'report',
    primaryCta: trial,
    secondaryCta: { label: 'White Label Options', href: '/features/white-label-reporting' },
    sections: [
      {
        type: 'features',
        eyebrow: 'In every report',
        title: 'All your local data, one document.',
        items: [
          { icon: Grid3x3, title: 'Heatmaps', text: 'The latest geo-grid scan for each keyword, plus comparisons over time.' },
          { icon: BarChart3, title: 'Keyword rankings', text: 'Average rank, top-3 share and movement for every tracked keyword.' },
          { icon: PieChart, title: 'Search Console data', text: 'Clicks, impressions and queries from Google Search Console for your site.' },
          { icon: Building2, title: 'Profile activity', text: 'Posts, photos and reviews added during the period.' },
          { icon: ClipboardCheck, title: 'Work completed', text: 'Tasks, citations and changes logged in Ringscale.' },
          { icon: Sparkles, title: 'AI commentary', text: 'A written summary explaining results in plain English.' }
        ]
      },
      {
        type: 'article',
        eyebrow: 'Guide',
        title: 'Which local SEO metrics actually matter?',
        blocks: [
          { h: 'Visibility metrics', p: ['Average geo-grid rank and top-3 share tell you how visible you are across your area. They respond faster than revenue, which makes them the best leading indicator of local SEO progress.'] },
          { h: 'Engagement metrics', p: ['Calls, direction requests, website clicks and messages from your Business Profile show whether visibility is turning into action.'] },
          { h: 'Website metrics', p: ['Organic clicks and impressions from Search Console reveal how your site performs for local and service queries.'] },
          { h: 'Metrics to stop reporting', list: ['Single-point rankings from a city centre', 'Total backlinks without context', 'Vanity traffic from irrelevant locations', 'Long lists of keywords nobody searches'] }
        ]
      }
    ],
    faqs: [
      { q: 'Can reports be automated?', a: 'Ringscale keeps data fresh with automatic re-scans every 15 days, so reports always reflect recent rankings.' },
      { q: 'Can I brand the reports?', a: 'Yes. Agencies can use white-label branding on reports and client dashboards.' },
      { q: 'Does reporting include Google Search Console?', a: 'Yes. Connect Search Console to include website clicks, impressions and queries.' }
    ]
  },

  'side-by-side-compare': {
    nav: 'Side-by-Side Compare',
    eyebrow: 'Side-by-Side Compare',
    title: 'See progress, not just',
    highlight: 'positions.',
    metaTitle: 'Side-by-Side Heatmap Comparison | Ringscale AI',
    metaDescription: 'Compare any two geo-grid scans side by side to prove local SEO progress, spot drops and understand competitor movement.',
    intro: 'Pick any two scans for the same keyword and Ringscale lays them side by side, pin by pin. Improvements, drops and changes in average rank are calculated for you, so you can prove what worked.',
    illustration: 'compare',
    primaryCta: trial,
    secondaryCta: pricing,
    sections: [
      {
        type: 'features',
        eyebrow: 'Compare anything',
        title: 'Two scans. Every difference.',
        items: [
          { icon: Columns2, title: 'Pin-by-pin changes', text: 'See exactly which locations improved, held or declined.' },
          { icon: TrendingUp, title: 'Summary metrics', text: 'Average rank, top-3 share and visibility, before and after.' },
          { icon: History, title: 'Any date range', text: 'Compare your first scan with your latest, or last month with this month.' },
          { icon: Users, title: 'Competitor shifts', text: 'See which competitors gained or lost ground where.' },
          { icon: Eye, title: 'Clear visuals', text: 'Colour-coded maps anyone can understand, no SEO knowledge needed.' },
          { icon: FileText, title: 'Report-ready', text: 'Drop comparisons into client reports to prove value.' }
        ]
      },
      {
        type: 'split',
        reverse: true,
        eyebrow: 'Use cases',
        title: 'When to compare scans',
        paragraphs: ['After a big change: a new category, a website relaunch, a review campaign or a citation clean-up. Comparisons tell you whether it worked within weeks.', 'For clients: monthly comparisons make progress visible and keep renewals easy.', 'For troubleshooting: when results dip, compare to find where and when the drop happened.'],
        bullets: ['Campaign results', 'Monthly reviews', 'Drop investigation', 'Competitor tracking'],
        illustration: 'heatmap'
      }
    ],
    faqs: [
      { q: 'Do I need two scans with the same settings?', a: 'For the cleanest comparison, use scans of the same keyword with the same grid shape and radius. Automatic re-scans keep settings consistent for you.' },
      { q: 'What if I only have one scan?', a: 'Ringscale will let you know a comparison needs at least two scans. Your next automatic re-scan runs within 15 days, or you can run one manually.' }
    ]
  },

  'serp-tracker': {
    nav: 'SERP Tracker',
    eyebrow: 'SERP Tracker',
    title: 'Track organic rankings',
    highlight: 'alongside the map.',
    metaTitle: 'SERP Tracker: Organic Keyword Rank Tracking | Ringscale AI',
    metaDescription: 'Track your website’s organic Google rankings next to your Maps rankings, with Search Console data and trend history.',
    intro: 'Local customers see both the map pack and the organic results beneath it. Ringscale’s SERP Tracker follows your website’s organic positions for the keywords that matter, so you have the full search picture in one dashboard.',
    illustration: 'serp',
    primaryCta: trial,
    secondaryCta: pricing,
    sections: [
      {
        type: 'features',
        eyebrow: 'Features',
        title: 'Organic tracking without the noise.',
        items: [
          { icon: Search, title: 'Keyword positions', text: 'Track where your pages rank in Google’s organic results.' },
          { icon: LineChart, title: 'Trend history', text: 'See movement over days, weeks and months.' },
          { icon: PieChart, title: 'Search Console sync', text: 'Bring in clicks, impressions, CTR and average position from Google Search Console.' },
          { icon: FileText, title: 'Ranking pages', text: 'Know which URL ranks for each keyword, and spot cannibalisation.' },
          { icon: Smartphone, title: 'Local intent focus', text: 'Built for service and “near me” keywords, not just national terms.' },
          { icon: Bell, title: 'Change highlights', text: 'Quickly see the biggest gains and drops.' }
        ]
      },
      {
        type: 'article',
        eyebrow: 'Why both',
        title: 'Map rankings and organic rankings work together',
        blocks: [
          { p: ['For local searches, Google usually shows the map pack first and organic results underneath. Many customers scroll past the map to the websites below, especially for higher-value services where they want to research first.', 'Your website also feeds your map rankings: Google uses the authority and relevance of the linked website as part of prominence. Improving one tends to lift the other. Tracking both in one place shows you that relationship.'] },
          { h: 'Keywords worth tracking organically', list: ['Service + city (“roof repair Mississauga”)', 'Service + neighbourhood', 'Problem-based queries (“AC not cooling”)', 'Comparison queries (“best dentist in Janakpuri”)', 'Brand name searches'] }
        ]
      }
    ],
    faqs: [
      { q: 'What is a SERP tracker?', a: 'A SERP (search engine results page) tracker monitors where your website ranks in organic search results for chosen keywords over time.' },
      { q: 'How is this different from the heatmap?', a: 'The heatmap measures Google Maps / local pack rankings from many locations. The SERP tracker measures your website’s position in the regular organic results.' },
      { q: 'Do I need Google Search Console?', a: 'It is optional but recommended. Connecting it adds real click and impression data.' }
    ]
  },

  'ai-tracker': {
    nav: 'AI Tracker',
    eyebrow: 'AI Tracker',
    title: 'Find out if AI recommends you,',
    highlight: 'or your competitors.',
    metaTitle: 'AI Tracker: Track Brand Visibility in ChatGPT & AI Search | Ringscale AI',
    metaDescription: 'Monitor how ChatGPT, Google AI Overviews, Gemini and Perplexity describe and recommend your business, and improve your AI visibility.',
    intro: 'Customers increasingly ask AI assistants who to call. AI Tracker monitors the questions that matter for your business across major AI engines, records whether you’re mentioned, and shows which competitors are recommended instead.',
    illustration: 'aitracker',
    primaryCta: trial,
    secondaryCta: { label: 'AEO Services', href: '/services/aeo' },
    sections: [
      {
        type: 'features',
        eyebrow: 'What it tracks',
        title: 'Your share of AI answers.',
        items: [
          { icon: Bot, title: 'Multi-engine monitoring', text: 'Track answers from ChatGPT, Google AI Overviews, Gemini, Perplexity and Copilot.' },
          { icon: Quote, title: 'Mention & citation tracking', text: 'See whether your brand is named, and whether your website is cited as a source.' },
          { icon: Users, title: 'Competitor share', text: 'Find out which competitors AI recommends for your target questions.' },
          { icon: ShieldCheck, title: 'Accuracy checks', text: 'Catch outdated or wrong facts AI is repeating about your business.' },
          { icon: TrendingUp, title: 'Trends over time', text: 'Watch your AI visibility grow as you improve content and citations.' },
          { icon: Lightbulb, title: 'Recommendations', text: 'Get specific content and schema actions to improve your chances of being recommended.' }
        ]
      },
      {
        type: 'split',
        eyebrow: 'The shift',
        title: 'Search is moving from links to answers.',
        paragraphs: ['When someone asks an AI assistant for “the best family dentist near me”, they often get a short list of names, not ten blue links. If you aren’t on that list, you’re not considered.', 'AI engines lean on the same foundations as local SEO, such as reviews, consistent citations, clear website content and structured data, but they weigh them differently. AI Tracker shows where you stand so you can act.'],
        bullets: ['Brand mentions', 'Source citations', 'Competitor share', 'Fact accuracy'],
        illustration: 'ai'
      },
      {
        type: 'cards',
        eyebrow: 'Learn more',
        title: 'Improve your AI visibility',
        items: [
          { title: 'ChatGPT Visibility Guide', text: 'A practical guide to getting your local business recommended by ChatGPT.', href: '/chatgpt-visibility-guide', linkLabel: 'Read the guide' },
          { title: 'AEO Services', text: 'Done-for-you Answer Engine Optimization: FAQs, service pages and schema.', href: '/services/aeo', linkLabel: 'Explore AEO' },
          { title: 'Free Schema Generator', text: 'Create LocalBusiness and FAQ structured data in seconds.', href: '/tools/schema-generator', linkLabel: 'Generate schema' }
        ]
      }
    ],
    faqs: [
      { q: 'Can I see exactly what ChatGPT says about my business?', a: 'AI Tracker records answers to the questions you track, so you can see whether and how your business is mentioned. AI answers vary between sessions, so we look at trends across repeated checks rather than a single response.' },
      { q: 'How do I get recommended by AI assistants?', a: 'Strong reviews, consistent citations, clear question-and-answer content on your website, structured data and an accurate Google Business Profile all help. Our ChatGPT Visibility Guide covers the details.' },
      { q: 'Is this the same as AEO?', a: 'AI Tracker measures your AI visibility. AEO (Answer Engine Optimization) is the work that improves it. They work best together.' }
    ]
  }
}

export const featureList = Object.entries(features).map(([slug, f]) => ({ slug, ...f }))
