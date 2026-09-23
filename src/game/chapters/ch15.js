// Chapter 15 · Storm — the fight. Words fly faster than anyone can answer them,
// and the one thing Mira wants to say is missing a piece.
import {
  W, H, C, paper, wash, blob, line, text, caption, tapHint, windowFrame, bubble, panel, label,
  mira, arun, rng, mix, clamp, dist, easeOut, lerp, roundRect,
} from '../paint.js'
import { icons } from '../bubblePuzzle.js'
import { pop, tone } from '../sound.js'

const GREY = 0.3 // Act IV: the colour is draining again
const g = (c, k = GREY) => mix(c, C.grey, k)

// Rain streaks inside a rectangle; heavier as `amount` grows.
function rain(ctx, x, y, w, h, t, amount, seed) {
  const r = rng(seed)
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.strokeStyle = 'rgba(230,235,245,0.55)'
  ctx.lineWidth = 2
  const n = 14 + Math.round(amount * 30)
  for (let i = 0; i < n; i++) {
    const sx = x + r() * w
    const sp = 500 + r() * 300
    const sy = y + ((r() * h + t * sp) % h)
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.lineTo(sx - 6, sy + 22)
    ctx.stroke()
  }
  ctx.restore()
}

// Their living room at night, the rain against the window.
function room(ctx, t, storm = 0.3, dark = 0) {
  wash(ctx, 0, 0, W, 720, g('#cdb89c'), 1501)
  windowFrame(ctx, 170, 140, 200, 250, g(C.night), 1502)
  rain(ctx, 175, 145, 190, 240, t, storm, 1503)
  // a photo of the two of them, hanging crooked now
  ctx.save()
  ctx.translate(80, 250)
  ctx.rotate(-0.12)
  wash(ctx, -38, -48, 76, 96, g('#8a6a4a'), 1504)
  wash(ctx, -28, -38, 56, 76, g(C.sky), 1505)
  blob(ctx, -10, 10, 9, 22, g(C.mira), 1506)
  blob(ctx, 12, 10, 9, 22, g(C.arun), 1507)
  ctx.restore()
  // floor lamp, still on
  blob(ctx, 470, 470, 80, 70, '#fff3c4', 1511, 0.3)
  line(ctx, 470, 470, 470, 712, g('#5c3c2a'), 7, 1509)
  blob(ctx, 470, 714, 26, 7, g('#5c3c2a'), 1508)
  ctx.fillStyle = g(C.mira)
  ctx.beginPath()
  ctx.moveTo(446, 438)
  ctx.lineTo(494, 438)
  ctx.lineTo(510, 482)
  ctx.lineTo(430, 482)
  ctx.closePath()
  ctx.fill()
  wash(ctx, 0, 700, W, 260, g('#9c7f63'), 1512)
  // the sofa between them, nobody sitting on it
  wash(ctx, 150, 560, 240, 70, g(C.teal, 0.45), 1514)
  wash(ctx, 140, 620, 260, 80, g(C.teal, 0.4), 1515)
  blob(ctx, 200, 610, 30, 22, g(C.rose), 1516)
  line(ctx, 162, 698, 160, 714, g('#5c3c2a'), 6, 1517)
  line(ctx, 378, 698, 380, 714, g('#5c3c2a'), 6, 1518)
  blob(ctx, 270, 870, 220, 42, g(C.teal), 1513, 0.6)
  if (dark > 0) {
    ctx.fillStyle = `rgba(40,40,60,${dark})`
    ctx.fillRect(0, 0, W, H)
  }
}

