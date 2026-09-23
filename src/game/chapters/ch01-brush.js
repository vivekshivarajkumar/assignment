// Chapter 1, page 2 · brushing teeth
// The camera pans on from the 07:28 clock into the bathroom. Mira brushes her
// teeth, half asleep; drag the toothbrush in the panel below side to side to
// fill the bar. Then the camera pans on to the clock: 08:02. Drawn on the same
// 900 x 2000 phone sheet as the bedroom.
import { W, tapHint, rng, clamp, easeInOut } from '../paint.js'
import { pop } from '../sound.js'
import { K, ink, shape, shadeInside, bigDisplay, border, sheetTop } from './ch01-wake.js'

const B = {
  wall: '#f0f0f0',
  tile: '#c5d3dd',
  grout: '#eef3f6',
  frame: '#c8c8c8',
  vest: '#c8c9c9',
  cabinet: '#9aa2a8',
  bar: '#6fd2fb',
  brush: '#4fa3d1',
  bristle: '#c6c6c6',
}

const PAN = 1076 // the clock close-up sits this far to the left of the bathroom
const BAR = { x: 130, y: 1262, w: 638, h: 68 }
const PANEL = { x: 45, y: 1385, w: 810, h: 350 }
const STROKES = 12 // side-to-side strokes to finish
const PANEL_X = 1076 // where the next clock close-up starts, to the right
// once she's done, the clock ticks from 07:28 to 08:02 while she gets ready
const FROM = 7 * 60 + 28
const TO = 8 * 60 + 2
const TICK = 0.045

// ---------- the room ----------

// Square-cornered box, filled and inked (shape() would round the corners).
function box(ctx, x1, y1, x2, y2, fill, width = 6) {
  ctx.fillStyle = fill
  ctx.fillRect(x1, y1, x2 - x1, y2 - y1)
  ctx.strokeStyle = K.ink
  ctx.lineWidth = width
  ctx.lineJoin = 'miter'
  ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)
}

function tornBottom(ctx) {
  const r = rng(211)
  ctx.beginPath()
  ctx.moveTo(-40, 0)
  ctx.lineTo(1070, 0)
  for (let x = 1070; x >= -40; x -= 18) ctx.lineTo(x, 1552 + (r() - 0.5) * 18)
  ctx.closePath()
}

