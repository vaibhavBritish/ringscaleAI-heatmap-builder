import './globals.css'
import Script from 'next/script'
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

import { RootScripts } from '@/components/seoos/RootScripts'
import WhatsAppButton from '@/components/WhatsAppButton'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon_logo.png" />
        <Script
          id="prevent-extension-hydration"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                try {
                  var origError = console.error;
                  console.error = function() {
                    for (var i = 0; i < arguments.length; i++) {
                      var arg = arguments[i];
                      if (typeof arg === 'string' && (
                        arg.indexOf('bis_skin_checked') !== -1 ||
                        arg.indexOf('bis_size') !== -1 ||
                        arg.indexOf('bis_status') !== -1 ||
                        arg.indexOf('data-new-gr-c-s-check-loaded') !== -1 ||
                        arg.indexOf('cz-shortcut-listen') !== -1
                      )) {
                        return;
                      }
                    }
                    return origError.apply(console, arguments);
                  };

                  var origSetAttr = Element.prototype.setAttribute;
                  Element.prototype.setAttribute = function(name, value) {
                    if (name && (name.indexOf('bis_') === 0 || name === 'data-new-gr-c-s-check-loaded' || name === 'cz-shortcut-listen')) {
                      return;
                    }
                    return origSetAttr.apply(this, arguments);
                  };

                  if (typeof MutationObserver !== 'undefined') {
                    var observer = new MutationObserver(function(mutations) {
                      for (var i = 0; i < mutations.length; i++) {
                        var m = mutations[i];
                        if (m.type === 'attributes' && m.attributeName) {
                          if (m.attributeName.indexOf('bis_') === 0 || m.attributeName === 'data-new-gr-c-s-check-loaded' || m.attributeName === 'cz-shortcut-listen') {
                            m.target.removeAttribute(m.attributeName);
                          }
                        }
                      }
                    });
                    observer.observe(document.documentElement, {
                      attributes: true,
                      subtree: true,
                      attributeFilter: ['bis_skin_checked', 'bis_size', 'bis_status', 'data-new-gr-c-s-check-loaded', 'cz-shortcut-listen']
                    });
                  }

                  document.addEventListener('DOMContentLoaded', function() {
                    try {
                      var els = document.querySelectorAll('[bis_skin_checked], [bis_size], [bis_status], [data-new-gr-c-s-check-loaded], [cz-shortcut-listen]');
                      for (var j = 0; j < els.length; j++) {
                        els[j].removeAttribute('bis_skin_checked');
                        els[j].removeAttribute('bis_size');
                        els[j].removeAttribute('bis_status');
                        els[j].removeAttribute('data-new-gr-c-s-check-loaded');
                        els[j].removeAttribute('cz-shortcut-listen');
                      }
                    } catch(e) {}
                  });
                } catch(e) {}
              })();
            `
          }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster position="bottom-right" />
          <WhatsAppButton />
          <RootScripts />
        </Providers>
      </body>
    </html>
  )
}
