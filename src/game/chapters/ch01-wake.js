// Chapter 1, page 1 · 7:00
// Top-down view of Mira asleep, a torn label with her name, and a flip clock
// that turns to 7:00 and rings until it's tapped. Drawn on a 900 x 2000 phone
// sheet at 0.6 scale, in the cold grey-blue of her mornings. On a phone the whole
// sheet shows; on a shorter screen the top of the headboard is cropped.
import { W, UI_FONT, tapHint, rng, clamp, easeOut, easeInOut } from '../paint.js'
import { pop, tone } from '../sound.js'

const SANS = "'Montserrat', 'Helvetica Neue', Arial, sans-serif"

export const K = {
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
  hairDark: '#161111',
  clock: '#53a6ce',
  face: '#464746',
  cell: '#3a3a3a',
  digit: '#f4f4f4',
  tableTop: '#c4d5dc',
  tableFront: '#8b93a3',
  label: '#f2f0f2',
}

// Tapered ink stroke through points.
export function ink(ctx, pts, width = 6, color = K.ink) {
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

// Smooth open ink line through points.
function line(ctx, pts, width = 6) {
  ctx.strokeStyle = K.ink
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2
    const my = (pts[i][1] + pts[i + 1][1]) / 2
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my)
  }
  const last = pts[pts.length - 1]
  ctx.lineTo(last[0], last[1])
  ctx.stroke()
}

