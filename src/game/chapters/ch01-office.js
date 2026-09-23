// Chapter 1, page 4 · the office
// The camera pans on from the 08:58 clock to Mira at her desk, seen from
// behind. Below is a grid of amounts: tap two that match to clear them. When
// every pair is cleared the grid fills with new numbers; the bar fills as she
// works through them. Same 900 x 2000 phone sheet as the other pages.
import { W, tapHint, rng, easeInOut } from '../paint.js'
import { pop } from '../sound.js'
import { K, ink, shape, bigDisplay, border, sheetTop } from './ch01-wake.js'

const O = {
  ceiling: '#c6d4de',
  ceilingLine: '#7e7e7e',
  wall: '#c7c7c7',
  paper: '#f1eff1',
  note: '#c6d4de',
  bezel: '#7c7c7c',
  screen: '#c6d4de',
  window: '#c7c7c7',
  desk: '#e6e6e6',
  drawer: '#7d7d7d',
  shirt: '#f0eef0',
  hair: '#282021',
  chair: '#2a2222',
  blue: '#54a7d0',
  seat: '#8994a1',
  bar: '#6fd2fb',
  select: '#c6d4de',
}

const PAN = 1076 // the clock close-up sits this far to the left of the office
const BAR = { x: 130, y: 1168, w: 638, h: 64 }
const GRID = { x: 48, y: 1383, cw: 267, ch: 133 }
const ROUNDS = [
  [8, 196, 58, 78, 3, 78, 3, 196, 58],
  [41, 12, 250, 12, 7, 41, 250, 90, 7],
  [64, 5, 19, 5, 330, 64, 19, 330, 26],
]
const PAIRS = ROUNDS.length * 4

// Square-cornered box, filled and inked.
function box(ctx, x1, y1, x2, y2, fill, width = 6) {
  ctx.fillStyle = fill
  ctx.fillRect(x1, y1, x2 - x1, y2 - y1)
  if (width) {
    ctx.strokeStyle = K.ink
    ctx.lineWidth = width
    ctx.lineJoin = 'miter'
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)
  }
}

// A pale blue sticky note, slightly turned, with a scribble on it.
function note(ctx, x, y, w, h, a, seed) {
  const r = rng(seed)
  ctx.save()
  ctx.translate(x + w / 2, y + h / 2)
  ctx.rotate(a)
  box(ctx, -w / 2, -h / 2, w / 2, h / 2, O.note, 5)
  for (let i = 0; i < 2; i++) {
    const yy = -h / 4 + i * (h / 3)
    const pts = []
    for (let k = 0; k < 6; k++) pts.push([-w / 3 + k * (w / 9), yy + (r() - 0.5) * 8])
    ink(ctx, pts, 3.5)
  }
  ctx.restore()
}

