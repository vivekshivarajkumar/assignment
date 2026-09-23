// Chapter 14 · Apart — months of tour dates, and a bed with a gap in the middle.
import { vignette } from '../engine.js'
import {
  W, C, paper, wash, blob, line, text, caption, tapHint, panel, label, windowFrame, plant,
  note, heart, mira, person, rng, mix, clamp, easeOut, easeInOut, lerp,
} from '../paint.js'
import { pop, tone } from '../sound.js'

const GREY = 0.3
const G = (c) => mix(c, C.grey, GREY)

// ---------- the kitchen calendar ----------

const CAL = { x: 70, y: 170, w: 400, h: 600 }
const TOUR = [3, 8, 14, 20, 27]

// Which days of month m are his (tour), which are hers (work), which are still free for both.
function month(m) {
  const r = rng(1400 + m)
  const offset = (m * 3 + 2) % 7
  const days = m % 2 ? 30 : 31
  const cells = Array.from({ length: days }, (_, d) => ({ i: offset + d, day: d + 1 }))
  const weekend = (c) => c.i % 7 >= 5
  const order = [...cells].sort((a, b) => (m >= 3 ? weekend(b) - weekend(a) : 0) || r() - 0.5)
  const tour = new Set(order.slice(0, TOUR[m]).map((c) => c.i))
  return cells.map((c) => ({ ...c, kind: tour.has(c.i) ? 'tour' : weekend(c) ? 'free' : 'work' }))
}
const MONTHS = TOUR.map((_, m) => month(m))

function season(ctx, m, w, h) {
  const sky = [C.sky, '#e8c9a8', '#b9c3cc', '#dfe6ee', '#d5dde6'][m]
  wash(ctx, 0, 0, w, h, G(sky), 1410 + m)
  if (m === 0) blob(ctx, w / 2, h / 2, 50, 50, G('#f2c14e'), 1416)
  if (m === 1) for (let k = 0; k < 5; k++) blob(ctx, 60 + k * 70, 60 + (k % 2) * 60, 20, 12, G(['#d9826f', C.mira, '#c98a2a'][k % 3]), 1417 + k)
  if (m === 2) {
    for (const [dx, rr] of [[-40, 34], [0, 44], [44, 32]]) blob(ctx, w / 2 + dx, h / 2 - 30, rr, rr * 0.8, G(C.greyDark), 1422 + dx)
    for (let k = 0; k < 7; k++) line(ctx, w / 2 - 70 + k * 22, h / 2 + 20, w / 2 - 78 + k * 22, h / 2 + 50, G(C.teal), 3, k)
  }
  if (m >= 3) {
    const r = rng(1435 + m)
    for (let k = 0; k < (m === 3 ? 8 : 16); k++) {
      const x = 20 + r() * (w - 40)
      const y = 20 + r() * (h - 70)
      for (let a = 0; a < 3; a++) line(ctx, x - Math.cos(a) * 10, y - Math.sin(a) * 10, x + Math.cos(a) * 10, y + Math.sin(a) * 10, '#ffffff', 3, a)
    }
  }
  wash(ctx, 0, h - 40, w, 50, G(m >= 3 ? '#f4f4f4' : C.leaf), 1430 + m)
}

function calendarPage(ctx, m, back = false) {
  const { x, y, w, h } = CAL
  ctx.fillStyle = back ? G(C.paperDark) : '#fbf8f1'
  ctx.fillRect(x, y, w, h)
  if (back) return
  ctx.save()
  ctx.beginPath()
  ctx.rect(x + 16, y + 16, w - 32, 200)
  ctx.clip()
  ctx.translate(x + 16, y + 16)
  season(ctx, m, w - 32, 200)
  ctx.restore()
  const cw = (w - 32) / 7
  const ch = 56
  for (const c of MONTHS[m]) {
    const cx = x + 16 + (c.i % 7) * cw
    const cy = y + 240 + Math.floor(c.i / 7) * ch
    if (c.kind === 'tour') {
      wash(ctx, cx + 3, cy + 3, cw - 6, ch - 6, G(C.arun), 1440 + c.i)
      note(ctx, cx + cw / 2 - 4, cy + ch / 2 + 10, 0.5, C.cream)
    } else if (c.kind === 'work') wash(ctx, cx + 3, cy + 3, cw - 6, ch - 6, C.greyLight, 1480 + c.i)
    else heart(ctx, cx + cw / 2, cy + ch / 2 + 6, 0.55, G(C.rose))
    text(ctx, String(c.day), cx + 6, cy + 13, { size: 15, align: 'left', color: C.inkSoft })
  }
}

