// Chapter 1, page 3 · the commute
// The camera pans on from the 08:02 clock into a packed train. Mira stands
// between two grey commuters with her headphones on, scrolling her phone.
// The panel below is her feed: tap the heart (or the share arrows) to like a
// post and scroll on; the bar fills with every post. Then the camera pans on
// to the clock: 08:58.
// The art is traced from the reference (ch01-commute-trace.js), down to the
// first post, a dog; this page paints it, scrolls the feed, and fills the bar.
import { W, tapHint, rng, easeInOut } from '../paint.js'
import { pop } from '../sound.js'
import { K, ink, shape, bigDisplay, border, sheetTop } from './ch01-wake.js'
import { LAYERS, BRUSH, INK, INK_COLOR } from './ch01-commute-trace.js'

const T = {
  bar: '#6fd2fb', // the call's bar colour
  pink: '#b190c9', // the traced post's lilac line
  pinkFill: '#dbbac3',
  green: '#a1e2ff',
}

const REF = 1.5 // reference pixels to sheet units (a half-size, 600 px wide screenshot)
// measured on the reference: the inside of the bar, the phone's screen, the
// first post's picture (its top is under the panel's border), the row of
// icons under it, and the two icons
const BAR = { x: 93, y: 676, w: 412, h: 32 }
const SCREEN = { x: 60, y: 756, w: 477, h: 401, r: 12 }
const PHOTO = { x: 98, y: 752, w: 400, h: 234 }
const ICONS = { y: 1000, h: 130 }
const HEART = { x: 403, y: 1064 }
const SHARE = { x: 192, y: 1065 }
const GAP = 420 // from one post to the next as the feed scrolls
const SOFT = 0.3 // edge blur, in reference pixels (the couch's 0.6 at half size)
const PAN = 1076 // the clock close-up sits this far to the left of the train
const POSTS = 6 // posts to like to fill the bar
const PANEL_X = 1076 // where the next clock close-up starts, to the right
const FROM = 8 * 60 + 2
const TO = 8 * 60 + 58
const TICK = 0.03

// Path2D objects are built the first time the page is shown.
let art = null
function paths() {
  art ??= {
    layers: LAYERS.map(([color, d]) => [color, new Path2D(d)]),
    brush: new Path2D(BRUSH[1]),
    ink: new Path2D(INK),
  }
  return art
}

