// Chapter 19 · Canvas — a blank canvas, a full palette, and a letter she has
// wanted to hand in for years. The painting she makes here hangs in chapter 20.
import { vignette, memory } from '../engine.js'
import {
  W, H, C, FONT, paper, wash, blob, line, text, caption, tapHint, windowFrame, plant, panel, label,
  mira, person, rng, mix, clamp, lerp, dist, easeOut, inRect, roundRect,
} from '../paint.js'
import { pop, tone } from '../sound.js'

const fade = (t, t0) => easeOut((t - t0) / 0.5)

// Fades a whole drawing (a panel, a label) in as one piece. Washes set their own
// alpha, so fading panel() directly would show its background before its contents.
let scratch = null
function faded(ctx, alpha, draw) {
  if (alpha <= 0) return
  if (alpha >= 1) return draw(ctx)
  if (!scratch) {
    scratch = document.createElement('canvas')
    scratch.width = W * 2
    scratch.height = H * 2
  }
  const g = scratch.getContext('2d')
  g.setTransform(1, 0, 0, 1, 0, 0)
  g.clearRect(0, 0, scratch.width, scratch.height)
  g.setTransform(2, 0, 0, 2, 0, 0)
  draw(g)
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.drawImage(scratch, 0, 0, W, H)
  ctx.restore()
}
const WOOD = '#9a6a44'

// ---------- page 1: Sunday morning ----------

function easel(ctx, x, top) {
  line(ctx, x, top - 24, x - 78, top + 270, WOOD, 9, 1901)
  line(ctx, x, top - 24, x + 78, top + 270, WOOD, 9, 1902)
  line(ctx, x, top - 10, x + 6, top + 250, '#7a5236', 7, 1903)
  ctx.fillStyle = 'rgba(60,40,30,0.18)'
  ctx.fillRect(x - 70, top + 6, 150, 184)
  ctx.fillStyle = C.cream
  ctx.fillRect(x - 76, top, 150, 184)
  ctx.strokeStyle = C.inkSoft
  ctx.lineWidth = 2
  ctx.strokeRect(x - 76, top, 150, 184)
  wash(ctx, x - 92, top + 182, 184, 14, WOOD, 1904)
}

// The flat in morning light; g drains colour out (0 = full colour).
function studio(ctx, w, h, g, t) {
  const k = (c) => (g > 0.01 ? mix(c, C.grey, g) : c)
  wash(ctx, -10, -10, w + 20, h + 20, k('#f3dcbd'), 1905)
  windowFrame(ctx, 290, 40, 170, 210, k('#bfe0ea'), 1906)
  blob(ctx, 418, 92, 24, 24, k('#f7d06b'), 1907)
  wash(ctx, -10, 380, w + 20, h - 370, k('#c79a6c'), 1908)
  // sunbeam across the floor
  ctx.save()
  ctx.globalAlpha = 0.3 * (1 - g)
  ctx.fillStyle = '#fff3c4'
  ctx.beginPath()
  ctx.moveTo(295, 250)
  ctx.lineTo(455, 250)
  ctx.lineTo(360, h)
  ctx.lineTo(90, h)
  ctx.fill()
  ctx.restore()
  plant(ctx, 330, 252, 0.7, k(C.leaf), 1909)
  easel(ctx, 150, 150)
  // a stool with the old paint set on it
  wash(ctx, 20, 360, 90, 16, k(WOOD), 1910)
  line(ctx, 32, 372, 26, 440, k(WOOD), 6, 1911)
  line(ctx, 98, 372, 104, 440, k(WOOD), 6, 1912)
  wash(ctx, 30, 338, 70, 24, k('#34405a'), 1913)
  mira(ctx, 380, 452, { s: 0.95, facing: -1, grey: g, mouth: g < 0.2 ? 'smile' : 'none' })
  // dust in the light
  ctx.save()
  ctx.fillStyle = '#fff8dc'
  const r = rng(1914)
  for (let i = 0; i < 14; i++) {
    const x = 180 + r() * 220 + Math.sin(t * 0.5 + i) * 8
    const y = 270 + r() * 170 - ((t * 6 + i * 13) % 40)
    ctx.globalAlpha = 0.6 * (1 - g)
    ctx.fillRect(x, y, 3, 3)
  }
  ctx.restore()
}

