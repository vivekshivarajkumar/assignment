// Chapter 9 · Summer — a summer in instant photos. Turn each one the right
// way up and stick it into the album; the season ends on a sunset.
import { vignette } from '../engine.js'
import {
  W, H, C, paper, wash, blob, line, text, caption, tapHint,
  mira, arun, heart, panel, label, rng, dist, clamp, lerp, easeOut,
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

// ---------- the four photos ----------
// Each paints a w x h picture with its origin at the top-left corner.

function beach(ctx, w, h) {
  wash(ctx, -5, -5, w + 10, h * 0.5, C.sky, 901)
  blob(ctx, w * 0.78, h * 0.2, 12, 12, '#f2c14e', 902)
  wash(ctx, -5, h * 0.42, w + 10, h * 0.2, C.teal, 903)
  wash(ctx, -5, h * 0.6, w + 10, h * 0.45, '#ecd29b', 904)
  line(ctx, w * 0.22, h * 0.9, w * 0.26, h * 0.42, C.ink, 2, 905)
  blob(ctx, w * 0.26, h * 0.42, 22, 9, C.arun, 906)
  mira(ctx, w * 0.5, h * 0.92, { s: 0.2, pose: 'wave', t: 0.3, mouth: 'smile' })
  arun(ctx, w * 0.72, h * 0.92, { s: 0.2, facing: -1, mouth: 'smile' })
}

function cinema(ctx, w, h) {
  wash(ctx, -5, -5, w + 10, h + 10, C.night, 907)
  wash(ctx, w * 0.12, h * 0.1, w * 0.76, h * 0.42, '#dfe8f0', 908)
  blob(ctx, w * 0.4, h * 0.3, 14, 10, C.sky, 909, 0.6)
  // two heads from behind, leaning together
  blob(ctx, w * 0.38, h * 0.74, 20, 24, C.miraHair, 910)
  blob(ctx, w * 0.3, h * 0.6, 9, 9, C.miraHair, 911)
  blob(ctx, w * 0.6, h * 0.76, 20, 24, C.arunHair, 912)
  wash(ctx, w * 0.24, h * 0.92, w * 0.52, h * 0.2, '#4b4a6e', 913)
  wash(ctx, w * 0.76, h * 0.66, 18, 26, C.arun, 914)
  for (let i = 0; i < 4; i++) blob(ctx, w * 0.76 + 4 + (i % 2) * 8, h * 0.64 - (i >> 1) * 6, 5, 4, C.cream, 915 + i)
}

function rain(ctx, w, h) {
  wash(ctx, -5, -5, w + 10, h + 10, '#8ea3b5', 920)
  wash(ctx, -5, h * 0.75, w + 10, h * 0.3, '#6d7f92', 921)
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'
  ctx.lineWidth = 1.5
  const r = rng(922)
  for (let i = 0; i < 28; i++) {
    const x = r() * w
    const y = r() * h
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x - 3, y + 9)
    ctx.stroke()
  }
  ctx.restore()
  mira(ctx, w * 0.42, h * 0.95, { s: 0.22, mouth: 'smile' })
  arun(ctx, w * 0.6, h * 0.95, { s: 0.22, facing: -1, mouth: 'smile' })
  // one umbrella for the two of them
  ctx.save()
  ctx.fillStyle = C.mira
  ctx.beginPath()
  ctx.arc(w * 0.51, h * 0.36, w * 0.3, Math.PI, 0)
  ctx.fill()
  ctx.restore()
  line(ctx, w * 0.51, h * 0.36, w * 0.51, h * 0.62, C.ink, 2, 923)
}

function cooking(ctx, w, h) {
  wash(ctx, -5, -5, w + 10, h + 10, '#f1dcc0', 924)
  wash(ctx, -5, h * 0.62, w + 10, h * 0.45, '#a77b58', 925)
  for (let i = 0; i < 4; i++) wash(ctx, 6 + i * 32, 10, 24, 20, '#e6f0ee', 926 + i, 0.8)
  mira(ctx, w * 0.3, h * 1.02, { s: 0.24, mouth: 'open' })
  arun(ctx, w * 0.72, h * 1.02, { s: 0.24, facing: -1, mouth: 'smile' })
  // a pot on the counter, steaming (and smoking a little)
  wash(ctx, w * 0.4, h * 0.5, w * 0.2, h * 0.14, C.ink, 930)
  for (let i = 0; i < 3; i++) blob(ctx, w * 0.46 + i * 6, h * 0.4 - i * 10, 10 - i * 2, 7, C.greyDark, 931 + i, 0.6)
  blob(ctx, w * 0.32, h * 0.5, 16, 10, C.cream, 934, 0.9) // flour cloud
}

