// Drawing kit for the canvas scenes. Everything in the game is painted
// with these helpers so the whole story shares one watercolour look.
//
// All drawing happens every frame, so anything "hand-made" (wobbly edges,
// paint blotches) uses a seeded random generator to stay stable between frames.

export const W = 540
export const H = 960

export const C = {
  paper: '#f5eee2',
  paperDark: '#e9dfcf',
  ink: '#2f2b33',
  inkSoft: '#6d6570',
  grey: '#b9b4ae',
  greyDark: '#8e8983',
  greyLight: '#d8d3cc',
  mira: '#e3a23b', // Mira's mustard coat
  miraHair: '#2b2230',
  arun: '#c4533f', // Arun's rust scarf
  arunHair: '#3a2a22',
  skin1: '#d9a27c',
  skin2: '#b97d5a',
  sky: '#9cc3d5',
  leaf: '#8fb170',
  rose: '#e59a9a',
  plum: '#8a6a9c',
  teal: '#5e9e9a',
  cream: '#fbf6ec',
  night: '#35365a',
}

export const FONT = "'Patrick Hand', 'Comic Sans MS', cursive"
// rounded sans for interface text: labels, menus, dialogs
export const UI_FONT = "'Andika', 'Trebuchet MS', sans-serif"

// ---------- math ----------

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
export const lerp = (a, b, t) => a + (b - a) * t
export const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by)
export const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3)
export const easeInOut = (t) => {
  t = clamp(t, 0, 1)
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
export const inRect = (x, y, r) =>
  x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h

export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Mix two hex colours; used to fade the world from grey to colour.
export function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const ch = (p, s) => (p >> s) & 255
  const m = (s) => Math.round(lerp(ch(pa, s), ch(pb, s), clamp(t, 0, 1)))
  return `rgb(${m(16)},${m(8)},${m(0)})`
}

// ---------- paper & paint ----------

export function paper(ctx, color = C.paper) {
  ctx.fillStyle = color
  ctx.fillRect(0, 0, W, H)
  // faint grain
  const r = rng(7)
  ctx.fillStyle = 'rgba(120,100,80,0.035)'
  for (let i = 0; i < 260; i++) {
    ctx.fillRect(r() * W, r() * H, 2 + r() * 3, 1 + r() * 2)
  }
}

// Wobbly closed shape through points, used for all watercolour fills.
function wobblyPath(ctx, pts) {
  ctx.beginPath()
  const n = pts.length
  for (let i = 0; i < n; i++) {
    const p0 = pts[i]
    const p1 = pts[(i + 1) % n]
    const mx = (p0[0] + p1[0]) / 2
    const my = (p0[1] + p1[1]) / 2
    if (i === 0) ctx.moveTo(mx, my)
    else ctx.quadraticCurveTo(p0[0], p0[1], mx, my)
  }
  const p0 = pts[0]
  const p1 = pts[1 % n]
  ctx.quadraticCurveTo(p0[0], p0[1], (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2)
  ctx.closePath()
}

function rectPoints(x, y, w, h, r, jitter) {
  const pts = []
  const steps = 6
  for (let i = 0; i < steps; i++) pts.push([x + (w * i) / steps, y])
  for (let i = 0; i < steps; i++) pts.push([x + w, y + (h * i) / steps])
  for (let i = 0; i < steps; i++) pts.push([x + w - (w * i) / steps, y + h])
  for (let i = 0; i < steps; i++) pts.push([x, y + h - (h * i) / steps])
  return pts.map(([px, py]) => [
    px + (r() - 0.5) * jitter,
    py + (r() - 0.5) * jitter,
  ])
}

// Watercolour rectangle: three translucent layers with hand-made edges.
export function wash(ctx, x, y, w, h, color, seed = 1, alpha = 1) {
  const r = rng(seed)
  const base = ctx.globalAlpha
  ctx.save()
  ctx.fillStyle = color
  for (let layer = 0; layer < 3; layer++) {
    ctx.globalAlpha = base * alpha * (layer === 0 ? 0.55 : 0.3)
    wobblyPath(ctx, rectPoints(x, y, w, h, r, 7 + layer * 3))
    ctx.fill()
  }
  ctx.restore()
}

// Watercolour blob (circle/ellipse).
export function blob(ctx, x, y, rx, ry, color, seed = 1, alpha = 1) {
  const r = rng(seed)
  const base = ctx.globalAlpha
  ctx.save()
  ctx.fillStyle = color
  for (let layer = 0; layer < 3; layer++) {
    const pts = []
    const n = 12
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      const k = 1 + (r() - 0.5) * 0.14
      pts.push([x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k])
    }
    ctx.globalAlpha = base * alpha * (layer === 0 ? 0.6 : 0.3)
    wobblyPath(ctx, pts)
    ctx.fill()
  }
  ctx.restore()
}

