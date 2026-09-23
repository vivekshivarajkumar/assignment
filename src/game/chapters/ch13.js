// Chapter 13 · Groceries — a small argument in a supermarket aisle that isn't
// about groceries at all. The colour has started to leave again.
import { vignette } from '../engine.js'
import {
  W, C, wash, blob, line, panel, label, phone, mira, arun, rng, mix, easeOut,
} from '../paint.js'
import { bubblePuzzle, icons } from '../bubblePuzzle.js'

const GREY = 0.3 // Act IV: the colour drains, partly
const G = (c) => mix(c, C.grey, GREY)
const GOODS = [C.arun, C.mira, C.teal, C.sky, C.rose, C.leaf, C.plum, '#f2c14e', C.cream]

// A supermarket shelf unit, drawn across the full width from y = 0.
function aisle(ctx, h = 700) {
  wash(ctx, 0, 0, W, h, G('#e4e0d6'), 1301)
  for (let k = 0; k < 3; k++) wash(ctx, 40 + k * 170, 18, 120, 12, '#f7f5ee', 1302 + k) // strip lights
  const r = rng(1310)
  for (let s = 0; s < 4; s++) {
    const base = 150 + s * 120
    for (let x = 16; x < W - 30; ) {
      const w = 22 + r() * 22
      const hh = 36 + r() * 50
      const tall = r() < 0.3
      ctx.fillStyle = G(GOODS[Math.floor(r() * GOODS.length)])
      if (tall) {
        ctx.fillRect(x + w * 0.3, base - hh - 16, w * 0.4, 18)
        ctx.fillRect(x, base - hh, w, hh)
      } else ctx.fillRect(x, base - hh * 0.7, w, hh * 0.7)
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.fillRect(x + 4, base - hh * 0.5, w - 8, 6)
      x += w + 4 + r() * 6
    }
    wash(ctx, 0, base, W, 14, G('#a9a39c'), 1320 + s)
  }
  wash(ctx, 0, 620, W, h - 620 + 20, G('#cfc9bf'), 1330)
}

function basket(ctx, x, y) {
  wash(ctx, x - 40, y, 80, 50, G('#c4533f'), 1340)
  line(ctx, x - 30, y + 2, x - 12, y - 36, C.ink, 4, 1)
  line(ctx, x + 30, y + 2, x + 12, y - 36, C.ink, 4, 2)
  blob(ctx, x - 16, y - 4, 14, 12, G(C.leaf), 1341)
  blob(ctx, x + 14, y - 2, 12, 12, G('#f2c14e'), 1342)
}

function buzz(ctx, x, y, t, rad) {
  const k = (t * 2) % 1
  ctx.save()
  ctx.globalAlpha = 1 - k
  ctx.strokeStyle = C.ink
  ctx.lineWidth = 3
  for (const d of [-1, 1]) {
    ctx.beginPath()
    ctx.arc(x, y, rad + k * 20, d < 0 ? Math.PI - 0.5 : -0.5, d < 0 ? Math.PI + 0.5 : 0.5)
    ctx.stroke()
  }
  ctx.restore()
}

const shopping = vignette((ctx, t) => {
  panel(ctx, 30, 100, 480, 420, (ctx) => {
    ctx.translate(-30, -150)
    aisle(ctx, 720)
    mira(ctx, 150, 760, { grey: GREY, eyes: 'open' })
    basket(ctx, 190, 612)
    arun(ctx, 380, 760, { grey: GREY, pose: 'hug', facing: -1, eyes: 'down' })
    phone(ctx, 312, 496, 30, 50, '#d9e6ea')
    buzz(ctx, 327, 520, t, 34)
  })
  panel(ctx, 30, 560, 480, 230, (ctx, w, h) => {
    wash(ctx, 0, 0, w, h, G('#e4e0d6'), 1350)
    const shake = Math.sin(t * 50) * (t % 1 < 0.4 ? 3 : 0)
    ctx.save()
    ctx.translate(w / 2 + shake, 20)
    blob(ctx, -70, 150, 40, 60, C.skin2, 1351)
    phone(ctx, -60, 0, 120, 200, '#d9e6ea')
    blob(ctx, 0, 70, 36, 30, G(C.arun), 1352)
    ctx.fillStyle = C.cream
    ctx.fillRect(-40, 118, 80, 8)
    ctx.fillRect(-28, 134, 56, 6)
    blob(ctx, 46, 20, 14, 14, '#d9534f', 1353)
    blob(ctx, 70, 150, 40, 58, C.skin2, 1354)
    ctx.restore()
    buzz(ctx, w / 2, 110, t, 80)
  }, { alpha: easeOut((t - 0.6) / 0.5) })
  label(ctx, 'Saturday, the big supermarket', W / 2, 540, easeOut((t - 0.3) / 0.5))
}, 'His phone had not stopped buzzing all morning.')