function room(ctx) {
  ctx.fillStyle = B.wall
  ctx.fillRect(-40, 0, 1110, 760)
  // tiles below
  ctx.fillStyle = B.tile
  ctx.fillRect(-40, 750, 1110, 900)
  ctx.strokeStyle = B.grout
  ctx.lineWidth = 7
  for (let x = 13; x < 1070; x += 147) {
    ctx.beginPath()
    ctx.moveTo(x, 750)
    ctx.lineTo(x, 1600)
    ctx.stroke()
  }
  for (let y = 890; y < 1600; y += 146) {
    ctx.beginPath()
    ctx.moveTo(-40, y)
    ctx.lineTo(1070, y)
    ctx.stroke()
  }

  // window on the left: panes, frame, sill, jars on the sill
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(-40, 0, 135, 1000)
  ctx.fillStyle = B.frame
  ctx.fillRect(95, 0, 65, 1000)
  ctx.fillRect(-40, 510, 135, 30)
  box(ctx, -20, 645, 68, 935, B.frame, 5)
  box(ctx, 0, 930, 80, 996, B.frame, 5)
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 6
  ctx.strokeRect(95, -10, 65, 1010)
  ctx.strokeRect(-40, 510, 135, 30)
  box(ctx, -40, 996, 176, 1032, B.frame, 6)

  // cabinet on the right: toiletries on two shelves, toilet rolls below
  box(ctx, 815, 185, 1090, 905, B.frame, 7)
  box(ctx, 848, 215, 1090, 875, B.cabinet, 5)
  box(ctx, 848, 410, 1090, 442, B.frame, 5)
  box(ctx, 848, 645, 1090, 680, B.frame, 5)
  const item = (x1, y1, x2, y2) => box(ctx, x1, y1, x2, y2, '#e2e2e2', 4)
  // top shelf: pump bottle, tall bottle, jar and a box
  item(865, 300, 925, 410)
  item(882, 260, 906, 300)
  item(876, 250, 912, 262)
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(925, 350, 18, -Math.PI / 2, Math.PI / 2)
  ctx.stroke()
  item(935, 270, 1000, 410)
  item(940, 256, 994, 272)
  item(1005, 330, 1062, 410)
  item(1025, 280, 1062, 330)
  // middle shelf: bottles with labels
  item(852, 530, 915, 645)
  item(864, 480, 900, 530)
  for (const x of [872, 882, 892]) ink(ctx, [[x, 486], [x, 524]], 3)
  ink(ctx, [[860, 560], [872, 552], [884, 562], [896, 552]], 3)
  ink(ctx, [[876, 610], [880, 588], [886, 604], [890, 584]], 3)
  item(925, 530, 985, 645)
  item(930, 515, 980, 532)
  ink(ctx, [[934, 580], [946, 572], [958, 582], [970, 572]], 3)
  item(995, 560, 1020, 645)
  item(1000, 540, 1015, 560)
  item(1030, 580, 1062, 645)
  item(1040, 555, 1062, 580)
  // bottom shelf: toilet rolls
  item(905, 690, 1000, 772)
  item(855, 775, 945, 875)
  item(948, 775, 1044, 875)
  for (const x of [890, 983]) {
    ctx.setLineDash([3, 10])
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x, 790)
    ctx.lineTo(x, 865)
    ctx.stroke()
  }
  ctx.setLineDash([])

  // towel rail with a towel on the left
  box(ctx, -40, 1192, 42, 1560, B.frame, 6)
  box(ctx, 74, 1180, 110, 1270, B.frame, 5)
  ink(ctx, [[40, 1222], [80, 1222]], 8)

  // basin: a grey slab with a toothbrush on it, and the pedestal below
  box(ctx, 855, 1380, 1090, 1560, B.frame, 6)
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(862, 1480)
  ctx.quadraticCurveTo(960, 1400, 1060, 1480)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(876, 1460)
  ctx.quadraticCurveTo(960, 1420, 1046, 1462)
  ctx.stroke()
  ctx.fillStyle = B.frame
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.moveTo(1090, 1300)
  ctx.lineTo(740, 1300)
  ctx.quadraticCurveTo(712, 1302, 715, 1340)
  ctx.quadraticCurveTo(718, 1378, 740, 1380)
  ctx.lineTo(1090, 1380)
  ctx.fill()
  ctx.stroke()
  ink(ctx, [[740, 1300], [760, 1330], [1090, 1330]], 4)
  ctx.beginPath()
  ctx.roundRect(885, 1316, 125, 24, 12)
  ctx.fillStyle = '#e2e2e2'
  ctx.fill()
  ctx.lineWidth = 4
  ctx.stroke()
  ink(ctx, [[945, 1318], [945, 1338]], 3)
}

// ---------- Mira at the mirror ----------

const HAIR = [
  [300, 620], [340, 585], [400, 568], [470, 572], [540, 590], [585, 625], [610, 680],
  [625, 745], [630, 810], [622, 860], [606, 905], [580, 905], [560, 880], [545, 840],
  [540, 760], [520, 700], [460, 690], [400, 700], [372, 730], [368, 800], [372, 860],
  [360, 890], [320, 892], [282, 885], [266, 830], [270, 760], [282, 690],
]
const FACE = [[372, 700], [540, 700], [545, 780], [545, 850], [520, 878], [452, 892], [392, 878], [368, 850], [366, 760]]
const FRINGE = [
  [360, 650], [420, 628], [500, 630], [560, 660], [545, 700], [532, 745, 's'], [515, 705],
  [492, 742, 's'], [470, 706], [450, 752, 's'], [430, 708], [410, 738, 's'], [392, 706],
  [378, 728, 's'], [366, 700],
]
const NECK = [[405, 870], [495, 870], [502, 968], [398, 968]]
const TORSO = [
  [235, 1420], [235, 1060], [255, 1012], [320, 982], [400, 955], [500, 955], [580, 982],
  [640, 1012], [680, 1060], [700, 1420],
]
const VEST = [[300, 1140], [372, 1158], [450, 1170], [530, 1158], [602, 1140], [616, 1420], [288, 1420]]
const UPPER_ARM = [[590, 990], [650, 1020], [700, 1080], [744, 1150], [742, 1172], [700, 1172], [650, 1110], [604, 1050]]
const FOREARM = [[744, 1160], [735, 1080], [705, 990], [660, 905], [620, 875], [585, 900], [630, 975], [670, 1070], [702, 1165]]
const HAND = [
  [548, 806], [576, 790], [610, 794], [642, 790], [658, 812], [652, 838], [628, 852],
  [604, 882], [582, 902], [560, 886], [548, 852],
]