function office(ctx) {
  // ceiling tiles, then the wall of her cubicle
  ctx.fillStyle = O.ceiling
  ctx.fillRect(-40, 0, 1110, 250)
  ctx.strokeStyle = O.ceilingLine
  ctx.lineWidth = 6
  for (const [x1, y1, x2, y2] of [[-40, 127, 1070, 127], [0, 100, 150, 250], [540, 58, 750, 250], [980, 58, 1070, 150]]) {
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }
  ctx.fillStyle = O.wall
  ctx.fillRect(-40, 250, 1110, 1400)
  ink(ctx, [[-40, 252], [1070, 252]], 8)

  // papers pinned to the wall, and sticky notes
  box(ctx, 35, 322, 235, 595, O.paper)
  box(ctx, 580, 305, 762, 555, O.paper)
  for (const [x1, x2, y] of [[705, 740, 340], [705, 735, 355], [600, 635, 382], [610, 690, 410], [610, 700, 430], [610, 700, 445], [700, 725, 462], [700, 725, 475]]) ink(ctx, [[x1, y], [x2, y]], 4)
  note(ctx, 790, 422, 64, 70, 0.05, 401)
  note(ctx, 662, 515, 76, 64, 0.08, 402)
  box(ctx, -10, 628, 88, 722, O.note, 5)
  ink(ctx, [[10, 660], [20, 652], [34, 662], [48, 652], [62, 660]], 3.5)
  ink(ctx, [[20, 690], [40, 686]], 3.5)
  note(ctx, 770, 893, 72, 62, -0.08, 403)
  // binders on a shelf at the left
  for (let i = 0; i < 4; i++) box(ctx, -10 + i * 28, 770, 18 + i * 28, 920, O.paper, 5)
  ctx.beginPath()
  ctx.arc(8, 850, 10, 0, Math.PI * 2)
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 5
  ctx.stroke()

  // monitor with a spreadsheet on it
  box(ctx, 505, 600, 888, 908, O.bezel, 8)
  box(ctx, 545, 636, 836, 885, O.screen, 6)
  box(ctx, 565, 665, 655, 850, O.screen, 4)
  box(ctx, 740, 650, 836, 700, O.window, 4)
  box(ctx, 596, 694, 808, 850, O.window, 5)
  ctx.strokeStyle = '#8a8a8a'
  ctx.lineWidth = 3
  for (let y = 712; y < 850; y += 16) {
    ctx.beginPath()
    ctx.moveTo(600, y)
    ctx.lineTo(806, y)
    ctx.stroke()
  }
  for (const x of [652, 705, 760]) {
    ctx.beginPath()
    ctx.moveTo(x, 698)
    ctx.lineTo(x, 848)
    ctx.stroke()
  }
  box(ctx, 565, 842, 590, 862, O.window, 3)
  box(ctx, 620, 852, 650, 868, O.window, 3)
  box(ctx, 662, 908, 726, 1052, '#5f5f5f', 6) // stand
  box(ctx, 612, 1040, 800, 1068, '#5f5f5f', 6)

  // desk: top, front edge, and a drawer unit on the right
  ctx.fillStyle = O.desk
  ctx.fillRect(380, 1020, 700, 140)
  ink(ctx, [[380, 1150], [1070, 1150]], 7)
  box(ctx, 790, 1180, 1070, 1380, O.drawer, 7)
  box(ctx, 808, 1205, 1070, 1360, O.wall, 5)
  // pen pot, keyboard, mouse on its pad, mug
  box(ctx, 510, 990, 598, 1062, O.wall, 6)
  for (const x of [520, 535, 548, 560, 572, 585]) ink(ctx, [[x, 990], [x + 2, 930]], 5)
  ctx.fillStyle = K.ink
  ctx.fillRect(582, 985, 16, 50)
  ctx.save()
  ctx.translate(655, 1100)
  ctx.rotate(-0.25)
  box(ctx, -60, -18, 60, 18, '#3a3a3a', 5)
  ctx.restore()
  ctx.save()
  ctx.translate(760, 1128)
  ctx.transform(1, 0, -0.4, 1, 0, 0)
  box(ctx, -70, -30, 90, 30, O.wall, 5)
  ctx.restore()
  shape(ctx, [[745, 1108], [790, 1086], [832, 1098], [830, 1128], [770, 1136]], O.wall)
  box(ctx, 850, 1030, 920, 1130, O.wall, 6)
  ctx.beginPath()
  ctx.arc(850, 1076, 20, Math.PI / 2, Math.PI * 1.5)
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 6
  ctx.stroke()
}