const PHOTOS = [beach, cinema, rain, cooking]
const PW = 124 // polaroid size
const PH = 148
const IMG = 108 // square picture inside it

function polaroid(ctx, x, y, ang, fn, s = 1, shadow = true) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(ang)
  ctx.scale(s, s)
  if (shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.2)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetY = 4
  }
  ctx.fillStyle = '#fffdf8'
  ctx.fillRect(-PW / 2, -PH / 2, PW, PH)
  ctx.shadowColor = 'transparent'
  ctx.strokeStyle = 'rgba(47,43,51,0.25)'
  ctx.lineWidth = 1.5
  ctx.strokeRect(-PW / 2, -PH / 2, PW, PH)
  ctx.beginPath()
  ctx.rect(-IMG / 2, -PH / 2 + 8, IMG, IMG)
  ctx.clip()
  ctx.translate(-IMG / 2, -PH / 2 + 8)
  fn(ctx, IMG, IMG)
  ctx.restore()
}

// Open album: two pages, two slots each.
const SLOTS = [[160, 245], [160, 415], [380, 245], [380, 415]]

function album(ctx) {
  wash(ctx, 36, 146, 468, 368, '#8a5a3c', 940) // cover
  wash(ctx, 48, 156, 218, 348, C.cream, 941)
  wash(ctx, 274, 156, 218, 348, C.cream, 942)
  line(ctx, 270, 152, 270, 508, 'rgba(90,60,40,0.4)', 4, 943)
  ctx.save()
  ctx.setLineDash([8, 8])
  ctx.strokeStyle = 'rgba(47,43,51,0.3)'
  ctx.lineWidth = 2
  for (const [x, y] of SLOTS) ctx.strokeRect(x - PW / 2, y - PH / 2, PW, PH)
  ctx.restore()
  // photo corners and doodles
  heart(ctx, 240, 180, 0.4, C.rose)
  heart(ctx, 470, 480, 0.5, C.rose)
}

// Bits of summer lying on the table: sunglasses and a cinema ticket.
function props(ctx) {
  ctx.save()
  ctx.translate(270, 745)
  ctx.rotate(-0.15)
  blob(ctx, -24, 0, 20, 15, C.ink, 944, 0.85)
  blob(ctx, 24, 0, 20, 15, C.ink, 945, 0.85)
  line(ctx, -6, -4, 6, -4, C.ink, 4, 946)
  ctx.restore()
  ctx.save()
  ctx.translate(90, 548)
  ctx.rotate(0.2)
  wash(ctx, -40, -16, 80, 32, C.rose, 947)
  line(ctx, 18, -14, 18, 14, C.cream, 2, 948)
  ctx.restore()
}