// k: 0..1, how far across her mouth the brush is (follows the player's drag)
function mira(ctx, k) {
  const dx = (k - 0.5) * 16
  // arms and body
  shape(ctx, TORSO, '#ffffff', null)
  ink(ctx, [[236, 1060], [235, 1240], [235, 1420]], 6)
  ink(ctx, [[258, 1012], [240, 1045]], 6)
  shape(ctx, UPPER_ARM, '#ffffff', null)
  shape(ctx, VEST, B.vest, null)
  // folds in the vest
  for (const s of [
    [[340, 1182], [366, 1192], [392, 1200]], [[420, 1196], [446, 1204], [472, 1206]],
    [[520, 1190], [544, 1182], [566, 1176]], [[350, 1250], [370, 1270], [384, 1290]],
    [[520, 1250], [512, 1276]],
  ]) ink(ctx, s, 4)
  ink(ctx, [[300, 1140], [372, 1160], [450, 1172], [530, 1160], [602, 1140]], 6)
  ink(ctx, [[298, 1120], [292, 1270], [290, 1420]], 5)
  ink(ctx, [[604, 1120], [612, 1270], [616, 1420]], 5)
  // straps
  for (const [x1, y1, x2, y2] of [[360, 962, 305, 1142], [545, 962, 598, 1142]]) {
    ctx.lineCap = 'round'
    ctx.strokeStyle = K.ink
    ctx.lineWidth = 18
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
    ctx.strokeStyle = B.vest
    ctx.lineWidth = 9
    ctx.stroke()
  }
  // collarbones and chest in pale blue
  ink(ctx, [[378, 990], [400, 986], [420, 986]], 4, B.tile)
  ink(ctx, [[480, 986], [502, 986], [524, 990]], 4, B.tile)
  ink(ctx, [[452, 1096], [456, 1130]], 4, B.tile)
  // shoulder line on the left
  ink(ctx, [[400, 955], [330, 980], [262, 1010]], 6)

  // raised arm holding the brush
  shape(ctx, FOREARM, '#ffffff', null)
  ink(ctx, [[586, 902], [630, 975], [670, 1070], [702, 1165]], 6)
  ink(ctx, [[652, 848], [705, 990], [735, 1080], [746, 1165], [720, 1175], [700, 1168]], 6)
  ink(ctx, [[500, 955], [580, 982], [640, 1012], [700, 1080]], 6)

  // neck, hair behind, face
  shape(ctx, NECK, '#ffffff', null)
  shadeInside(ctx, NECK, [[440, 870], [500, 870], [500, 920], [440, 910]], B.tile)
  ink(ctx, [[405, 880], [400, 940], [396, 962]], 5)
  ink(ctx, [[495, 880], [500, 940], [504, 962]], 5)
  shape(ctx, HAIR, K.hair, null)
  shape(ctx, FACE, '#ffffff', null)
  ink(ctx, [[392, 876], [452, 892], [520, 876]], 5) // chin
  // half-shut eyes with bags under them, curly nose
  ink(ctx, [[372, 752], [388, 750], [404, 752]], 6)
  ink(ctx, [[512, 752], [526, 750], [540, 752]], 6)
  ctx.fillStyle = K.ink
  for (const x of [390, 526]) {
    ctx.beginPath()
    ctx.arc(x, 764, 6, 0, Math.PI * 2)
    ctx.fill()
  }
  ink(ctx, [[376, 792], [388, 795], [400, 793]], 4, B.tile)
  ink(ctx, [[516, 796], [528, 798], [540, 796]], 4, B.tile)
  ink(ctx, [[436, 766], [426, 778], [432, 790], [444, 787]], 5)
  // fringe and a few strands
  shape(ctx, FRINGE, K.hair, null)
  for (const s of [
    [[310, 640], [296, 700], [290, 780]], [[590, 650], [606, 720], [610, 800]],
    [[400, 580], [370, 600], [340, 640]], [[460, 574], [470, 610], [466, 640]],
    [[290, 700], [280, 760], [284, 840]], [[604, 760], [614, 820], [606, 880]],
    [[340, 588], [300, 606], [276, 660]], [[540, 596], [580, 610], [600, 640]],
  ]) ink(ctx, s, 4)

  // toothbrush in her mouth, moving with the player's strokes
  ink(ctx, [[428, 816], [434, 822], [440, 826]], 5)
  ctx.save()
  ctx.translate(dx, 0)
  ctx.lineCap = 'round'
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 20
  ctx.beginPath()
  ctx.moveTo(440, 820)
  ctx.lineTo(648, 830)
  ctx.stroke()
  ctx.strokeStyle = B.brush
  ctx.lineWidth = 11
  ctx.stroke()
  shape(ctx, HAND, '#ffffff')
  for (const s of [[[580, 796], [586, 814], [586, 832]], [[606, 796], [612, 814], [612, 832]], [[632, 794], [636, 812], [634, 830]], [[552, 822], [566, 846]]]) ink(ctx, s, 4.5)
  ctx.restore()
}