// Mira from behind, typing, in her office chair.
function mira(ctx, t) {
  // her seat and the chair's column below the bar
  shape(ctx, [[290, 1236], [420, 1232], [520, 1240], [556, 1270], [566, 1330], [566, 1380], [290, 1380]], O.seat)
  box(ctx, 90, 1150, 180, 1380, O.chair, 6)
  for (let y = 1170; y < 1370; y += 16) ink(ctx, [[96, y], [174, y + 4]], 4, '#5a5a5a')
  box(ctx, 80, 1348, 480, 1380, O.blue, 6)

  // white shirt: her back and the arm reaching to the keyboard
  shape(ctx, [[70, 1180], [80, 880], [110, 780], [180, 735], [300, 722], [390, 760], [420, 880], [430, 1000], [420, 1180]], O.shirt)
  for (const s of [[[170, 820], [168, 880]], [[230, 820], [226, 900]], [[300, 900], [320, 960], [340, 1040]], [[260, 790], [300, 800]]]) ink(ctx, s, 5)
  const type = Math.sin(t * 14) * 3
  shape(ctx, [[400, 770], [430, 900], [440, 1060], [460, 1110], [530, 1118], [540, 1060], [480, 1020], [460, 900], [420, 780]], O.shirt)
  ink(ctx, [[500, 1070], [510, 1110]], 5) // cuff
  // hand on the keyboard: back of the hand, fingers curling down onto the keys
  shape(ctx, [[528, 1046], [556, 1024], [600, 1022], [632, 1034], [650, 1062], [640, 1096], [596, 1110], [548, 1112], [526, 1094]], O.shirt)
  for (const [i, x] of [578, 602, 626].entries()) {
    const k = i === 1 ? type : 0
    ink(ctx, [[x - 6, 1066], [x + 4, 1084 + k], [x + 2, 1104 + k]], 4.5)
  }
  ink(ctx, [[560, 1040], [590, 1036], [620, 1042]], 3.5) // knuckles
  ink(ctx, [[530, 1060], [520, 1030], [536, 1010]], 5) // thumb resting on the desk edge

  // a sliver of her face turned to the screen, then her bob
  shape(ctx, [[400, 470], [448, 478], [454, 525], [458, 560], [450, 585], [448, 612], [438, 645], [400, 660]], O.shirt, null)
  ink(ctx, [[446, 480], [452, 530], [460, 560], [450, 582], [448, 612], [436, 648]], 5)
  ink(ctx, [[416, 564], [418, 586]], 6) // eye
  shape(ctx, [
    [140, 560], [150, 470], [200, 395], [290, 372], [380, 384], [430, 425], [452, 470],
    [420, 478], [408, 520], [404, 600], [406, 660], [412, 722], [360, 727], [260, 731],
    [160, 725], [138, 650],
  ], O.hair, null)
  // ragged ends and strands
  for (let i = 0; i < 13; i++) {
    const x = 150 + i * 20
    ink(ctx, [[x, 650 + (i % 3) * 8], [x + 1, 700 + (i % 2) * 14]], 3.5)
  }
  for (const s of [[[420, 480], [408, 540], [406, 620]], [[430, 440], [412, 470]], [[250, 400], [220, 470], [205, 560]], [[330, 390], [350, 460], [360, 560]]]) ink(ctx, s, 3.5)

  // chair back, dark with a blue rim
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(-20, 925, 300, 240, 26)
  ctx.fillStyle = O.blue
  ctx.fill()
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 7
  ctx.stroke()
  ctx.beginPath()
  ctx.roundRect(-20, 945, 270, 212, 20)
  ctx.fillStyle = O.chair
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

// ---------- the minigame ----------

function bar(ctx, p) {
  const { x, y, w, h } = BAR
  ctx.save()
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(x - 8, y - 8, w + 16, h + 16, (h + 16) / 2)
  ctx.fill()
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, h / 2)
  ctx.clip()
  if (p > 0) {
    const fx = x + (w - 20) * p + 20
    ctx.fillStyle = O.bar
    ctx.fillRect(x, y, fx - x, h)
    ctx.strokeStyle = K.ink
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.moveTo(fx, y)
    ctx.lineTo(fx, y + h)
    ctx.stroke()
  }
  ctx.restore()
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, h / 2)
  ctx.stroke()
}

const cellRect = (i) => ({
  x: GRID.x + (i % 3) * GRID.cw,
  y: GRID.y + Math.floor(i / 3) * GRID.ch,
})

