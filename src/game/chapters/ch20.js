// Chapter 20 · Gallery — her first small exhibition. A walk past the whole story,
// her own first painting at the end of the room, and a song drifting in from the street.
import { vignette } from '../engine.js'
import {
  W, H, C, paper, wash, blob, line, text, caption, tapHint, windowFrame, plant, panel, label,
  mira, person, heart, note, rng, clamp, lerp, easeOut,
} from '../paint.js'
import { pop, tone, MELODY } from '../sound.js'

const fade = (t, t0) => easeOut((t - t0) / 0.5)
const WOOD = '#9a6a44'
const SUN = '#f2c14e'

// ---------- her painting ----------

// Made in chapter 19 and kept in api.memory.painting (an 880 x 1000 canvas).
// If the player skipped there, she painted this one instead.
let fallback = null
function herPainting(memory) {
  if (memory.painting) return memory.painting
  if (fallback) return fallback
  fallback = document.createElement('canvas')
  fallback.width = 880
  fallback.height = 1000
  const g = fallback.getContext('2d')
  g.scale(2, 2)
  g.fillStyle = '#fbf7ee'
  g.fillRect(0, 0, 440, 500)
  wash(g, 10, 10, 420, 260, C.sky, 2001, 0.7)
  blob(g, 320, 110, 50, 50, SUN, 2002, 0.9)
  wash(g, -20, 250, 480, 120, C.leaf, 2003, 0.8)
  wash(g, -20, 340, 480, 170, C.teal, 2004, 0.6)
  blob(g, 150, 300, 20, 60, C.mira, 2005)
  blob(g, 150, 228, 16, 16, C.skin1, 2006)
  for (let i = 0; i < 4; i++) blob(g, 250 + i * 40, 250 - i * 22, 12, 7, C.arun, 2007 + i, 0.8)
  return fallback
}

// ---------- the paintings on the wall (each drawn into a w x h box) ----------

