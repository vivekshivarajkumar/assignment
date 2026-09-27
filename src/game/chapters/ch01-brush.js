// Chapter 1, page 2 · brushing teeth
// The camera pans on from the 07:28 clock into the bathroom at night. Mira
// brushes her teeth, half asleep; drag the toothbrush in the panel below side
// to side to fill the bar. Then the camera pans on to the clock: 08:02.
// The art is traced from the reference (ch01-brush-trace.js); this page only
// paints it, slides the panel's toothbrush with the player's drag, and fills
// the bar. On a desktop screen it follows the wake page's desktop layout
// (measured there, no desktop screenshot of this page yet): the scene fills a
// square framed panel, the toothbrush card at 0.521 hangs over its bottom edge.
import { tapHint, rng, clamp, easeInOut } from '../paint.js'
import { pop } from '../sound.js'
import { K, bigDisplay, border, sheetTop, DESK, DESK_STEP, DESK_GRAIN, deskCloseUp } from './ch01-wake.js'
import * as TRACE from './ch01-brush-trace.js'
import * as NO_BAR from './ch01-brush-desk-trace.js'

const REF = 1.5 // reference pixels to sheet units (a half-size, 600 px wide screenshot)
// measured on the reference: the inside of the bar, and the inside of the
// toothbrush panel's border
const BAR = { x: 93, y: 786, w: 412, h: 32 }
const PANEL = { x: 34, y: 903, w: 530, h: 257 }
const GRIP = [420, 1045] // on the toothbrush's handle, where the hint shows
const REACH = 60 // how far the toothbrush slides either way, in reference pixels
const FILL = '#6fd2fb' // the call's bar colour
const SOFT = 0.3 // edge blur, in reference pixels (the couch's 0.6 at half size)
const PAN = 1076 // the clock close-up sits this far to the left of the bathroom
const STROKES = 12 // side-to-side strokes to finish
const PANEL_X = 1076 // where the next clock close-up starts, to the right
// once she's done, the clock ticks from 07:28 to 08:02 while she gets ready
const FROM = 7 * 60 + 28
const TO = 8 * 60 + 2
const TICK = 0.045

// Path2D objects are built the first time they're needed: the picture, and
// for a desktop screen a patch of the room where the phone's bar was.
const art = {}
function paths(name = 'picture') {
  const { LAYERS, BRUSH, INK, INK_COLOR } = name === 'picture' ? TRACE : NO_BAR
  art[name] ??= {
    layers: LAYERS.map(([color, d]) => [color, new Path2D(d)]),
    brush: [BRUSH[0], new Path2D(BRUSH[1])],
    ink: new Path2D(INK),
    inkColor: INK_COLOR,
  }
  return art[name]
}

// Colour flat, then grain, then the brush and pen over everything, as on the
// couch page. The art is traced at half-pixel steps, hence the halving.
function paint(g, grain = GRAIN, a = paths()) {
  const tiles = grainTiles(g, grain)
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, 600, 1335)
  g.save()
  g.scale(0.5, 0.5)
  let paper = null
  for (const [color, p] of a.layers) {
    g.fillStyle = color
    g.fill(p, 'evenodd')
    if (color === '#ffffff') paper = p
  }
  g.restore()
  // grain over everything, then the white paper painted back clean
  g.globalCompositeOperation = 'lighter'
  g.fillStyle = tiles.up
  g.fillRect(0, 0, 600, 1335)
  g.globalCompositeOperation = 'difference'
  g.fillStyle = tiles.down
  g.fillRect(0, 0, 600, 1335)
  g.globalCompositeOperation = 'source-over'
  g.save()
  g.scale(0.5, 0.5)
  if (paper) {
    g.fillStyle = '#ffffff'
    g.fill(paper, 'evenodd')
  }
  g.fillStyle = a.brush[0]
  g.fill(a.brush[1], 'evenodd')
  g.fillStyle = a.inkColor
  g.fill(a.ink, 'evenodd')
  g.restore()
}

