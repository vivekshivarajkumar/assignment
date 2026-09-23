// Chapter 7 · Coffee — the first date. Talking comes easier with every line,
// and on the walk home they both look back at the same moment.
import { vignette } from '../engine.js'
import {
  W, H, C, paper, wash, blob, line, text, caption, tapHint, windowFrame,
  mira, arun, heart, note, phone, panel, label, rng, easeOut, easeInOut, lerp, clamp,
} from '../paint.js'
import { bubblePuzzle, icons } from '../bubblePuzzle.js'
import { pop, tone, MELODY } from '../sound.js'

// Fades a panel in from time t0 (used to reveal comic panels one after another).
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

// Warm café interior sized to a w x h box; the floor starts at `floor`.
function cafe(ctx, w, h, floor, lamps = true) {
  wash(ctx, -10, -10, w + 20, h + 20, '#ead3b4', 701)
  // shelf of jars on the left wall
  wash(ctx, 10, floor - 200, 130, 12, '#9a6b48', 702)
  const jar = [C.teal, C.mira, C.rose, C.leaf]
  for (let i = 0; i < 4; i++) blob(ctx, 32 + i * 30, floor - 220, 11, 18, jar[i], 704 + i, 0.8)
  windowFrame(ctx, w * 0.36, floor - 280, w * 0.5, 190, '#f2c98a', 712)
  // street outside: a tree and a warm awning across the road
  blob(ctx, w * 0.36 + 60, floor - 130, 40, 44, C.leaf, 713, 0.7)
  wash(ctx, w * 0.36 + 120, floor - 250, 100, 26, C.arun, 714, 0.5)
  // hanging lamps
  const ly = floor - 320
  for (const [x, sd] of lamps ? [[w * 0.2, 715], [w * 0.78, 716]] : []) {
    line(ctx, x, -5, x, ly - 10, C.ink, 2, sd)
    blob(ctx, x, ly, 24, 14, C.mira, sd)
    blob(ctx, x, ly + 20, 44, 26, '#fff3c4', sd + 10, 0.35)
  }
  wash(ctx, -10, floor, w + 20, h - floor + 10, '#b98c64', 717)
  for (let i = 0; i < 4; i++) line(ctx, -10, floor + 30 + i * 34, w + 10, floor + 26 + i * 34, 'rgba(90,60,40,0.25)', 2, 718 + i)
}

function table(ctx, x, y, s = 1) {
  wash(ctx, x - 110 * s, y, 220 * s, 20 * s, '#7b5238', 720)
  line(ctx, x, y + 16 * s, x, y + 130 * s, '#5c3c2a', 9 * s, 721)
  line(ctx, x - 44 * s, y + 130 * s, x + 44 * s, y + 130 * s, '#5c3c2a', 7 * s, 722)
}

function cup(ctx, x, y, color, t, seed, s = 1) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  wash(ctx, -20, -34, 40, 34, color, seed)
  ctx.strokeStyle = color
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.arc(22, -18, 9, -1.3, 1.3)
  ctx.stroke()
  wash(ctx, -28, -4, 56, 8, C.cream, seed + 1)
  // steam
  ctx.strokeStyle = 'rgba(109,101,112,0.5)'
  ctx.lineWidth = 3
  for (const dx of [-6, 8]) {
    const k = (t * 0.6 + (dx > 0 ? 0.5 : 0)) % 1
    ctx.globalAlpha = 1 - k
    ctx.beginPath()
    ctx.moveTo(dx, -40 - k * 20)
    ctx.quadraticCurveTo(dx + 10, -55 - k * 20, dx, -70 - k * 20)
    ctx.stroke()
  }
  ctx.restore()
}

const arrive = vignette((ctx, t) => {
  reveal(ctx, t, 0.8, 30, 100, 480, 400, (c, w, h) => {
    cafe(c, w, h, 330)
    mira(c, 100, 395, { s: 0.75, pose: 'sit', mouth: 'smile' })
    arun(c, 380, 395, { s: 0.75, pose: 'sit', facing: -1, mouth: 'smile' })
    table(c, w / 2, 290, 0.8)
    cup(c, w / 2 - 40, 290, C.cream, t, 723, 0.8)
    cup(c, w / 2 + 40, 290, C.teal, t, 725, 0.8)
  })
  label(ctx, 'Saturday, three o\'clock', 270, 500, fade(t, 0.3))
  // close-ups: her fidgeting with the sugar, him already grinning
  panel(ctx, 30, 540, 230, 210, (c, w, h) => {
    wash(c, -10, -10, w + 20, h + 20, '#f2c98a', 726)
    mira(c, 110, 560, { s: 1.6, mouth: 'smile', eyes: 'down' })
  })
  reveal(ctx, t, 1.3, 280, 540, 230, 210, (c, w, h) => {
    wash(c, -10, -10, w + 20, h + 20, '#e8b8a0', 727)
    arun(c, 120, 560, { s: 1.6, facing: -1, mouth: 'smile' })
  })
}, 'He was early. So was she.', { wait: 1.6 })

