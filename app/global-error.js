'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log the error to our custom error reporting endpoint
    // This allows the backend to send an email to the admin
    fetch('/api/log-client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        pathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
      })
    }).catch(e => {
      // Ignore fetch errors to prevent loops
      console.error('Failed to report global error', e)
    })
  }, [error])

  return (
    <html>
      <body>
        <div style={{ padding: '50px', fontFamily: 'sans-serif', textAlign: 'center' }}>
          <h2 style={{ color: '#ef4444' }}>Something went wrong!</h2>
          <p style={{ color: '#64748b' }}>A critical error occurred. The development team has been notified automatically.</p>
          <button
            onClick={() => reset()}
            style={{ 
              marginTop: '20px', 
              padding: '10px 20px', 
              background: '#2563eb', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: 'pointer' 
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
