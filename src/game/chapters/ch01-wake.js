// Chapter 1, page 1 · 7:00
// Top-down view of Mira asleep, a torn label with her name, and a flip clock
// that turns to 7:00 and rings until it's tapped. Drawn on a 900 x 2000 phone
// sheet at 0.6 scale, in the cold grey-blue of her mornings. On a phone the whole
// sheet shows; on a shorter screen the top of the headboard is cropped.
import { W, UI_FONT, tapHint, rng, clamp, easeOut } from '../paint.js'
import { pop, tone } from '../sound.js'

const SANS = "'Montserrat', 'Helvetica Neue', Arial, sans-serif"

const K = {
  ink: '#141414',
  woodDark: '#5e6f80',
  woodLight: '#c3d2e1',
  woodGrain: '#44525f',
  woodGrainLight: '#95a8ba',
  sheet: '#485564',
  white: '#f1eff1',
  shade: '#7f8994',
  shadeDark: '#667787',
  grid: '#c5d4de',
  gridDark: '#55636f',
  hair: '#292121',
  hairLight: '#4a3d3d',
  clock: '#53a6ce',
  face: '#464746',
  cell: '#3a3a3a',
  digit: '#f4f4f4',
  tableTop: '#c4d5dc',
  tableFront: '#8b93a3',
  label: '#f2f0f2',
}

// Tapered ink stroke through points.
function ink(ctx, pts, width = 6, color = K.ink) {
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  for (let i = 0; i < pts.length - 1; i++) {
    const k = i / (pts.length - 1)
    ctx.lineWidth = width * Math.sin(Math.PI * (0.15 + 0.7 * k)) + 0.8
    ctx.beginPath()
    ctx.moveTo(pts[i][0], pts[i][1])
    ctx.lineTo(pts[i + 1][0], pts[i + 1][1])
    ctx.stroke()
  }
}

// Smooth closed shape through points; fills and/or strokes it in ink.
function shape(ctx, pts, fill, stroke = K.ink, width = 6) {
  const n = pts.length
  const mid = (i) => [(pts[i][0] + pts[(i + 1) % n][0]) / 2, (pts[i][1] + pts[(i + 1) % n][1]) / 2]
  ctx.beginPath()
  const m0 = mid(n - 1)
  ctx.moveTo(m0[0], m0[1])
  for (let i = 0; i < n; i++) {
    const m = mid(i)
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1])
  }
  ctx.closePath()
  if (fill) {
    ctx.fillStyle = fill
    ctx.fill()
  }
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = width
    ctx.lineJoin = 'round'
    ctx.stroke()
  }
}

// Quadrilateral with softly rounded corners (the pillow).
function pillowPath(ctx) {
  const n = PILLOW.length
  ctx.beginPath()
  const [ax, ay] = PILLOW[n - 1]
  const [bx, by] = PILLOW[0]
  ctx.moveTo((ax + bx) / 2, (ay + by) / 2)
  for (let i = 0; i < n; i++) {
    const [x1, y1] = PILLOW[i]
    const [x2, y2] = PILLOW[(i + 1) % n]
    ctx.arcTo(x1, y1, x2, y2, 46)
  }
  ctx.closePath()
}

// Fill `inner` only where it overlaps `outer` (e.g. shadow on the pillow).
// `outer` is a point list or a function that builds a path.
function shadeInside(ctx, outer, inner, color) {
  ctx.save()
  if (typeof outer === 'function') outer(ctx)
  else shape(ctx, outer, null, null)
  ctx.clip()
  shape(ctx, inner, color, null)
  ctx.restore()
}

