// Chapter 10 · Moving In — Arun moves into Mira's flat. Her shelf is full,
// so some of her things go into a box to make room for his.
import { vignette } from '../engine.js'
import {
  W, H, C, paper, wash, blob, line, text, caption, tapHint, windowFrame,
  mira, arun, plant, heart, panel, label, dist, clamp, lerp, easeOut, inRect,
} from '../paint.js'
import { pop, tone, MELODY } from '../sound.js'

const fade = (t, t0) => easeOut((t - t0) / 0.5)

// Comic panel that pops in at time t0 (washes ignore globalAlpha, so it scales in too).
function reveal(ctx, t, t0, x, y, w, h, draw) {
  if (t < t0) return
  const k = easeOut((t - t0) / 0.4)
  ctx.save()
  ctx.translate(x + w / 2, y + h / 2)
  ctx.scale(lerp(0.9, 1, k), lerp(0.9, 1, k))
  ctx.translate(-(x + w / 2), -(y + h / 2))
  panel(ctx, x, y, w, h, draw, { alpha: k })
  ctx.restore()
}

// ---------- things ----------
// Each is drawn standing on (0, 0), about 100px wide and up to 110px tall.

const MUSTARD = C.mira
const RUST = C.arun

const things = {
  // hers: tidy, practical, mustard and cream
  binders(ctx) {
    for (let i = 0; i < 3; i++) {
      wash(ctx, -42 + i * 28, -100, 24, 100, i === 1 ? '#c98f2e' : MUSTARD, 1001 + i)
      wash(ctx, -38 + i * 28, -80, 16, 14, C.cream, 1004 + i)
    }
  },
  books(ctx) {
    const cols = [C.cream, '#cdbb97', MUSTARD, '#e8d6b0']
    cols.forEach((c, i) => wash(ctx, -44 + i * 20, -84 + (i % 2) * 8, 18, 84 - (i % 2) * 8, c, 1007 + i))
    ctx.save()
    ctx.translate(40, 0)
    ctx.rotate(0.3)
    wash(ctx, -9, -80, 18, 80, '#c98f2e', 1011)
    ctx.restore()
  },
  mug(ctx) {
    wash(ctx, -24, -56, 48, 56, MUSTARD, 1012)
    ctx.save()
    ctx.strokeStyle = MUSTARD
    ctx.lineWidth = 7
    ctx.beginPath()
    ctx.arc(28, -30, 13, -1.3, 1.3)
    ctx.stroke()
    ctx.restore()
    wash(ctx, -12, -40, 24, 14, C.cream, 1013)
  },
  calculator(ctx) {
    ctx.save()
    ctx.rotate(-0.08)
    wash(ctx, -32, -86, 64, 86, C.greyDark, 1014)
    wash(ctx, -24, -78, 48, 18, '#cfd8c8', 1015)
    for (let i = 0; i < 9; i++) blob(ctx, -16 + (i % 3) * 16, -48 + Math.floor(i / 3) * 14, 5, 4, C.cream, 1016 + i)
    ctx.restore()
  },
  vase(ctx) {
    for (let i = 0; i < 4; i++) line(ctx, 0, -60, -24 + i * 16, -110 + (i % 2) * 10, '#9a7a48', 3, 1025 + i)
    for (let i = 0; i < 4; i++) blob(ctx, -24 + i * 16, -110 + (i % 2) * 10, 8, 6, MUSTARD, 1029 + i)
    blob(ctx, 0, -30, 26, 30, C.cream, 1033)
    wash(ctx, -10, -66, 20, 14, C.cream, 1034)
  },
  clock(ctx) {
    blob(ctx, 0, -44, 38, 38, MUSTARD, 1035)
    blob(ctx, 0, -44, 28, 28, C.cream, 1036)
    line(ctx, 0, -44, 0, -64, C.ink, 3, 1037)
    line(ctx, 0, -44, 12, -40, C.ink, 3, 1038)
    blob(ctx, -26, -82, 9, 7, C.ink, 1039)
    blob(ctx, 26, -82, 9, 7, C.ink, 1040)
  },
  frame(ctx) {
    wash(ctx, -40, -96, 80, 96, '#c98f2e', 1041)
    wash(ctx, -30, -86, 60, 76, C.cream, 1042)
    // a child's drawing: a sun and a house, in faded crayon
    blob(ctx, 14, -70, 9, 9, '#f2c14e', 1043)
    wash(ctx, -20, -42, 26, 22, C.rose, 1044, 0.8)
    line(ctx, -24, -42, -7, -58, C.rose, 3, 1045)
    line(ctx, -7, -58, 10, -42, C.rose, 3, 1046)
  },
  candle(ctx) {
    wash(ctx, -18, -70, 36, 70, C.cream, 1047)
    line(ctx, 0, -70, 0, -80, C.ink, 2, 1048)
    blob(ctx, 0, -90, 7, 12, '#f2c14e', 1049)
    wash(ctx, -30, -8, 60, 8, MUSTARD, 1050)
  },
  cactus(ctx) {
    wash(ctx, -24, -36, 48, 36, MUSTARD, 1051)
    blob(ctx, 0, -64, 16, 30, C.leaf, 1052)
    blob(ctx, -18, -66, 8, 14, C.leaf, 1053)
  },
  // his: music things, rust and wood
  metronome(ctx) {
    ctx.fillStyle = RUST
    ctx.beginPath()
    ctx.moveTo(-34, 0)
    ctx.lineTo(-14, -104)
    ctx.lineTo(14, -104)
    ctx.lineTo(34, 0)
    ctx.closePath()
    ctx.fill()
    wash(ctx, -18, -80, 36, 60, '#f3dccb', 1054)
    line(ctx, 0, -24, 10, -90, C.ink, 3, 1055)
    blob(ctx, 7, -66, 6, 5, C.ink, 1056)
  },
  records(ctx) {
    for (let i = 0; i < 3; i++) {
      ctx.save()
      ctx.translate(-20 + i * 20, 0)
      ctx.rotate(-0.12 + i * 0.12)
      wash(ctx, -38, -92, 76, 92, [RUST, '#8a3d30', '#d98a6a'][i], 1057 + i)
      blob(ctx, 0, -46, 16, 16, C.ink, 1060 + i, 0.8)
      ctx.restore()
    }
  },
  plant(ctx) {
    plant(ctx, 0, 0, 1.5, C.leaf, 1063)
  },
  music(ctx) {
    wash(ctx, -40, -100, 80, 100, RUST, 1070)
    wash(ctx, -32, -92, 64, 84, C.cream, 1071)
    for (let k = 0; k < 4; k++) line(ctx, -26, -80 + k * 16, 26, -80 + k * 16, C.inkSoft, 1.5, 1072 + k)
    blob(ctx, -10, -64, 5, 4, C.ink, 1076)
    blob(ctx, 10, -48, 5, 4, C.ink, 1077)
  },
}

