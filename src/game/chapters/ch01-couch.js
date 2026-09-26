// Chapter 1, page 7 · home, on the couch
// The day ends the way it started, by herself: supermarket sushi out of the
// tray in front of the curtains, still in the blue top she wore to work.
// Tap a piece to eat it; the bar from the call fills as the tray empties.
// The art is traced from the reference (ch01-couch-trace.js); this page only
// paints it, takes pieces away, and fills the bar.
import { W, tapHint, rng } from '../paint.js'
import { pop } from '../sound.js'
import { K, sheetTop } from './ch01-wake.js'
import { LAYERS, BRUSH, INK, INK_COLOR, FLOOR, PIECES } from './ch01-couch-trace.js'

const REF = 0.75 // reference pixels to sheet units
// the inside of the bar, measured on the reference
const BAR = { x: 186, y: 1571, w: 827, h: 65 }
const FILL = '#6fd2fb' // the call's bar colour
const SOFT = 0.6 // edge blur, in reference pixels, measured against the reference

// Path2D objects are built the first time the page is shown.
let art = null
function paths() {
  art ??= {
    layers: LAYERS.map(([color, d]) => [color, new Path2D(d)]),
    brush: new Path2D(BRUSH[1]),
    ink: new Path2D(INK),
    pieces: PIECES.map((p) => new Path2D(p.region)),
  }
  return art
}

// Colour flat, then grain, then the brush and pen over everything. The traced
// layers overlap their neighbours by half a pixel, so they need no seam
// filling. The art is traced at half-pixel steps, hence the halving.
function paint(g) {
  const a = paths()
  const tiles = grainTiles(g)
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, 1200, 2670)
  g.save()
  g.scale(0.5, 0.5)
  let paper = null
  for (const [color, p] of a.layers) {
    g.fillStyle = color
    g.fill(p, 'evenodd')
    if (color === '#ffffff') paper = p
  }
  g.restore()
  // grain over everything, then the white paper painted back clean: the paper
  // carries no grain, only paint does
  g.globalCompositeOperation = 'lighter'
  g.fillStyle = tiles.up
  g.fillRect(0, 0, 1200, 2670)
  g.globalCompositeOperation = 'difference'
  g.fillStyle = tiles.down
  g.fillRect(0, 0, 1200, 2670)
  g.globalCompositeOperation = 'source-over'
  g.save()
  g.scale(0.5, 0.5)
  if (paper) {
    g.fillStyle = '#ffffff'
    g.fill(paper, 'evenodd')
  }
  g.fillStyle = BRUSH[0]
  g.fill(a.brush, 'evenodd')
  g.fillStyle = INK_COLOR
  g.fill(a.ink, 'evenodd')
  g.restore()
}

// The print texture: grey grain a couple of pixels across, the same strength
// on every tone, matched to the reference at each scale once the page has been
// softened (see SOFT). It is split into the part that lightens, added with
// 'lighter', and the part that darkens, taken off with 'difference', which is
// an exact subtraction wherever the paint is brighter than the grain: all of it.
const GRAIN = 2.4
function grainTiles(g) {
  const N = 256
  const r = rng(11)
  const dots = new Float32Array(N * N)
  for (let i = 0; i < dots.length; i++) dots[i] = r() + r() + r() - 1.5
  // a wrapping 3 x 3 blur softens single-pixel dots into grain
  const n = new Float32Array(N * N)
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let sum = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) sum += dots[((y + dy + N) % N) * N + ((x + dx + N) % N)]
      }
      n[y * N + x] = sum / 9
    }
  }
  let sq = 0
  for (const v of n) sq += v * v
  const k = GRAIN / Math.sqrt(sq / n.length)
  const tile = (sign) => {
    const c = document.createElement('canvas')
    c.width = c.height = N
    const cx = c.getContext('2d')
    const img = cx.createImageData(N, N)
    const px = img.data
    for (let i = 0; i < n.length; i++) {
      const level = Math.max(0, Math.round(sign * n[i] * k))
      px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = level
      px[i * 4 + 3] = 255
    }
    cx.putImageData(img, 0, 0)
    return g.createPattern(c, 'repeat')
  }
  return { up: tile(1), down: tile(-1) }
}

