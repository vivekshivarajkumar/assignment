import { W, FONT, paper, text, rng, easeOut } from './paint.js'
import { pop } from './sound.js'


// ---------- portrait ----------
// Big profile of Mira facing right, hair blowing back in a breeze: flat colour,
// crayon-grain hair with soft edges, and a navy ink line on skin and shirt.
// Geometry is authored on a 900 x 2000 portrait sheet anchored to the bottom
// of the screen (x * 0.6, y * 0.6 - 240), so it keeps the same proportions.

const BG = '#fff302'
const INK = '#090a46'
const SKIN = '#ffd9be'
const EAR = '#f4b28f'
const HAIR = '#455271'
const HAIR_LIGHT = '#566384'
const HAIR_DARK = '#34405f'
const SHIRT = '#dededb'

// Smooth closed curve through points (quadratic curves through midpoints).
function smooth(ctx, pts, closed = true) {
  const n = pts.length
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  ctx.beginPath()
  if (closed) {
    const m0 = mid(pts[n - 1], pts[0])
    ctx.moveTo(m0[0], m0[1])
    for (let i = 0; i < n; i++) {
      const m = mid(pts[i], pts[(i + 1) % n])
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1])
    }
    ctx.closePath()
  } else {
    ctx.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < n - 1; i++) {
      const m = mid(pts[i], pts[i + 1])
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1])
    }
    ctx.lineTo(pts[n - 1][0], pts[n - 1][1])
  }
}

// Ink stroke that tapers at both ends, like a brush pen.
function brush(ctx, pts, width, color = INK) {
  ctx.fillStyle = color
  for (let i = 0; i < pts.length - 1; i++) {
    const k = i / (pts.length - 1)
    const w = width * Math.sin(Math.PI * (0.12 + 0.76 * k)) + 0.6
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[i + 1]
    ctx.lineWidth = w
    ctx.strokeStyle = color
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }
}

// Sample a quadratic bezier into points (for tapered strokes).
function curve(p0, p1, p2, n = 12) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n
    const a = (1 - t) * (1 - t)
    const b = 2 * (1 - t) * t
    const c = t * t
    return [a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]]
  })
}

// Hair outline at rest: [x, y, flow]; flow 0 = roots (still), 1 = tips (move most).
const HAIR_REST = [
  [478, 1190, 0.02], [494, 1128, 0.02], [480, 1060, 0], [424, 1004, 0], [332, 974, 0],
  [232, 976, 0], [140, 1008, 0.05], [70, 1058, 0.15], [18, 1124, 0.3], [-24, 1210, 0.5],
  [-48, 1330, 0.7], [-60, 1470, 0.85], [-48, 1610, 1], [-20, 1730, 1], [30, 1700, 1],
  [70, 1760, 1], [118, 1702, 0.9], [160, 1716, 0.9], [186, 1640, 0.7], [214, 1566, 0.5],
  [244, 1500, 0.35], [262, 1430, 0.25], [274, 1360, 0.15], [294, 1292, 0.08],
  [332, 1238, 0.05], [382, 1204, 0.03], [432, 1186, 0.02],
]

// Dark strands: control points of quadratic curves [root, bend, tip] with a flow per point.
const STRANDS = [
  // fringe: short strokes falling to the brow
  [[462, 1080], [470, 1130], [472, 1176], 5],
  [[424, 1040], [436, 1100], [430, 1160], 6],
  [[380, 1030], [392, 1080], [384, 1130], 4],
  // crown sweeping down the back
  [[330, 1010], [300, 1100], [296, 1230], 6],
  [[280, 1040], [236, 1160], [240, 1330], 7],
  [[196, 1050], [140, 1180], [150, 1400], 6],
  [[136, 1100], [70, 1260], [80, 1520], 7],
  [[70, 1150], [10, 1300], [10, 1560], 5],
  // loose lower strands
  [[230, 1330], [206, 1440], [212, 1560], 5],
  [[120, 1420], [90, 1540], [60, 1700], 6],
  [[30, 1400], [-10, 1520], [0, 1640], 4],
]

function flow(x, y, w, t) {
  const dx = (Math.sin(t * 1.6 - y * 0.012) * 26 - 10) * w
  const dy = Math.cos(t * 1.2 + x * 0.02) * 10 * w
  return [x + dx, y + dy]
}

// how much a point at height y moves (roots at the crown stay put)
const flowAt = (x, y) => Math.max(0, Math.min(1, (y - 1080) / 560 + (260 - x) / 900))

const grain = (() => {
  const r = rng(17)
  return Array.from({ length: 900 }, () => [r() * 700 - 80, 950 + r() * 820, r(), r()])
})()

