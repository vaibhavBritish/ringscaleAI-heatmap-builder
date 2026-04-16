'use client'

import { useState, useEffect } from 'react'
import Script from 'next/script'

export function RootScripts() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // If not mounted, render nothing on the server
  if (!mounted) return null

  return (
    <>
      {/* Bypass PerformanceServerTiming DataCloneError in some browsers */}
      <Script id="error-bypass-v2" strategy="afterInteractive">
        {`window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);`}
      </Script>

      {/* Facebook Pixel */}
      <Script id="fb-pixel-v2" strategy="afterInteractive">
        {`
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
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src="https://www.facebook.com/tr?id=961228566590591&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>
    </>
  )
}
