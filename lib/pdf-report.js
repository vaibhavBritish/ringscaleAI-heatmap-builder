/**
 * Ringscale AI — shared PDF report toolkit
 *
 * Everything branded about our client-facing reports lives here: the contact
 * block, the palette, the logo loader and a small set of vector drawing
 * primitives (cover page, running header/footer, stat tiles, donuts, tables,
 * heatmap pins).
 *
 * Reports are drawn as real vector text rather than html2canvas screenshots —
 * output stays crisp at any zoom, files stay small, and we sidestep the
 * oklch/lab colour parsing failures that plagued the screenshot approach.
 */

// ─── Brand ────────────────────────────────────────────────────────────────────

export const BRAND = {
  name: 'Ringscale AI',
  tagline: 'Scale Your Digital Presence',
  email: 'info@ringscale.ai',
  website: 'www.ringscale.ai',
  logoPath: '/logo.png',
  confidential: 'Confidential — Prepared by Ringscale AI',
  phones: [
    { region: 'North America', number: '+1 (437) 291-3099' },
    { region: 'India', number: '+91 91523 03009' },
  ],
  offices: [
    { region: 'North America', address: '1470 Hurontario St, Mississauga,\nOntario L5G 3H4, Canada' },
    { region: 'India', address: 'P-10 Patel Nagar,\nNew Delhi 110008, India' },
  ],
}

/** One-line contact string used in page footers. */
export const CONTACT_LINE = [BRAND.email, ...BRAND.phones.map(p => p.number)].join('   •   ')

/** Generates a professional reference number for reports. */
export function reportRefNumber(prefix = 'RS') {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const seq = String(Math.floor(Math.random() * 9000) + 1000)
  return `${prefix}-${y}${m}${d}-${seq}`
}

// ─── Palette ──────────────────────────────────────────────────────────────────

export const C = {
  navy: [11, 27, 58],
  navyDeep: [7, 18, 40],
  navySoft: [26, 45, 82],
  ink: [15, 23, 42],
  body: [51, 65, 85],
  muted: [100, 116, 139],
  faint: [148, 163, 184],
  border: [226, 232, 240],
  hairline: [241, 245, 249],
  wash: [248, 250, 252],
  white: [255, 255, 255],
  blue: [27, 141, 224],
  blueDeep: [21, 101, 192],
  blueWash: [235, 245, 254],
  red: [238, 49, 36],
  green: [22, 163, 74],
  greenWash: [240, 253, 244],
  amber: [217, 119, 6],
  amberWash: [255, 251, 235],
  orange: [234, 88, 12],
  redWash: [254, 242, 242],
}

const TONES = {
  success: { fg: C.green, bg: C.greenWash },
  warning: { fg: C.amber, bg: C.amberWash },
  danger: { fg: C.red, bg: C.redWash },
  info: { fg: C.blue, bg: C.blueWash },
  neutral: { fg: C.muted, bg: C.hairline },
}

export const tone = (name) => TONES[name] || TONES.neutral

/** Green / blue / amber / red banding for a 0-100 score. */
export function scoreColor(value) {
  const v = Number(value) || 0
  if (v >= 80) return C.green
  if (v >= 60) return C.blue
  if (v >= 40) return C.amber
  return C.red
}

export function scoreVerdict(value) {
  const v = Number(value) || 0
  if (v >= 80) return { label: 'Excellent', tone: 'success' }
  if (v >= 60) return { label: 'Good', tone: 'info' }
  if (v >= 40) return { label: 'Needs Work', tone: 'warning' }
  return { label: 'Critical', tone: 'danger' }
}

/** Colour band for a local-pack rank. */
export function rankColor(rank, found = true) {
  if (!found || !rank || rank > 20) return { fill: C.faint, text: C.white }
  if (rank <= 3) return { fill: C.green, text: C.white }
  if (rank <= 10) return { fill: [234, 179, 8], text: [0, 0, 0] }
  return { fill: C.orange, text: C.white }
}

export const RANK_LEGEND = [
  { color: C.green, label: 'Rank 1–3  (Dominant)' },
  { color: [234, 179, 8], label: 'Rank 4–10  (Visible)' },
  { color: C.orange, label: 'Rank 11–20  (Weak)' },
  { color: C.faint, label: '20+  (Not found)' },
]

// ─── Logo ─────────────────────────────────────────────────────────────────────

let logoCache = null

/**
 * Loads /logo.png and trims the surrounding whitespace so callers can position
 * it by height without guessing how much padding the asset carries.
 * Returns `{ image, aspect }` or `null` if the asset can't be read.
 */
export async function loadLogo(src = BRAND.logoPath) {
  if (logoCache) return logoCache
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image()
      el.crossOrigin = 'anonymous'
      el.onload = () => resolve(el)
      el.onerror = reject
      el.src = src
    })

    let image = img
    let aspect = img.naturalWidth / img.naturalHeight

    try {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
      let minX = canvas.width, minY = canvas.height, maxX = -1, maxY = -1
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4
          if (data[i + 3] < 12) continue
          // Treat near-white as background so the transparent and the flattened
          // variants of the asset both trim identically.
          if (data[i] > 244 && data[i + 1] > 244 && data[i + 2] > 244) continue
          if (x < minX) minX = x
          if (y < minY) minY = y
          if (x > maxX) maxX = x
          if (y > maxY) maxY = y
        }
      }

      if (maxX > minX && maxY > minY) {
        const pad = Math.round(Math.max(canvas.width, canvas.height) * 0.012)
        const sx = Math.max(0, minX - pad)
        const sy = Math.max(0, minY - pad)
        const sw = Math.min(canvas.width - sx, maxX - minX + 1 + pad * 2)
        const sh = Math.min(canvas.height - sy, maxY - minY + 1 + pad * 2)
        const out = document.createElement('canvas')
        out.width = sw
        out.height = sh
        out.getContext('2d').drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh)
        image = out.toDataURL('image/png')
        aspect = sw / sh
      }
    } catch {
      // Canvas tainted or unavailable — fall back to the untrimmed element,
      // which jsPDF accepts directly.
    }

    logoCache = { image, aspect }
    return logoCache
  } catch {
    return null
  }
}

