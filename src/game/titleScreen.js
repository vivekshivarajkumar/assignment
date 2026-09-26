import { W, H, UI_FONT, rng, easeOut } from './paint.js'
import { pop, pageTurn } from './sound.js'
import tokens from '../../tokens.json'


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
const TITLE_FONT = "'Gaegu', 'Patrick Hand', cursive"

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
      // points flagged sharp (third value true) become corners, e.g. hair tips
      if (pts[i][2] === true) {
        ctx.lineTo(pts[i][0], pts[i][1])
        ctx.lineTo(m[0], m[1])
      } else ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1])
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

// Hair outline at rest: [x, y, flow, 's' for a sharp tip]; flow 0 = roots (still),
// 1 = tips (move most).
// A bob that ends at the jaw, its back ends swept left by the breeze.
const HAIR_REST = [
  [478, 1190, 0.02], [494, 1128, 0.02], [480, 1060, 0], [424, 1004, 0], [332, 972, 0],
  [226, 974, 0], [130, 998, 0.05], [44, 1044, 0.15], [-24, 1106, 0.3], [-70, 1190, 0.5],
  [-96, 1300, 0.75], [-100, 1420, 0.95], [-70, 1510, 1],
  // chunky, pointed ends
  [-20, 1580, 1, 's'], [10, 1536, 1], [44, 1616, 1, 's'], [84, 1560, 1], [124, 1626, 0.95, 's'],
  [160, 1570, 0.85], [200, 1622, 0.75, 's'], [232, 1566, 0.6], [262, 1580, 0.5, 's'],
  [278, 1500, 0.3], [284, 1400, 0.15], [300, 1300, 0.08], [336, 1240, 0.05],
  [384, 1206, 0.03], [432, 1188, 0.02],
]

// Far-side hair, seen under the jaw behind the neck.
const LOCK_REST = [
  [318, 1468, 0.2], [418, 1474, 0.3], [440, 1506, 0.45], [428, 1560, 0.6], [414, 1616, 0.8, 's'],
  [390, 1568, 0.7], [360, 1620, 0.8, 's'], [336, 1572, 0.6], [306, 1548, 0.5],
]

// Dark strands: [root, bend, tip, width] of quadratic curves.
const STRANDS = [
  // fringe: short strokes falling to the brow
  [[462, 1080], [470, 1130], [472, 1176], 5],
  [[424, 1040], [436, 1100], [430, 1160], 6],
  [[380, 1030], [392, 1080], [384, 1130], 4],
  // crown sweeping back and down
  [[330, 1010], [300, 1110], [292, 1240], 6],
  [[280, 1040], [240, 1170], [236, 1330], 7],
  [[200, 1050], [130, 1170], [110, 1360], 6],
  [[140, 1090], [60, 1220], [30, 1420], 7],
  [[80, 1130], [0, 1250], [-40, 1400], 5],
  // ends
  [[250, 1380], [230, 1480], [210, 1570], 5],
  [[170, 1390], [140, 1500], [110, 1590], 6],
  [[80, 1400], [40, 1500], [0, 1550], 4],
  [[400, 1500], [410, 1540], [396, 1590], 4],
  [[30, 1450], [20, 1520], [44, 1600], 4],
  [[210, 1470], [196, 1540], [200, 1610], 4],
  [[120, 1480], [116, 1560], [124, 1616], 4],
]

function flow(x, y, w, t) {
  const dx = (Math.sin(t * 1.6 - y * 0.012) * 24 - 14) * w
  const dy = Math.cos(t * 1.2 + x * 0.02) * 10 * w
  return [x + dx, y + dy]
}

// how much a point at height y moves (roots at the crown stay put)
const flowAt = (x, y) => Math.max(0, Math.min(1, (y - 1100) / 450 + (260 - x) / 700))

const grain = (() => {
  const r = rng(17)
  return Array.from({ length: 900 }, () => [r() * 640 - 100, 950 + r() * 700, r(), r()])
})()

