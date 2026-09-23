// Chapter 8 · Tidy — Mira is coming over for the first time and Arun's flat
// is a mess. Clear it before the doorbell rings.
import { vignette } from '../engine.js'
import {
  W, H, C, paper, wash, blob, line, text, caption, tapHint, windowFrame,
  arun, mira, plant, phone, panel, label, heart, dist, clamp, lerp, easeOut, inRect,
} from '../paint.js'
import { icons, SPEAKER } from '../bubblePuzzle.js'
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

// Arun's flat: warm wall, a window, a worn rug and his violin on its stand.
function flat(ctx, w, h, floor, posters = false) {
  wash(ctx, -10, -10, w + 20, floor + 20, '#e7cfb3', 801)
  const wy = Math.max(30, floor - 440)
  windowFrame(ctx, 40, wy, 160, Math.min(190, floor - wy - 40), '#a9cde0', 802)
  wash(ctx, -10, floor, w + 20, h - floor + 10, '#a77b58', 803)
  for (let i = 0; i < 4; i++) line(ctx, -10, floor + 40 + i * 70, w + 10, floor + 36 + i * 70, 'rgba(80,50,30,0.25)', 2, 804 + i)
  blob(ctx, w / 2, floor + 150, 190, 60, C.plum, 808, 0.35) // rug
  if (posters) {
    // posters of past gigs
    wash(ctx, 250, 40, 70, 96, C.teal, 809, 0.8)
    wash(ctx, 262, 60, 46, 28, C.cream, 810, 0.8)
    wash(ctx, 350, 60, 60, 80, C.mira, 846, 0.8)
    blob(ctx, 380, 90, 14, 14, C.arun, 847)
  }
}

// His violin hanging on the wall, the one tidy thing in the room.
function violin(ctx, x, y) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(-0.3)
  ctx.scale(0.85, 0.85)
  line(ctx, 0, -110, 0, -30, C.ink, 7, 848)
  blob(ctx, 0, -10, 26, 30, '#9a5a2c', 849)
  blob(ctx, 0, 40, 34, 38, '#9a5a2c', 850)
  line(ctx, -6, 14, -6, 30, C.ink, 3, 851)
  line(ctx, 6, 14, 6, 30, C.ink, 3, 852)
  line(ctx, 0, -110, 0, 60, 'rgba(47,43,51,0.5)', 1.5, 853)
  ctx.restore()
}

// ---------- clutter ----------
// Each piece of mess is drawn around (0, 0), roughly 90px across.

const draws = {
  shirt(ctx) {
    wash(ctx, -30, -30, 60, 62, '#6d8fb3', 820)
    wash(ctx, -52, -30, 30, 26, '#6d8fb3', 821)
    wash(ctx, 22, -30, 30, 26, '#6d8fb3', 822)
    line(ctx, -10, -30, 10, -30, C.ink, 3, 823)
  },
  sock(ctx) {
    line(ctx, -14, -30, -12, 14, C.arun, 18, 824)
    line(ctx, -12, 14, 24, 20, C.arun, 18, 825)
    line(ctx, -22, -28, -4, -28, C.cream, 5, 826)
  },
  jumper(ctx) {
    wash(ctx, -38, -32, 76, 66, C.leaf, 827)
    wash(ctx, -56, -30, 26, 62, C.leaf, 828)
    wash(ctx, 30, -30, 26, 62, C.leaf, 829)
    for (let i = 0; i < 3; i++) line(ctx, -30, -12 + i * 16, 30, -12 + i * 16, 'rgba(47,43,51,0.3)', 3, 830 + i)
  },
  towel(ctx) {
    wash(ctx, -44, -24, 88, 48, C.rose, 833)
    line(ctx, -40, -8, 40, -8, C.cream, 5, 834)
    line(ctx, -40, 8, 40, 8, C.cream, 5, 835)
  },
  pizza(ctx) {
    wash(ctx, -48, -26, 96, 52, '#d9b98c', 836)
    ctx.save()
    ctx.strokeStyle = '#9a7a52'
    ctx.lineWidth = 3
    ctx.strokeRect(-44, -22, 88, 44)
    ctx.restore()
    blob(ctx, -14, -4, 9, 7, '#b88a5a', 837, 0.6)
    blob(ctx, 18, 6, 7, 5, '#b88a5a', 838, 0.6)
  },
  mug(ctx) {
    wash(ctx, -20, -26, 40, 50, C.mira, 839)
    ctx.save()
    ctx.strokeStyle = C.mira
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.arc(24, 0, 11, -1.3, 1.3)
    ctx.stroke()
    ctx.restore()
    blob(ctx, 0, -24, 16, 4, '#5c3c2a', 840)
  },
  books(ctx) {
    wash(ctx, -40, 4, 80, 20, C.teal, 841)
    wash(ctx, -34, -16, 70, 20, C.arun, 842)
    wash(ctx, -38, -36, 76, 20, C.plum, 843)
  },
  papers(ctx) {
    for (let i = 0; i < 3; i++) {
      ctx.save()
      ctx.rotate((i - 1) * 0.25)
      ctx.fillStyle = C.cream
      ctx.fillRect(-26, -34, 52, 68)
      ctx.strokeStyle = C.inkSoft
      ctx.lineWidth = 1.5
      ctx.strokeRect(-26, -34, 52, 68)
      for (let k = 0; k < 4; k++) {
        ctx.beginPath()
        ctx.moveTo(-20, -22 + k * 14)
        ctx.lineTo(20, -22 + k * 14)
        ctx.stroke()
      }
      ctx.restore()
    }
    blob(ctx, -6, 2, 5, 4, C.ink, 844)
    blob(ctx, 10, -10, 5, 4, C.ink, 845)
  },
}