const pieces = {
  // the grey train window, from before
  train(ctx, w, h) {
    wash(ctx, -10, -10, w + 20, h + 20, '#c9ccd1', 2010)
    for (let i = 0; i < 5; i++) wash(ctx, i * 42 - 6, 40 + (i % 3) * 18, 36, h, '#9da1a8', 2011 + i)
    ctx.strokeStyle = '#7e8288'
    ctx.lineWidth = 8
    ctx.strokeRect(10, 10, w - 20, h - 20)
    blob(ctx, w * 0.7, h * 0.7, 10, 18, C.mira, 2016, 0.8)
  },
  // the park bench, the dead phone, the first notes
  bench(ctx, w, h) {
    wash(ctx, -10, -10, w + 20, h + 20, '#e8c9a8', 2020)
    blob(ctx, w * 0.75, h * 0.2, 26, 26, SUN, 2021)
    for (let i = 0; i < 3; i++) blob(ctx, 30 + i * 80, h * 0.55, 50, 40, C.leaf, 2022 + i)
    wash(ctx, -10, h * 0.7, w + 20, h * 0.35, '#b9c98f', 2025)
    wash(ctx, 40, h * 0.66, w - 80, 14, WOOD, 2026)
    wash(ctx, 40, h * 0.74, w - 80, 10, WOOD, 2027)
    line(ctx, 54, h * 0.74, 50, h * 0.9, WOOD, 6, 2028)
    line(ctx, w - 54, h * 0.74, w - 50, h * 0.9, WOOD, 6, 2029)
    ctx.fillStyle = C.ink
    ctx.fillRect(w * 0.3, h * 0.66 - 6, 30, 8)
    note(ctx, w * 0.55, h * 0.4, 0.8)
    note(ctx, w * 0.72, h * 0.3, 0.6)
  },
  // two under one umbrella in the rain
  umbrella(ctx, w, h) {
    wash(ctx, -10, -10, w + 20, h + 20, '#7d9bb3', 2030)
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'
    ctx.lineWidth = 2
    const r = rng(2031)
    for (let i = 0; i < 30; i++) {
      const x = r() * w
      const y = r() * h
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x - 5, y + 16)
      ctx.stroke()
    }
    blob(ctx, w * 0.42, h * 0.72, 18, 50, C.mira, 2032)
    blob(ctx, w * 0.6, h * 0.72, 18, 54, '#50627a', 2033)
    blob(ctx, w * 0.42, h * 0.46, 13, 13, C.skin1, 2034)
    blob(ctx, w * 0.6, h * 0.44, 13, 13, C.skin2, 2035)
    ctx.fillStyle = C.arun
    ctx.beginPath()
    ctx.arc(w * 0.51, h * 0.4, 62, Math.PI, 0)
    ctx.fill()
    line(ctx, w * 0.51, h * 0.4, w * 0.51, h * 0.6, C.ink, 3, 2036)
  },
  // the shared shelf: mustard and rust side by side
  shelf(ctx, w, h) {
    wash(ctx, -10, -10, w + 20, h + 20, '#f3e3c8', 2040)
    for (const y of [h * 0.45, h * 0.88]) wash(ctx, 10, y, w - 20, 10, WOOD, 2041 + y)
    const books = [C.mira, C.arun, C.mira, C.teal, C.arun, C.mira]
    books.forEach((c, i) => wash(ctx, 24 + i * 20, h * 0.45 - 52 - (i % 2) * 8, 16, 52 + (i % 2) * 8, c, 2044 + i))
    plant(ctx, w * 0.75, h * 0.45, 0.8, C.leaf, 2050)
    blob(ctx, w * 0.3, h * 0.88 - 22, 24, 22, C.arun, 2051)
    wash(ctx, w * 0.55, h * 0.88 - 40, 40, 40, C.mira, 2052)
    heart(ctx, w * 0.8, h * 0.88 - 22, 0.8, C.rose)
  },
  // the violin
  violin(ctx, w, h) {
    wash(ctx, -10, -10, w + 20, h + 20, '#e7a58c', 2060)
    ctx.save()
    ctx.translate(w / 2, h * 0.58)
    ctx.rotate(-0.2)
    ctx.fillStyle = '#9a5a2c'
    ctx.beginPath()
    ctx.ellipse(0, 26, 42, 50, 0, 0, Math.PI * 2)
    ctx.ellipse(0, -44, 34, 40, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = C.ink
    ctx.fillRect(-5, -150, 10, 110)
    ctx.strokeStyle = C.cream
    ctx.lineWidth = 1
    for (const dx of [-3, 0, 3]) {
      ctx.beginPath()
      ctx.moveTo(dx, -150)
      ctx.lineTo(dx, 60)
      ctx.stroke()
    }
    ctx.lineWidth = 3
    ctx.strokeStyle = C.ink
    for (const dx of [-18, 18]) {
      ctx.beginPath()
      ctx.moveTo(dx, 0)
      ctx.quadraticCurveTo(dx + 6, 14, dx, 28)
      ctx.stroke()
    }
    ctx.restore()
    wash(ctx, 10, h - 40, w - 20, 24, C.arun, 2061, 0.8)
  },
  // a child's painting: sun, house, flowers
  child(ctx, w, h) {
    wash(ctx, -10, -10, w + 20, h + 20, '#fbf3df', 2070)
    blob(ctx, 40, 40, 26, 26, SUN, 2071)
    ctx.strokeStyle = SUN
    ctx.lineWidth = 4
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      line(ctx, 40 + Math.cos(a) * 32, 40 + Math.sin(a) * 32, 40 + Math.cos(a) * 44, 40 + Math.sin(a) * 44, SUN, 4, 2072 + i)
    }
    wash(ctx, 70, 100, 80, 60, C.rose, 2080)
    ctx.fillStyle = C.arun
    ctx.beginPath()
    ctx.moveTo(62, 104)
    ctx.lineTo(110, 60)
    ctx.lineTo(158, 104)
    ctx.fill()
    wash(ctx, -10, h - 36, w + 20, 46, C.leaf, 2081)
    for (let i = 0; i < 4; i++) blob(ctx, 20 + i * 50, h - 44, 8, 8, [C.plum, C.sky, C.mira, C.rose][i], 2082 + i)
  },
}

// World layout of the room (x is the centre of each painting).
const HANGING = [
  { x: 420, y: 200, w: 190, h: 150, draw: pieces.train },
  { x: 700, y: 150, w: 220, h: 250, draw: pieces.bench },
  { x: 980, y: 170, w: 190, h: 230, draw: pieces.umbrella },
  { x: 1260, y: 200, w: 240, h: 170, draw: pieces.shelf },
  { x: 1530, y: 140, w: 160, h: 260, draw: pieces.violin },
  { x: 1800, y: 190, w: 200, h: 190, draw: pieces.child },
]
const HERS = { x: 2130, y: 120, w: 290, h: 330 }
const MIRA_X = 170 // where Mira walks on screen
const END = HERS.x - 350 // scroll at which her painting is in front of her
const FLOOR = 640

