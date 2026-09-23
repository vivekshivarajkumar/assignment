// Chapter 5 · Silence — a dead phone on a park bench, and music bringing the colour back.
import { vignette } from '../engine.js'
import {
  W, H, C, paper, wash, blob, line, text, caption, tapHint, panel, label, phone, note,
  person, mira, arun, mix, clamp, dist, easeOut, lerp,
} from '../paint.js'
import { pop, tone, MELODY } from '../sound.js'

const GREY = 0.65

// Every colour in this chapter goes through tint(): k = 0 grey, k = 1 full colour.
function greyOf(hex) {
  const n = parseInt(hex.slice(1), 16)
  const l = Math.round(((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11)
  const g = Math.round(lerp(l, 185, 0.35)).toString(16).padStart(2, '0')
  return `#${g}${g}${g}`
}
const tint = (hex, k) => (k >= 1 ? hex : mix(greyOf(hex), hex, k))

// The evening park (same one Arun plays in). Horizon at 70% of the height.
function park(ctx, w, h, k) {
  wash(ctx, -10, -10, w + 20, h * 0.74, tint('#e8c9a8', k), 501)
  blob(ctx, w * 0.78, h * 0.18, 58, 58, tint('#f2c14e', k), 502, 0.8)
  for (let i = 0; i < 5; i++) {
    blob(ctx, i * (w / 4), h * 0.67, 90, 64, tint(i % 2 ? C.leaf : '#7fa464', k), 503 + i)
  }
  blob(ctx, w * 0.45, h * 0.12, w * 0.14, h * 0.025, C.cream, 540, 0.7) // clouds
  blob(ctx, w * 0.55, h * 0.1, w * 0.1, h * 0.022, C.cream, 541, 0.7)
  blob(ctx, w * 0.3, h * 0.24, w * 0.08, h * 0.018, C.cream, 542, 0.5)
  // a big old tree on the left
  line(ctx, w * 0.1, h * 0.72, w * 0.12, h * 0.36, tint('#7a5a45', k), w * 0.05, 543)
  line(ctx, w * 0.12, h * 0.46, w * 0.22, h * 0.36, tint('#7a5a45', k), w * 0.025, 544)
  blob(ctx, w * 0.08, h * 0.33, w * 0.2, h * 0.08, tint('#7fa464', k), 545)
  blob(ctx, w * 0.24, h * 0.3, w * 0.16, h * 0.07, tint(C.leaf, k), 546)
  blob(ctx, w * 0.14, h * 0.25, w * 0.15, h * 0.06, tint('#9cbf7c', k), 547)
  wash(ctx, -10, h * 0.7, w + 20, h * 0.32, tint('#b9c98f', k), 508)
  blob(ctx, w * 0.5, h * 0.93, w * 0.62, h * 0.05, tint('#e3d3b5', k), 509, 0.8) // path
  // lamp post
  line(ctx, w * 0.88, h * 0.74, w * 0.88, h * 0.34, tint('#3f4a4a', k), 8, 510)
  blob(ctx, w * 0.88, h * 0.33, 16, 20, tint('#f6e3a6', k), 511)
}

function bench(ctx, x, y, s, k) {
  const wood = tint('#8a5a3c', k)
  line(ctx, x - 40 * s, y - 100 * s, x - 40 * s, y, C.ink, 7 * s, 512)
  line(ctx, x + 130 * s, y - 100 * s, x + 130 * s, y, C.ink, 7 * s, 513)
  wash(ctx, x - 70 * s, y - 208 * s, 230 * s, 22 * s, wood, 514)
  wash(ctx, x - 70 * s, y - 172 * s, 230 * s, 22 * s, wood, 515)
  line(ctx, x - 58 * s, y - 214 * s, x - 58 * s, y - 104 * s, C.ink, 6 * s, 516)
  line(ctx, x + 148 * s, y - 214 * s, x + 148 * s, y - 104 * s, C.ink, 6 * s, 517)
  wash(ctx, x - 76 * s, y - 112 * s, 244 * s, 20 * s, wood, 518)
}

// ---------- pages ----------

const alone = vignette((ctx, t) => {
  panel(ctx, 40, 100, 460, 420, (c, w, h) => {
    park(c, w, h, 0)
    bench(c, 190, 370, 0.85, 0)
    mira(c, 190, 370, { s: 0.85, pose: 'sit', eyes: 'down', grey: GREY })
    c.save()
    c.translate(190 + 42 * 0.85, 370 - 128 * 0.85)
    c.rotate(0.3)
    c.fillStyle = C.ink
    c.fillRect(-9, -15, 18, 28)
    c.fillStyle = '#e4e6e8'
    c.fillRect(-6, -11, 12, 20)
    c.restore()
  })
  label(ctx, 'after work', 160, 520)
  const a = easeOut((t - 1.2) / 0.6)
  if (a > 0) {
    panel(ctx, 40, 560, 460, 210, (c, w, h) => {
      park(c, w, h * 1.6, 0)
      // everyone else is going somewhere
      for (let i = 0; i < 3; i++) {
        const x = 330 + i * 70 + (t - 1.2) * 14
        person(c, { x, y: 170, s: 0.3, pose: 'walk', t: t + i, hair: '#4a464c', top: '#8f8b86', bottom: '#5f5b58' })
      }
      bench(c, 90, 180, 0.38, 0)
      mira(c, 90, 180, { s: 0.38, pose: 'sit', eyes: 'down', grey: GREY })
    }, { alpha: a })
  }
}, 'Nobody is waiting for her. There is nowhere to be.')

// Tap the phone. It dies. Tap it again: nothing.
const dead = (api) => {
  const PH = { x: 150, y: 170, w: 240, h: 460 }
  let taps = 0
  let lastTap = -10
  let doneAt = null
  return {
    debug: () => (doneAt === null ? { click: [W / 2, 400] } : null),
    draw(ctx, t) {
      paper(ctx)
      park(ctx, W, H, 0)
      ctx.save()
      ctx.globalAlpha = 0.35
      ctx.fillStyle = C.greyLight
      ctx.fillRect(0, 0, W, H)
      ctx.restore()
      // arms in the washed-out mustard coat
      ctx.save()
      ctx.strokeStyle = tint(C.mira, 0.35)
      ctx.lineCap = 'round'
      ctx.lineWidth = 110
      ctx.beginPath()
      ctx.moveTo(20, 1040)
      ctx.lineTo(110, 620)
      ctx.moveTo(520, 1040)
      ctx.lineTo(430, 620)
      ctx.stroke()
      ctx.restore()
      const shake = t - lastTap < 0.25 ? Math.sin((t - lastTap) * 70) * 6 : 0
      ctx.save()
      ctx.translate(shake, 0)
      const on = taps === 0 || (taps === 1 && t - lastTap < 0.3 && Math.sin(t * 60) > 0)
      phone(ctx, PH.x, PH.y, PH.w, PH.h, '#d9dad8', on)
      if (on) {
        // almost-empty battery
        ctx.strokeStyle = C.inkSoft
        ctx.lineWidth = 5
        ctx.strokeRect(W / 2 - 50, 370, 100, 50)
        ctx.fillStyle = C.inkSoft
        ctx.fillRect(W / 2 + 50, 385, 10, 20)
        ctx.fillStyle = 'rgb(176,120,110)'
        ctx.fillRect(W / 2 - 44, 376, 14, 38)
      } else {
        // her reflection in the black glass
        blob(ctx, W / 2, 400, 64, 78, '#ffffff', 520, 0.1)
        blob(ctx, W / 2 - 40, 318, 24, 24, '#ffffff', 521, 0.1)
        blob(ctx, W / 2, 560, 110, 60, '#ffffff', 524, 0.07)
      }
      ctx.restore()
      blob(ctx, 140, 520, 32, 48, C.skin1, 522)
      blob(ctx, 400, 520, 32, 48, C.skin1, 523)

      if (doneAt === null) {
        text(ctx, taps === 0 ? 'tap the phone' : 'tap it again', W / 2, 110, { size: 32 })
        tapHint(ctx, W / 2, 500, t, C.ink)
      } else {
        // far off, something rust-coloured drifts by
        const k = t - doneAt
        note(ctx, W + 20 - k * 40, 200 + Math.sin(k * 2) * 12, 1, C.arun, clamp(k - 0.6, 0, 0.8))
        caption(ctx, 'Nothing. For once, just the quiet.', easeOut((k - 0.3) / 0.6))
        tapHint(ctx, 50, 50, t)
      }
    },
    down(x, y, t) {
      if (doneAt !== null) {
        if (t - doneAt > 0.8) api.finish()
        return
      }
      if (x > PH.x - 30 && x < PH.x + PH.w + 30 && y > PH.y - 30 && y < PH.y + PH.h + 30) {
        taps += 1
        lastTap = t
        pop(taps === 1 ? 300 : 140)
        if (taps >= 3) doneAt = t
      }
    },
  }
}

// Rust notes drift in. Each one tapped plays the next bar and paints the park back.
const follow = (api) => {
  const N = 8
  const SPLASH = [C.rose, C.leaf, C.sky, C.mira, '#f2c14e', C.arun, C.teal]
  let found = 0
  let k = 0 // shown colour, eases toward found / N
  let n = null
  let nextAt = 0.8
  let doneAt = null
  const bursts = []
  const spawn = (t) => {
    n = { x: W + 30, y0: 220 + ((found * 137) % 320), born: t, speed: 70 + found * 8 }
  }
  const pos = (t) => [n.x, n.y0 + Math.sin((t - n.born) * 2.2) * 30]
  let now = 0
  return {
    debug() {
      if (doneAt !== null) return null
      if (n && n.x > 60 && n.x < W - 40) return { click: pos(now) }
      return { wait: 200 }
    },
    draw(ctx, t, dt) {
      now = t
      k = lerp(k, found / N, clamp(dt * 2.5, 0, 1))
      if (!n && doneAt === null && t > nextAt) spawn(t)
      if (n) {
        n.x -= n.speed * dt
        if (n.x < -50) spawn(t) // missed it: it comes round again
      }

      paper(ctx)
      park(ctx, W, H, k)
      bench(ctx, 170, 820, 0.95, k)
      mira(ctx, 170, 820, {
        s: 0.95, pose: 'sit', grey: GREY * (1 - k),
        eyes: found < 2 ? 'down' : 'open', mouth: found >= N - 2 ? 'smile' : 'none',
      })
      // flowers open as the colour comes back
      for (let i = 0; i < 9; i++) {
        const fx = 30 + ((i * 197) % 490)
        const fy = 700 + ((i * 71) % 60) + (fx > 90 && fx < 340 ? 190 : 0)
        const g = clamp(k * 1.4 - i * 0.06, 0, 1)
        if (g > 0) blob(ctx, fx, fy, 14 * g, 11 * g, SPLASH[i % SPLASH.length], 550 + i)
      }
      // a warm glow at the edge where the music comes from
      blob(ctx, W + 30, 400, 70, 200, C.arun, 530, 0.06 + 0.08 * k)

      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i]
        const a = (t - b.at) / 0.9
        if (a >= 1) {
          bursts.splice(i, 1)
          continue
        }
        SPLASH.forEach((c, j) => {
          const ang = (j / SPLASH.length) * Math.PI * 2 + b.at
          const r = easeOut(a) * 90
          blob(ctx, b.x + Math.cos(ang) * r, b.y + Math.sin(ang) * r, 14 * (1 - a) + 4, 12 * (1 - a) + 3, c, 531 + j, 1 - a)
        })
      }
      if (n) {
        const [x, y] = pos(t)
        note(ctx, x, y + 14, 1.5, C.arun, 1)
        if (found < 1 && x < W - 30) tapHint(ctx, x, y, t, C.arun)
      }

      if (doneAt === null) {
        if (found < 2) text(ctx, 'tap the notes', W / 2, 110, { size: 32 })
      } else {
        caption(ctx, 'Somewhere nearby, someone was playing.', easeOut((t - doneAt - 0.6) / 0.6))
        if (t - doneAt > 1) tapHint(ctx, 50, 50, t)
      }
    },
    down(x, y, t) {
      if (doneAt !== null) {
        if (t - doneAt > 1) api.finish()
        return
      }
      if (!n) return
      const [nx, ny] = pos(t)
      if (dist(x, y, nx, ny) < 60) {
        tone(MELODY[found % MELODY.length], 0.9)
        bursts.push({ x: nx, y: ny, at: t })
        found += 1
        n = null
        nextAt = t + 0.5
        if (found >= N) doneAt = t
      }
    },
  }
}

