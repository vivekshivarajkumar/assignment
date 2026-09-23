// Chapter 12 · Encore — Arun's first real gig. Mira papers the city with posters,
// then claps along from the front row until the whole room joins in.
import { vignette } from '../engine.js'
import {
  W, C, paper, wash, blob, line, text, caption, tapHint, panel, label, roundRect,
  mira, arun, note, heart, rng, mix, clamp, dist, easeOut, lerp,
} from '../paint.js'
import { pop, tone, MELODY } from '../sound.js'

function violin(ctx, x, y, s = 1, rot = 0, color = C.mira) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  ctx.scale(s, s)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(0, 18, 22, 20, 0, 0, Math.PI * 2)
  ctx.ellipse(0, -14, 17, 16, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillRect(-3, -60, 6, 40)
  ctx.beginPath()
  ctx.arc(0, -62, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// The gig poster: no words, just a violin in a spotlight and a scatter of notes.
function poster(ctx, x, y, s = 1, rot = 0) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  ctx.scale(s, s)
  ctx.shadowColor = 'rgba(0,0,0,0.25)'
  ctx.shadowBlur = 6
  ctx.shadowOffsetY = 3
  ctx.fillStyle = C.night
  ctx.fillRect(-55, -75, 110, 150)
  ctx.shadowColor = 'transparent'
  blob(ctx, 0, -18, 38, 38, C.arun, 1201)
  violin(ctx, 0, -8, 0.8, 0.25)
  note(ctx, -34, -44, 0.45, C.cream)
  note(ctx, 32, -52, 0.4, C.cream)
  ctx.fillStyle = C.mira
  ctx.fillRect(-40, 38, 80, 8)
  ctx.fillStyle = C.cream
  ctx.fillRect(-30, 54, 60, 5)
  ctx.fillRect(-22, 64, 44, 4)
  ctx.restore()
}

function brickWall(ctx, h) {
  wash(ctx, 0, 0, W, h, '#c98f6e', 1202)
  ctx.save()
  ctx.strokeStyle = 'rgba(120,70,50,0.35)'
  ctx.lineWidth = 2
  for (let row = 0, y = 20; y < h - 4; row++, y += 36) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(W, y)
    for (let x = (row % 2) * 40; x < W; x += 80) {
      ctx.moveTo(x, y)
      ctx.lineTo(x, Math.min(y + 36, h - 4))
    }
    ctx.stroke()
  }
  ctx.restore()
}

// Drag posters from Mira's pile onto the wall.
const posters = (api) => {
  const NEED = 4
  const STACK = { x: 190, y: 745 }
  const TARGETS = [[160, 250], [380, 220], [270, 430], [420, 460]]
  const pinned = []
  let held = null
  let doneAt = null
  const r = rng(1203)
  return {
    debug: () => ({ stack: [STACK.x, STACK.y], targets: TARGETS, done: doneAt !== null }),
    draw(ctx, t) {
      paper(ctx)
      brickWall(ctx, 624)
      // old scraps of other people's posters
      wash(ctx, 60, 520, 70, 50, C.greyLight, 1204, 0.7)
      wash(ctx, 470, 130, 60, 90, '#d8c9a8', 1205, 0.7)
      wash(ctx, 0, 620, W, 340, '#a9a39c', 1206)
      wash(ctx, 0, 620, W, 16, '#8e8983', 1207)
      // a bin and a puddle catching the lamplight
      blob(ctx, 390, 880, 110, 22, '#c9c3bb', 1213)
      blob(ctx, 390, 880, 40, 8, '#f7d58a', 1214, 0.5)
      wash(ctx, 350, 660, 80, 120, '#5e7d6e', 1215)
      wash(ctx, 342, 650, 96, 18, '#4d6a5c', 1216)
      // street lamp
      wash(ctx, 478, 180, 12, 450, C.ink, 1208)
      blob(ctx, 484, 170, 70, 60, '#f7d58a', 1209, 0.4)
      wash(ctx, 460, 150, 50, 26, C.ink, 1210)
      for (const p of pinned) {
        const k = easeOut((t - p.at) / 0.3)
        poster(ctx, p.x, p.y, lerp(1.15, 1, k), p.rot)
        for (const d of [-1, 1]) blob(ctx, p.x + d * 40, p.y - 66, 5, 5, C.rose, 1211 + d)
      }
      mira(ctx, 110, 940, { pose: 'hug', mouth: 'smile', eyes: held ? 'open' : 'down' })
      const left = NEED - pinned.length - (held ? 1 : 0)
      for (let i = 0; i < left; i++) poster(ctx, STACK.x + i * 4, STACK.y - i * 5, 0.6, -0.15 + i * 0.06)
      if (held) poster(ctx, held.x, held.y, 1, held.rot)
      if (doneAt === null) {
        text(ctx, 'drag the posters onto the wall', W / 2 + 20, 70, { size: 30 })
        if (!held && left > 0) tapHint(ctx, STACK.x, STACK.y, t, C.cream)
      } else {
        caption(ctx, 'She put one on every wall between home and the club.', easeOut((t - doneAt) / 0.6))
        tapHint(ctx, W - 50, 50, t, C.cream)
      }
    },
    down(x, y, t) {
      if (doneAt !== null) {
        if (t - doneAt > 0.6) api.finish()
        return
      }
      if (pinned.length < NEED && dist(x, y, STACK.x, STACK.y) < 90) {
        held = { x, y, rot: (r() - 0.5) * 0.2 }
        pop(420)
      }
    },
    move(x, y) {
      if (!held) return
      held.x = x
      held.y = y
    },
    up(x, y, t) {
      if (!held) return
      if (y < 600) {
        pinned.push({ x: clamp(x, 80, 440), y: clamp(y, 150, 520), rot: held.rot, at: t })
        pop(700)
        if (pinned.length === NEED) doneAt = t
      }
      held = null
    },
  }
}