// The print texture: grey grain a couple of pixels across, the same strength
// on every tone, matched to the reference at each scale once the page has been
// softened (see SOFT). It is split into the part that lightens, added with
// 'lighter', and the part that darkens, taken off with 'difference', which is
// an exact subtraction wherever the paint is brighter than the grain: all of it.
const GRAIN = 0.9
function grainTiles(g, grain) {
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
  const k = grain / Math.sqrt(sq / n.length)
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
  const fx = x + (w - 13) * p + 13
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, h / 2)
  ctx.clip()
  ctx.fillStyle = FILL
  ctx.fillRect(x, y, fx - x, h)
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(fx, y)
  ctx.lineTo(fx, y + h)
  ctx.stroke()
  ctx.restore()
}

// ---------- on a desktop screen ----------
// In the wake page's desktop reference pixels (2000 x 1124). No desktop
// screenshot of this page yet, so the scene fills the panel's width instead of
// showing more at the sides as the wake page's does.
const DESK_FRAME = [504, 54, 997, 1008] // outer edge; the ink is 11 thick
const DESK_INNER = [515, 65, 975, 986]
// the scene: 975 / 600 of the reference, from its row 290 down, so the bar sits under her chin as on the phone
const DESK_SCENE = { x: 515, y: 65, scale: 975 / 600, from: 290 }
// the toothbrush card, border and all (reference 28..572 x 897..1166), and the
// bar's ring above it, at 0.521 of the phone's size, centred and hanging over
// the panel's bottom edge as the wake page's clock card does
const CARD_BOX = [28, 897, 544, 269]
const RING = [72, 770, 450, 60, 30]
const NO_BAR_AREA = [40, 768, 520, 64] // what the patch replaces
const DESK_CARD = { x: 719, y: 820, scale: 1.042 }

// ---------- the page ----------

