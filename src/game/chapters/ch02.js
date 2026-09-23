// Chapter 2 · Commute — the grey train, a feed of identical posts, her stop.
import { vignette } from '../engine.js'
import {
  W, H, C, wash, blob, line, text, caption, tapHint, panel, label, phone, heart,
  person, mira, rng, clamp, dist, easeOut,
} from '../paint.js'
import { pop } from '../sound.js'

const GREY = 0.65 // Act I: Mira is mostly drained of colour

// Commuters: all slightly different, all the same grey.
const CROWD = [
  { hair: '#4a464c', top: '#8f8b86', bottom: '#5f5b58', hairStyle: 'short' },
  { hair: '#5a5550', top: '#a19d97', bottom: '#6d6965', hairStyle: 'long' },
  { hair: '#3f3b40', top: '#7f7b78', bottom: '#56524f', hairStyle: 'short' },
  { hair: '#66615c', top: '#9a958f', bottom: '#63605c', hairStyle: 'bun' },
]

// Grey skyline sliding past; `off` is how far the train has travelled.
function city(ctx, x, y, w, h, off, seed) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  wash(ctx, x - 10, y - 10, w + 20, h + 20, '#d3d4d4', seed)
  const layers = [
    { speed: 0.35, color: '#b4b3b1', min: 0.35, max: 0.8, bw: 60 },
    { speed: 1, color: '#9b9895', min: 0.2, max: 0.6, bw: 80 },
  ]
  layers.forEach((L, li) => {
    const r = rng(seed + li)
    const blocks = []
    let bx = 0
    while (bx < 720) {
      const bw = L.bw * (0.6 + r() * 0.8)
      blocks.push({ x: bx, w: bw, h: h * (L.min + r() * (L.max - L.min)) })
      bx += bw + 6
    }
    const shift = (off * L.speed) % bx
    for (const b of blocks) {
      for (const rep of [0, bx]) {
        const px = x + b.x + rep - shift
        if (px > x + w || px + b.w < x) continue
        ctx.fillStyle = L.color
        ctx.globalAlpha = 0.85
        ctx.fillRect(px, y + h - b.h, b.w, b.h)
        if (li === 1) {
          // lit windows, all dim
          ctx.fillStyle = '#c9c7c3'
          for (let wy = y + h - b.h + 12; wy < y + h - 10; wy += 22) {
            for (let wx = px + 10; wx < px + b.w - 14; wx += 18) ctx.fillRect(wx, wy, 8, 10)
          }
        }
      }
    }
  })
  ctx.restore()
}

// A seated commuter looking down at a phone.
function rider(ctx, x, y, s, look, grey, facing = 1) {
  person(ctx, { ...look, x, y, s, pose: 'sit', eyes: 'down', grey, facing })
  handPhone(ctx, x, y, s, facing)
}

function handPhone(ctx, x, y, s, facing = 1) {
  ctx.save()
  ctx.translate(x + facing * 44 * s, y - 150 * s)
  ctx.rotate(facing * 0.3)
  ctx.fillStyle = C.ink
  ctx.fillRect(-9 * s, -16 * s, 18 * s, 30 * s)
  ctx.fillStyle = '#e4e6e8'
  ctx.fillRect(-6 * s, -12 * s, 12 * s, 22 * s)
  ctx.restore()
}

function carriage(ctx, w, h, t) {
  wash(ctx, -10, -10, w + 20, h + 20, C.greyLight, 201)
  city(ctx, 20, 30, w - 40, 150, t * 140, 202)
  ctx.save()
  ctx.strokeStyle = C.paperDark
  ctx.lineWidth = 12
  ctx.strokeRect(20, 30, w - 40, 150)
  for (const px of [w / 3, (w * 2) / 3]) line(ctx, px, 30, px, 180, C.paperDark, 12, px)
  ctx.restore()
  wash(ctx, -10, 210, w + 20, 90, '#a9a5a0', 203)
  wash(ctx, -10, 290, w + 20, 34, '#96928d', 204)
  wash(ctx, -10, 330, w + 20, 80, C.greyDark, 205)
  line(ctx, w / 2 + 10, 0, w / 2 + 10, h, '#8f8a85', 8, 206)
  rider(ctx, 55, 360, 0.62, CROWD[0], 0.2)
  rider(ctx, 160, 360, 0.62, CROWD[1], 0.2)
  rider(ctx, 400, 360, 0.62, CROWD[2], 0.2, -1)
  mira(ctx, 290, 360, { s: 0.62, pose: 'sit', eyes: 'down', grey: GREY })
  handPhone(ctx, 290, 360, 0.62)
}