function grid(ctx, cells, t) {
  ctx.save()
  cells.forEach((c, i) => {
    const { x, y } = cellRect(i)
    const shake = c.wrongAt !== null && t - c.wrongAt < 0.35 ? Math.sin((t - c.wrongAt) * 60) * 6 : 0
    ctx.fillStyle = c.selected ? O.select : '#ffffff'
    ctx.fillRect(x, y, GRID.cw, GRID.ch)
    if (c.value !== null) {
      // a cleared cell's number fades away
      const a = c.clearedAt === null ? 1 : Math.max(0, 1 - (t - c.clearedAt) / 0.3)
      if (a > 0) {
        ctx.globalAlpha = a
        ctx.fillStyle = '#111111'
        ctx.font = `400 58px 'Helvetica Neue', Arial, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`$${c.value}`, x + GRID.cw / 2 + shake, y + GRID.ch / 2 + 4)
        ctx.globalAlpha = 1
      }
    }
  })
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 7
  for (let i = 0; i <= 3; i++) {
    ctx.beginPath()
    ctx.moveTo(GRID.x + i * GRID.cw, GRID.y)
    ctx.lineTo(GRID.x + i * GRID.cw, GRID.y + 3 * GRID.ch)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(GRID.x, GRID.y + i * GRID.ch)
    ctx.lineTo(GRID.x + 3 * GRID.cw, GRID.y + i * GRID.ch)
    ctx.stroke()
  }
  ctx.restore()
}

// ---------- the page ----------

export default function officeWork(api) {
  const PAN_TIME = 1.4
  let round = 0
  let cells = []
  let matched = 0
  let doneAt = null
  let nextRoundAt = null
  const top = () => sheetTop(api.height())
  const toSheet = (x, y) => [x / 0.6, y / 0.6 + top()]
  const toScreen = (x, y) => [x * 0.6, (y - top()) * 0.6]
  const deal = () => {
    cells = ROUNDS[round].map((value) => ({ value, selected: false, clearedAt: null, wrongAt: null }))
  }
  deal()
  const open = () => cells.filter((c) => c.clearedAt === null)
  // a round is over when no two open cells match
  const roundOver = () => {
    const vals = open().map((c) => c.value)
    return vals.every((v, i) => vals.indexOf(v) === i)
  }

  return {
    tall: true,
    // test hook: centres of the next matching pair
    debug: () => {
      const o = cells.map((c, i) => [c, i]).filter(([c]) => c.clearedAt === null)
      for (const [a, i] of o) {
        const j = o.find(([b, k]) => k !== i && b.value === a.value)
        if (j) {
          const c1 = cellRect(i)
          const c2 = cellRect(j[1])
          return { pair: [toScreen(c1.x + GRID.cw / 2, c1.y + GRID.ch / 2), toScreen(c2.x + GRID.cw / 2, c2.y + GRID.ch / 2)], matched, done: doneAt !== null }
        }
      }
      return { pair: null, matched, done: doneAt !== null }
    },
    draw(ctx, t) {
      const h = api.height()
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, h)
      if (nextRoundAt !== null && t >= nextRoundAt) {
        nextRoundAt = null
        round += 1
        deal()
      }
      const offset = (1 - easeInOut(t / PAN_TIME)) * PAN
      ctx.save()
      ctx.scale(0.6, 0.6)
      ctx.translate(offset, -top())

      // the office, cut off with a torn edge below the chair
      ctx.save()
      const r = rng(411)
      ctx.beginPath()
      ctx.moveTo(-40, 0)
      ctx.lineTo(1070, 0)
      for (let x = 1070; x >= -40; x -= 18) ctx.lineTo(x, 1610 + (r() - 0.5) * 22)
      ctx.closePath()
      ctx.clip()
      office(ctx)
      mira(ctx, t)
      ctx.restore()
      bar(ctx, matched / PAIRS)
      grid(ctx, cells, t)

      // the 08:58 clock we're panning away from, to the left
      if (offset > 0) {
        const bottom = top() + h / 0.6
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(-PAN - 40, top(), PAN + 30, bottom - top())
        border(ctx, -25, top(), bottom)
        ctx.save()
        ctx.translate(-PAN, 0)
        bigDisplay(ctx, '0858', -1, 0)
        ctx.restore()
      }
      ctx.restore()

      if (t > PAN_TIME + 1.2 && matched === 0 && !cells.some((c) => c.selected)) {
        const [x, y] = toScreen(GRID.x + GRID.cw * 1.5, GRID.y + GRID.ch / 2)
        tapHint(ctx, x, y - 30, t, K.ink)
      }
      if (doneAt !== null && t - doneAt > 0.8) tapHint(ctx, 50, 50, t)
    },
    down(x, y, t) {
      if (doneAt !== null) {
        if (t - doneAt > 0.8) api.finish()
        return
      }
      if (t < PAN_TIME || nextRoundAt !== null) return
      const [sx, sy] = toSheet(x, y)
      const col = Math.floor((sx - GRID.x) / GRID.cw)
      const row = Math.floor((sy - GRID.y) / GRID.ch)
      if (col < 0 || col > 2 || row < 0 || row > 2) return
      const cell = cells[row * 3 + col]
      if (cell.clearedAt !== null) return
      const picked = cells.find((c) => c.selected)
      if (!picked) {
        cell.selected = true
        pop(480)
        return
      }
      picked.selected = false
      if (picked === cell) return
      if (picked.value === cell.value) {
        picked.clearedAt = cell.clearedAt = t
        matched += 1
        pop(620 + matched * 20)
        if (matched >= PAIRS) doneAt = t
        else if (roundOver()) nextRoundAt = t + 0.6
      } else {
        picked.wrongAt = cell.wrongAt = t
        pop(200)
      }
    },
  }
}
