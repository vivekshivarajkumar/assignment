// Chapter 3 · Numbers — the spreadsheet, the clock, one day the same as the next.
import { vignette } from '../engine.js'
import {
  W, H, C, wash, blob, line, text, caption, tapHint, panel, label, windowFrame,
  person, mira, rng, mix, clamp, lerp, easeOut, inRect,
} from '../paint.js'
import { pop } from '../sound.js'

const GREY = 0.65

const COWORKERS = [
  { hair: '#4a464c', top: '#8f8b86', bottom: '#5f5b58', hairStyle: 'short' },
  { hair: '#5a5550', top: '#a19d97', bottom: '#6d6965', hairStyle: 'long' },
  { hair: '#3f3b40', top: '#7f7b78', bottom: '#56524f', hairStyle: 'bun' },
]

// Wall clock; `hours` can be fractional (9.5 = half past nine).
function clock(ctx, x, y, r, hours) {
  blob(ctx, x, y, r + 8, r + 8, C.greyDark, 301)
  ctx.save()
  ctx.fillStyle = C.cream
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = C.inkSoft
  ctx.lineWidth = 3
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8)
    ctx.lineTo(x + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92)
    ctx.stroke()
  }
  const ha = ((hours % 12) / 12) * Math.PI * 2 - Math.PI / 2
  const ma = (hours % 1) * Math.PI * 2 - Math.PI / 2
  line(ctx, x, y, x + Math.cos(ha) * r * 0.5, y + Math.sin(ha) * r * 0.5, C.ink, 5, 302)
  line(ctx, x, y, x + Math.cos(ma) * r * 0.78, y + Math.sin(ma) * r * 0.78, C.ink, 3, 303)
  ctx.restore()
}

// Someone at a desk, facing a monitor. Feet at (x, y).
function atDesk(ctx, x, y, s, draw) {
  draw(x, y, s)
  wash(ctx, x - 10 * s, y - 128 * s, 190 * s, 128 * s, '#a4a09b', 304 + x)
  line(ctx, x + 135 * s, y - 152 * s, x + 135 * s, y - 128 * s, C.ink, 8 * s, 307)
  ctx.save()
  ctx.fillStyle = C.ink
  ctx.beginPath()
  ctx.roundRect(x + 95 * s, y - 222 * s, 80 * s, 70 * s, 6 * s)
  ctx.fill()
  ctx.fillStyle = '#dfe1e2'
  ctx.fillRect(x + 101 * s, y - 216 * s, 68 * s, 56 * s)
  ctx.restore()
}

function office(ctx, w, h, hours) {
  wash(ctx, -10, -10, w + 20, h + 20, C.greyLight, 310)
  windowFrame(ctx, 30, 30, 200, 130, '#c8cdd2', 311)
  clock(ctx, 380, 80, 42, hours)
  wash(ctx, -10, 250, w + 20, h - 240, '#b1ada8', 312)
  // back row, smaller and further away
  COWORKERS.forEach((look, i) => {
    atDesk(ctx, 40 + i * 150, 250, 0.42, (x, y, s) =>
      person(ctx, { ...look, x, y, s, pose: 'sit', eyes: 'down', grey: 0.2 }))
  })
  atDesk(ctx, 120, 400, 0.72, (x, y, s) => mira(ctx, x, y, { s, pose: 'sit', eyes: 'down', grey: GREY }))
}

const arrive = vignette((ctx, t) => {
  panel(ctx, 40, 100, 460, 390, (c, w, h) => office(c, w, h, 9))
  label(ctx, 'Accounts, 4th floor', 300, 490)
  const a = easeOut((t - 1) / 0.6)
  if (a > 0) {
    panel(ctx, 40, 540, 270, 230, (c, w, h) => {
      wash(c, -10, -10, w + 20, h + 20, '#dfe1e2', 313)
      c.strokeStyle = C.greyDark
      c.lineWidth = 2
      const cw = w / 4
      for (let gx = cw; gx < w; gx += cw) line(c, gx, 0, gx, h, C.grey, 2, gx)
      for (let gy = 0; gy < h; gy += 38) line(c, 0, gy, w, gy, C.grey, 2, gy)
      const r = rng(314)
      for (let gy = 19; gy < h; gy += 38) {
        for (let gx = cw / 2; gx < w; gx += cw) {
          text(c, String(100 + Math.floor(r() * 900)), gx, gy + 2, { size: 22, color: C.inkSoft })
        }
      }
    }, { alpha: a })
  }
  const b = easeOut((t - 1.6) / 0.6)
  if (b > 0) {
    panel(ctx, 330, 540, 170, 230, (c, w, h) => {
      wash(c, -10, -10, w + 20, h + 20, C.greyLight, 315)
      clock(c, w / 2, h / 2, 62, 9 + Math.min(t - 1.6, 3) * 0.02)
    }, { alpha: b })
  }
}, 'Numbers in, numbers out. Nine till half past five.')