const BASKET = { x: 30, y: 560, w: 160, h: 120 }
const CUPBOARD = { x: 330, y: 250, w: 180, h: 400 }
const CLOCK = { x: 270, y: 200 }
const TIME = 50 // seconds from twenty to seven until the bell

const tidy = (api) => {
  const items = [
    ['shirt', 'basket', 150, 760, -0.3],
    ['pizza', 'cupboard', 290, 720, 0.15],
    ['sock', 'basket', 440, 900, 0.6],
    ['books', 'cupboard', 110, 880, -0.1],
    ['jumper', 'basket', 280, 860, 0.2],
    ['mug', 'cupboard', 430, 770, 0],
    ['towel', 'basket', 250, 575, -0.2],
    ['papers', 'cupboard', 110, 440, 0.3],
  ].map(([kind, bin, x, y, rot]) => ({ kind, bin, x, y, hx: x, hy: y, rot, stored: null }))
  let drag = null
  let doneAt = null
  let late = false
  let wrongAt = -10
  let wrongBin = ''
  let lastTick = 0

  const binRect = (bin) => (bin === 'basket' ? BASKET : CUPBOARD)
  const binCentre = (bin) => {
    const r = binRect(bin)
    return [r.x + r.w / 2, r.y + r.h / 2]
  }
  const loose = () => items.filter((it) => it.stored === null)
  const finish = (t, lateBell) => {
    doneAt = t
    late = lateBell
    tone(MELODY[3], 0.4, { type: 'sine', gain: 0.1 })
    setTimeout(() => tone(MELODY[1], 0.6, { type: 'sine', gain: 0.1 }), 350)
  }

  return {
    debug: () => loose().map((it) => ({ from: [it.x, it.y], to: binCentre(it.bin) })),
    draw(ctx, t) {
      paper(ctx)
      flat(ctx, W, H, 640)
      violin(ctx, 235, 420)
      const clockT = doneAt !== null ? doneAt : t
      const left = clamp(1 - clockT / TIME, 0, 1)
      if (doneAt === null && t >= TIME) {
        // the bell doesn't wait: whatever's left gets shoved under the rug
        for (const it of loose()) it.stored = { at: t, under: true }
        finish(t, true)
      }

      // cupboard: doors flung open, shelves inside
      wash(ctx, CUPBOARD.x, CUPBOARD.y, CUPBOARD.w, CUPBOARD.h, '#6b4a34', 811)
      wash(ctx, CUPBOARD.x + 12, CUPBOARD.y + 14, CUPBOARD.w - 24, CUPBOARD.h - 28, '#3e2c22', 812)
      for (let k = 1; k < 3; k++) line(ctx, CUPBOARD.x + 12, CUPBOARD.y + k * 130, CUPBOARD.x + CUPBOARD.w - 12, CUPBOARD.y + k * 130, '#8a6446', 6, 813 + k)
      wash(ctx, CUPBOARD.x - 40, CUPBOARD.y + 6, 40, CUPBOARD.h - 12, '#8a6446', 816) // open door
      // basket
      wash(ctx, BASKET.x, BASKET.y + 30, BASKET.w, BASKET.h - 30, '#c9a46a', 817)
      for (let k = 0; k < 4; k++) line(ctx, BASKET.x + 10, BASKET.y + 50 + k * 20, BASKET.x + BASKET.w - 10, BASKET.y + 50 + k * 20, '#9a7a48', 3, 818 + k)

      // stored things: clothes heap up in the basket, the rest sits on the shelves
      let nb = 0
      let nc = 0
      for (const it of items) {
        if (!it.stored || it.stored.under) continue
        const k = easeOut((t - it.stored.at) / 0.35)
        let tx
        let ty
        if (it.bin === 'basket') {
          tx = BASKET.x + 40 + (nb % 3) * 35
          ty = BASKET.y + 40 - Math.floor(nb / 3) * 14
          nb++
        } else {
          tx = CUPBOARD.x + 50 + (nc % 2) * 80
          ty = CUPBOARD.y + 100 + Math.floor(nc / 2) * 130
          nc++
        }
        ctx.save()
        ctx.translate(lerp(it.x, tx, k), lerp(it.y, ty, k))
        ctx.scale(lerp(1, 0.7, k), lerp(1, 0.7, k))
        ctx.rotate(it.rot * (1 - k))
        draws[it.kind](ctx)
        ctx.restore()
      }
      // basket rim in front of the clothes
      wash(ctx, BASKET.x - 6, BASKET.y + 26, BASKET.w + 12, 16, '#a9844e', 822)

      // lumpy rug if things were swept under it
      if (late) blob(ctx, W / 2, 780, 170, 40, C.plum, 823, 0.5 * easeOut((t - doneAt) / 0.4))

      // loose mess, dragged piece on top
      for (const it of [...loose().filter((q) => q !== drag), ...(drag ? [drag] : [])]) {
        ctx.save()
        ctx.translate(it.x, it.y)
        ctx.rotate(it === drag ? 0 : it.rot)
        if (it === drag) ctx.scale(1.1, 1.1)
        draws[it.kind](ctx)
        ctx.restore()
      }

      // the clock on the wall, ticking towards seven
      blob(ctx, CLOCK.x, CLOCK.y, 56, 56, left < 0.25 ? C.arun : C.ink, 824)
      ctx.save()
      ctx.fillStyle = C.cream
      ctx.beginPath()
      ctx.arc(CLOCK.x, CLOCK.y, 44, 0, Math.PI * 2)
      ctx.fill()
      const minute = -Math.PI / 2 - left * (Math.PI * 2 / 3) // 20 minutes to 12
      const hour = -Math.PI / 2 + Math.PI * 2 * (6.67 + (1 - left) * 0.33) / 12
      ctx.strokeStyle = C.ink
      ctx.lineCap = 'round'
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.moveTo(CLOCK.x, CLOCK.y)
      ctx.lineTo(CLOCK.x + Math.cos(hour) * 22, CLOCK.y + Math.sin(hour) * 22)
      ctx.stroke()
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(CLOCK.x, CLOCK.y)
      ctx.lineTo(CLOCK.x + Math.cos(minute) * 36, CLOCK.y + Math.sin(minute) * 36)
      ctx.stroke()
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2
        blob(ctx, CLOCK.x + Math.cos(a) * 38, CLOCK.y + Math.sin(a) * 38, 2, 2, C.ink, 825 + i)
      }
      ctx.restore()
      if (doneAt === null && left < 0.25 && t - lastTick > 1) {
        lastTick = t
        pop(900)
      }

      if (doneAt === null) {
        text(ctx, 'tidy up before seven!', W / 2, 60, { size: 30, color: C.ink })
        text(ctx, 'clothes in the basket,\nthe rest in the cupboard', W / 2, 118, {
          size: 24, color: C.inkSoft,
        })
        if (t - wrongAt < 1.2) {
          text(ctx, `that goes in the ${wrongBin}`, W / 2, 470, { size: 26, color: C.arun, alpha: 1 - (t - wrongAt) / 1.2 })
        }
        if (!drag && loose().length === 8) tapHint(ctx, items[0].x, items[0].y, t)
      } else {
        // the doorbell rings
        const k = (t - doneAt) % 0.8
        ctx.save()
        ctx.strokeStyle = C.arun
        ctx.lineWidth = 3
        ctx.globalAlpha = 1 - k / 0.8
        for (const d of [-1, 1]) {
          ctx.beginPath()
          ctx.arc(W / 2 + d * 90, 80, 16 + k * 24, d < 0 ? Math.PI - 0.6 : -0.6, d < 0 ? Math.PI + 0.6 : 0.6)
          ctx.stroke()
        }
        ctx.restore()
        text(ctx, 'ding dong!', W / 2, 80, { size: 36, color: C.arun, alpha: fade(t, doneAt) })
        caption(ctx, late ? 'Nearly. The rest went under the rug.' : 'Just in time.', fade(t, doneAt + 0.2))
        tapHint(ctx, 50, 50, t)
      }
    },
    down(x, y, t) {
      if (doneAt !== null) {
        if (t - doneAt > 0.8) api.finish()
        return
      }
      let best = null
      let bd = 60
      for (const it of loose()) {
        const d = dist(x, y, it.x, it.y)
        if (d < bd) {
          bd = d
          best = it
        }
      }
      if (best) {
        drag = best
        drag.ox = x - best.x
        drag.oy = y - best.y
        pop(400)
      }
    },
    move(x, y) {
      if (!drag) return
      drag.x = clamp(x - drag.ox, 30, W - 30)
      drag.y = clamp(y - drag.oy, 160, H - 30)
    },
    up(x, y, t) {
      if (!drag) return
      const it = drag
      drag = null
      const over = inRect(it.x, it.y, BASKET) ? 'basket' : inRect(it.x, it.y, CUPBOARD) ? 'cupboard' : null
      if (over === it.bin) {
        it.stored = { at: t }
        pop(it.bin === 'basket' ? 520 : 660)
        if (loose().length === 0) finish(t, false)
      } else if (over) {
        // wrong place: it slides back to where it was
        wrongAt = t
        wrongBin = it.bin
        it.x = it.hx
        it.y = it.hy
        pop(220)
      } else {
        // dropped on the floor: it stays there
        it.hx = it.x
        it.hy = it.y
      }
    },
  }
}