// ─── Static map helpers ───────────────────────────────────────────────────────

const MAP_STYLES = [
  'feature:all|element:labels.text.fill|color:0x0c4bb0',
  'feature:water|element:geometry|color:0xa2daf2',
  'feature:landscape|element:geometry|color:0xe9f1f4',
]

/**
 * Picks a centre + zoom that fits every point inside a `logicalW x logicalH`
 * static-map viewport. The previous reports hard-coded a zoom and centred on an
 * arbitrary grid point, which pushed half the heatmap off the edge.
 */
export function computeMapFit(points, { logicalW = 600, logicalH = 420, padding = 0.82, minZoom = 3, maxZoom = 17 } = {}) {
  const valid = (points || []).filter(p => Number.isFinite(p?.latitude) && Number.isFinite(p?.longitude))
  if (valid.length === 0) return null

  const lats = valid.map(p => p.latitude)
  const lngs = valid.map(p => p.longitude)
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)
  const center = { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 }

  const mercY = (lat) => {
    const rad = (lat * Math.PI) / 180
    return (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2
  }

  const fx = Math.max((maxLng - minLng) / 360, 1e-9)
  const fy = Math.max(Math.abs(mercY(minLat) - mercY(maxLat)), 1e-9)

  const zx = Math.log2((logicalW * padding) / (256 * fx))
  const zy = Math.log2((logicalH * padding) / (256 * fy))
  const zoom = Math.max(minZoom, Math.min(maxZoom, Math.floor(Math.min(zx, zy))))

  return { center, zoom }
}

/**
 * Fetches a styled static map through our server-side proxy (which injects the
 * API key) and returns it as a data URL.
 */
