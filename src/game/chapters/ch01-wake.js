// Chapter 1, page 1 · 7:00
// Top-down view of Mira asleep, a torn label with her name, and a flip clock
// that turns to 7:00 and rings until it's tapped. Drawn on a 900 x 2000 phone
// sheet at 0.6 scale, in the cold grey-blue of her mornings. On a phone the whole
// sheet shows; on a shorter screen the top of the headboard is cropped.
// The bedroom is traced from two references, asleep at 7:00 (ch01-wake-trace.js)
// and rolled over at 7:15 (ch01-wake-awake-trace.js); the clock card, the name
// on the label and the end of the bed are drawn here.
import { W, UI_FONT, tapHint, rng, clamp, easeOut, easeInOut } from '../paint.js'
import { pop, alarmClock } from '../sound.js'
import * as ASLEEP from './ch01-wake-trace.js'
import * as ROLLED from './ch01-wake-awake-trace.js'
import * as CARD_ART from './ch01-wake-card-trace.js'

const SANS = "'Montserrat', 'Helvetica Neue', Arial, sans-serif"

export const K = {
  ink: '#141414',
  woodDark: '#5e6f80',
  woodLight: '#c3d2e1',
  woodGrain: '#44525f',
  woodGrainLight: '#95a8ba',
  sheet: '#485564',
  white: '#f1eff1',
  shade: '#7f8994',
  shadeDark: '#667787',
  grid: '#c5d4de',
  gridDark: '#55636f',
  hair: '#292121',
  hairDark: '#161111',
  clock: '#53a6ce',
  face: '#464746',
  cell: '#3a3a3a',
  digit: '#f4f4f4',
  tableTop: '#c4d5dc',
  tableFront: '#8b93a3',
  label: '#f2f0f2',
}

// Tapered ink stroke through points.
export function ink(ctx, pts, width = 6, color = K.ink) {
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  for (let i = 0; i < pts.length - 1; i++) {
    const k = i / (pts.length - 1)
    ctx.lineWidth = width * Math.sin(Math.PI * (0.15 + 0.7 * k)) + 0.8
    ctx.beginPath()
    ctx.moveTo(pts[i][0], pts[i][1])
    ctx.lineTo(pts[i + 1][0], pts[i + 1][1])
    ctx.stroke()
  }
}

// Smooth closed shape through points ([x, y] or [x, y, 's'] for a sharp corner);
// fills and/or strokes it in ink.
export function shape(ctx, pts, fill, stroke = K.ink, width = 6) {
  const n = pts.length
  const mid = (i) => [(pts[i][0] + pts[(i + 1) % n][0]) / 2, (pts[i][1] + pts[(i + 1) % n][1]) / 2]
  ctx.beginPath()
  const m0 = mid(n - 1)
  ctx.moveTo(m0[0], m0[1])
  for (let i = 0; i < n; i++) {
    const m = mid(i)
    // points marked 's' are sharp corners, e.g. the tips of locks of hair
    if (pts[i][2] === 's') {
      ctx.lineTo(pts[i][0], pts[i][1])
      ctx.lineTo(m[0], m[1])
    } else ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1])
  }
  ctx.closePath()
  if (fill) {
    ctx.fillStyle = fill
    ctx.fill()
  }
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = width
    ctx.lineJoin = 'round'
    ctx.stroke()
  }
}

const QUILT = [
  [-40, 1090], [80, 1060], [190, 1030], [330, 1004], [470, 990], [600, 968],
  [720, 990], [860, 1030], [960, 1052], [1016, 1080], [1042, 1140], [1048, 1400], [1046, 1900], [-40, 1900],
]

function headboard(ctx) {
  const r = rng(101)
  ctx.fillStyle = K.woodDark
  ctx.fillRect(-40, 0, 1046, 420)
  // diagonal band of morning light
  ctx.fillStyle = K.woodLight
  ctx.beginPath()
  ctx.moveTo(-40, 170)
  ctx.lineTo(1006, 369)
  ctx.lineTo(1006, 420)
  ctx.lineTo(-40, 420)
  ctx.closePath()
  ctx.fill()
  // wood grain
  for (let i = 0; i < 70; i++) {
    const x = r() * 1000 - 20
    const y = 70 + r() * 340
    const lit = y > 170 + ((x + 40) / 1000) * 190
    ctx.strokeStyle = lit ? K.woodGrainLight : K.woodGrain
    ctx.lineWidth = 2 + r() * 2
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + 40 + r() * 90, y + (r() - 0.5) * 4)
    ctx.stroke()
  }
}