// Close-up of the old paint tin, a jar of brushes and water.
function paintTin(ctx, w, h) {
  wash(ctx, -10, -10, w + 20, h + 20, '#e7c9a0', 1915)
  ctx.save()
  ctx.fillStyle = '#34405a'
  roundRect(ctx, 40, 50, 310, 172, 14)
  ctx.fill()
  ctx.fillStyle = '#f4efe6'
  roundRect(ctx, 52, 62, 286, 148, 8)
  ctx.fill()
  const pans = [C.mira, '#f2c14e', C.arun, C.rose, C.plum, C.sky, C.teal, C.leaf, '#9a5a2c', C.ink]
  pans.forEach((c, i) => {
    const px = 84 + (i % 5) * 56
    const py = 102 + Math.floor(i / 5) * 68
    ctx.fillStyle = '#ffffff'
    roundRect(ctx, px - 23, py - 26, 46, 52, 6)
    ctx.fill()
    blob(ctx, px, py, 17, 20, c, 1916 + i)
  })
  ctx.restore()
  // jar of brushes
  const tips = [C.mira, C.teal, C.arun]
  tips.forEach((c, i) => {
    const x0 = 410 + (i - 1) * 16
    const x1 = 410 + (i - 1) * 42
    line(ctx, x0, 200, x1, 40 + i * 10, WOOD, 7, 1930 + i)
    blob(ctx, x1, 40 + i * 10, 6, 10, c, 1933 + i)
  })
  blob(ctx, 410, 200, 46, 52, '#cfe6ee', 1936, 0.85)
  wash(ctx, 372, 196, 76, 40, '#9fc6d4', 1937, 0.6)
}

const morning = vignette((ctx, t) => {
  const g = 0.5 * (1 - easeOut((t - 0.6) / 2.2))
  panel(ctx, 20, 20, W - 40, 470, (ctx, w, h) => studio(ctx, w, h, g, t))
  faded(ctx, fade(t, 0.4), (g) => label(g, 'Sunday morning', W / 2, 490))
  faded(ctx, fade(t, 1.2), (g) => panel(g, 20, 540, W - 40, 250, paintTin))
}, 'A blank canvas, and nobody to tell her no.', { wait: 1.4 })

// ---------- page 2: the painting ----------

const BOARD = { x: 50, y: 110, w: 440, h: 500 }
const S = 2 // offscreen resolution, so strokes stay crisp on phones
const COLOURS = [C.mira, C.arun, C.rose, C.leaf, C.teal, C.sky, C.ink]
const SIZES = [7, 15, 28]
const WELL_Y = 706
const wellX = (i) => 86 + i * 61.3
const SIZE_Y = 806
const sizeX = (i) => 76 + i * 72
const DONE = { x: 320, y: 776, w: 170, h: 60 }
const CELL = 20
const COLS = BOARD.w / CELL
const ROWS = BOARD.h / CELL
const NEEDED = 0.3 // share of the canvas that needs paint before "done"

function layer() {
  const c = document.createElement('canvas')
  c.width = BOARD.w * S
  c.height = BOARD.h * S
  const g = c.getContext('2d')
  g.scale(S, S)
  return { c, g }
}

function clear(l) {
  l.g.save()
  l.g.setTransform(1, 0, 0, 1, 0, 0)
  l.g.clearRect(0, 0, l.c.width, l.c.height)
  l.g.restore()
}

// One wobbly dab of pigment.
function dab(g, x, y, r, rr) {
  g.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2
    const k = 1 + (rr() - 0.5) * 0.2
    g.lineTo(x + Math.cos(a) * r * k, y + Math.sin(a) * r * k)
  }
  g.closePath()
  g.fill()
}

function brushIcon(ctx, x, y, colour) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(0.6)
  ctx.fillStyle = WOOD
  roundRect(ctx, -5, -118, 10, 84, 5)
  ctx.fill()
  ctx.fillStyle = '#b9b4ae'
  ctx.fillRect(-6, -38, 12, 18)
  ctx.fillStyle = colour
  ctx.beginPath()
  ctx.moveTo(-6, -20)
  ctx.quadraticCurveTo(-7, -6, 0, 0)
  ctx.quadraticCurveTo(7, -6, 6, -20)
  ctx.fill()
  ctx.restore()
}