// Smooth closed shape through points ([x, y] or [x, y, 's'] for a sharp corner);
// fills and/or strokes it in ink.
export function shape(ctx, pts, fill, stroke = K.ink, width = 6) {
  const n = pts.length
  const mid = (i) => [(pts[i][0] + pts[(i + 1) % n][0]) / 2, (pts[i][1] + pts[(i + 1) % n][1]) / 2]
  ctx.beginPath()
  const m0 = mid(n - 1)
  ctx.moveTo(m0[0], m0[1])
  for (let i = 0; i < n; i++) {
    const m = mid(i)
    // points marked 's' are sharp corners, e.g. the tips of locks of hair
    if (pts[i][2] === 's') {
      ctx.lineTo(pts[i][0], pts[i][1])
      ctx.lineTo(m[0], m[1])
    } else ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1])
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
export function shadeInside(ctx, outer, inner, color) {
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
// Back of her head seen from above: a dark bob ending in pointed locks, the
// fringe falling to the right in spiky tufts. Traced from the reference.
const HAIR = [
  [331, 494], [387, 462], [474, 449], [524, 456], [562, 479], [599, 491, 's'],
  [584, 501], [624, 519, 's'], [599, 529], [618, 554, 's'], [599, 560], [609, 600, 's'],
  [587, 588], [574, 607, 's'], [556, 576], [537, 566], [532, 607], [542, 669],
  [562, 719], [577, 757], [549, 769], [518, 785, 's'], [499, 789], [481, 802, 's'],
  [456, 787], [431, 797, 's'], [406, 788], [378, 802, 's'], [349, 778], [318, 786, 's'],
  [306, 769], [280, 719], [266, 657], [274, 594], [298, 536],
]
// darker, messier fringe
const FRINGE = [
  [520, 462], [562, 479], [599, 491, 's'], [584, 501], [624, 519, 's'], [599, 529],
  [618, 554, 's'], [596, 548], [572, 520], [546, 492],
]
// the sliver of face between her hair and the pillow: forehead, nose, lips, chin
const FACE = [
  [534, 566], [574, 592], [590, 630], [594, 662], [620, 689, 's'], [597, 699], [600, 710],
  [590, 734], [578, 760], [552, 772], [548, 700], [540, 620],
]
// profile from forehead to chin, in two strokes that meet at the tip of the nose
const PROFILE_UPPER = [[580, 607], [590, 638], [593, 660], [620, 689]]
const PROFILE_LOWER = [[620, 689], [597, 699], [600, 710], [588, 731], [578, 757], [590, 766], [689, 769]]
const QUILT = [
  [-40, 1090], [80, 1060], [190, 1030], [330, 1004], [470, 990], [600, 968],
  [720, 990], [860, 1030], [960, 1052], [1016, 1080], [1042, 1140], [1048, 1400], [1046, 1900], [-40, 1900],
]

function headboard(ctx) {
  const r = rng(101)
  ctx.fillStyle = K.woodDark
  ctx.fillRect(-40, 0, 1046, 420)
  // diagonal band of morning light
  ctx.fillStyle = K.woodLight
  ctx.beginPath()
  ctx.moveTo(-40, 170)
  ctx.lineTo(1006, 369)
  ctx.lineTo(1006, 420)
  ctx.lineTo(-40, 420)
  ctx.closePath()
  ctx.fill()
  // wood grain
  for (let i = 0; i < 70; i++) {
    const x = r() * 1000 - 20
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
  shadeInside(ctx, pillowPath, [[205, 500], [300, 478], [574, 494], [640, 470], [690, 480], [694, 620], [690, 760], [600, 772], [520, 808], [290, 808], [205, 760]], K.shade)
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

  // face turned to the right, cheek on the pillow, eye closed
  shape(ctx, FACE, K.white, null)
  line(ctx, PROFILE_UPPER, 6)
  line(ctx, PROFILE_LOWER, 6)
  ink(ctx, [[547, 640], [552, 649], [561, 654], [571, 655]], 5)
  // hair, with darker fringe tufts and ink strands following the locks
  shape(ctx, HAIR, K.hair, null)
  // crayon grain inside the hair
  ctx.save()
  shape(ctx, HAIR, null, null)
  ctx.clip()
  const g = rng(161)
  ctx.strokeStyle = '#3a2f2f'
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.5
  for (let i = 0; i < 160; i++) {
    const x = 270 + g() * 360
    const y = 450 + g() * 350
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + 2 + g() * 4, y + 8 + g() * 14)
    ctx.stroke()
  }
  ctx.restore()
  shape(ctx, HAIR, null, K.ink, 4.5)
  shape(ctx, FRINGE, K.hairDark, null)
  // each lock at the bottom ends in a curved stroke to its tip
  for (const [x, y] of [[318, 786], [378, 802], [431, 797], [481, 802], [518, 785]]) {
    ink(ctx, [[x - 14, y - 70], [x - 8, y - 34], [x, y]], 4.5)
  }
  // strands curving down from the crown, following the round of the head
  for (const s of [
    [[400, 478], [330, 550], [304, 660]],
    [[432, 482], [370, 560], [350, 690]],
    [[462, 490], [424, 590], [420, 720]],
    [[488, 500], [480, 620], [470, 770]],
    [[512, 520], [526, 640], [520, 760]],
    [[340, 700], [346, 740], [356, 775]],
    [[406, 700], [431, 750], [440, 794]],
  ]) ink(ctx, s, 4.5)
  // messy fringe: strands sweeping right and out past the edge
  for (const s of [
    [[470, 470], [540, 476], [600, 500], [646, 514]],
    [[496, 488], [560, 498], [618, 528], [654, 546]],
    [[518, 510], [576, 536], [626, 574]],
    [[536, 530], [586, 560], [612, 600]],
    [[524, 554], [536, 582], [549, 607]],
  ]) ink(ctx, s, 4.5)
  // long loose strands following the left side of the head
  ink(ctx, [[322, 498], [288, 548], [270, 616], [272, 690], [294, 760]], 3.5)
  ink(ctx, [[344, 480], [304, 524], [282, 580]], 3)
  ink(ctx, [[262, 640], [258, 700], [276, 752]], 3)
  // pillow creases around her head
  for (const s of [
    [[237, 529], [260, 535], [284, 541]], [[225, 579], [250, 587], [275, 594]],
    [[231, 625], [250, 620], [268, 616]], [[231, 707], [255, 700], [278, 694]],
    [[243, 744], [265, 738], [287, 732]], [[120, 632], [180, 636], [240, 640]],
    [[609, 650], [645, 623], [680, 597]], [[618, 694], [654, 691], [689, 688]],
    [[624, 738], [652, 742], [680, 747]],
  ]) ink(ctx, s, 5)
}

function plaid(ctx, base, line) {
  ctx.fillStyle = base
  ctx.fillRect(-40, 900, 1110, 1000)
  ctx.strokeStyle = line
  ctx.lineWidth = 16
  for (let x = -20; x < 1070; x += 112) {
    ctx.beginPath()
    ctx.moveTo(x, 960)
    ctx.quadraticCurveTo(x + 18, 1300, x - 6, 1900)
    ctx.stroke()
  }
  for (let y = 1020; y < 1900; y += 96) {
    ctx.beginPath()
    ctx.moveTo(-40, y + 10)
    ctx.quadraticCurveTo(500, y - 20, 1070, y + 14)
    ctx.stroke()
  }
}

function quilt(ctx, pts = QUILT) {
  ctx.save()
  shape(ctx, pts, null, null)
  ctx.clip()
  plaid(ctx, K.white, K.grid)
  // the right side of the quilt is in shadow
  ctx.beginPath()
  ctx.moveTo(590, 960)
  ctx.quadraticCurveTo(640, 1150, 700, 1400)
  ctx.lineTo(760, 1900)
  ctx.lineTo(1070, 1900)
  ctx.lineTo(960, 960)
  ctx.closePath()
  ctx.clip()
  plaid(ctx, K.shadeDark, K.gridDark)
  ctx.restore()
  shape(ctx, pts, null)
  for (const s of [[[700, 1080], [760, 1110], [800, 1150]], [[730, 1180], [770, 1200], [800, 1240]]]) ink(ctx, s, 4)
}

// The bedroom picture ends in a torn edge below the name label; white below.
function tornBottom(ctx) {
  const r = rng(151)
  ctx.beginPath()
  ctx.moveTo(-40, 0)
  ctx.lineTo(1070, 0)
  for (let x = 1070; x >= -40; x -= 18) {
    const base = 1455 + ((x + 40) / 1000) * 110 // lower on the right
    ctx.lineTo(x, base + (r() - 0.5) * 22)
  }
  ctx.closePath()
}

// ---------- after the snooze: on her back, hand to her forehead ----------
// Traced from the reference over a coordinate grid, on the same 900 x 2000 sheet.

const PILLOW2 = [[10, 488], [816, 345], [836, 790], [90, 905]]
const QUILT2 = [
  [-40, 1088], [100, 1062], [250, 1030], [430, 966], [560, 936], [640, 956], [760, 996],
  [899, 1030], [960, 1052], [1016, 1080], [1042, 1140], [1048, 1400], [1046, 1900], [-40, 1900],
]
const AWAKE = {
  // chest, shoulders and the arm lying across her, down to the quilt
  torso: [
    [150, 1100], [150, 792], [240, 790], [330, 780], [460, 790], [560, 796], [622, 836],
    [668, 902], [700, 984], [720, 1100],
  ],
  chestShadow: [[238, 796], [385, 810], [245, 926]],
  forearm: [[156, 800], [236, 800], [244, 730], [292, 722], [298, 860], [292, 1000], [170, 1004]],
  fist: [[156, 740], [170, 716], [200, 708], [236, 716], [252, 746], [246, 800], [214, 816], [176, 812], [156, 784]],
  hairBack: [
    [236, 540], [262, 508, 's'], [276, 500], [300, 470], [336, 470, 's'], [350, 458],
    [410, 456], [440, 448, 's'], [460, 466], [505, 488], [528, 494, 's'], [535, 525],
    [555, 565], [570, 610], [585, 660], [595, 715], [600, 765], [560, 774], [500, 778],
    [455, 772], [400, 790], [330, 812], [300, 800], [270, 760], [255, 700], [250, 640],
    [240, 590],
  ],
  face: [
    [296, 590], [330, 552], [400, 540], [450, 552], [466, 600], [458, 690], [462, 760], [440, 772], [400, 780], [362, 770],
    [336, 746], [318, 700], [305, 650],
  ],
  neck: [[362, 770], [460, 766], [470, 808], [372, 812]],
  lockRight: [
    [455, 600], [480, 560], [540, 540], [570, 610], [585, 660], [595, 715], [600, 765, 's'],
    [578, 770], [560, 776, 's'], [530, 772], [500, 778, 's'], [476, 770], [462, 740],
    [455, 690], [452, 640],
  ],
  lockLeft: [
    [240, 590], [290, 600], [310, 640], [326, 700], [346, 760], [360, 800, 's'], [330, 812],
    [314, 796, 's'], [295, 800], [270, 760], [255, 700], [248, 640],
  ],
  // fringe: separate locks hanging over her forehead, [root, bend, tip, width]
  fringe: [
    [[300, 548], [318, 590], [334, 634], 34],
    [[346, 544], [366, 584], [384, 620], 32],
    [[386, 550], [408, 580], [427, 606], 28],
    [[424, 556], [446, 580], [463, 599], 26],
  ],

  palm: [[230, 604], [250, 574], [288, 570], [308, 598], [302, 660], [292, 722], [242, 732], [228, 672]],
}

function strap(ctx, x1, y1, x2, y2) {
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

function awake(ctx) {
  const A = AWAKE
  ctx.fillStyle = K.sheet
  ctx.fillRect(-40, 420, 996, 1500)
  ink(ctx, [[-40, 420], [930, 420]], 7)
  bedEnd(ctx)

  // pillow, grey where her head presses in, with a lit edge on the right
  const pillow2 = () => {
    const n = PILLOW2.length
    ctx.beginPath()
    ctx.moveTo((PILLOW2[n - 1][0] + PILLOW2[0][0]) / 2, (PILLOW2[n - 1][1] + PILLOW2[0][1]) / 2)
    for (let i = 0; i < n; i++) ctx.arcTo(...PILLOW2[i], ...PILLOW2[(i + 1) % n], 46)
    ctx.closePath()
  }
  pillow2()
  ctx.fillStyle = K.white
  ctx.fill()
  shadeInside(ctx, pillow2, [[190, 520], [300, 452], [520, 440], [745, 432], [760, 760], [620, 820], [330, 860], [196, 820]], K.shade)
  pillow2()
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 7
  ctx.stroke()
  for (const s of [
    [[210, 470], [250, 486], [282, 500]], [[110, 540], [170, 548], [226, 556]],
    [[100, 730], [130, 726], [160, 722]], [[610, 440], [650, 430], [690, 420]],
    [[616, 516], [648, 508], [680, 500]], [[640, 620], [680, 620], [712, 624]],
    [[648, 690], [690, 696], [722, 704]],
  ]) ink(ctx, s, 5)

  // chest and shoulders; the arm lying across her; shadow under her chin
  shape(ctx, A.torso, K.white, null)
  shape(ctx, A.chestShadow, K.shade, null)
  shadeInside(ctx, A.torso, [[600, 860], [700, 900], [720, 1000], [610, 1000]], K.shade)
  ink(ctx, [[245, 926], [310, 868], [385, 812]], 6) // top of the arm
  ink(ctx, [[460, 797], [560, 800], [625, 845], [670, 910], [700, 985]], 6) // shoulder
  strap(ctx, 380, 800, 384, 852)

  // forearm rising from the quilt, the loose fist by her face
  shape(ctx, A.forearm, K.white)
  shadeInside(ctx, A.forearm, [[266, 730], [300, 730], [300, 1010], [266, 1010]], K.shade)
  shape(ctx, A.forearm, null)
  shape(ctx, A.fist, K.white)
  for (const s of [[[166, 738], [192, 748]], [[184, 724], [210, 740]], [[206, 722], [228, 744]], [[160, 770], [192, 776]], [[196, 780], [214, 800]]]) ink(ctx, s, 4.5)

  // hair behind her head, the neck, the face
  shape(ctx, A.hairBack, K.hair, null)
  // crayon grain and loose strands so the hair looks slept-in
  ctx.save()
  shape(ctx, A.hairBack, null, null)
  ctx.clip()
  const g = rng(171)
  ctx.strokeStyle = '#3a2f2f'
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.5
  for (let i = 0; i < 180; i++) {
    const x = 240 + g() * 370
    const y = 450 + g() * 370
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + 2 + g() * 4, y + 8 + g() * 14)
    ctx.stroke()
  }
  ctx.restore()
  for (const s of [
    [[250, 530], [220, 560], [200, 600]], [[268, 520], [240, 540], [212, 548]],
    [[300, 476], [280, 470], [262, 478]], [[440, 452], [470, 446], [500, 458]],
    [[560, 560], [590, 590], [600, 640]], [[590, 700], [610, 740], [604, 780]],
  ]) ink(ctx, s, 3.5)

  shape(ctx, A.neck, K.shade, null)
  shape(ctx, A.face, K.white, null)
  ink(ctx, [[338, 748], [364, 768], [404, 780], [440, 773]], 5) // jaw
  // tired face: furrowed brows, eyes shut, small hooked nose, mouth open
  ink(ctx, [[322, 628], [345, 620], [370, 628]], 5)
  ink(ctx, [[400, 612], [418, 616], [432, 624]], 5)
  ink(ctx, [[326, 666], [336, 672], [348, 674], [360, 668]], 5)
  ink(ctx, [[420, 656], [430, 660], [440, 660]], 5)
  ink(ctx, [[401, 640], [399, 666], [395, 688], [402, 696], [412, 696]], 5)
  ctx.fillStyle = '#2b2323'
  ctx.beginPath()
  ctx.ellipse(386, 725, 17, 9, -0.05, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = K.white
  ctx.beginPath()
  ctx.ellipse(386, 720, 11, 3, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.ellipse(386, 725, 17, 9, -0.05, 0, Math.PI * 2)
  ctx.stroke()

  // locks falling past her face, and the fringe
  shape(ctx, A.lockRight, K.hair, null)
  shape(ctx, A.lockLeft, K.hair, null)
  // hand pressed to her temple, fingers pushed up into her hair
  shape(ctx, A.palm, K.white)
  for (const s of [[[252, 578], [258, 612]], [[272, 572], [276, 612]], [[290, 578], [292, 612]], [[238, 650], [262, 660]]]) ink(ctx, s, 4.5)
  for (const s of [[[240, 560], [258, 580], [270, 600]], [[262, 552], [282, 576], [296, 596]]]) ink(ctx, s, 4)
  for (const [root, bend, tip, w] of A.fringe) {
    // a lock: wide at the hairline, curving to a point
    ctx.fillStyle = K.hair
    ctx.beginPath()
    ctx.moveTo(root[0] - w / 2, root[1] - 30)
    ctx.quadraticCurveTo(bend[0] - w / 2, bend[1], tip[0], tip[1])
    ctx.quadraticCurveTo(bend[0] + w / 2, bend[1] - 10, root[0] + w / 2 + 10, root[1] - 30)
    ctx.closePath()
    ctx.fill()
  }
  for (const s of [
    [[480, 600], [488, 680], [480, 760]], [[530, 580], [548, 670], [540, 766]],
    [[268, 640], [276, 700], [296, 790]], [[300, 660], [320, 730], [336, 800]],
    [[330, 480], [300, 520], [270, 560]], [[420, 470], [470, 490], [520, 530]],
    [[360, 540], [370, 580], [376, 602]], [[430, 546], [444, 580], [450, 598]],
  ]) ink(ctx, s, 4)

}

// The end of the bed, just past the right edge of the screen: the mattress's
// rounded corner, the wooden side of the bed frame, and the wall behind it.
function bedEnd(ctx) {
  ctx.fillStyle = K.sheet
  ctx.fillRect(1006, 0, 70, 1900)
  ink(ctx, [[1006, 0], [1006, 600], [1006, 1090]], 7)
  // bed frame side
  ctx.fillStyle = K.woodDark
  ctx.fillRect(961, 424, 45, 666)
  const r = rng(181)
  ctx.strokeStyle = K.woodGrain
  for (let i = 0; i < 7; i++) {
    const x = 966 + r() * 36
    ctx.lineWidth = 2 + r() * 2
    ctx.beginPath()
    ctx.moveTo(x, 440 + r() * 40)
    ctx.lineTo(x + (r() - 0.5) * 4, 900 + r() * 180)
    ctx.stroke()
  }
  // mattress corner and edge
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 7
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(930, 420)
  ctx.arcTo(958, 420, 958, 460, 22)
  ctx.lineTo(958, 1080)
  ctx.stroke()
}

function bedScene(ctx, t, ringing, awakeK) {
  ctx.save()
  tornBottom(ctx)
  ctx.clip()
  headboard(ctx)
  // mattress under everything
  ctx.fillStyle = K.sheet
  ctx.fillRect(-40, 420, 996, 1500)
  ink(ctx, [[-40, 420], [930, 420]], 7)
  bedEnd(ctx)
  for (const s of [[[-10, 920], [60, 900], [120, 890]], [[780, 900], [860, 890], [920, 910]]]) ink(ctx, s, 4)
  if (awakeK < 1) sleeper(ctx)
  if (awakeK > 0) {
    ctx.save()
    ctx.globalAlpha = awakeK
    awake(ctx)
    ctx.restore()
  }
  quilt(ctx, awakeK > 0.5 ? QUILT2 : QUILT)
  ctx.restore()

  // she stirs while the alarm rings
  if (ringing && awakeK === 0) {
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
function flipClock(ctx, digits, flip, ringing, t, changing) {
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
      const folding = flip > 0 && flip < 1 && changing.includes(i)
      ctx.save()
      ctx.translate(x + 32, 1566)
      if (folding) ctx.scale(1, Math.abs(Math.cos(flip * Math.PI)))
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

function clockPanel(ctx, alpha, digits, flip, ringing, t, changing) {
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
  flipClock(ctx, digits, flip, ringing, t, changing)
  ctx.restore()
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 8
  ctx.strokeRect(32, 1312, 804, 452)
  ctx.restore()
}

// Close-up of the clock's face: four split flaps, big, e.g. "07:28".
// Drawn in the close-up panel's own coordinates (same as the phone sheet).
export function bigDisplay(ctx, text, foldCell, fold) {
  ctx.save()
  ctx.lineJoin = 'round'
  ctx.fillStyle = '#484948'
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 12
  ctx.beginPath()
  ctx.roundRect(172, 900, 650, 255, 26)
  ctx.fill()
  ctx.stroke()
  const cells = [205, 350, 522, 667]
  cells.forEach((x, i) => {
    ctx.fillStyle = '#474847'
    ctx.strokeStyle = K.ink
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.rect(x, 922, 123, 210)
    ctx.fill()
    ctx.stroke()
    ctx.save()
    ctx.translate(x + 62, 1030)
    if (i === foldCell) ctx.scale(1, Math.abs(Math.cos(fold * Math.PI)))
    ctx.scale(0.8, 1) // the clock's digits are narrower than the font's
    ctx.fillStyle = '#f4f4f4'
    ctx.font = `700 172px ${SANS}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text[i], 0, 8)
    ctx.restore()
    ctx.strokeStyle = '#111111'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(x, 1028)
    ctx.lineTo(x + 123, 1028)
    ctx.stroke()
  })
  ctx.fillStyle = '#f4f4f4'
  for (const y of [1000, 1052]) {
    ctx.beginPath()
    ctx.arc(498, y, 11, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

// Heavy hand-drawn panel border, full height.
export function border(ctx, x, top, bottom) {
  const r = rng(191)
  ctx.fillStyle = K.ink
  ctx.beginPath()
  ctx.moveTo(x, top)
  for (let y = top; y <= bottom; y += 40) ctx.lineTo(x + (r() - 0.5) * 3, y)
  for (let y = bottom; y >= top; y -= 40) ctx.lineTo(x + 15 + (r() - 0.5) * 3, y)
  ctx.closePath()
  ctx.fill()
}

// Sheet rows 58..2000 are a phone screen; show from the top when there is room,
// otherwise crop the headboard so the clock panel (to row 1790) stays in view.
export const sheetTop = (height) => Math.max(58, 1790 - height / 0.6)

// 6:59 flips to 7:00 and the alarm rings. Tap it: she snoozes and rolls over,
// the clock flips to 7:15 and rings again. Tap it again and she drifts off: the
// camera pans past the end of the bed to a close-up of the clock, whose minutes
// tick on to 07:28. She's late. Tap to go on.
const PAN = 1000 // how far the camera travels, in sheet units
const PANEL_X = 1076 // where the close-up panel starts, in sheet units
const LATE = 28 // the minute she finally wakes at

export default function wakeUp(api) {
  const FLIP_AT = 1.6
  let snoozedAt = null
  let stoppedAt = null
  let lastBeep = 0
  const toScreen = (y) => (y - sheetTop(api.height())) * 0.6
  const inClock = (y) => y > toScreen(1312) && y < toScreen(1764)
  // what the clock and Mira are doing at time t
  const state = (t) => {
    const first = clamp((t - FLIP_AT) / 0.35, 0, 1)
    if (snoozedAt === null) {
      return { digits: first < 0.5 ? ' 659' : ' 700', flip: first, changing: [1, 2, 3], ringing: first >= 1, awakeK: 0 }
    }
    const second = clamp((t - snoozedAt - 1.1) / 0.35, 0, 1)
    return {
      digits: second < 0.5 ? ' 700' : ' 715',
      flip: second,
      changing: [2, 3],
      ringing: second >= 1 && stoppedAt === null,
      awakeK: easeOut((t - snoozedAt - 0.3) / 0.7),
    }
  }
  // the pan and the minutes ticking on in the close-up
  const panAt = (t) => (stoppedAt === null ? 0 : easeInOut((t - stoppedAt - 0.5) / 1.4) * PAN)
  const countStart = () => stoppedAt + 2.2
  const TICK = 0.16
  const minuteAt = (t) => Math.min(LATE, 15 + Math.max(0, Math.floor((t - countStart()) / TICK)))
  const countDone = (t) => stoppedAt !== null && t > countStart() + (LATE - 15) * TICK + 0.4

  return {
    tall: true,
    // test hook: where to tap to stop the alarm
    debug: () => ({ tap: [W / 2, toScreen(1560)] }),
    draw(ctx, t) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, api.height())
      const st = state(t)
      if (st.ringing && t - lastBeep > 0.45) {
        lastBeep = t
        tone(1320, 0.14, { type: 'square', gain: 0.03 })
      }
      const pan = panAt(t)
      const clockAlpha = easeOut((t - 0.5) / 0.6) * (stoppedAt === null ? 1 : 1 - easeOut((t - stoppedAt) / 0.35))
      ctx.save()
      ctx.scale(0.6, 0.6)
      ctx.translate(-pan, -sheetTop(api.height()))
      bedScene(ctx, t, st.ringing, st.awakeK)
      if (clockAlpha > 0) clockPanel(ctx, clockAlpha, st.digits, st.flip, st.ringing, t, st.changing)
      nameLabel(ctx, easeOut((t - 0.9) / 0.6))
      if (stoppedAt !== null) {
        // the close-up panel to the right of the bedroom
        const top = sheetTop(api.height())
        const bottom = top + api.height() / 0.6
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(PANEL_X - 6, top, 1000, bottom - top)
        border(ctx, PANEL_X - 15, top, bottom)
        const m = minuteAt(t)
        const tick = (t - countStart()) / TICK
        const ticking = m < LATE && tick > 0
        ctx.translate(PAN, 0)
        bigDisplay(ctx, `07${String(m).padStart(2, '0')}`, ticking ? 3 : -1, ticking ? tick % 1 : 0)
      }
      ctx.restore()
      const ringSince = snoozedAt === null ? FLIP_AT : snoozedAt + 1.45
      if (st.ringing && t > ringSince + 2.5) tapHint(ctx, W / 2, toScreen(1400), t, K.ink)
      if (countDone(t)) tapHint(ctx, 50, 50, t)
    },
    down(x, y, t) {
      if (stoppedAt !== null) {
        if (countDone(t)) api.finish()
        return
      }
      if (!inClock(y) || !state(t).ringing) return
      pop(300)
      if (snoozedAt === null) snoozedAt = t
      else stoppedAt = t
    },
  }
}
