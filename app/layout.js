import './globals.css'
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

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon_logo.png" />
        <script dangerouslySetInnerHTML={{ __html: 'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);' }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod ?
                n.callMethod.apply(n, arguments) : n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '961228566590591');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=961228566590591&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>

      </head>
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  )
}
