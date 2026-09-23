// Chapter 16 · Boxes — Arun's things go into one cardboard box. The things that
// were both of theirs are the player's to decide.
import {
  W, C, paper, wash, blob, line, text, caption, tapHint, windowFrame, panel, label, plant,
  mira, arun, mix, clamp, dist, easeOut, lerp,
} from '../paint.js'
import { pop, tone } from '../sound.js'

const GREY = 0.5 // Act V: most of the colour has gone out of the flat
const g = (c, k = GREY) => mix(c, C.grey, k)
const CARD = '#c89b6a'

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
          panel(ctx, p.x, p.y + (1 - a) * 18, p.w, p.h, (c, w, h) => p.draw(c, w, h, t - at, api.memory), { alpha: a })
        })
        shown.forEach((at, i) => {
          const l = panels[i].label
          if (l) label(ctx, l[0], l[1], l[2], easeOut((t - at - 0.4) / 0.5))
        })
        const all = shown.length === panels.length
        if (all) caption(ctx, captionText, easeOut((t - shown[last] - 0.6) / 0.6))
        if (all && t - shown[last] > 0.8) tapHint(ctx, 50, 50, t)
      },
      down(x, y, t) {
        if (shown.length < panels.length) shown.push(t)
        else if (t - shown[shown.length - 1] > 0.8) api.finish()
      },
    }
  }
}

// ---------- things on the shelf (drawn with the bottom centre at x, y) ----------

function books(ctx, x, y, colors, seed) {
  colors.forEach((c, i) => wash(ctx, x - 30 + i * 21, y - 70 + (i % 2) * 8, 18, 70 - (i % 2) * 8, g(c), seed + i))
}
function mug(ctx, x, y, color, seed) {
  wash(ctx, x - 16, y - 34, 32, 34, g(color), seed)
  ctx.save()
  ctx.strokeStyle = g(color)
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.arc(x + 18, y - 18, 9, -1.3, 1.3)
  ctx.stroke()
  ctx.restore()
}
function photo(ctx, x, y, grey = GREY) {
  wash(ctx, x - 32, y - 76, 64, 76, mix('#7b5a44', C.grey, grey), 1611)
  wash(ctx, x - 24, y - 68, 48, 60, mix(C.sky, C.grey, grey), 1612)
  blob(ctx, x - 9, y - 26, 8, 18, mix(C.mira, C.grey, grey), 1613)
  blob(ctx, x + 9, y - 26, 8, 18, mix(C.arun, C.grey, grey), 1614)
  blob(ctx, x - 9, y - 50, 7, 7, C.skin1, 1615)
  blob(ctx, x + 9, y - 50, 7, 7, C.skin2, 1616)
}

const THINGS = [
  { id: 'books', owner: 'arun', x: 115, y: 250, w: 70, h: 80, draw: (c, x, y) => books(c, x, y, [C.arun, '#7b5238', C.arun], 1620) },
  { id: 'clock', owner: 'mira', x: 205, y: 250, w: 50, h: 50, draw: (c, x, y) => {
    blob(c, x, y - 24, 22, 22, g(C.mira), 1623)
    blob(c, x, y - 24, 15, 15, C.cream, 1624)
    line(c, x, y - 24, x, y - 34, C.ink, 3, 1625)
    line(c, x, y - 24, x + 8, y - 22, C.ink, 3, 1626)
  } },
  { id: 'photo', owner: 'both', x: 295, y: 250, w: 70, h: 80, draw: (c, x, y) => photo(c, x, y) },
  { id: 'records', owner: 'arun', x: 395, y: 250, w: 90, h: 80, draw: (c, x, y) => {
    wash(c, x - 40, y - 74, 64, 74, g('#50627a'), 1627)
    wash(c, x - 20, y - 70, 64, 70, g(C.arun), 1628)
    blob(c, x + 12, y - 35, 16, 16, C.ink, 1629, 0.8)
  } },
  { id: 'herbooks', owner: 'mira', x: 120, y: 400, w: 70, h: 80, draw: (c, x, y) => books(c, x, y, [C.mira, C.sky, C.mira], 1630) },
  { id: 'mug', owner: 'arun', x: 215, y: 400, w: 60, h: 45, draw: (c, x, y) => mug(c, x, y, C.arun, 1633) },
  { id: 'plant', owner: 'both', x: 310, y: 400, w: 80, h: 90, draw: (c, x, y) => plant(c, x, y, 1, g(C.leaf, 0.35), 1634) },
  { id: 'metronome', owner: 'arun', x: 420, y: 400, w: 50, h: 80, draw: (c, x, y) => {
    c.fillStyle = g('#7b5238')
    c.beginPath()
    c.moveTo(x - 22, y)
    c.lineTo(x - 10, y - 72)
    c.lineTo(x + 10, y - 72)
    c.lineTo(x + 22, y)
    c.closePath()
    c.fill()
    line(c, x, y - 12, x + 8, y - 62, C.ink, 3, 1635)
  } },
  { id: 'sheets', owner: 'arun', x: 120, y: 550, w: 90, h: 60, draw: (c, x, y) => {
    wash(c, x - 40, y - 58, 80, 58, C.cream, 1636)
    for (let i = 0; i < 3; i++) line(c, x - 30, y - 46 + i * 14, x + 30, y - 46 + i * 14, C.inkSoft, 2, 1637 + i)
    blob(c, x - 12, y - 34, 5, 4, C.ink, 1640)
    blob(c, x + 10, y - 20, 5, 4, C.ink, 1641)
  } },
  { id: 'pencils', owner: 'mira', x: 230, y: 550, w: 50, h: 70, draw: (c, x, y) => {
    for (let i = 0; i < 3; i++) line(c, x - 10 + i * 10, y - 30, x - 14 + i * 14, y - 66, g([C.teal, C.rose, C.mira][i]), 5, 1642 + i)
    wash(c, x - 18, y - 36, 36, 36, g(C.sky), 1645)
  } },
  { id: 'hermug', owner: 'mira', x: 320, y: 550, w: 60, h: 45, draw: (c, x, y) => mug(c, x, y, C.mira, 1646) },
]

