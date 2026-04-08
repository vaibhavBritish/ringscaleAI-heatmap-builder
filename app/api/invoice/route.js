import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { headers } from 'next/headers'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const headersList = await headers()
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
    
    // If we already have a direct PDF or receipt from the provider, we can offer it
    if (payment.invoicePdf) {
      return NextResponse.redirect(payment.invoicePdf)
    }

    // Prepare logo base64
    let logoBase64 = ''
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.png')
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath)
        logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`
      }
    } catch (e) {
      console.warn('Failed to load logo for invoice:', e)
    }

    // Generate HTML invoice as downloadable PDF
    const amount = (payment.amountTotal || 0) / 100
    const currency = payment.currency?.toUpperCase() === 'INR' ? '₹' : '$'
    const currencyCode = payment.currency?.toUpperCase() || 'USD'
    const date = new Date(payment.createdAt).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
    const planName = 
        payment.planId === 'plan_lite' ? 'Advance Plan'
      : payment.planId === 'plan_pro' ? 'Pro Plan'
      : payment.planId === 'plan_pro_plus' ? 'Pro Plus Plan'
      : payment.planId || 'Credit Purchase'

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - ${paymentId.slice(-8).toUpperCase()}</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #2563eb;
            --primary-light: #eff6ff;
            --slate-50: #f8fafc;
            --slate-100: #f1f5f9;
            --slate-200: #e2e8f0;
            --slate-600: #475569;
            --slate-700: #334155;
            --slate-900: #0f172a;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Outfit', sans-serif;
            background-color: var(--slate-50);
            color: var(--slate-700);
            line-height: 1.6;
            padding: 40px 20px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        .invoice-container {
            max-width: 850px;
            margin: 0 auto;
            background: white;
            padding: 60px;
            border-radius: 24px;
            box-shadow: 0 20px 50px rgba(15, 23, 42, 0.05);
            border: 1px solid var(--slate-100);
            position: relative;
            overflow: hidden;
        }

        .top-acc-bar {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 8px;
            background: linear-gradient(90deg, #3b82f6, #2563eb, #1d4ed8);
        }

        /* --- HEADER --- */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 60px;
        }

        .brand {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .logo-box {
            height: 50px;
            margin-bottom: 8px;
        }
        
        .logo-box img {
            height: 100%;
            object-fit: contain;
        }

        .brand-name {
            font-size: 22px;
            font-weight: 900;
            color: var(--slate-900);
            letter-spacing: -0.5px;
        }

        .invoice-type {
            text-align: right;
        }

        .invoice-type h1 {
            font-size: 48px;
            font-weight: 900;
            color: var(--slate-900);
            letter-spacing: -2px;
            line-height: 1;
            margin-bottom: 12px;
        }

        .status-badge {
            display: inline-block;
            background: #dcfce7;
            color: #15803d;
            font-size: 11px;
            font-weight: 800;
            padding: 6px 16px;
            border-radius: 100px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
        }

        /* --- INFO GRID --- */
        .info-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 60px;
        }

        .bill-label {
            font-size: 11px;
            font-weight: 800;
            color: var(--primary);
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 12px;
            display: block;
        }

        .bill-value {
            font-size: 16px;
            font-weight: 700;
            color: var(--slate-900);
            margin-bottom: 4px;
        }

        .bill-sub {
            font-size: 14px;
            color: var(--slate-600);
        }

        .meta-box {
            background: var(--slate-50);
            padding: 24px;
            border-radius: 16px;
            border: 1px solid var(--slate-100);
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }

        .meta-item label {
            display: block;
            font-size: 10px;
            font-weight: 700;
            color: var(--slate-600);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 4px;
        }

        .meta-item span {
            font-size: 14px;
            font-weight: 800;
            color: var(--slate-900);
        }

        /* --- TABLE --- */
        table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-bottom: 40px;
        }

        thead th {
            background: var(--slate-900);
            color: white;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            padding: 16px 20px;
            text-align: left;
        }

        thead th:first-child { border-top-left-radius: 12px; border-bottom-left-radius: 12px; }
        thead th:last-child { border-top-right-radius: 12px; border-bottom-right-radius: 12px; text-align: right; }

        tbody td {
            padding: 24px 20px;
            border-bottom: 1px solid var(--slate-100);
        }

        .item-main {
            font-size: 16px;
            font-weight: 800;
            color: var(--slate-900);
            margin-bottom: 4px;
        }

        .item-desc {
            font-size: 13px;
            color: var(--slate-600);
        }

        .item-price {
            text-align: right;
            font-size: 16px;
            font-weight: 800;
            color: var(--slate-900);
        }

        /* --- TOTALS --- */
        .summary-container {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 60px;
        }

        .summary-table {
            width: 280px;
        }

        .sum-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
        }

        .sum-label {
            font-size: 14px;
            font-weight: 500;
            color: var(--slate-600);
        }

        .sum-value {
            font-size: 14px;
            font-weight: 700;
            color: var(--slate-900);
        }

        .grand-total {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 2px solid var(--slate-900);
        }

        .grand-total .sum-label {
            font-size: 16px;
            font-weight: 800;
            color: var(--slate-900);
        }

        .grand-total .sum-value {
            font-size: 24px;
            font-weight: 950;
            color: var(--primary);
        }

        /* --- FOOTER --- */
        .footer {
            border-top: 1px solid var(--slate-100);
            padding-top: 40px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }

        .contact-box {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .contact-item {
            font-size: 12px;
        }

        .contact-item strong {
            display: block;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--slate-600);
            margin-bottom: 2px;
        }

        .thanks-msg {
            text-align: right;
        }

        .thanks-msg p {
            font-size: 18px;
            font-weight: 800;
            color: var(--slate-900);
            letter-spacing: -0.5px;
        }
        
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 150px;
            font-weight: 900;
            color: rgba(37, 99, 235, 0.03);
            pointer-events: none;
            z-index: 0;
            white-space: nowrap;
        }

        @media print {
            body { background: white; padding: 0; }
            .invoice-container { box-shadow: none; border: none; padding: 0; }
            .no-print { display: none !important; }
        }
        
        .no-print-area {
            max-width: 850px;
            margin: 30px auto;
            text-align: center;
        }
        
        .btn-print {
            background: var(--slate-900);
            color: white;
            border: none;
            padding: 16px 40px;
            border-radius: 14px;
            font-weight: 700;
            font-size: 15px;
            cursor: pointer;
            transition: transform 0.2s;
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        
        .btn-print:hover { transform: translateY(-2px); }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="top-acc-bar"></div>
        <div class="watermark">PAID</div>
        
        <header class="header">
            <div class="brand">
                <div class="logo-box">
                    ${logoBase64 ? `<img src="${logoBase64}" alt="Ringscale AI">` : `<div style="font-weight:900; font-size:24px; color:var(--primary)">Ringscale AI</div>`}
                </div>
                <div class="brand-name">Ringscale AI</div>
            </div>
            
            <div class="invoice-type">
                <h1>INVOICE</h1>
                <div class="status-badge">Payment Received</div>
            </div>
        </header>

        <section class="info-section">
            <div>
                <span class="bill-label">Billed To</span>
                <p class="bill-value">${user?.name || 'Valued Customer'}</p>
                <p class="bill-sub">${payment.customerEmail || user?.email || ''}</p>
            </div>
            
            <div class="meta-box">
                <div class="meta-item">
                    <label>Invoice ID</label>
                    <span>INV-${paymentId.slice(-8).toUpperCase()}</span>
                </div>
                <div class="meta-item">
                    <label>Date Issued</label>
                    <span>${date}</span>
                </div>
                <div class="meta-item">
                    <label>Payment Method</label>
                    <span>${payment.cardBrand || 'Card'} •••• ${payment.cardLast4 || '****'}</span>
                </div>
                <div class="meta-item">
                    <label>Payment Processor</label>
                    <span>${payment.provider || 'Stripe'}</span>
                </div>
            </div>
        </section>

        <table>
            <thead>
                <tr>
                    <th style="width: 70%">Product Description</th>
                    <th>Subtotal</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <div class="item-main">${planName}</div>
                        <div class="item-desc">High-fidelity local SEO heatmap scanning and rank tracking services. Includes <strong>${(payment.credits || 0).toLocaleString()} credits</strong>.</div>
                    </td>
                    <td class="item-price">${currency}${amount.toFixed(2)} ${currencyCode}</td>
                </tr>
            </tbody>
        </table>

        <div class="summary-container">
            <div class="summary-table">
                <div class="sum-row">
                    <span class="sum-label">Item Subtotal</span>
                    <span class="sum-value">${currency}${amount.toFixed(2)}</span>
                </div>
                <div class="sum-row">
                    <span class="sum-label">Tax (GST/HST)</span>
                    <span class="sum-value">${currency}0.00</span>
                </div>
                <div class="sum-row grand-total">
                    <span class="sum-label">Grand Total</span>
                    <span class="sum-value">${currency}${amount.toFixed(2)} ${currencyCode}</span>
                </div>
            </div>
        </div>

        <footer class="footer">
            <div class="contact-box">
                <div class="contact-item">
                    <strong>Business Address</strong>
                    ${companyAddress}
                </div>
                <div style="display: flex; gap: 40px;">
                    <div class="contact-item">
                        <strong>Support Email</strong>
                        hello@ringscale.ai
                    </div>
                    <div class="contact-item">
                        <strong>Official Site</strong>
                        www.ringscale.ai
                    </div>
                </div>
            </div>
            
            <div class="thanks-msg">
                <p>Thank you for your business!</p>
            </div>
        </footer>
    </div>
    
    <div class="no-print-area no-print">
        <button class="btn-print" onclick="window.print()">Download as PDF / Print</button>
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