const PILLOW = [[14, 470], [806, 366], [814, 868], [46, 898]]
// back and upper arm, out to the elbow
const BODY = [
  [180, 1080], [196, 920], [250, 860], [360, 820], [520, 796], [640, 790], [780, 786],
  [846, 820], [852, 890], [820, 914], [650, 906], [600, 1040],
]
// forearm up the side of the pillow to the wrist
const ARM = [
  [792, 870], [800, 740], [798, 620], [806, 590], [864, 592], [880, 640], [884, 780],
  [872, 880], [840, 904],
]
// hand gripping the pillow's top corner: palm, fingers curled over the edge
const HAND = [
  [804, 604], [790, 560], [782, 520], [784, 478], [798, 452], [826, 440], [856, 444],
  [880, 458], [894, 482], [892, 520], [878, 560], [866, 600],
]
// thumb along the inside of the pillow
const THUMB = [[792, 560], [770, 530], [764, 500], [774, 484], [790, 500], [800, 534]]
const HAIR = [
  [290, 560], [330, 500], [400, 462], [480, 452], [560, 470], [600, 492], [630, 510],
  [604, 526], [628, 548], [600, 556], [616, 582], [586, 590], [570, 610], [548, 660],
  [546, 720], [530, 780], [470, 800], [400, 790], [336, 760], [296, 700], [280, 630],
]
const FACE = [
  [540, 590], [590, 600], [612, 660], [612, 690], [626, 704], [606, 716], [600, 740], [560, 770], [520, 720],
]
const QUILT = [
  [-40, 1090], [80, 1060], [190, 1030], [330, 1004], [470, 990], [600, 968],
  [720, 990], [860, 1030], [960, 1060], [960, 1900], [-40, 1900],
]

function headboard(ctx) {
  const r = rng(101)
  ctx.fillStyle = K.woodDark
  ctx.fillRect(-40, 0, 1000, 420)
  // diagonal band of morning light
  ctx.fillStyle = K.woodLight
  ctx.beginPath()
  ctx.moveTo(-40, 170)
  ctx.lineTo(960, 360)
  ctx.lineTo(960, 420)
  ctx.lineTo(-40, 420)
  ctx.closePath()
  ctx.fill()
  // wood grain
  for (let i = 0; i < 70; i++) {
    const x = r() * 960 - 20
    const y = 70 + r() * 340
    const lit = y > 170 + ((x + 40) / 1000) * 190
    ctx.strokeStyle = lit ? K.woodGrainLight : K.woodGrain
    ctx.lineWidth = 2 + r() * 2
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + 40 + r() * 90, y + (r() - 0.5) * 4)
    ctx.stroke()
  }
}

function sleeper(ctx) {
  // pillow, with a grey dent around her head and the arm's shadow
  pillowPath(ctx)
  ctx.fillStyle = K.white
  ctx.fill()
  shadeInside(ctx, pillowPath, [[250, 520], [420, 450], [620, 470], [700, 600], [690, 760], [520, 830], [300, 810], [200, 700]], K.shade)
  shadeInside(ctx, pillowPath, [[700, 640], [800, 600], [820, 900], [660, 900]], K.shade)
  pillowPath(ctx)
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 7
  ctx.lineJoin = 'round'
  ctx.stroke()

  // her back and upper arm; the far side is in shade under the raised arm
  shape(ctx, BODY, K.white)
  shadeInside(ctx, BODY, [[560, 830], [790, 800], [860, 930], [610, 1080], [540, 900]], K.shade)
  shape(ctx, BODY, null)
  // forearm, hand and thumb gripping the pillow's corner
  shape(ctx, ARM, K.white)
  shadeInside(ctx, ARM, [[780, 620], [814, 620], [818, 900], [780, 900]], K.shade)
  shape(ctx, ARM, null)
  shape(ctx, HAND, K.white)
  shadeInside(ctx, HAND, [[860, 520], [900, 500], [900, 610], [860, 610]], K.shade)
  shape(ctx, HAND, null)
  // knuckle creases and the gaps between fingers
  for (const s of [
    [[818, 444], [822, 470], [818, 492]],
    [[846, 446], [852, 474], [850, 498]],
    [[872, 456], [876, 482], [874, 504]],
    [[808, 520], [834, 516], [860, 522]],
  ]) ink(ctx, s, 5)
  shape(ctx, THUMB, K.white)
  // vest straps
  for (const [x1, y1, x2, y2] of [[300, 836, 322, 1010], [506, 800, 500, 990]]) {
    ctx.lineCap = 'round'
    ctx.strokeStyle = K.ink
    ctx.lineWidth = 20
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
    ctx.strokeStyle = K.grid
    ctx.lineWidth = 11
    ctx.stroke()
  }
  for (const s of [[[240, 950], [256, 990], [266, 1010]], [[440, 960], [452, 990], [460, 1010]]]) ink(ctx, s, 4)

  // face turned to the right, eyes closed; hair spread on the pillow
  shape(ctx, FACE, K.white)
  ink(ctx, [[560, 660], [574, 668], [588, 664]], 5)
  shape(ctx, HAIR, K.hair, null)
  for (const s of [
    [[400, 520], [420, 600], [410, 700]],
    [[470, 500], [500, 600], [480, 760]],
    [[340, 600], [350, 680]],
    [[540, 520], [560, 560]],
  ]) ink(ctx, s, 3, K.hairLight)
  // pillow creases radiating from her head
  for (const s of [
    [[236, 540], [264, 560], [290, 580]], [[196, 578], [240, 592], [282, 606]],
    [[120, 632], [200, 636], [276, 642]], [[210, 700], [244, 694], [282, 688]],
    [[190, 772], [232, 750], [280, 728]], [[240, 800], [266, 776], [300, 752]],
    [[620, 600], [650, 594], [680, 590]], [[626, 690], [660, 690], [696, 688]],
    [[610, 740], [640, 752], [676, 760]],
  ]) ink(ctx, s, 5)
}