function mug(ctx, x, y, color, seed) {
  wash(ctx, x - 15, y - 30, 30, 30, color, seed)
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.arc(x + 17, y - 15, 8, -1.3, 1.3)
  ctx.stroke()
  ctx.restore()
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

// ---------- page 1: the words keep coming ----------

const SAY = ['money', 'clock', 'storm', 'exclaim', 'question', 'money', 'clock', 'exclaim']
const BW = 170
const BH = 110

function saying(ctx, b, t) {
  const e = easeOut((t - b.born) / 0.35)
  const x = lerp(b.sx, b.x, e)
  const y = lerp(b.sy, b.y, e)
  let alpha = 1
  if (b.gone !== null) alpha = clamp(1 - (t - b.gone) / (b.faded ? 0.4 : 0.6), 0, 1)
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(x + BW / 2, y + BH / 2)
  ctx.rotate(b.rot + (b.gone !== null ? (t - b.gone) * b.spin : Math.sin(t * 9 + b.born) * 0.03))
  ctx.scale(Math.max(0.05, e), Math.max(0.05, e))
  bubble(ctx, -BW / 2, -BH / 2, BW, BH, g(b.mine ? '#f6dcae' : '#f0c3b8'), b.mine ? 'left' : 'right')
  ctx.scale(0.55, 0.55)
  ctx.translate(-200, -75)
  icons[b.icon](ctx, 400, 150)
  ctx.restore()
}

const fight = (api) => {
  const NEEDED = 16
  const r = rng(1520)
  const said = []
  let swats = 0
  let nextAt = 0.8
  let side = 0
  let flashAt = -9
  let doneAt = null

  const spawn = (t) => {
    side = r() < 0.75 ? 1 - side : side
    const mine = side === 0
    said.push({
      mine,
      icon: SAY[Math.floor(r() * SAY.length)],
      x: mine ? 20 + r() * 160 : 190 + r() * 160,
      y: 120 + r() * 400,
      sx: mine ? 90 : 360,
      sy: 620,
      born: t,
      gone: null,
      rot: (r() - 0.5) * 0.24,
      spin: 0,
    })
    tone(mine ? 190 : 150, 0.2, { type: 'sawtooth', gain: 0.018 })
  }
  const where = (b) => [b.x + BW / 2, b.y + BH / 2]
  const loud = () => said.filter((b) => b.gone === null)
  const swat = (b, t, fx, fy) => {
    const [cx, cy] = where(b)
    const d = Math.max(1, dist(cx, cy, fx, fy))
    b.gone = t
    b.vx = ((cx - fx) / d) * 700 + (b.mine ? -300 : 300)
    b.vy = ((cy - fy) / d) * 500 - 200
    b.spin = (r() - 0.5) * 12
  }

  return {
    debug: () => (doneAt === null ? loud().map((b) => where(b)) : []),
    draw(ctx, t, dt) {
      paper(ctx)
      const heat = clamp(swats / NEEDED, 0, 1)
      room(ctx, t, doneAt === null ? heat : 1)
      const quiet = doneAt !== null
      mira(ctx, 120, 910, {
        s: 0.8, grey: GREY, mouth: quiet ? 'sad' : 'open', eyes: quiet ? 'down' : 'open',
      })
      arun(ctx, 420, 910, {
        s: 0.8, grey: GREY, facing: quiet ? 1 : -1, mouth: quiet ? 'sad' : 'open', eyes: quiet ? 'down' : 'open',
      })

      // they talk over each other, faster and faster
      if (!quiet && t > nextAt) {
        spawn(t)
        nextAt = t + lerp(1.1, 0.32, heat)
        const talking = loud()
        if (talking.length > 7) {
          talking[0].gone = t
          talking[0].faded = true
        }
      }
      for (const b of said) {
        if (b.gone !== null && !b.faded) {
          b.x += b.vx * dt
          b.y += b.vy * dt
          b.vy += 900 * dt
        }
        saying(ctx, b, t)
      }
      for (let i = said.length - 1; i >= 0; i--) {
        if (said[i].gone !== null && t - said[i].gone > 0.7) said.splice(i, 1)
      }

      // lightning
      const flash = clamp(1 - (t - flashAt) / 0.35, 0, 1)
      if (flash > 0) {
        ctx.fillStyle = `rgba(255,255,250,${flash * 0.55})`
        ctx.fillRect(0, 0, W, H)
      }

      if (!quiet) {
        if (swats < 4) text(ctx, 'tap the words away', W / 2, 80, { size: 30, color: C.inkSoft })
        const first = loud()[0]
        if (swats === 0 && first && t - first.born > 0.4) tapHint(ctx, ...where(first), t)
      } else {
        caption(ctx, 'They said everything except what they meant.', easeOut((t - doneAt - 0.8) / 0.6))
        if (t - doneAt > 1.2) tapHint(ctx, W - 50, 50, t)
      }
    },
    down(x, y, t) {
      if (doneAt !== null) {
        if (t - doneAt > 1.2) api.finish()
        return
      }
      const talking = loud()
      for (let k = talking.length - 1; k >= 0; k--) {
        const b = talking[k]
        const [cx, cy] = where(b)
        if (Math.abs(x - cx) < BW / 2 + 10 && Math.abs(y - cy) < BH / 2 + 10 && t - b.born > 0.15) {
          swat(b, t, x, y)
          swats += 1
          pop(240 + (swats % 5) * 60)
          if (swats % 6 === 0) flashAt = t
          if (swats >= NEEDED) {
            doneAt = t
            flashAt = t
            tone(70, 1.4, { type: 'sine', gain: 0.1 })
            for (const o of loud()) swat(o, t, W / 2, 400)
          }
          return
        }
      }
    },
  }
}

// ---------- page 2: the words she can't find ----------

const PW = 400
const PH = 150
const PX = 70
const PY = 260
const TAB = 16
const N = 4
const MISSING = 1
const DIRS = [1, -1, 1]
const SAID = icons.row(icons.heart, icons.home) // "I love you. Stay."

function edge(ctx, x, dir, down) {
  const m = PH / 2
  if (down) {
    ctx.lineTo(x, m - TAB)
    ctx.arc(x, m, TAB, -Math.PI / 2, Math.PI / 2, dir < 0)
    ctx.lineTo(x, PH + 40)
  } else {
    ctx.lineTo(x, m + TAB)
    ctx.arc(x, m, TAB, Math.PI / 2, -Math.PI / 2, dir > 0)
    ctx.lineTo(x, -40)
  }
}

function piecePath(ctx, i) {
  const pw = PW / N
  ctx.beginPath()
  ctx.moveTo(i * pw, -40)
  ctx.lineTo((i + 1) * pw, -40)
  if (i < N - 1) edge(ctx, (i + 1) * pw, DIRS[i], true)
  else ctx.lineTo((i + 1) * pw, PH + 40)
  ctx.lineTo(i * pw, PH + 40)
  if (i > 0) edge(ctx, i * pw, DIRS[i - 1], false)
  else ctx.lineTo(0, -40)
  ctx.closePath()
}

function body(ctx, fill) {
  ctx.fillStyle = fill
  roundRect(ctx, 0, 0, PW, PH, 24)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(44, PH - 1)
  ctx.lineTo(40, PH + 26)
  ctx.lineTo(76, PH - 1)
  ctx.fill()
}

function piece(ctx, i, outline) {
  ctx.save()
  piecePath(ctx, i)
  ctx.clip()
  body(ctx, g('#f6dcae'))
  SAID(ctx, PW, PH)
  if (outline) {
    ctx.strokeStyle = 'rgba(47,43,51,0.6)'
    ctx.lineWidth = 3
    roundRect(ctx, 0, 0, PW, PH, 24)
    ctx.stroke()
    ctx.clip()
    piecePath(ctx, i)
    ctx.stroke()
  }
  ctx.restore()
}

const unsaid = (api) => {
  const pw = PW / N
  const loose = [[0, 150, 640], [2, 390, 600], [3, 280, 740]]
  const pieces = loose.map(([i, cx, cy]) => ({
    i, x: cx - (i + 0.5) * pw, y: cy - PH / 2, placed: false, vy: 0, rot: 0, spin: 0, shook: -9,
  }))
  const centre = (p) => [p.x + (p.i + 0.5) * pw, p.y + PH / 2]
  let drag = null
  let fullAt = null
  let fallAt = null
  let doneAt = null

  return {
    debug: () =>
      pieces.filter((p) => !p.placed).map((p) => ({ from: centre(p), to: [PX + (p.i + 0.5) * pw, PY + PH / 2] })),
    draw(ctx, t, dt) {
      paper(ctx)
      room(ctx, t, 0.6, 0.18)
      mira(ctx, 110, 950, { s: 0.6, grey: GREY, mouth: 'sad' })
      arun(ctx, 440, 950, { s: 0.6, grey: GREY, facing: 1, eyes: 'down' })

      if (fullAt !== null && fallAt === null && t - fullAt > 1.8) {
        fallAt = t
        pieces.forEach((p, k) => {
          p.vy = -120 - k * 40
          p.spin = (k - 1) * 1.6 + 0.6
        })
        tone(98, 1.2, { type: 'sine', gain: 0.1 })
      }
      if (fallAt !== null && doneAt === null && t - fallAt > 1.1) doneAt = t

      // the gap where the missing piece should be
      ctx.save()
      ctx.translate(PX, PY)
      if (fallAt !== null) ctx.globalAlpha = clamp(1 - (t - fallAt) / 1.5, 0.35, 1)
      ctx.setLineDash([10, 10])
      ctx.strokeStyle = 'rgba(47,43,51,0.3)'
      ctx.lineWidth = 3
      roundRect(ctx, 0, 0, PW, PH, 24)
      ctx.stroke()
      if (fullAt !== null && fallAt === null) {
        const pulse = 0.5 + 0.5 * Math.sin((t - fullAt) * 8)
        ctx.strokeStyle = `rgba(196,83,63,${0.4 + pulse * 0.5})`
        ctx.lineWidth = 4
        roundRect(ctx, 0, 0, PW, PH, 24)
        ctx.clip()
        piecePath(ctx, MISSING)
        ctx.stroke()
      }
      ctx.restore()

      const order = [...pieces].sort((a, b) => (a === drag) - (b === drag))
      for (const p of order) {
        if (p.placed && fallAt === null) {
          p.x = lerp(p.x, PX, clamp(dt * 14, 0, 1))
          p.y = lerp(p.y, PY, clamp(dt * 14, 0, 1))
        }
        if (fallAt !== null) {
          p.vy += 1400 * dt
          p.y += p.vy * dt
          p.rot += p.spin * dt
        }
        const [cx, cy] = centre(p)
        const shake = Math.max(0, 0.3 - (t - p.shook)) * Math.sin(t * 60) * 20
        const tremble = fullAt !== null && fallAt === null ? Math.sin(t * 40 + p.i) * 2 : 0
        ctx.save()
        ctx.translate(cx + shake + tremble, cy)
        ctx.rotate(p.rot)
        ctx.translate(-(cx - p.x), -(cy - p.y))
        if (!p.placed || fallAt !== null) {
          ctx.shadowColor = 'rgba(0,0,0,0.18)'
          ctx.shadowBlur = p === drag ? 18 : 8
          ctx.shadowOffsetY = p === drag ? 8 : 3
        }
        piece(ctx, p.i, !p.placed || fallAt !== null)
        ctx.restore()
      }

      if (fullAt === null) {
        text(ctx, 'drag the pieces to say it', W / 2, 80, { size: 30, color: C.inkSoft })
        const next = pieces.find((p) => !p.placed)
        if (!drag && next && t > 0.6) tapHint(ctx, ...centre(next), t)
      } else if (fallAt === null) {
        text(ctx, 'one piece is missing', W / 2, 80, { size: 30, color: C.arun })
      }
      if (doneAt !== null) {
        caption(ctx, 'There was one word she could never find.', easeOut((t - doneAt) / 0.6))
        tapHint(ctx, W - 50, 50, t)
      }
    },
    down(x, y, t) {
      if (doneAt !== null) {
        if (t - doneAt > 0.6) api.finish()
        return
      }
      if (fullAt !== null) return
      for (let k = pieces.length - 1; k >= 0; k--) {
        const p = pieces[k]
        const [cx, cy] = centre(p)
        if (!p.placed && Math.abs(x - cx) < pw / 2 + TAB && Math.abs(y - cy) < PH / 2 + 10) {
          drag = p
          p.ox = x - p.x
          p.oy = y - p.y
          return
        }
      }
    },
    move(x, y) {
      if (!drag) return
      drag.x = x - drag.ox
      drag.y = y - drag.oy
    },
    up(x, y, t) {
      if (!drag) return
      const p = drag
      drag = null
      const [cx, cy] = centre(p)
      if (dist(p.x, p.y, PX, PY) < 45) {
        p.placed = true
        pop(620 + p.i * 60)
        if (pieces.every((q) => q.placed)) fullAt = t
      } else if (dist(cx, cy, PX + (MISSING + 0.5) * pw, PY + PH / 2) < 70) {
        // it won't go where the missing piece belongs
        p.shook = t
        pop(180)
      }
    },
  }
}

// ---------- page 3: the suitcase ----------

const morning = comic(
  [
    {
      x: 40, y: 110, w: 460, h: 380, hold: 1.8,
      draw(ctx, w, h, t) {
        wash(ctx, 0, 0, w, h, g('#cdb89c'), 1540)
        // front door, an empty coat hook, pale morning light
        windowFrame(ctx, 30, 50, 100, 150, g('#e8dcc0'), 1544)
        wash(ctx, 250, 40, 150, 320, g('#7b5a44'), 1541)
        blob(ctx, 380, 210, 7, 7, C.ink, 1542)
        wash(ctx, 0, 330, w, 60, g('#9c7f63'), 1543)
        arun(ctx, 200, 350, { s: 0.95, grey: GREY, facing: 1, eyes: 'down' })
        // suitcase at his side
        const lift = Math.min(1, t / 1.2) * 4
        wash(ctx, 255, 250 - lift, 90, 100, g('#4b5a78'), 1545)
        line(ctx, 285, 250 - lift, 285, 236 - lift, C.ink, 5, 1546)
        line(ctx, 315, 250 - lift, 315, 236 - lift, C.ink, 5, 1547)
        line(ctx, 285, 236 - lift, 315, 236 - lift, C.ink, 5, 1548)
      },
      label: ['The next morning', 360, 110],
    },
    {
      x: 40, y: 520, w: 460, h: 270,
      draw(ctx, w, h) {
        wash(ctx, 0, 0, w, h, g('#d6c6ae'), 1550)
        windowFrame(ctx, 300, 30, 120, 120, g('#c8cdd2'), 1551)
        wash(ctx, 0, 190, w, 90, g('#8a6d55'), 1552)
        mira(ctx, 140, 330, { s: 0.9, grey: GREY, pose: 'sit', eyes: 'down', mouth: 'sad' })
        wash(ctx, 200, 185, 230, 18, g('#7b5238'), 1553)
        line(ctx, 225, 200, 225, 280, g('#5c3c2a'), 8, 1555)
        line(ctx, 405, 200, 405, 280, g('#5c3c2a'), 8, 1556)
        // two mugs, one of them cold
        mug(ctx, 262, 185, g(C.mira), 1554)
        mug(ctx, 362, 185, g(C.arun), 1557)
      },
    },
  ],
  "She didn't ask him to stay. He didn't ask to.",
)

export default {
  title: 'Storm',
  pages: [fight, unsaid, morning],
}
