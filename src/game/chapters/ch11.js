// Chapter 11 · A Gift — her birthday. Rust paper, a tin of paints, and a pencil
// sketch waiting for colour. She hasn't held a brush since she was nine.
import { vignette } from '../engine.js'
import {
  W, C, paper, wash, blob, line, text, caption, tapHint, windowFrame, plant, roundRect,
  panel, label, heart, mira, arun, rng, clamp, easeOut, lerp,
} from '../paint.js'
import { pop, tone } from '../sound.js'

const PANS = [C.mira, '#f2c14e', C.arun, C.rose, C.plum, C.sky, C.teal, C.leaf, '#7a5a3a', '#d9826f', '#9dbf8c', C.night]

function livingRoom(ctx) {
  wash(ctx, 0, 0, W, 720, '#f1dcc0', 1101)
  windowFrame(ctx, 340, 150, 150, 190, '#f0b98c', 1102)
  wash(ctx, 0, 700, W, 260, '#c79a6b', 1103)
  // birthday bunting on a sagging string
  ctx.save()
  ctx.strokeStyle = C.inkSoft
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, 60)
  ctx.quadraticCurveTo(W / 2, 130, W, 60)
  ctx.stroke()
  const cols = [C.rose, C.teal, C.mira, C.sky, C.arun, C.leaf]
  for (let i = 0; i < 9; i++) {
    const k = (30 + i * 60) / W
    const y = 60 + 140 * k * (1 - k)
    ctx.fillStyle = cols[i % cols.length]
    ctx.beginPath()
    ctx.moveTo(k * W - 18, y)
    ctx.lineTo(k * W + 18, y)
    ctx.lineTo(k * W, y + 38)
    ctx.fill()
  }
  ctx.restore()
}

// Open tin of watercolour pans, centred on (x, y).
function paintSet(ctx, x, y, s = 1) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  ctx.fillStyle = '#3b4a5c'
  roundRect(ctx, -150, -80, 300, 160, 16)
  ctx.fill()
  ctx.fillStyle = C.cream
  roundRect(ctx, -140, -70, 280, 140, 10)
  ctx.fill()
  for (let i = 0; i < 12; i++) {
    const px = -128 + (i % 6) * 43
    const py = -60 + Math.floor(i / 6) * 64
    ctx.fillStyle = '#ffffff'
    roundRect(ctx, px, py, 36, 54, 6)
    ctx.fill()
    blob(ctx, px + 18, py + 27, 13, 19, PANS[i], 1110 + i)
  }
  ctx.restore()
}

function brush(ctx, x, y, tip, angle = -0.8) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  line(ctx, 18, 0, 120, 0, '#9a5a2c', 8, 1)
  ctx.fillStyle = '#b9b4ae'
  ctx.fillRect(4, -5, 16, 10)
  blob(ctx, 0, 0, 10, 6, tip, 1119)
  ctx.restore()
}

const party = vignette((ctx, t) => {
  panel(ctx, 30, 100, 480, 420, (ctx) => {
    ctx.translate(-30, -40)
    livingRoom(ctx)
    plant(ctx, 470, 470, 1.2, C.leaf, 1104)
    // little table with the cake
    wash(ctx, 205, 380, 130, 16, '#9a6a44', 1105)
    wash(ctx, 215, 390, 10, 90, '#8a5a3a', 1106)
    wash(ctx, 315, 390, 10, 90, '#8a5a3a', 1107)
    wash(ctx, 225, 325, 90, 56, '#f6e3c8', 1108)
    wash(ctx, 225, 320, 90, 16, C.rose, 1109)
    for (let i = 0; i < 5; i++) {
      const cx = 238 + i * 16
      ctx.fillStyle = [C.sky, C.mira, C.teal, C.rose, C.leaf][i]
      ctx.fillRect(cx - 2, 298, 5, 22)
      blob(ctx, cx, 290 + Math.sin(t * 9 + i) * 1.5, 4, 7, '#f2c14e', 1140 + i)
    }
    mira(ctx, 120, 620, { mouth: 'smile' })
    arun(ctx, 400, 620, { facing: -1, mouth: 'smile', eyes: 'down' })
  })
  // close-up: the present, held out in both hands
  panel(ctx, 30, 560, 480, 230, (ctx, w, h) => {
    wash(ctx, 0, 0, w, h, '#f1dcc0', 1110)
    arun(ctx, 390, 470, { s: 1.5, pose: 'hug', facing: -1, mouth: 'smile' })
    const bob = Math.sin(t * 2) * 3
    wash(ctx, 190, 120 + bob, 150, 120, C.arun, 1112)
    wash(ctx, 252, 120 + bob, 26, 120, C.mira, 1113)
    blob(ctx, 240, 112 + bob, 28, 16, C.mira, 1114)
    blob(ctx, 290, 112 + bob, 28, 16, C.mira, 1115)
    blob(ctx, 265, 118 + bob, 11, 10, '#c98a2a', 1116)
    for (const hx of [196, 334]) blob(ctx, hx, 170 + bob, 16, 20, C.skin2, 1117 + hx)
  }, { alpha: easeOut((t - 0.6) / 0.5) })
  label(ctx, 'Her birthday', W / 2, 540, easeOut((t - 0.3) / 0.5))
}, 'Arun had been hiding something all week.')