// ---------- page 1 ----------

const aWeekLater = comic(
  [
    {
      x: 40, y: 110, w: 460, h: 300, hold: 1.8,
      draw(ctx, w, h, t) {
        wash(ctx, 0, 0, w, h, g('#b39c82'), 1601)
        // a flat box being folded into shape, tape pulled across it
        wash(ctx, 120, 110, 220, 150, CARD, 1602)
        wash(ctx, 100, 70, 90, 50, '#b98a5a', 1603)
        wash(ctx, 270, 70, 90, 50, '#b98a5a', 1604)
        const k = easeOut(t / 1.4)
        wash(ctx, 120, 170, 220 * k + 1, 18, '#e8dcc0', 1605, 0.9)
        blob(ctx, 120 + 220 * k, 180, 26, 26, g('#8e8983', 0.2), 1606)
        blob(ctx, 120 + 220 * k, 180, 12, 12, g('#b39c82'), 1607)
        blob(ctx, 150 + 220 * k, 196, 22, 16, C.skin2, 1618)
        wash(ctx, 165 + 220 * k, 186, 160, 26, g('#50627a'), 1619)
        blob(ctx, 90, 200, 22, 16, C.skin1, 1621)
        wash(ctx, -20, 190, 100, 26, g(C.mira), 1622)
      },
      label: ['A week later', 380, 110],
    },
    {
      x: 40, y: 440, w: 460, h: 360,
      draw(ctx, w, h) {
        wash(ctx, 0, 0, w, h, g('#d6c6ae'), 1608)
        windowFrame(ctx, 170, 40, 120, 140, g('#c8cdd2'), 1609)
        wash(ctx, 0, 290, w, 80, g('#8a6d55'), 1610)
        mira(ctx, 100, 400, { s: 0.9, grey: GREY, eyes: 'down' })
        arun(ctx, 360, 400, { s: 0.9, grey: GREY, facing: -1, eyes: 'down' })
        wash(ctx, 200, 260, 70, 50, CARD, 1617)
      },
    },
  ],
  "They agreed it was nobody's fault. It didn't help.",
)

// ---------- page 2: pack his things ----------

const BOX = { x: 170, y: 650, w: 200, h: 140 }