const painting = (api) => {
  const art = layer() // the dried painting
  const A = layer() // current stroke, full size
  const B = layer() // current stroke, shrunk: A minus B is the darker wet edge
  const wet = layer()
  const grain = layer()
  const cells = new Uint8Array(COLS * ROWS)
  let covered = 0
  let colour = 0
  let size = 1
  let stroke = null
  let strokes = 0
  let hover = null
  let doneAt = null
  let readyAt = null

  // paper: cream with a little tooth
  art.g.fillStyle = '#fbf7ee'
  art.g.fillRect(0, 0, BOARD.w, BOARD.h)
  const r = rng(1940)
  art.g.fillStyle = 'rgba(140,110,80,0.06)'
  for (let i = 0; i < 500; i++) art.g.fillRect(r() * BOARD.w, r() * BOARD.h, 1 + r() * 3, 1 + r() * 2)
  grain.g.fillStyle = '#000'
  for (let i = 0; i < 2600; i++) grain.g.fillRect(r() * BOARD.w, r() * BOARD.h, 0.5 + r() * 1.5, 0.5 + r())

  const coverage = () => covered / cells.length

  const mark = (x, y, rad) => {
    const c0 = Math.max(0, Math.floor((x - rad) / CELL))
    const c1 = Math.min(COLS - 1, Math.floor((x + rad) / CELL))
    const r0 = Math.max(0, Math.floor((y - rad) / CELL))
    const r1 = Math.min(ROWS - 1, Math.floor((y + rad) / CELL))
    for (let cy = r0; cy <= r1; cy++) {
      for (let cx = c0; cx <= c1; cx++) {
        const i = cy * COLS + cx
        if (!cells[i] && dist(x, y, (cx + 0.5) * CELL, (cy + 0.5) * CELL) < rad + 6) {
          cells[i] = 1
          covered += 1
        }
      }
    }
  }

  // Lays dabs from the last smoothed point to (x, y), in board coordinates.
  const paintTo = (x, y) => {
    const s = stroke
    const dx = x - s.x
    const dy = y - s.y
    const len = Math.hypot(dx, dy)
    s.speed = lerp(s.speed, len, 0.3)
    const step = Math.max(1.2, SIZES[size] * 0.22)
    const n = Math.max(1, Math.ceil(len / step))
    for (let i = 1; i <= n; i++) {
      const px = s.x + (dx * i) / n
      const py = s.y + (dy * i) / n
      s.along += len / n
      const taper = Math.min(1, 0.5 + s.along / 40)
      const pace = clamp(1.15 - s.speed / 90, 0.7, 1.15)
      const rad = SIZES[size] * taper * pace * (0.9 + 0.14 * Math.sin(s.along / 17 + s.seed))
      A.g.fillStyle = s.col
      B.g.fillStyle = s.col
      dab(A.g, px, py, rad, s.rr)
      dab(B.g, px, py, rad * 0.8, s.rr)
      mark(px, py, rad)
    }
    s.x = x
    s.y = y
    if (readyAt === null && coverage() >= NEEDED) {
      readyAt = s.along
      tone(659, 0.5, { gain: 0.06 })
    }
  }

  // Builds the wet stroke: darker rim, lighter middle, paper grain showing through.
  const wetStroke = () => {
    clear(wet)
    const g = wet.g
    g.save()
    g.setTransform(1, 0, 0, 1, 0, 0)
    g.drawImage(A.c, 0, 0)
    g.globalCompositeOperation = 'destination-out'
    g.globalAlpha = 0.34
    g.drawImage(B.c, 0, 0)
    g.globalAlpha = 0.3
    g.drawImage(grain.c, 0, 0)
    g.restore()
    return wet.c
  }

  // Lays the wet stroke onto g: partly covering, partly glazing (multiply), so
  // layers deepen like watercolour without every overlap turning to mud.
  const lay = (g, x, y) => {
    const img = wetStroke()
    g.save()
    g.globalAlpha = 0.65
    g.drawImage(img, x, y, BOARD.w, BOARD.h)
    g.globalCompositeOperation = 'multiply'
    g.globalAlpha = 0.35
    g.drawImage(img, x, y, BOARD.w, BOARD.h)
    g.restore()
  }

  const commit = () => {
    if (!stroke) return
    lay(art.g, 0, 0)
    clear(A)
    clear(B)
    stroke = null
    strokes += 1
  }

  const local = (x, y) => [x - BOARD.x, y - BOARD.y]
  const ready = () => coverage() >= NEEDED

  return {
    // test hook: where the tools are and how much of the canvas is painted
    debug: () => ({
      board: BOARD,
      wells: COLOURS.map((_, i) => [wellX(i), WELL_Y]),
      sizes: SIZES.map((_, i) => [sizeX(i), SIZE_Y]),
      done: [DONE.x + DONE.w / 2, DONE.y + DONE.h / 2],
      coverage: coverage(),
      ready: ready(),
      finished: doneAt !== null,
    }),
    draw(ctx, t) {
      paper(ctx, '#ecd9bd')
      wash(ctx, -10, -10, W + 20, 660, '#f0dcc0', 1941)
      wash(ctx, -10, 640, W + 20, 330, '#c79a6c', 1942)
      // easel behind the canvas
      line(ctx, W / 2, 70, 80, 720, WOOD, 12, 1943)
      line(ctx, W / 2, 70, W - 80, 720, WOOD, 12, 1944)
      wash(ctx, W / 2 - 40, 84, 80, 30, WOOD, 1945)

      // the painting itself
      ctx.fillStyle = 'rgba(60,40,30,0.2)'
      ctx.fillRect(BOARD.x + 7, BOARD.y + 8, BOARD.w, BOARD.h)
      ctx.drawImage(art.c, BOARD.x, BOARD.y, BOARD.w, BOARD.h)
      if (stroke) lay(ctx, BOARD.x, BOARD.y)
      ctx.strokeStyle = 'rgba(47,43,51,0.45)'
      ctx.lineWidth = 2
      ctx.strokeRect(BOARD.x, BOARD.y, BOARD.w, BOARD.h)
      wash(ctx, BOARD.x - 20, BOARD.y + BOARD.h - 2, BOARD.w + 40, 20, WOOD, 1946)

      const a = doneAt === null ? 1 : 1 - easeOut((t - doneAt) / 0.5)
      if (a > 0) {
        ctx.save()
        ctx.globalAlpha = a
        // wooden palette with seven wells
        blob(ctx, W / 2, WELL_Y + 4, 250, 62, '#dcb888', 1947)
        blob(ctx, W / 2 + 200, WELL_Y + 36, 16, 12, '#c79a6c', 1948)
        COLOURS.forEach((c, i) => {
          const lift = i === colour ? -6 : 0
          blob(ctx, wellX(i), WELL_Y + lift, 24, 20, c, 1950 + i)
          blob(ctx, wellX(i) - 7, WELL_Y + lift - 7, 6, 4, '#ffffff', 1960 + i, 0.5)
          if (i === colour) {
            ctx.strokeStyle = C.ink
            ctx.lineWidth = 3
            ctx.beginPath()
            ctx.ellipse(wellX(i), WELL_Y + lift, 31, 27, 0, 0, Math.PI * 2)
            ctx.stroke()
          }
        })
        // brush sizes
        SIZES.forEach((s, i) => {
          blob(ctx, sizeX(i), SIZE_Y, 32, 30, C.cream, 1970 + i)
          blob(ctx, sizeX(i), SIZE_Y, s * 0.85, s * 0.85, COLOURS[colour], 1974 + i)
          if (i === size) {
            ctx.strokeStyle = C.ink
            ctx.lineWidth = 3
            ctx.beginPath()
            ctx.arc(sizeX(i), SIZE_Y, 34, 0, Math.PI * 2)
            ctx.stroke()
          }
        })
        // done button fills up like a meter until the canvas has enough paint
        const p = clamp(coverage() / NEEDED, 0, 1)
        ctx.fillStyle = C.cream
        roundRect(ctx, DONE.x, DONE.y, DONE.w, DONE.h, 30)
        ctx.fill()
        ctx.save()
        roundRect(ctx, DONE.x, DONE.y, DONE.w, DONE.h, 30)
        ctx.clip()
        wash(ctx, DONE.x - 10, DONE.y - 10, DONE.w * p + 10, DONE.h + 20, p < 1 ? '#efd29a' : C.leaf, 1978)
        ctx.restore()
        ctx.strokeStyle = C.ink
        ctx.lineWidth = 3
        roundRect(ctx, DONE.x, DONE.y, DONE.w, DONE.h, 30)
        ctx.stroke()
        text(ctx, 'done', DONE.x + DONE.w / 2, DONE.y + DONE.h / 2, {
          size: 32, color: p < 1 ? C.inkSoft : C.ink,
        })
        ctx.restore()

        if (doneAt === null) {
          const say = strokes === 0 && !stroke ? 'pick a colour, then paint'
            : ready() ? 'tap done when it feels finished' : 'keep painting...'
          text(ctx, say, W / 2 + 36, 52, { size: 30, color: C.ink, maxWidth: W - 120 })
          if (strokes === 0 && !stroke) tapHint(ctx, BOARD.x + BOARD.w / 2, BOARD.y + BOARD.h / 2, t)
          else if (ready() && !stroke) tapHint(ctx, DONE.x + DONE.w / 2, DONE.y - 16, t)
          if (hover && (stroke || inRect(hover[0], hover[1], BOARD))) {
            brushIcon(ctx, hover[0], hover[1], COLOURS[colour])
          }
        }
      }
      if (doneAt !== null) {
        caption(ctx, 'Sixteen years later. Not perfect. Hers.', easeOut((t - doneAt - 0.4) / 0.6))
        if (t - doneAt > 0.8) tapHint(ctx, 50, 50, t)
      }
    },
    down(x, y, t) {
      hover = [x, y]
      if (doneAt !== null) {
        if (t - doneAt > 0.8) api.finish()
        return
      }
      if (inRect(x, y, BOARD)) {
        const [lx, ly] = local(x, y)
        const base = COLOURS[colour]
        const rr = rng(1980 + strokes)
        const tint = base === C.ink ? base : mix(base, rr() < 0.5 ? '#ffffff' : C.ink, rr() * 0.12)
        stroke = { x: lx, y: ly, along: 0, speed: 0, seed: rr() * 6, rr, col: tint }
        paintTo(lx + 0.1, ly)
        return
      }
      for (let i = 0; i < COLOURS.length; i++) {
        if (dist(x, y, wellX(i), WELL_Y) < 30) {
          colour = i
          pop(480 + i * 45)
          return
        }
      }
      for (let i = 0; i < SIZES.length; i++) {
        if (dist(x, y, sizeX(i), SIZE_Y) < 36) {
          size = i
          pop(360 + i * 80)
          return
        }
      }
      if (ready() && inRect(x, y, DONE)) {
        doneAt = t
        // she signs it in the corner
        art.g.font = `20px ${FONT}`
        art.g.fillStyle = 'rgba(47,43,51,0.75)'
        art.g.textAlign = 'right'
        art.g.fillText('Mira', BOARD.w - 16, BOARD.h - 14)
        api.memory.painting = art.c
        tone(523, 0.9, { gain: 0.07 })
        tone(784, 1.1, { gain: 0.05 })
      }
    },
    move(x, y) {
      hover = [x, y]
      if (!stroke) return
      const [lx, ly] = local(x, y)
      // follow the finger with a little lag: smooth, calm strokes
      paintTo(lerp(stroke.x, lx, 0.6), lerp(stroke.y, ly, 0.6))
    },
    up(x, y) {
      if (!stroke) return
      const [lx, ly] = local(x, y)
      paintTo(lx, ly)
      commit()
    },
  }
}