const albumPage = (api) => {
  const r = rng(950)
  const start = [[140, 650, 3], [390, 640, 2], [160, 835, 1], [395, 840, 3]]
  const photos = PHOTOS.map((fn, i) => {
    const [x, y, turns] = start[i]
    return { fn, x, y, hx: x, hy: y, turns, ang: turns * (Math.PI / 2), tilt: (r() - 0.5) * 0.3, slot: null }
  })
  let drag = null
  let doneAt = null
  let warnAt = -10

  const loose = () => photos.filter((p) => p.slot === null)
  const freeSlot = (x, y) => {
    let best = null
    let bd = 80
    SLOTS.forEach((s, i) => {
      if (photos.some((p) => p.slot === i)) return
      const d = dist(x, y, s[0], s[1])
      if (d < bd) {
        bd = d
        best = i
      }
    })
    return best
  }

  return {
    debug: () =>
      loose().map((p) => {
        if (p.turns % 4) return { tap: [p.x, p.y] }
        const i = SLOTS.findIndex((_, k) => !photos.some((q) => q.slot === k))
        return { from: [p.x, p.y], to: SLOTS[i] }
      }),
    draw(ctx, t, dt) {
      paper(ctx)
      wash(ctx, 0, 0, W, H, '#e9c9a0', 951) // summer table top
      for (let i = 0; i < 6; i++) line(ctx, 0, 90 + i * 160, W, 94 + i * 160, 'rgba(120,80,50,0.18)', 3, 952 + i)
      props(ctx)
      album(ctx)
      // placed photos sit flat in their slots
      for (const p of photos) {
        const target = p.turns * (Math.PI / 2)
        p.ang = lerp(p.ang, target, clamp(dt * 12, 0, 1))
        if (p.slot !== null) {
          p.x = lerp(p.x, SLOTS[p.slot][0], clamp(dt * 14, 0, 1))
          p.y = lerp(p.y, SLOTS[p.slot][1], clamp(dt * 14, 0, 1))
          polaroid(ctx, p.x, p.y, 0, p.fn, 1, false)
        }
      }
      for (const p of [...loose().filter((q) => q !== drag), ...(drag ? [drag] : [])]) {
        polaroid(ctx, p.x, p.y, p.ang + (p === drag ? 0 : p.tilt), p.fn, p === drag ? 1.08 : 1)
      }

      if (doneAt === null) {
        text(ctx, 'tap a photo to turn it,', W / 2, 60, { size: 28, color: C.inkSoft })
        text(ctx, 'drag it into the album', W / 2, 100, { size: 28, color: C.inkSoft })
        if (t - warnAt < 1.4) {
          text(ctx, 'turn it the right way up first', W / 2, 545, { size: 24, color: C.arun, alpha: 1 - (t - warnAt) / 1.4 })
        }
        const first = loose()[0]
        if (first && !drag && loose().length === 4) tapHint(ctx, first.x, first.y, t)
      } else {
        const k = fade(t, doneAt)
        for (let i = 0; i < 5; i++) {
          const q = ((t - doneAt) * 0.25 + i / 5) % 1
          ctx.save()
          ctx.globalAlpha = k * Math.sin(q * Math.PI)
          heart(ctx, 80 + i * 95, 620 - q * 140, 0.9, i % 2 ? C.arun : C.rose)
          ctx.restore()
        }
        caption(ctx, 'Sand, films, rain, burnt pasta.', k)
        tapHint(ctx, W - 50, 50, t)
      }
    },
    down(x, y, t) {
      if (doneAt !== null) {
        if (t - doneAt > 0.6) api.finish()
        return
      }
      const hit = [...loose()].reverse().find((p) => dist(x, y, p.x, p.y) < 80)
      if (!hit) return
      drag = hit
      drag.ox = x - hit.x
      drag.oy = y - hit.y
      drag.sx = x
      drag.sy = y
    },
    move(x, y) {
      if (!drag) return
      drag.x = clamp(x - drag.ox, 60, W - 60)
      drag.y = clamp(y - drag.oy, 120, H - 70)
    },
    up(x, y, t) {
      if (!drag) return
      const p = drag
      drag = null
      if (dist(x, y, p.sx, p.sy) < 10) {
        // a tap turns the photo a quarter turn
        p.x = p.sx - p.ox
        p.y = p.sy - p.oy
        p.turns += 1 // the angle animates towards turns * 90°
        pop(480 + (p.turns % 4) * 40)
        return
      }
      const slot = freeSlot(p.x, p.y)
      if (slot !== null && p.turns % 4 === 0) {
        p.slot = slot
        p.tilt = 0
        tone(MELODY[photos.filter((q) => q.slot !== null).length + 3], 0.5)
        if (loose().length === 0) doneAt = t
      } else if (slot !== null) {
        warnAt = t
        p.x = p.hx
        p.y = p.hy
        pop(220)
      } else {
        p.hx = p.x
        p.hy = p.y
      }
    },
  }
}