const argue = bubblePuzzle({
  scene(ctx) {
    ctx.save()
    ctx.globalAlpha = 0.9
    aisle(ctx, 960)
    ctx.restore()
    mira(ctx, 150, 940, { s: 0.55, grey: GREY })
    arun(ctx, 390, 940, { s: 0.55, facing: -1, grey: GREY, eyes: 'down' })
  },
  bubbles: [
    { speaker: 'mira', pieces: 5, hard: true, icon: icons.row(icons.clock, icons.question) },
    { speaker: 'arun', pieces: 5, hard: true, icon: icons.money },
    { speaker: 'mira', pieces: 5, hard: true, icon: icons.storm },
    { speaker: 'arun', pieces: 5, hard: true, icon: icons.row(icons.storm, icons.question) },
  ],
  caption: 'Neither of them remembered what they came in for.',
})

function bag(ctx, x, y, s = 1, seed = 1360) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  line(ctx, -8, -30, 4, -80, G('#3a7a4a'), 7, 1) // a leek, of course
  blob(ctx, 6, -86, 8, 14, G(C.leaf), seed + 1)
  blob(ctx, 20, -40, 16, 14, G('#e2cfa8'), seed + 2)
  wash(ctx, -30, -40, 60, 80, G('#c8a57a'), seed)
  ctx.restore()
}

const walkHome = vignette((ctx, t) => {
  panel(ctx, 30, 100, 480, 400, (ctx, w, h) => {
    wash(ctx, 0, 0, w, h, G('#c9b8c4'), 1361)
    // houses slide past
    const off = (t * 18) % 160
    for (let k = -1; k < 5; k++) {
      const x = k * 160 - off
      wash(ctx, x, 110 + (k % 2) * 30, 130, 200, G(k % 2 ? '#a9a39c' : '#b8aa9c'), 1362 + ((k + 1) % 4))
      wash(ctx, x + 30, 160 + (k % 2) * 30, 30, 36, G('#f2d58a'), 1366, 0.8)
    }
    wash(ctx, 0, 300, w, 100, G('#9a948d'), 1370)
    const px = 60 + ((600 - t * 60) % 600)
    line(ctx, px, 60, px, 330, C.ink, 5, 3)
    blob(ctx, px, 56, 12, 8, G('#f2d58a'), 1371)
    mira(ctx, 120, 380, { s: 0.85, pose: 'walk', t, grey: GREY, eyes: 'down' })
    bag(ctx, 165, 300, 0.8, 1372)
    bag(ctx, 300, 300, 0.8, 1376)
    arun(ctx, 345, 380, { s: 0.85, pose: 'walk', t: t + 0.9, grey: GREY, eyes: 'down' })
  })
  panel(ctx, 30, 540, 480, 250, (ctx, w, h) => {
    wash(ctx, 0, 0, w, h, G('#9a948d'), 1380)
    const sway = Math.sin(t * 3) * 4
    bag(ctx, 130, 190 + sway, 1.5, 1381)
    bag(ctx, 350, 190 - sway, 1.5, 1385)
    ctx.save()
    ctx.lineCap = 'round'
    line(ctx, 60, -10, 118, 120 + sway, G(C.mira), 30, 4)
    line(ctx, 420, -10, 362, 120 - sway, '#6d7c90', 30, 5)
    ctx.restore()
    blob(ctx, 122, 126 + sway, 16, 18, C.skin1, 1389)
    blob(ctx, 358, 126 - sway, 16, 18, C.skin2, 1390)
  }, { alpha: easeOut((t - 0.6) / 0.5) })
  label(ctx, 'The walk home', W / 2, 520, easeOut((t - 0.3) / 0.5))
}, 'Ten minutes home. It had never felt so long.')

export default {
  title: 'Groceries',
  pages: [shopping, argue, walkHome],
}