export default function brushTeeth(api) {
  const PAN_TIME = 1.4
  let dx = 0 // how far the panel's toothbrush has slid, in reference pixels
  let dragging = null
  let lastDir = 0
  let travel = 0
  let strokes = 0
  let doneAt = null
  const stills = {} // the traced art, painted once at screen resolution per placement
  const top = () => sheetTop(api.height())
  const toRef = (x, y) => [x / 0.6 / REF, (y / 0.6 + top()) / REF]
  const toScreen = (x, y) => [x * REF * 0.6, (y * REF - top()) * 0.6]
  const panned = (t) => easeInOut(t / PAN_TIME)
  // after the last stroke: pause, pan right to the clock, tick on to 08:02
  const panOut = (t) => (doneAt === null ? 0 : easeInOut((t - doneAt - 0.7) / 1.4) * PANEL_X)
  const tickStart = () => doneAt + 2.3
  const minuteAt = (t) => Math.min(TO, FROM + Math.max(0, Math.floor((t - tickStart()) / TICK)))
  const countDone = (t) => doneAt !== null && t > tickStart() + (TO - FROM) * TICK + 0.4
  const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}${String(m % 60).padStart(2, '0')}`

  // The traced art, painted once and copied in. The camera pans sideways, so
  // the copy is keyed on everything but the sideways offset and drawn at it;
  // painting takes too long to redo every frame of a pan. `name` keeps one
  // copy per placement (the desktop scene and card are placed differently).
  function stillArt(ctx, name = 'phone', grain = GRAIN, a = paths()) {
    const m = ctx.getTransform()
    const { width, height } = ctx.canvas
    const key = [width, height, m.a, m.d, m.f].join()
    if (stills[name]?.key !== key) {
      const c = document.createElement('canvas')
      // wide enough for the whole picture, which can run past the screen's edge
      c.width = Math.max(width, Math.ceil(600 * m.a))
      c.height = height
      const g = c.getContext('2d')
      g.setTransform(m.a, m.b, m.c, m.d, 0, m.f)
      paint(g, grain, a)
      soften(c, SOFT * m.a)
      stills[name] = { key, canvas: c }
    }
    return stills[name].canvas
  }
  const copyIn = (ctx, picture) => {
    const m = ctx.getTransform()
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.drawImage(picture, m.e, 0)
    ctx.restore()
  }
  // the panel's toothbrush follows the drag: the panel's inside, which is only
  // the toothbrush on white, is copied again shifted (only the inside, so the
  // border and the room beside it don't slide in with it)
  function slide(ctx, picture) {
    if (dx === 0) return
    const m = ctx.getTransform()
    const { x, y, w, h: ph } = PANEL
    ctx.save()
    ctx.beginPath()
    ctx.rect(x, y, w, ph)
    ctx.clip()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x, y, w, ph)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    // inset past the border's soft inner rim, so it isn't copied either
    const [sx, sy, sw, sh] = [(x + 3) * m.a, (y + 3) * m.d + m.f, (w - 6) * m.a, (ph - 6) * m.d]
    ctx.drawImage(picture, sx, sy, sw, sh, sx + m.e + dx * m.a, sy, sw, sh)
    ctx.restore()
  }

  // on a desktop screen: the reference window fitted to the real one
  const fit = () => {
    const k = Math.min(api.height() / DESK.h, api.width() / 1200)
    return { k, x: (api.width() - DESK.w * k) / 2, y: (api.height() - DESK.h * k) / 2 }
  }
  // the card's placement, from reference pixels to desktop reference pixels
  const cardAt = (x, y) => [DESK_CARD.x + (x - CARD_BOX[0]) * DESK_CARD.scale, DESK_CARD.y + (y - CARD_BOX[1]) * DESK_CARD.scale]
  const deskToScreen = ([x, y]) => {
    const f = fit()
    return [f.x + x * f.k, f.y + y * f.k]
  }

  function drawDesk(ctx, t) {
    const f = fit()
    const offset = (1 - panned(t)) * PAN - panOut(t)
    ctx.save()
    ctx.translate(f.x, f.y)
    ctx.scale(f.k, f.k)
    ctx.translate((offset / PAN) * DESK_STEP, 0)
    // the scene in its framed panel
    ctx.save()
    ctx.beginPath()
    ctx.rect(...DESK_INNER)
    ctx.clip()
    ctx.translate(DESK_SCENE.x, DESK_SCENE.y)
    ctx.scale(DESK_SCENE.scale, DESK_SCENE.scale)
    ctx.translate(0, -DESK_SCENE.from)
    copyIn(ctx, stillArt(ctx, 'desk-scene', DESK_GRAIN))
    ctx.beginPath()
    ctx.rect(...NO_BAR_AREA)
    ctx.clip()
    copyIn(ctx, stillArt(ctx, 'desk-no-bar', DESK_GRAIN, paths('no-bar')))
    ctx.restore()
    ctx.strokeStyle = K.ink
    ctx.lineWidth = 11
    ctx.strokeRect(DESK_FRAME[0] + 5.5, DESK_FRAME[1] + 5.5, DESK_FRAME[2] - 11, DESK_FRAME[3] - 11)
    // the card and the bar's ring, copied from the traced art at the card's size
    ctx.save()
    ctx.translate(DESK_CARD.x, DESK_CARD.y)
    ctx.scale(DESK_CARD.scale, DESK_CARD.scale)
    ctx.translate(-CARD_BOX[0], -CARD_BOX[1])
    const card = stillArt(ctx, 'desk-card', DESK_GRAIN)
    ctx.save()
    ctx.beginPath()
    ctx.rect(...CARD_BOX)
    ctx.roundRect(...RING)
    ctx.clip()
    copyIn(ctx, card)
    ctx.restore()
    slide(ctx, card)
    bar(ctx, strokes / STROKES)
    ctx.restore()
    // the clock close-ups either side
    if (offset > 0) deskCloseUp(ctx, '0728', -1, 0, -DESK_STEP)
    if (doneAt !== null) {
      const m = minuteAt(t)
      const tick = (t - tickStart()) / TICK
      deskCloseUp(ctx, hhmm(m), m < TO && tick > 0 ? 3 : -1, m < TO && tick > 0 ? tick % 1 : 0)
    }
    ctx.restore()
    if (t > PAN_TIME && strokes === 0 && !dragging) tapHint(ctx, ...deskToScreen(cardAt(GRIP[0] + dx, GRIP[1])), t, K.ink)
    if (countDone(t)) tapHint(ctx, 50, 50, t)
  }

  return {
    tall: true,
    wide: true, // it has a desktop layout
    debug: () => ({
      from: api.wide() ? deskToScreen(cardAt(GRIP[0] + dx, GRIP[1])) : toScreen(GRIP[0] + dx, GRIP[1]),
      strokes,
      done: doneAt !== null,
    }),
    draw(ctx, t) {
      const h = api.height()
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, api.width(), h)
      if (api.wide()) {
        drawDesk(ctx, t)
        return
      }
      const offset = (1 - panned(t)) * PAN - panOut(t)
      ctx.save()
      ctx.scale(0.6, 0.6)
      ctx.translate(offset, -top())

      ctx.save()
      ctx.scale(REF, REF)
      const picture = stillArt(ctx)
      copyIn(ctx, picture)
      slide(ctx, picture)
      bar(ctx, strokes / STROKES)
      ctx.restore()

      if (doneAt !== null) {
        // the clock close-up to the right, which we pan to once she's done
        const bottom = top() + h / 0.6
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(PANEL_X - 6, top(), 1000, bottom - top())
        border(ctx, PANEL_X - 15, top(), bottom)
        const m = minuteAt(t)
        const tick = (t - tickStart()) / TICK
        ctx.save()
        ctx.translate(PANEL_X, 0)
        bigDisplay(ctx, hhmm(m), m < TO && tick > 0 ? 3 : -1, m < TO && tick > 0 ? tick % 1 : 0)
        ctx.restore()
      }
      if (offset > 0) {
        // the clock close-up we're panning away from, to the left
        const bottom = top() + h / 0.6
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(-PAN - 40, top(), PAN + 30, bottom - top())
        border(ctx, -25, top(), bottom)
        ctx.save()
        ctx.translate(-PAN, 0)
        bigDisplay(ctx, '0728', -1, 0)
        ctx.restore()
      }
      ctx.restore()

      if (t > PAN_TIME && strokes === 0 && !dragging) {
        const [x, y] = toScreen(GRIP[0] + dx, GRIP[1])
        tapHint(ctx, x, y, t, K.ink)
      }
      if (countDone(t)) tapHint(ctx, 50, 50, t)
    },
    down(x, y, t) {
      if (doneAt !== null) {
        if (countDone(t)) api.finish()
        return
      }
      if (t < PAN_TIME) return
      if (api.wide()) {
        const f = fit()
        const [a, b] = cardAt(PANEL.x, PANEL.y)
        const [c, d] = cardAt(PANEL.x + PANEL.w, PANEL.y + PANEL.h)
        const [rx, ry] = [(x - f.x) / f.k, (y - f.y) / f.k]
        if (rx > a && rx < c && ry > b && ry < d) dragging = { x }
        return
      }
      const [, ry] = toRef(x, y)
      if (ry > PANEL.y && ry < PANEL.y + PANEL.h) dragging = { x }
    },
    move(x, y, t) {
      if (!dragging || doneAt !== null) return
      // follow the finger's movement since the last event, so the brush never sticks at an end
      const perRef = api.wide() ? fit().k * DESK_CARD.scale : 0.6 * REF // screen units per reference pixel
      const next = clamp(dx + (x - dragging.x) / perRef, -REACH, REACH)
      dragging.x = x
      const d = next - dx
      if (d !== 0) {
        // a stroke counts when the brush turns back after travelling far enough
        const dir = Math.sign(d)
        if (dir === lastDir) travel += Math.abs(d)
        else {
          if (travel > 40) {
            strokes = Math.min(STROKES, strokes + 1)
            pop(220 + strokes * 25)
            if (strokes >= STROKES) doneAt = t
          }
          lastDir = dir
          travel = Math.abs(d)
        }
      }
      dx = next
    },
    up() {
      dragging = null
    },
  }
}