const calendar = (api) => {
  let m = 0
  let flipAt = null
  let doneAt = null
  return {
    debug: () => ({ tap: [CAL.x + CAL.w / 2, CAL.y + 400], done: doneAt !== null }),
    draw(ctx, t) {
      paper(ctx)
      wash(ctx, 0, 0, W, 960, G('#e6dccb'), 1401)
      // nail, string and binding
      line(ctx, W / 2, 120, CAL.x + 40, CAL.y, C.inkSoft, 2, 1)
      line(ctx, W / 2, 120, CAL.x + CAL.w - 40, CAL.y, C.inkSoft, 2, 2)
      blob(ctx, W / 2, 120, 6, 6, C.ink, 1405)
      ctx.save()
      ctx.shadowColor = 'rgba(0,0,0,0.2)'
      ctx.shadowBlur = 12
      ctx.shadowOffsetY = 6
      ctx.fillStyle = '#fbf8f1'
      ctx.fillRect(CAL.x, CAL.y, CAL.w, CAL.h)
      ctx.restore()
      calendarPage(ctx, Math.min(m + (flipAt !== null ? 1 : 0), TOUR.length - 1))
      if (flipAt !== null) {
        const k = easeInOut((t - flipAt) / 0.6)
        const sy = Math.cos(k * Math.PI)
        ctx.save()
        ctx.translate(0, CAL.y)
        ctx.scale(1, sy)
        ctx.translate(0, -CAL.y)
        calendarPage(ctx, m, sy < 0)
        ctx.restore()
        if (k >= 1) {
          m += 1
          flipAt = null
          if (m === TOUR.length - 1) {
            doneAt = t
            tone(196, 1.2, { gain: 0.05 })
          }
        }
      }
      // the kitchen counter, a mug and a thirsty plant in front
      wash(ctx, 0, 800, W, 160, G('#b9a58f'), 1402)
      plant(ctx, 470, 830, 1.1, G('#a9b88f'), 1403)
      wash(ctx, 50, 776, 52, 58, G(C.sky), 1404)
      ctx.fillStyle = C.ink
      ctx.fillRect(CAL.x - 6, CAL.y - 8, CAL.w + 12, 18)
      for (let k = 0; k < 12; k++) blob(ctx, CAL.x + 20 + k * 33, CAL.y, 5, 11, C.greyDark, 1406 + k)
      if (doneAt === null) {
        text(ctx, 'tap to turn the page', W / 2 + 20, 70, { size: 30 })
        if (flipAt === null) tapHint(ctx, CAL.x + CAL.w - 40, CAL.y + CAL.h - 40, t)
      } else {
        caption(ctx, 'His dates filled in. Their free days quietly disappeared.', easeOut((t - doneAt) / 0.6))
        tapHint(ctx, W - 50, 50, t)
      }
    },
    down(x, y, t) {
      if (doneAt !== null) {
        if (t - doneAt > 0.6) api.finish()
        return
      }
      if (flipAt === null) {
        flipAt = t
        pop(260 + m * 40)
      }
    },
  }
}

// ---------- in bed, back to back ----------

// Night light: grey the colour a little (Act IV), then darken it towards blue. Returns hex,
// because person() only accepts hex colours.
function night(c, k = 0.3) {
  const p = (h) => [16, 8, 0].map((sh) => (parseInt(h.slice(1), 16) >> sh) & 255)
  const [a, g, n] = [p(c), p(C.grey), p('#2c2d48')]
  return '#' + a.map((v, i) => Math.round(lerp(lerp(v, g[i], GREY), n[i], k)).toString(16).padStart(2, '0')).join('')
}