// She buys an old instant camera; the first photo develops in her hand.
const camera = vignette((ctx, t) => {
  reveal(ctx, t, 0.8, 30, 100, 480, 380, (c, w, h) => {
    wash(c, -10, -10, w + 20, h + 20, '#bfe0ea', 960)
    blob(c, 400, 70, 40, 40, '#f2c14e', 961)
    for (let i = 0; i < 4; i++) blob(c, 40 + i * 140, 300, 90, 60, C.leaf, 962 + i)
    wash(c, -10, 300, w + 20, 100, '#b9d08f', 966)
    arun(c, 340, 370, { s: 0.85, facing: -1, pose: 'wave', t, mouth: 'smile' })
    mira(c, 130, 370, { s: 0.85, mouth: 'smile' })
    // camera held up to her face
    wash(c, 150, 105, 46, 34, C.ink, 967)
    blob(c, 172, 122, 9, 9, C.sky, 968)
  })
  label(ctx, 'June', 270, 480, fade(t, 0.3))
  panel(ctx, 30, 520, 230, 230, (c, w, h) => {
    wash(c, -10, -10, w + 20, h + 20, '#f7e3b5', 969)
    // the camera, a photo sliding out of it, and the flash
    const k = clamp((t - 1) / 0.5, 0, 1)
    const out = easeOut((t - 1.2) / 1)
    c.fillStyle = '#fffdf8'
    c.fillRect(70, 150, 90, 20 + out * 50)
    wash(c, 40, 60, 150, 100, '#3a3640', 970)
    wash(c, 40, 60, 150, 26, C.cream, 976, 0.9)
    blob(c, 115, 116, 32, 32, '#6d7f92', 971)
    blob(c, 115, 116, 18, 18, C.sky, 972)
    blob(c, 108, 110, 5, 5, '#ffffff', 977)
    wash(c, 150, 66, 28, 14, '#f7f3e6', 973)
    blob(c, 60, 72, 7, 7, C.arun, 978)
    if (t > 1 && k < 1) blob(c, 164, 72, 40 + 90 * k, 40 + 90 * k, '#ffffff', 974, 1 - k)
  })
  reveal(ctx, t, 1.4, 280, 520, 230, 230, (c, w, h) => {
    wash(c, -10, -10, w + 20, h + 20, '#f1d4bd', 975)
    // the photo develops out of white
    polaroid(c, w / 2, h / 2, -0.08, (g, pw, ph) => {
      g.save()
      wash(g, -5, -5, pw + 10, ph * 0.7, '#bfe0ea', 979)
      wash(g, -5, ph * 0.66, pw + 10, ph * 0.4, '#b9d08f', 986)
      arun(g, pw * 0.5, ph * 1.1, { s: 0.36, pose: 'wave', t: 0.4, mouth: 'smile' })
      g.globalAlpha = 1 - clamp((t - 1.6) / 1.4, 0, 1)
      g.fillStyle = '#f4f1ea'
      g.fillRect(0, 0, pw, ph)
      g.restore()
    }, 1.3)
  })
}, 'She bought an old instant camera.', { wait: 2 })

// Sunset on the pier; hearts drift up like lanterns.
const sunset = vignette((ctx, t) => {
  panel(ctx, 30, 100, 480, 650, (c, w) => {
    const r = rng(980)
    wash(c, -10, -10, w + 20, 260, '#f0b27a', 981)
    wash(c, -10, 180, w + 20, 200, '#e88a6a', 982)
    blob(c, w / 2, 360, 80, 80, '#f7d27a', 983)
    wash(c, -10, 360, w + 20, 300, '#6f7fa3', 984)
    for (let i = 0; i < 7; i++) line(c, 60 + r() * 360, 400 + i * 30, 120 + r() * 300, 402 + i * 30, 'rgba(247,210,122,0.6)', 3, 985 + i)
    // pier
    wash(c, -10, 520, w + 20, 26, '#5c3c2a', 992)
    for (let i = 0; i < 6; i++) line(c, 20 + i * 90, 540, 20 + i * 90, 660, '#5c3c2a', 8, 993 + i)
    mira(c, 190, 598, { s: 0.7, pose: 'sit', mouth: 'smile', eyes: 'closed' })
    arun(c, 300, 598, { s: 0.7, pose: 'sit', facing: -1, mouth: 'smile', eyes: 'closed' })
    for (let i = 0; i < 7; i++) {
      const q = ((t * 0.12 + i / 7) % 1)
      c.save()
      c.globalAlpha = Math.sin(q * Math.PI)
      heart(c, 70 + ((i * 131) % 340), 360 - q * 320, 0.7 + (i % 3) * 0.25, i % 2 ? C.rose : C.arun)
      c.restore()
    }
  })
  label(ctx, 'August', 270, 750, fade(t, 0.4))
}, 'Summer was over far too soon.', { wait: 1.2 })

export default {
  title: 'Summer',
  pages: [camera, albumPage, sunset],
}