const VISITORS = [
  { x: 520, top: C.teal, hair: C.miraHair, hairStyle: 'long', facing: 1 },
  { x: 600, top: SUN, hair: C.arunHair, skin: C.skin2, facing: -1 },
  { x: 1020, top: C.plum, hair: '#6e6a70', hairStyle: 'bun', facing: -1 },
  { x: 1180, top: C.rose, hair: C.arunHair, facing: 1, pose: 'sit', seat: true },
  { x: 1560, top: C.leaf, hair: C.miraHair, skin: C.skin2, hairStyle: 'long', facing: 1 },
  { x: 1630, top: C.sky, hair: C.arunHair, facing: -1, s: 0.45 },
  { x: 1860, top: C.arun, hair: '#b9b4ae', facing: -1 },
  { x: 2330, top: C.teal, hair: C.arunHair, skin: C.skin2, facing: -1 },
]

function frame(ctx, x, y, w, h, draw) {
  ctx.fillStyle = 'rgba(60,40,30,0.18)'
  ctx.fillRect(x - 6, y + 2, w + 24, h + 24)
  ctx.fillStyle = '#3b3230'
  ctx.fillRect(x - 12, y - 12, w + 24, h + 24)
  ctx.fillStyle = C.cream
  ctx.fillRect(x - 4, y - 4, w + 8, h + 8)
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.translate(x, y)
  draw(ctx, w, h)
  ctx.restore()
  // little plaque below
  ctx.fillStyle = C.cream
  ctx.fillRect(x + w / 2 - 26, y + h + 26, 52, 20)
  ctx.fillStyle = C.inkSoft
  ctx.fillRect(x + w / 2 - 18, y + h + 32, 36, 3)
  ctx.fillRect(x + w / 2 - 18, y + h + 38, 24, 3)
}

function spotlight(ctx, x, y, w, alpha = 0.22) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = '#fff3c4'
  ctx.beginPath()
  ctx.moveTo(x - 10, 64)
  ctx.lineTo(x + 10, 64)
  ctx.lineTo(x + w / 2 + 40, y + 380)
  ctx.lineTo(x - w / 2 - 40, y + 380)
  ctx.fill()
  ctx.restore()
  ctx.fillStyle = C.ink
  ctx.fillRect(x - 9, 50, 18, 16)
}

// The gallery room, scrolled so that world x = sx is at the left edge of the screen.
function room(ctx, sx, memory) {
  wash(ctx, -10, -10, W + 20, FLOOR + 20, '#f7f1e6', 2090)
  ctx.fillStyle = '#3b3230'
  ctx.fillRect(0, 44, W, 6)
  // floorboards scroll with the room
  wash(ctx, -10, FLOOR, W + 20, H - FLOOR + 10, '#c8a27a', 2091)
  ctx.strokeStyle = 'rgba(90,60,40,0.25)'
  ctx.lineWidth = 2
  for (let i = 0; i < 6; i++) {
    const y = FLOOR + 20 + i * i * 12
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(W, y)
    ctx.stroke()
  }
  for (let k = Math.floor(sx / 160); k < (sx + W) / 160 + 1; k++) {
    const x = k * 160 - sx
    ctx.beginPath()
    ctx.moveTo(x, FLOOR)
    ctx.lineTo(x + (x - W / 2) * 0.6, H)
    ctx.stroke()
  }
  wash(ctx, -10, FLOOR - 8, W + 20, 14, '#e2d6c2', 2092)
  // the doorway she came in through
  const dx = 60 - sx
  if (dx > -140) {
    wash(ctx, dx - 70, 260, 140, FLOOR - 260, '#e8c9a8', 2093)
    ctx.strokeStyle = C.ink
    ctx.lineWidth = 4
    ctx.strokeRect(dx - 70, 260, 140, FLOOR - 260)
  }
  for (const p of HANGING) {
    const x = p.x - sx
    if (x < -p.w || x > W + p.w) continue
    spotlight(ctx, x, p.y, p.w, 0.15)
    frame(ctx, x - p.w / 2, p.y, p.w, p.h, p.draw)
  }
  const hx = HERS.x - sx
  if (hx > -HERS.w && hx < W + HERS.w) {
    spotlight(ctx, hx, HERS.y, HERS.w, 0.3)
    const img = herPainting(memory)
    frame(ctx, hx - HERS.w / 2, HERS.y, HERS.w, HERS.h, (c, w, h) => c.drawImage(img, 0, 0, w, h))
  }
  // gallery bench
  const bx = 1180 - sx
  if (bx > -200 && bx < W + 200) {
    wash(ctx, bx - 90, 700, 180, 22, '#6b5a4e', 2094)
    line(ctx, bx - 76, 720, bx - 76, 760, '#6b5a4e', 8, 2095)
    line(ctx, bx + 76, 720, bx + 76, 760, '#6b5a4e', 8, 2096)
  }
}