const train = vignette((ctx, t) => {
  panel(ctx, 40, 100, 460, 390, (c, w, h) => carriage(c, w, h, t))
  label(ctx, '7:42 am', 160, 490)
  const a = easeOut((t - 1) / 0.6)
  if (a > 0) {
    panel(ctx, 190, 540, 310, 230, (c, w, h) => {
      wash(c, -10, -10, w + 20, h + 20, '#c9c6c2', 207)
      city(c, 0, 20, w, 90, t * 140, 208)
      blob(c, 190, 150, 110, 90, '#eef0f2', 209, 0.35) // phone glow on her face
      mira(c, 110, 575, { s: 1.8, eyes: 'down', grey: GREY })
      c.save()
      c.translate(250, 200)
      c.rotate(0.25)
      phone(c, -30, -50, 60, 100, '#e4e6e8')
      c.restore()
    }, { alpha: a })
  }
}, 'The 7:42. Same seat, same faces, same grey.')

// ---------- the feed ----------

const SCREEN = { x: 128, y: 196, w: 284, h: 548 }
const POST = 262
const NEEDED = 8

function post(ctx, liked, pulse) {
  wash(ctx, 4, 4, SCREEN.w - 8, POST - 12, '#eceae6', 210)
  blob(ctx, 28, 26, 14, 14, C.grey, 211)
  ctx.fillStyle = C.greyLight
  ctx.fillRect(50, 18, 90, 9)
  ctx.fillRect(50, 32, 60, 7)
  // the same photo, every time: grey hills, grey sun
  ctx.save()
  ctx.beginPath()
  ctx.rect(12, 48, SCREEN.w - 24, 160)
  ctx.clip()
  wash(ctx, 6, 42, SCREEN.w - 12, 172, '#c9c8c5', 212)
  blob(ctx, 190, 100, 26, 26, '#e2e0dc', 213)
  blob(ctx, 80, 220, 140, 60, '#a3a09c', 214)
  blob(ctx, 220, 230, 130, 55, '#8f8c88', 215)
  ctx.restore()
  const k = 1 + pulse * 0.4
  if (liked) heart(ctx, 34, 232, 0.9 * k, 'rgb(190,150,150)')
  else {
    heart(ctx, 34, 232, 0.9, C.greyDark)
    heart(ctx, 34, 231, 0.62, '#eceae6')
  }
  ctx.fillStyle = C.greyLight
  ctx.fillRect(66, 226, 120, 9)
}

const feed = (api) => {
  let scroll = 0
  let vel = 0
  let press = null
  let doneAt = null
  const liked = new Map() // post index -> time liked
  const heartAt = (k) => [SCREEN.x + 34, SCREEN.y + k * POST - scroll + 226]
  const visibleUnliked = () => {
    for (let k = 0; k < 40; k++) {
      const [hx, hy] = heartAt(k)
      if (!liked.has(k) && hy > SCREEN.y + 30 && hy < SCREEN.y + SCREEN.h - 30) return [k, hx, hy]
    }
    return null
  }
  return {
    debug() {
      if (doneAt !== null) return null
      const v = visibleUnliked()
      if (v) return { click: [v[1], v[2]] }
      return { drag: [270, 650, 270, 380], wait: 300 }
    },
    draw(ctx, t, dt) {
      if (!press) {
        scroll = Math.max(0, scroll + vel * dt)
        vel *= Math.pow(0.04, dt)
      }
      wash(ctx, -10, -10, W + 20, H + 20, '#c4c0bb', 216)
      city(ctx, 0, 90, W, 190, t * 140, 217)
      ctx.save()
      ctx.strokeStyle = C.paperDark
      ctx.lineWidth = 14
      ctx.strokeRect(-10, 90, W + 20, 190)
      ctx.restore()
      // her mustard sleeves, washed out, reaching up to the phone
      ctx.save()
      ctx.strokeStyle = '#b9ab8f'
      ctx.lineCap = 'round'
      ctx.lineWidth = 110
      ctx.beginPath()
      ctx.moveTo(10, 1040)
      ctx.lineTo(90, 720)
      ctx.moveTo(530, 1040)
      ctx.lineTo(450, 720)
      ctx.stroke()
      ctx.restore()
      phone(ctx, SCREEN.x - 8, SCREEN.y - 16, SCREEN.w + 16, SCREEN.h + 32, '#f2f1ee')
      ctx.save()
      ctx.beginPath()
      ctx.rect(SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h)
      ctx.clip()
      const first = Math.floor(scroll / POST)
      for (let k = first; k < first + 4; k++) {
        ctx.save()
        ctx.translate(SCREEN.x, SCREEN.y + k * POST - scroll)
        const p = liked.has(k) ? Math.max(0, 1 - (t - liked.get(k)) / 0.25) : 0
        post(ctx, liked.has(k), p)
        ctx.restore()
      }
      ctx.restore()
      // thumbs
      blob(ctx, 118, 700, 30, 46, C.skin1, 220)
      blob(ctx, 422, 700, 30, 46, C.skin1, 221)

      // likes so far
      for (let i = 0; i < NEEDED; i++) {
        heart(ctx, W / 2 - 122 + i * 35, 792, 0.55, i < liked.size ? 'rgb(190,150,150)' : C.greyDark)
      }
      if (doneAt === null) {
        text(ctx, 'scroll up and like the posts', W / 2, 40, { size: 30, color: C.ink })
        const v = visibleUnliked()
        if (v && !press) tapHint(ctx, v[1], v[2], t)
      } else {
        caption(ctx, 'Like. Scroll. Like. None of it feels like anything.', easeOut((t - doneAt) / 0.6))
        tapHint(ctx, 50, 50, t)
      }
    },
    down(x, y, t) {
      if (doneAt !== null) {
        if (t - doneAt > 0.6) api.finish()
        return
      }
      press = { x, y, s0: scroll, ly: y, lt: t, moved: false }
      vel = 0
    },
    move(x, y, t) {
      if (!press) return
      if (Math.abs(y - press.y) > 10) press.moved = true
      if (press.moved) {
        scroll = Math.max(0, press.s0 - (y - press.y))
        const d = t - press.lt
        if (d > 0) vel = (press.ly - y) / d
        press.ly = y
        press.lt = t
      }
    },
    up(x, y, t) {
      if (!press) return
      const wasTap = !press.moved
      press = null
      vel = clamp(vel, -1500, 1500)
      if (!wasTap || doneAt !== null) return
      for (let k = Math.floor(scroll / POST); k < Math.floor(scroll / POST) + 4; k++) {
        const [hx, hy] = heartAt(k)
        if (!liked.has(k) && dist(x, y, hx, hy) < 40 && hy > SCREEN.y && hy < SCREEN.y + SCREEN.h) {
          liked.set(k, t)
          pop(500 + liked.size * 30)
          if (liked.size >= NEEDED) doneAt = t
          return
        }
      }
    },
  }
}

