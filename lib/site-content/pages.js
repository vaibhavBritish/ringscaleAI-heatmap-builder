// Content for standalone company & resource pages (each has its own thin route file).

import {
  Target, Heart, Zap, Globe, Users, ShieldCheck, MapPin, Bot, Building2, Briefcase, Store,
  HandCoins, Repeat, BarChart3, Megaphone, BookOpen, LifeBuoy, CreditCard, Settings, Grid3x3,
  FileText, KeyRound, Webhook, Database, Lock, Sparkles, Star, Code2, Newspaper, Video,
  GraduationCap, Rocket, Layers, Search, Gauge, ListChecks, Gift
} from 'lucide-react'

const trial = { label: 'Start 7-Day Free Trial', href: '/register' }
const contact = { label: 'Contact Us', href: '/contact-us' }

export const pages = {
  about: {
    eyebrow: 'About Ringscale AI',
    title: 'We help local businesses',
    highlight: 'get found.',
    metaTitle: 'About Ringscale AI: Local Search Visibility Platform',
    metaDescription: 'Ringscale AI builds geo-grid heatmaps, Google Business Profile tools and AI search visibility software for local businesses and agencies, with offices in Delhi and Mississauga.',
    intro: 'Ringscale AI is a local search platform for businesses and the agencies that serve them. We show you where you rank on Google Maps, street by street, explain why, and give you the tools to climb, in classic search and in the new world of AI answers.',
    illustration: 'team',
    primaryCta: trial,
    secondaryCta: contact,
    sections: [
      {
        type: 'split',
        eyebrow: 'Our story',
        title: 'Built by people who did local SEO the hard way.',
        paragraphs: [
          'Ringscale grew out of agency work. We spent years helping clinics, restaurants, contractors and retailers win in their neighbourhoods, and kept running into the same problem: no single number told us, or our clients, how visible a business really was.',
          'A business could rank first on its own street and be invisible where its customers actually lived. So we started measuring rankings from a grid of real locations, and the heatmap changed every conversation. Clients could finally see their market.',
          'Ringscale AI turns that approach into a platform anyone can use: geo-grid heatmaps, Google Business Profile tools, citations, audits and AI insights in one place, priced for local businesses in India and North America.'
        ],
        illustration: 'heatmap'
      },
      {
        type: 'features',
        eyebrow: 'What we believe',
        title: 'Our principles',
        items: [
          { icon: Target, title: 'Measure what customers see', text: 'Rankings should be measured where customers search, not from one convenient point.' },
          { icon: ShieldCheck, title: 'Sustainable, white-hat growth', text: 'We build tools around trusted signals: accurate profiles, real reviews, consistent citations and helpful content.' },
          { icon: Heart, title: 'Small businesses first', text: 'Enterprise-grade insight shouldn’t need an enterprise budget. Our pricing reflects the markets we serve.' },
          { icon: Bot, title: 'AI that explains', text: 'AI should make data understandable and actionable, not add another dashboard to decode.' },
          { icon: Users, title: 'Agencies are partners', text: 'White-label tools, client accounts and credit management help agencies grow with us.' },
          { icon: Zap, title: 'Ship fast, listen closely', text: 'We release improvements continuously and build on feedback from real users.' }
        ]
      },
      {
        type: 'cards',
        eyebrow: 'Where we are',
        title: 'Two offices, one mission',
        items: [
          { icon: MapPin, title: 'Delhi, India', text: 'First Floor, C-9, near Janakpuri Metro Station, Pocket C1, New Krishna Park, Vikaspuri, Delhi 110018.' },
          { icon: MapPin, title: 'Mississauga, Canada', text: '1470 Hurontario St, Mississauga, Ontario L5G 3H4.' },
          { icon: Globe, title: 'Customers worldwide', text: 'Our platform serves local businesses and agencies across India, the US, Canada and beyond.' }
        ]
      },
      {
        type: 'cards',
        eyebrow: 'Who we serve',
        title: 'Built for every kind of local business',
        items: [
          { icon: Store, title: 'Local businesses', text: 'Clinics, salons, restaurants, gyms, contractors and retailers that depend on nearby customers.' },
          { icon: Building2, title: 'Multi-location brands', text: 'Franchises and chains that need visibility data for every branch.' },
          { icon: Briefcase, title: 'Agencies', text: 'SEO and marketing agencies delivering local results to many clients.' }
        ]
      }
    ],
    faqs: [
      { q: 'What does Ringscale AI do?', a: 'Ringscale AI is a local SEO platform. It tracks your Google Maps rankings across your service area with geo-grid heatmaps, and provides Google Business Profile, citation, audit, reporting and AI tools to improve them.' },
      { q: 'Where is Ringscale based?', a: 'We have offices in Delhi, India and Mississauga, Ontario, Canada.' },
      { q: 'Who uses Ringscale?', a: 'Local business owners, marketing teams at multi-location brands, and SEO agencies.' }
    ],
    cta: { title: 'See your market the way Google does.', text: 'Run your first heatmap free. It takes about two minutes.' }
  },

  faq: {
    eyebrow: 'FAQ',
    title: 'Answers to',
    highlight: 'common questions.',
    metaTitle: 'Frequently Asked Questions | Ringscale AI',
    metaDescription: 'Answers about Ringscale AI plans, credits, geo-grid scans, billing, the free trial, agencies and data.',
    intro: 'Everything you need to know about Ringscale: how scans work, how credits are used, billing, the free trial and agency features. Can’t find your answer? Our support team is happy to help.',
    primaryCta: trial,
    secondaryCta: { label: 'Contact Support', href: '/contact-us' },
    sections: [
      {
        type: 'cards',
        eyebrow: 'Browse by topic',
        title: 'Popular topics',
        items: [
          { icon: Grid3x3, title: 'Scans & heatmaps', text: 'How geo-grid scans work, grid sizes, radius and re-scans.', href: '#faq', linkLabel: 'See answers' },
          { icon: CreditCard, title: 'Plans & billing', text: 'Plans, credits, payment methods and renewals.', href: '#faq', linkLabel: 'See answers' },
          { icon: Users, title: 'Agencies', text: 'Client accounts, white-label branding and credit allocation.', href: '/partners', linkLabel: 'Partner info' }
        ]
      }
    ],
    faqs: [
      { q: 'What is Ringscale AI?', a: 'Ringscale AI is a local SEO platform that tracks Google Maps rankings with geo-grid heatmaps and provides tools for Google Business Profile management, citations, audits, reporting and AI visibility.' },
      { q: 'How does a geo-grid scan work?', a: 'We place a grid of 20 to 35 pins around your business, run the same Google Maps search from each pin, and record your position at every point. The results are displayed as a colour-coded heatmap.' },
      { q: 'What are credits?', a: 'Credits are what you use to track keywords. Adding a keyword to track uses 100 credits, and automatic re-scans of that keyword every 15 days are included.' },
      { q: 'How many keywords can I track?', a: 'It depends on your credits. The trial includes 300 credits; Advance includes 1,200, Pro 2,400 and Pro Plus 5,000. Use our Credit Estimator to plan your usage.' },
      { q: 'What scan radius can I use?', a: 'Up to 5 miles on the trial and Advance plan, 10 miles on Pro and 20 miles on Pro Plus.' },
      { q: 'How long does each plan last?', a: 'In India, Advance lasts 1 month, Pro 3 months and Pro Plus 12 months. Outside India, plans are monthly.' },
      { q: 'Is there a free trial?', a: 'Yes. The 7-day free trial includes 300 credits, a 5-mile radius and the heatmap dashboard. No card is required.' },
      { q: 'Which payment methods do you accept?', a: 'Customers in India pay in INR via Razorpay (cards, UPI, netbanking and more). Customers elsewhere pay in USD by card via Stripe.' },
      { q: 'Do plans renew automatically?', a: 'Plans are one-time purchases for a fixed period. We will remind you before your plan ends so you can renew.' },
      { q: 'What happens when my plan or credits run out?', a: 'Your data stays safe, but premium features such as new scans are locked until you renew or add credits.' },
      { q: 'Can agencies manage clients?', a: 'Yes. Partner accounts can create client accounts, allocate credits and apply white-label branding.' },
      { q: 'Do you offer custom plans?', a: 'Yes. For larger volumes, multiple locations or special requirements, see our Custom Package page or contact sales.' },
      { q: 'Is my data secure?', a: 'Yes. Data is transmitted over HTTPS, payments are handled by PCI-compliant providers (Stripe and Razorpay), and we never sell your data. See our Privacy Policy for details.' },
      { q: 'How do I contact support?', a: 'Use the Contact Us page and our team will get back to you.' }
    ]
  },

  'affiliate-program': {
    eyebrow: 'Affiliate Program',
    title: 'Recommend Ringscale.',
    highlight: 'Earn on every sale.',
    metaTitle: 'Affiliate Program: Earn by Referring Ringscale AI',
    metaDescription: 'Join the Ringscale AI affiliate program. Refer local businesses and agencies to Ringscale and earn commission on qualifying purchases.',
    intro: 'If you work with local businesses, write about marketing, or run a community of agency owners, the Ringscale affiliate program lets you earn commission for every customer you refer.',
    illustration: 'growth',
    primaryCta: { label: 'Apply to Join', href: '/contact-us' },
    secondaryCta: { label: 'Agency Partner Program', href: '/partners' },
    sections: [
      {
        type: 'steps',
        eyebrow: 'How it works',
        title: 'Three steps to start earning',
        items: [
          { title: 'Apply', text: 'Tell us about your audience and how you plan to promote Ringscale.' },
          { title: 'Share your link', text: 'Get a unique referral link and marketing assets: screenshots, heatmap examples and copy.' },
          { title: 'Earn commission', text: 'Earn on qualifying purchases from customers who sign up through your link.' }
        ]
      },
      {
        type: 'features',
        eyebrow: 'Why partner with us',
        title: 'An easy product to recommend',
        items: [
          { icon: Grid3x3, title: 'Visual “aha” moment', text: 'A heatmap of a business’s own neighbourhood sells itself. Prospects see the value instantly.' },
          { icon: Gift, title: 'Free trial', text: 'Your referrals can start with a 7-day free trial, no card required.' },
          { icon: Globe, title: 'India & global pricing', text: 'INR and USD pricing make Ringscale easy to sell in multiple markets.' },
          { icon: HandCoins, title: 'Competitive commission', text: 'Attractive commission on qualifying sales. Current rates are shared when you apply.' },
          { icon: BarChart3, title: 'Tracking', text: 'Track referrals and conversions so you always know what you have earned.' },
          { icon: Megaphone, title: 'Marketing support', text: 'Ready-made assets and guidance on promoting Ringscale effectively.' }
        ]
      },
      {
        type: 'cards',
        eyebrow: 'Who should join',
        title: 'Great fit for…',
        items: [
          { icon: Users, title: 'Marketing consultants', text: 'Recommend a tool your local clients will actually use.' },
          { icon: Newspaper, title: 'Bloggers & creators', text: 'Writers and YouTubers covering SEO, small business and marketing.' },
          { icon: Building2, title: 'Web designers', text: 'Add local visibility tracking to every website you hand over.' }
        ]
      }
    ],
    faqs: [
      { q: 'How much commission can I earn?', a: 'Commission rates are shared with approved affiliates and may vary by market and volume. Apply and our team will send the current terms.' },
      { q: 'What is the difference between affiliates and agency partners?', a: 'Affiliates refer customers and earn commission. Agency partners use Ringscale to serve their own clients, with white-label branding and client accounts.' },
      { q: 'Is there a cost to join?', a: 'No. The affiliate program is free to join.' }
    ]
  },

  'custom-package': {
    eyebrow: 'Custom Package',
    title: 'A plan built around',
    highlight: 'your business.',
    metaTitle: 'Custom Local SEO Package | Ringscale AI',
    metaDescription: 'Need more credits, locations, radius or done-for-you services? Get a custom Ringscale AI package for multi-location brands and agencies.',
    intro: 'Standard plans don’t fit everyone. Multi-location brands, franchises, large agencies and businesses that want hands-on help can get a custom Ringscale package with the credits, features and services they need.',
    illustration: 'report',
    primaryCta: { label: 'Request a Custom Quote', href: '/contact-us' },
    secondaryCta: { label: 'See Standard Plans', href: '/#pricing' },
    sections: [
      {
        type: 'features',
        eyebrow: 'Customise',
        title: 'What we can tailor',
        items: [
          { icon: Zap, title: 'Credit volume', text: 'Bulk credits for tracking many keywords across many locations.' },
          { icon: Building2, title: 'Multi-location setup', text: 'Projects for every branch, organised the way your business is.' },
          { icon: MapPin, title: 'Scan coverage', text: 'Coverage plans matched to large or regional service areas.' },
          { icon: Users, title: 'Team & client seats', text: 'Accounts for your team members and your clients.' },
          { icon: Sparkles, title: 'Done-for-you services', text: 'GBP optimisation, citation building and AEO handled by our team.' },
          { icon: LifeBuoy, title: 'Priority support', text: 'A dedicated contact for onboarding and ongoing help.' }
        ]
      },
      {
        type: 'steps',
        eyebrow: 'Process',
        title: 'How we build your package',
        items: [
          { title: 'Tell us your goals', text: 'Share your locations, keywords, markets and what success looks like.' },
          { title: 'Free visibility snapshot', text: 'We run sample scans so we both understand your starting point.' },
          { title: 'Proposal', text: 'A clear package with credits, features, services and pricing.' },
          { title: 'Onboarding', text: 'We set up projects, keywords, branding and users with you.' },
          { title: 'Ongoing reviews', text: 'Regular check-ins to adjust as your needs change.' }
        ]
      },
      {
        type: 'cards',
        eyebrow: 'Ideal for',
        title: 'Who custom packages are for',
        items: [
          { icon: Building2, title: 'Franchises & chains', text: 'Consistent tracking and reporting across every location.' },
          { icon: Briefcase, title: 'Large agencies', text: 'High-volume credits, white-label branding and client management.' },
          { icon: Store, title: 'Ambitious single locations', text: 'Businesses that want expert, hands-on help to dominate their area.' }
        ]
      }
    ],
    faqs: [
      { q: 'Is there a minimum size for a custom package?', a: 'No strict minimum. If standard plans don’t fit, contact us and we will find the right option.' },
      { q: 'Can a custom package include services?', a: 'Yes. We can include done-for-you GBP optimisation, citations, AEO and reporting.' },
      { q: 'How quickly can we start?', a: 'Most custom packages are set up within a few working days of agreeing the proposal.' }
    ]
  },

  'help-center': {
    eyebrow: 'Help Center',
    title: 'How can we',
    highlight: 'help you?',
    metaTitle: 'Help Center | Ringscale AI',
    metaDescription: 'Guides for getting started with Ringscale AI: creating projects, running geo-grid scans, reading heatmaps, credits, billing and agency features.',
    intro: 'Step-by-step guides to everything in Ringscale, from your first scan to managing agency clients. If you’re stuck, our support team is one message away.',
    illustration: 'docs',
    primaryCta: { label: 'Contact Support', href: '/contact-us' },
    secondaryCta: { label: 'Read the FAQ', href: '/faq' },
    sections: [
      {
        type: 'cards',
        eyebrow: 'Browse',
        title: 'Help topics',
        items: [
          { icon: Rocket, title: 'Getting started', text: 'Create your account, add your business and run your first scan.', href: '#getting-started', linkLabel: 'Read guide' },
          { icon: Grid3x3, title: 'Scans & heatmaps', text: 'Grid settings, reading results, re-scans and comparisons.', href: '#scans', linkLabel: 'Read guide' },
          { icon: CreditCard, title: 'Credits & billing', text: 'How credits work, plans, payments and invoices.', href: '#billing', linkLabel: 'Read guide' },
          { icon: Building2, title: 'Google Business Profile', text: 'Connecting and optimising your profile.', href: '/features/gbp-management', linkLabel: 'Learn more' },
          { icon: Users, title: 'Agencies & clients', text: 'Partner dashboard, client accounts and branding.', href: '#agencies', linkLabel: 'Read guide' },
          { icon: Settings, title: 'Account settings', text: 'Profile, password, team and notifications.', href: '#account', linkLabel: 'Read guide' }
        ]
      },
      {
        type: 'article',
        id: 'getting-started',
        eyebrow: 'Guide',
        title: 'Getting started with Ringscale',
        blocks: [
          { h: '1. Create your account', p: ['Sign up for the free 7-day trial. You get 300 credits and access to the heatmap dashboard with no card required.'] },
          { h: '2. Create a project', p: ['From the dashboard, choose New Project and search for your business by name. Ringscale finds your Google Business Profile and places the centre pin at your location.'] },
          { h: '3. Add keywords', p: ['Add the searches your customers use. Think about services (“teeth whitening”), problems (“tooth pain”) and “near me” variations. Each tracked keyword uses 100 credits.'] },
          { h: '4. Configure the grid', p: ['Pick a circle or square shape, a density of 20 to 35 pins (25 is recommended), and a radius in miles or kilometres within your plan limit.'] },
          { h: '5. Run and review', p: ['Start the scan. Results usually arrive within a couple of minutes. Open the heatmap to see your position at each pin.'] }
        ]
      },
      {
        type: 'article',
        id: 'scans',
        eyebrow: 'Guide',
        title: 'Scans, heatmaps and re-scans',
        blocks: [
          { h: 'Reading the colours', p: ['Green pins are positions 1–3 (the local pack). Yellow and amber are positions 4–10. Orange and red mean you’re ranked low or not at all from that point.'] },
          { h: 'Automatic re-scans', p: ['Every tracked keyword is re-scanned automatically every 15 days at no extra credit cost, building your ranking history.'] },
          { h: 'Comparing scans', p: ['Open a keyword and choose Compare to view two scans side by side. You need at least two scans of the same keyword to compare.'] },
          { h: 'Tips for accurate scans', list: ['Keep grid settings the same between scans you want to compare', 'Choose a radius that matches how far customers travel', 'Track specific keywords rather than very broad ones', 'Run a manual scan after major profile changes'] }
        ]
      },
      {
        type: 'article',
        id: 'billing',
        eyebrow: 'Guide',
        title: 'Credits and billing',
        blocks: [
          { p: ['Credits are used when you add a keyword to track (100 credits per keyword). Your plan sets your credits, maximum radius and access period.'] },
          { list: ['India: pay in INR via Razorpay. Advance lasts 1 month, Pro 3 months, Pro Plus 12 months', 'Outside India: pay in USD by card via Stripe; plans are monthly', 'Invoices are available on the Billing page', 'We email reminders before your plan ends'] }
        ]
      },
      {
        type: 'article',
        id: 'agencies',
        eyebrow: 'Guide',
        title: 'Agencies and client accounts',
        blocks: [
          { p: ['Partner accounts get a partner dashboard where you can add client accounts, transfer credits to them and set your branding.'] },
          { list: ['Partner → Clients: create and manage client accounts', 'Partner → Branding: upload your logo and colours', 'Transfer credits from your balance to any client', 'Clients see their own projects and reports'] }
        ]
      },
      {
        type: 'article',
        id: 'account',
        eyebrow: 'Guide',
        title: 'Account settings',
        blocks: [
          { p: ['Open Settings from the dashboard sidebar to update your name, email, password and notification preferences. Forgot your password? Use the “Forgot password” link on the login page to reset it by email.'] }
        ]
      }
    ],
    cta: { title: 'Still need help?', text: 'Our support team will get back to you as quickly as possible.', label: 'Contact Support', href: '/contact-us' }
  },

  'seo-news': {
    eyebrow: 'SEO News',
    title: 'Local search news,',
    highlight: 'explained for businesses.',
    metaTitle: 'Local SEO News & Updates | Ringscale AI',
    metaDescription: 'The latest local SEO, Google Business Profile and AI search developments, and what they mean for local businesses and agencies.',
    intro: 'Google, AI assistants and map apps change constantly. We follow the developments that affect local businesses and explain what they mean in practice, without the hype.',
    illustration: 'news',
    primaryCta: { label: 'Read the Blog', href: '/blogs' },
    secondaryCta: trial,
    sections: [
      {
        type: 'cards',
        eyebrow: 'Topics we cover',
        title: 'What we track',
        items: [
          { icon: Search, title: 'Google algorithm updates', text: 'Core updates, spam updates and local ranking shifts, and how to check if you were affected.', tag: 'Algorithm' },
          { icon: Building2, title: 'Google Business Profile changes', text: 'New features, removed features, policy changes and suspensions.', tag: 'GBP' },
          { icon: Bot, title: 'AI search', text: 'AI Overviews, AI Mode, ChatGPT search, Gemini and Perplexity, and their effect on local discovery.', tag: 'AI Search' },
          { icon: Star, title: 'Reviews & reputation', text: 'Review policy enforcement, fake review crackdowns and best practice.', tag: 'Reviews' },
          { icon: MapPin, title: 'Maps & local pack', text: 'Changes to how the local pack, local finder and Maps display businesses.', tag: 'Maps' },
          { icon: Code2, title: 'Structured data', text: 'Schema changes and rich result updates that affect local businesses.', tag: 'Technical' }
        ]
      },
      {
        type: 'article',
        eyebrow: 'Big picture',
        title: 'The trends shaping local search in 2026',
        blocks: [
          { h: 'AI answers sit above the results', p: ['For many queries, Google now shows an AI-generated overview before traditional results, and more people ask assistants like ChatGPT and Gemini directly. Local businesses need to be both rankable and quotable: clear facts, consistent citations, strong reviews and well-structured content.'] },
          { h: 'Proximity remains king for maps', p: ['Despite all the change, distance is still the biggest factor in local pack rankings. That makes measuring visibility across a service area, rather than from one point, more important than ever.'] },
          { h: 'Review quality and authenticity', p: ['Platforms keep tightening enforcement against fake and incentivised reviews. A steady flow of genuine reviews, and thoughtful replies, remains one of the safest long-term investments.'] },
          { h: 'Profiles as storefronts', p: ['Google Business Profile continues to absorb more of the customer journey: calls, messages, bookings and direction requests often happen without a website visit. An active, complete profile is non-negotiable.'] },
          { h: 'What to do about it', list: ['Track rankings with geo-grid scans, not single points', 'Keep your profile complete and active weekly', 'Publish question-and-answer content with schema', 'Clean up citations for consistency', 'Monitor how AI assistants describe you'] }
        ]
      },
      {
        type: 'cards',
        eyebrow: 'Keep learning',
        title: 'Resources',
        items: [
          { title: 'Ringscale Blog', text: 'In-depth local SEO articles and tutorials.', href: '/blogs', linkLabel: 'Read articles' },
          { title: 'Local SEO Checklist 2026', text: 'The full checklist for ranking in Google Maps this year.', href: '/local-seo-checklist-2026', linkLabel: 'Get the checklist' },
          { title: 'ChatGPT Visibility Guide', text: 'How to get recommended by AI assistants.', href: '/chatgpt-visibility-guide', linkLabel: 'Read the guide' }
        ]
      }
    ]
  },

  'local-seo-checklist-2026': {
    eyebrow: 'Free Local SEO Checklist 2026',
    title: 'The complete local SEO checklist',
    highlight: 'for 2026.',
    metaTitle: 'Free Local SEO Checklist 2026 | Ringscale AI',
    metaDescription: 'A complete, free local SEO checklist for 2026: Google Business Profile, website, citations, reviews, AI search and tracking. 60+ actionable items.',
    intro: 'More than 60 actionable items to help your business rank in Google Maps, the local pack and AI answers this year. Work through it top to bottom, or jump to the section you need.',
    illustration: 'checklist',
    primaryCta: { label: 'Check My Rankings Free', href: '/register' },
    secondaryCta: { label: 'Jump to Checklist', href: '#checklist' },
    sections: [
      {
        type: 'checklist',
        id: 'checklist',
        eyebrow: 'Part 1',
        title: 'Google Business Profile',
        text: 'Your profile is the single biggest local ranking lever.',
        groups: [
          { title: 'Setup & accuracy', items: ['Claim and verify your profile', 'Use your real business name, no keyword stuffing', 'Choose the most specific primary category', 'Add all relevant secondary categories', 'Set accurate address or service areas', 'Use a local phone number', 'Add regular and holiday hours'] },
          { title: 'Content & completeness', items: ['Write a natural 750-character description', 'List every service with a description', 'Add products with photos where relevant', 'Select all applicable attributes', 'Upload logo, cover and 10+ quality photos', 'Add your booking or appointment link'] },
          { title: 'Activity', items: ['Publish a post every week', 'Add new photos every month', 'Seed and answer common questions', 'Enable messaging and reply fast', 'Keep offers and events current'] },
          { title: 'Reviews', items: ['Ask every happy customer for a review', 'Use a short review link or QR code', 'Reply to every review within 48 hours', 'Respond to negatives calmly and helpfully', 'Never buy or incentivise reviews'] }
        ]
      },
      {
        type: 'checklist',
        eyebrow: 'Part 2',
        title: 'Website & on-page',
        groups: [
          { title: 'Technical', items: ['Mobile-friendly, fast-loading site', 'HTTPS everywhere', 'Submit XML sitemap to Search Console', 'Fix crawl errors and broken links', 'Core Web Vitals in the green'] },
          { title: 'Local content', items: ['Dedicated page for each core service', 'Location pages for each area served (unique content)', 'Name, address, phone in the footer', 'Embedded Google Map on contact page', 'Title tags with service + location'] },
          { title: 'Structured data', items: ['LocalBusiness (or specific subtype) schema', 'FAQPage schema on FAQ sections', 'Service schema on service pages', 'Review/AggregateRating where allowed', 'Validate with Rich Results Test'] },
          { title: 'Trust', items: ['Real team photos and bios', 'Testimonials and case studies', 'Clear pricing or pricing factors', 'Licences, certifications and awards'] }
        ]
      },
      {
        type: 'checklist',
        eyebrow: 'Part 3',
        title: 'Citations, links & AI search',
        groups: [
          { title: 'Citations', items: ['Create a master NAP record', 'Claim Bing Places and Apple Business Connect', 'List on Facebook, Yelp and key directories', 'Add industry-specific directories', 'Fix inconsistent and duplicate listings'] },
          { title: 'Local links', items: ['Local chamber of commerce or business associations', 'Sponsor local events or teams', 'Partner with complementary businesses', 'Get featured in local news and blogs'] },
          { title: 'AI search (AEO)', items: ['Answer real customer questions on your site', 'Lead each answer with a direct sentence', 'Keep facts consistent everywhere', 'Check how ChatGPT and Gemini describe you', 'Fix any wrong facts at the source'] },
          { title: 'Tracking', items: ['Run a geo-grid heatmap baseline', 'Track 5–15 priority keywords', 'Re-scan at least every 2–4 weeks', 'Compare scans after each major change', 'Report calls and direction requests monthly'] }
        ]
      },
      {
        type: 'article',
        eyebrow: 'How to use it',
        title: 'Where to start if you only have an hour',
        blocks: [
          { p: ['If time is short, focus on the items with the biggest impact first:'] },
          { list: ['Check your primary category is the most accurate option', 'Fill every empty field in your Business Profile', 'Reply to every unanswered review', 'Make sure your name, address and phone match on your website and top 5 directories', 'Run a free geo-grid scan to see where you stand'] },
          { p: ['Then come back to the full checklist each week. Local SEO rewards consistency more than one-off bursts of effort.'] }
        ]
      }
    ],
    faqs: [
      { q: 'Is this checklist free?', a: 'Yes, completely free. No sign-up needed to read it.' },
      { q: 'What has changed in local SEO for 2026?', a: 'AI-generated answers now play a bigger role in discovery, so consistent facts, question-led content and structured data matter more. The fundamentals (an accurate profile, reviews, citations and proximity) remain essential.' },
      { q: 'How long does local SEO take to work?', a: 'Quick fixes like categories and profile completeness can show results within weeks. Reviews, citations and content build over months.' }
    ]
  },

  'chatgpt-visibility-guide': {
    eyebrow: 'ChatGPT Visibility Guide',
    title: 'How to get your business recommended',
    highlight: 'by ChatGPT.',
    metaTitle: 'ChatGPT Visibility Guide for Local Businesses (2026) | Ringscale AI',
    metaDescription: 'A practical guide to getting your local business mentioned and recommended by ChatGPT, Gemini, Perplexity and Google AI Overviews.',
    intro: 'More customers now ask AI assistants for recommendations: “best dentist near me”, “who should I call for a leaking roof”. This guide explains how those assistants decide what to say, and what you can do to be the business they name.',
    illustration: 'ai',
    primaryCta: { label: 'Track Your AI Visibility', href: '/features/ai-tracker' },
    secondaryCta: { label: 'AEO Services', href: '/services/aeo' },
    sections: [
      {
        type: 'article',
        eyebrow: 'Chapter 1',
        title: 'How AI assistants choose local businesses',
        blocks: [
          { p: ['AI assistants like ChatGPT combine what they learned during training with live web results when they search. For local questions, they lean heavily on sources that describe businesses: maps listings, review platforms, directories, news, and business websites.', 'They tend to recommend businesses where many sources agree: consistent names and details, strong ratings, clear descriptions of what the business does, and content that directly answers the question asked.'] },
          { h: 'What this means for you', list: ['You can’t pay to be recommended. You earn it with evidence', 'Consistency across the web matters a lot', 'Clear, factual content is easier for AI to quote', 'Reviews influence both rankings and recommendations'] }
        ]
      },
      {
        type: 'article',
        eyebrow: 'Chapter 2',
        title: 'Seven steps to improve your ChatGPT visibility',
        blocks: [
          { h: '1. Make your facts consistent', p: ['Your business name, address, phone, hours, services and service areas should be identical on your website, Google Business Profile, Bing Places, Apple Maps, Facebook, Yelp and industry directories. Inconsistencies reduce confidence.'] },
          { h: '2. Strengthen your review profile', p: ['Ask for reviews continuously, on Google and the platforms relevant to your industry. Encourage customers to mention the specific service they used. Reply to every review.'] },
          { h: '3. Write answer-first content', p: ['Create pages and FAQ sections that answer real questions directly. Start each answer with a clear one- or two-sentence response, then add detail. AI systems extract short, self-contained answers.'] },
          { h: '4. Add structured data', p: ['Use LocalBusiness, Service and FAQPage schema so machines can read your facts without guessing. Our free Schema Generator can help.'], illustration: 'code' },
          { h: '5. Be specific about what you do', p: ['“We are a family dental clinic in Janakpuri offering same-day emergency appointments, Invisalign and paediatric dentistry” is far more useful to an AI than “we provide quality dental services”.'] },
          { h: '6. Earn mentions beyond your own site', p: ['Local news coverage, community sponsorships, industry associations and “best of” lists all add independent evidence about your business.'] },
          { h: '7. Monitor and correct', p: ['Ask AI assistants about your business and category regularly. If they repeat wrong information, find and fix the source. Ringscale’s AI Tracker does this monitoring for you.'] }
        ]
      },
      {
        type: 'table',
        eyebrow: 'Quick reference',
        title: 'Traditional local SEO vs AI visibility',
        columns: ['Signal', 'Why AI cares', 'Action'],
        rows: [
          ['Business Profile', 'Primary source of local facts', 'Complete every field, keep it active'],
          ['Reviews', 'Social proof and descriptive detail', 'Steady flow of genuine reviews'],
          ['Citations', 'Corroboration across sources', 'Fix inconsistencies'],
          ['Website content', 'Quotable answers', 'Question-led pages and FAQs'],
          ['Schema', 'Machine-readable facts', 'LocalBusiness, Service, FAQPage'],
          ['Mentions', 'Independent authority', 'Local PR and partnerships']
        ]
      }
    ],
    faqs: [
      { q: 'Can I pay to be recommended by ChatGPT?', a: 'No. There is no paid placement in ChatGPT’s organic recommendations. Visibility comes from the evidence available about your business online.' },
      { q: 'Does ranking on Google help with ChatGPT?', a: 'Often, yes. Many of the same signals, such as reviews, consistent listings and helpful content, influence both, and AI assistants frequently draw on web search results.' },
      { q: 'How do I check what ChatGPT says about my business?', a: 'Ask it directly, and ask category questions like “best [service] in [area]”. Because answers vary, check several times. Ringscale’s AI Tracker monitors this systematically.' }
    ]
  },

  'rank-convert-summit': {
    eyebrow: 'Rank & Convert Summit · On-demand',
    title: 'Rank higher. Convert more.',
    highlight: 'Watch anytime.',
    metaTitle: 'Rank & Convert Summit On-Demand | Ringscale AI',
    metaDescription: 'On-demand sessions on winning the Google local pack, turning rankings into calls, and preparing local businesses for AI search.',
    intro: 'The Rank & Convert Summit brings together practical sessions on local search, from winning the map pack to turning visibility into phone calls and bookings. Every session is available on demand.',
    illustration: 'video',
    primaryCta: { label: 'Get On-Demand Access', href: '/contact-us' },
    secondaryCta: trial,
    sections: [
      {
        type: 'cards',
        eyebrow: 'Sessions',
        title: 'What you’ll learn',
        items: [
          { icon: MapPin, tag: 'Session 1', title: 'Winning the map pack in 90 days', text: 'A practical, week-by-week plan to move from page two to the local 3-pack.' },
          { icon: Grid3x3, tag: 'Session 2', title: 'Reading heatmaps like a pro', text: 'How to diagnose ranking problems from geo-grid patterns.' },
          { icon: Star, tag: 'Session 3', title: 'Reviews that rank and convert', text: 'Building a review engine that lifts both rankings and conversion rates.' },
          { icon: Bot, tag: 'Session 4', title: 'Local SEO in the age of AI', text: 'Getting recommended by ChatGPT, Gemini and AI Overviews.' },
          { icon: Gauge, tag: 'Session 5', title: 'From rankings to phone calls', text: 'Optimising your profile and website for conversions, not just clicks.' },
          { icon: Briefcase, tag: 'Session 6', title: 'Scaling a local SEO agency', text: 'Productising services, reporting that retains clients, and white-label tools.' }
        ]
      },
      {
        type: 'features',
        eyebrow: 'Why watch',
        title: 'Built for practitioners',
        items: [
          { icon: ListChecks, title: 'Actionable', text: 'Every session ends with a checklist you can apply the same day.' },
          { icon: Video, title: 'On demand', text: 'Watch at your own pace, whenever suits you.' },
          { icon: GraduationCap, title: 'For all levels', text: 'From business owners to experienced agency teams.' }
        ]
      }
    ],
    faqs: [
      { q: 'Is the summit free?', a: 'Contact us for on-demand access. Ringscale customers can request access directly from our team.' },
      { q: 'Who is the summit for?', a: 'Local business owners, in-house marketers and agencies who want to improve local search results.' }
    ]
  },

  'api-documentation': {
    eyebrow: 'API Documentation',
    title: 'Build on',
    highlight: 'Ringscale data.',
    metaTitle: 'API Access | Ringscale AI',
    metaDescription: 'Integrate Ringscale geo-grid rankings, scans and reports into your own dashboards and workflows. API access is available for partners and custom packages.',
    intro: 'Bring Ringscale’s geo-grid rankings, scan results and reports into your own dashboards, CRMs and client portals. API access is available to agency partners and custom-package customers.',
    illustration: 'docs',
    primaryCta: { label: 'Request API Access', href: '/contact-us' },
    secondaryCta: { label: 'Custom Packages', href: '/custom-package' },
    sections: [
      {
        type: 'features',
        eyebrow: 'Capabilities',
        title: 'What you can integrate',
        items: [
          { icon: Layers, title: 'Projects & keywords', text: 'Access the businesses and keywords you track.' },
          { icon: Grid3x3, title: 'Scan results', text: 'Retrieve geo-grid results: position at every pin and summary metrics.' },
          { icon: BarChart3, title: 'Ranking history', text: 'Pull historical scans to chart trends in your own tools.' },
          { icon: FileText, title: 'Reports', text: 'Fetch report data to embed in client portals.' },
          { icon: Users, title: 'Client management', text: 'For partners: work with client accounts and credits.' },
          { icon: Webhook, title: 'Workflow automation', text: 'Connect results to your CRM, Slack or reporting stack.' }
        ]
      },
      {
        type: 'features',
        eyebrow: 'Principles',
        title: 'Built to be safe and predictable',
        items: [
          { icon: KeyRound, title: 'Key-based access', text: 'Access is scoped to your account and can be revoked at any time.' },
          { icon: Lock, title: 'HTTPS only', text: 'All requests are encrypted in transit.' },
          { icon: Database, title: 'JSON responses', text: 'Consistent, documented JSON for easy integration.' }
        ]
      },
      {
        type: 'steps',
        eyebrow: 'Get started',
        title: 'How to get access',
        items: [
          { title: 'Request access', text: 'Tell us what you want to build and roughly how many locations and keywords are involved.' },
          { title: 'Receive credentials & docs', text: 'Approved accounts receive credentials and the full reference documentation.' },
          { title: 'Build & launch', text: 'Integrate with your stack, with our team available to help.' }
        ]
      }
    ],
    faqs: [
      { q: 'Who can use the API?', a: 'API access is available to agency partners and custom-package customers. Contact us to discuss your use case.' },
      { q: 'Does API usage consume credits?', a: 'Running scans consumes credits in the same way as in the dashboard. Details are included with your access documentation.' }
    ]
  }
}
