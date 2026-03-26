import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { headers } from 'next/headers'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const headersList = headers()
    const country = (headersList.get('cf-ipcountry') || headersList.get('x-vercel-ip-country') || 'US').toUpperCase()
    
    // Check referer for locale prefix as a secondary check
    const referer = headersList.get('referer') || ''
    const isIndiaReferer = referer.includes('/in/') || referer.includes('/in?') || referer.endsWith('/in')
    
    const isIndia = country === 'IN' || isIndiaReferer
    const companyAddress = isIndia 
      ? "P-10 Patel Nagar, New Delhi, 110008" 
      : "1470 HurOntario St Mississauga Ontario L5G 3H4"

    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('id')

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID required' }, { status: 400 })
    }

    // paymentId is the Prisma ObjectId (oid field)
    const payment = await prisma.payment.findFirst({
      where: { oid: paymentId, userId: session.user.id }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })

    // Generate HTML invoice as downloadable PDF
    const amount = (payment.amountTotal || 0) / 100
    const currency = payment.currency?.toUpperCase() === 'INR' ? '₹' : '$'
    const currencyCode = payment.currency?.toUpperCase() || 'USD'
    const date = new Date(payment.createdAt).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
    const planName = payment.planId === 'plan_lite' ? 'Lite Plan'
      : payment.planId === 'plan_pro' ? 'Pro Plan'
      : payment.planId || 'Credit Purchase'

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice - ${paymentId}</title>
  <style>
    :root { --primary: #2563eb; --primary-dark: #1d4ed8; --secondary: #64748b; --slate-900: #0f172a; --slate-700: #334155; --slate-100: #f1f5f9; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: var(--slate-700); background: #f8fafc; padding: 40px; line-height: 1.5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .invoice-card { max-width: 800px; margin: 0 auto; background: #fff; padding: 60px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; position: relative; overflow: hidden; }
    .invoice-card::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 6px; background: var(--primary); }
    
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 60px; }
    .logo-container { display: flex; flex-direction: column; }
    .logo-img { height: 60px; width: auto; margin-bottom: 12px; }
    .company-name { font-size: 20px; font-weight: 800; color: var(--slate-900); letter-spacing: -0.5px; }
    
    .invoice-info { text-align: right; }
    .invoice-info h1 { font-size: 42px; font-weight: 900; color: var(--slate-900); letter-spacing: -2px; margin-bottom: 8px; }
    .info-grid { display: grid; grid-template-columns: auto auto; gap: 8px 16px; justify-content: end; font-size: 13px; }
    .info-label { color: var(--secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { color: var(--slate-900); font-weight: 700; }
    
    .billing-section { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 48px; }
    .section-title { font-size: 12px; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 16px; border-bottom: 1px solid var(--slate-100); padding-bottom: 8px; }
    .address-box p { font-size: 14px; color: var(--slate-700); margin-bottom: 4px; }
    .address-box strong { color: var(--slate-900); font-size: 16px; }
    
    table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 40px; }
    th { background: var(--slate-100); color: var(--slate-900); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 16px; text-align: left; }
    th:last-child { text-align: right; border-top-right-radius: 8px; border-bottom-right-radius: 8px; }
    th:first-child { border-top-left-radius: 8px; border-bottom-left-radius: 8px; }
    
    td { padding: 20px 16px; font-size: 14px; border-bottom: 1px solid var(--slate-100); vertical-align: middle; }
    .item-desc { font-weight: 700; color: var(--slate-900); font-size: 15px; }
    .item-subtext { font-size: 12px; color: var(--secondary); margin-top: 4px; display: block; font-weight: 400; }
    .amount-col { text-align: right; font-weight: 800; color: var(--slate-900); font-size: 15px; }
    
    .totals-container { display: flex; justify-content: flex-end; }
    .totals-table { width: 250px; }
    .total-row td { border-bottom: none; padding: 8px 16px; }
    .total-row.grand-total td { padding-top: 16px; margin-top: 8px; border-top: 2px solid var(--primary); }
    .total-label { font-size: 13px; color: var(--secondary); font-weight: 600; text-align: left; }
    .total-value { font-size: 15px; color: var(--slate-900); font-weight: 800; text-align: right; }
    .grand-total .total-label { color: var(--primary); font-size: 14px; font-weight: 800; }
    .grand-total .total-value { color: var(--primary); font-size: 20px; font-weight: 900; }
    
    .badge-paid { display: inline-block; background: #dcfce7; color: #15803d; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 1px; margin-top: 8px; }
    
    .footer { margin-top: 80px; padding-top: 40px; border-top: 1px solid var(--slate-100); }
    .footer-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; text-align: center; }
    .footer-item { font-size: 12px; color: var(--secondary); }
    .footer-item strong { display: block; color: var(--slate-900); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .thanks { margin-top: 40px; text-align: center; font-size: 14px; font-weight: 600; color: var(--primary); }

    @media print { 
      body { background: #fff; padding: 0; } 
      .invoice-card { border: none; shadow: none; padding: 20px; width: 100%; max-width: 100%; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div class="logo-container">
        <img src="/logo.png" alt="Ringscale AI" class="logo-img">
        <div class="company-name">Ringscale AI</div>
      </div>
      <div class="invoice-info">
        <h1>INVOICE</h1>
        <div class="info-grid">
          <span class="info-label">Invoice No:</span>
          <span class="info-value">INV-${paymentId.slice(-8).toUpperCase()}</span>
          <span class="info-label">Date:</span>
          <span class="info-value">${date}</span>
          <span class="info-label">Status:</span>
          <span class="info-value"><span class="badge-paid">PAID</span></span>
        </div>
      </div>
    </div>

    <div class="billing-section">
      <div class="address-box">
        <div class="section-title">Bill To</div>
        <p><strong>${user?.name || 'Customer'}</strong></p>
        <p>${payment.customerEmail || user?.email || ''}</p>
      </div>
      <div class="address-box" style="text-align: right;">
        <div class="section-title">Payment Method</div>
        <p><strong>${payment.cardBrand || 'Card'} •••• ${payment.cardLast4 || '****'}</strong></p>
        <p>Processed via ${payment.provider || 'Stripe'}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 60%">Description</th>
          <th style="text-align: center;">Credits</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <span class="item-desc">${planName}</span>
            <span class="item-subtext">Access to high-fidelity SEO heatmap analytics and rank tracking.</span>
          </td>
          <td style="text-align: center; font-weight: 600;">${(payment.credits || 0).toLocaleString()}</td>
          <td class="amount-col">${currency}${amount.toFixed(2)} ${currencyCode}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals-container">
      <table class="totals-table">
        <tr class="total-row">
          <td class="total-label">Subtotal</td>
          <td class="total-value">${currency}${amount.toFixed(2)}</td>
        </tr>
        <tr class="total-row">
          <td class="total-label">Tax (0%)</td>
          <td class="total-value">${currency}0.00</td>
        </tr>
        <tr class="total-row grand-total">
          <td class="total-label">Total Amount</td>
          <td class="total-value">${currency}${amount.toFixed(2)} ${currencyCode}</td>
        </tr>
      </table>
    </div>

    <div class="footer">
      <div class="footer-grid">
        <div class="footer-item">
          <strong>Email</strong>
          info@ringscale.ai
        </div>
        <div class="footer-item">
          <strong>Phone</strong>
          +1 (437) 291-3099
        </div>
        <div class="footer-item">
          <strong>Address</strong>
          ${companyAddress.replace(', ', '<br>')}
        </div>
      </div>
      <div class="thanks">Thank you for choosing Ringscale AI!</div>
    </div>

    <div class="no-print" style="text-align:center; margin-top:60px; padding: 20px; background: #f1f5f9; border-radius: 12px;">
      <p style="font-size: 13px; color: var(--secondary); margin-bottom: 16px;">This invoice is paid in full. Your credits have been added to your account.</p>
      <button onclick="window.print()" style="background:var(--primary); color:white; border:none; padding:16px 40px; border-radius:12px; font-weight:800; font-size:15px; cursor:pointer; box-shadow: 0 4px 12px rgba(37,99,235,0.3); transition: all 0.2s;">Download Invoice PDF</button>
    </div>
  </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' }
    })
  } catch (error) {
    console.error('Invoice error:', error)
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 })
  }
}