// Custom pictogram: Mira's desk, a stack of papers and a grey calculator.
function papers(ctx, w, h) {
  ctx.save()
  ctx.strokeStyle = C.ink
  ctx.lineWidth = 3
  for (let i = 2; i >= 0; i--) {
    ctx.fillStyle = i ? C.greyLight : '#ffffff'
    ctx.fillRect(w / 2 - 44 + i * 8, h / 2 - 46 + i * 6, 72, 90)
    ctx.strokeRect(w / 2 - 44 + i * 8, h / 2 - 46 + i * 6, 72, 90)
  }
  ctx.strokeStyle = C.greyDark
  for (let k = 0; k < 5; k++) {
    ctx.beginPath()
    ctx.moveTo(w / 2 - 34, h / 2 - 30 + k * 14)
    ctx.lineTo(w / 2 + 16, h / 2 - 30 + k * 14)
    ctx.stroke()
  }
  ctx.restore()
}

const talk = bubblePuzzle({
  scene(ctx, t) {
    cafe(ctx, W, H, 660, false)
    table(ctx, W / 2, 840)
    ctx.save()
    ctx.globalAlpha = 0.95
    mira(ctx, 150, 955, { s: 0.55, pose: 'sit', mouth: 'smile' })
    arun(ctx, 395, 955, { s: 0.55, pose: 'sit', facing: -1, mouth: 'smile' })
    ctx.restore()
    cup(ctx, W / 2 - 40, 840, C.cream, t, 727)
    cup(ctx, W / 2 + 40, 840, C.teal, t, 729)
  },
  bubbles: [
    { speaker: 'arun', pieces: 3, icon: icons.row(icons.star, icons.question) },
    { speaker: 'mira', pieces: 3, icon: icons.row(papers, icons.clock) },
    { speaker: 'arun', pieces: 2, icon: icons.row(icons.music, icons.sun) },
    { speaker: 'mira', pieces: 2, icon: icons.row(icons.paint, icons.question) },
    { speaker: 'arun', pieces: 1, icon: icons.laugh },
    { speaker: 'mira', pieces: 1, icon: icons.coffee },
  ],
  caption: 'By the second cup, it was easy.',
})

