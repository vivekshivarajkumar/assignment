// Chapter 18 · Mother — a phone call that goes gently for once, and a photo
// that shows her mother used to paint too.
import {
  W, C, paper, wash, blob, line, text, caption, tapHint, windowFrame, panel, label, plant,
  person, mira, MOTHER, mix, easeOut, clamp,
} from '../paint.js'
import { bubblePuzzle, icons } from '../bubblePuzzle.js'
import { pop, tone } from '../sound.js'

const GREY = 0.5
const g = (c, k = GREY) => mix(c, C.grey, k)
const PAINTS = [C.mira, C.arun, C.teal, C.sky, C.rose, C.leaf, C.plum, '#f2c14e']

function mother(ctx, x, y, o = {}) {
  person(ctx, { ...MOTHER, x, y, ...o })
}

function paintBox(ctx, x, y, s = 1) {
  wash(ctx, x - 60 * s, y - 24 * s, 120 * s, 48 * s, '#8a5a36', 1802)
  PAINTS.forEach((c, i) => {
    wash(ctx, x - 52 * s + (i % 4) * 27 * s, y - 18 * s + Math.floor(i / 4) * 20 * s, 20 * s, 15 * s, c, 1803 + i)
  })
}

// Comic page: panels appear one after another; a tap brings the next one sooner,
// then turns the page once they are all there.
function comic(panels, captionText) {
  return (api) => {
    const shown = [0]
    return {
      draw(ctx, t) {
        paper(ctx)
        const last = shown.length - 1
        if (last < panels.length - 1 && t - shown[last] > (panels[last].hold ?? 1.6)) shown.push(t)
        shown.forEach((at, i) => {
          const p = panels[i]
          const a = easeOut((t - at) / 0.5)
          panel(ctx, p.x, p.y + (1 - a) * 18, p.w, p.h, (c, w, h) => p.draw(c, w, h, t - at), { alpha: a })
        })
        shown.forEach((at, i) => {
          const l = panels[i].label
          if (l) label(ctx, l[0], l[1], l[2], easeOut((t - at - 0.4) / 0.5))
        })
        const all = shown.length === panels.length
        if (all) caption(ctx, captionText, easeOut((t - shown[last] - 0.6) / 0.6))
        if (all && t - shown[last] > 0.8) tapHint(ctx, W - 50, 50, t)
      },
      down(x, y, t) {
        if (shown.length < panels.length) shown.push(t)
        else if (t - shown[shown.length - 1] > 0.8) api.finish()
      },
    }
  }
}

// ---------- page 1: the phone rings ----------

function bedroom(ctx, memory) {
  wash(ctx, 0, 0, W, 640, g('#d6c6ae'), 1810)
  windowFrame(ctx, 300, 110, 180, 220, g('#c8cdd2'), 1811)
  wash(ctx, 0, 620, W, 340, g('#8a6d55'), 1812)
  // a wall shelf with whatever stayed
  wash(ctx, 40, 400, 200, 12, g('#7b5238'), 1856)
  if (memory.keptPlant !== false) plant(ctx, 90, 402, 0.8, g(C.leaf, 0.35), 1857)
  if (memory.keptPhoto !== false) {
    wash(ctx, 160, 330, 56, 70, g('#7b5a44'), 1858)
    wash(ctx, 167, 337, 42, 56, g(C.sky), 1859)
  }
  // the edge of the bed she sits on
  wash(ctx, -10, 690, 290, 36, g(C.sky, 0.6), 1813)
  wash(ctx, -10, 720, 290, 60, g('#7b5238'), 1814)
}