// Seen from above, someone lying on their side looks just like a profile: so the
// sleepers are ordinary figures, their bodies hidden under the blanket.
function sleeper(ctx, who, x, face, eyes) {
  const o = who === 'mira'
    ? { hair: C.miraHair, top: night(C.mira), bottom: night('#4b5a78'), skin: night(C.skin1, 0.2), hairStyle: 'bun' }
    : { hair: C.arunHair, top: night('#50627a'), bottom: night('#3b3a40'), skin: night(C.skin2, 0.2), hairStyle: 'short', scarf: undefined }
  person(ctx, { ...o, x, y: 690, s: 1.3, facing: face, pose: 'hug', eyes })
}

function glowPhone(ctx, x, y, lit) {
  if (lit > 0) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, 170)
    g.addColorStop(0, `rgba(190,220,240,${0.5 * lit})`)
    g.addColorStop(1, 'rgba(190,220,240,0)')
    ctx.fillStyle = g
    ctx.fillRect(x - 170, y - 170, 340, 340)
  }
  ctx.fillStyle = C.ink
  ctx.fillRect(x - 22, y - 38, 44, 76)
  ctx.fillStyle = mix('#222233', '#d6e8f2', lit)
  ctx.fillRect(x - 17, y - 30, 34, 60)
}

// Press and hold: her hand creeps across the gap, and stops just short.
const bed = (api) => {
  const HAND0 = 226
  const HAND1 = 300 // his back is at ~323: she stops just short
  let holding = false
  let reach = 0
  let reachedAt = null
  let doneAt = null
  return {
    debug: () => ({ hold: [225, 460], reach, done: doneAt !== null }),
    draw(ctx, t, dt) {
      if (reachedAt === null) {
        reach = clamp(reach + (holding ? dt / 2.4 : -dt / 1.0), 0, 1)
        if (reach >= 1) {
          reachedAt = t
          tone(220, 1.5, { type: 'sine', gain: 0.06 })
        }
      } else {
        if (t - reachedAt > 1.4) reach = clamp(reach - dt / 2, 0, 1)
        if (doneAt === null && t - reachedAt > 1.4) doneAt = t
      }
      const hisLight = reachedAt === null ? 1 : clamp(1 - (t - reachedAt) / 0.8, 0, 1)
      paper(ctx)
      wash(ctx, 0, 0, W, 960, '#34354f', 1460)
      wash(ctx, 10, 110, 520, 90, night('#6e5a50'), 1461) // headboard
      wash(ctx, 20, 190, 500, 780, night('#e4e0ea', 0.2), 1462) // sheet
      wash(ctx, 36, 215, 220, 160, night('#f4f1ea', 0.15), 1463)
      wash(ctx, 284, 215, 220, 160, night('#f4f1ea', 0.15), 1464)
      glowPhone(ctx, 60, 380, 1)
      // his phone slips down onto the pillow once he's gone to sleep
      glowPhone(ctx, 480, 380 + (1 - hisLight) * 30, hisLight)
      sleeper(ctx, 'mira', 170, -1, 'open')
      sleeper(ctx, 'arun', 370, 1, hisLight < 0.5 ? 'closed' : 'open')
      // the blanket: two long humps and a valley between them
      ctx.fillStyle = night('#8d9cc0')
      ctx.fillRect(24, 452, 492, 520)
      wash(ctx, 20, 440, 500, 540, night('#8d9cc0'), 1467)
      for (let k = 0; k < 6; k++) wash(ctx, 20, 490 + k * 80, 500, 14, night('#a9b5d2'), 1480 + k, 0.6)
      blob(ctx, 165, 720, 110, 280, night('#7686aa'), 1468)
      blob(ctx, 375, 720, 110, 280, night('#7686aa'), 1469)
      line(ctx, 270, 490, 272, 960, 'rgba(20,20,40,0.4)', 5, 7)
      // moonlight falling across the bed
      ctx.save()
      ctx.fillStyle = 'rgba(210,220,255,0.07)'
      ctx.beginPath()
      ctx.moveTo(330, 0)
      ctx.lineTo(470, 0)
      ctx.lineTo(260, 960)
      ctx.lineTo(120, 960)
      ctx.fill()
      ctx.restore()
      if (reach > 0) {
        const hx = lerp(HAND0, HAND1, easeOut(reach))
        line(ctx, 200, 452, hx - 14, 460, night(C.mira), 26, 8)
        blob(ctx, hx, 460, 17, 13, night(C.skin1, 0.2), 1472)
      }
      if (reachedAt !== null) {
        for (let k = 0; k < 3; k++) {
          const q = ((t - reachedAt) * 0.4 + k / 3) % 1
          text(ctx, 'z', 440 + q * 40, 230 - q * 80, { size: 24 + k * 4, color: C.cream, alpha: (1 - q) * 0.8 })
        }
      }
      if (doneAt === null) {
        if (reachedAt === null) {
          text(ctx, 'press and hold to reach out', W / 2 + 20, 60, { size: 30, color: C.cream })
          if (!holding) tapHint(ctx, 225, 460, t, C.cream)
        }
      } else {
        caption(ctx, "He was already asleep. She didn't wake him.", easeOut((t - doneAt) / 0.6))
        tapHint(ctx, W - 50, 50, t, C.cream)
      }
    },
    down(x, y, t) {
      if (doneAt !== null) {
        if (t - doneAt > 0.6) api.finish()
        return
      }
      holding = true
    },
    up() {
      holding = false
    },
  }
}