const pack = (api) => {
  const things = THINGS.map((o) => ({ ...o, cx: o.x, cy: o.y, packedAt: null, shook: -9 }))
  const his = things.filter((o) => o.owner === 'arun')
  let drag = null
  let nope = -9
  let closedAt = null
  const inBox = (o) => o.packedAt !== null
  const hit = (o, x, y) => Math.abs(x - o.cx) < o.w / 2 + 8 && y < o.cy + 10 && y > o.cy - o.h - 8
  const ready = () => his.every(inBox)

  return {
    debug: () => {
      if (closedAt !== null) return []
      const left = his.filter((o) => !inBox(o))
      if (!left.length) return [[BOX.x + BOX.w / 2, BOX.y + 60]]
      return left.map((o) => ({ from: [o.cx, o.cy - o.h / 2], to: [BOX.x + BOX.w / 2, BOX.y + 30] }))
    },
    draw(ctx, t, dt) {
      paper(ctx)
      wash(ctx, 0, 0, W, 780, g('#d6c6ae'), 1650)
      wash(ctx, 0, 760, W, 200, g('#8a6d55'), 1651)
      // the shelf
      wash(ctx, 50, 130, 440, 440, g('#a7865f', 0.6), 1652, 0.5)
      for (const [k, y] of [250, 400, 550].entries()) wash(ctx, 44, y, 452, 16, g('#7b5238'), 1653 + k)
      wash(ctx, 44, 120, 14, 460, g('#7b5238'), 1656)
      wash(ctx, 482, 120, 14, 460, g('#7b5238'), 1657)

      mira(ctx, 70, 960, { s: 0.62, grey: GREY, facing: 1, eyes: 'down' })
      arun(ctx, 470, 960, { s: 0.62, grey: GREY, facing: -1, eyes: 'down' })

      // box: back, then what is inside, then the front
      const bx = BOX.x
      const by = BOX.y
      wash(ctx, bx, by - 30, BOX.w, 40, '#8f6a45', 1658)
      const lid = closedAt === null ? 0 : easeOut((t - closedAt) / 0.5)
      for (const o of things) {
        if (!inBox(o) || o === drag || lid > 0.4) continue
        const k = easeOut((t - o.packedAt) / 0.3)
        const tx = bx + 30 + (his.indexOf(o) + 1 || 6) * 24
        ctx.save()
        ctx.translate(lerp(o.cx, tx, k), lerp(o.cy, by + 20, k))
        ctx.scale(lerp(1, 0.6, k), lerp(1, 0.6, k))
        o.draw(ctx, 0, 0)
        ctx.restore()
      }
      wash(ctx, bx, by, BOX.w, BOX.h, CARD, 1659)
      line(ctx, bx + 10, by + 4, bx + BOX.w - 10, by + 4, '#8f6a45', 3, 1660)
      if (closedAt === null) {
        wash(ctx, bx - 50, by - 20, 60, 30, '#b98a5a', 1661)
        wash(ctx, bx + BOX.w - 10, by - 20, 60, 30, '#b98a5a', 1662)
      } else {
        wash(ctx, bx, by - 34 * (1 - lid), BOX.w, 40, '#b98a5a', 1663)
        wash(ctx, bx + BOX.w / 2 - 14, by - 30, 28, 30 + 60 * lid, '#e8dcc0', 1664, 0.9)
      }

      // things still on the shelf; the dragged one on top
      for (const o of things) {
        if (inBox(o) || o === drag) continue
        if (!drag) {
          o.cx = lerp(o.cx, o.x, clamp(dt * 12, 0, 1))
          o.cy = lerp(o.cy, o.y, clamp(dt * 12, 0, 1))
        }
        const shake = Math.max(0, 0.35 - (t - o.shook)) * Math.sin(t * 50) * 18
        o.draw(ctx, o.cx + shake, o.cy)
      }
      if (drag) {
        ctx.save()
        ctx.translate(drag.cx, drag.cy)
        ctx.scale(1.1, 1.1)
        drag.draw(ctx, 0, 0)
        ctx.restore()
      }

      if (closedAt === null) {
        if (ready()) {
          text(ctx, 'tap the box to tape it shut', W / 2, 60, { size: 30, color: C.inkSoft })
          tapHint(ctx, bx + BOX.w / 2, by + 60, t)
        } else {
          text(ctx, 'pack his things into the box', W / 2, 52, { size: 30, color: C.inkSoft })
          const why = t - nope < 1.4 ? "that one is hers" : 'the shared ones are up to you'
          text(ctx, why, W / 2, 92, { size: 22, color: t - nope < 1.4 ? C.arun : C.inkSoft })
          const next = his.find((o) => !inBox(o))
          if (!drag && t > 1 && next) tapHint(ctx, next.cx, next.cy - next.h / 2, t)
        }
      } else {
        caption(ctx, 'Everything fit in one box. That was the worst part.', easeOut((t - closedAt - 0.6) / 0.6), 110)
        if (t - closedAt > 1) tapHint(ctx, 50, 50, t)
      }
    },
    down(x, y, t) {
      if (closedAt !== null) {
        if (t - closedAt > 1) api.finish()
        return
      }
      if (ready() && x > BOX.x - 20 && x < BOX.x + BOX.w + 20 && y > BOX.y - 40 && y < BOX.y + BOX.h) {
        closedAt = t
        api.memory.keptPlant = !inBox(things.find((o) => o.id === 'plant'))
        api.memory.keptPhoto = !inBox(things.find((o) => o.id === 'photo'))
        tone(180, 0.5, { type: 'sine', gain: 0.08 })
        return
      }
      for (let k = things.length - 1; k >= 0; k--) {
        const o = things[k]
        if (inBox(o) || !hit(o, x, y)) continue
        if (o.owner === 'mira') {
          o.shook = t
          nope = t
          pop(200)
          return
        }
        drag = o
        o.ox = x - o.cx
        o.oy = y - o.cy
        pop(420)
        return
      }
    },
    move(x, y) {
      if (!drag) return
      drag.cx = x - drag.ox
      drag.cy = y - drag.oy
    },
    up(x, y, t) {
      if (!drag) return
      const o = drag
      drag = null
      const cx = o.cx
      const cy = o.cy - o.h / 2
      if (cx > BOX.x - 20 && cx < BOX.x + BOX.w + 20 && cy > BOX.y - 120 && cy < BOX.y + BOX.h) {
        o.packedAt = t
        pop(300)
      }
      if (dist(cx, cy, o.x, o.y) < 4) o.cx = o.x
    },
  }
}

