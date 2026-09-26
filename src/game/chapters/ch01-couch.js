// Chapter 1, page 7 · home, on the couch
// The day ends the way it started, by herself: supermarket sushi eaten out of
// the tray in front of the curtains, still in the blue top she wore to work.
// Tap a piece to eat it; the bar fills as the tray empties. Traced on the same
// 900 x 2000 phone sheet as the rest of the chapter.
import { W, tapHint } from '../paint.js'
import { pop } from '../sound.js'
import { K, ink, shape, sheetTop } from './ch01-wake.js'

const C3 = {
  wall: '#e8e9ea',
  curtain: '#dcdfe3',
  shadow: '#9db2c3',
  couch: '#b8cad7',
  couchDark: '#9cb1c1',
  couchSeam: '#8ca4b5',
  skin: '#ffffff',
  shirt: '#2f9dc6',
  shirtDark: '#2482a6',
  tray: '#2b2e30',
  trayLip: '#50565a',
  panelBg: '#cfe0ea',
  rice: '#f4f2ef',
  nori: '#40464a',
  fish: '#bdd4e1',
  fishDark: '#93b2c6',
  bar: '#6fd2fb',
}

const BAR = { x: 140, y: 1168, w: 620, h: 64 }
const PANEL = { x: 50, y: 1330, w: 810, h: 372 }

// Six maki in two rows, two nigiri down the right of the tray.
const PIECES = [
  { kind: 'maki', x: 216, y: 1452 },
  { kind: 'maki', x: 353, y: 1452 },
  { kind: 'maki', x: 490, y: 1452 },
  { kind: 'maki', x: 216, y: 1582 },
  { kind: 'maki', x: 353, y: 1582 },
  { kind: 'maki', x: 490, y: 1582 },
  { kind: 'nigiri', x: 666, y: 1448 },
  { kind: 'nigiri', x: 666, y: 1584 },
]

// ---------- the room ----------

// Long curtains behind the couch: a pale wall with folds hanging the full drop.
function curtains(ctx) {
  ctx.fillStyle = C3.wall
  ctx.fillRect(-30, 0, 960, 780)
  ctx.fillStyle = C3.curtain
  ctx.fillRect(-30, 0, 960, 620)
  // the folds, each a tapered stroke that fades out before the hem
  const FOLDS = [30, 120, 215, 330, 470, 585, 665, 740, 815]
  FOLDS.forEach((x, i) => {
    const drop = 300 + ((i * 97) % 260)
    ink(ctx, [[x, 40], [x + 6, 40 + drop / 2], [x + 2, 40 + drop]], 5)
  })
  // the rail the curtains hang from, and the wall below them
  ink(ctx, [[-30, 620], [300, 616], [620, 622], [930, 616]], 9)
}

// Her shape thrown on the curtains by the television she is not watching.
function wallShadow(ctx) {
  ctx.save()
  ctx.fillStyle = C3.shadow
  ctx.globalAlpha = 0.55
  ctx.beginPath()
  ctx.ellipse(452, 560, 168, 210, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// The couch: a long back cushion, a seat, and an arm at either end.
function couch(ctx) {
  const armL = [[-40, 960, 's'], [120, 940], [190, 1010], [186, 1300, 's'], [-40, 1300, 's']]
  const armR = [[940, 960, 's'], [782, 940], [712, 1010], [716, 1300, 's'], [940, 1300, 's']]
  // back cushions
  shape(ctx, [[-40, 790, 's'], [230, 742], [660, 742], [940, 790, 's'], [940, 1120, 's'], [-40, 1120, 's']], C3.couch)
  // seat, tucked under the back
  shape(ctx, [[-40, 986, 's'], [450, 1036], [940, 986, 's'], [940, 1320, 's'], [-40, 1320, 's']], C3.couchDark)
  // a crease in each back cushion
  ctx.strokeStyle = C3.couchSeam
  ctx.lineWidth = 6
  ctx.lineCap = 'round'
  ;[[120, 800, 168, 980], [790, 798, 742, 978]].forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.quadraticCurveTo((x1 + x2) / 2 - 14, (y1 + y2) / 2, x2, y2)
    ctx.stroke()
  })
  shape(ctx, armL, C3.couch)
  shape(ctx, armR, C3.couch)
  // the dark gap between the right arm and the seat
  shape(ctx, [[716, 1016, 's'], [790, 1006], [800, 1300, 's'], [716, 1300, 's']], C3.couchSeam, K.ink, 5)
}

// ---------- Mira ----------

// Her hair: a heavy black bob, cut straight, with a fringe she keeps pushing off.
function hair(ctx) {
  shape(
    ctx,
    [[452, 428], [560, 452], [612, 560], [614, 700], [596, 770, 's'], [540, 744], [520, 600], [384, 600], [364, 744], [308, 770, 's'], [290, 700], [292, 560], [344, 452]],
    K.hair,
    K.ink,
    7,
  )
  // strands falling out of the fringe
  ;[[400, 470, 392, 596], [452, 462, 456, 590], [508, 472, 514, 594]].forEach(([x1, y1, x2, y2]) =>
    ink(ctx, [[x1, y1], [x2, y2]], 5, K.hairDark),
  )
}