function visitors(ctx, sx, t) {
  VISITORS.forEach((v, i) => {
    const x = v.x - sx
    if (x < -80 || x > W + 80) return
    person(ctx, {
      x, y: v.seat ? 716 : 770, s: v.s ?? 0.7, top: v.top, hair: v.hair, skin: v.skin ?? C.skin1,
      bottom: i % 2 ? '#4b5a78' : '#3b3a40', hairStyle: v.hairStyle ?? 'short',
      facing: v.facing, pose: v.pose ?? 'stand', t, mouth: i % 3 ? 'none' : 'smile',
    })
  })
}

// ---------- page 1: opening night ----------

function facade(ctx, w, h, t) {
  wash(ctx, -10, -10, w + 20, h + 20, '#35365a', 2030)
  for (let i = 0; i < 18; i++) {
    const r = rng(2100 + i)
    blob(ctx, r() * w, r() * 120, 2, 2, C.cream, 2100 + i, 0.5 + 0.4 * Math.sin(t * 2 + i))
  }
  wash(ctx, 20, 80, w - 40, 360, '#efe6d6', 2031)
  // big lit window with paintings inside
  wash(ctx, 50, 150, 250, 190, '#f7d9a0', 2032)
  const mini = [C.teal, C.rose, C.mira]
  mini.forEach((c, i) => {
    ctx.fillStyle = '#3b3230'
    ctx.fillRect(70 + i * 76, 180, 60, 70)
    wash(ctx, 76 + i * 76, 186, 48, 58, c, 2033 + i, 0.9)
  })
  person(ctx, { x: 110, y: 340, s: 0.36, top: C.plum, hair: C.arunHair, facing: 1 })
  person(ctx, { x: 240, y: 340, s: 0.36, top: C.leaf, hair: C.miraHair, hairStyle: 'long', facing: -1 })
  ctx.strokeStyle = '#3b3230'
  ctx.lineWidth = 6
  ctx.strokeRect(50, 150, 250, 190)
  // the door and her name above it
  wash(ctx, 340, 200, 120, 240, C.teal, 2036)
  blob(ctx, 440, 330, 6, 6, SUN, 2037)
  text(ctx, 'MIRA', 400, 118, { size: 46, color: C.ink })
  line(ctx, 344, 146, 456, 146, C.mira, 6, 2038)
  // warm light on the pavement
  wash(ctx, -10, 430, w + 20, h - 420, '#6d6570', 2039)
  blob(ctx, 175, 450, 150, 22, '#f7d9a0', 2040, 0.35)
  // visitors arriving
  person(ctx, { x: 470, y: 470, s: 0.55, top: C.rose, hair: C.arunHair, skin: C.skin2, pose: 'walk', t, facing: -1 })
  person(ctx, { x: 60, y: 474, s: 0.58, top: SUN, hair: '#6e6a70', hairStyle: 'bun', facing: 1 })
  mira(ctx, 270, 480, { s: 0.62, facing: 1 })
}

