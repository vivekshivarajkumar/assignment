// Chapter 1 · Morning — the alarm, the toothbrush, the same grey day again.
import { vignette } from '../engine.js'
import {
  W, H, C, paper, wash, blob, line, text, tapHint, windowFrame, panel, label,
  mira, person, rng, clamp, dist, easeOut, lerp,
} from '../paint.js'
import { pop, tone } from '../sound.js'

const GREY = 0.65 // Mira's colour is mostly drained in Act I

function bedroom(ctx) {
  wash(ctx, 0, 0, W, H, C.greyLight, 101)
  windowFrame(ctx, 300, 120, 180, 220, '#c8cdd2', 102)
  wash(ctx, 0, 640, W, 320, C.grey, 103)
  // bed and pillow
  wash(ctx, 40, 560, 380, 120, '#cfcac3', 104)
  wash(ctx, 50, 540, 110, 50, C.cream, 124)
  wash(ctx, 30, 520, 30, 200, C.greyDark, 105)
}

function sleepingMira(ctx, sitUp) {
  ctx.save()
  if (sitUp) {
    mira(ctx, 200, 690, { pose: 'sit', grey: GREY, eyes: 'down' })
  } else {
    ctx.translate(360, 610)
    ctx.rotate(-Math.PI / 2)
    mira(ctx, 0, 0, { s: 0.9, grey: GREY, eyes: 'closed' })
  }
  ctx.restore()
  // blanket
  wash(ctx, sitUp ? 150 : 170, 580, sitUp ? 270 : 250, 110, '#a9b1ba', 106)
}

function alarmClock(ctx, x, y, ringing, t) {
  const shake = ringing ? Math.sin(t * 60) * 5 : 0
  ctx.save()
  ctx.translate(x + shake, y)
  blob(ctx, 0, 0, 44, 44, ringing ? '#d9826f' : C.greyDark, 107)
  ctx.fillStyle = C.cream
  ctx.beginPath()
  ctx.arc(0, 0, 32, 0, Math.PI * 2)
  ctx.fill()
  line(ctx, 0, 0, 0, -22, C.ink, 4, 1)
  line(ctx, 0, 0, 16, 6, C.ink, 4, 2)
  for (const d of [-1, 1]) {
    blob(ctx, d * 30, -40, 14, 12, C.ink, 108 + d)
  }
  ctx.restore()
  if (ringing) {
    for (let i = 0; i < 3; i++) {
      const k = (t * 3 + i / 3) % 1
      ctx.save()
      ctx.globalAlpha = 1 - k
      ctx.strokeStyle = C.ink
      ctx.lineWidth = 3
      for (const d of [-1, 1]) {
        ctx.beginPath()
        ctx.arc(x, y, 55 + k * 40, d < 0 ? Math.PI - 0.5 : -0.5, d < 0 ? Math.PI + 0.5 : 0.5)
        ctx.stroke()
      }
      ctx.restore()
    }
  }
}

// Tap the alarm. It snoozes, rings again, and on the third tap Mira gets up.
const alarm = (api) => {
  const CLOCK = { x: W / 2, y: 750 }
  let taps = 0
  let quietAt = -10
  let ringing = true
  let doneAt = null
  let lastBeep = 0
  return {
    draw(ctx, t) {
      paper(ctx, '#3b3f4a')
      if (!ringing && taps < 3 && t - quietAt > 1.6) ringing = true
      if (ringing && t - lastBeep > 0.5) {
        lastBeep = t
        tone(1320, 0.15, { type: 'square', gain: 0.03 })
      }
      // top panel: the bedroom (a crop of the full room)
      panel(ctx, 20, 20, W - 40, 520, (ctx) => {
        ctx.translate(-20, -230)
        bedroom(ctx)
        wash(ctx, 390, 560, 110, 150, '#bdb4a8', 109)
        sleepingMira(ctx, doneAt !== null)
      })
      // bottom panel: the alarm clock close-up
      const a2 = easeOut((t - 0.5) / 0.5)
      panel(ctx, 20, 600, W - 40, 340, (ctx, w, h) => {
        wash(ctx, 0, 0, w, h, '#cfd3d6', 130)
        wash(ctx, -10, 210, w + 20, 140, '#a8a39b', 131)
        ctx.translate(w / 2, 150)
        ctx.scale(1.9, 1.9)
        alarmClock(ctx, 0, 0, ringing, t)
      }, { alpha: a2 })
      label(ctx, doneAt === null ? 'Mira, 25 years old' : 'Every day starts the same way.', W / 2, 565, a2)
      if (doneAt === null) {
        if (ringing && t > 1) {
          text(ctx, taps === 0 ? 'tap the alarm' : 'again...', W / 2, 910, { size: 28, color: C.ink })
          tapHint(ctx, CLOCK.x, CLOCK.y - 110, t)
        }
      } else tapHint(ctx, W - 50, 50, t, C.cream)
    },
    down(x, y, t) {
      if (doneAt !== null) {
        if (t - doneAt > 0.6) api.finish()
        return
      }
      if (ringing && t > 0.8 && dist(x, y, CLOCK.x, CLOCK.y) < 130) {
        ringing = false
        quietAt = t
        taps += 1
        pop(300)
        if (taps === 3) doneAt = t
      }
    },
  }
}