// Hand-drawn ink line with a slight wobble.
export function line(ctx, x1, y1, x2, y2, color = C.ink, width = 3, seed = 1) {
  const r = rng(seed)
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  const mx = (x1 + x2) / 2 + (r() - 0.5) * 4
  const my = (y1 + y2) / 2 + (r() - 0.5) * 4
  ctx.quadraticCurveTo(mx, my, x2, y2)
  ctx.stroke()
  ctx.restore()
}

export function roundRect(ctx, x, y, w, h, rad) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, rad)
}

// ---------- text ----------

export function text(ctx, str, x, y, opts = {}) {
  const {
    size = 30,
    color = C.ink,
    align = 'center',
    maxWidth = W - 80,
    lineHeight = 1.25,
    alpha = 1,
    baseline = 'middle',
  } = opts
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.font = `${size}px ${FONT}`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = baseline
  const lines = wrap(ctx, str, maxWidth)
  const lh = size * lineHeight
  const top = y - ((lines.length - 1) * lh) / 2
  lines.forEach((l, i) => ctx.fillText(l, x, top + i * lh))
  ctx.restore()
  return lines.length * lh
}

function wrap(ctx, str, maxWidth) {
  const out = []
  for (const para of String(str).split('\n')) {
    let cur = ''
    for (const word of para.split(' ')) {
      const next = cur ? cur + ' ' + word : word
      if (ctx.measureText(next).width > maxWidth && cur) {
        out.push(cur)
        cur = word
      } else cur = next
    }
    out.push(cur)
  }
  return out
}

// Narration caption on a paper strip at the bottom of the screen.
export function caption(ctx, str, alpha = 1, y = H - 90) {
  if (!str) return
  ctx.save()
  ctx.globalAlpha *= alpha
  wash(ctx, 30, y - 50, W - 60, 100, C.cream, 99)
  text(ctx, str, W / 2, y, { size: 28, maxWidth: W - 110 })
  ctx.restore()
}

// Comic panel: paints draw(ctx) clipped inside an ink-bordered frame.
// Story beats are laid out as 1–3 stacked panels per screen, like a comic page.
// Inside draw(), (0, 0) is the panel's top-left corner and w x h its size.
export function panel(ctx, x, y, w, h, draw, { alpha = 1 } = {}) {
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.translate(x, y)
  ctx.fillStyle = C.cream
  ctx.fillRect(0, 0, w, h)
  draw(ctx, w, h)
  ctx.restore()
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.strokeStyle = C.ink
  ctx.lineWidth = 5
  ctx.strokeRect(x, y, w, h)
  ctx.restore()
}

// Torn-paper label that sits across panel edges ("25 years old").
export function label(ctx, str, x, y, alpha = 1) {
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.font = `30px ${FONT}`
  const w = ctx.measureText(str).width + 50
  ctx.restore()
  ctx.save()
  ctx.globalAlpha *= alpha
  wash(ctx, x - w / 2, y - 30, w, 60, '#fbfaf6', 98)
  ctx.restore()
  text(ctx, str, x, y, { size: 30, alpha })
}