// A crowd seen from behind: head and shoulders. c = colour amount (0 grey .. 1 full).
function fan(ctx, x, y, sc, top, hair, c, t, cheer) {
  const g = (col) => mix(col, '#6e6a78', 1 - c)
  const lift = cheer ? Math.abs(Math.sin(t * 6 + x)) * 8 : 0
  if (cheer) {
    ctx.save()
    ctx.strokeStyle = g(top)
    ctx.lineWidth = 12 * sc
    ctx.lineCap = 'round'
    for (const d of [-1, 1]) line(ctx, x + d * 28 * sc, y + 20 * sc, x + d * (18 + lift) * sc, y - 50 * sc, g(top), 12 * sc, 1)
    ctx.restore()
  }
  ctx.fillStyle = g(top)
  roundRect(ctx, x - 40 * sc, y + 12 * sc, 80 * sc, 140 * sc, 26 * sc)
  ctx.fill()
  ctx.fillStyle = g(hair)
  ctx.beginPath()
  ctx.arc(x, y - lift * 0.3, 24 * sc, 0, Math.PI * 2)
  ctx.fill()
}

const FAN_COLS = [C.teal, C.rose, C.plum, C.sky, C.leaf, '#c9a0dc', '#d9826f', '#7fb3c9']
const HAIRS = ['#3a2a22', '#2b2230', '#7a5a3a', '#c98a2a', '#55514e']
const CROWD = [
  ...Array.from({ length: 6 }, (_, i) => ({ x: 70 + i * 80, y: 610, s: 0.8 })),
  ...Array.from({ length: 5 }, (_, i) => ({ x: 105 + i * 82, y: 680, s: 0.95 })),
  ...[60, 170, 380, 490].map((x) => ({ x, y: 760, s: 1.1 })),
].map((f, i) => ({ ...f, top: FAN_COLS[i % FAN_COLS.length], hair: HAIRS[i % HAIRS.length] }))
const LIGHT_ORDER = [12, 1, 8, 4, 13, 6, 0, 10, 3, 14, 7, 2, 9, 5, 11]

function stage(ctx, t, glow) {
  wash(ctx, 0, 0, W, 960, mix('#2e2b45', '#3d2f4f', glow), 1220)
  for (let k = 0; k < 7; k++) wash(ctx, 40 + k * 66, 90, 62, 390, mix('#4a3548', '#9c3f33', glow * 0.7 + 0.2), 1221 + k)
  ctx.save()
  ctx.globalAlpha = 0.18 + glow * 0.15
  ctx.fillStyle = '#fff3c4'
  ctx.beginPath()
  ctx.moveTo(250, 0)
  ctx.lineTo(290, 0)
  ctx.lineTo(380, 500)
  ctx.lineTo(160, 500)
  ctx.fill()
  ctx.restore()
  wash(ctx, 20, 470, 500, 50, '#5a4760', 1230)
  // string of bulbs
  for (let k = 0; k < 10; k++) {
    const x = 30 + k * 53
    const y = 50 + Math.sin(k * 0.9) * 8
    blob(ctx, x, y, 7, 8, mix('#6e6a78', FAN_COLS[k % FAN_COLS.length], glow), 1231 + k)
  }
}