// Drawn on a 900 x 2000 phone sheet, anchored to the bottom of the screen.
function portrait(ctx, t, height) {
  ctx.save()
  ctx.translate(0, height - 1200 + Math.sin(t * 1.1) * 1.2)
  ctx.scale(0.6, 0.6)
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.strokeStyle = INK
  ctx.lineWidth = 6

  // far-side hair behind the neck
  ctx.fillStyle = HAIR
  smooth(ctx, LOCK_REST.map(([x, y, w, tip]) => [...flow(x, y, w, t), tip === 's']))
  ctx.fill()

  // face, neck and chest in one skin shape
  ctx.fillStyle = SKIN
  ctx.beginPath()
  ctx.moveTo(40, 1700)
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
  ctx.quadraticCurveTo(296, 1600, 300, 1700) // front of the neck
  ctx.quadraticCurveTo(304, 1760, 320, 1830) // down to the chest
  ctx.lineTo(40, 1830)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // V-neck T-shirt
  const shirt = () => {
    ctx.beginPath()
    ctx.moveTo(92, 1616) // where the neckline meets the shoulder
    ctx.quadraticCurveTo(200, 1700, 304, 1812) // down to the point of the V
    ctx.quadraticCurveTo(334, 1900, 364, 2060) // front of the body
    ctx.lineTo(-60, 2060)
    ctx.lineTo(-60, 1690)
    ctx.quadraticCurveTo(20, 1630, 92, 1616) // top of the shoulder
    ctx.closePath()
  }
  ctx.fillStyle = SHIRT
  shirt()
  ctx.fill()

  // upper arm below the short sleeve, and the shadow where it meets the body
  ctx.fillStyle = SKIN
  ctx.beginPath()
  ctx.moveTo(-60, 1916)
  ctx.quadraticCurveTo(80, 1912, 180, 1938)
  ctx.lineTo(186, 2060)
  ctx.lineTo(-60, 2060)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = INK
  ctx.beginPath()
  ctx.moveTo(170, 1936)
  ctx.quadraticCurveTo(196, 1940, 206, 1948)
  ctx.lineTo(212, 2060)
  ctx.lineTo(176, 2060)
  ctx.closePath()
  ctx.fill()

  // ink lines: shirt outline, sleeve hem, folds
  ctx.strokeStyle = INK
  ctx.lineWidth = 6
  shirt()
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(-60, 1914)
  ctx.quadraticCurveTo(80, 1908, 184, 1936)
  ctx.stroke()
  for (const s of [
    [[94, 1698], [82, 1702], [68, 1712]],
    [[169, 1737], [172, 1772], [174, 1808]],
    [[122, 1760], [108, 1792], [94, 1826]],
    [[51, 1779], [36, 1816], [23, 1854]],
    [[248, 1817], [244, 1834], [239, 1850]],
    [[220, 1845], [216, 1868], [211, 1891]],
  ]) brush(ctx, curve(...s, 8), 5)

  // hair: flat colour, crayon grain, soft broken edge
  const hair = HAIR_REST.map(([x, y, w, tip]) => [...flow(x, y, w, t), tip === 's'])
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
  // soft crayon edge: a slightly larger, fainter copy of the shape
  ctx.save()
  ctx.globalAlpha = 0.45
  ctx.strokeStyle = HAIR
  ctx.lineWidth = 5
  smooth(ctx, hair)
  ctx.stroke()
  ctx.restore()
  // dark strands following the wind
  for (const [p0, p1, p2, w] of STRANDS) {
    const pts = curve(p0, p1, p2, 16).map(([x, y]) => flow(x, y, flowAt(x, y), t))
    brush(ctx, pts, w * 1.5)
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
    // on a phone the screen is taller than H: the menu stays at the bottom and
    // the title sits about a sixth of the way down, as in a portrait layout
    const dy = () => api.height() - H
    const titleY = () => 135 + dy() * 0.3
    return {
      tall: true,
      draw(ctx, t) {
        ctx.fillStyle = BG
        ctx.fillRect(0, 0, W, api.height())
        portrait(ctx, t, api.height())
        const a = easeOut(t / 1.2)
        ctx.save()
        ctx.globalAlpha = a
        ctx.font = `300 190px ${TITLE_FONT}`
        ctx.fillStyle = INK
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('mira', W / 2, titleY())
        // how much Claude it took to build this game (tokens.json)
        ctx.globalAlpha = a * 0.8
        ctx.font = `22px ${UI_FONT}`
        ctx.fillText(`built with Claude · ${tokens.total.tokens.toLocaleString('en-US')} tokens`, W / 2, titleY() + 97)
        ctx.restore()
        for (const row of rows) {
          const isBig = row.key === big
          ctx.save()
          ctx.globalAlpha = a * (picked && picked !== row.key ? 0.4 : 1)
          ctx.font = isBig ? `700 44px ${UI_FONT}` : `700 30px ${UI_FONT}`
          ctx.fillStyle = INK
          ctx.textAlign = 'right'
          ctx.textBaseline = 'middle'
          ctx.fillText(row.label, W - 44, row.y + dy())
          ctx.restore()
        }
      },
      down(x, y, t) {
        if (t < 0.4 || picked || x < W / 2) return
        const row = rows.find((r) => Math.abs(y - r.y - dy()) < 28)
        if (!row) return
        picked = row.key
        // the menu pages turn like paper; starting the story is a plain tap
        if (['about', 'settings', 'chapters'].includes(row.key)) pageTurn()
        else pop(660)
        api.finish(row.key)
      },
    }
  }
}