// ---------- progress bar and the toothbrush panel ----------

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
  ctx.fillStyle = B.bar
  ctx.fillRect(x, y, 48 + (w - 48) * p, h)
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(x + 48 + (w - 48) * p, y)
  ctx.lineTo(x + 48 + (w - 48) * p, y + h)
  ctx.stroke()
  ctx.restore()
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, h / 2)
  ctx.stroke()
}

// Toothbrush lying on its side; hx is the left end of the head. foam: 0..1
function toothbrush(ctx, hx, foam) {
  const y = 1545
  ctx.save()
  ctx.lineJoin = 'round'
  // handle: thin neck, then the wide grip with a white inset
  ctx.fillStyle = B.brush
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(hx + 95, y + 6)
  ctx.lineTo(hx + 140, y + 22)
  ctx.quadraticCurveTo(hx + 240, y + 30, hx + 290, y + 20)
  ctx.quadraticCurveTo(hx + 420, y + 8, hx + 560, y + 18)
  ctx.quadraticCurveTo(hx + 590, y + 30, hx + 560, y + 44)
  ctx.quadraticCurveTo(hx + 420, y + 56, hx + 300, y + 52)
  ctx.quadraticCurveTo(hx + 240, y + 46, hx + 140, y + 44)
  ctx.lineTo(hx + 95, y + 54)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.moveTo(hx + 300, y + 44)
  ctx.quadraticCurveTo(hx + 420, y + 22, hx + 540, y + 28)
  ctx.quadraticCurveTo(hx + 550, y + 38, hx + 540, y + 42)
  ctx.quadraticCurveTo(hx + 420, y + 48, hx + 300, y + 44)
  ctx.fill()
  ctx.lineWidth = 4
  ctx.stroke()
  ctx.strokeStyle = B.brush
  ctx.lineWidth = 3
  for (let i = 0; i < 12; i++) {
    const x = hx + 390 + i * 12
    ctx.beginPath()
    ctx.moveTo(x, y + 30)
    ctx.lineTo(x, y + 40)
    ctx.stroke()
  }
  // head: bristles on top, foam building up underneath
  ctx.fillStyle = B.brush
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.roundRect(hx, y - 4, 110, 30, 8)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = B.bristle
  ctx.fillRect(hx + 8, y + 2, 94, 18)
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 3
  for (let i = 0; i < 9; i++) {
    const x = hx + 14 + i * 10
    ctx.beginPath()
    ctx.moveTo(x, y + 3)
    ctx.lineTo(x, y + 19)
    ctx.stroke()
  }
  if (foam > 0) {
    const r = rng(221)
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = K.ink
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.roundRect(hx + 6, y + 22, 96, 18 + 22 * foam, 12)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = K.ink
    for (let i = 0; i < 14 * foam; i++) ctx.fillRect(hx + 14 + r() * 80, y + 28 + r() * (12 + 20 * foam), 3, 3)
  }
  ctx.restore()
}

function panel(ctx, hx, foam) {
  const { x, y, w, h } = PANEL
  ctx.save()
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x, y, w, h)
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  toothbrush(ctx, hx, foam)
  ctx.restore()
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 8
  ctx.strokeRect(x, y, w, h)
}