// Notes slide along the lane; tap as each reaches the ring to clap along.
const rhythm = (api) => {
  const NEED = CROWD.length
  const LANE = 870
  const HIT = { x: 100, y: LANE }
  const SPEED = 230
  const WINDOW = 0.2
  const PATTERN = [0.7, 0.7, 0.7, 0.35, 0.35, 0.7, 1.05, 0.7, 0.35, 0.35]
  const notes = []
  let nextArrival = 3
  let k = 0
  let hits = 0
  const lit = []
  let flashAt = -10
  let missAt = -10
  let doneAt = null
  let now = 0
  return {
    debug: () => {
      const n = notes.find((q) => !q.hit && !q.missed && q.arrive - now > -WINDOW / 2)
      return { next: n ? n.arrive - now : null, hits, done: doneAt !== null }
    },
    draw(ctx, t) {
      now = t
      const glow = clamp(hits / NEED, 0, 1)
      paper(ctx)
      stage(ctx, t, glow)
      arun(ctx, 270, 500, { s: 0.85, pose: 'violin', t, facing: -1, eyes: 'closed', mouth: hits > 5 ? 'smile' : 'none' })
      while (doneAt === null && nextArrival < t + 3) {
        notes.push({ arrive: nextArrival, idx: k, hit: null, played: false, missed: false })
        nextArrival += PATTERN[k % PATTERN.length]
        k += 1
      }
      // audience, back rows first; Mira in the front row, always in colour
      CROWD.forEach((f, i) => {
        const at = lit[LIGHT_ORDER.indexOf(i)]
        const c = at === undefined ? 0 : easeOut((t - at) / 0.4)
        fan(ctx, f.x, f.y, f.s, f.top, f.hair, c, t, c > 0.5)
        if (i === 10) {
          fan(ctx, 275, 760, 1.1, C.mira, C.miraHair, 1, t, t - flashAt < 0.25 || doneAt !== null)
          blob(ctx, 262, 724, 13, 13, C.miraHair, 1242)
        }
      })
      if (doneAt === null || t - doneAt < 0.6) {
        ctx.save()
        ctx.globalAlpha = doneAt === null ? 1 : 1 - (t - doneAt) / 0.6
        wash(ctx, 20, LANE - 30, 500, 60, '#1f1d30', 1240, 0.8)
        const ring = t - flashAt < 0.3 ? 1 + (t - flashAt) * 2 : 1
        ctx.strokeStyle = t - missAt < 0.25 ? C.greyDark : C.cream
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.arc(HIT.x + (t - missAt < 0.25 ? Math.sin(t * 60) * 4 : 0), HIT.y, 30 * ring, 0, Math.PI * 2)
        ctx.stroke()
        for (const n of notes) {
          if (!n.played && t >= n.arrive) {
            n.played = true
            if (doneAt === null) tone(MELODY[n.idx % MELODY.length], 0.45, { gain: 0.06 })
          }
          if (!n.hit && !n.missed && t - n.arrive > WINDOW) n.missed = true
          const x = HIT.x + (n.arrive - t) * SPEED
          if (n.hit || x < 20 || x > 560) continue
          note(ctx, x - 4, LANE + 10, 1, n.missed ? C.greyDark : C.mira, n.missed ? 0.5 : 1)
        }
        ctx.restore()
      }
      if (t - flashAt < 0.5) {
        const a = 1 - (t - flashAt) / 0.5
        for (const d of [-1, 1]) blob(ctx, HIT.x + d * (14 - a * 6), HIT.y - 70, 12, 18, C.skin1, 1241 + d, a)
        line(ctx, HIT.x - 30, HIT.y - 100, HIT.x - 40, HIT.y - 112, C.cream, 3, 1)
        line(ctx, HIT.x + 30, HIT.y - 100, HIT.x + 40, HIT.y - 112, C.cream, 3, 2)
      }
      while (notes.length && notes[0].arrive < t - 2) notes.shift()
      if (doneAt === null) {
        if (hits < 3) text(ctx, 'tap as each note reaches the ring', W / 2 + 20, 930, { size: 26, color: C.cream })
        if (hits < 3) tapHint(ctx, HIT.x, HIT.y, t, C.cream)
      } else {
        for (let j = 0; j < 8; j++) {
          const q = (t - doneAt) * 0.25 + j / 8
          ctx.save()
          ctx.globalAlpha = 1 - (q % 1)
          heart(ctx, 60 + ((j * 131) % 420), 560 - (q % 1) * 500, 0.7, FAN_COLS[j])
          ctx.restore()
        }
        caption(ctx, 'By the last song, the whole room was clapping with her.', easeOut((t - doneAt - 0.3) / 0.6))
        if (t - doneAt > 0.6) tapHint(ctx, W - 50, 50, t, C.cream)
      }
    },
    down(x, y, t) {
      if (doneAt !== null) {
        if (t - doneAt > 0.8) api.finish()
        return
      }
      const n = notes.find((q) => !q.hit && !q.missed && Math.abs(q.arrive - t) < WINDOW)
      if (!n) {
        missAt = t
        return
      }
      n.hit = t
      flashAt = t
      lit.push(t)
      hits += 1
      pop(900 + (hits % 3) * 60)
      if (hits >= NEED) doneAt = t
    },
  }
}