function nervous(ctx, w, h, t) {
  wash(ctx, -10, -10, w + 20, h + 20, '#f7d9a0', 2041)
  // her paintings on the wall behind her
  for (const [x, y, c, d] of [[300, 40, C.teal, C.mira], [410, 70, C.rose, C.leaf]]) {
    ctx.fillStyle = '#3b3230'
    ctx.fillRect(x - 6, y - 6, 92, 112)
    ctx.fillStyle = C.cream
    ctx.fillRect(x, y, 80, 100)
    wash(ctx, x + 6, y + 6, 68, 50, c, 2043 + x, 0.9)
    blob(ctx, x + 40, y + 76, 20, 16, d, 2044 + x, 0.9)
  }
  // close-up: a deep breath, then a small smile
  const calm = t > 2.6
  mira(ctx, 170, 770, { s: 2.3, eyes: calm ? 'open' : 'closed', mouth: calm ? 'smile' : 'none' })
  if (!calm) {
    ctx.strokeStyle = C.inkSoft
    ctx.lineWidth = 3
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.arc(250, 150, 20 + i * 12, -0.5, 0.5)
      ctx.stroke()
    }
  }
}

const opening = vignette((ctx, t) => {
  panel(ctx, 20, 20, W - 40, 500, (ctx, w, h) => facade(ctx, w, h, t))
  label(ctx, 'One year later', W / 2, 520, fade(t, 0.4))
  panel(ctx, 20, 570, W - 40, 220, (ctx, w, h) => nervous(ctx, w, h, t), { alpha: fade(t, 1.2) })
}, 'Her first exhibition. Her name on the door.', { wait: 1.4 })

// ---------- page 2: walk through the room ----------

const walk = (api) => {
  let sx = 0
  let vel = 0
  let dragging = false
  let lastX = 0
  let downX = 0
  let phase = 0
  let facing = 1
  let prev = 0
  let doneAt = null

  const scrollBy = (d) => {
    const before = sx
    sx = clamp(sx + d, 0, END)
    phase += Math.abs(sx - before) * 0.012
    if (sx !== before) facing = Math.sign(sx - before)
  }

  return {
    // test hook: how far along the room she is
    debug: () => ({ scroll: sx, end: END, done: doneAt !== null }),
    draw(ctx, t, dt) {
      if (!dragging && doneAt === null) {
        scrollBy(vel * dt)
        vel *= Math.exp(-dt * 3.5)
      }
      if (doneAt === null && sx >= END - 1) {
        doneAt = t
        facing = 1
        tone(MELODY[3], 0.9, { gain: 0.06 })
      }
      const moving = Math.abs(sx - prev) > 0.3
      prev = sx

      paper(ctx)
      room(ctx, sx, api.memory)
      visitors(ctx, sx, t)
      mira(ctx, MIRA_X, 810, {
        s: 0.85, pose: moving ? 'walk' : 'stand', t: phase, facing,
        mouth: doneAt !== null ? 'smile' : 'none',
      })

      if (doneAt === null) {
        text(ctx, 'drag to walk through the gallery', W / 2, 880, { size: 30, color: C.ink })
        if (!dragging && t > 0.6) {
          const k = (t * 0.6) % 1
          tapHint(ctx, lerp(440, 200, easeOut(k)), 480, t)
        }
      } else {
        caption(ctx, 'At the end of the room, the first one.', easeOut((t - doneAt - 0.3) / 0.6))
        if (t - doneAt > 0.8) tapHint(ctx, W - 50, 50, t)
      }
    },
    down(x, y, t) {
      if (doneAt !== null) {
        if (t - doneAt > 0.8) api.finish()
        return
      }
      dragging = true
      lastX = x
      downX = x
      vel = 0
    },
    move(x) {
      if (!dragging || doneAt !== null) return
      const d = (lastX - x) * 1.3
      lastX = x
      scrollBy(d)
      vel = lerp(vel, d * 60, 0.4)
    },
    up(x) {
      if (!dragging) return
      dragging = false
      // a plain tap takes a few steps that way
      if (Math.abs(x - downX) < 8) {
        vel = x > W / 2 ? 700 : -700
        pop(420)
      }
    },
  }
}

// ---------- page 3: a song from the street ----------