function plaid(ctx, base, line) {
  ctx.fillStyle = base
  ctx.fillRect(-40, 900, 1000, 1000)
  ctx.strokeStyle = line
  ctx.lineWidth = 16
  for (let x = -20; x < 960; x += 112) {
    ctx.beginPath()
    ctx.moveTo(x, 960)
    ctx.quadraticCurveTo(x + 18, 1300, x - 6, 1900)
    ctx.stroke()
  }
  for (let y = 1020; y < 1900; y += 96) {
    ctx.beginPath()
    ctx.moveTo(-40, y + 10)
    ctx.quadraticCurveTo(460, y - 20, 960, y + 14)
    ctx.stroke()
  }
}

function quilt(ctx) {
  ctx.save()
  shape(ctx, QUILT, null, null)
  ctx.clip()
  plaid(ctx, K.white, K.grid)
  // the right side of the quilt is in shadow
  ctx.beginPath()
  ctx.moveTo(590, 960)
  ctx.quadraticCurveTo(640, 1150, 700, 1400)
  ctx.lineTo(760, 1900)
  ctx.lineTo(960, 1900)
  ctx.lineTo(960, 960)
  ctx.closePath()
  ctx.clip()
  plaid(ctx, K.shadeDark, K.gridDark)
  ctx.restore()
  shape(ctx, QUILT, null)
  for (const s of [[[700, 1080], [760, 1110], [800, 1150]], [[730, 1180], [770, 1200], [800, 1240]]]) ink(ctx, s, 4)
}

// The bedroom picture ends in a torn edge below the name label; white below.
function tornBottom(ctx) {
  const r = rng(151)
  ctx.beginPath()
  ctx.moveTo(-40, 0)
  ctx.lineTo(960, 0)
  for (let x = 960; x >= -40; x -= 18) {
    const base = 1455 + ((x + 40) / 1000) * 110 // lower on the right
    ctx.lineTo(x, base + (r() - 0.5) * 22)
  }
  ctx.closePath()
}