// Swipe across the wrapping paper, strip by strip, until the gift is bare.
const unwrap = (api) => {
  const BX = 90, BY = 250, BW = 360, BH = 390, N = 6
  const SH = BH / N
  const strips = Array.from({ length: N }, (_, i) => {
    const r = rng(1120 + i)
    return { i, peel: 0, dir: 0, gone: null, teeth: Array.from({ length: 7 }, () => r() * 10 - 3) }
  })
  let dragging = false
  let last = null
  let lastRip = 0
  let doneAt = null
  const confetti = Array.from({ length: 40 }, (_, k) => {
    const r = rng(1130 + k)
    return { x: r() * W, y: r() < 0.5 ? r() * 220 : 680 + r() * 280, a: r() * 3, c: PANS[k % PANS.length] }
  })

  const edgeX = (s) => (s.dir > 0 ? BX + s.peel * BW : BX + BW - s.peel * BW)
  function stripPath(ctx, s) {
    const y0 = BY + s.i * SH
    ctx.beginPath()
    if (s.peel === 0) return ctx.rect(BX, y0, BW, SH)
    const d = s.dir
    const ex = edgeX(s)
    ctx.moveTo(d > 0 ? BX + BW : BX, y0)
    ctx.lineTo(ex, y0)
    s.teeth.forEach((o, k) => ctx.lineTo(ex + (k % 2 ? o : -o) * d, y0 + (SH * (k + 1)) / 8))
    ctx.lineTo(ex, y0 + SH)
    ctx.lineTo(d > 0 ? BX + BW : BX, y0 + SH)
    ctx.closePath()
  }
  function drawStrip(ctx, s) {
    const y0 = BY + s.i * SH
    ctx.save()
    stripPath(ctx, s)
    ctx.clip()
    ctx.fillStyle = s.i % 2 ? '#c4533f' : '#bd4c39'
    ctx.fillRect(BX, y0, BW, SH)
    // mustard dots, placed on a grid over the whole box so the pattern runs on
    for (let gy = BY + 16; gy < BY + BH; gy += 32) {
      for (let gx = BX + 16 + ((gy - BY) % 64 ? 16 : 0); gx < BX + BW; gx += 32) {
        if (gy < y0 - 6 || gy > y0 + SH + 6) continue
        ctx.fillStyle = 'rgba(242,193,78,0.8)'
        ctx.beginPath()
        ctx.arc(gx, gy, 4, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.fillStyle = C.mira
    ctx.fillRect(W / 2 - 20, y0, 40, SH)
    if (s.i === 2) ctx.fillRect(BX, y0 + SH / 2 - 18, BW, 36)
    ctx.fillStyle = 'rgba(0,0,0,0.1)'
    ctx.fillRect(BX, y0 + SH - 3, BW, 3)
    ctx.restore()
    if (s.i === 0) {
      blob(ctx, W / 2 - 34, BY - 8, 36, 20, C.mira, 1116)
      blob(ctx, W / 2 + 34, BY - 8, 36, 20, C.mira, 1117)
      blob(ctx, W / 2, BY, 14, 12, '#c98a2a', 1118)
    }
    if (s.peel > 0 && s.gone === null) {
      // the curled-back flap by the tear
      const fw = Math.min(s.peel * BW * 0.5, 34)
      const ex = edgeX(s)
      ctx.save()
      ctx.shadowColor = 'rgba(0,0,0,0.25)'
      ctx.shadowBlur = 8
      ctx.fillStyle = '#f3e2cc'
      roundRect(ctx, s.dir > 0 ? ex - fw : ex, y0 + 2, fw, SH - 4, 10)
      ctx.fill()
      ctx.restore()
    }
  }
  function tear(s, t) {
    s.gone = t
    s.x = 0
    s.y = 0
    s.vx = s.dir * 520
    s.vy = -260
    s.rot = 0
    pop(260 + s.i * 30)
    if (strips.every((q) => q.gone !== null)) {
      doneAt = t
      for (const f of [523, 659, 784]) tone(f, 1.2, { gain: 0.05 })
    }
  }

  return {
    debug: () => strips.filter((s) => s.gone === null).map((s) => {
      const y = BY + s.i * SH + SH / 2
      return { from: [BX + 10, y], to: [BX + BW - 10, y] }
    }),
    draw(ctx, t, dt) {
      paper(ctx)
      // top-down view of the table
      wash(ctx, 0, 0, W, 960, '#d2a97f', 1121)
      for (let k = 0; k < 9; k++) line(ctx, 0, 40 + k * 110, W, 60 + k * 110, 'rgba(120,80,50,0.25)', 2, 1122 + k)
      for (const f of confetti) {
        ctx.save()
        ctx.translate(f.x, f.y)
        ctx.rotate(f.a)
        ctx.fillStyle = f.c
        ctx.fillRect(-6, -3, 12, 6)
        ctx.restore()
      }
      // inside the box: tissue paper, the tin, two brushes
      ctx.save()
      ctx.shadowColor = 'rgba(60,30,10,0.35)'
      ctx.shadowBlur = 24
      ctx.shadowOffsetY = 10
      ctx.fillStyle = '#eadcc2'
      ctx.fillRect(BX, BY, BW, BH)
      ctx.restore()
      wash(ctx, BX, BY, BW, BH, '#eadcc2', 1123)
      for (let k = 0; k < 6; k++) blob(ctx, BX + 30 + k * 60, BY + 30 + (k % 2) * 330, 44, 30, C.cream, 1124 + k)
      paintSet(ctx, W / 2, 420, 1)
      brush(ctx, 150, 575, C.teal, -0.12)
      brush(ctx, 170, 605, C.rose, -0.05)

      for (const s of strips) {
        if (s.gone === null) {
          drawStrip(ctx, s)
          continue
        }
        const age = t - s.gone
        if (age > 1.2) continue
        s.x += s.vx * dt
        s.vy += 900 * dt
        s.y += s.vy * dt
        s.rot += s.dir * 2.5 * dt
        const cx = BX + BW / 2
        const cy = BY + s.i * SH + SH / 2
        ctx.save()
        ctx.globalAlpha = 1 - age / 1.2
        ctx.translate(cx + s.x, cy + s.y)
        ctx.rotate(s.rot)
        ctx.translate(-cx, -cy)
        drawStrip(ctx, s)
        ctx.restore()
      }

      if (doneAt === null) {
        text(ctx, 'swipe across the paper to tear it', W / 2, 150, { size: 30, color: C.ink })
        const next = strips.find((s) => s.gone === null)
        if (!dragging && next) tapHint(ctx, BX + 40 + ((t * 0.7) % 1) * (BW - 80), BY + next.i * SH + SH / 2, t)
      } else {
        // a few sparkles over the paints
        for (let k = 0; k < 6; k++) {
          const a = Math.max(0, Math.sin(t * 3 + k * 1.7))
          const sx = BX + 30 + ((k * 67) % (BW - 60))
          const sy = BY + 60 + ((k * 101) % 260)
          line(ctx, sx - 9 * a, sy, sx + 9 * a, sy, '#fff6d8', 3, 1)
          line(ctx, sx, sy - 9 * a, sx, sy + 9 * a, '#fff6d8', 3, 2)
        }
        caption(ctx, 'A paint set. Nobody had given her one since she was nine.', easeOut((t - doneAt - 0.4) / 0.6))
        if (t - doneAt > 0.6) tapHint(ctx, W - 50, 50, t)
      }
    },
    down(x, y, t) {
      if (doneAt !== null) {
        if (t - doneAt > 0.6) api.finish()
        return
      }
      dragging = true
      last = { x, y }
    },
    move(x, y, t) {
      if (!dragging || doneAt !== null) return
      const dx = x - last.x
      const s = strips[Math.floor(((y + last.y) / 2 - BY) / SH)]
      if (s && s.gone === null && x > BX - 40 && x < BX + BW + 40 && Math.abs(dx) > 0.5) {
        if (!s.dir) s.dir = Math.sign(dx)
        s.peel = Math.min(1, s.peel + Math.abs(dx) / BW)
        if (t - lastRip > 0.07) {
          lastRip = t
          tone(140 + Math.random() * 90, 0.07, { type: 'sawtooth', gain: 0.02 })
        }
        if (s.peel > 0.6) tear(s, t)
      }
      last = { x, y }
    },
    up() {
      dragging = false
    },
  }
}

// ---------- painting over the pencil sketch ----------

const SX = 70, SY = 150, SW = 400, SHT = 480

function layer() {
  const c = document.createElement('canvas')
  c.width = SW * 2
  c.height = SHT * 2
  const g = c.getContext('2d')
  g.scale(2, 2)
  return { c, g }
}

// The finished picture hiding under the pencil: the bench where they met.
function parkPicture(g) {
  wash(g, -10, -10, SW + 20, 330, '#bcd9e4', 1150)
  blob(g, 310, 90, 44, 44, '#f2c14e', 1151)
  blob(g, 230, 300, 190, 60, '#a9c48a', 1152)
  wash(g, -10, 300, SW + 20, 200, '#9cc27a', 1153)
  wash(g, 140, 420, 140, 70, '#e2cfa8', 1154)
  wash(g, 78, 160, 22, 220, '#8a5a3a', 1155)
  for (let k = 0; k < 5; k++) blob(g, 54 + (k % 3) * 36, 110 + Math.floor(k / 3) * 60, 62, 52, C.leaf, 1156 + k)
  wash(g, 150, 352, 150, 16, '#9a6a44', 1161)
  wash(g, 150, 320, 150, 12, '#9a6a44', 1162)
  wash(g, 158, 360, 8, 40, '#7a5a3a', 1163)
  wash(g, 284, 360, 8, 40, '#7a5a3a', 1164)
  mira(g, 190, 400, { s: 0.42, pose: 'sit', mouth: 'smile' })
  arun(g, 345, 420, { s: 0.45, pose: 'violin', facing: -1, t: 0.3 })
}

function pencilLines(g) {
  g.save()
  g.strokeStyle = 'rgba(70,70,80,0.55)'
  g.lineWidth = 1.5
  g.beginPath()
  g.arc(310, 90, 42, 0, Math.PI * 2)
  g.moveTo(0, 318)
  g.quadraticCurveTo(200, 250, SW, 300)
  g.rect(150, 320, 150, 12)
  g.rect(150, 352, 150, 16)
  g.moveTo(160, 368)
  g.lineTo(160, 400)
  g.moveTo(288, 368)
  g.lineTo(288, 400)
  g.moveTo(80, 380)
  g.lineTo(80, 200)
  g.moveTo(100, 380)
  g.lineTo(100, 200)
  g.moveTo(140, 490)
  g.lineTo(170, 420)
  g.lineTo(260, 420)
  g.lineTo(290, 490)
  g.stroke()
  for (let k = 0; k < 5; k++) {
    g.beginPath()
    g.arc(54 + (k % 3) * 36, 110 + Math.floor(k / 3) * 60, 50, k * 1.3, k * 1.3 + 4.4)
    g.stroke()
  }
  // the two little figures: heads and bodies, loosely
  g.beginPath()
  g.arc(190, 294, 14, 0, Math.PI * 2)
  g.moveTo(190 + 14, 280)
  g.moveTo(345 + 15, 293)
  g.arc(345, 293, 15, 0, Math.PI * 2)
  g.moveTo(178, 306)
  g.lineTo(176, 356)
  g.lineTo(212, 356)
  g.lineTo(214, 400)
  g.moveTo(333, 306)
  g.lineTo(330, 360)
  g.lineTo(360, 360)
  g.lineTo(357, 306)
  g.moveTo(340, 360)
  g.lineTo(340, 420)
  g.moveTo(352, 360)
  g.lineTo(352, 420)
  g.stroke()
  g.restore()
}

const sketch = (api) => {
  const full = layer()
  const ghost = layer()
  const mask = layer()
  const comp = layer()
  parkPicture(full.g)
  // a faint grey shadow of the picture, like soft pencil shading
  ghost.g.drawImage(full.c, 0, 0, SW, SHT)
  ghost.g.globalCompositeOperation = 'saturation'
  ghost.g.fillStyle = '#808080'
  ghost.g.fillRect(0, 0, SW, SHT)

  const CELL = 20
  const covered = new Set()
  const TOTAL = (SW / CELL) * (SHT / CELL)
  const r = rng(1170)
  let pointer = null
  let last = null
  let tip = 0
  let doneAt = null
  const progress = () => covered.size / TOTAL

  function stamp(x, y) {
    const lx = clamp(x - SX, 0, SW)
    const ly = clamp(y - SY, 0, SHT)
    const rad = 26 + r() * 8
    const g = mask.g
    const grd = g.createRadialGradient(lx, ly, 0, lx, ly, rad)
    grd.addColorStop(0, 'rgba(0,0,0,0.5)')
    grd.addColorStop(0.7, 'rgba(0,0,0,0.35)')
    grd.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = grd
    g.beginPath()
    g.ellipse(lx, ly, rad, rad * (0.75 + r() * 0.3), r() * 3, 0, Math.PI * 2)
    g.fill()
    for (let cx = Math.floor((lx - rad) / CELL); cx <= (lx + rad) / CELL; cx++) {
      for (let cy = Math.floor((ly - rad) / CELL); cy <= (ly + rad) / CELL; cy++) {
        if (cx < 0 || cy < 0 || cx >= SW / CELL || cy >= SHT / CELL) continue
        if (Math.hypot((cx + 0.5) * CELL - lx, (cy + 0.5) * CELL - ly) < rad * 0.9) covered.add(cx + ',' + cy)
      }
    }
  }

  return {
    debug: () => ({ sheet: [SX, SY, SW, SHT], progress: progress(), done: doneAt !== null }),
    draw(ctx, t, dt) {
      paper(ctx)
      wash(ctx, 0, 0, W, 960, '#d2a97f', 1171)
      // the sheet of watercolour paper
      ctx.save()
      ctx.shadowColor = 'rgba(0,0,0,0.2)'
      ctx.shadowBlur = 14
      ctx.fillStyle = '#fdfaf3'
      ctx.fillRect(SX - 14, SY - 14, SW + 28, SHT + 28)
      ctx.restore()
      if (doneAt !== null) {
        mask.g.fillStyle = `rgba(0,0,0,${clamp(dt * 1.4, 0, 1)})`
        mask.g.fillRect(0, 0, SW, SHT)
      }
      ctx.save()
      ctx.globalAlpha = 0.16
      ctx.drawImage(ghost.c, SX, SY, SW, SHT)
      ctx.restore()
      comp.g.globalCompositeOperation = 'source-over'
      comp.g.clearRect(0, 0, SW, SHT)
      comp.g.drawImage(mask.c, 0, 0, SW, SHT)
      comp.g.globalCompositeOperation = 'source-in'
      comp.g.drawImage(full.c, 0, 0, SW, SHT)
      ctx.drawImage(comp.c, SX, SY, SW, SHT)
      ctx.save()
      ctx.beginPath()
      ctx.rect(SX, SY, SW, SHT)
      ctx.clip()
      ctx.translate(SX, SY)
      ctx.globalAlpha = doneAt === null ? 1 - progress() * 0.6 : clamp(0.55 - (t - doneAt), 0.2, 1)
      pencilLines(ctx)
      ctx.restore()

      paintSet(ctx, 210, 770, 0.7)
      blob(ctx, 420, 770, 44, 54, 'rgba(156,195,213,0.7)', 1172)
      blob(ctx, 420, 786, 36, 32, 'rgba(94,158,154,0.5)', 1173)

      if (doneAt === null) {
        text(ctx, 'drag to paint over the sketch', W / 2 + 20, 80, { size: 30 })
        const p = clamp(progress() / 0.72, 0, 1)
        wash(ctx, 120, 660, 300 * p + 1, 12, C.teal, 1174)
        ctx.strokeStyle = C.inkSoft
        ctx.lineWidth = 2
        ctx.strokeRect(120, 660, 300, 12)
        if (!pointer) tapHint(ctx, SX + 80 + ((t * 0.5) % 1) * (SW - 160), SY + 220, t)
      } else {
        caption(ctx, "She hadn't painted since she was nine. Her hands remembered.", easeOut((t - doneAt - 0.8) / 0.6))
        if (t - doneAt > 1) tapHint(ctx, W - 50, 50, t)
      }
      if (pointer) brush(ctx, pointer.x, pointer.y, PANS[tip % PANS.length])
    },
    down(x, y, t) {
      if (doneAt !== null) {
        if (t - doneAt > 1) api.finish()
        return
      }
      pointer = { x, y }
      last = { x, y }
      tip += 1
      stamp(x, y)
      pop(500 + r() * 200)
    },
    move(x, y, t) {
      if (!pointer || doneAt !== null) return
      pointer = { x, y }
      const d = Math.hypot(x - last.x, y - last.y)
      const steps = Math.floor(d / 8)
      for (let k = 1; k <= steps; k++) stamp(lerp(last.x, x, k / steps), lerp(last.y, y, k / steps))
      if (steps) last = { x, y }
      if (progress() >= 0.72) {
        doneAt = t
        pointer = null
        for (const f of [392, 494, 587]) tone(f, 1.4, { gain: 0.05 })
      }
    },
    up() {
      pointer = null
    },
  }
}

const evening = vignette((ctx, t) => {
  panel(ctx, 30, 100, 480, 430, (ctx, w, h) => {
    wash(ctx, 0, 0, w, h, '#efd3b0', 1180)
    blob(ctx, 170, 120, 130, 110, '#f7d58a', 1181, 0.45) // lamp glow
    line(ctx, 170, 0, 170, 44, C.ink, 3, 3)
    ctx.fillStyle = C.mira
    ctx.beginPath()
    ctx.ellipse(170, 64, 34, 22, 0, Math.PI, 0)
    ctx.fill()
    windowFrame(ctx, 340, 40, 120, 150, '#4b4f7a', 1182)
    blob(ctx, 420, 80, 10, 10, '#f5eee2', 1183)
    // chair, table and the little easel
    wash(ctx, 55, 380, 90, 18, '#9a6a44', 1184)
    wash(ctx, 48, 220, 16, 260, '#8a5a3a', 1185)
    wash(ctx, 196, 370, 280, 20, '#9a6a44', 1186)
    wash(ctx, 210, 380, 12, 60, '#8a5a3a', 1194)
    wash(ctx, 450, 380, 12, 60, '#8a5a3a', 1195)
    line(ctx, 280, 372, 320, 180, '#7a5a3a', 6, 1)
    line(ctx, 370, 372, 320, 180, '#7a5a3a', 6, 2)
    ctx.fillStyle = '#fdfaf3'
    ctx.fillRect(250, 200, 140, 120)
    wash(ctx, 254, 204, 132, 62, '#bcd9e4', 1187)
    wash(ctx, 254, 262, 132, 54, '#9cc27a', 1188)
    blob(ctx, 356, 228, 14, 14, '#f2c14e', 1189)
    blob(ctx, 290, 240, 22, 20, C.leaf, 1190)
    paintSet(ctx, 420, 356, 0.3)
    mira(ctx, 110, 500, { pose: 'sit', mouth: 'smile', eyes: 'down' })
    brush(ctx, 258, 300, C.teal, 2.55)
  })
  panel(ctx, 30, 570, 480, 220, (ctx, w, h) => {
    wash(ctx, 0, 0, w, h, '#e7c9a4', 1191)
    wash(ctx, 180, 110, 300, 130, '#7f8fa6', 1192)
    wash(ctx, 440, 70, 50, 170, '#6d7d94', 1193)
    arun(ctx, 300, 330, { pose: 'sit', facing: -1, mouth: 'smile' })
    ctx.save()
    ctx.translate(222, 200)
    ctx.rotate(-0.4)
    blob(ctx, 0, 0, 30, 17, '#9a5a2c', 1196)
    ctx.fillStyle = C.ink
    ctx.fillRect(-80, -3, 54, 6)
    ctx.restore()
    const k = (t * 0.4) % 1
    ctx.globalAlpha = 1 - k
    heart(ctx, 360 + k * 10, 70 - k * 50, 0.8, C.rose)
  }, { alpha: easeOut((t - 0.6) / 0.5) })
  label(ctx, 'That evening', W / 2, 550, easeOut((t - 0.3) / 0.5))
}, 'Arun had never seen her so quiet, or so happy.')

export default {
  title: 'A Gift',
  pages: [party, unwrap, sketch, evening],
}