function plaid(ctx, base, line) {
  ctx.fillStyle = base
  ctx.fillRect(-40, 900, 1110, 1000)
  ctx.strokeStyle = line
  ctx.lineWidth = 16
  for (let x = -20; x < 1070; x += 112) {
    ctx.beginPath()
    ctx.moveTo(x, 960)
    ctx.quadraticCurveTo(x + 18, 1300, x - 6, 1900)
    ctx.stroke()
  }
  for (let y = 1020; y < 1900; y += 96) {
    ctx.beginPath()
    ctx.moveTo(-40, y + 10)
    ctx.quadraticCurveTo(500, y - 20, 1070, y + 14)
    ctx.stroke()
  }
}

function quilt(ctx, pts = QUILT) {
  ctx.save()
  shape(ctx, pts, null, null)
  ctx.clip()
  plaid(ctx, K.white, K.grid)
  // the right side of the quilt is in shadow
  ctx.beginPath()
  ctx.moveTo(590, 960)
  ctx.quadraticCurveTo(640, 1150, 700, 1400)
  ctx.lineTo(760, 1900)
  ctx.lineTo(1070, 1900)
  ctx.lineTo(960, 960)
  ctx.closePath()
  ctx.clip()
  plaid(ctx, K.shadeDark, K.gridDark)
  ctx.restore()
  shape(ctx, pts, null)
  for (const s of [[[700, 1080], [760, 1110], [800, 1150]], [[730, 1180], [770, 1200], [800, 1240]]]) ink(ctx, s, 4)
}

// The bedroom picture ends in a torn edge below the name label; white below.
function tornBottom(ctx) {
  const r = rng(151)
  ctx.beginPath()
  ctx.moveTo(-40, 0)
  ctx.lineTo(1070, 0)
  for (let x = 1070; x >= -40; x -= 18) {
    const base = 1455 + ((x + 40) / 1000) * 110 // lower on the right
    ctx.lineTo(x, base + (r() - 0.5) * 22)
  }
  ctx.closePath()
}

const QUILT2 = [
  [-40, 1088], [100, 1062], [250, 1030], [430, 966], [560, 936], [640, 956], [760, 996],
  [899, 1030], [960, 1052], [1016, 1080], [1042, 1140], [1048, 1400], [1046, 1900], [-40, 1900],
]
// The end of the bed, just past the right edge of the screen: the mattress's
// rounded corner, the wooden side of the bed frame, and the wall behind it.
function bedEnd(ctx) {
  ctx.fillStyle = K.sheet
  ctx.fillRect(1006, 0, 70, 1900)
  ink(ctx, [[1006, 0], [1006, 600], [1006, 1090]], 7)
  // bed frame side
  ctx.fillStyle = K.woodDark
  ctx.fillRect(961, 424, 45, 666)
  const r = rng(181)
  ctx.strokeStyle = K.woodGrain
  for (let i = 0; i < 7; i++) {
    const x = 966 + r() * 36
    ctx.lineWidth = 2 + r() * 2
    ctx.beginPath()
    ctx.moveTo(x, 440 + r() * 40)
    ctx.lineTo(x + (r() - 0.5) * 4, 900 + r() * 180)
    ctx.stroke()
  }
  // mattress corner and edge
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 7
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(930, 420)
  ctx.arcTo(958, 420, 958, 460, 22)
  ctx.lineTo(958, 1080)
  ctx.stroke()
}

// Past the right edge of the traced picture, seen only as the camera pans on:
// the headboard, mattress and quilt carry on to the end of the bed.
function pastTheEdge(ctx, awakeK) {
  ctx.save()
  tornBottom(ctx)
  ctx.clip()
  ctx.beginPath()
  ctx.rect(899, 0, 200, 2000)
  ctx.clip()
  headboard(ctx)
  ctx.fillStyle = K.sheet
  ctx.fillRect(-40, 420, 996, 1500)
  ink(ctx, [[-40, 420], [930, 420]], 7)
  bedEnd(ctx)
  quilt(ctx, awakeK > 0.5 ? QUILT2 : QUILT)
  ctx.restore()
}

// ---------- the traced bedroom ----------