// shelf: 3 rows x 3 columns; slot (x, y) is where a thing stands
const SLOTS = []
for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) SLOTS.push([130 + col * 140, 300 + row * 140])
const HERS = ['binders', 'clock', 'books', 'vase', 'frame', 'mug', 'calculator', 'candle', 'cactus']
const HIS = ['metronome', 'records', 'plant', 'music']
const STORE = { x: 40, y: 720, w: 200, h: 150 }
const HOME = [[330, 740], [450, 740], [330, 880], [450, 880]] // his things, in his open box

function shelfFrame(ctx) {
  wash(ctx, 50, 150, 440, 460, '#8a5a3c', 1080)
  wash(ctx, 62, 162, 416, 436, '#f1e2c8', 1081)
  for (let row = 0; row < 3; row++) wash(ctx, 56, 300 + row * 140, 428, 14, '#8a5a3c', 1082 + row)
}

function room(ctx) {
  wash(ctx, 0, 0, W, 660, '#efd9b5', 1086)
  wash(ctx, 0, 640, W, 320, '#b9926c', 1087)
  for (let i = 0; i < 4; i++) line(ctx, 0, 690 + i * 70, W, 686 + i * 70, 'rgba(80,50,30,0.2)', 2, 1088 + i)
}

function drawThing(ctx, kind, x, y, s = 1, rot = 0) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  ctx.scale(s, s)
  things[kind](ctx)
  ctx.restore()
}