// Phone message from Mira: her bubble with a house and a clock.
function msg(ctx, x, y, s, icon, speaker = 'mira') {
  const sp = SPEAKER[speaker]
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  ctx.fillStyle = sp.fill
  ctx.strokeStyle = C.ink
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.roundRect(0, 0, 400, 150, 24)
  ctx.fill()
  ctx.stroke()
  icon(ctx, 400, 150)
  ctx.restore()
}

const mess = vignette((ctx, t) => {
  reveal(ctx, t, 0.9, 30, 100, 480, 380, (c, w, h) => {
    flat(c, w, h, 250, true)
    // the mess, everywhere
    const spots = [['shirt', 90, 300], ['pizza', 250, 330], ['books', 380, 290], ['sock', 170, 350], ['mug', 420, 350], ['papers', 60, 350]]
    for (const [k, x, y] of spots) {
      c.save()
      c.translate(x, y)
      c.scale(0.9, 0.9)
      draws[k](c)
      c.restore()
    }
    arun(c, 300, 370, { s: 0.8, facing: -1, mouth: 'open', eyes: 'open' })
    c.save()
    c.translate(262, 170)
    phone(c, -12, -20, 24, 40, '#fff6dd')
    c.restore()
  })
  label(ctx, 'Friday evening', 270, 480, fade(t, 0.3))
  panel(ctx, 30, 520, 480, 230, (c, w, h) => {
    wash(c, -10, -10, w + 20, h + 20, '#e7cfb3', 854)
    phone(c, 120, 20, 240, 280, '#fff6dd')
    msg(c, 142, 60, 0.49, icons.row(icons.home, icons.clock))
    const k = fade(t, 1.4)
    c.save()
    c.globalAlpha *= k
    c.fillStyle = C.ink
    c.font = 'bold 34px Georgia'
    c.textAlign = 'center'
    c.fillText('7:00', 240, 180)
    c.restore()
  })
}, "She'd be here at seven. Oh no.", { wait: 1.6 })