// Drag back and forth across the teeth. Foam builds up; enough strokes and she's done.
const brush = (api) => {
  const NEEDED = 14
  let strokes = 0
  let lastDir = 0
  let brushX = 270
  let dragging = false
  let lastX = 0
  let doneAt = null
  const foam = []
  const r = rng(12)
  return {
    draw(ctx, t) {
      paper(ctx, '#3b3f4a')
      // bathroom mirror close-up, as one big panel
      panel(ctx, 20, 20, W - 40, 720, (ctx, w, h) => {
        wash(ctx, 0, 0, w, h, '#cfd3d4', 110)
        wash(ctx, 30, 60, w - 60, 620, '#e3e6e6', 111)
      })
      ctx.save()
      ctx.beginPath()
      ctx.rect(20, 20, W - 40, 720)
      ctx.clip()
      // face, big
      ctx.save()
      ctx.translate(W / 2, 400)
      blob(ctx, 0, 0, 170, 200, C.skin1, 112)
      ctx.fillStyle = C.miraHair
      ctx.beginPath()
      ctx.ellipse(0, -90, 175, 125, 0, Math.PI, Math.PI * 2)
      ctx.fill()
      ctx.fillRect(-175, -92, 34, 150)
      ctx.fillRect(141, -92, 34, 150)
      ctx.beginPath()
      ctx.arc(60, -225, 55, 0, Math.PI * 2)
      ctx.fill()
      // sleepy eyes
      ctx.strokeStyle = C.ink
      ctx.lineWidth = 5
      for (const d of [-1, 1]) {
        ctx.beginPath()
        ctx.arc(d * 60, -20, 20, 0.2, Math.PI - 0.2)
        ctx.stroke()
      }
      // mouth with teeth
      ctx.fillStyle = '#7a3b3b'
      ctx.beginPath()
      ctx.ellipse(0, 100, 90, 42, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = C.cream
      ctx.fillRect(-72, 76, 144, 26)
      ctx.restore()

      for (const f of foam) blob(ctx, f.x, f.y, f.r, f.r * 0.8, '#ffffff', f.s, 0.9)

      // toothbrush follows the finger
      const bx = brushX
      wash(ctx, bx + 30, 486, 260, 26, '#7fb3c9', 113)
      wash(ctx, bx - 20, 470, 60, 30, '#f5f5f5', 114)
      ctx.restore()
      ctx.strokeStyle = C.ink
      ctx.lineWidth = 5
      ctx.strokeRect(20, 20, W - 40, 720)

      const p = clamp(strokes / NEEDED, 0, 1)
      wash(ctx, 80, 780, (W - 160) * p + 1, 18, C.teal, 115)
      ctx.strokeStyle = C.cream
      ctx.lineWidth = 2
      ctx.strokeRect(80, 780, W - 160, 18)
      if (doneAt === null) {
        text(ctx, 'drag side to side to brush', W / 2, 850, { size: 28, color: C.cream })
        if (!dragging) tapHint(ctx, bx, 490, t)
      } else {
        label(ctx, 'Brush. Rinse. Repeat.', W / 2, 740, easeOut((t - doneAt) / 0.6))
        tapHint(ctx, W - 50, 50, t)
      }
    },
    down(x, y, t) {
      if (doneAt !== null) {
        if (t - doneAt > 0.6) api.finish()
        return
      }
      dragging = true
      lastX = x
    },
    move(x, y, t) {
      if (!dragging || doneAt !== null) return
      brushX = clamp(lerp(brushX, x, 0.6), 160, 380)
      const dx = x - lastX
      if (Math.abs(dx) > 12) {
        const dir = Math.sign(dx)
        if (dir !== lastDir) {
          lastDir = dir
          strokes += 1
          pop(200 + strokes * 20)
          foam.push({ x: 200 + r() * 140, y: 470 + r() * 50, r: 12 + r() * 16, s: strokes })
          if (strokes >= NEEDED) doneAt = t
        }
        lastX = x
      }
    },
    up() {
      dragging = false
    },
  }
}

const leaving = vignette((ctx, t) => {
  paper(ctx, '#3b3f4a')
  panel(ctx, 20, 20, W - 40, 470, (ctx) => {
    ctx.translate(-20, -220)
    wash(ctx, 0, 0, W, H, C.greyLight, 120)
    // stairwell door
    wash(ctx, 300, 260, 170, 380, C.greyDark, 121)
    blob(ctx, 440, 460, 8, 8, C.ink, 122)
    wash(ctx, 0, 640, W, 320, C.grey, 123)
    mira(ctx, 160 + Math.min(t, 2) * 30, 700, { pose: 'walk', t, grey: GREY, eyes: 'down' })
  })
  // the street: a crowd of grey commuters, Mira one of them
  panel(ctx, 20, 510, W - 40, 300, (ctx, w, h) => {
    wash(ctx, 0, 0, w, h, '#c3c6c9', 124)
    for (let i = 0; i < 6; i++) wash(ctx, i * 90 - 20, 20 + (i % 3) * 20, 80, 200, C.grey, 125 + i)
    wash(ctx, 0, 230, w, 80, C.greyDark, 131)
    const walk = t * 20
    for (let i = 0; i < 7; i++) {
      const x = ((i * 83 + walk) % (w + 80)) - 40
      person(ctx, { x, y: h + 20, s: 0.62, top: C.greyDark, bottom: '#6f6b67', hair: '#55514e', skin: '#a9a39c', pose: 'walk', t: t + i })
    }
    mira(ctx, w / 2, h + 20, { s: 0.62, pose: 'walk', t, grey: GREY, eyes: 'down' })
  }, { alpha: easeOut((t - 0.4) / 0.5) })
}, 'She is good at her job. She is tired.')

export default {
  title: 'Morning',
  pages: [alarm, brush, leaving],
}