// ---------- the page ----------

export default function brushTeeth(api) {
  const PAN_TIME = 1.4
  let hx = -55 // left end of the brush head, in sheet units
  let dragging = null
  let lastDir = 0
  let travel = 0
  let strokes = 0
  let doneAt = null
  const top = () => sheetTop(api.height())
  const toSheet = (x, y) => [x / 0.6, y / 0.6 + top()]
  const toScreen = (x, y) => [x * 0.6, (y - top()) * 0.6]
  const panned = (t) => easeInOut(t / PAN_TIME)
  // after the last stroke: pause, pan right to the clock, tick on to 08:02
  const panOut = (t) => (doneAt === null ? 0 : easeInOut((t - doneAt - 0.7) / 1.4) * PANEL_X)
  const tickStart = () => doneAt + 2.3
  const minuteAt = (t) => Math.min(TO, FROM + Math.max(0, Math.floor((t - tickStart()) / TICK)))
  const countDone = (t) => doneAt !== null && t > tickStart() + (TO - FROM) * TICK + 0.4
  const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}${String(m % 60).padStart(2, '0')}`

  return {
    tall: true,
    debug: () => ({ from: toScreen(hx + 300, 1570), strokes, done: doneAt !== null }),
    draw(ctx, t) {
      const h = api.height()
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, h)
      const p = strokes / STROKES
      const offset = (1 - panned(t)) * PAN - panOut(t)
      ctx.save()
      ctx.scale(0.6, 0.6)
      ctx.translate(offset, -top())

      // the bathroom, with a torn bottom edge
      ctx.save()
      tornBottom(ctx)
      ctx.clip()
      room(ctx)
      mira(ctx, clamp((hx + 55) / 255, 0, 1))
      ctx.restore()
      bar(ctx, p)
      panel(ctx, hx, clamp(p * 1.4, 0, 1))

      // the clock close-up we're panning away from, to the left
      if (doneAt !== null) {
        // the clock close-up to the right, which we pan to once she's done
        const bottom = top() + h / 0.6
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(PANEL_X - 6, top(), 1000, bottom - top())
        border(ctx, PANEL_X - 15, top(), bottom)
        const m = minuteAt(t)
        const tick = (t - tickStart()) / TICK
        ctx.save()
        ctx.translate(PANEL_X, 0)
        bigDisplay(ctx, hhmm(m), m < TO && tick > 0 ? 3 : -1, m < TO && tick > 0 ? tick % 1 : 0)
        ctx.restore()
      }
      if (offset > 0) {
        const bottom = top() + h / 0.6
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(-PAN - 40, top(), PAN + 30, bottom - top())
        border(ctx, -25, top(), bottom)
        ctx.save()
        ctx.translate(-PAN, 0)
        bigDisplay(ctx, '0728', -1, 0)
        ctx.restore()
      }
      ctx.restore()

      if (t > PAN_TIME && strokes === 0 && !dragging) {
        const [x, y] = toScreen(hx + 300, 1570)
        tapHint(ctx, x, y, t, K.ink)
      }
      if (countDone(t)) tapHint(ctx, 50, 50, t)
    },
    down(x, y, t) {
      if (doneAt !== null) {
        if (countDone(t)) api.finish()
        return
      }
      if (t < PAN_TIME) return
      const [, sy] = toSheet(x, y)
      if (sy > PANEL.y && sy < PANEL.y + PANEL.h) dragging = { x }
    },
    move(x, y, t) {
      if (!dragging || doneAt !== null) return
      // follow the finger's movement since the last event, so the brush never sticks at an end
      const next = clamp(hx + (x - dragging.x) / 0.6, -60, 200)
      dragging.x = x
      const d = next - hx
      if (d !== 0) {
        // a stroke counts when the brush turns back after travelling far enough
        const dir = Math.sign(d)
        if (dir === lastDir) travel += Math.abs(d)
        else {
          if (travel > 60) {
            strokes = Math.min(STROKES, strokes + 1)
            pop(220 + strokes * 25)
            if (strokes >= STROKES) doneAt = t
          }
          lastDir = dir
          travel = Math.abs(d)
        }
      }
      hx = next
    },
    up() {
      dragging = null
    },
  }
}