// Her face, flat and tired: two dots, a nose, a mouth that is not quite a line.
function face(ctx) {
  shape(ctx, [[452, 476], [534, 520], [546, 640], [516, 726], [452, 748], [388, 726], [358, 640], [370, 520]], C3.skin, K.ink, 7)
  // the fringe sits over the top of the face
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(352, 478)
  ctx.quadraticCurveTo(452, 448, 552, 478)
  ctx.quadraticCurveTo(540, 596, 452, 606)
  ctx.quadraticCurveTo(364, 596, 352, 478)
  ctx.fillStyle = K.hair
  ctx.fill()
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 7
  ctx.stroke()
  ctx.restore()
  // eyes
  ctx.fillStyle = K.ink
  ;[[410, 634], [502, 634]].forEach(([x, y]) => {
    ctx.beginPath()
    ctx.ellipse(x, y, 9, 12, 0, 0, Math.PI * 2)
    ctx.fill()
  })
  // nose, and the small closed mouth under it
  ink(ctx, [[450, 646], [446, 678], [462, 684]], 5)
  ink(ctx, [[418, 706], [442, 698], [462, 708], [486, 700]], 5)
}

// Shoulders, the blue top, and the arms that hold the tray.
function body(ctx, chew) {
  // neck
  shape(ctx, [[416, 730, 's'], [488, 730, 's'], [492, 808, 's'], [412, 808, 's']], C3.skin, K.ink, 7)
  // the top: a wide neckline, short sleeves, straight down to her lap
  shape(
    ctx,
    [[368, 800, 's'], [300, 828], [258, 944, 's'], [318, 974, 's'], [304, 1100, 's'],
     [600, 1100, 's'], [586, 974, 's'], [646, 944, 's'], [604, 828], [536, 800, 's'], [452, 834]],
    C3.shirt,
    K.ink,
    7,
  )
  // the neckline, and folds pulled across the front
  ctx.save()
  ctx.strokeStyle = C3.shirtDark
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  ;[[350, 890, 460, 918], [556, 884, 470, 952], [340, 1000, 566, 988], [372, 1046, 540, 1040]].forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + 14, x2, y2)
    ctx.stroke()
  })
  ctx.restore()
  // the hand with the chopsticks lifts a little while she chews
  hands(ctx, chew ? -16 : 0)
}

// Forearms down to the tray: chopsticks in one hand, the other flat on the lid.
function hands(ctx, lift) {
  // her right arm (screen left), raised — the chopsticks hand
  ctx.save()
  ctx.translate(0, lift)
  shape(ctx, [[300, 962, 's'], [346, 968, 's'], [382, 1052, 's'], [340, 1094, 's'], [288, 1034, 's']], C3.skin, K.ink, 7)
  // two sticks crossing the body, pinched between her fingers
  ink(ctx, [[176, 930], [268, 992], [366, 1056]], 9)
  ink(ctx, [[188, 962], [272, 1016], [358, 1074]], 9)
  // the hand closed round them
  shape(ctx, [[306, 1046], [356, 1038], [386, 1072], [372, 1116], [318, 1122], [292, 1088]], C3.skin, K.ink, 7)
  ;[[310, 1062, 348, 1054], [314, 1086, 352, 1078], [320, 1106, 352, 1100]].forEach(([x1, y1, x2, y2]) =>
    ink(ctx, [[x1, y1], [x2, y2]], 4),
  )
  ctx.restore()
  // her left arm (screen right), resting
  shape(ctx, [[558, 968, 's'], [604, 962, 's'], [616, 1034, 's'], [570, 1094, 's'], [524, 1050, 's']], C3.skin, K.ink, 7)
  shape(ctx, [[536, 1064], [590, 1054], [622, 1086], [610, 1126], [556, 1132], [528, 1100]], C3.skin, K.ink, 7)
  ;[[540, 1080, 586, 1072], [546, 1102, 590, 1094]].forEach(([x1, y1, x2, y2]) => ink(ctx, [[x1, y1], [x2, y2]], 4))
}

// The tray on her lap, seen edge-on.
function trayOnLap(ctx) {
  shape(ctx, [[300, 1112, 's'], [604, 1112, 's'], [612, 1156, 's'], [292, 1156, 's']], C3.tray, K.ink, 7)
  ink(ctx, [[306, 1122], [598, 1122]], 4, C3.trayLip)
}

// ---------- the tray, in close-up ----------

// One maki roll: rice outside, a ring of nori inside, the filling in the middle.
function maki(ctx, x, y, r) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = C3.rice
  ctx.fill()
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 7
  ctx.stroke()
  ctx.save()
  ctx.strokeStyle = C3.nori
  ctx.lineWidth = 11
  ctx.beginPath()
  ctx.arc(x, y, r * 0.46, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
  ctx.beginPath()
  ctx.arc(x, y, r * 0.3, 0, Math.PI * 2)
  ctx.fillStyle = C3.fish
  ctx.fill()
  // grains of rice
  ctx.save()
  ctx.strokeStyle = '#c9cbcc'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ;[[-0.62, -0.5], [0.56, -0.42], [-0.6, 0.46], [0.5, 0.56]].forEach(([dx, dy]) => {
    ctx.beginPath()
    ctx.moveTo(x + dx * r, y + dy * r)
    ctx.lineTo(x + dx * r + 11, y + dy * r + 5)
    ctx.stroke()
  })
  ctx.restore()
}