// Evening street. They walk apart; tap Mira and she looks back — so does he.
const walkHome = (api) => {
  const r = rng(730)
  const stars = Array.from({ length: 22 }, () => [r() * W, r() * 300, 1 + r() * 2])
  let lookAt = null
  let doneAt = null
  let wait = 1.6 // they walk a little before the player may tap
  const pos = (t, dir) => {
    const k = easeInOut(Math.min(t, 2.4) / 2.4)
    return W / 2 + dir * lerp(45, 175, k)
  }
  return {
    debug: () => ({ mira: [pos(9, -1), 640] }),
    draw(ctx, t) {
      paper(ctx)
      // dusk sky and street
      wash(ctx, 0, 0, W, 520, '#6f6a9a', 731)
      wash(ctx, 0, 300, W, 260, '#d99a7a', 732, 0.7)
      for (const [x, y, s] of stars) blob(ctx, x, y, s, s, C.cream, 733 + x | 0, 0.8)
      // rooftops with lit windows
      for (let i = 0; i < 6; i++) {
        const hh = 140 + ((i * 53) % 90)
        wash(ctx, i * 95 - 10, 560 - hh, 100, hh + 20, i % 2 ? '#4f4a6e' : '#5a547a', 740 + i)
        for (let k = 0; k < 2; k++) wash(ctx, i * 95 + 18 + k * 36, 580 - hh + 30, 18, 24, '#f2c14e', 750 + i * 2 + k, 0.8)
      }
      // pavement, kerb and the road in front
      wash(ctx, 0, 560, W, 250, '#8e8aa0', 760)
      wash(ctx, 0, 790, W, 22, '#6f6b80', 761)
      wash(ctx, 0, 812, W, 160, '#55526b', 765)
      for (let i = 0; i < 5; i++) wash(ctx, 20 + i * 120, 884, 60, 8, C.cream, 766 + i, 0.5)
      // one street lamp between them, its warm pool of light on the pavement
      blob(ctx, W / 2, 770, 160, 34, '#f7dc9a', 762, 0.45)
      line(ctx, W / 2, 770, W / 2, 440, C.ink, 6, 763)
      line(ctx, W / 2, 440, W / 2 + 30, 424, C.ink, 5, 764)
      blob(ctx, W / 2 + 34, 430, 16, 11, '#f7dc9a', 764)
      blob(ctx, W / 2 + 34, 470, 60, 50, '#fff3c4', 767, 0.2)

      const mx = pos(t, -1)
      const ax = pos(t, 1)
      const back = lookAt !== null
      const walking = t < 2.4
      // Mira walks left, Arun right. When she looks back, he already is.
      mira(ctx, mx, 780, { pose: walking ? 'walk' : 'stand', t, facing: back ? 1 : -1, mouth: back ? 'smile' : 'none' })
      arun(ctx, ax, 780, { pose: walking ? 'walk' : 'stand', t, facing: back ? -1 : 1, mouth: back ? 'smile' : 'none' })

      if (back) {
        const k = easeOut((t - lookAt) / 1.2)
        heart(ctx, W / 2, 360 - k * 50, 1.4 * k, C.rose)
        for (let i = 0; i < 3; i++) {
          const q = clamp((t - lookAt - i * 0.3) / 2, 0, 1)
          note(ctx, W / 2 - 60 + i * 60, 330 - q * 120, 0.8, C.arun, (1 - q) * 0.9)
        }
      }

      if (lookAt === null && t > wait) {
        text(ctx, 'tap Mira to look back', W / 2, 90, { size: 30, color: C.cream })
        tapHint(ctx, mx, 410, t, C.cream)
      }
      if (doneAt !== null) {
        caption(ctx, 'Both of them looked back.', easeOut((t - doneAt) / 0.6))
        tapHint(ctx, W - 50, 50, t, C.cream)
      }
      if (lookAt !== null && doneAt === null && t - lookAt > 1) doneAt = t
    },
    down(x, y, t) {
      if (doneAt !== null) {
        if (t - doneAt > 0.6) api.finish()
        return
      }
      if (lookAt !== null || t < wait) return
      const mx = pos(t, -1)
      // generous hit box around the whole figure
      if (Math.abs(x - mx) < 80 && y > 420 && y < 800) {
        lookAt = t
        tone(MELODY[0], 0.5)
        setTimeout(() => tone(MELODY[2], 0.6), 180)
      } else {
        wait = t + 0.2
        pop(260)
      }
    },
  }
}

// Her room at night, and the message he sent: a little tune and a heart.
const buzz = vignette((ctx, t) => {
  reveal(ctx, t, 0.9, 30, 100, 480, 360, (c, w, h) => {
    wash(c, -10, -10, w + 20, h + 20, '#4a4a70', 770)
    windowFrame(c, 40, 40, 150, 180, C.night, 771)
    blob(c, 140, 90, 18, 18, C.cream, 772)
    wash(c, -10, 280, w + 20, 100, '#5d5a7c', 773)
    wash(c, 180, 240, 310, 70, '#8a86ad', 774) // bed
    blob(c, 250, 200, 80, 80, '#fff3c4', 775, 0.2)
    mira(c, 330, 330, { s: 0.8, pose: 'sit', facing: -1, mouth: 'smile', eyes: 'down' })
    c.save()
    c.translate(262, 205)
    c.rotate(-0.3)
    phone(c, -14, -24, 28, 48, '#fff6dd')
    c.restore()
  })
  label(ctx, 'That night', 270, 460, fade(t, 0.3))
  panel(ctx, 30, 500, 480, 250, (c, w, h) => {
    wash(c, -10, -10, w + 20, h + 20, '#35365a', 776)
    phone(c, 130, 20, 220, 300, '#fff6dd')
    const k = easeOut((t - 1.4) / 0.5)
    c.save()
    c.globalAlpha *= k
    c.translate(152, 70 + (1 - k) * 16)
    c.scale(0.44, 0.44)
    c.fillStyle = '#f0c3b8'
    c.strokeStyle = C.ink
    c.lineWidth = 5
    c.beginPath()
    c.roundRect(0, 0, 400, 150, 24)
    c.fill()
    c.stroke()
    icons.row(icons.music, icons.heart)(c, 400, 150)
    c.restore()
    if (t > 1.4 && t < 2.2) {
      c.strokeStyle = C.cream
      c.lineWidth = 3
      for (const d of [-1, 1]) {
        c.beginPath()
        c.arc(240, 150, 150, d < 0 ? Math.PI - 0.3 : -0.3, d < 0 ? Math.PI + 0.3 : 0.3)
        c.stroke()
      }
    }
  })
}, 'For once, she smiled at her phone.', { wait: 1.8 })

export default {
  title: 'Coffee',
  pages: [arrive, talk, walkHome, buzz],
}