// ---------- the spreadsheet ----------

const COLS = 4
const ROWS = 6
const GRID = { x: 76, y: 364, cw: 105, ch: 64 }
const NEEDED = 9
const START = 9
const END = 17.5

function makeNumbers() {
  const r = rng(320)
  const digits = [3, 6, 8, 9, 0, 1]
  const pool = new Set()
  while (pool.size < (COLS * ROWS) / 2) {
    const d = () => digits[Math.floor(r() * digits.length)]
    pool.add(`${[3, 6, 8][Math.floor(r() * 3)]}${d()}${d()}`)
  }
  const cells = [...pool, ...pool].map((n) => ({ n, gone: null }))
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[cells[i], cells[j]] = [cells[j], cells[i]]
  }
  return cells
}

const sheet = (api) => {
  const cells = makeNumbers()
  let sel = null
  let wrong = null // { a, b, at }
  let matches = 0
  let shownHours = START
  let doneAt = null
  const rect = (i) => ({
    x: GRID.x + (i % COLS) * GRID.cw,
    y: GRID.y + Math.floor(i / COLS) * GRID.ch,
    w: GRID.cw,
    h: GRID.ch,
  })
  const centre = (i) => {
    const r = rect(i)
    return [r.x + r.w / 2, r.y + r.h / 2]
  }
  const open = () => cells.map((c, i) => i).filter((i) => cells[i].gone === null)
  return {
    debug() {
      if (doneAt !== null) return null
      if (sel !== null) {
        const partner = open().find((i) => i !== sel && cells[i].n === cells[sel].n)
        return { click: centre(partner) }
      }
      return { click: centre(open()[0]) }
    },
    draw(ctx, t, dt) {
      const target = doneAt !== null ? END : lerp(START, END - 1, matches / NEEDED)
      shownHours = lerp(shownHours, target, clamp(dt * (doneAt !== null ? 1.6 : 4), 0, 1))
      const dusk = clamp((shownHours - START) / (END - START), 0, 1)

      wash(ctx, -10, -10, W + 20, H + 20, C.greyLight, 321)
      windowFrame(ctx, 300, 96, 200, 150, mix('#c8cdd2', '#6c7082', dusk), 322)
      clock(ctx, 170, 170, 62, shownHours)

      // monitor
      const bottom = GRID.y + ROWS * GRID.ch
      wash(ctx, 230, bottom + 8, 80, 50, '#5d5963', 324) // stand
      ctx.fillStyle = C.ink
      ctx.beginPath()
      ctx.roundRect(30, 330, 480, bottom - 316, 16)
      ctx.fill()
      ctx.fillStyle = '#eceeee'
      ctx.fillRect(44, 344, 452, bottom - 344)
      ctx.fillStyle = '#dcdedd'
      ctx.fillRect(44, 344, 452, 20)
      ctx.fillRect(44, 344, 32, bottom - 344)
      for (let c = 0; c < COLS; c++) {
        text(ctx, 'ABCD'[c], GRID.x + c * GRID.cw + GRID.cw / 2, 355, { size: 18, color: C.greyDark })
      }
      for (let r = 0; r < ROWS; r++) {
        text(ctx, String(r + 1), 60, GRID.y + r * GRID.ch + GRID.ch / 2, { size: 18, color: C.greyDark })
      }
      ctx.strokeStyle = C.greyLight
      ctx.lineWidth = 2
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath()
        ctx.moveTo(GRID.x + c * GRID.cw, 344)
        ctx.lineTo(GRID.x + c * GRID.cw, bottom)
        ctx.stroke()
      }
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath()
        ctx.moveTo(44, GRID.y + r * GRID.ch)
        ctx.lineTo(496, GRID.y + r * GRID.ch)
        ctx.stroke()
      }

      if (wrong && t - wrong.at > 0.35) wrong = null
      cells.forEach((cell, i) => {
        const r = rect(i)
        let [cx, cy] = centre(i)
        let alpha = 1
        if (cell.gone !== null) {
          alpha = 1 - clamp((t - cell.gone) / 0.5, 0, 1)
          cy -= (1 - alpha) * 14
        }
        if (doneAt !== null) alpha *= 1 - clamp((t - doneAt) / 1.2, 0, 0.75)
        if (alpha <= 0) return
        if (i === sel || (wrong && (i === wrong.a || i === wrong.b))) {
          ctx.fillStyle = wrong && (i === wrong.a || i === wrong.b) ? '#d9c9c4' : '#d4dbd6'
          ctx.fillRect(r.x + 3, r.y + 3, r.w - 6, r.h - 6)
          ctx.strokeStyle = C.ink
          ctx.lineWidth = 3
          ctx.strokeRect(r.x + 3, r.y + 3, r.w - 6, r.h - 6)
        }
        if (wrong && (i === wrong.a || i === wrong.b)) cx += Math.sin((t - wrong.at) * 60) * 5
        if (doneAt !== null) {
          // the numbers smear into one another
          const k = clamp((t - doneAt) / 1.2, 0, 1) * 6
          text(ctx, cell.n, cx - k, cy, { size: 30, color: C.inkSoft, alpha: alpha * 0.5 })
          text(ctx, cell.n, cx + k, cy, { size: 30, color: C.inkSoft, alpha: alpha * 0.5 })
        } else text(ctx, cell.n, cx, cy, { size: 30, color: C.ink, alpha })
      })

      wash(ctx, -10, bottom + 50, W + 20, 200, '#a4a09b', 325) // desk
      // a stack of paper and a cold grey mug
      for (let k = 0; k < 4; k++) wash(ctx, 40 + k * 3, bottom + 96 - k * 12, 130, 22, '#e6e3de', 326 + k)
      wash(ctx, 400, bottom + 70, 58, 66, '#cfcbc6', 331)
      ctx.save()
      ctx.strokeStyle = '#cfcbc6'
      ctx.lineWidth = 9
      ctx.beginPath()
      ctx.arc(462, bottom + 102, 16, -1.3, 1.3)
      ctx.stroke()
      ctx.restore()

      if (doneAt === null) {
        text(ctx, 'tap two cells with the same number', W / 2, 296, { size: 28, color: C.ink })
        if (matches === 0) {
          const [hx, hy] = centre(sel !== null ? sel : open()[0])
          if (sel === null) tapHint(ctx, hx, hy + 20, t)
        }
      } else {
        caption(ctx, 'Somewhere between the numbers, the day was gone.', easeOut((t - doneAt - 0.8) / 0.6))
        if (t - doneAt > 1.2) tapHint(ctx, 50, 50, t)
      }
    },
    down(x, y, t) {
      if (doneAt !== null) {
        if (t - doneAt > 1.2) api.finish()
        return
      }
      const i = cells.findIndex((c, k) => c.gone === null && inRect(x, y, rect(k)))
      if (i < 0) return
      if (sel === null) {
        sel = i
        pop(420)
      } else if (sel === i) {
        sel = null
      } else if (cells[sel].n === cells[i].n) {
        cells[sel].gone = t
        cells[i].gone = t
        sel = null
        matches += 1
        pop(560 + matches * 25)
        if (matches >= NEEDED) doneAt = t
      } else {
        wrong = { a: sel, b: i, at: t }
        sel = null
        pop(180)
      }
    },
  }
}