const song = (api) => {
  let played = 0
  const born = []
  return {
    draw(ctx, t) {
      // the melody drifts in, one note at a time
      while (played < MELODY.length && t > 0.8 + played * 0.55) {
        tone(MELODY[played], 0.9, { gain: 0.07 })
        born.push(t)
        played += 1
      }
      paper(ctx)
      const turn = t > 2.4
      panel(ctx, 20, 20, W - 40, 520, (ctx, w, h) => {
        wash(ctx, -10, -10, w + 20, h + 20, '#f7f1e6', 2050)
        wash(ctx, -10, 430, w + 20, 100, '#c8a27a', 2051)
        // the open window onto the street
        windowFrame(ctx, 360, 90, 150, 230, '#bfe0ea', 2052)
        wash(ctx, 366, 230, 60, 84, C.rose, 2053)
        wash(ctx, 432, 200, 70, 114, SUN, 2054)
        spotlight(ctx, 140, 80, 200, 0.25)
        const img = herPainting(api.memory)
        frame(ctx, 45, 90, 190, 216, (c, w2, h2) => c.drawImage(img, 0, 0, w2, h2))
        mira(ctx, 290, 510, {
          s: 0.9, facing: turn ? 1 : -1, eyes: t > 4 ? 'closed' : 'open', mouth: turn ? 'smile' : 'none',
        })
        born.forEach((b, i) => {
          const age = t - b
          const x = 430 - age * 45
          const y = 190 + Math.sin(age * 2 + i) * 22 - age * 26
          note(ctx, x, y, 0.8, C.arun, clamp(1 - (age - 2) / 1.2, 0, 1) * clamp(age * 3, 0, 1))
        })
      })
      label(ctx, 'From the street...', W / 2, 540, fade(t, 1.2))
      panel(ctx, 20, 590, W - 40, 200, (ctx, w, h) => {
        wash(ctx, -10, -10, w + 20, h + 20, '#f7e3c4', 2055)
        blob(ctx, 400, 60, 130, 90, '#fff3c4', 2056, 0.6)
        mira(ctx, 150, 735, { s: 2.2, eyes: 'closed', mouth: 'smile' })
        for (let i = 0; i < 3; i++) {
          note(ctx, 330 + i * 50, 120 - i * 26 + Math.sin(t * 2 + i) * 8, 0.9, C.arun)
        }
      }, { alpha: fade(t, 3.2) })
      if (t > 3.6) {
        caption(ctx, 'A song she knew by heart. She smiled.', easeOut((t - 3.6) / 0.6))
        tapHint(ctx, W - 50, 50, t)
      }
    },
    down(x, y, t) {
      if (t > 3.8) api.finish()
    },
  }
}

// ---------- page 4: the end ----------

const theEnd = (api) => {
  const r = rng(2060)
  const pal = [C.mira, C.arun, C.rose, C.leaf, C.teal, C.sky, C.plum, SUN]
  // a wreath of every colour of the story around the words
  const blooms = Array.from({ length: 28 }, (_, i) => {
    const ang = (i / 28) * Math.PI * 2 + (r() - 0.5) * 0.2
    const k = 0.95 + r() * 0.1
    return {
      x: W / 2 + Math.cos(ang) * 238 * k,
      y: 480 + Math.sin(ang) * 380 * k,
      rr: 28 + r() * 34,
      c: pal[i % pal.length],
      d: (i / 28) * 1.4,
      seed: 2061 + i,
    }
  })
  return {
    draw(ctx, t) {
      paper(ctx, C.cream)
      for (const b of blooms) {
        const k = easeOut((t - b.d) / 1.2)
        if (k > 0) blob(ctx, b.x, b.y, b.rr * k, b.rr * k * 0.85, b.c, b.seed, 0.75)
      }
      const a = easeOut((t - 0.8) / 1)
      text(ctx, 'The End', W / 2, 410, { size: 78, alpha: a })
      ctx.save()
      ctx.globalAlpha = a
      wash(ctx, W / 2 - 120, 460, 110, 12, C.mira, 2090)
      wash(ctx, W / 2 + 10, 462, 110, 12, C.arun, 2091)
      ctx.restore()
      heart(ctx, W / 2, 522, easeOut((t - 1.6) / 0.6) * 1.1, C.rose)
      text(ctx, 'thank you for playing', W / 2, 590, { size: 28, color: C.inkSoft, alpha: easeOut((t - 2) / 0.8) })
      if (t > 2.2) tapHint(ctx, W / 2, 680, t)
    },
    down(x, y, t) {
      if (t > 1.6) {
        tone(MELODY[0], 1.2, { gain: 0.06 })
        api.finish()
      }
    },
  }
}

export default {
  title: 'Gallery',
  pages: [opening, walk, song, theEnd],
}