// Pulsing ring that tells the player where (or that) they can tap.
export function tapHint(ctx, x, y, t, color = C.ink) {
  const k = (t * 1.2) % 1
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.globalAlpha = 0.6 * (1 - k)
  ctx.beginPath()
  ctx.arc(x, y, 10 + k * 22, 0, Math.PI * 2)
  ctx.stroke()
  ctx.globalAlpha = 0.7
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// ---------- props ----------

// Speech bubble body (without text). tail: 'left' | 'right' | 'none'.
export function bubble(ctx, x, y, w, h, color = C.cream, tail = 'left') {
  ctx.save()
  ctx.fillStyle = color
  ctx.strokeStyle = C.ink
  ctx.lineWidth = 3
  roundRect(ctx, x, y, w, h, 22)
  ctx.fill()
  ctx.stroke()
  if (tail !== 'none') {
    const tx = tail === 'left' ? x + 40 : x + w - 40
    const dir = tail === 'left' ? -1 : 1
    ctx.beginPath()
    ctx.moveTo(tx - 14, y + h - 2)
    ctx.lineTo(tx + dir * 18, y + h + 22)
    ctx.lineTo(tx + 14, y + h - 2)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(tx - 14, y + h)
    ctx.lineTo(tx + dir * 18, y + h + 22)
    ctx.lineTo(tx + 14, y + h)
    ctx.stroke()
  }
  ctx.restore()
}

export function phone(ctx, x, y, w, h, screen = '#fff', lit = true) {
  ctx.save()
  ctx.fillStyle = C.ink
  roundRect(ctx, x, y, w, h, 18)
  ctx.fill()
  ctx.fillStyle = lit ? screen : '#222'
  roundRect(ctx, x + 8, y + 16, w - 16, h - 32, 10)
  ctx.fill()
  ctx.restore()
}

export function windowFrame(ctx, x, y, w, h, sky = C.sky, seed = 3) {
  wash(ctx, x, y, w, h, sky, seed)
  ctx.save()
  ctx.strokeStyle = C.paperDark
  ctx.lineWidth = 10
  ctx.strokeRect(x, y, w, h)
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(x + w / 2, y)
  ctx.lineTo(x + w / 2, y + h)
  ctx.moveTo(x, y + h / 2)
  ctx.lineTo(x + w, y + h / 2)
  ctx.stroke()
  ctx.restore()
}

export function plant(ctx, x, y, s = 1, color = C.leaf, seed = 5) {
  wash(ctx, x - 18 * s, y - 30 * s, 36 * s, 30 * s, '#c07a55', seed)
  const r = rng(seed)
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (r() - 0.5) * 1.8
    blob(
      ctx,
      x + Math.cos(a) * 28 * s,
      y - 40 * s + Math.sin(a) * 28 * s,
      16 * s,
      9 * s,
      color,
      seed + i,
    )
  }
}

// ---------- people ----------
//
// person(ctx, {x, y, s, ...}) draws a stylised figure standing with feet at (x, y).
// The figure is ~300px tall at s = 1. Options:
//   hair, top, bottom, skin: colours
//   hairStyle: 'bun' (Mira) | 'short' (Arun) | 'long'
//   pose: 'stand' | 'walk' | 'sit' | 'violin' | 'wave' | 'hug'
//   t: time in seconds (drives walk cycle / playing)
//   facing: 1 (right) or -1 (left)
//   eyes: 'open' | 'closed' | 'down'
//   mouth: 'none' | 'smile' | 'sad' | 'open'

export const MIRA = {
  hair: C.miraHair,
  top: C.mira,
  bottom: '#4b5a78',
  skin: C.skin1,
  hairStyle: 'bun',
}
export const ARUN = {
  hair: C.arunHair,
  top: '#50627a',
  bottom: '#3b3a40',
  skin: C.skin2,
  hairStyle: 'short',
  scarf: C.arun,
}
export const MOTHER = {
  hair: '#6e6a70',
  top: C.plum,
  bottom: '#57465f',
  skin: C.skin1,
  hairStyle: 'bun',
}