const REF = 0.75 // reference pixels to sheet units
const SOFT = 0.6 // edge blur, in reference pixels, as on the couch page
// the part of the picture that changes when she rolls over (what was traced of
// the second reference, inset from where its trace stops)
const ROLLED_AREA = [0, 424, 1200, 1314]
const traced = ({ LAYERS, BRUSH, INK, INK_COLOR }) => ({
  layers: LAYERS.map(([color, d]) => [color, new Path2D(d)]),
  brush: [BRUSH[0], new Path2D(BRUSH[1])],
  ink: new Path2D(INK),
  inkColor: INK_COLOR,
})
// Path2D objects are built the first time they're needed.
const art = {}
const paths = (name) => (art[name] ??= traced({ asleep: ASLEEP, rolled: ROLLED, card: CARD_ART }[name]))

// Colour flat, then grain, then the brush and pen over everything, as on the
// couch page. The art is traced at half-pixel steps, hence the halving.
function paint(g, a) {
  const tiles = grainTiles(g)
  g.save()
  g.scale(0.5, 0.5)
  let paper = null
  for (const [color, p] of a.layers) {
    g.fillStyle = color
    g.fill(p, 'evenodd')
    if (color === '#ffffff') paper = p
  }
  g.restore()
  // grain over the paint, then the white paper painted back clean
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


// The traced art for one state, painted at screen resolution with the
// transform in ctx, on a transparent canvas (so the rolled-over state can be
// laid over the asleep one). The camera pans sideways, so the copy is keyed on
// everything but the sideways offset and drawn at it: painting takes too long
// to redo every frame of a pan.
const stills = {}
function stillArt(ctx, name, m = ctx.getTransform()) {
  const { width, height } = ctx.canvas
  const key = [width, height, m.a, m.d, m.f].join()
  if (stills[name]?.key !== key) {
    const c = document.createElement('canvas')
    c.width = width
    c.height = height
    const g = c.getContext('2d')
    g.setTransform(m.a, m.b, m.c, m.d, 0, m.f)
    paint(g, paths(name))
    soften(c, SOFT * m.a)
    stills[name] = { key, canvas: c }
  }
  return stills[name].canvas
}

function bedScene(ctx, awakeK) {
  pastTheEdge(ctx, awakeK)
  ctx.save()
  ctx.scale(REF, REF)
  const x = ctx.getTransform().e
  const asleep = stillArt(ctx, 'asleep')
  const rolled = awakeK > 0 && stillArt(ctx, 'rolled')
  // she rolls over in the dark: the second picture fades in over the first,
  // where they differ
  ctx.beginPath()
  ctx.rect(...ROLLED_AREA)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.drawImage(asleep, x, 0)
  if (rolled) {
    ctx.clip()
    ctx.globalAlpha = awakeK
    ctx.drawImage(rolled, x, 0)
  }
  ctx.restore()
}

// Her name and age, on the traced torn paper label.
function nameLabel(ctx, alpha) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = K.ink
  ctx.font = `600 50px ${UI_FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('Mira Sen', 450, 1178)
  ctx.fillText('25 years old', 450, 1250)
  ctx.restore()
}

// The clock card, traced with its flaps blank, and the flap digits over it.
// measured on the reference: the card's outer edge, the four flaps (the first
// always blank), the split across them
const CARD_AREA = [60, 1752, 1090, 618]
const FLAPS = [340, 435, 563, 661.5] // middles
const FLAP = { y: 2097, w: 74, h: 136 }

// `base` is the page's transform before the card is moved (dropped, tilted,
// shaken); the traced card is painted once for it and copied in moved.
// `flip` runs 0..1 while the minute changes; the changing flaps fold over.
function clockCard(ctx, base, alpha, digits, flip, changing) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.scale(REF, REF)
  const at = base.scale(REF, REF)
  const card = stillArt(ctx, 'card', at)
  const here = ctx.getTransform()
  ctx.beginPath()
  ctx.rect(...CARD_AREA)
  ctx.clip()
  ctx.setTransform(here.multiply(at.inverse()))
  ctx.drawImage(card, at.e, 0)
  ctx.setTransform(here)
  FLAPS.forEach((x, i) => {
    if (digits[i] === ' ') return
    const folding = flip > 0 && flip < 1 && changing.includes(i)
    ctx.save()
    ctx.beginPath()
    ctx.rect(x - FLAP.w / 2, FLAP.y - FLAP.h / 2, FLAP.w, FLAP.h)
    ctx.clip()
    ctx.translate(x, FLAP.y)
    if (folding) ctx.scale(1, Math.abs(Math.cos(flip * Math.PI)))
    ctx.scale(DIGIT.narrow, 1)
    ctx.fillStyle = K.digit
    ctx.font = `600 ${DIGIT.size}px ${SANS}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(digits[i], 0, DIGIT.drop)
    ctx.restore()
    // the split in the flap, over the digit
    ctx.fillStyle = K.ink
    ctx.fillRect(x - FLAP.w / 2 + 2, FLAP.y - 2, FLAP.w - 4, 4)
  })
  ctx.restore()
}
// the flap digits, sized to the reference's: about 100 px tall, 50 wide
const DIGIT = { size: 150, narrow: 0.6, drop: 8 }