// A small Gaussian blur: canvas filters round radii under about a pixel down
// to nothing, and not every browser has them. Instead, passes of the 3-tap
// kernel [a, 1 - 2a, a] across and then down, whose variances add up to the
// one asked for. Each pass is two copies of the picture shifted a pixel either
// way and laid over it: at alpha a / (1 - a) and then a, those blend to
// exactly the kernel's weights.
function soften(c, sigma) {
  const passes = Math.ceil((sigma * sigma) / 0.5)
  const a = (sigma * sigma) / (2 * passes)
  const copy = document.createElement('canvas')
  copy.width = c.width
  copy.height = c.height
  const k = copy.getContext('2d')
  const g = c.getContext('2d')
  g.save()
  g.setTransform(1, 0, 0, 1, 0, 0)
  for (let pass = 0; pass < passes; pass++) {
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      k.globalCompositeOperation = 'copy'
      k.drawImage(c, 0, 0)
      g.globalAlpha = a / (1 - a)
      g.drawImage(copy, -dx, -dy)
      g.globalAlpha = a
      g.drawImage(copy, dx, dy)
    }
  }
  g.restore()
}

// The same bar as the call, filling from the left with an ink edge.
function bar(ctx, p) {
  if (p <= 0) return
  const { x, y, w, h } = BAR
  const fx = x + (w - 26) * p + 26
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, h / 2)
  ctx.clip()
  ctx.fillStyle = FILL
  ctx.fillRect(x, y, fx - x, h)
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.moveTo(fx, y)
  ctx.lineTo(fx, y + h)
  ctx.stroke()
  ctx.restore()
}

// ---------- the page ----------

export default function couchSushi(api) {
  const eaten = []
  let doneAt = null
  let still = null // the traced art, painted once at screen resolution
  const probe = document.createElement('canvas').getContext('2d')
  const top = () => sheetTop(api.height())
  const toRef = (x, y) => [x / 0.6 / REF, (y / 0.6 + top()) / REF]
  const toScreen = (x, y) => [x * REF * 0.6, (y * REF - top()) * 0.6]

  // copy the traced art in, repainting it only when the screen changes size
  function stillArt(ctx) {
    const m = ctx.getTransform()
    const { width, height } = ctx.canvas
    const key = [width, height, m.a, m.d, m.e, m.f].join()
    if (still?.key !== key) {
      const c = document.createElement('canvas')
      c.width = width
      c.height = height
      const g = c.getContext('2d')
      g.setTransform(m)
      paint(g)
      // every edge in the reference is a little soft, as if its art had been
      // enlarged; the same blur here, measured against it, matches them
      soften(c, SOFT * m.a)
      still = { key, canvas: c }
    }
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.drawImage(still.canvas, 0, 0)
    ctx.restore()
  }

  return {
    tall: true,
    debug: () => ({
      eaten: eaten.length,
      done: doneAt !== null,
      pieces: PIECES.map((p) => toScreen(p.x, p.y)),
    }),
    draw(ctx, t) {
      const h = api.height()
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, h)
      ctx.save()
      ctx.scale(0.6, 0.6)
      ctx.translate(0, -top())
      ctx.scale(REF, REF)
      stillArt(ctx)
      // where pieces have been eaten the empty tray shows through, filled as one
      // shape so no seam shows where two of them met
      if (eaten.length) {
        const a = paths()
        const gone = new Path2D()
        for (const i of eaten) gone.addPath(a.pieces[i])
        ctx.fillStyle = FLOOR
        ctx.fill(gone)
      }
      bar(ctx, eaten.length / PIECES.length)
      ctx.restore()

      if (eaten.length === 0 && t > 1.6) {
        const [x, y] = toScreen(PIECES[0].x, PIECES[0].y)
        tapHint(ctx, x, y, t, K.ink)
      }
      // once the tray is empty there is nothing left to do but go to bed
      if (doneAt !== null && t > doneAt + 0.8) tapHint(ctx, 50, 50, t)
    },
    down(x, y, t) {
      if (doneAt !== null) {
        if (t > doneAt + 0.8) api.finish()
        return
      }
      const [rx, ry] = toRef(x, y)
      const a = paths()
      const hit = PIECES.findIndex((_, i) => !eaten.includes(i) && probe.isPointInPath(a.pieces[i], rx, ry))
      if (hit < 0) return
      eaten.push(hit)
      pop(460 + eaten.length * 40)
      if (eaten.length >= PIECES.length) doneAt = t
    },
  }
}