const ringing = (api) => {
  const PHONE = { x: 380, y: 700 }
  let answeredAt = null
  let lastBuzz = 0
  return {
    debug: () => (answeredAt === null ? [[PHONE.x, PHONE.y]] : []),
    draw(ctx, t) {
      paper(ctx)
      bedroom(ctx, api.memory)
      mira(ctx, 110, 830, { pose: 'sit', grey: GREY, eyes: answeredAt === null ? 'down' : 'open' })
      paintBox(ctx, 230, 860, 1)

      const buzzing = answeredAt === null && t > 0.6
      if (buzzing && t - lastBuzz > 1.2) {
        lastBuzz = t
        tone(660, 0.12, { type: 'square', gain: 0.02 })
        setTimeout(() => tone(660, 0.12, { type: 'square', gain: 0.02 }), 180)
      }
      const shake = buzzing && (t - lastBuzz) < 0.4 ? Math.sin(t * 80) * 4 : 0
      ctx.save()
      ctx.translate(PHONE.x + shake, PHONE.y)
      ctx.rotate(-0.15)
      ctx.fillStyle = C.ink
      ctx.beginPath()
      ctx.roundRect(-45, -80, 90, 160, 16)
      ctx.fill()
      ctx.fillStyle = answeredAt === null ? '#e8e2ee' : '#cfe3c6'
      ctx.beginPath()
      ctx.roundRect(-37, -66, 74, 132, 8)
      ctx.fill()
      // the caller: a little face with a grey bun, framed in plum
      blob(ctx, 0, -20, 24, 24, C.plum, 1815, 0.6)
      blob(ctx, 0, -18, 15, 16, C.skin1, 1816)
      blob(ctx, 0, -32, 16, 8, MOTHER.hair, 1817)
      blob(ctx, 8, -42, 7, 7, MOTHER.hair, 1818)
      blob(ctx, 0, 40, 12, 12, answeredAt === null ? '#7fb36b' : C.inkSoft, 1819)
      ctx.restore()
      if (buzzing) {
        ctx.save()
        ctx.strokeStyle = C.inkSoft
        ctx.lineWidth = 3
        for (const d of [-1, 1]) {
          ctx.beginPath()
          ctx.arc(PHONE.x, PHONE.y, 110, d < 0 ? Math.PI - 0.4 : -0.4, d < 0 ? Math.PI + 0.4 : 0.4)
          ctx.stroke()
        }
        ctx.restore()
      }

      if (answeredAt === null) {
        text(ctx, 'answer the phone', W / 2, 70, { size: 30, color: C.inkSoft })
        if (t > 1) tapHint(ctx, PHONE.x, PHONE.y + 40, t)
      } else {
        caption(ctx, 'Her mother. She almost let it ring.', easeOut((t - answeredAt) / 0.6), 110)
        if (t - answeredAt > 0.6) tapHint(ctx, W - 50, 50, t)
      }
    },
    down(x, y, t) {
      if (answeredAt !== null) {
        if (t - answeredAt > 0.6) api.finish()
        return
      }
      if (Math.abs(x - PHONE.x) < 80 && Math.abs(y - PHONE.y) < 110) {
        answeredAt = t
        pop(520)
      }
    },
  }
}

// ---------- page 2: the call ----------

