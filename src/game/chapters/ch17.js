// Chapter 17 · Quiet — the flat after he's gone. Everything she touches remembers
// something, for a second, in colour. Under the bed: the paint set.
import {
  W, C, paper, wash, blob, line, text, caption, tapHint, windowFrame, panel, label, plant,
  mira, arun, note, heart, mix, clamp, easeOut, lerp,
} from '../paint.js'
import { pop, tone, MELODY } from '../sound.js'

const GREY = 0.5
const g = (c, k = GREY) => mix(c, C.grey, k)

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

// ---------- page 1: the quiet ----------

const stillness = comic(
  [
    {
      x: 40, y: 110, w: 460, h: 340, hold: 1.8,
      draw(ctx, w, h, t) {
        wash(ctx, 0, 0, w, h, g('#d6c6ae'), 1701)
        windowFrame(ctx, 280, 40, 130, 160, g('#c8cdd2'), 1702)
        // wall clock, the only thing moving
        blob(ctx, 220, 70, 28, 28, C.cream, 1703)
        line(ctx, 220, 70, 220, 52, C.ink, 3, 1704)
        const a = t * 1.2
        line(ctx, 220, 70, 220 + Math.cos(a) * 20, 70 + Math.sin(a) * 20, C.arun, 2, 1705)
        wash(ctx, 0, 280, w, 60, g('#8a6d55'), 1706)
        wash(ctx, 90, 200, 280, 50, g(C.teal, 0.6), 1707)
        wash(ctx, 80, 240, 300, 60, g(C.teal, 0.55), 1708)
        mira(ctx, 150, 330, { s: 0.8, pose: 'sit', grey: GREY, eyes: 'down' })
      },
      label: ['Sunday', 400, 110],
    },
    {
      x: 40, y: 480, w: 215, h: 310, hold: 1.4,
      draw(ctx, w, h) {
        wash(ctx, 0, 0, w, h, g('#c9d1d2'), 1710)
        // one toothbrush where there were two
        wash(ctx, 55, 170, 100, 110, g(C.sky), 1711)
        line(ctx, 90, 180, 70, 60, g(C.mira), 8, 1712)
        wash(ctx, 58, 40, 20, 26, C.cream, 1713)
      },
    },
    {
      x: 285, y: 480, w: 215, h: 310,
      draw(ctx, w, h) {
        wash(ctx, 0, 0, w, h, g('#d6c6ae'), 1714)
        // a paler patch on the wall where the violin case leaned
        ctx.save()
        ctx.globalAlpha = 0.5
        ctx.fillStyle = '#efe6d6'
        ctx.beginPath()
        ctx.ellipse(107, 130, 32, 36, 0, 0, Math.PI * 2)
        ctx.ellipse(107, 205, 42, 48, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillRect(99, 40, 16, 70)
        ctx.restore()
        line(ctx, 100, 36, 114, 36, C.ink, 5, 1715)
        wash(ctx, 0, 270, w, 50, g('#8a6d55'), 1716)
      },
    },
  ],
  'No music now. Just the fridge, humming.',
)

// ---------- page 2: tap things to remember ----------
// Each memory is a small panel painted in full colour, over a flat gone grey.

function sky(ctx, w, h, color, seed) {
  wash(ctx, 0, 0, w, h, color, seed)
}

const MEMORIES = {
  park(ctx, w, h, t) {
    sky(ctx, w, h, '#e8c9a8', 1720)
    blob(ctx, 190, 40, 26, 26, '#f2c14e', 1721)
    for (let i = 0; i < 3; i++) blob(ctx, 30 + i * 90, 120, 50, 40, C.leaf, 1722 + i)
    wash(ctx, 0, 140, w, 60, '#b9c98f', 1725)
    arun(ctx, 150, 180, { s: 0.45, pose: 'violin', t, facing: -1 })
    note(ctx, 90, 70 - (t % 2) * 10, 0.7)
    note(ctx, 60, 50 - (t % 2) * 14, 0.5)
  },
  cafe(ctx, w, h) {
    sky(ctx, w, h, '#ead3b4', 1730)
    wash(ctx, 60, 100, 120, 14, '#7b5238', 1731)
    wash(ctx, 90, 80, 16, 20, C.mira, 1732)
    wash(ctx, 132, 80, 16, 20, C.arun, 1733)
    mira(ctx, 55, 180, { s: 0.42, pose: 'sit', mouth: 'smile' })
    arun(ctx, 190, 180, { s: 0.42, pose: 'sit', facing: -1, mouth: 'smile' })
  },
  gig(ctx, w, h, t) {
    sky(ctx, w, h, C.night, 1740)
    ctx.save()
    ctx.fillStyle = 'rgba(255,240,190,0.35)'
    ctx.beginPath()
    ctx.moveTo(110, 0)
    ctx.lineTo(150, 0)
    ctx.lineTo(200, 170)
    ctx.lineTo(60, 170)
    ctx.fill()
    ctx.restore()
    arun(ctx, 130, 150, { s: 0.4, pose: 'violin', t })
    const crowd = [C.mira, C.teal, C.rose, C.leaf, C.plum, C.sky]
    crowd.forEach((c, i) => blob(ctx, 15 + i * 42, 165, 20, 22, c, 1741 + i))
  },
  summer(ctx, w) {
    sky(ctx, w, 90, C.sky, 1750)
    wash(ctx, 0, 80, w, 40, C.teal, 1751)
    wash(ctx, 0, 115, w, 70, '#ecd3a0', 1752)
    blob(ctx, 60, 50, 22, 22, '#f2c14e', 1753)
    line(ctx, 150, 70, 150, 160, C.ink, 3, 1754)
    ctx.fillStyle = C.arun
    ctx.beginPath()
    ctx.arc(150, 76, 50, Math.PI, 0)
    ctx.fill()
    blob(ctx, 130, 150, 10, 18, C.mira, 1755)
    blob(ctx, 170, 150, 10, 18, C.arun, 1756)
    heart(ctx, 150, 110, 0.6)
  },
  visit(ctx, w, h) {
    sky(ctx, w, h, '#e3c7a2', 1760)
    wash(ctx, 150, 10, 80, 170, '#9a6b48', 1761)
    mira(ctx, 70, 190, { s: 0.45, mouth: 'smile' })
    plant(ctx, 100, 112, 0.6, C.leaf, 1762)
    arun(ctx, 190, 190, { s: 0.45, facing: -1, mouth: 'smile' })
  },
}

const remember = (api) => {
  const keptPlant = api.memory.keptPlant !== false
  const keptPhoto = api.memory.keptPhoto !== false
  const spots = [
    { id: 'park', x: 380, y: 250, r: 90 }, // the window
    { id: 'gig', x: 80, y: 250, r: 60 }, // the empty hook
    { id: 'summer', x: 200, y: 200, r: 55 }, // the photo, or where it hung
    { id: 'visit', x: 380, y: 400, r: 45 }, // the plant, or the ring it left
    { id: 'cafe', x: 470, y: 590, r: 50 }, // her mug
  ].map((s) => ({ ...s, seen: false }))
  const BED = { x: 190, y: 810, r: 90 }
  const NEEDED = 4
  let open = null
  let openAt = -9
  let foundAt = null
  const seen = () => spots.filter((s) => s.seen).length

  return {
    debug: () => {
      if (foundAt !== null) return []
      if (seen() >= NEEDED) return [[BED.x, BED.y]]
      return spots.filter((s) => !s.seen).map((s) => [s.x, s.y])
    },
    draw(ctx, t) {
      paper(ctx)
      wash(ctx, 0, 0, W, 700, g('#d6c6ae'), 1770)
      windowFrame(ctx, 290, 140, 180, 220, g('#c8cdd2'), 1771)
      wash(ctx, 280, 360, 200, 14, g('#e9dfcf', 0.2), 1772)
      if (keptPlant) plant(ctx, 380, 364, 0.9, g(C.leaf, 0.35), 1773)
      else blob(ctx, 380, 360, 18, 5, g('#8e8983'), 1774, 0.6)
      // the photo, or the pale square it left behind
      if (keptPhoto) {
        wash(ctx, 168, 158, 64, 80, g('#7b5a44'), 1775)
        wash(ctx, 176, 166, 48, 64, g(C.sky), 1776)
        blob(ctx, 191, 208, 8, 16, g(C.mira), 1777)
        blob(ctx, 209, 208, 8, 16, g(C.arun), 1778)
      } else wash(ctx, 168, 158, 64, 80, '#e6dccb', 1779, 0.8)
      // the empty hook and the paler wall below it
      line(ctx, 70, 160, 90, 160, C.ink, 5, 1780)
      blob(ctx, 80, 250, 34, 70, '#e6dccb', 1781, 0.6)
      wash(ctx, 0, 690, W, 270, g('#8a6d55'), 1782)
      // bed, and the dark gap under it
      wash(ctx, 40, 720, 330, 60, g(C.sky, 0.6), 1783)
      wash(ctx, 30, 690, 80, 50, C.cream, 1784)
      wash(ctx, 40, 780, 330, 60, '#4a4550', 1785, 0.8)
      wash(ctx, 20, 640, 22, 210, g('#7b5238'), 1786)
      // side table and her mug
      wash(ctx, 420, 600, 100, 14, g('#7b5238'), 1787)
      line(ctx, 470, 610, 470, 720, g('#5c3c2a'), 7, 1788)
      wash(ctx, 456, 564, 28, 34, g(C.mira), 1789)
      mira(ctx, 440, 930, { s: 0.7, grey: GREY, eyes: open ? 'closed' : 'down' })

      // a memory, briefly in colour
      if (open) {
        const age = t - openAt
        const a = clamp(Math.min(age / 0.3, (2.6 - age) / 0.5), 0, 1)
        if (age > 2.6) open = null
        else {
          const px = clamp(open.x - 130, 20, W - 280)
          const py = clamp(open.y - 230, 110, 500)
          ctx.save()
          ctx.globalAlpha = a
          ctx.strokeStyle = C.ink
          ctx.lineWidth = 3
          ctx.setLineDash([6, 8])
          ctx.beginPath()
          ctx.moveTo(open.x, open.y)
          ctx.lineTo(px + 130, py + 95)
          ctx.stroke()
          ctx.restore()
          panel(ctx, px, py + (1 - a) * 10, 260, 190, (c, w, h) => MEMORIES[open.id](c, w, h, t), { alpha: a })
        }
      }

      const n = seen()
      if (foundAt === null) {
        if (n < NEEDED) {
          text(ctx, 'tap things to remember', W / 2, 70, { size: 30, color: C.inkSoft })
          const next = spots.find((s) => !s.seen)
          if (!open && next && t > 1) tapHint(ctx, next.x, next.y, t)
        } else {
          text(ctx, 'something under the bed...', W / 2, 70, { size: 30, color: C.inkSoft })
          const k = 0.5 + 0.5 * Math.sin(t * 5)
          blob(ctx, BED.x, BED.y, 14 + k * 6, 6 + k * 3, '#f2c14e', 1790, 0.5 + k * 0.4)
          if (!open) tapHint(ctx, BED.x, BED.y, t)
        }
      } else {
        blob(ctx, BED.x, BED.y, 30, 12, '#f2c14e', 1790, 0.8)
        caption(ctx, 'Something under the bed caught the light.', easeOut((t - foundAt) / 0.6), 110)
        tapHint(ctx, W - 50, 50, t)
      }
    },
    down(x, y, t) {
      if (foundAt !== null) {
        if (t - foundAt > 0.6) api.finish()
        return
      }
      if (seen() >= NEEDED && Math.abs(x - BED.x) < BED.r * 1.6 && Math.abs(y - BED.y) < 50) {
        foundAt = t
        open = null
        tone(MELODY[3], 1, { gain: 0.08 })
        return
      }
      for (const s of spots) {
        if (Math.hypot(x - s.x, y - s.y) < s.r) {
          if (!s.seen) tone(MELODY[seen()], 0.9, { gain: 0.07 })
          else pop(500)
          s.seen = true
          open = s
          openAt = t
          return
        }
      }
    },
  }
}

// ---------- page 3: the paint set ----------

const PAINTS = [C.mira, C.arun, C.teal, C.sky, C.rose, C.leaf, C.plum, '#f2c14e']

const paintSet = (api) => {
  const HOME = { x: 270, y: 660 }
  const box = { x: 380, y: 350 }
  let drag = null
  let outAt = null
  let openedAt = null

  return {
    debug: () => {
      if (openedAt !== null) return []
      if (outAt === null) return [{ from: [box.x, box.y], to: [HOME.x, HOME.y] }]
      return [[box.x, box.y]]
    },
    draw(ctx, t, dt) {
      paper(ctx)
      // under the bed: the frame and a band of shadow; the floor in the light below
      wash(ctx, 0, 0, W, 460, '#3f3b45', 1791)
      wash(ctx, 0, 0, W, 60, g('#7b5238'), 1792)
      wash(ctx, 60, 40, 24, 420, g('#5c3c2a'), 1793)
      wash(ctx, 456, 40, 24, 420, g('#5c3c2a'), 1794)
      wash(ctx, 0, 440, W, 520, g('#9c7f63'), 1795)
      for (let i = 0; i < 5; i++) line(ctx, 0, 520 + i * 90, W, 516 + i * 90, 'rgba(60,40,30,0.2)', 2, 1796 + i)
      blob(ctx, 170, 400, 24, 12, '#6d6570', 1801, 0.6)
      blob(ctx, 250, 420, 16, 8, '#6d6570', 1802, 0.6)

      if (outAt !== null && !drag) {
        box.x = lerp(box.x, HOME.x, clamp(dt * 8, 0, 1))
        box.y = lerp(box.y, HOME.y, clamp(dt * 8, 0, 1))
      }
      const light = clamp((box.y - 380) / 200, 0, 1)
      const open = openedAt === null ? 0 : easeOut((t - openedAt) / 0.8)
      // the box: wooden lid over a row of pans
      ctx.save()
      ctx.translate(box.x, box.y)
      if (open > 0) {
        blob(ctx, 0, 0, 220, 120, '#fff3c4', 1803, 0.35 * open)
        wash(ctx, -150, -60, 300, 120, '#8a5a36', 1804)
        wash(ctx, -140, -52, 280, 104, C.cream, 1805)
        PAINTS.forEach((c, i) => {
          const px = -105 + (i % 4) * 70
          const py = -24 + Math.floor(i / 4) * 50
          wash(ctx, px - 24, py - 18, 48, 36, c, 1806 + i, open)
        })
        // lid, swung up behind
        wash(ctx, -150, -60 - 120 * open, 300, 120 * open, '#9a6b48', 1814)
        line(ctx, -60, 72, 120, 40, '#9a5a2c', 7, 1815)
      } else {
        wash(ctx, -150, -60, 300, 120, mix('#9a6b48', '#3f3b45', 1 - light), 1816)
        // his ribbon, still tied round it
        wash(ctx, -12, -62, 24, 124, mix(C.arun, '#3f3b45', (1 - light) * 0.8), 1817)
        blob(ctx, 0, -60, 26, 12, mix(C.arun, '#3f3b45', (1 - light) * 0.8), 1818)
      }
      ctx.restore()

      if (outAt === null) {
        text(ctx, 'pull it out into the light', W / 2, 520, { size: 30, color: C.cream })
        if (!drag && t > 0.8) tapHint(ctx, box.x, box.y, t, C.cream)
      } else if (openedAt === null) {
        text(ctx, 'tap to open it', W / 2, 820, { size: 30, color: C.ink })
        tapHint(ctx, box.x, box.y, t)
      } else {
        caption(ctx, "His gift. She hadn't opened it since spring.", easeOut((t - openedAt - 0.8) / 0.6))
        if (t - openedAt > 1.2) tapHint(ctx, W - 50, 50, t)
      }
    },
    down(x, y, t) {
      if (openedAt !== null) {
        if (t - openedAt > 1.2) api.finish()
        return
      }
      if (Math.abs(x - box.x) < 170 && Math.abs(y - box.y) < 90) {
        if (outAt === null) {
          drag = { ox: x - box.x, oy: y - box.y }
        } else {
          openedAt = t
          PAINTS.slice(0, 4).forEach((_, i) => setTimeout(() => pop(520 + i * 90), i * 90))
        }
      }
    },
    move(x, y) {
      if (!drag) return
      box.x = clamp(x - drag.ox, 150, W - 150)
      box.y = clamp(y - drag.oy, 330, 760)
    },
    up(x, y, t) {
      if (!drag) return
      drag = null
      if (box.y > 520 && outAt === null) {
        outAt = t
        pop(300)
      }
    },
  }
}

export default {
  title: 'Quiet',
  pages: [stillness, remember, paintSet],
}