const shelf = (api) => {
  const slots = HERS.map((kind) => ({ kind, his: false, at: 0 }))
  const his = HIS.map((kind, i) => ({ kind, x: HOME[i][0], y: HOME[i][1], placed: false }))
  const stored = [] // { kind, from: [x, y], at }
  let drag = null
  let doneAt = null
  let fullAt = -10

  const empty = () => slots.findIndex((s) => s === null)
  const loose = () => his.filter((h) => !h.placed)
  const slotHit = (x, y) => SLOTS.findIndex(([sx, sy]) => Math.abs(x - sx) < 65 && y < sy + 10 && y > sy - 125)

  return {
    debug: () => {
      const h = loose()[0]
      if (!h) return []
      const e = empty()
      if (e >= 0) return [{ from: [h.x, h.y - 40], to: [SLOTS[e][0], SLOTS[e][1] - 40] }]
      const i = slots.findIndex((s) => s && !s.his)
      return [{ tap: [SLOTS[i][0], SLOTS[i][1] - 40] }]
    },
    draw(ctx, t) {
      paper(ctx)
      room(ctx)
      shelfFrame(ctx)

      // things on the shelf
      slots.forEach((s, i) => {
        if (!s) return
        const [x, y] = SLOTS[i]
        const k = s.his ? easeOut((t - s.at) / 0.3) : 1
        const wob = !s.his && t - fullAt < 0.4 ? Math.sin(t * 50) * 0.05 : 0
        drawThing(ctx, s.kind, x, y, lerp(1.15, 1, k), wob)
      })

      // the storage box, filling up with her things
      wash(ctx, STORE.x, STORE.y, STORE.w, STORE.h, '#c9a46a', 1092)
      stored.forEach((s, i) => {
        const k = easeOut((t - s.at) / 0.45)
        const tx = STORE.x + 45 + i * 38
        const ty = STORE.y + 30
        ctx.save()
        ctx.beginPath()
        ctx.rect(0, 0, W, k < 1 ? H : ty)
        ctx.clip()
        drawThing(ctx, s.kind, lerp(s.from[0], tx, k), lerp(s.from[1], ty + 20, k) - Math.sin(k * Math.PI) * 60, lerp(1, 0.6, k))
        ctx.restore()
      })
      wash(ctx, STORE.x, STORE.y + 20, STORE.w, STORE.h - 20, '#c9a46a', 1093)
      wash(ctx, STORE.x - 10, STORE.y, 40, 20, '#b08a52', 1094)
      wash(ctx, STORE.x + STORE.w - 30, STORE.y, 40, 20, '#b08a52', 1095)
      wash(ctx, STORE.x + 60, STORE.y + 70, 80, 16, C.cream, 1096, 0.8)

      // his open box and the things still in it
      wash(ctx, 280, 760, 220, 150, '#b08a52', 1097)
      for (const h of loose()) if (h !== drag) drawThing(ctx, h.kind, h.x, h.y, 0.85)
      wash(ctx, 280, 800, 220, 110, '#c9a46a', 1098)
      for (const h of loose()) if (h !== drag && h.y < 800) drawThing(ctx, h.kind, h.x, h.y, 0.85)
      if (drag) drawThing(ctx, drag.kind, drag.x, drag.y, 1.05)

      if (doneAt === null) {
        const e = empty()
        const msg = e < 0 ? 'the shelf is full: tap some of her things' : 'drag his things onto the shelf'
        text(ctx, msg, W / 2, 80, { size: 27, color: C.inkSoft, maxWidth: 360 })
        if (t - fullAt < 1.2) {
          text(ctx, 'the box is full', W / 2, 690, { size: 26, color: C.arun, alpha: 1 - (t - fullAt) / 1.2 })
        }
        if (!drag) {
          if (e < 0) tapHint(ctx, SLOTS[4][0], SLOTS[4][1] - 50, t)
          else if (loose()[0]) tapHint(ctx, loose()[0].x, loose()[0].y - 50, t)
        }
      } else {
        heart(ctx, W / 2, 110 - fade(t, doneAt) * 20, 1.2 * fade(t, doneAt), C.rose)
        caption(ctx, 'There was room after all.', fade(t, doneAt))
        tapHint(ctx, W - 50, 50, t)
      }
    },
    down(x, y, t) {
      if (doneAt !== null) {
        if (t - doneAt > 0.6) api.finish()
        return
      }
      // pick up one of his things
      const h = [...loose()].reverse().find((q) => dist(x, y, q.x, q.y - 40) < 65)
      if (h) {
        drag = h
        drag.ox = x - h.x
        drag.oy = y - h.y
        pop(420)
        return
      }
      // tap one of hers into the storage box
      const i = slotHit(x, y)
      if (i < 0 || !slots[i] || slots[i].his) return
      if (stored.length >= HIS.length) {
        fullAt = t
        pop(200)
        return
      }
      stored.push({ kind: slots[i].kind, from: SLOTS[i], at: t })
      slots[i] = null
      pop(520 + stored.length * 40)
    },
    move(x, y) {
      if (!drag) return
      drag.x = clamp(x - drag.ox, 40, W - 40)
      drag.y = clamp(y - drag.oy, 160, H - 20)
    },
    up(x, y, t) {
      if (!drag) return
      const h = drag
      drag = null
      const i = slotHit(h.x, h.y - 40)
      if (i >= 0 && slots[i] === null) {
        slots[i] = { kind: h.kind, his: true, at: t }
        h.placed = true
        tone(MELODY[his.filter((q) => q.placed).length + 4], 0.5)
        if (loose().length === 0) {
          doneAt = t
          api.memory.shelf = slots.map((s) => s.kind)
        }
      } else {
        // back into his box
        const k = HIS.indexOf(h.kind)
        h.x = HOME[k][0]
        h.y = HOME[k][1]
      }
    },
  }
}