// "And you?" — a small face with a bun, for the question about Mira.
function you(ctx, w, h) {
  ctx.fillStyle = C.skin1
  ctx.beginPath()
  ctx.arc(w / 2, h / 2 + 10, 34, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = C.miraHair
  ctx.beginPath()
  ctx.ellipse(w / 2, h / 2 - 4, 36, 26, 0, Math.PI, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(w / 2 - 20, h / 2 - 34, 13, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = C.ink
  for (const d of [-1, 1]) {
    ctx.beginPath()
    ctx.arc(w / 2 + d * 12, h / 2 + 10, 3.5, 0, Math.PI * 2)
    ctx.fill()
  }
}

const call = bubblePuzzle({
  scene(ctx) {
    wash(ctx, 0, 0, W, 740, g('#e9dfcf', 0.3), 1820)
    wash(ctx, 0, 0, W / 2, 740, g(C.mira, 0.7), 1827, 0.12)
    wash(ctx, W / 2, 0, W / 2, 740, C.plum, 1828, 0.1)
    // the line between two kitchens
    ctx.save()
    ctx.strokeStyle = 'rgba(109,101,112,0.4)'
    ctx.lineWidth = 3
    ctx.setLineDash([4, 10])
    ctx.beginPath()
    ctx.moveTo(150, 760)
    ctx.bezierCurveTo(200, 700, 340, 700, 390, 760)
    ctx.stroke()
    ctx.restore()
    panel(ctx, 30, 760, 230, 170, (c, w, h) => {
      wash(c, 0, 0, w, h, g('#d6c6ae'), 1821)
      wash(c, 0, 130, w, 50, g('#8a6d55'), 1822)
      mira(c, 110, 230, { s: 0.6, grey: GREY })
      paintBox(c, 190, 150, 0.5)
    })
    panel(ctx, 280, 760, 230, 170, (c, w, h) => {
      wash(c, 0, 0, w, h, g('#e3d3c0', 0.3), 1823)
      windowFrame(c, 20, 20, 70, 80, g(C.sky, 0.3), 1824)
      plant(c, 55, 118, 0.5, g(C.leaf, 0.3), 1825)
      wash(c, 0, 118, 110, 14, g('#7b5238', 0.3), 1826)
      mother(c, 150, 230, { s: 0.6, facing: -1, grey: 0.3 })
    })
  },
  bubbles: [
    { speaker: 'mom', pieces: 2, icon: icons.row(you, icons.question) },
    { speaker: 'mira', pieces: 2, icon: icons.storm },
    { speaker: 'mom', pieces: 1, icon: icons.heart },
    { speaker: 'mira', pieces: 2, icon: icons.paint },
    { speaker: 'mom', pieces: 1, icon: icons.star },
  ],
  caption: 'For once, her mother just listened.',
})

// ---------- page 3: the photo ----------

// Young mother at an easel by the sea, fading into colour like a developing print.
function oldPhoto(ctx, w, h, t) {
  const dev = 1 - easeOut((t - 0.4) / 2.2)
  const f = (c) => mix(c, '#b9a98e', 0.25 + dev * 0.75)
  wash(ctx, 0, 0, w, h, '#efe6d3', 1830)
  const x = 36
  const y = 36
  const pw = w - 72
  const ph = h - 110
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, pw, ph)
  ctx.clip()
  wash(ctx, x - 10, y - 10, pw + 20, ph * 0.5, f(C.sky), 1831)
  wash(ctx, x - 10, y + ph * 0.45, pw + 20, ph * 0.2, f(C.teal), 1832)
  wash(ctx, x - 10, y + ph * 0.62, pw + 20, ph * 0.5, f('#d9c48f'), 1833)
  blob(ctx, x + pw - 70, y + 60, 34, 34, f('#f2c14e'), 1834)
  // the easel and its canvas, bright with paint
  line(ctx, x + 250, y + 150, x + 220, y + ph + 10, f('#7b5238'), 7, 1835)
  line(ctx, x + 250, y + 150, x + 290, y + ph + 10, f('#7b5238'), 7, 1836)
  wash(ctx, x + 200, y + 110, 110, 100, f(C.cream), 1837)
  PAINTS.slice(0, 5).forEach((c, i) => blob(ctx, x + 220 + (i % 3) * 32, y + 140 + Math.floor(i / 3) * 36, 16, 14, f(c), 1838 + i))
  const my = y + ph + 20
  mother(ctx, x + 130, my, { s: 0.85, hair: f('#3a2a30'), top: f(C.rose), bottom: f('#57465f'), mouth: 'smile' })
  // her brush reaching for the canvas
  line(ctx, x + 158, my - 128, x + 214, my - 196, f('#9a5a2c'), 5, 1843)
  blob(ctx, x + 216, my - 198, 5, 7, f(C.arun), 1844)
  ctx.restore()
  ctx.save()
  ctx.strokeStyle = 'rgba(47,43,51,0.25)'
  ctx.lineWidth = 2
  ctx.strokeRect(x, y, pw, ph)
  ctx.restore()
}

const photo = comic(
  [
    {
      x: 40, y: 110, w: 460, h: 200, hold: 1.6,
      draw(ctx, w, h) {
        wash(ctx, 0, 0, w, h, g('#d6c6ae'), 1850)
        // her phone lights up with a picture message
        ctx.fillStyle = C.ink
        ctx.beginPath()
        ctx.roundRect(180, 12, 100, 160, 14)
        ctx.fill()
        wash(ctx, 190, 28, 80, 120, '#efe6d3', 1851)
        wash(ctx, 200, 42, 60, 60, '#c7b58f', 1852)
        blob(ctx, 230, 124, 22, 10, C.plum, 1853, 0.7)
        blob(ctx, 176, 130, 22, 34, C.skin1, 1854)
        blob(ctx, 284, 130, 22, 34, C.skin1, 1855)
        wash(ctx, 90, 140, 90, 60, g(C.mira), 1867)
        wash(ctx, 280, 140, 90, 60, g(C.mira), 1868)
      },
      label: ['Later, a photo arrived', 300, 310],
    },
    {
      x: 40, y: 350, w: 460, h: 450,
      draw: oldPhoto,
      label: ['Her mother, at nineteen', 300, 780],
    },
  ],
  'She had painted too. Before being sensible.',
)

// ---------- page 4: the paints ----------

const brush = comic(
  [
    {
      x: 40, y: 110, w: 460, h: 690,
      draw(ctx, w, h, t) {
        const k = clamp(t / 3, 0, 1)
        wash(ctx, 0, 0, w, h, g('#d6c6ae', 0.5 - k * 0.15), 1860)
        windowFrame(ctx, 250, 60, 170, 210, mix('#c8cdd2', '#f2d9a6', k), 1861)
        blob(ctx, 330, 160, 140, 120, '#fff3c4', 1862, 0.25 * k)
        wash(ctx, 0, 560, w, 140, g('#8a6d55', 0.5 - k * 0.15), 1863)
        wash(ctx, -10, 520, 250, 34, g(C.sky, 0.6 - k * 0.2), 1869)
        wash(ctx, -10, 550, 250, 60, g('#7b5238', 0.5 - k * 0.15), 1870)
        mira(ctx, 150, 660, { pose: 'sit', grey: 0.5 - k * 0.2, eyes: 'open', mouth: 'smile' })
        paintBox(ctx, 290, 660, 1.1)
        // a wet brush, a first drop of colour on the paper
        line(ctx, 204, 534, 262, 480, '#9a5a2c', 6, 1864)
        blob(ctx, 264, 477, 5, 8, C.mira, 1871)
        wash(ctx, 300, 570, 130, 50, C.cream, 1866, 0.8)
        blob(ctx, 365, 595, 24 * k + 1, 12 * k + 1, C.mira, 1865, 0.8)
      },
    },
  ],
  'Maybe it was not too late to be unsensible.',
)

export default {
  title: 'Mother',
  pages: [ringing, call, photo, brush],
}
