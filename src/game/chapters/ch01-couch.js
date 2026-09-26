// Chapter 1, page 7 · home, on the couch
// The day ends the way it started, by herself: supermarket sushi out of the
// tray in front of the curtains, still in the blue top she wore to work.
// Tap a piece to eat it; the bar from the call fills as the tray empties.
// The art is traced from the reference (ch01-couch-trace.js); this page only
// paints it, takes pieces away, and fills the bar.
import { W, tapHint, rng } from '../paint.js'
import { pop } from '../sound.js'
import { K, sheetTop } from './ch01-wake.js'
import { LAYERS, INK, INK_COLOR, FLOOR, PIECES } from './ch01-couch-trace.js'

const REF = 0.75 // reference pixels to sheet units
// the inside of the bar, measured on the reference
const BAR = { x: 186, y: 1571, w: 827, h: 65 }
const FILL = '#6fd2fb' // the call's bar colour

// Path2D objects are built the first time the page is shown.
let art = null
function paths() {
  art ??= {
    layers: LAYERS.map(([color, d]) => [color, new Path2D(d)]),
    ink: new Path2D(INK),
    pieces: PIECES.map((p) => new Path2D(p.region)),
  }
  return art
}

// Colour flat, then grain, then the ink over everything. Each colour is also
// stroked a hair wide so no paper shows between neighbours. The art is traced
// at half-pixel steps, hence the halving.
function paint(g) {
  const a = paths()
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, 1200, 2670)
  g.save()
  g.scale(0.5, 0.5)
  g.lineWidth = 3
  for (const [color, p] of a.layers) {
    g.fillStyle = color
    g.strokeStyle = color
    g.fill(p, 'evenodd')
    g.stroke(p)
  }
  grain(g)
  g.fillStyle = INK_COLOR
  g.fill(a.ink, 'evenodd')
  g.restore()
}

// The printed grain of the page: specks a shade darker and lighter than the
// paint, too fine to see one at a time.
function grain(g) {
  const r = rng(11)
  g.fillStyle = 'rgba(30,40,50,0.07)'
  for (let i = 0; i < 9000; i++) g.fillRect(r() * 2400, 154 + r() * 5186, 2 + r() * 3, 2 + r() * 2)
  g.fillStyle = 'rgba(255,255,255,0.08)'
  for (let i = 0; i < 6000; i++) g.fillRect(r() * 2400, 154 + r() * 5186, 2 + r() * 3, 2 + r() * 2)
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