// One nigiri: a mound of rice with a slice of pale fish laid over it.
function nigiri(ctx, x, y) {
  shape(ctx, [[x - 96, y + 6], [x + 96, y], [x + 106, y + 40], [x, y + 62], [x - 106, y + 42]], C3.rice, K.ink, 7)
  shape(
    ctx,
    [[x - 34, y - 32], [x + 52, y - 26], [x + 88, y - 4], [x + 74, y + 22], [x, y + 32], [x - 76, y + 20], [x - 88, y - 8]],
    C3.fish,
    K.ink,
    7,
  )
  // the darker line down the middle of the slice
  ctx.save()
  ctx.strokeStyle = C3.fishDark
  ctx.lineWidth = 6
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x - 80, y - 2)
  ctx.quadraticCurveTo(x, y - 22, x + 86, y - 4)
  ctx.stroke()
  ctx.restore()
}

// A little fish drawn in the corner of the label, the way the shop prints them.
function labelFish(ctx, x, y) {
  shape(ctx, [[x, y - 22], [x + 40, y], [x, y + 22], [x - 34, y]], '#ffffff', K.ink, 5)
  ink(ctx, [[x + 40, y - 2], [x + 68, y - 24], [x + 66, y + 22], [x + 40, y + 2]], 5)
  ctx.fillStyle = K.ink
  ctx.beginPath()
  ctx.arc(x - 16, y - 4, 4, 0, Math.PI * 2)
  ctx.fill()
  ;[[x - 4, y - 12, x - 4, y + 12], [x + 12, y - 14, x + 12, y + 14]].forEach(([x1, y1, x2, y2]) => ink(ctx, [[x1, y1], [x2, y2]], 4))
}

// The close-up panel under her: the open tray, emptying as she eats.
function sushiPanel(ctx, eaten, t) {
  const { x, y, w, h } = PANEL
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.fillStyle = C3.panelBg
  ctx.fillRect(x, y, w, h)
  // the black plastic tray
  shape(ctx, [[x + 56, y + 34, 's'], [x + 756, y + 34, 's'], [x + 736, y + 330, 's'], [x + 76, y + 330, 's']], C3.tray, K.ink, 8)
  shape(ctx, [[x + 84, y + 56, 's'], [x + 728, y + 56, 's'], [x + 712, y + 310, 's'], [x + 100, y + 310, 's']], '#1d2022', C3.trayLip, 5)
  PIECES.forEach((p, i) => {
    if (eaten.includes(i)) return
    if (p.kind === 'maki') maki(ctx, p.x, p.y, 62)
    else nigiri(ctx, p.x, p.y)
  })
  labelFish(ctx, x + 742, y + 44)
  ctx.restore()
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 9
  ctx.strokeRect(x, y, w, h)
  // a hint over the first piece, until she takes one
  if (eaten.length === 0 && t > 1.6) {
    const p = PIECES[0]
    tapHint(ctx, p.x, p.y, t, K.ink)
  }
}

// ---------- the bar ----------

// The same reply bar as the call, filling as the tray empties.
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
    ctx.fillStyle = C3.bar
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
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, h / 2)
  ctx.stroke()
}

// ---------- the page ----------

export default function couchSushi(api) {
  const eaten = []
  let biteAt = null
  let doneAt = null
  const top = () => sheetTop(api.height())
  const toSheet = (x, y) => [x / 0.6, y / 0.6 + top()]
  const chewing = (t) => biteAt !== null && t < biteAt + 0.45

  return {
    tall: true,
    debug: () => ({ eaten: eaten.length, done: doneAt !== null }),
    draw(ctx, t) {
      const h = api.height()
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, h)
      ctx.save()
      ctx.scale(0.6, 0.6)
      ctx.translate(0, -top())

      curtains(ctx)
      wallShadow(ctx)
      couch(ctx)
      hair(ctx)
      face(ctx)
      body(ctx, chewing(t))
      trayOnLap(ctx)

      bar(ctx, eaten.length / PIECES.length)
      sushiPanel(ctx, eaten, t)
      ctx.restore()

      // once the tray is empty there is nothing left to do but go to bed
      if (doneAt !== null && t > doneAt + 0.8) tapHint(ctx, 50, 50, t)
    },
    down(x, y, t) {
      if (doneAt !== null) {
        if (t > doneAt + 0.8) api.finish()
        return
      }
      const [sx, sy] = toSheet(x, y)
      const hit = PIECES.findIndex(
        (p, i) => !eaten.includes(i) && Math.hypot(p.x - sx, p.y - sy) < (p.kind === 'maki' ? 72 : 96),
      )
      if (hit < 0) return
      eaten.push(hit)
      biteAt = t
      pop(460 + eaten.length * 40)
      if (eaten.length >= PIECES.length) doneAt = t
    },
  }
}