// ---------- the days blur ----------

function sameDay(ctx, w, h) {
  wash(ctx, -10, -10, w + 20, h + 20, C.greyLight, 330)
  windowFrame(ctx, 290, 24, 130, 100, '#c8cdd2', 331)
  clock(ctx, 220, 60, 30, 9)
  wash(ctx, -10, 150, w + 20, h - 140, '#b1ada8', 332)
  atDesk(ctx, 80, 196, 0.52, (x, y, s) => mira(ctx, x, y, { s, pose: 'sit', eyes: 'down', grey: GREY }))
  atDesk(ctx, 300, 196, 0.4, (x, y, s) =>
    person(ctx, { ...COWORKERS[0], x, y, s, pose: 'sit', eyes: 'down', grey: 0.2 }))
}

const blur = vignette((ctx, t) => {
  const days = ['Monday', 'Tuesday', 'Monday again?']
  days.forEach((day, i) => {
    const a = easeOut((t - i * 0.9) / 0.6)
    if (a <= 0) return
    const y = 100 + i * 230
    panel(ctx, 40, y, 460, 200, (c, w, h) => {
      if (i === 0) sameDay(c, w, h)
      else {
        // each day a little more smudged than the last
        const spread = i * 4
        c.save()
        c.globalAlpha *= 0.55
        c.translate(-spread, 0)
        sameDay(c, w, h)
        c.translate(spread * 2, 0)
        sameDay(c, w, h)
        c.restore()
      }
    }, { alpha: a })
    label(ctx, day, i === 1 ? 380 : 170, y + 200, a)
  })
}, 'The days blur together.', { wait: 2 })

export default {
  title: 'Numbers',
  pages: [arrive, sheet, blur],
}