function bedScene(ctx, t, ringing) {
  ctx.save()
  tornBottom(ctx)
  ctx.clip()
  headboard(ctx)
  // mattress under everything
  ctx.fillStyle = K.sheet
  ctx.fillRect(-40, 420, 1000, 1500)
  ink(ctx, [[-40, 420], [960, 420]], 7)
  for (const s of [[[-10, 920], [60, 900], [120, 890]], [[780, 900], [860, 890], [920, 910]]]) ink(ctx, s, 4)
  sleeper(ctx)
  quilt(ctx)
  ctx.restore()

  // she stirs while the alarm rings
  if (ringing) {
    const k = (t * 2) % 1
    ctx.strokeStyle = K.ink
    ctx.lineWidth = 5
    ctx.globalAlpha = 1 - k
    for (const [x, y, a] of [[640, 500, -0.6], [670, 540, -0.2], [660, 590, 0.2]]) {
      ctx.beginPath()
      ctx.moveTo(x + Math.cos(a) * (10 + k * 10), y + Math.sin(a) * (10 + k * 10))
      ctx.lineTo(x + Math.cos(a) * (34 + k * 10), y + Math.sin(a) * (34 + k * 10))
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }
}

// Torn paper label with her name and age.
function nameLabel(ctx, alpha) {
  const r = rng(131)
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = K.label
  ctx.beginPath()
  ctx.moveTo(170, 1132)
  for (let x = 170; x <= 730; x += 20) ctx.lineTo(x, 1128 + r() * 8)
  for (let y = 1130; y <= 1296; y += 16) ctx.lineTo(728 + r() * 8, y)
  for (let x = 730; x >= 170; x -= 20) ctx.lineTo(x, 1292 + r() * 8)
  for (let y = 1296; y >= 1130; y -= 16) ctx.lineTo(166 + r() * 8, y)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = K.ink
  ctx.font = `700 50px ${UI_FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('Mira Sen', 450, 1178)
  ctx.fillText('25 years old', 450, 1250)
  ctx.restore()
}

// Flip clock with four split-flap cells (the first one blank).
// `flip` runs 0..1 while the minute changes; the changing cells fold over.
function flipClock(ctx, digits, flip, ringing, t) {
  ctx.save()
  if (ringing) ctx.translate(Math.sin(t * 70) * 5, 0)
  ctx.lineJoin = 'round'
  ctx.fillStyle = K.ink
  for (const x of [212, 636]) {
    ctx.beginPath()
    ctx.ellipse(x, 1672, 22, 10, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  // body, top edge and snooze bar
  ctx.fillStyle = K.clock
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.roundRect(158, 1440, 536, 228, 26)
  ctx.fill()
  ctx.stroke()
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(186, 1484)
  ctx.lineTo(666, 1484)
  ctx.stroke()
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.roundRect(340, 1448, 190, 32, 6)
  ctx.fill()
  ctx.stroke()
  // display
  ctx.fillStyle = K.face
  ctx.beginPath()
  ctx.roundRect(188, 1500, 334, 132, 14)
  ctx.fill()
  ctx.stroke()
  const cells = [200, 276, 372, 446]
  cells.forEach((x, i) => {
    ctx.fillStyle = K.cell
    ctx.strokeStyle = K.ink
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.roundRect(x, 1512, 64, 108, 6)
    ctx.fill()
    ctx.stroke()
    if (digits[i] !== ' ') {
      const changing = flip > 0 && flip < 1 && i > 0
      ctx.save()
      ctx.translate(x + 32, 1566)
      if (changing) ctx.scale(1, Math.abs(Math.cos(flip * Math.PI)))
      ctx.fillStyle = K.digit
      ctx.font = `600 92px ${SANS}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(digits[i], 0, 4)
      ctx.restore()
    }
    // the split in each flap
    ctx.strokeStyle = '#1c1c1c'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x + 2, 1566)
    ctx.lineTo(x + 62, 1566)
    ctx.stroke()
  })
  ctx.fillStyle = K.digit
  for (const y of [1550, 1582]) {
    ctx.beginPath()
    ctx.arc(356, y, 5, 0, Math.PI * 2)
    ctx.fill()
  }
  // speaker grille
  ctx.save()
  ctx.beginPath()
  ctx.arc(598, 1566, 56, 0, Math.PI * 2)
  ctx.clip()
  ctx.fillStyle = K.ink
  for (let y = 1508; y < 1626; y += 12) {
    for (let x = 540 + ((y / 12) % 2) * 6; x < 660; x += 12) {
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
  ctx.restore()

  if (ringing) {
    const k = (t * 3) % 1
    ctx.strokeStyle = K.ink
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    ctx.globalAlpha = 1 - k
    for (const d of [-1, 1]) {
      const cx = d < 0 ? 146 : 706
      for (const a of [-0.5, 0, 0.5]) {
        const r1 = 14 + k * 14
        const r2 = 44 + k * 14
        ctx.beginPath()
        ctx.moveTo(cx + d * r1 * Math.cos(a), 1540 + r1 * Math.sin(a) * 2.4)
        ctx.lineTo(cx + d * r2 * Math.cos(a), 1540 + r2 * Math.sin(a) * 2.4)
        ctx.stroke()
      }
    }
    ctx.globalAlpha = 1
  }
}

function clockPanel(ctx, alpha, digits, flip, ringing, t) {
  const r = rng(141)
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.save()
  ctx.beginPath()
  ctx.rect(32, 1312, 804, 452)
  ctx.clip()
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(32, 1312, 804, 452)
  // bedside table
  ctx.fillStyle = K.tableTop
  ctx.fillRect(32, 1556, 804, 176)
  ctx.fillStyle = K.tableFront
  ctx.fillRect(32, 1732, 804, 32)
  ink(ctx, [[32, 1556], [836, 1556]], 6)
  ink(ctx, [[32, 1732], [836, 1732]], 6)
  for (let i = 0; i < 18; i++) {
    const x = 50 + r() * 760
    const y = 1590 + r() * 130
    ink(ctx, [[x, y], [x + 20 + r() * 40, y + 1]], 3)
  }
  flipClock(ctx, digits, flip, ringing, t)
  ctx.restore()
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 8
  ctx.strokeRect(32, 1312, 804, 452)
  ctx.restore()
}

// Sheet rows 58..2000 are a phone screen; show from the top when there is room,
// otherwise crop the headboard so the clock panel (to row 1790) stays in view.
const sheetTop = (height) => Math.max(58, 1790 - height / 0.6)

export default function wakeUp(api) {
  const FLIP_AT = 1.6
  let stoppedAt = null
  let lastBeep = 0
  const toScreen = (y) => (y - sheetTop(api.height())) * 0.6
  return {
    tall: true,
    // test hook: where to tap to stop the alarm
    debug: () => ({ tap: [W / 2, toScreen(1560)] }),
    draw(ctx, t) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, api.height())
      const flip = clamp((t - FLIP_AT) / 0.35, 0, 1)
      const digits = flip < 0.5 ? ' 659' : ' 700'
      const ringing = flip >= 1 && stoppedAt === null
      if (ringing && t - lastBeep > 0.45) {
        lastBeep = t
        tone(1320, 0.14, { type: 'square', gain: 0.03 })
      }
      ctx.save()
      ctx.scale(0.6, 0.6)
      ctx.translate(0, -sheetTop(api.height()))
      bedScene(ctx, t, ringing)
      clockPanel(ctx, easeOut((t - 0.5) / 0.6), digits, flip, ringing, t)
      nameLabel(ctx, easeOut((t - 0.9) / 0.6))
      ctx.restore()
      if (ringing && t > FLIP_AT + 2.5) tapHint(ctx, W / 2, toScreen(1400), t, K.ink)
      if (stoppedAt !== null) tapHint(ctx, 50, 50, t)
    },
    down(x, y, t) {
      if (stoppedAt !== null) {
        if (t - stoppedAt > 0.5) api.finish()
        return
      }
      if (t > FLIP_AT + 0.4 && y > toScreen(1312) && y < toScreen(1764)) {
        stoppedAt = t
        pop(300)
      }
    },
  }
}
