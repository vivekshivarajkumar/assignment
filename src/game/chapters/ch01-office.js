// Chapter 1, page 4 · the office
// The camera pans on from the 08:58 clock to Mira at her desk, seen from
// behind. Below is a grid of amounts: tap two that match to clear them. When
// every pair is cleared the grid fills with new numbers; the bar fills as she
// works through them. Then the camera pans on to the clock as the day runs
// on to 02:29. Same 900 x 2000 phone sheet as the other pages.
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
const PANEL_X = 1076 // where the next clock close-up starts, to the right
// once she's done, the clock runs through the day, 08:58 to 14:29 (shown 02:29)
const FROM = 8 * 60 + 58
const TO = 14 * 60 + 29
const TICK = 0.012
const hhmm12 = (m) => `${String(((Math.floor(m / 60) + 11) % 12) + 1).padStart(2, '0')}${String(m % 60).padStart(2, '0')}`

// Smooth ink stroke through points (curves through midpoints, no corners).
function curve(ctx, pts, width = 6) {
  ctx.strokeStyle = K.ink
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length - 1; i++) {
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2)
  }
  ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1])
  ctx.stroke()
}

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

// Mira from behind, typing, in her office chair. Traced over a fine grid.
// crown, right side by her face, ragged ends (generated below), left side
const HAIR_TOP = [
  [150, 452], [170, 420], [200, 400], [240, 388], [280, 381], [320, 379], [360, 384],
  [395, 396], [422, 416], [442, 445], [456, 480], [462, 515], [456, 540], [440, 540],
  [420, 530], [405, 545], [398, 600], [396, 660], [392, 700],
]
const HAIR_LEFT = [[140, 700], [124, 660], [116, 600], [120, 530], [132, 480]]
const HAIR = (() => {
  // strand tips along the bottom, uneven, from right to left
  const r = rng(421)
  const tips = []
  for (let x = 388; x > 146; x -= 9 + r() * 12) {
    tips.push([x, 712 + r() * 18, 's'])
    tips.push([x - 4, 704 + r() * 6])
  }
  return [...HAIR_TOP, ...tips, ...HAIR_LEFT]
})()
const FACE = [[396, 535], [440, 540], [434, 560], [430, 585], [436, 605], [446, 622], [434, 636], [430, 652], [410, 690], [392, 702]]
const BACK = [
  [40, 780], [63, 785], [109, 750], [163, 736], [230, 730], [300, 735], [348, 746],
  [386, 769], [405, 792], [417, 823], [425, 900], [428, 992], [432, 1062], [436, 1108],
  [371, 1140], [330, 1150], [294, 1162], [86, 1162], [82, 854],
]
// forearm, cuff and hand in one shape: from the elbow, over the knuckles, to
// fingertips resting on the keys
const HAND = [
  [371, 1140], [436, 1108], [434, 1012], [470, 1014], [500, 1026], [522, 1044], [560, 1040],
  [600, 1046], [630, 1058], [655, 1072], [662, 1088], [644, 1098], [600, 1104], [540, 1112],
  [480, 1120],
]

