// Chapter 4 · Colours — a memory: nine years old, a picture, and a sensible mother.
import { vignette } from '../engine.js'
import {
  W, H, C, paper, wash, blob, line, text, caption, tapHint, panel, label, bubble, windowFrame,
  person, mira, MIRA, MOTHER, mix, dist, easeOut, lerp,
} from '../paint.js'
import { icons, SPEAKER } from '../bubblePuzzle.js'
import { pop, tone } from '../sound.js'

const GREY = 0.65
const CHILD = { ...MIRA, top: C.mira, bottom: '#6f8fb5' }
const POTS = ['#f2c14e', C.sky, C.leaf, C.rose, C.arun, '#9a6a44']

// A greyscale twin of a colour, for draining things.
function greyOf(hex) {
  const n = parseInt(hex.slice(1), 16)
  const l = Math.round(((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11)
  const g = Math.round(lerp(l, 185, 0.3)).toString(16).padStart(2, '0')
  return `#${g}${g}${g}`
}
const drained = (hex, k) => (k > 0 ? mix(hex, greyOf(hex), k) : hex)

// ---------- the picture: a house, a tree, a hill and a sun ----------
// Regions in sheet coordinates (420 x 440). `hint` is a point safely inside each.

const SHEET = { w: 420, h: 440 }
const REGIONS = [
  { id: 'sky', hint: [60, 60], path: (p) => p.rect(0, 0, 420, 440) },
  { id: 'sun', hint: [340, 80], path: (p) => p.arc(340, 80, 42, 0, Math.PI * 2) },
  {
    id: 'hill',
    hint: [200, 410],
    path: (p) => {
      p.moveTo(0, 350)
      p.quadraticCurveTo(210, 260, 420, 340)
      p.lineTo(420, 440)
      p.lineTo(0, 440)
      p.closePath()
    },
  },
  { id: 'trunk', hint: [327, 330], path: (p) => p.rect(315, 262, 24, 100) },
  { id: 'crown', hint: [327, 222], path: (p) => p.arc(327, 230, 52, 0, Math.PI * 2) },
  { id: 'wall', hint: [88, 262], path: (p) => p.rect(60, 220, 150, 150) },
  {
    id: 'roof',
    hint: [135, 195],
    path: (p) => {
      p.moveTo(42, 222)
      p.lineTo(135, 142)
      p.lineTo(228, 222)
      p.closePath()
    },
  },
  { id: 'door', hint: [135, 340], path: (p) => p.rect(115, 300, 40, 70) },
]
for (const r of REGIONS) {
  r.p = new Path2D()
  r.path(r.p)
}
const HIT_ORDER = ['door', 'sun', 'roof', 'wall', 'crown', 'trunk', 'hill', 'sky']
const byId = Object.fromEntries(REGIONS.map((r) => [r.id, r]))

// What the player painted, kept for the next page (defaults if they skipped).
const DEFAULT = {
  sky: C.sky, sun: '#f2c14e', hill: C.leaf, trunk: '#9a6a44',
  crown: C.leaf, wall: C.rose, roof: C.arun, door: '#9a6a44',
}
let painted = null

// Draw the picture at the current transform. fills: id -> { color, prev, at, x, y }
function picture(ctx, fills, t, drain = 0) {
  ctx.save()
  ctx.fillStyle = C.cream
  ctx.fillRect(0, 0, SHEET.w, SHEET.h)
  REGIONS.forEach((r, i) => {
    const f = fills[r.id]
    ctx.save()
    ctx.clip(r.p)
    ctx.fillStyle = C.cream
    ctx.fillRect(0, 0, SHEET.w, SHEET.h)
    if (f) {
      if (f.prev) wash(ctx, -10, -10, SHEET.w + 20, SHEET.h + 20, drained(f.prev, drain), 401 + i)
      const grow = f.at === undefined ? 1 : easeOut((t - f.at) / 0.5)
      ctx.beginPath()
      ctx.arc(f.x ?? 0, f.y ?? 0, grow * 600, 0, Math.PI * 2)
      ctx.clip()
      wash(ctx, -10, -10, SHEET.w + 20, SHEET.h + 20, drained(f.color, drain), 411 + i)
    }
    ctx.restore()
  })
  ctx.strokeStyle = C.ink
  ctx.lineWidth = 4
  ctx.lineJoin = 'round'
  for (const r of REGIONS) if (r.id !== 'sky') ctx.stroke(r.p)
  // sun rays, child-drawn
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2
    line(ctx, 340 + Math.cos(a) * 52, 80 + Math.sin(a) * 52, 340 + Math.cos(a) * 68, 80 + Math.sin(a) * 68, C.ink, 4, k)
  }
  ctx.restore()
}

const asFills = (colors) =>
  Object.fromEntries(Object.entries(colors).map(([id, color]) => [id, { color }]))

// ---------- pages ----------

function stool(ctx) {
  wash(ctx, 118, 318, 64, 16, '#8a5a3c', 419)
  line(ctx, 126, 330, 122, 390, '#8a5a3c', 7, 418)
  line(ctx, 174, 330, 178, 390, '#8a5a3c', 7, 417)
}

function childRoom(ctx, w, h, t) {
  wash(ctx, -10, -10, w + 20, h + 20, '#f1d9a6', 420)
  windowFrame(ctx, 280, 40, 140, 150, C.sky, 421)
  // her paintings pinned to the wall
  const pins = [[40, 50, C.rose], [120, 80, C.leaf], [60, 150, C.sky]]
  pins.forEach(([x, y, c], i) => {
    wash(ctx, x, y, 64, 52, C.cream, 422 + i)
    blob(ctx, x + 32, y + 28, 20, 14, c, 425 + i)
    blob(ctx, x + 32, y + 6, 4, 4, C.arun, 428 + i)
  })
  wash(ctx, -10, 300, w + 20, h - 290, '#d8a47a', 430) // floor
  blob(ctx, 230, 390, 190, 28, '#c46f6f', 431, 0.7) // rug
  stool(ctx)
  person(ctx, { ...CHILD, x: 150, y: 390, s: 0.6, pose: 'sit', eyes: 'down', mouth: 'smile', t })
  wash(ctx, 175, 300, 190, 22, '#b07a4f', 432) // little table
  line(ctx, 190, 320, 190, 392, '#8a5a3c', 8, 433)
  line(ctx, 350, 320, 350, 392, '#8a5a3c', 8, 434)
  wash(ctx, 230, 284, 90, 20, C.cream, 435)
  POTS.slice(0, 4).forEach((c, i) => blob(ctx, 330 - i * 16, 294, 8, 6, c, 436 + i))
}

const nine = vignette((ctx, t) => {
  panel(ctx, 40, 100, 460, 420, (c, w, h) => {
    childRoom(c, w, h, t)
    // the memory warms up out of the grey
    const k = 1 - easeOut((t - 0.2) / 1.4)
    if (k > 0) {
      c.fillStyle = C.greyLight
      c.globalAlpha = k * 0.85
      c.fillRect(0, 0, w, h)
      c.globalAlpha = 1
    }
  })
  label(ctx, 'nine years old', 340, 520)
  const a = easeOut((t - 1.4) / 0.6)
  if (a > 0) {
    panel(ctx, 40, 560, 460, 210, (c, w, h) => {
      wash(c, -10, -10, w + 20, h + 20, C.cream, 440)
      POTS.forEach((col, i) => blob(c, 60 + i * 60, 60 + (i % 2) * 70, 34, 26, col, 441 + i, 0.8))
      line(c, 250, 190, 380, 80, '#9a5a2c', 12, 447)
      blob(c, 385, 76, 10, 14, C.arun, 448)
      blob(c, 280, 185, 44, 34, C.skin1, 449)
    }, { alpha: a })
  }
}, 'Once, she was nine, and everything had a colour.')

const colouring = (api) => {
  const SX = 60
  const SY = 96
  const fills = {}
  painted = fills
  let pot = null
  let doneAt = null
  const potPos = (i) => [72 + i * 79, 640]
  const unfilled = () => REGIONS.filter((r) => !fills[r.id])
  const want = { sky: 1, sun: 0, hill: 2, trunk: 5, crown: 2, wall: 3, roof: 4, door: 5 }
  return {
    debug() {
      if (doneAt !== null) return null
      const r = unfilled()[0]
      if (pot !== want[r.id]) return { click: potPos(want[r.id]) }
      return { click: [SX + r.hint[0], SY + r.hint[1]] }
    },
    draw(ctx, t) {
      paper(ctx)
      wash(ctx, -10, -10, W + 20, H + 20, '#d8b48a', 450) // wooden table
      for (let k = 0; k < 5; k++) line(ctx, 0, 70 + k * 190, W, 60 + k * 190, '#c9a176', 3, 451 + k)
      wash(ctx, SX + 8, SY + 10, SHEET.w, SHEET.h, 'rgba(90,60,30,0.25)', 456)
      ctx.save()
      ctx.translate(SX, SY)
      picture(ctx, fills, t)
      ctx.restore()

      // paint pots; the brush rests in the chosen one
      POTS.forEach((c, i) => {
        const [x, y] = potPos(i)
        const up = pot === i ? -10 : 0
        blob(ctx, x, y + 12 + up, 32, 26, '#e9e4dc', 460 + i)
        blob(ctx, x, y + up, 26, 14, c, 470 + i)
        if (pot === i) line(ctx, x + 6, y + up - 4, x + 44, y + up - 96, '#9a5a2c', 7, 480)
      })
      // water jar, tinted by the last colour used
      const last = Object.values(fills).sort((a, b) => b.at - a.at)[0]
      wash(ctx, 400, 700, 70, 80, last ? mix('#dfe9ee', last.color, 0.35) : '#dfe9ee', 481, 0.8)
      blob(ctx, 120, 740, 40, 12, C.rose, 482, 0.5)
      blob(ctx, 200, 760, 18, 8, C.sky, 483, 0.5)

      if (doneAt === null) {
        const msg = pot === null ? 'pick a paint pot' : unfilled().length === REGIONS.length
          ? 'now tap the picture' : 'colour in every part'
        text(ctx, msg, W / 2, 50, { size: 30 })
        if (pot === null) tapHint(ctx, ...potPos(0), t)
        else {
          const r = unfilled()[0]
          tapHint(ctx, SX + r.hint[0], SY + r.hint[1], t)
        }
      } else {
        caption(ctx, 'She painted the sky whatever colour she liked.', easeOut((t - doneAt - 0.4) / 0.6))
        tapHint(ctx, 50, 50, t)
      }
    },
    down(x, y, t) {
      if (doneAt !== null) {
        if (t - doneAt > 0.8) api.finish()
        return
      }
      const i = POTS.findIndex((_, k) => dist(x, y, ...potPos(k)) < 38)
      if (i >= 0) {
        pot = i
        pop(380 + i * 40)
        return
      }
      if (pot === null) return
      const lx = x - SX
      const ly = y - SY
      if (lx < 0 || ly < 0 || lx > SHEET.w || ly > SHEET.h) return
      const ctx = document.createElement('canvas').getContext('2d')
      const id = HIT_ORDER.find((k) => ctx.isPointInPath(byId[k].p, lx, ly))
      const old = fills[id]
      if (old && old.color === POTS[pot]) return
      fills[id] = { color: POTS[pot], prev: old?.color, at: t, x: lx, y: ly }
      tone(330 + Object.keys(fills).length * 40, 0.4, { type: 'sine', gain: 0.06 })
      if (!unfilled().length) doneAt = t
    },
  }
}

// Her mother comes in. The picture's colours drain away.
const sensible = (api) => {
  const fills = painted && Object.keys(painted).length ? painted : asFills(DEFAULT)
  let skip = 0
  const END = 5.2
  return {
    draw(ctx, rt) {
      const t = rt + skip
      const drain = easeOut((t - 2.8) / 2)
      paper(ctx)
      panel(ctx, 40, 100, 460, 420, (c, w, h) => {
        childRoom(c, w, h, 0)
        const walk = easeOut(t / 1.2)
        person(c, {
          ...MOTHER, x: lerp(520, 380, walk), y: 400, s: 0.9, facing: -1,
          pose: walk < 1 ? 'walk' : 'stand', t, mouth: t > 1.2 ? 'sad' : 'none',
        })
        c.fillStyle = C.grey
        c.globalAlpha = drain * 0.55
        c.fillRect(0, 0, w, h)
        c.globalAlpha = 1
        // the child hears it: head down, no smile
        if (t > 1.6) {
          stool(c)
          person(c, { ...CHILD, x: 150, y: 390, s: 0.6, pose: 'sit', eyes: 'down', grey: drain * 0.6 })
        }
        const b = easeOut((t - 1.3) / 0.35)
        if (b > 0) {
          c.save()
          c.translate(250, 70)
          c.scale(b, b)
          bubble(c, -130, -40, 230, 96, SPEAKER.mom.fill, 'right')
          c.translate(-130, -40)
          c.scale(230 / 400, 96 / 150)
          icons.row(icons.money, icons.clock)(c, 400, 150)
          c.restore()
        }
      })
      label(ctx, 'one evening', 170, 520)
      const a = easeOut((t - 2.2) / 0.5)
      if (a > 0) {
        panel(ctx, 40, 560, 460, 210, (c, w) => {
          wash(c, -10, -10, w + 20, 230, drained('#d8b48a', drain), 490)
          c.save()
          c.translate(w / 2 - 105, 6)
          c.rotate(-0.03)
          c.scale(0.5, 0.45)
          picture(c, fills, 99, drain)
          c.restore()
        }, { alpha: a })
      }
      if (t > END - 0.4) {
        caption(ctx, 'So she put the paints away, and grew up sensible.', easeOut((t - END + 0.4) / 0.6))
        tapHint(ctx, 50, 50, t)
      }
    },
    down(x, y, rt) {
      const t = rt + skip
      if (t < END) skip = END - rt
      else api.finish()
    },
  }
}

const today = vignette((ctx, t) => {
  const fills = painted && Object.keys(painted).length ? painted : asFills(DEFAULT)
  panel(ctx, 40, 100, 460, 420, (c, w, h) => {
    wash(c, -10, -10, w + 20, h + 20, C.greyLight, 491)
    wash(c, 240, 30, 200, 250, '#a9a5a0', 492) // cubicle wall
    c.save()
    c.translate(300, 70)
    c.rotate(0.05)
    c.scale(0.2, 0.2)
    picture(c, fills, 99, 1)
    c.restore()
    blob(c, 342, 72, 5, 5, C.ink, 493)
    wash(c, -10, 300, w + 20, h - 290, '#b1ada8', 494)
    mira(c, 120, 400, { s: 0.75, pose: 'sit', eyes: 'down', grey: GREY })
    wash(c, 110, 305, 300, 100, '#a4a09b', 495) // desk
    line(c, 310, 290, 310, 320, C.ink, 10, 498)
    c.fillStyle = C.ink
    c.fillRect(250, 210, 120, 90)
    c.fillStyle = '#dfe1e2'
    c.fillRect(258, 218, 104, 74)
  })
  label(ctx, 'sixteen years later', 300, 520)
  const a = easeOut((t - 1.2) / 0.6)
  if (a > 0) {
    panel(ctx, 140, 560, 260, 210, (c, w, h) => {
      wash(c, -10, -10, w + 20, h + 20, '#a9a5a0', 496)
      c.save()
      c.translate(40, 22)
      c.rotate(0.05)
      c.scale(0.42, 0.38)
      picture(c, fills, 99, 1)
      c.restore()
      blob(c, 130, 28, 8, 8, C.ink, 497)
    }, { alpha: a })
  }
}, 'The colours never came back. She stopped looking for them.')

export default {
  title: 'Colours',
  pages: [nine, colouring, sensible, today],
}