// ---------- page 3: the letter ----------

const LETTER = { x: 130, y: 470, w: 260, h: 330 }
const PAD = { x: 452, y: 700 }

function stampMark(ctx, x, y, alpha) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(x, y)
  ctx.rotate(-0.18)
  const ink = '#d0801c'
  ctx.strokeStyle = ink
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.arc(0, 0, 40, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(0, 0, 33, 0, Math.PI * 2)
  ctx.stroke()
  // a little brush over a star
  ctx.fillStyle = ink
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? 8 : 19
    const a = -Math.PI / 2 + (i / 10) * Math.PI * 2
    ctx.lineTo(Math.cos(a) * rr, 4 + Math.sin(a) * rr)
  }
  ctx.fill()
  ctx.restore()
  // speckle so it reads as rubber stamp ink
  ctx.save()
  const r = rng(1990)
  ctx.fillStyle = '#fbf7ee'
  ctx.globalAlpha = alpha * 0.7
  for (let i = 0; i < 26; i++) ctx.fillRect(x - 42 + r() * 84, y - 42 + r() * 84, 2, 2)
  ctx.restore()
}

function stampTool(ctx, x, y, lifted) {
  ctx.save()
  ctx.translate(x, y)
  if (lifted) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    ctx.beginPath()
    ctx.ellipse(10, 20, 42, 12, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.translate(0, -18)
  }
  wash(ctx, -40, -4, 80, 18, '#d0801c', 1991)
  wash(ctx, -36, -34, 72, 32, WOOD, 1992)
  line(ctx, 0, -34, 0, -74, '#7a5236', 14, 1993)
  blob(ctx, 0, -86, 20, 18, C.arun, 1994)
  ctx.restore()
}