// He arrives with boxes; she gives him a key.
const arrive = vignette((ctx, t) => {
  panel(ctx, 30, 100, 480, 400, (c, w) => {
    wash(c, -10, -10, w + 20, 420, '#efd9b5', 1100)
    windowFrame(c, 40, 50, 120, 150, '#f2c98a', 1101)
    blob(c, 100, 90, 30, 30, '#e88a6a', 1102, 0.6)
    wash(c, -10, 330, w + 20, 90, '#b9926c', 1103)
    // his boxes stacked in the doorway
    wash(c, 300, 270, 110, 80, '#c9a46a', 1104)
    wash(c, 310, 200, 90, 72, '#b08a52', 1105)
    wash(c, 330, 160, 50, 44, '#c9a46a', 1106)
    arun(c, 420, 380, { s: 0.85, facing: -1, pose: 'wave', t, mouth: 'smile' })
    // violin case on his back
    c.save()
    c.translate(452, 230)
    c.rotate(0.35)
    blob(c, 0, 0, 16, 60, '#5c3c2a', 1107)
    c.restore()
    mira(c, 150, 380, { s: 0.85, mouth: 'smile' })
  })
  label(ctx, 'October', 270, 500, fade(t, 0.3))
  reveal(ctx, t, 0.9, 30, 540, 480, 210, (c, w, h) => {
    wash(c, -10, -10, w + 20, h + 20, '#f7e3b5', 1108)
    // her hand passes him a key on a mustard ring
    wash(c, -10, 90, 200, 50, C.mira, 1109)
    blob(c, 200, 110, 34, 26, C.skin1, 1110)
    wash(c, 300, 90, 200, 50, '#50627a', 1111)
    blob(c, 290, 116, 34, 26, C.skin2, 1112)
    const k = easeOut((t - 1.3) / 0.6)
    const kx = lerp(228, 262, k)
    c.save()
    c.strokeStyle = C.mira
    c.lineWidth = 5
    c.beginPath()
    c.arc(kx, 100, 12, 0, Math.PI * 2)
    c.stroke()
    c.restore()
    wash(c, kx + 8, 94, 40, 10, '#c9c2b0', 1113)
    wash(c, kx + 36, 102, 8, 10, '#c9c2b0', 1114)
  })
}, 'Three boxes, one violin, and a key.', { wait: 1.8 })

// Evening: the shelf as the player left it, and the two of them on her sofa.
const DEFAULT_SHELF = ['binders', 'metronome', 'books', 'records', 'frame', 'mug', 'plant', 'candle', 'music']
const home = (api) => vignette((ctx, t) => {
  const kinds = api.memory.shelf ?? DEFAULT_SHELF
  panel(ctx, 30, 100, 480, 380, (c, w) => {
    wash(c, -10, -10, w + 20, 400, '#efd9b5', 1115)
    c.save()
    c.translate(240, 160)
    c.scale(0.72, 0.72)
    c.translate(-270, -380)
    shelfFrame(c)
    kinds.forEach((k, i) => drawThing(c, k, SLOTS[i][0], SLOTS[i][1]))
    c.restore()
  })
  label(ctx, 'Home', 270, 480, fade(t, 0.3))
  reveal(ctx, t, 0.9, 30, 520, 480, 230, (c, w, h) => {
    wash(c, -10, -10, w + 20, h + 20, '#35365a', 1116)
    blob(c, 420, 40, 60, 50, '#fff3c4', 1117, 0.35) // lamp light
    wash(c, 60, 130, 380, 90, '#6d7f92', 1118) // sofa
    wash(c, 50, 100, 380, 50, '#7f91a3', 1119)
    blob(c, 110, 130, 28, 22, C.mira, 1120) // cushions
    blob(c, 380, 130, 28, 22, C.arun, 1121)
    mira(c, 170, 225, { s: 0.55, pose: 'sit', mouth: 'smile', eyes: 'closed' })
    arun(c, 310, 230, { s: 0.55, facing: -1, pose: 'violin', t, mouth: 'smile', eyes: 'closed' })
    for (let i = 0; i < 3; i++) {
      const q = (t * 0.3 + i / 3) % 1
      c.save()
      c.globalAlpha = Math.sin(q * Math.PI)
      c.fillStyle = C.arun
      c.beginPath()
      c.ellipse(260 - q * 40 + i * 20, 70 - q * 50, 6, 4, -0.4, 0, Math.PI * 2)
      c.fill()
      c.restore()
    }
  })
}, 'Mustard and rust, side by side.', { wait: 1.8 })(api)

export default {
  title: 'Moving In',
  pages: [arrive, shelf, home],
}
