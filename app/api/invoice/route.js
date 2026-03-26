import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('id')

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID required' }, { status: 400 })
    }

    const db = await getDB()
    const payment = await db.collection('payments').findOne({
      _id: new ObjectId(paymentId),
      userId: session.user.id
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const user = await db.collection('users').findOne({ id: session.user.id })

    // If Stripe invoice PDF exists, redirect to it
    if (payment.invoicePdf) {
      return NextResponse.redirect(payment.invoicePdf)
    }

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
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; background: #fff; padding: 40px; }
    .invoice { max-width: 700px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; border-bottom: 3px solid #2563eb; padding-bottom: 24px; }
    .logo { font-size: 28px; font-weight: 900; color: #2563eb; }
    .logo-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
    .invoice-title { text-align: right; }
    .invoice-title h1 { font-size: 32px; font-weight: 900; color: #0f172a; letter-spacing: -1px; }
    .invoice-title .date { font-size: 13px; color: #64748b; margin-top: 4px; }
    .invoice-title .id { font-size: 11px; color: #94a3b8; margin-top: 2px; font-family: monospace; }
    .section { margin-bottom: 32px; }
    .section-title { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
    .bill-to p { font-size: 14px; line-height: 1.8; color: #334155; }
    .bill-to strong { color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #f1f5f9; color: #475569; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 12px 16px; text-align: left; border-bottom: 2px solid #e2e8f0; }
    th:last-child { text-align: right; }
    td { padding: 16px; font-size: 14px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    td:last-child { text-align: right; font-weight: 700; color: #0f172a; }
    .total-row { border-top: 2px solid #2563eb; }
    .total-row td { font-size: 18px; font-weight: 900; padding-top: 16px; color: #2563eb; }
    .payment-info { display: flex; gap: 40px; margin-top: 32px; padding: 20px; background: #f8fafc; border-radius: 12px; }
    .payment-info .item { }
    .payment-info .label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
    .payment-info .value { font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 4px; text-transform: capitalize; }
    .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
    .status-badge { display: inline-block; background: #dcfce7; color: #16a34a; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px; }
    @media print { 
      body { padding: 20px; } 
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div>
        <div class="logo">Local Rank Heatmap</div>
        <div class="logo-sub">SEO Heatmap Analytics Platform</div>
      </div>
      <div class="invoice-title">
        <h1>INVOICE</h1>
        <div class="date">${date}</div>
        <div class="id">INV-${paymentId.slice(-8).toUpperCase()}</div>
      </div>
    </div>

    <div class="section bill-to">
      <div class="section-title">Bill To</div>
      <p><strong>${user?.name || 'Customer'}</strong></p>
      <p>${payment.customerEmail || user?.email || ''}</p>
    </div>

    <div class="section">
      <div class="section-title">Invoice Details</div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Credits</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${planName}<br><span style="font-size:12px;color:#64748b">${(payment.credits || 0).toLocaleString()} Local Rank Heatmap Credits</span></td>
            <td>${(payment.credits || 0).toLocaleString()}</td>
            <td>${currency}${amount.toFixed(2)} ${currencyCode}</td>
          </tr>
          <tr class="total-row">
            <td colspan="2">Total</td>
            <td>${currency}${amount.toFixed(2)} ${currencyCode}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="payment-info">
      <div class="item">
        <div class="label">Status</div>
        <div class="value"><span class="status-badge">Paid</span></div>
      </div>
      <div class="item">
        <div class="label">Payment Method</div>
        <div class="value">${payment.cardBrand || 'Card'} •••• ${payment.cardLast4 || '****'}</div>
      </div>
      <div class="item">
        <div class="label">Provider</div>
        <div class="value">${payment.provider || 'Stripe'}</div>
      </div>
      <div class="item">
        <div class="label">Date</div>
        <div class="value">${date}</div>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for your business! · Local Rank Heatmap · ringscale.ai</p>
    </div>

    <div class="no-print" style="text-align:center;margin-top:32px;">
      <button onclick="window.print()" style="background:#2563eb;color:white;border:none;padding:12px 32px;border-radius:8px;font-weight:700;font-size:14px;cursor:pointer;">
        Download as PDF
      </button>
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