// Colour flat, then grain, then the brush and pen over everything, as on the
// couch page. The art is traced at half-pixel steps, hence the halving.
function paint(g) {
  const a = paths()
  const tiles = grainTiles(g)
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
const GRAIN = 0.9
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

// Later posts are drawn in the traced post's lilac line over its pinkish brown and
// sky blue, inside a w x h box.
const L = (ctx, pts, w = 5) => ink(ctx, pts, w, T.pink)
function fillPink(ctx, pts, fill) {
  shape(ctx, pts, fill, T.pink, 5)
}

const POST_ART = [
  // two friends cheek to cheek, taking a selfie
  (ctx, w, h) => {
    ctx.fillStyle = T.green
    ctx.fillRect(0, h * 0.5, w, h)
    // her friend on the left: pink skin, short hair
    fillPink(ctx, [[60, 90], [170, 50], [280, 90], [290, 220], [240, 300], [140, 310], [70, 240]], T.pinkFill)
    fillPink(ctx, [[40, 110], [120, 20], [260, 10], [320, 80], [280, 110], [180, 80], [80, 150]], '#ffffff')
    L(ctx, [[130, 170], [150, 166]], 7)
    L(ctx, [[220, 170], [240, 166]], 7)
    fillPink(ctx, [[150, 230], [230, 226], [200, 262], [170, 262]], '#ffffff')
    // the other, white skin, long pink hair falling on her shoulders
    fillPink(ctx, [[300, 60], [430, 40], [560, 110], [590, 300], [540, 380], [500, 250], [320, 150]], T.pinkFill)
    fillPink(ctx, [[300, 110], [400, 80], [500, 120], [510, 250], [440, 320], [340, 300], [290, 200]], '#ffffff')
    L(ctx, [[360, 180], [380, 176]], 7)
    L(ctx, [[450, 180], [470, 176]], 7)
    fillPink(ctx, [[370, 240], [450, 236], [430, 262], [390, 262]], '#ffffff')
    // an arm around her shoulders, and a hand in front
    fillPink(ctx, [[0, 300], [140, 290], [300, 330], [300, 380], [120, 360], [0, 380]], '#ffffff')
    fillPink(ctx, [[180, 330], [250, 300], [290, 340], [260, 400], [180, 400]], '#ffffff')
    L(ctx, [[200, 340], [250, 330]])
    L(ctx, [[200, 362], [256, 352]])
  },
  // birthday cake
  (ctx, w, h) => {
    ctx.fillStyle = T.pinkFill
    ctx.fillRect(0, 0, w, h)
    fillPink(ctx, [[120, 220], [480, 220], [480, 380], [120, 380]], '#ffffff')
    fillPink(ctx, [[120, 220], [480, 220], [470, 270], [400, 250], [330, 280], [260, 250], [190, 280], [120, 260]], T.green)
    for (const x of [200, 300, 400]) {
      fillPink(ctx, [[x - 10, 150], [x + 10, 150], [x + 10, 220], [x - 10, 220]], '#ffffff')
      fillPink(ctx, [[x, 110], [x + 12, 136], [x, 148], [x - 12, 136]], T.pinkFill)
    }
    ctx.fillStyle = T.green
    ctx.fillRect(0, 380, w, 80)
  },
  // a dog in the park
  (ctx, w, h) => {
    ctx.fillStyle = T.green
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, 150)
    fillPink(ctx, [[160, 220], [400, 210], [440, 330], [380, 380], [180, 380], [140, 300]], '#ffffff')
    fillPink(ctx, [[360, 120], [470, 110], [510, 200], [460, 260], [370, 250], [340, 190]], '#ffffff')
    fillPink(ctx, [[350, 130], [380, 90], [400, 160]], T.pinkFill)
    fillPink(ctx, [[470, 120], [500, 80], [505, 160]], T.pinkFill)
    L(ctx, [[400, 170], [408, 172]], 9)
    L(ctx, [[450, 170], [458, 172]], 9)
    fillPink(ctx, [[418, 200], [440, 200], [430, 214]], T.pink)
    L(ctx, [[150, 260], [110, 220], [100, 180]], 7)
  },
  // beach and sun
  (ctx, w) => {
    ctx.fillStyle = T.pinkFill
    ctx.fillRect(0, 0, w, 250)
    ctx.fillStyle = T.green
    ctx.fillRect(0, 250, w, 100)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 350, w, 90)
    fillPink(ctx, [[260, 110], [340, 110], [360, 190], [300, 230], [240, 190]], '#ffffff')
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      L(ctx, [[300 + Math.cos(a) * 90, 170 + Math.sin(a) * 90], [300 + Math.cos(a) * 120, 170 + Math.sin(a) * 120]])
    }
    L(ctx, [[0, 250], [w, 250]])
    L(ctx, [[60, 300], [140, 296]])
    L(ctx, [[380, 310], [470, 306]])
    L(ctx, [[0, 350], [w, 350]])
  },
  // latte art
  (ctx, w, h) => {
    ctx.fillStyle = T.green
    ctx.fillRect(0, 0, w, h)
    fillPink(ctx, [[150, 90], [450, 90], [470, 250], [420, 380], [180, 380], [130, 250]], '#ffffff')
    fillPink(ctx, [[190, 120], [410, 120], [420, 230], [300, 280], [180, 230]], T.pinkFill)
    fillPink(ctx, [[300, 150], [340, 170], [340, 210], [300, 250], [260, 210], [260, 170]], '#ffffff')
    L(ctx, [[460, 180], [540, 190], [540, 280], [440, 300]], 7)
  },
  // a cat asleep in the sun
  (ctx, w, h) => {
    ctx.fillStyle = T.pinkFill
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 300, w, 140)
    fillPink(ctx, [[120, 260], [400, 220], [480, 290], [460, 360], [160, 380], [100, 320]], T.green)
    fillPink(ctx, [[380, 180], [480, 170], [510, 250], [470, 300], [390, 300], [360, 240]], T.green)
    fillPink(ctx, [[385, 190], [400, 140], [430, 180]], T.green)
    fillPink(ctx, [[460, 175], [490, 130], [500, 200]], T.green)
    L(ctx, [[405, 245], [425, 250]])
    L(ctx, [[455, 245], [475, 250]])
    L(ctx, [[120, 330], [60, 360], [40, 300]], 7)
  },
]