// The door: tap it to let her in. She has brought a plant.
const door = (api) => {
  let openAt = null
  let doneAt = null
  let rang = false
  return {
    debug: () => ({ door: [300, 520] }),
    draw(ctx, t) {
      paper(ctx)
      wash(ctx, 0, 0, W, 740, '#e7cfb3', 860)
      wash(ctx, 0, 740, W, 220, '#a77b58', 861)
      // hallway: coat hook with his jacket, a framed photo, a wall lamp, the doormat
      line(ctx, 40, 300, 150, 300, '#7b5238', 8, 881)
      wash(ctx, 60, 306, 50, 120, '#50627a', 882)
      wash(ctx, 112, 306, 22, 80, C.arun, 883)
      wash(ctx, 60, 150, 90, 70, C.cream, 884)
      blob(ctx, 105, 190, 26, 18, C.sky, 885)
      blob(ctx, 90, 200, 16, 10, C.leaf, 886)
      line(ctx, 475, 330, 475, 290, C.ink, 4, 887)
      blob(ctx, 475, 282, 22, 16, C.mira, 888)
      blob(ctx, 475, 300, 50, 44, '#fff3c4', 889, 0.3)
      wash(ctx, 210, 752, 200, 26, C.arun, 890, 0.7)
      if (!rang && t > 0.3) {
        rang = true
        tone(MELODY[3], 0.4, { type: 'sine', gain: 0.1 })
        setTimeout(() => tone(MELODY[1], 0.6, { type: 'sine', gain: 0.1 }), 350)
      }
      const k = openAt === null ? 0 : easeOut((t - openAt) / 0.8)
      // doorway: the landing outside, with Mira and her plant
      wash(ctx, 200, 260, 220, 490, '#c9d7de', 862)
      if (openAt !== null) {
        mira(ctx, 300, 770, { s: 0.95, facing: -1, mouth: 'smile', pose: 'stand' })
        plant(ctx, 318, 660, 1.6, C.leaf, 863)
        if (t - openAt > 1) heart(ctx, 190, 440 - (t - openAt - 1) * 20, 1.1 * fade(t, openAt + 1), C.rose)
      }
      // the door swings inwards, shrinking towards its hinge
      ctx.save()
      ctx.translate(420, 0)
      ctx.scale(1 - k * 0.8, 1)
      wash(ctx, -220, 260, 220, 490, C.teal, 864)
      wash(ctx, -190, 300, 160, 170, '#4f8683', 865, 0.5)
      wash(ctx, -190, 510, 160, 200, '#4f8683', 866, 0.5)
      blob(ctx, -30, 520, 9, 9, '#f2c14e', 867)
      ctx.restore()
      line(ctx, 196, 256, 424, 256, '#7b5238', 10, 868)
      line(ctx, 196, 256, 196, 750, '#7b5238', 10, 869)
      line(ctx, 424, 256, 424, 750, '#7b5238', 10, 870)
      // Arun, hair smoothed, at the side of the door
      arun(ctx, 110, 805, { facing: 1, pose: openAt !== null ? 'wave' : 'stand', t, mouth: 'smile' })

      if (openAt === null) {
        // ringing bell lines
        const q = (t % 1.2) / 1.2
        ctx.save()
        ctx.strokeStyle = C.ink
        ctx.lineWidth = 3
        ctx.globalAlpha = 1 - q
        ctx.beginPath()
        ctx.arc(310, 200, 30 + q * 40, Math.PI * 1.15, Math.PI * 1.85)
        ctx.stroke()
        ctx.restore()
        text(ctx, 'tap the door', W / 2, 90, { size: 30, color: C.inkSoft })
        tapHint(ctx, 300, 520, t)
      } else if (doneAt === null && t - openAt > 1) doneAt = t
      if (doneAt !== null) {
        caption(ctx, 'She brought a plant. And a smile.', fade(t, doneAt))
        tapHint(ctx, 50, 50, t)
      }
    },
    down(x, y, t) {
      if (doneAt !== null) {
        if (t - doneAt > 0.6) api.finish()
        return
      }
      if (openAt === null && x > 180 && x < 440 && y > 240 && y < 770) {
        openAt = t
        pop(300)
      }
    },
  }
}