function office(ctx, k, cells, t, stampedAt) {
  const wall = mix('#c3c6cb', '#f0d6b0', k)
  wash(ctx, -10, -10, W + 20, 460, wall, 1995)
  // monitor with the spreadsheet
  ctx.fillStyle = '#3a3d44'
  roundRect(ctx, 80, 110, 380, 262, 12)
  ctx.fill()
  ctx.fillStyle = mix('#eef0f2', '#fbf1e0', k)
  ctx.fillRect(94, 124, 352, 234)
  ctx.fillStyle = '#3a3d44'
  ctx.fillRect(250, 372, 40, 50)
  ctx.fillRect(210, 414, 120, 12)
  ctx.save()
  ctx.beginPath()
  ctx.rect(94, 124, 352, 234)
  ctx.clip()
  ctx.strokeStyle = `rgba(120,120,130,${0.5 * (1 - k)})`
  ctx.lineWidth = 1
  for (let i = 1; i < 6; i++) {
    ctx.beginPath()
    ctx.moveTo(94 + i * 58.7, 124)
    ctx.lineTo(94 + i * 58.7, 358)
    ctx.stroke()
  }
  for (let j = 1; j < 7; j++) {
    ctx.beginPath()
    ctx.moveTo(94, 124 + j * 33.4)
    ctx.lineTo(446, 124 + j * 33.4)
    ctx.stroke()
  }
  ctx.restore()
  // numbers turn into drops of colour and float free
  for (const c of cells) {
    const p = stampedAt === null ? 0 : clamp((t - stampedAt - 0.3 - c.delay) / 1.4, 0, 1)
    const e = easeOut(p)
    if (p < 0.5) {
      text(ctx, c.val, c.x, c.y - e * 20, { size: 22, color: C.inkSoft, alpha: 1 - p * 2 })
    }
    if (p > 0) {
      blob(ctx, lerp(c.x, c.tx, e), lerp(c.y, c.ty, e), 6 + e * c.r, 5 + e * c.r * 0.8, c.col, c.seed, 0.75)
    }
  }
  // desk
  wash(ctx, -10, 440, W + 20, 530, mix('#9d9892', '#b98c63', k), 1996)
  plant(ctx, 64, 478, 1.3, mix(C.grey, C.leaf, k), 1997)
  // a mug and pens
  wash(ctx, 440, 420, 44, 50, mix('#b9b4ae', C.teal, k), 1998)
}