function portrait(ctx, t) {
  ctx.save()
  ctx.translate(0, -240 + Math.sin(t * 1.1) * 1.2)
  ctx.scale(0.6, 0.6)
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.strokeStyle = INK
  ctx.lineWidth = 6

  // shirt
  ctx.fillStyle = SHIRT
  smooth(ctx, [
    [-60, 1700], [20, 1664], [70, 1636], [120, 1632], [200, 1676], [296, 1694],
    [332, 1780], [356, 1900], [370, 2060], [-60, 2060],
  ])
  ctx.fill()
  ctx.stroke()
  for (const s of [
    [[70, 1760], [60, 1800], [52, 1840]],
    [[120, 1790], [112, 1820], [106, 1850]],
    [[240, 1850], [244, 1890], [250, 1930]],
    [[168, 1940], [180, 1970], [190, 2010]],
  ]) brush(ctx, curve(...s), 5)

  // neck and face
  ctx.fillStyle = SKIN
  ctx.beginPath()
  ctx.moveTo(110, 1640)
  ctx.lineTo(150, 1400)
  ctx.lineTo(220, 1120)
  ctx.bezierCurveTo(300, 1040, 440, 1050, 470, 1150)
  ctx.quadraticCurveTo(488, 1200, 492, 1238) // brow to eye level
  ctx.quadraticCurveTo(500, 1262, 522, 1276) // bridge of the nose
  ctx.quadraticCurveTo(546, 1292, 530, 1304) // tip of the nose
  ctx.quadraticCurveTo(516, 1312, 504, 1314)
  ctx.quadraticCurveTo(512, 1330, 506, 1342) // upper lip
  ctx.quadraticCurveTo(500, 1350, 504, 1358)
  ctx.quadraticCurveTo(510, 1372, 502, 1384) // lower lip
  ctx.quadraticCurveTo(498, 1410, 502, 1428) // chin
  ctx.quadraticCurveTo(500, 1462, 450, 1470) // jaw
  ctx.quadraticCurveTo(380, 1478, 330, 1520) // under the jaw
  ctx.quadraticCurveTo(300, 1580, 298, 1692) // front of the neck
  ctx.quadraticCurveTo(200, 1676, 110, 1640)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  // redraw the collar line over the neck
  ctx.fillStyle = SHIRT
  ctx.beginPath()
  ctx.moveTo(90, 1634)
  ctx.quadraticCurveTo(200, 1690, 298, 1694)
  ctx.lineTo(300, 1760)
  ctx.lineTo(80, 1760)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(96, 1636)
  ctx.quadraticCurveTo(200, 1690, 298, 1694)
  ctx.stroke()

  // hair: flat colour, crayon grain, soft broken edge
  const hair = HAIR_REST.map(([x, y, w]) => flow(x, y, w, t))
  ctx.save()
  smooth(ctx, hair)
  ctx.fillStyle = HAIR
  ctx.fill()
  ctx.clip()
  for (const [gx, gy, a, b] of grain) {
    const [x, y] = flow(gx, gy, flowAt(gx, gy), t)
    ctx.strokeStyle = a < 0.5 ? HAIR_LIGHT : HAIR_DARK
    ctx.globalAlpha = 0.35
    ctx.lineWidth = 2 + b * 3
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x - 6 - b * 10, y + 14 + a * 20)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  ctx.restore()
  // fuzzy edge: dabs of hair colour along the outline
  const er = rng(23)
  ctx.fillStyle = HAIR
  for (let i = 0; i < hair.length; i++) {
    const [x1, y1] = hair[i]
    const [x2, y2] = hair[(i + 1) % hair.length]
    for (let k = 0; k < 1; k += 0.08) {
      const x = x1 + (x2 - x1) * k + (er() - 0.5) * 5
      const y = y1 + (y2 - y1) * k + (er() - 0.5) * 5
      ctx.beginPath()
      ctx.arc(x, y, 2 + er() * 2.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  // dark strands following the wind
  for (const [p0, p1, p2, w] of STRANDS) {
    const pts = curve(p0, p1, p2, 16).map(([x, y]) => flow(x, y, flowAt(x, y), t))
    brush(ctx, pts, w)
  }

  // ear peeking out of the hair
  ctx.fillStyle = SKIN
  ctx.strokeStyle = INK
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.ellipse(226, 1276, 26, 40, 0.15, -Math.PI / 2, Math.PI / 2, true)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = EAR
  ctx.beginPath()
  ctx.ellipse(218, 1282, 10, 18, 0.15, 0, Math.PI * 2)
  ctx.fill()

  // eye (blinks now and then) and a small smile
  if (t % 4.6 < 0.14) brush(ctx, curve([438, 1232], [452, 1238], [466, 1232], 6), 7)
  else brush(ctx, curve([450, 1208], [453, 1228], [451, 1248], 6), 10)
  brush(ctx, curve([462, 1346], [484, 1360], [508, 1350], 8), 6)
  ctx.restore()
}

// Title screen with its menu. Finishes with the item the player tapped:
// 'about' | 'settings' | 'chapters' | 'continue' | 'new'.
export default function titleScreen(hasSave) {
  const items = hasSave
    ? [['about', 'About'], ['settings', 'Settings'], ['chapters', 'Chapters'], ['continue', 'Continue'], ['new', 'New Game']]
    : [['about', 'About'], ['settings', 'Settings'], ['new', 'Start']]
  const big = hasSave ? 'continue' : 'new'
  const rows = items.map(([key, label], i) => ({
    key,
    label,
    y: 881 - (items.length - 1 - i) * (hasSave ? 54 : 68),
  }))

  return (api) => {
    let picked = null
    return {
      draw(ctx, t) {
        paper(ctx, BG)
        portrait(ctx, t)
        const a = easeOut(t / 1.2)
        text(ctx, 'mira', W / 2, 170, { size: 190, color: INK, alpha: a })
        for (const row of rows) {
          const isBig = row.key === big
          ctx.save()
          ctx.globalAlpha = a * (picked && picked !== row.key ? 0.4 : 1)
          ctx.font = `${isBig ? 50 : 36}px ${FONT}`
          ctx.fillStyle = INK
          ctx.textAlign = 'right'
          ctx.textBaseline = 'middle'
          ctx.fillText(row.label, W - 44, row.y)
          if (isBig) {
            // a touch heavier, like a bold weight
            ctx.strokeStyle = INK
            ctx.lineWidth = 1.4
            ctx.strokeText(row.label, W - 44, row.y)
          }
          ctx.restore()
        }
      },
      down(x, y, t) {
        if (t < 0.4 || picked || x < W / 2) return
        const row = rows.find((r) => Math.abs(y - r.y) < 28)
        if (!row) return
        picked = row.key
        pop(660)
        api.finish(row.key)
      },
    }
  }
}