const found = vignette((ctx, t) => {
  panel(ctx, 40, 100, 460, 440, (c, w, h) => {
    park(c, w, h, 1)
    arun(c, 330, 410, { s: 0.95, pose: 'violin', t, facing: -1 })
    for (let i = 0; i < 3; i++) {
      const q = (t * 0.35 + i / 3) % 1
      note(c, 290 - q * 70 + Math.sin(q * 6) * 12, 170 - q * 120, 0.8, C.arun, Math.sin(q * Math.PI))
    }
    mira(c, 110, 420, { s: 0.8, eyes: 'open' })
  })
  label(ctx, 'the music', 380, 540)
  const a = easeOut((t - 1.2) / 0.6)
  if (a > 0) {
    panel(ctx, 40, 580, 460, 190, (c, w, h) => {
      wash(c, -10, -10, w + 20, h + 20, '#e8c9a8', 540)
      blob(c, 380, 140, 120, 80, C.leaf, 541)
      mira(c, 150, 460, { s: 1.4, eyes: 'open', mouth: 'smile' })
      note(c, 330 + Math.sin(t * 2) * 10, 90, 1.1, C.arun, 0.9)
      note(c, 400, 60 + Math.sin(t * 2 + 1) * 8, 0.8, C.arun, 0.7)
    }, { alpha: a })
  }
}, 'A stranger in a rust scarf, playing for no one.')

export default {
  title: 'Silence',
  pages: [alone, dead, follow, found],
}