function heartPath(ctx, x, y, s) {
  ctx.beginPath()
  ctx.moveTo(x, y + 36 * s)
  ctx.bezierCurveTo(x - 60 * s, y - 4 * s, x - 36 * s, y - 50 * s, x, y - 22 * s)
  ctx.bezierCurveTo(x + 36 * s, y - 50 * s, x + 60 * s, y - 4 * s, x, y + 36 * s)
  ctx.closePath()
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
  ctx.fillStyle = T.bar
  ctx.fillRect(x, y, fx - x, h)
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(fx, y)
  ctx.lineTo(fx, y + h)
  ctx.stroke()
  ctx.restore()
}

// ---------- the page ----------

export default function commute(api) {
  const PAN_TIME = 1.4
  let index = 0 // which post is showing; post 0 is the traced one
  let likedAt = null // when the current post was liked (it then scrolls away)
  let liked = 0
  let doneAt = null
  let still = null // the traced art, painted once at screen resolution
  const top = () => sheetTop(api.height())
  const toRef = (x, y) => [x / 0.6 / REF, (y / 0.6 + top()) / REF]
  const toScreen = (x, y) => [x * REF * 0.6, (y * REF - top()) * 0.6]
  const panOut = (t) => (doneAt === null ? 0 : easeInOut((t - doneAt - 0.9) / 1.6) * PANEL_X)
  const tickStart = () => doneAt + 2.6
  const minuteAt = (t) => Math.min(TO, FROM + Math.max(0, Math.floor((t - tickStart()) / TICK)))
  const countDone = (t) => doneAt !== null && t > tickStart() + (TO - FROM) * TICK + 0.4
  const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}${String(m % 60).padStart(2, '0')}`
  const scrollAt = (t) => (likedAt === null ? 0 : easeInOut((t - likedAt - 0.35) / 0.45))

  // The traced art, painted once and copied in. The camera pans sideways, so
  // the copy is keyed on everything but the sideways offset and drawn at it;
  // painting takes too long to redo every frame of a pan.
  function stillArt(ctx) {
    const m = ctx.getTransform()
    const { width, height } = ctx.canvas
    const key = [width, height, m.a, m.d, m.f].join()
    if (still?.key !== key) {
      const c = document.createElement('canvas')
      c.width = width
      c.height = height
      const g = c.getContext('2d')
      g.setTransform(m.a, m.b, m.c, m.d, 0, m.f)
      paint(g)
      soften(c, SOFT * m.a)
      still = { key, canvas: c }
    }
    return still.canvas
  }

  // Copy rows y .. y + h of the screen from the traced art to dy further down,
  // in reference pixels; the screen's sides are inset past its border's soft rim.
  function copyRows(ctx, picture, y, h, dy) {
    const m = ctx.getTransform()
    const [sx, sy, sw, sh] = [(SCREEN.x + 3) * m.a, y * m.d + m.f, (SCREEN.w - 6) * m.a, h * m.d]
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.drawImage(picture, sx, sy, sw, sh, sx + m.e, sy + dy * m.d, sw, sh)
    ctx.restore()
  }

  // One post with its top at y: the traced first post, or a drawn one under
  // the traced row of icons. liked: when its heart was tapped, or null.
  function post(ctx, picture, i, y, liked, t) {
    const dy = y - PHOTO.y
    if (i === 0) copyRows(ctx, picture, SCREEN.y, ICONS.y + ICONS.h - SCREEN.y, dy)
    else {
      const { x, w, h } = PHOTO
      const k = w / 600 // the drawn posts are drawn 600 wide
      ctx.save()
      ctx.translate(x, y)
      ctx.beginPath()
      ctx.rect(0, 0, w, h)
      ctx.save()
      ctx.clip()
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      ctx.scale(k, k)
      POST_ART[(i - 1) % POST_ART.length](ctx, 600, h / k)
      ctx.restore()
      ctx.strokeStyle = T.pink
      ctx.lineWidth = 3
      ctx.strokeRect(0, 0, w, h)
      ctx.restore()
      copyRows(ctx, picture, ICONS.y, ICONS.h, dy)
    }
    if (liked !== null) {
      // the heart fills blue: multiplied, so its ink outline stays black
      const grow = 1 + 0.25 * Math.max(0, 1 - (t - liked) / 0.25)
      ctx.save()
      ctx.globalCompositeOperation = 'multiply'
      heartPath(ctx, HEART.x, HEART.y + dy, 0.72 * grow)
      ctx.fillStyle = T.bar
      ctx.fill()
      ctx.restore()
    }
  }

  return {
    tall: true,
    debug: () => ({ heart: toScreen(HEART.x, HEART.y), liked, done: doneAt !== null }),
    draw(ctx, t) {
      const h = api.height()
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, h)
      // once a liked post has scrolled away, the next one is current
      if (likedAt !== null && scrollAt(t) >= 1) {
        index += 1
        likedAt = null
      }
      const offset = (1 - easeInOut(t / PAN_TIME)) * PAN - panOut(t)
      ctx.save()
      ctx.scale(0.6, 0.6)
      ctx.translate(offset, -top())

      ctx.save()
      ctx.scale(REF, REF)
      const picture = stillArt(ctx)
      const m = ctx.getTransform()
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.drawImage(picture, m.e, 0)
      ctx.restore()
      // the feed, redrawn over the traced screen once it has moved on
      const scroll = scrollAt(t)
      if (index > 0 || likedAt !== null) {
        const { x, y, w, h: sh, r } = SCREEN
        ctx.save()
        ctx.beginPath()
        ctx.roundRect(x, y - r, w, sh + r, r)
        ctx.clip()
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(x, y, w, sh)
        for (const k of [0, 1]) {
          const py = PHOTO.y + (k - scroll) * GAP
          post(ctx, picture, index + k, py, k === 0 ? likedAt : null, t)
        }
        ctx.restore()
      }
      bar(ctx, liked / POSTS)
      ctx.restore()

      // the clock close-up to the right, which we pan to once she's done
      if (doneAt !== null) {
        const bottom = top() + h / 0.6
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(PANEL_X - 6, top(), 1000, bottom - top())
        border(ctx, PANEL_X - 15, top(), bottom)
        const mm = minuteAt(t)
        const tick = (t - tickStart()) / TICK
        ctx.save()
        ctx.translate(PANEL_X, 0)
        bigDisplay(ctx, hhmm(mm), mm < TO && tick > 0 ? 3 : -1, mm < TO && tick > 0 ? tick % 1 : 0)
        ctx.restore()
      }

      // the 08:02 clock we're panning away from, to the left
      if (offset > 0) {
        const bottom = top() + h / 0.6
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(-PAN - 40, top(), PAN + 30, bottom - top())
        border(ctx, -25, top(), bottom)
        ctx.save()
        ctx.translate(-PAN, 0)
        bigDisplay(ctx, '0802', -1, 0)
        ctx.restore()
      }
      ctx.restore()

      if (t > PAN_TIME + 1 && liked === 0 && likedAt === null) {
        const [x, y] = toScreen(HEART.x, HEART.y)
        tapHint(ctx, x, y, t, K.ink)
      }
      if (countDone(t)) tapHint(ctx, 50, 50, t)
    },
    down(x, y, t) {
      if (doneAt !== null) {
        if (countDone(t)) api.finish()
        return
      }
      if (t < PAN_TIME || likedAt !== null) return
      const [rx, ry] = toRef(x, y)
      const onHeart = Math.hypot(rx - HEART.x, ry - HEART.y) < 50
      const onShare = Math.hypot(rx - SHARE.x, ry - SHARE.y) < 50
      if (!onHeart && !onShare) return
      likedAt = t
      liked = Math.min(POSTS, liked + 1)
      pop(520 + liked * 40)
      if (liked >= POSTS) doneAt = t
    },
  }
}