// ---------- her stop ----------

function platform(ctx, w, h, t) {
  wash(ctx, -10, -10, w + 20, h + 20, '#d6d5d3', 230)
  city(ctx, 0, 20, w, 120, 0, 231)
  wash(ctx, -10, 118, w + 20, 142, '#a7a4a0', 232) // the train
  line(ctx, 0, 124, w, 124, '#8e8a86', 6, 249)
  line(ctx, 0, 222, w, 222, '#bdbab6', 5, 250)
  for (const wx of [20, 90, 320, 390]) {
    wash(ctx, wx, 144, 56, 44, '#c9cccf', 233 + wx)
    ctx.strokeStyle = C.inkSoft
    ctx.lineWidth = 3
    ctx.strokeRect(wx, 144, 56, 44)
  }
  // the doors slide open onto a dark carriage
  const open = easeOut((t - 0.3) / 0.8) * 40
  ctx.fillStyle = '#5f5b58'
  ctx.fillRect(180, 138, 100, 118)
  wash(ctx, 180 - open, 138, 50, 118, '#8f8b87', 237)
  wash(ctx, 230 + open, 138, 50, 118, '#8f8b87', 238)
  ctx.strokeStyle = C.ink
  ctx.lineWidth = 3
  ctx.strokeRect(180, 138, 100, 118)
  wash(ctx, -10, 255, w + 20, 60, C.greyDark, 239)
  line(ctx, 0, 262, w, 262, '#d8d3cc', 5, 240)
  // station sign with nothing worth reading on it
  wash(ctx, 330, 40, 110, 36, '#6f6b67', 241)
  ctx.fillStyle = C.greyLight
  ctx.fillRect(348, 54, 74, 8)
}

function crowdWalk(ctx, w, h, t) {
  wash(ctx, -10, -10, w + 20, h + 20, '#cfcdca', 242)
  for (let i = 0; i < 5; i++) {
    const bh = 120 + ((i * 53) % 90)
    wash(ctx, 250 + i * 50, 200 - bh, 46, bh + 20, i % 2 ? '#a5a29e' : '#b3b0ac', 243 + i)
  }
  wash(ctx, -10, 200, w + 20, h - 190, '#b2aea9', 248)
  const drift = t * 18
  const walkers = [
    [30, CROWD[0], 0.55, 0], [140, CROWD[1], 0.6, 0.8], [360, CROWD[2], 0.58, 1.9],
    [440, CROWD[3], 0.52, 2.6],
  ]
  for (const [x, look, s, ph] of walkers) {
    person(ctx, { ...look, x: x + drift, y: 300, s, pose: 'walk', t: t + ph, eyes: 'down', grey: 0.2 })
  }
  mira(ctx, 250 + drift, 312, { s: 0.62, pose: 'walk', t: t + 0.4, eyes: 'down', grey: GREY })
}

const stop = vignette((ctx, t) => {
  panel(ctx, 40, 100, 460, 320, (c, w, h) => platform(c, w, h, t))
  label(ctx, 'her stop', 380, 420)
  const a = easeOut((t - 1.1) / 0.6)
  if (a > 0) panel(ctx, 40, 460, 460, 320, (c, w, h) => crowdWalk(c, w, h, t), { alpha: a })
}, 'The doors open. The crowd carries her along.')

export default {
  title: 'Commute',
  pages: [train, feed, stop],
}