// ---------- page 3: he carries it out ----------

const theDoor = comic(
  [
    {
      x: 40, y: 110, w: 460, h: 330, hold: 2.4,
      draw(ctx, w, h, t, memory) {
        wash(ctx, 0, 0, w, h, g('#d6c6ae'), 1670)
        wash(ctx, 330, 30, 110, 270, g('#7b5a44'), 1671)
        blob(ctx, 345, 170, 6, 6, C.ink, 1685)
        wash(ctx, 0, 290, w, 60, g('#8a6d55'), 1672)
        const x = 100 + Math.min(t, 2.4) * 70
        arun(ctx, x, 320, { s: 0.85, grey: GREY, pose: 'walk', t, eyes: 'down' })
        // the box in his arms, with whatever else went in it
        if (memory.keptPlant === false) plant(ctx, x + 50, 160, 0.6, g(C.leaf, 0.35), 1673)
        if (memory.keptPhoto === false) {
          ctx.save()
          ctx.translate(x + 10, 162)
          ctx.rotate(-0.2)
          ctx.scale(0.6, 0.6)
          photo(ctx, 0, 0)
          ctx.restore()
        }
        wash(ctx, x - 45, 150, 120, 90, CARD, 1674)
        wash(ctx, x + 1, 148, 28, 90, '#e8dcc0', 1675, 0.9)
      },
    },
    {
      x: 40, y: 470, w: 200, h: 330, hold: 1.8,
      draw(ctx, w, h, t) {
        wash(ctx, 0, 0, w, h, g('#cdb89c'), 1676)
        // the door swings shut: the gap of hallway light gets thinner
        const gap = 70 * (1 - easeOut((t - 0.3) / 1.2))
        wash(ctx, 50, 30, 110, 290, '#3a3540', 1677)
        wash(ctx, 50, 30, gap, 290, '#f3e7c8', 1678)
        wash(ctx, 50 + gap, 30, 110 - gap, 290, g('#7b5a44'), 1679)
        blob(ctx, 60 + gap + 80, 180, 6, 6, C.ink, 1680)
      },
      label: ['click', 140, 780],
    },
    {
      x: 260, y: 470, w: 240, h: 330,
      draw(ctx, w, h, t, memory) {
        wash(ctx, 0, 0, w, h, g('#d6c6ae'), 1681)
        wash(ctx, 20, 110, 200, 12, g('#7b5238'), 1682)
        if (memory.keptPlant !== false) plant(ctx, 60, 110, 0.8, g(C.leaf, 0.35), 1683)
        if (memory.keptPhoto !== false) photo(ctx, 180, 110)
        wash(ctx, 0, 280, w, 60, g('#8a6d55'), 1684)
        mira(ctx, 120, 420, { s: 0.8, grey: GREY, eyes: 'down', mouth: 'sad' })
      },
    },
  ],
  'The door clicked shut. The flat went very quiet.',
)

export default {
  title: 'Boxes',
  pages: [aWeekLater, pack, theDoor],
}