function cupOnSill(ctx, x, y) {
  wash(ctx, x - 16, y - 30, 32, 30, C.teal, 891)
  wash(ctx, x + 26, y - 24, 30, 24, C.mira, 892)
}

const evening = vignette((ctx, t) => {
  reveal(ctx, t, 0.9, 30, 100, 480, 400, (c, w, h) => {
    flat(c, w, h, 280)
    // dinner at the little table
    wash(c, 150, 270, 180, 16, '#7b5238', 871)
    line(c, 240, 284, 240, 380, '#5c3c2a', 8, 872)
    mira(c, 110, 400, { s: 0.75, pose: 'sit', mouth: 'smile' })
    arun(c, 370, 400, { s: 0.75, pose: 'sit', facing: -1, mouth: 'smile' })
    blob(c, 200, 262, 24, 8, C.cream, 873)
    blob(c, 280, 262, 24, 8, C.cream, 874)
    blob(c, 200, 258, 12, 5, C.arun, 875)
    blob(c, 280, 258, 12, 5, C.arun, 876)
  })
  label(ctx, 'Later', 270, 500, fade(t, 0.3))
  panel(ctx, 30, 540, 480, 210, (c, w, h) => {
    wash(c, -10, -10, w + 20, h + 20, '#e7cfb3', 877)
    windowFrame(c, 100, 10, 280, 170, '#f2c98a', 878)
    wash(c, 80, 170, 320, 20, C.cream, 879) // sill
    plant(c, 240, 176, 2, C.leaf, 880)
    cupOnSill(c, 330, 172)
  })
}, 'The plant got the sunniest spot.', { wait: 1.6 })

export default {
  title: 'Tidy',
  pages: [mess, tidy, door, evening],
}