const club = vignette((ctx, t) => {
  panel(ctx, 30, 100, 480, 420, (ctx) => {
    ctx.translate(-30, -60)
    stage(ctx, t, 0.3)
    arun(ctx, 270, 500, { s: 0.85, facing: -1, eyes: 'down' })
    violin(ctx, 225, 400, 0.9, 0.3, '#9a5a2c')
    wash(ctx, 0, 520, W, 60, '#2e2b45', 1250)
  })
  panel(ctx, 30, 560, 480, 230, (ctx, w, h) => {
    wash(ctx, 0, 0, w, h, '#2e2b45', 1251)
    CROWD.slice(0, 11).forEach((f) => fan(ctx, f.x - 30, f.y - 520, f.s, f.top, f.hair, 0, t, false))
    mira(ctx, 250, 420, { pose: 'wave', t, mouth: 'smile' })
    CROWD.slice(11).forEach((f) => fan(ctx, f.x - 30, f.y - 520, f.s, f.top, f.hair, 0, t, false))
  }, { alpha: easeOut((t - 0.6) / 0.5) })
  label(ctx, 'Friday, the Blue Door', W / 2, 540, easeOut((t - 0.3) / 0.5))
}, 'A room full of strangers. He looked for one face.')

const after = vignette((ctx, t) => {
  panel(ctx, 30, 100, 480, 420, (ctx) => {
    ctx.translate(-30, -40)
    brickWall(ctx, 460)
    poster(ctx, 150, 250, 1, -0.05)
    poster(ctx, 420, 230, 1, 0.06)
    blob(ctx, 300, 120, 150, 120, '#f7d58a', 1260, 0.3)
    wash(ctx, 0, 440, W, 200, '#4d4b5e', 1261)
    arun(ctx, 310, 580, { pose: 'hug', facing: -1, eyes: 'closed', mouth: 'smile' })
    mira(ctx, 240, 580, { pose: 'hug', eyes: 'closed', mouth: 'smile' })
  })
  panel(ctx, 30, 560, 480, 230, (ctx, w, h) => {
    wash(ctx, 0, 0, w, h, '#35365a', 1262)
    blob(ctx, 390, 50, 26, 26, '#f5eee2', 1263)
    wash(ctx, 0, 170, w, 60, '#4d4b5e', 1264)
    const x = 150 + t * 12
    mira(ctx, x, 200, { s: 0.5, pose: 'walk', t })
    arun(ctx, x + 44, 200, { s: 0.5, pose: 'walk', t: t + 0.4 })
    for (let j = 0; j < 3; j++) {
      const q = (t * 0.3 + j / 3) % 1
      note(ctx, x + 20 + j * 30, 70 - q * 40, 0.7, C.mira, 1 - q)
    }
  }, { alpha: easeOut((t - 0.6) / 0.5) })
  label(ctx, 'After the encore', W / 2, 540, easeOut((t - 0.3) / 0.5))
}, 'They walked home humming his song, very badly.')

export default {
  title: 'Encore',
  pages: [posters, club, rhythm, after],
}