export async function fetchStaticMap({ center, zoom, width = 600, height = 420, scale = 2, maptype = 'roadmap' }) {
  const params = new URLSearchParams({
    center: `${center.lat},${center.lng}`,
    zoom: String(zoom),
    size: `${width}x${height}`,
    scale: String(scale),
    maptype,
    format: 'png8',
  })
  MAP_STYLES.forEach(s => params.append('style', s))

  const res = await fetch(`/api/google/static-map?${params.toString()}`)
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Static map proxy returned ${res.status}${detail ? `: ${detail.slice(0, 120)}` : ''}`)
  }
  const blob = await res.blob()
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// ─── Report builder ───────────────────────────────────────────────────────────

const PT = 0.3528 // 1pt in mm

export class PdfReport {
  /**
   * @param {import('jspdf').jsPDF} doc
   * @param {object} opts
   * @param {{image:any, aspect:number}|null} opts.logo  result of loadLogo()
   * @param {string} opts.subject   shown in the running header (e.g. business name)
   * @param {number} opts.margin
   */
  constructor(doc, { logo = null, subject = '', margin = 14 } = {}) {
    this.doc = doc
    this.logo = logo
    this.subject = subject
    this.margin = margin
    this.W = doc.internal.pageSize.getWidth()
    this.H = doc.internal.pageSize.getHeight()
    this.inner = this.W - margin * 2
    this.headerH = 21
    this.footerH = 17
    this.section = ''
    this.y = margin
    this.coverPageCount = 0
  }

  get bottom() { return this.H - this.footerH }

  // — low level ————————————————————————————————————————————————

  fill(color) { this.doc.setFillColor(color[0], color[1], color[2]); return this }
  stroke(color) { this.doc.setDrawColor(color[0], color[1], color[2]); return this }

  rect(x, y, w, h, color) { this.fill(color); this.doc.rect(x, y, w, h, 'F'); return this }

  roundRect(x, y, w, h, r, { fill, border, lineWidth = 0.3 } = {}) {
    const style = fill && border ? 'FD' : fill ? 'F' : 'D'
    if (fill) this.fill(fill)
    if (border) { this.stroke(border); this.doc.setLineWidth(lineWidth) }
    this.doc.roundedRect(x, y, w, h, r, r, style)
    return this
  }

  /** Draws text; returns the vertical space consumed in mm. */
  text(value, x, y, opts = {}) {
    const {
      size = 9.5, weight = 'normal', color = C.body, align = 'left',
      maxWidth, lineHeight, spacing = 0, maxLines,
    } = opts
    const doc = this.doc
    doc.setFont('helvetica', weight)
    doc.setFontSize(size)
    doc.setTextColor(color[0], color[1], color[2])
    if (spacing) doc.setCharSpace(spacing)

    const lh = lineHeight ?? size * PT * 1.32
    const str = value === null || value === undefined ? '' : String(value)

    let consumed
    if (maxWidth) {
      let lines = doc.splitTextToSize(str, maxWidth)
      if (maxLines && lines.length > maxLines) {
        lines = lines.slice(0, maxLines)
        lines[maxLines - 1] = `${String(lines[maxLines - 1]).replace(/[\s.,;:]+$/, '')}…`
      }
      lines.forEach((line, i) => doc.text(line, x, y + i * lh, { align }))
      consumed = lines.length * lh
    } else {
      doc.text(str, x, y, { align })
      consumed = lh
    }

    if (spacing) doc.setCharSpace(0)
    return consumed
  }

  /** Small uppercase label used above values and section bodies. */
  eyebrow(value, x, y, { color = C.faint, size = 6.6, align = 'left' } = {}) {
    return this.text(String(value).toUpperCase(), x, y, { size, weight: 'bold', color, spacing: 0.55, align })
  }

  divider(y, { x = this.margin, w = this.inner, color = C.border, lineWidth = 0.25 } = {}) {
    this.stroke(color)
    this.doc.setLineWidth(lineWidth)
    this.doc.line(x, y, x + w, y)
    return this
  }

  /** Rounded status chip. Returns its width so callers can lay out inline. */
  pill(label, x, y, { toneName = 'neutral', size = 6.8, height = 5.2, fg, bg } = {}) {
    const t = tone(toneName)
    const doc = this.doc
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(size)
    const w = doc.getTextWidth(String(label).toUpperCase()) + 6
    this.roundRect(x, y, w, height, height / 2, { fill: bg || t.bg })
    this.text(String(label).toUpperCase(), x + w / 2, y + height / 2 + size * PT * 0.38, {
      size, weight: 'bold', color: fg || t.fg, align: 'center', spacing: 0.3,
    })
    return w
  }

  // — logo ————————————————————————————————————————————————————

  /**
   * Places the logo. On dark backgrounds it sits on a white chip, because the
   * asset's tagline is dark grey and would otherwise disappear.
   */
  logoMark(x, y, height, { onDark = false, chipPad = 2.6, chipRadius = 2 } = {}) {
    const aspect = this.logo?.aspect || 2.6
    const width = height * aspect

    if (onDark) {
      this.roundRect(x, y, width + chipPad * 2, height + chipPad * 2, chipRadius, { fill: C.white })
    }
    const ix = onDark ? x + chipPad : x
    const iy = onDark ? y + chipPad : y

    if (this.logo?.image) {
      try {
        this.doc.addImage(this.logo.image, 'PNG', ix, iy, width, height)
      } catch {
        this.wordmark(ix, iy + height * 0.72, height * 2.1)
      }
    } else {
      this.wordmark(ix, iy + height * 0.72, height * 2.1)
    }

    return {
      width: onDark ? width + chipPad * 2 : width,
      height: onDark ? height + chipPad * 2 : height,
    }
  }

  /** Text fallback in brand colours when the logo asset can't be loaded. */
  wordmark(x, y, size = 16) {
    const doc = this.doc
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(size)
    doc.setTextColor(C.red[0], C.red[1], C.red[2])
    doc.text('RING', x, y)
    const w = doc.getTextWidth('RING')
    doc.setTextColor(C.blue[0], C.blue[1], C.blue[2])
    doc.text('SCALE', x + w, y)
    return this
  }

  // — charts ——————————————————————————————————————————————————

  /** Arc-based donut gauge. */
  donut(cx, cy, radius, percent, {
    color, track = C.hairline, thickness = 4.6,
    value, valueSize = 20, caption, captionSize = 6.6, sub, subSize = 7.4,
  } = {}) {
    const doc = this.doc
    const pct = Math.max(0, Math.min(100, Number(percent) || 0))
    const arcColor = color || scoreColor(pct)

    doc.setLineWidth(thickness)
    doc.setLineCap('round')
    this.stroke(track)
    doc.circle(cx, cy, radius, 'S')

    if (pct > 0) {
      const segments = Math.max(8, Math.round((pct / 100) * 72))
      const sweep = (pct / 100) * 360
      const pts = []
      for (let i = 0; i <= segments; i++) {
        const a = ((-90 + (sweep * i) / segments) * Math.PI) / 180
        pts.push([cx + radius * Math.cos(a), cy + radius * Math.sin(a)])
      }
      const deltas = []
      for (let i = 1; i < pts.length; i++) {
        deltas.push([pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]])
      }
      this.stroke(arcColor)
      doc.lines(deltas, pts[0][0], pts[0][1], [1, 1], 'S')
    }
    doc.setLineCap('butt')
    doc.setLineWidth(0.2)

    const shownValue = value !== undefined ? value : `${Math.round(pct)}`
    this.text(shownValue, cx, cy + valueSize * PT * 0.36, {
      size: valueSize, weight: 'bold', color: C.ink, align: 'center',
    })
    if (caption) {
      this.eyebrow(caption, cx, cy + valueSize * PT * 0.36 + 4.6, { align: 'center', size: captionSize })
    }
    if (sub) {
      this.text(sub, cx, cy + radius + thickness / 2 + 6, {
        size: subSize, weight: 'bold', color: C.muted, align: 'center',
      })
    }
    return this
  }

  /** Horizontal meter. */
  meter(x, y, w, percent, { color, track = C.hairline, height = 3.4 } = {}) {
    const pct = Math.max(0, Math.min(100, Number(percent) || 0))
    this.roundRect(x, y, w, height, height / 2, { fill: track })
    if (pct > 0) {
      this.roundRect(x, y, Math.max(height, (w * pct) / 100), height, height / 2, { fill: color || scoreColor(pct) })
    }
    return this
  }

  /**
   * Labelled rows of meters — used for score breakdowns and rating comparisons.
   * `items`: [{ label, value, percent, color, highlight }]
   */
  meterRows(items, { x = this.margin, w = this.inner, y = this.y, rowH = 11, labelW = 52, valueW = 22 } = {}) {
    let cy = y
    const barW = w - labelW - valueW
    items.forEach((item) => {
      this.text(item.label, x, cy + 3.2, {
        size: 8.4, weight: item.highlight ? 'bold' : 'normal',
        color: item.highlight ? C.ink : C.body, maxWidth: labelW - 3, maxLines: 1,
      })
      this.meter(x + labelW, cy + 1.1, barW, item.percent, { color: item.color, height: 3.8 })
      this.text(item.value, x + w, cy + 3.4, {
        size: 8.6, weight: 'bold', color: item.highlight ? C.blueDeep : C.ink, align: 'right',
      })
      cy += rowH
    })
    return cy
  }

  // — decorative elements ———————————————————————————————————

  /** Decorative section divider with a small diamond in the centre. */
  sectionDivider(y, { x = this.margin, w = this.inner, color = C.border } = {}) {
    const mid = x + w / 2
    this.stroke(color)
    this.doc.setLineWidth(0.3)
    this.doc.line(x, y, mid - 6, y)
    this.doc.line(mid + 6, y, x + w, y)
    // Diamond shape
    this.fill(color)
    const s = 1.6
    this.doc.triangle(mid, y - s, mid + s, y, mid, y + s, 'F')
    this.doc.triangle(mid, y - s, mid - s, y, mid, y + s, 'F')
    return y + 5
  }

  /** Gradient-style accent bar — draws a multi-segment coloured bar. */
  gradientBar(x, y, w, h = 1.4, { colors = [C.navy, C.blue, C.red] } = {}) {
    const segW = w / colors.length
    colors.forEach((color, i) => {
      this.rect(x + i * segW, y, segW + 0.5, h, color)
    })
    return y + h
  }

  /** Label-value info row with optional accent dot. */
  infoRow(label, value, { x = this.margin, w = this.inner, y = this.y, accent = C.blue } = {}) {
    this.fill(accent)
    this.doc.circle(x + 1.5, y + 1.2, 1.2, 'F')
    this.text(label, x + 6, y + 2, { size: 7.4, weight: 'bold', color: C.muted })
    this.text(value, x + w, y + 2, { size: 8.8, weight: 'bold', color: C.ink, align: 'right', maxWidth: w * 0.6, maxLines: 1 })
    this.divider(y + 6.5, { x, w, color: C.hairline, lineWidth: 0.15 })
    this.y = y + 9
    return this.y
  }

  // — blocks ——————————————————————————————————————————————————

  /**
   * Grid of KPI tiles. `items`: [{ label, value, sub, tone|color }]
   */
  tiles(items, { x = this.margin, w = this.inner, y = this.y, columns = 4, height = 24, gap = 4 } = {}) {
    const cols = Math.min(columns, items.length) || 1
    const tileW = (w - gap * (cols - 1)) / cols
    const rows = Math.ceil(items.length / cols)

    items.forEach((item, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const tx = x + col * (tileW + gap)
      const ty = y + row * (height + gap)
      const accent = item.color || (item.tone ? tone(item.tone).fg : C.blue)

      this.roundRect(tx, ty, tileW, height, 2.4, { fill: C.white, border: C.border })
      this.rect(tx, ty, 1.5, height, accent)
      this.eyebrow(item.label, tx + 6, ty + 7.4, { size: 6.4 })
      this.text(item.value, tx + 6, ty + 16.4, {
        size: item.valueSize || 15, weight: 'bold', color: C.ink, maxWidth: tileW - 11, maxLines: 1,
      })
      if (item.sub) {
        this.text(item.sub, tx + 6, ty + height - 4.2, {
          size: 6.8, color: C.faint, weight: 'bold', maxWidth: tileW - 11, maxLines: 1,
        })
      }
    })

    return y + rows * height + (rows - 1) * gap
  }

  /** Tinted advisory box. */
  callout({ title, body, toneName = 'info', x = this.margin, w = this.inner, y = this.y }) {
    const t = tone(toneName)
    const doc = this.doc
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.6)
    const bodyLines = body ? doc.splitTextToSize(String(body), w - 16) : []
    const h = 9 + (title ? 5.4 : 0) + bodyLines.length * 4.1 + 2

    this.roundRect(x, y, w, h, 2.4, { fill: t.bg })
    this.rect(x, y + 1.2, 1.6, h - 2.4, t.fg)

    let cy = y + 7.6
    if (title) {
      this.text(title, x + 8, cy, { size: 9.2, weight: 'bold', color: t.fg })
      cy += 5.4
    }
    if (bodyLines.length) {
      this.text(body, x + 8, cy, { size: 8.6, color: C.body, maxWidth: w - 16, lineHeight: 4.1 })
    }
    return y + h
  }

  /** Numbered recommendation cards. `items`: [{ title, body, toneName }] */
  steps(items, { x = this.margin, w = this.inner, y = this.y, gap = 4, section } = {}) {
    let cy = y
    const doc = this.doc
    items.forEach((item, i) => {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.4)
      const lines = item.body ? doc.splitTextToSize(String(item.body), w - 26) : []
      const h = Math.max(17, 13 + lines.length * 4)

      if (cy + h > this.bottom) cy = this.page(section)

      this.roundRect(x, cy, w, h, 2.4, { fill: C.white, border: C.border })
      this.roundRect(x + 5, cy + 4.4, 8, 8, 4, { fill: tone(item.toneName || 'info').fg })
      this.text(String(i + 1), x + 9, cy + 9.9, { size: 8.6, weight: 'bold', color: C.white, align: 'center' })
      this.text(item.title, x + 18, cy + 8.2, { size: 9.2, weight: 'bold', color: C.ink, maxWidth: w - 26, maxLines: 1 })
      if (lines.length) {
        this.text(item.body, x + 18, cy + 13.4, { size: 8.4, color: C.muted, maxWidth: w - 26, lineHeight: 4 })
      }
      cy += h + gap
    })
    this.y = cy
    return cy
  }

  /**
   * Paginated table.
   * `cols`: [{ label, width (mm or 0-1 fraction), align, render(row,i), sub(row,i), pill(row,i) }]
   */
  table({ cols, rows, x = this.margin, w = this.inner, y = this.y, rowH, headFill = C.navy, headColor = C.white, zebra = true, section, emptyText = 'No data available.' }) {
    const doc = this.doc
    const widths = cols.map(c => (c.width === undefined ? w / cols.length : c.width <= 1 ? c.width * w : c.width))
    const hasSub = cols.some(c => typeof c.sub === 'function')
    const bodyRowH = rowH ?? (hasSub ? 12.5 : 9.4)
    const headH = 8.2

    const drawHead = (hy) => {
      this.rect(x, hy, w, headH, headFill)
      let cx = x
      cols.forEach((col, i) => {
        const align = col.align || 'left'
        const tx = align === 'right' ? cx + widths[i] - 4 : align === 'center' ? cx + widths[i] / 2 : cx + 4
        this.text(String(col.label).toUpperCase(), tx, hy + 5.4, {
          size: 6.6, weight: 'bold', color: headColor, align, spacing: 0.5,
        })
        cx += widths[i]
      })
      return hy + headH
    }

    let cy = drawHead(y)

    if (!rows || rows.length === 0) {
      this.roundRect(x, cy, w, 12, 0, { fill: C.wash })
      this.text(emptyText, x + w / 2, cy + 7.4, { size: 8.4, color: C.faint, weight: 'bold', align: 'center' })
      this.y = cy + 12
      return this.y
    }

    rows.forEach((row, ri) => {
      if (cy + bodyRowH > this.bottom) {
        cy = this.page(section)
        cy = drawHead(cy)
      }

      const highlight = row.__highlight
      if (highlight) this.rect(x, cy, w, bodyRowH, C.blueWash)
      else if (zebra && ri % 2 === 1) this.rect(x, cy, w, bodyRowH, C.wash)

      let cx = x
      cols.forEach((col, i) => {
        const align = col.align || 'left'
        const cw = widths[i]
        const tx = align === 'right' ? cx + cw - 4 : align === 'center' ? cx + cw / 2 : cx + 4

        const chip = typeof col.pill === 'function' ? col.pill(row, ri) : null
        if (chip) {
          const doc2 = this.doc
          doc2.setFont('helvetica', 'bold')
          doc2.setFontSize(6.8)
          const pw = doc2.getTextWidth(String(chip.label).toUpperCase()) + 6
          const px = align === 'right' ? cx + cw - 4 - pw : align === 'center' ? cx + cw / 2 - pw / 2 : cx + 4
          this.pill(chip.label, px, cy + (bodyRowH - 5.2) / 2, { toneName: chip.toneName })
        } else {
          const main = typeof col.render === 'function' ? col.render(row, ri) : row[col.key]
          const subText = typeof col.sub === 'function' ? col.sub(row, ri) : null
          const baseY = subText ? cy + 5.4 : cy + bodyRowH / 2 + 1.3
          this.text(main, tx, baseY, {
            size: col.size || 8.6,
            weight: col.weight || (highlight ? 'bold' : 'normal'),
            color: col.color ? (typeof col.color === 'function' ? col.color(row, ri) : col.color) : C.ink,
            align, maxWidth: cw - 8, maxLines: 1,
          })
          if (subText) {
            this.text(subText, tx, cy + 9.8, {
              size: 7, color: C.faint, align, maxWidth: cw - 8, maxLines: 1,
            })
          }
        }
        cx += cw
      })

      this.divider(cy + bodyRowH, { x, w, color: C.border, lineWidth: 0.15 })
      cy += bodyRowH
    })

    this.y = cy
    return cy
  }

  // — heatmap ————————————————————————————————————————————————

  /**
   * Overlays rank pins on a static map image already placed at `box`.
   * `imgW/imgH` are the *device* pixel dimensions of the fetched image, which
   * is why fit/projection uses `scale` — getting this wrong squashes every pin
   * toward the centre.
   */
  heatmapPins({ points, center, zoom, box, imgW = 1200, imgH = 840, scale = 2, radius = 2.1, business }) {
    const doc = this.doc
    const place = (lat, lng) => {
      const world = 256 * Math.pow(2, zoom)
      const toY = (l) => {
        const rad = (l * Math.PI) / 180
        return (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * world
      }
      const dx = (((lng + 180) / 360) * world - ((center.lng + 180) / 360) * world) * scale
      const dy = (toY(lat) - toY(center.lat)) * scale
      return { px: imgW / 2 + dx, py: imgH / 2 + dy }
    }

    ;(points || []).forEach((p) => {
      if (!Number.isFinite(p?.latitude) || !Number.isFinite(p?.longitude)) return
      const { px, py } = place(p.latitude, p.longitude)
      if (px < 0 || px > imgW || py < 0 || py > imgH) return

      const mx = box.x + (px * box.w) / imgW
      const my = box.y + (py * box.h) / imgH
      const { fill, text } = rankColor(p.rank, p.found !== false)

      this.fill(fill)
      this.stroke(C.white)
      doc.setLineWidth(0.28)
      doc.circle(mx, my, radius, 'FD')

      const label = p.found === false || !p.rank || p.rank > 20 ? 'X' : String(p.rank)
      this.text(label, mx, my + radius * 0.36, {
        size: radius * 2.1, weight: 'bold', color: text, align: 'center',
      })
    })

    if (business && Number.isFinite(business.latitude) && Number.isFinite(business.longitude)) {
      const { px, py } = place(business.latitude, business.longitude)
      if (px >= 0 && px <= imgW && py >= 0 && py <= imgH) {
        const mx = box.x + (px * box.w) / imgW
        const my = box.y + (py * box.h) / imgH
        this.fill(C.red)
        this.stroke(C.white)
        doc.setLineWidth(0.5)
        doc.circle(mx, my, radius * 1.6, 'FD')
        this.text('B', mx, my + radius * 0.6, {
          size: radius * 2.9, weight: 'bold', color: C.white, align: 'center',
        })
      }
    }
    return this
  }

  /** Rank colour key, laid out horizontally. */
  rankLegend(x, y, { w = this.inner, items = RANK_LEGEND, size = 7 } = {}) {
    const step = w / items.length
    items.forEach((item, i) => {
      const cx = x + i * step
      this.fill(item.color)
      this.doc.circle(cx + 1.8, y, 1.8, 'F')
      this.text(item.label, cx + 5, y + 1.1, { size, weight: 'bold', color: C.muted })
    })
    return y + 5
  }

  // — page furniture ————————————————————————————————————————

  /**
   * Cover page. Navy masthead, floating summary card, contents list and a
   * contact band along the foot. Enhanced with premium accent lines,
   * "Prepared For" attribution and a professional reference number.
   */
  cover({ eyebrow: eyebrowText, title, subtitle, meta = [], score = null, contents = [], preparedFor, refNumber }) {
    const { W, H, margin, inner } = this
    const bandH = Math.min(128, H * 0.43)

    // — Navy masthead with depth layers.
    this.rect(0, 0, W, bandH, C.navy)
    this.withAlpha(0.08, () => {
      this.fill(C.navySoft)
      this.doc.rect(0, 0, W, bandH * 0.35, 'F')
    })
    this.withAlpha(0.16, () => {
      this.fill(C.blue)
      this.doc.circle(W - 18, 16, 46, 'F')
    })
    this.withAlpha(0.1, () => {
      this.fill(C.red)
      this.doc.circle(W - 4, bandH - 18, 30, 'F')
    })
    // Subtle geometric corner accents
    this.withAlpha(0.06, () => {
      this.fill(C.white)
      this.doc.triangle(0, 0, 60, 0, 0, 60, 'F')
    })
    // Premium two-tone border (blue + amber accent).
    this.rect(0, bandH - 2.4, W, 1.6, C.blue)
    this.rect(0, bandH - 0.8, W, 0.8, [217, 165, 32])

    // Logo — top left.
    this.logoMark(margin, 13, 14, { onDark: true })

    // Reference number — top right.
    if (refNumber) {
      this.text(refNumber, W - margin, 18, {
        size: 7, weight: 'bold', color: [110, 140, 180], align: 'right', spacing: 0.5,
      })
    }

    // "Prepared Exclusively For" line.
    let ty = 50
    if (preparedFor) {
      this.eyebrow('Prepared Exclusively For', margin, ty, { color: [217, 165, 32], size: 6.8 })
      ty += 7.5
      ty += this.text(preparedFor, margin, ty, {
        size: 11, weight: 'bold', color: C.white, maxWidth: inner * 0.7, maxLines: 1,
      })
      ty += 4
    }

    if (eyebrowText) {
      this.eyebrow(eyebrowText, margin, ty, { color: [125, 197, 245], size: 7.4 })
      ty += 9
    }
    ty += this.text(title, margin, ty, {
      size: 25, weight: 'bold', color: C.white, maxWidth: inner - 6, maxLines: 3, lineHeight: 10.4,
    })
    if (subtitle) {
      ty += 3
      this.text(subtitle, margin, ty, { size: 9.6, color: [166, 189, 217], maxWidth: inner - 40, maxLines: 2, lineHeight: 4.6 })
    }

    // Floating summary card overlapping the masthead.
    const cardY = bandH - 16
    const cardH = 48
    this.roundRect(margin, cardY, inner, cardH, 3.2, { fill: C.white, border: C.border, lineWidth: 0.4 })
    // Accent stripe at top of card.
    this.rect(margin + 0.5, cardY, inner - 1, 1.2, C.blue)

    const hasScore = score && score.value !== undefined && score.value !== null
    const metaW = hasScore ? inner - 58 : inner - 10
    const shown = meta.slice(0, 3)
    const colW = metaW / Math.max(1, shown.length)
    shown.forEach((m, i) => {
      const mx = margin + 8 + i * colW
      this.eyebrow(m.label, mx, cardY + 15, { size: 6.2 })
      this.text(m.value, mx, cardY + 24, { size: 10.4, weight: 'bold', color: C.ink, maxWidth: colW - 8, maxLines: 2, lineHeight: 4.5 })
    })

    if (hasScore) {
      const cx = margin + inner - 29
      this.donut(cx, cardY + cardH / 2, 14, score.value, {
        thickness: 4.4, value: String(Math.round(score.value)), valueSize: 16, caption: score.caption || '/ 100',
      })
      this.text(score.label || 'Overall Score', cx, cardY + cardH + 6, {
        size: 6.8, weight: 'bold', color: C.faint, align: 'center', spacing: 0.4,
      })
      this.stroke(C.hairline)
      this.doc.setLineWidth(0.3)
      this.doc.line(margin + inner - 58, cardY + 10, margin + inner - 58, cardY + cardH - 10)
    }

    // Contents.
    let cy = cardY + cardH + 22
    if (contents.length) {
      this.eyebrow("What's inside this report", margin, cy, { color: C.muted, size: 7.2 })
      cy += 4
      this.divider(cy, { color: C.border })
      cy += 8
      contents.forEach((item, i) => {
        // Numbered circle instead of plain text.
        this.roundRect(margin, cy - 3.2, 8, 8, 4, { fill: C.blue })
        this.text(String(i + 1), margin + 4, cy + 1.2, { size: 7, weight: 'bold', color: C.white, align: 'center' })
        this.text(item.title, margin + 12, cy, { size: 9.6, weight: 'bold', color: C.ink })
        if (item.detail) {
          this.text(item.detail, margin + 12, cy + 4.6, { size: 8, color: C.muted, maxWidth: inner - 20, maxLines: 1 })
        }
        cy += item.detail ? 12.5 : 8.5
      })
    }

    // Contact band — larger, with office addresses.
    const bandY = H - 56
    this.rect(0, bandY, W, 56, C.navy)
    this.gradientBar(0, bandY, W, 1.6)

    this.text('Questions about this report?', margin, bandY + 11, { size: 11, weight: 'bold', color: C.white })
    this.text(`Talk to a ${BRAND.name} local search strategist.`, margin, bandY + 17.5, { size: 8.4, color: [166, 189, 217] })

    const colStart = margin
    const contactCols = [
      { label: 'Email', value: BRAND.email },
      ...BRAND.phones.map(p => ({ label: `Phone (${p.region})`, value: p.number })),
      { label: 'Website', value: BRAND.website },
    ]
    const ccW = inner / contactCols.length
    contactCols.forEach((c, i) => {
      const cx2 = colStart + i * ccW
      this.eyebrow(c.label, cx2, bandY + 28, { color: [110, 140, 180], size: 6 })
      this.text(c.value, cx2, bandY + 35, { size: 9.2, weight: 'bold', color: C.white, maxWidth: ccW - 4, maxLines: 1 })
    })

    // Confidential line at the very bottom.
    this.text(BRAND.confidential, W / 2, bandY + 49, {
      size: 5.8, color: [80, 100, 130], align: 'center', spacing: 0.6,
    })

    this.coverPageCount = this.doc.internal.getNumberOfPages()
    return this
  }

  /** Running header. Returns the Y position where content should begin. */
  header(section) {
    if (section !== undefined) this.section = section
    const { W, margin, headerH } = this

    this.rect(0, 0, W, headerH, C.navy)
    // Two-tone accent rule (blue + amber) matching the cover page.
    this.rect(0, headerH, W, 0.9, C.blue)
    this.rect(0, headerH + 0.9, W, 0.4, [217, 165, 32])
    this.logoMark(margin, 3.6, 9.6, { onDark: true, chipPad: 2.1, chipRadius: 1.4 })

    if (this.section) {
      this.text(this.section, W - margin, 9.6, { size: 9.8, weight: 'bold', color: C.white, align: 'right' })
    }
    if (this.subject) {
      this.text(this.subject, W - margin, 15.4, {
        size: 7.2, weight: 'bold', color: [140, 167, 200], align: 'right', spacing: 0.3,
      })
    }

    this.y = headerH + 13
    return this.y
  }

  /** Adds a page and draws the running header. */
  page(section) {
    this.doc.addPage()
    return this.header(section)
  }

  /** Starts a new page if `height` mm doesn't fit under the current cursor. */
  ensure(height, section) {
    if (this.y + height > this.bottom) return this.page(section)
    return this.y
  }

  /** Section heading with rule. */
  heading(title, { sub, y = this.y, x = this.margin, w = this.inner } = {}) {
    let cy = y
    cy += this.text(title, x, cy, { size: 14.5, weight: 'bold', color: C.ink })
    if (sub) {
      cy += 1.6
      cy += this.text(sub, x, cy, { size: 8.6, color: C.muted, maxWidth: w - 4, lineHeight: 4.2 })
    }
    cy += 2.4
    this.rect(x, cy, 16, 1.1, C.blue)
    this.y = cy + 8
    return this.y
  }

  /** Smaller heading for blocks inside a section. */
  subheading(title, { y = this.y, x = this.margin, right } = {}) {
    this.text(title, x, y, { size: 10.4, weight: 'bold', color: C.ink })
    if (right) this.text(right, x + this.inner, y, { size: 7.6, weight: 'bold', color: C.faint, align: 'right' })
    this.y = y + 5.6
    return this.y
  }

  /**
   * Closing page: an optional step list plus a full contact card. Every report
   * ends here so the reader always has our logo, email and both phone numbers
   * in hand.
   */
  closing({ section = 'Contact Us', headline, body, steps = [] }) {
    this.page(section)
    this.heading(headline || 'Get in touch', { sub: body })

    if (steps.length) this.steps(steps, { y: this.y, section })

    const { margin, inner, H, W } = this

    // CTA banner.
    const ctaY = Math.max(this.y + 6, H - this.footerH - 120)
    const ctaH = 24
    this.roundRect(margin, ctaY, inner, ctaH, 2.4, { fill: C.blueWash, border: C.blue })
    this.rect(margin, ctaY, 2, ctaH, C.blue)
    this.text('Schedule Your Strategy Session', margin + 10, ctaY + 9, {
      size: 11, weight: 'bold', color: C.blueDeep,
    })
    this.text('Our team will walk you through every finding and build a prioritised action plan — no charge.', margin + 10, ctaY + 16, {
      size: 8, color: C.body, maxWidth: inner - 20,
    })

    // Main contact card — larger with full office details.
    const cardH = 82
    const cardY = ctaY + ctaH + 6
    this.roundRect(margin, cardY, inner, cardH, 3.2, { fill: C.navy })
    this.gradientBar(margin, cardY, inner, 1.6)
    this.logoMark(margin + 8, cardY + 10, 12, { onDark: true, chipPad: 2.2, chipRadius: 1.6 })

    this.text(BRAND.tagline, margin + 8, cardY + 34, { size: 8.6, color: [166, 189, 217] })
    this.text('Book a walkthrough of these findings.', margin + 8, cardY + 40.5, {
      size: 9, weight: 'bold', color: C.white, maxWidth: inner * 0.44,
    })

    // Contact details — right column.
    const rx = margin + inner * 0.48
    const rw = inner * 0.52 - 8
    let ry = cardY + 10
    this.eyebrow('Email', rx, ry, { color: [110, 140, 180], size: 6 })
    this.text(BRAND.email, rx, ry + 6, { size: 10, weight: 'bold', color: C.white })
    ry += 14

    BRAND.phones.forEach((p) => {
      this.eyebrow(`Phone (${p.region})`, rx, ry, { color: [110, 140, 180], size: 6 })
      this.text(p.number, rx, ry + 6, { size: 10, weight: 'bold', color: C.white })
      ry += 14
    })

    // Office addresses.
    const officeY = cardY + 52
    const offW = (inner - 20) / 2
    BRAND.offices.forEach((o, i) => {
      const ox = margin + 8 + i * (offW + 8)
      this.eyebrow(`Office — ${o.region}`, ox, officeY, { color: [110, 140, 180], size: 5.8 })
      this.text(o.address.replace(/\n/g, ', '), ox, officeY + 6, {
        size: 7.4, color: [180, 200, 220], maxWidth: offW - 4, lineHeight: 3.6, maxLines: 2,
      })
    })

    // Website and confidential.
    this.text(BRAND.website, margin + inner - 8, cardY + cardH - 6, {
      size: 8.8, weight: 'bold', color: C.blue, align: 'right',
    })
    this.text(BRAND.confidential, margin + inner / 2, cardY + cardH + 5, {
      size: 5.6, color: C.faint, align: 'center', spacing: 0.5,
    })
    return this
  }

  /** Draws the branded footer on every page except the cover. */
  footers({ skipCover = true, note } = {}) {
    const doc = this.doc
    const total = doc.internal.getNumberOfPages()
    const first = skipCover ? this.coverPageCount + 1 : 1
    const numbered = total - first + 1

    for (let p = first; p <= total; p++) {
      doc.setPage(p)
      // Accent line matching header.
      this.rect(0, this.H - 14, this.W, 0.3, C.blue)
      this.rect(0, this.H - 13.7, this.W, 0.15, [217, 165, 32])

      this.text(CONTACT_LINE, this.margin, this.H - 9.5, { size: 7, weight: 'bold', color: C.muted })
      this.text(`Page ${p - first + 1} of ${numbered}`, this.W - this.margin, this.H - 9.5, {
        size: 7, weight: 'bold', color: C.muted, align: 'right',
      })
      this.text(note || `${BRAND.name} — ${BRAND.tagline}`, this.margin, this.H - 5.2, { size: 6.4, color: C.faint })
      this.text(BRAND.confidential, this.W / 2, this.H - 5.2, {
        size: 5.4, color: [180, 195, 210], align: 'center', spacing: 0.4,
      })
      this.text(BRAND.website, this.W - this.margin, this.H - 5.2, { size: 6.4, color: C.faint, align: 'right' })
    }
    doc.setPage(total)
    return this
  }

  /** Runs `fn` with a graphics-state opacity, when the build supports it. */
  withAlpha(alpha, fn) {
    const doc = this.doc
    let applied = false
    try {
      if (typeof doc.setGState === 'function' && doc.GState) {
        doc.setGState(new doc.GState({ opacity: alpha }))
        applied = true
      }
    } catch { /* older jsPDF build — draw fully opaque */ }
    fn()
    if (applied) {
      try { doc.setGState(new doc.GState({ opacity: 1 })) } catch { /* no-op */ }
    }
  }
}

/** `Report_Business_Name_2026-08-07.pdf` */
export function reportFileName(prefix, subject) {
  const safe = String(subject || 'Report').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 60)
  const date = new Date().toISOString().slice(0, 10)
  return `${prefix}_${safe || 'Report'}_${date}.pdf`
}

export function formatReportDate(value = new Date()) {
  return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}