function mira(ctx, t) {
  // her seat and the chair's column below the bar
  shape(ctx, [[100, 1190], [300, 1176], [470, 1180], [530, 1210], [556, 1260], [566, 1330], [566, 1380], [100, 1380]], O.seat)
  box(ctx, 90, 1150, 180, 1380, O.chair, 6)
  for (let y = 1170; y < 1370; y += 16) ink(ctx, [[96, y], [174, y + 4]], 4, '#5a5a5a')
  box(ctx, 80, 1348, 480, 1380, O.blue, 6)

  // her back and right arm in a white shirt
  shape(ctx, BACK, O.shirt, null)
  curve(ctx, [[40, 780], [63, 785], [109, 750], [163, 736]], 6) // shoulders
  curve(ctx, [[300, 735], [348, 746], [386, 769], [405, 792], [417, 823], [425, 900], [428, 992], [432, 1062], [436, 1100]], 7)
  ink(ctx, [[63, 785], [82, 854], [86, 923]], 6) // her left side
  curve(ctx, [[317, 815], [309, 931], [317, 1008], [332, 1085], [355, 1131]], 6) // back of the arm
  for (const s of [
    [[217, 785], [211, 830], [205, 869]], [[178, 815], [176, 845], [175, 869]],
    [[271, 900], [279, 915], [286, 931]], [[363, 892], [370, 940], [378, 985]], [[348, 954], [360, 978], [371, 1000]],
  ]) ink(ctx, s, 5)

  // forearm reaching to the keyboard, cuff, and the hand on the keys
  const type = Math.sin(t * 14) * 2.5
  shape(ctx, HAND, O.shirt, null)
  curve(ctx, [[340, 1142], [371, 1140], [440, 1128], [540, 1112], [600, 1104], [644, 1098], [662, 1088], [655, 1072], [630, 1058], [600, 1046], [560, 1040]], 7)
  ink(ctx, [[434, 1012], [470, 1014], [500, 1026], [522, 1044]], 6)
  ink(ctx, [[498, 1070], [502, 1108]], 5) // cuff
  ink(ctx, [[448, 1026], [462, 1034], [468, 1050]], 5) // knuckles
  ink(ctx, [[474, 1030], [490, 1038], [496, 1054]], 5)
  // fingers bent down onto the keys, one of them tapping
  for (const [i, [x, y]] of [[572, 1060], [600, 1066], [628, 1074]].entries()) {
    ctx.save()
    ctx.translate(x, y + (i === 1 ? type : 0))
    ctx.rotate(0.5)
    ctx.beginPath()
    ctx.roundRect(-10, -6, 20, 44, 10)
    ctx.fillStyle = O.shirt
    ctx.fill()
    ctx.strokeStyle = K.ink
    ctx.lineWidth = 5
    ctx.stroke()
    ctx.restore()
  }

  // a sliver of her face turned to the screen: eye, nose, chin
  shape(ctx, FACE, O.shirt, null)
  curve(ctx, [[442, 545], [432, 565], [430, 588], [438, 606], [447, 622], [434, 637], [430, 655], [412, 690], [396, 702]], 6)
  ink(ctx, [[416, 568], [418, 590]], 7)

  // her bob: rounded crown, straight sides, ragged ends
  shape(ctx, HAIR, O.hair, null)
  curve(ctx, [[140, 700], [124, 660], [116, 600], [120, 530], [132, 480], [150, 452], [170, 420], [200, 400], [240, 388], [280, 381], [320, 379], [360, 384], [395, 396], [422, 416], [442, 445], [456, 480]], 7)
  ink(ctx, [[150, 452], [132, 500], [118, 560]], 4) // a flyaway on the left
  // strands down the back of her head, and the fringe falling past her face
  for (const s of [
    [[390, 460], [394, 560], [392, 660], [388, 730]], [[372, 610], [374, 670], [370, 725]],
    [[340, 590], [345, 660], [344, 722]], [[312, 630], [316, 680], [312, 714]],
    [[284, 600], [282, 660], [282, 716]], [[252, 640], [256, 690], [262, 720]],
    [[226, 610], [224, 670], [228, 716]], [[196, 640], [196, 690], [192, 716]],
    [[168, 620], [164, 670], [160, 706]], [[150, 540], [146, 610], [148, 680]],
  ]) ink(ctx, s, 4.5)
  for (const s of [
    [[410, 440], [430, 490], [446, 538]], [[426, 452], [446, 500], [458, 532]],
    [[436, 458], [454, 488], [462, 520]], [[404, 470], [414, 520], [418, 540]],
  ]) ink(ctx, s, 4.5)

  // chair back, dark with a blue rim along the top and right
  ctx.save()
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.roundRect(-20, 922, 316, 248, 30)
  ctx.fillStyle = O.blue
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.roundRect(-20, 938, 302, 232, 24)
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
  const panOut = (t) => (doneAt === null ? 0 : easeInOut((t - doneAt - 0.9) / 1.6) * PANEL_X)
  const tickStart = () => doneAt + 2.6
  const minuteAt = (t) => Math.min(TO, FROM + Math.max(0, Math.floor((t - tickStart()) / TICK)))
  const countDone = (t) => doneAt !== null && t > tickStart() + (TO - FROM) * TICK + 0.4
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
      const offset = (1 - easeInOut(t / PAN_TIME)) * PAN - panOut(t)
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

      // the clock close-up to the right, which we pan to once she's done
      if (doneAt !== null) {
        const bottom = top() + h / 0.6
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(PANEL_X - 6, top(), 1000, bottom - top())
        border(ctx, PANEL_X - 15, top(), bottom)
        const m = minuteAt(t)
        const tick = (t - tickStart()) / TICK
        ctx.save()
        ctx.translate(PANEL_X, 0)
        bigDisplay(ctx, hhmm12(m), m < TO && tick > 0 ? 3 : -1, m < TO && tick > 0 ? tick % 1 : 0)
        ctx.restore()
      }

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
      if (countDone(t)) tapHint(ctx, 50, 50, t)
    },
    down(x, y, t) {
      if (doneAt !== null) {
        if (countDone(t)) api.finish()
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
