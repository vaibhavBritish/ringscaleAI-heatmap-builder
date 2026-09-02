import re

with open('lib/mail.js', 'r') as f:
    content = f.read()

# Add generateEmailLayout at the top
layout_func = """
/**
 * Generates a professional email layout with Ringscale branding.
 */
function generateEmailLayout({ content, appName, logoUrl, supportPhone, preheader = '' }) {
  const logo = logoUrl.startsWith('/') ? `https://ringscale.ai${logoUrl}` : logoUrl;
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${appName}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      ${preheader ? `<div style="display: none; max-height: 0px; overflow: hidden;">${preheader}</div>` : ''}
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff; border-radius: 12px; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 32px; border-bottom: 1px solid #f1f5f9; padding-bottom: 24px;">
          <a href="https://ringscale.ai" target="_blank" style="text-decoration: none;">
            <img src="${logo}" alt="${appName}" style="height: 48px; max-width: 100%;" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='block';" />
            <h1 style="display: none; color: #2563eb; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">${appName.toUpperCase()}</h1>
          </a>
        </div>

        <!-- Content -->
        <div style="color: #334155; line-height: 1.6; font-size: 16px;">
          ${content}
        </div>

        <!-- Footer -->
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center;">
          <div style="margin-bottom: 16px;">
            <a href="https://ringscale.ai" style="color: #2563eb; text-decoration: none; font-weight: 500; font-size: 14px; margin: 0 12px;">Visit Website</a>
            <span style="color: #cbd5e1;">|</span>
            <a href="https://calendly.com/ringscalemedia-info/ringscale-strategy-call" style="color: #2563eb; text-decoration: none; font-weight: 500; font-size: 14px; margin: 0 12px;">Book a Call</a>
          </div>
          <p style="color: #64748b; font-size: 13px; margin-bottom: 12px;">
            Need assistance? Give us a call at <a href="tel:${supportPhone}" style="color: #2563eb; text-decoration: none; font-weight: 600;">${supportPhone}</a>
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">
            &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.<br/>
            This is an automated email, please do not reply.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
"""

content = content.replace("import { getSecret } from './secrets'\n", "import { getSecret } from './secrets'\n" + layout_func)

# Replace getEmailSettings to ensure logoUrl is set properly if it was missing (already has it though, let's keep it)

# We need to rewrite each function manually to ensure they use generateEmailLayout and pass appName, logoUrl, supportPhone.
# Since it's complex to regex this correctly for all cases, I'll write out the replaced functions completely.

import os
with open('update_mail_script.py', 'w') as f:
    pass # Wait, let's just use Python to rewrite the file completely.