// Close-up of the clock's face: four split flaps, big, e.g. "07:28".
// Drawn in the close-up panel's own coordinates (same as the phone sheet).
export function bigDisplay(ctx, text, foldCell, fold) {
  ctx.save()
  ctx.lineJoin = 'round'
  ctx.fillStyle = '#484948'
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 12
  ctx.beginPath()
  ctx.roundRect(172, 900, 650, 255, 26)
  ctx.fill()
  ctx.stroke()
  const cells = [205, 350, 522, 667]
  cells.forEach((x, i) => {
    ctx.fillStyle = '#474847'
    ctx.strokeStyle = K.ink
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.rect(x, 922, 123, 210)
    ctx.fill()
    ctx.stroke()
    ctx.save()
    ctx.translate(x + 62, 1030)
    if (i === foldCell) ctx.scale(1, Math.abs(Math.cos(fold * Math.PI)))
    ctx.scale(0.8, 1) // the clock's digits are narrower than the font's
    ctx.fillStyle = '#f4f4f4'
    ctx.font = `700 172px ${SANS}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text[i], 0, 8)
    ctx.restore()
    ctx.strokeStyle = '#111111'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(x, 1028)
    ctx.lineTo(x + 123, 1028)
    ctx.stroke()
  })
  ctx.fillStyle = '#f4f4f4'
  for (const y of [1000, 1052]) {
    ctx.beginPath()
    ctx.arc(498, y, 11, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

// Heavy hand-drawn panel border, full height.
export function border(ctx, x, top, bottom) {
  const r = rng(191)
  ctx.fillStyle = K.ink
  ctx.beginPath()
  ctx.moveTo(x, top)
  for (let y = top; y <= bottom; y += 40) ctx.lineTo(x + (r() - 0.5) * 3, y)
  for (let y = bottom; y >= top; y -= 40) ctx.lineTo(x + 15 + (r() - 0.5) * 3, y)
  ctx.closePath()
  ctx.fill()
}

// Sheet rows 58..2000 are a phone screen; show from the top when there is room,
// otherwise crop the headboard so the clock panel (to row 1790) stays in view.
export const sheetTop = (height) => Math.max(58, 1790 - height / 0.6)

// 6:59 flips to 7:00 and the alarm rings. Tap it and the clock card drops out
// of the bottom of the page and everything goes black: she has snoozed. The
// lights come back with her rolled over, the card falls back into place, and it
// flips to 7:15 and rings again. Tap it again and the card drops, the page goes
// black, and she has drifted off: when the lights come back the camera pans past
// the end of the bed to a close-up of the clock, whose minutes tick on to 07:28.
// She's late. Tap to go on.
const PAN = 1000 // how far the camera travels, in sheet units
const PANEL_X = 1076 // where the close-up panel starts, in sheet units
const LATE = 28 // the minute she finally wakes at
const DROP = 0.55 // seconds for the card to fall out of the page
const DARK = [0.25, 0.65, 1.35, 1.85] // after a tap: going dark, dark, coming back, back
const RETURN = [1.55, 2.0] // after the snooze: the card falling back into place
const CARD = [455, 1546] // the middle of the clock card, which it tilts about as it falls

export default function wakeUp(api) {
  const FLIP_AT = 1.6
  let snoozedAt = null
  let stoppedAt = null
  let alarm = alarmClock()
  const toScreen = (y) => (y - sheetTop(api.height())) * 0.6
  const inClock = (y) => y > toScreen(CARD_AREA[1] * REF) && y < toScreen((CARD_AREA[1] + CARD_AREA[3]) * REF)
  // what the clock and Mira are doing at time t
  const state = (t) => {
    const first = clamp((t - FLIP_AT) / 0.35, 0, 1)
    if (snoozedAt === null) {
      return { digits: first < 0.5 ? ' 659' : ' 700', flip: first, changing: [1, 2, 3], ringing: first >= 1, awakeK: 0 }
    }
    // she rolls over in the dark; the second flip waits for the card to land
    const second = clamp((t - snoozedAt - RETURN[1] - 0.35) / 0.35, 0, 1)
    return {
      digits: second < 0.5 ? ' 700' : ' 715',
      flip: second,
      changing: [2, 3],
      ringing: second >= 1 && stoppedAt === null,
      awakeK: easeOut((t - snoozedAt - 0.7) / 0.5),
    }
  }
  // where the clock card is: [drop, tilt] in sheet units, or null once it's gone
  const card = (t) => {
    const tapped = stoppedAt ?? snoozedAt
    if (tapped === null) return [0, 0]
    const s = t - tapped
    if (s < DROP) {
      // falling faster and faster, tipping as it goes
      const k = s / DROP
      return [1500 * k * k, 0.12 * k * k]
    }
    if (stoppedAt !== null) return null
    const k = easeOut((s - RETURN[0]) / (RETURN[1] - RETURN[0]))
    return k > 0 ? [-1500 * (1 - k), 0] : null
  }
  // how black the page is, after the last tap
  const dark = (t) => {
    const tapped = stoppedAt ?? snoozedAt
    if (tapped === null) return 0
    const s = t - tapped
    if (s < DARK[1]) return clamp((s - DARK[0]) / (DARK[1] - DARK[0]), 0, 1)
    if (s < DARK[2]) return 1
    return 1 - clamp((s - DARK[2]) / (DARK[3] - DARK[2]), 0, 1)
  }
  // the pan and the minutes ticking on in the close-up, once the lights are back
  const panAt = (t) => (stoppedAt === null ? 0 : easeInOut((t - stoppedAt - DARK[3] - 0.25) / 1.4) * PAN)
  const countStart = () => stoppedAt + DARK[3] + 1.95
  const TICK = 0.16
  const minuteAt = (t) => Math.min(LATE, 15 + Math.max(0, Math.floor((t - countStart()) / TICK)))
  const countDone = (t) => stoppedAt !== null && t > countStart() + (LATE - 15) * TICK + 0.4

  return {
    tall: true,
    // test hook: where to tap to stop the alarm
    debug: () => ({ tap: [W / 2, toScreen(1560)] }),
    draw(ctx, t) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, api.height())
      const st = state(t)
      if (st.ringing) alarm.ring()
      const pan = panAt(t)
      ctx.save()
      ctx.scale(0.6, 0.6)
      ctx.translate(-pan, -sheetTop(api.height()))
      bedScene(ctx, st.awakeK)
      const at = card(t)
      if (at) {
        const base = ctx.getTransform()
        ctx.save()
        // it shakes while it rings
        if (st.ringing) ctx.translate(Math.sin(t * 70) * 5, 0)
        ctx.translate(CARD[0], CARD[1] + at[0])
        ctx.rotate(at[1])
        ctx.translate(-CARD[0], -CARD[1])
        clockCard(ctx, base, easeOut((t - 0.5) / 0.6), st.digits, st.flip, st.changing)
        ctx.restore()
      }
      nameLabel(ctx, easeOut((t - 0.9) / 0.6))
      if (stoppedAt !== null) {
        // the close-up panel to the right of the bedroom
        const top = sheetTop(api.height())
        const bottom = top + api.height() / 0.6
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(PANEL_X - 6, top, 1000, bottom - top)
        border(ctx, PANEL_X - 15, top, bottom)
        const m = minuteAt(t)
        const tick = (t - countStart()) / TICK
        const ticking = m < LATE && tick > 0
        ctx.translate(PAN, 0)
        bigDisplay(ctx, `07${String(m).padStart(2, '0')}`, ticking ? 3 : -1, ticking ? tick % 1 : 0)
      }
      ctx.restore()
      const black = dark(t)
      if (black > 0) {
        ctx.fillStyle = `rgba(0,0,0,${black})`
        ctx.fillRect(0, 0, W, api.height())
      }
      const ringSince = snoozedAt === null ? FLIP_AT : snoozedAt + RETURN[1] + 0.7
      if (st.ringing && t > ringSince + 2.5) tapHint(ctx, W / 2, toScreen(1400), t, K.ink)
      if (countDone(t)) tapHint(ctx, 50, 50, t)
    },
    down(x, y, t) {
      if (stoppedAt !== null) {
        if (countDone(t)) api.finish()
        return
      }
      if (!inClock(y) || !state(t).ringing) return
      alarm.stop()
      alarm = alarmClock()
      pop(300)
      if (snoozedAt === null) snoozedAt = t
      else stoppedAt = t
    },
  }
}