const letter = (api) => {
  const r = rng(1950)
  const pal = [C.mira, C.arun, C.rose, C.leaf, C.teal, C.sky, C.plum, '#f2c14e']
  const cells = []
  for (let j = 0; j < 7; j++) {
    for (let i = 0; i < 6; i++) {
      cells.push({
        x: 123 + i * 58.7,
        y: 141 + j * 33.4,
        val: String(Math.floor(r() * 900 + 100)),
        delay: r() * 0.9,
        tx: 20 + r() * 500,
        ty: 100 + r() * 340, // clear of the home button corner
        r: 16 + r() * 22,
        col: pal[Math.floor(r() * pal.length)],
        seed: 1951 + j * 6 + i,
      })
    }
  }
  const stamp = { x: PAD.x, y: PAD.y - 10 }
  let drag = null
  let mark = null
  let stampedAt = null
  let doneAt = null
  return {
    // test hook: where the stamp is and where it should go
    debug: () => ({
      from: [stamp.x, stamp.y - 40],
      to: [LETTER.x + LETTER.w / 2 + 40, LETTER.y + LETTER.h - 90],
      stamped: stampedAt !== null,
      done: doneAt !== null,
    }),
    draw(ctx, t, dt) {
      paper(ctx)
      const k = stampedAt === null ? 0 : easeOut((t - stampedAt - 0.4) / 2)
      office(ctx, k, cells, t, stampedAt)
      // ink pad
      wash(ctx, PAD.x - 50, PAD.y - 6, 100, 34, '#3a3d44', 1999)
      wash(ctx, PAD.x - 40, PAD.y - 2, 80, 20, '#d0801c', 1900)
      // the letter: lines of handwriting and her signature
      ctx.save()
      ctx.translate(LETTER.x + LETTER.w / 2, LETTER.y + LETTER.h / 2)
      ctx.rotate(-0.03)
      ctx.fillStyle = 'rgba(0,0,0,0.12)'
      ctx.fillRect(-LETTER.w / 2 + 6, -LETTER.h / 2 + 8, LETTER.w, LETTER.h)
      ctx.fillStyle = '#fdfaf3'
      ctx.fillRect(-LETTER.w / 2, -LETTER.h / 2, LETTER.w, LETTER.h)
      ctx.strokeStyle = C.inkSoft
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      const lr = rng(1960)
      for (let i = 0; i < 7; i++) {
        const y = -LETTER.h / 2 + 50 + i * 26
        const len = i === 0 ? 90 : 150 + lr() * 60
        ctx.beginPath()
        ctx.moveTo(-LETTER.w / 2 + 28, y)
        for (let x = 0; x < len; x += 10) ctx.lineTo(-LETTER.w / 2 + 28 + x, y + Math.sin(x * 0.4 + i) * 2.5)
        ctx.stroke()
      }
      ctx.strokeStyle = C.ink
      ctx.beginPath()
      ctx.moveTo(-100, 120)
      ctx.bezierCurveTo(-80, 80, -60, 150, -40, 110)
      ctx.bezierCurveTo(-30, 95, -20, 130, 0, 112)
      ctx.stroke()
      if (stampedAt === null && !drag) {
        ctx.setLineDash([8, 8])
        ctx.strokeStyle = 'rgba(47,43,51,0.3)'
        ctx.beginPath()
        ctx.arc(40, 80, 48, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.restore()
      if (mark) stampMark(ctx, mark.x, mark.y, easeOut((t - stampedAt) / 0.15))

      if (!drag && stampedAt !== null) {
        stamp.x = lerp(stamp.x, PAD.x, clamp(dt * 8, 0, 1))
        stamp.y = lerp(stamp.y, PAD.y - 10, clamp(dt * 8, 0, 1))
      }
      stampTool(ctx, stamp.x, stamp.y, !!drag)
      // Mira's mustard sleeve reaches in while she holds the stamp
      if (drag) {
        ctx.save()
        ctx.strokeStyle = C.mira
        ctx.lineCap = 'round'
        ctx.lineWidth = 40
        ctx.beginPath()
        ctx.moveTo(W + 60, H + 40)
        ctx.quadraticCurveTo(stamp.x + 120, stamp.y + 60, stamp.x + 20, stamp.y - 96)
        ctx.stroke()
        ctx.restore()
        blob(ctx, stamp.x + 6, stamp.y - 104, 22, 18, C.skin1, 1901)
      }

      if (stampedAt === null) {
        text(ctx, 'drag the stamp onto the letter', W / 2 + 24, 60, { size: 30, color: C.ink })
        if (!drag) tapHint(ctx, stamp.x, stamp.y - 80, t)
      } else if (doneAt === null && t - stampedAt > 2.4) doneAt = t
      if (doneAt !== null) {
        caption(ctx, 'On Monday, the numbers learned to add up without her.', easeOut((t - doneAt) / 0.6))
        tapHint(ctx, 50, 50, t)
      }
    },
    down(x, y, t) {
      if (doneAt !== null) {
        if (t - doneAt > 0.6) api.finish()
        return
      }
      if (stampedAt === null && dist(x, y, stamp.x, stamp.y - 40) < 80) {
        drag = { ox: x - stamp.x, oy: y - stamp.y }
        pop(300)
      }
    },
    move(x, y) {
      if (!drag) return
      stamp.x = clamp(x - drag.ox, 40, W - 40)
      stamp.y = clamp(y - drag.oy, 120, H - 40)
    },
    up(x, y, t) {
      if (!drag) return
      drag = null
      if (inRect(stamp.x, stamp.y, LETTER)) {
        mark = {
          x: clamp(stamp.x, LETTER.x + 50, LETTER.x + LETTER.w - 50),
          y: clamp(stamp.y, LETTER.y + 50, LETTER.y + LETTER.h - 50),
        }
        stampedAt = t
        tone(150, 0.25, { type: 'sine', gain: 0.15 })
        setTimeout(() => tone(784, 1.2, { gain: 0.05 }), 400)
      } else {
        stamp.x = PAD.x
        stamp.y = PAD.y - 10
        pop(220)
      }
    },
  }
}

// ---------- page 4: after ----------

function street(ctx, w, h) {
  wash(ctx, -10, -10, w + 20, h + 20, '#bfe0ea', 1920)
  blob(ctx, 430, 70, 34, 34, '#f7d06b', 1926)
  // a row of painted houses down the street
  const houses = [['#f2c14e', 150], [C.rose, 190], [C.teal, 130], ['#e8a66b', 175]]
  houses.forEach(([c, top], i) => {
    const x = 196 + i * 80
    wash(ctx, x, top, 84, 360 - top, c, 1921 + i, 0.9)
    ctx.fillStyle = C.arunHair
    ctx.beginPath()
    ctx.moveTo(x - 4, top + 4)
    ctx.lineTo(x + 42, top - 30)
    ctx.lineTo(x + 88, top + 4)
    ctx.fill()
    for (let j = 0; top + 30 + j * 56 < 300; j++) {
      for (const dx of [16, 48]) wash(ctx, x + dx, top + 30 + j * 56, 20, 28, C.cream, 1930 + i * 9 + j)
    }
  })
  wash(ctx, 270, 250, 90, 22, C.arun, 1929) // café awning
  // the grey office tower she just left
  wash(ctx, -10, 10, 190, 360, '#a9adb3', 1927)
  for (let j = 0; j < 5; j++) {
    for (let i = 0; i < 3; i++) wash(ctx, 16 + i * 54, 40 + j * 52, 34, 30, '#c9ccd1', 1960 + j * 3 + i)
  }
  wash(ctx, 50, 290, 80, 84, '#7e8288', 1975)
  // pavement, a tree and a couple of passers-by
  wash(ctx, -10, 360, w + 20, h - 350, '#d9c6aa', 1976)
  line(ctx, 470, 300, 470, 380, WOOD, 9, 1977)
  blob(ctx, 470, 270, 44, 52, C.leaf, 1978)
  person(ctx, { x: 420, y: 372, s: 0.42, top: C.plum, hair: C.miraHair, pose: 'walk', t: 0.3, facing: -1, hairStyle: 'long' })
  person(ctx, { x: 210, y: 368, s: 0.38, top: C.teal, hair: C.arunHair, skin: C.skin2, pose: 'walk', t: 1.1 })
  // Mira with her box of desk things, face to the sun
  mira(ctx, 280, 404, { s: 0.8, pose: 'hug', mouth: 'smile' })
  plant(ctx, 334, 218, 0.95, C.leaf, 1979)
  ctx.fillStyle = '#c9a06e'
  ctx.fillRect(300, 206, 72, 56)
  ctx.strokeStyle = C.ink
  ctx.lineWidth = 3
  ctx.strokeRect(300, 206, 72, 56)
  line(ctx, 300, 222, 372, 222, 'rgba(47,43,51,0.4)', 2, 1980)
}

function studioWall(ctx, w, h) {
  wash(ctx, -10, -10, w + 20, h + 20, '#f3dcbd', 1953)
  wash(ctx, -10, 250, w + 20, 80, '#c79a6c', 1954)
  // finished canvases leaning on the wall
  const sets = [[C.teal, C.mira], [C.rose, C.plum], [C.sky, C.leaf], ['#f2c14e', C.arun]]
  sets.forEach(([a, b], i) => {
    const x = 16 + i * 40
    const y = 120 + (i % 2) * 18
    ctx.fillStyle = C.cream
    ctx.fillRect(x, y, 90, 140)
    wash(ctx, x + 6, y + 6, 78, 70, a, 1955 + i, 0.8)
    blob(ctx, x + 45, y + 96, 26, 26, b, 1959 + i, 0.8)
  })
  // today's painting on the easel
  line(ctx, 350, 20, 290, 300, WOOD, 8, 1963)
  line(ctx, 350, 20, 410, 300, WOOD, 8, 1964)
  const p = memory.painting
  if (p) ctx.drawImage(p, 282, 34, 136, 155)
  else {
    ctx.fillStyle = '#fbf7ee'
    ctx.fillRect(282, 34, 136, 155)
    wash(ctx, 290, 44, 120, 70, C.sky, 1965, 0.8)
    blob(ctx, 350, 140, 40, 30, C.mira, 1966, 0.8)
  }
  ctx.strokeStyle = C.inkSoft
  ctx.lineWidth = 2
  ctx.strokeRect(282, 34, 136, 155)
  wash(ctx, 270, 186, 160, 12, WOOD, 1967)
  // brushes in a jar
  for (let i = 0; i < 3; i++) line(ctx, 462, 240, 450 + i * 12, 170, WOOD, 5, 1968 + i)
  blob(ctx, 462, 240, 22, 26, '#cfe6ee', 1971, 0.85)
}

const after = vignette((ctx, t) => {
  panel(ctx, 20, 20, W - 40, 440, street)
  faded(ctx, fade(t, 0.4), (g) => label(g, 'Her last day', W / 2, 460))
  faded(ctx, fade(t, 1.2), (g) => panel(g, 20, 510, W - 40, 290, studioWall))
}, 'Her days stopped looking the same.', { wait: 1.4 })

export default {
  title: 'Canvas',
  pages: [morning, painting, letter, after],
}