const morning = vignette((ctx, t) => {
  panel(ctx, 30, 100, 480, 400, (ctx, w, h) => {
    wash(ctx, 0, 0, w, h, G('#dcd6cc'), 1490)
    windowFrame(ctx, 300, 40, 140, 170, G('#dfe6ee'), 1491)
    wash(ctx, 0, 300, w, 100, G('#b9ab9c'), 1492)
    // the bed, his side smooth and empty
    wash(ctx, 30, 250, 440, 56, G('#e9e3f0'), 1493)
    wash(ctx, 30, 300, 440, 70, G('#a9a0b8'), 1494)
    wash(ctx, 370, 224, 90, 40, '#f4f1ea', 1495)
    blob(ctx, 415, 246, 16, 8, G(C.greyLight), 1496) // a dent where he slept
    mira(ctx, 130, 410, { pose: 'sit', eyes: 'down', grey: GREY })
  })
  panel(ctx, 30, 540, 480, 250, (ctx, w, h) => {
    wash(ctx, 0, 0, w, h, '#f4f1ea', 1497)
    ctx.save()
    ctx.translate(w / 2, h / 2)
    ctx.rotate(-0.06)
    ctx.fillStyle = '#fffdf6'
    ctx.shadowColor = 'rgba(0,0,0,0.15)'
    ctx.shadowBlur = 10
    ctx.fillRect(-150, -90, 300, 180)
    ctx.shadowColor = 'transparent'
    // his note: a violin, an arrow, a plane. No words.
    ctx.strokeStyle = C.inkSoft
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.ellipse(-95, 30, 24, 22, 0, 0, Math.PI * 2)
    ctx.moveTo(-81, 0)
    ctx.ellipse(-95, 0, 14, 14, 0, 0, Math.PI * 2)
    ctx.moveTo(-95, -14)
    ctx.lineTo(-95, -62)
    ctx.moveTo(-89, -66)
    ctx.arc(-95, -66, 6, 0, Math.PI * 2)
    ctx.moveTo(-130, 60)
    ctx.lineTo(-60, -40) // the bow
    ctx.stroke()
    ctx.setLineDash([8, 8])
    ctx.beginPath()
    ctx.moveTo(-50, 30)
    ctx.quadraticCurveTo(0, -40, 50, -10)
    ctx.stroke()
    ctx.setLineDash([])
    // a little plane
    ctx.beginPath()
    ctx.ellipse(90, -20, 36, 8, -0.3, 0, Math.PI * 2)
    ctx.moveTo(88, -20)
    ctx.lineTo(76, -54)
    ctx.lineTo(100, -26)
    ctx.moveTo(92, -14)
    ctx.lineTo(104, 16)
    ctx.lineTo(110, -18)
    ctx.moveTo(60, -10)
    ctx.lineTo(52, -26)
    ctx.stroke()
    heart(ctx, 110, 60, 0.5, G(C.arun))
    ctx.restore()
  }, { alpha: easeOut((t - 0.6) / 0.5) })
  label(ctx, 'In the morning', W / 2, 520, easeOut((t - 0.3) / 0.5))
}, 'He had left early for the next city.')

export default {
  title: 'Apart',
  pages: [calendar, bed, morning],
}