export function person(ctx, o) {
  const {
    x,
    y,
    s = 1,
    hair = C.ink,
    top = C.grey,
    bottom = C.greyDark,
    skin = C.skin1,
    scarf,
    hairStyle = 'short',
    pose = 'stand',
    t = 0,
    facing = 1,
    eyes = 'open',
    mouth = 'none',
    grey = 0, // 0..1, drains the colour out of the figure
  } = o
  const g = (c) => (grey > 0 ? mix(c.startsWith('#') ? c : '#888888', C.grey, grey) : c)
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s * facing, s)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const sitting = pose === 'sit'
  const walk = pose === 'walk' ? Math.sin(t * 7) : 0
  const hipY = sitting ? -110 : -140
  const shoulderY = hipY - 105

  // legs
  ctx.strokeStyle = g(bottom)
  ctx.lineWidth = 22
  ctx.beginPath()
  if (sitting) {
    ctx.moveTo(-10, hipY)
    ctx.lineTo(40, hipY)
    ctx.lineTo(40, 0)
    ctx.moveTo(10, hipY)
    ctx.lineTo(55, hipY)
    ctx.lineTo(55, 0)
  } else {
    ctx.moveTo(-8, hipY)
    ctx.lineTo(-8 + walk * 22, 0)
    ctx.moveTo(8, hipY)
    ctx.lineTo(8 - walk * 22, 0)
  }
  ctx.stroke()
  // shoes
  ctx.fillStyle = C.ink
  if (sitting) {
    ctx.fillRect(34, -6, 26, 8)
    ctx.fillRect(49, -6, 26, 8)
  } else {
    ctx.fillRect(-18 + walk * 22, -6, 24, 8)
    ctx.fillRect(-2 - walk * 22, -6, 24, 8)
  }

  // body
  ctx.fillStyle = g(top)
  ctx.beginPath()
  ctx.moveTo(-30, shoulderY + 10)
  ctx.quadraticCurveTo(0, shoulderY - 12, 30, shoulderY + 10)
  ctx.lineTo(36, hipY + 18)
  ctx.lineTo(-36, hipY + 18)
  ctx.closePath()
  ctx.fill()

  // arms
  ctx.strokeStyle = g(top)
  ctx.lineWidth = 18
  ctx.beginPath()
  if (pose === 'violin') {
    // left arm holds the neck out front, right arm bows
    const bow = Math.sin(t * 5) * 18
    ctx.moveTo(-22, shoulderY + 12)
    ctx.lineTo(10, shoulderY + 30)
    ctx.lineTo(48, shoulderY + 6)
    ctx.moveTo(24, shoulderY + 12)
    ctx.lineTo(30 + bow * 0.3, shoulderY + 60)
    ctx.lineTo(4 + bow, shoulderY + 44)
  } else if (pose === 'wave') {
    const w = Math.sin(t * 8) * 10
    ctx.moveTo(-26, shoulderY + 12)
    ctx.lineTo(-32, shoulderY + 80)
    ctx.moveTo(26, shoulderY + 12)
    ctx.lineTo(48, shoulderY - 20)
    ctx.lineTo(52 + w, shoulderY - 70)
  } else if (pose === 'hug') {
    ctx.moveTo(-26, shoulderY + 12)
    ctx.lineTo(10, shoulderY + 50)
    ctx.lineTo(48, shoulderY + 40)
    ctx.moveTo(26, shoulderY + 12)
    ctx.lineTo(46, shoulderY + 55)
    ctx.lineTo(60, shoulderY + 30)
  } else if (sitting) {
    ctx.moveTo(-26, shoulderY + 12)
    ctx.lineTo(-10, shoulderY + 70)
    ctx.lineTo(30, shoulderY + 90)
    ctx.moveTo(26, shoulderY + 12)
    ctx.lineTo(36, shoulderY + 70)
    ctx.lineTo(56, shoulderY + 88)
  } else {
    ctx.moveTo(-26, shoulderY + 12)
    ctx.lineTo(-32 - walk * 14, shoulderY + 95)
    ctx.moveTo(26, shoulderY + 12)
    ctx.lineTo(32 + walk * 14, shoulderY + 95)
  }
  ctx.stroke()

  if (pose === 'violin') {
    // violin under the chin
    ctx.fillStyle = '#9a5a2c'
    ctx.save()
    ctx.translate(20, shoulderY + 14)
    ctx.rotate(-0.35)
    ctx.beginPath()
    ctx.ellipse(0, 0, 26, 14, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = C.ink
    ctx.fillRect(20, -3, 36, 6)
    ctx.restore()
    // bow
    const bow = Math.sin(t * 5) * 18
    ctx.strokeStyle = C.ink
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(-30 + bow, shoulderY + 60)
    ctx.lineTo(40 + bow, shoulderY - 6)
    ctx.stroke()
  }

  // scarf
  if (scarf) {
    ctx.fillStyle = g(scarf)
    ctx.beginPath()
    ctx.ellipse(0, shoulderY + 4, 28, 12, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(10, shoulderY + 4, 14, 60)
  }

  // neck & head
  const headY = shoulderY - 38
  ctx.fillStyle = skin
  ctx.fillRect(-8, shoulderY - 16, 16, 20)
  ctx.beginPath()
  ctx.ellipse(0, headY, 30, 34, 0, 0, Math.PI * 2)
  ctx.fill()

  // hair
  ctx.fillStyle = hair
  ctx.beginPath()
  if (hairStyle === 'bun') {
    ctx.ellipse(-2, headY - 14, 32, 24, 0, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(-18, headY - 38, 15, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(-32, headY - 16, 12, 32)
  } else if (hairStyle === 'long') {
    ctx.ellipse(-2, headY - 12, 33, 26, 0, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(-33, headY - 14, 16, 70)
  } else {
    ctx.ellipse(-2, headY - 16, 32, 22, -0.1, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(-31, headY - 18, 10, 20)
  }

  // face (drawn on the facing side)
  ctx.strokeStyle = C.ink
  ctx.fillStyle = C.ink
  ctx.lineWidth = 3
  if (eyes === 'closed' || eyes === 'down') {
    ctx.beginPath()
    ctx.arc(14, headY + (eyes === 'down' ? 6 : 0), 5, 0.2, Math.PI - 0.2)
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.arc(14, headY - 2, 3.5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.beginPath()
  if (mouth === 'smile') ctx.arc(14, headY + 12, 7, 0.3, Math.PI - 0.3)
  else if (mouth === 'sad') ctx.arc(14, headY + 22, 7, Math.PI + 0.4, -0.4)
  else if (mouth === 'open') ctx.ellipse(16, headY + 16, 4, 6, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

export function mira(ctx, x, y, o = {}) {
  person(ctx, { ...MIRA, x, y, ...o })
}
export function arun(ctx, x, y, o = {}) {
  person(ctx, { ...ARUN, x, y, ...o })
}

// Floating musical note (Arun's colour follows his music around).
export function note(ctx, x, y, s = 1, color = C.arun, alpha = 1) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(x, y)
  ctx.scale(s, s)
  ctx.fillStyle = color
  ctx.strokeStyle = color
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.ellipse(0, 0, 11, 8, -0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(9, -3)
  ctx.lineTo(9, -40)
  ctx.quadraticCurveTo(22, -30, 24, -18)
  ctx.stroke()
  ctx.restore()
}

// Simple heart shape.
export function heart(ctx, x, y, s = 1, color = C.rose) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0, 10)
  ctx.bezierCurveTo(-26, -8, -12, -30, 0, -14)
  ctx.bezierCurveTo(12, -30, 26, -8, 0, 10)
  ctx.fill()
  ctx.restore()
}
