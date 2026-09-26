// Chapter 1, page 6 · on the phone with Mum
// Split panels: Mum at home on the landline (the same face as her photo on the
// incoming call), and Mira at her desk at half past two, phone to her ear,
// annoyed. Mum keeps talking; pick one of two replies each time: it lights up
// blue while Mira says it. Four replies fill the bar and end the call. Traced on the same 900 x 2000 phone sheet.
import { W, UI_FONT, tapHint, clamp, easeOut } from '../paint.js'
import { pop } from '../sound.js'
import { K, ink, shape, sheetTop } from './ch01-wake.js'

const C2 = {
  wall: '#c5d3de',
  photo: '#dee2e2',
  photoLine: '#aab4bf',
  hair: '#8893a0',
  cardigan: '#88949f',
  top: '#c4d2dc',
  phone: '#53a5c8',
  clockRim: '#52aad0',
  clockFace: '#e4e6e6',
  miraHair: '#292121',
  chair: '#6b757d',
  desk: '#141212',
  bar: '#6fd2fb',
}

const LEFT = { x: -20, y: 175, w: 450, h: 1105 }
const RIGHT = { x: 470, y: 175, w: 450, h: 1105 }
const BAR = { x: 130, y: 1060, w: 636, h: 64 }
const CHOICE = { x: 48, y: 1228, w: 802, h: 250 }
const CJK = "'Noto Sans TC', 'PingFang HK', 'Microsoft JhengHei', sans-serif"

// Each time Mum pauses, Mira can say one of two things.
const ROUNDS = [
  [['下次再傾。', 'Talk to you later.'], ['唔駛理我。', 'Don’t worry about me.']],
  [['我好好。', 'I’m fine.'], ['下次再傾。', 'Talk to you later.']],
  [['我好好。', 'I’m fine.'], ['唔好幫我搵男朋友。', 'You don’t have to find a boyfriend for me.']],
  [['我要做嘢喇。', 'I need to get back to work.'], ['拜拜，媽。', 'Bye, Mum.']],
]
// The replies are the only Chinese in the game, and their font is ten files
// (about 350 KB) for these few characters. They start loading as soon as the
// game does, in the background, and the replies are held back until they're
// in, so they never show in a stand-in face and then change. If the font can't
// load at all, the replies show anyway rather than never.
const REPLY_FACE = "400 84px 'Noto Sans TC'"
const REPLY_TEXT = ROUNDS.flat().map(([zh]) => zh).join('')
let replyFont = false
if (typeof document !== 'undefined' && document.fonts) {
  document.fonts.load(REPLY_FACE, REPLY_TEXT).finally(() => (replyFont = true))
} else replyFont = true
const PICKED = '#70d3fa'
const SAY = 1.0 // seconds Mira takes to say her reply
const MUM = 1.4 // seconds Mum then talks before the next replies appear

// Smooth ink stroke through points.
function curve(ctx, pts, width = 5, color = K.ink) {
  ctx.strokeStyle = color
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

function poly(ctx, pts, fill, width = 6) {
  ctx.beginPath()
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  if (width) {
    ctx.strokeStyle = K.ink
    ctx.lineWidth = width
    ctx.lineJoin = 'round'
    ctx.stroke()
  }
}

// A finger: a thick white stroke with an ink outline, from knuckle to tip.
function finger(ctx, pts, w = 26) {
  curve(ctx, pts, w + 10)
  curve(ctx, pts, w, '#ffffff')
}

function frame(ctx, p) {
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 9
  ctx.strokeRect(p.x, p.y, p.w, p.h)
}

// ---------- Mum, at home ----------

// A faded family photo on the wall behind her: Mum, young, with Mira as a girl.
function familyPhoto(ctx) {
  ctx.save()
  ctx.strokeStyle = C2.photoLine
  ctx.lineWidth = 7
  ctx.fillStyle = C2.photo
  ctx.beginPath()
  ctx.moveTo(-20, 655)
  ctx.lineTo(-20, 300)
  ctx.bezierCurveTo(-10, 210, 190, 210, 205, 320)
  ctx.lineTo(205, 560)
  ctx.bezierCurveTo(205, 640, 120, 660, -20, 655)
  ctx.fill()
  ctx.stroke()
  ctx.lineWidth = 5
  // Mum when young: bob, glasses, smile
  shape(ctx, [[-10, 420], [0, 330], [60, 290], [110, 310], [130, 380], [120, 430]], '#c3cad2', C2.photoLine, 4)
  shape(ctx, [[10, 400], [20, 330], [100, 330], [104, 400], [60, 425]], '#ffffff', C2.photoLine, 4)
  for (const x of [22, 64]) {
    ctx.beginPath()
    ctx.roundRect(x, 348, 34, 24, 5)
    ctx.stroke()
  }
  curve(ctx, [[40, 395], [55, 405], [72, 395]], 4, C2.photoLine)
  shape(ctx, [[-20, 440], [60, 430], [130, 470], [130, 560], [-20, 560]], '#c3cad2', C2.photoLine, 4)
  // Mira as a little girl in front, grinning
  shape(ctx, [[-10, 560], [0, 490], [60, 470], [118, 500], [124, 570]], '#c3cad2', C2.photoLine, 4)
  shape(ctx, [[10, 520], [104, 520], [106, 580], [60, 604], [14, 580]], '#ffffff', C2.photoLine, 4)
  for (const x of [34, 80]) {
    ctx.beginPath()
    ctx.arc(x, 548, 4, 0, Math.PI * 2)
    ctx.fillStyle = C2.photoLine
    ctx.fill()
  }
  shape(ctx, [[42, 568], [76, 568], [60, 584]], '#ffffff', C2.photoLine, 4)
  shape(ctx, [[-20, 610], [100, 605], [150, 640], [-20, 650]], '#c3cad2', C2.photoLine, 4)
  ctx.restore()
}

// The coiled phone cord, a row of little loops from the handset to the base.
function cord(ctx) {
  const pts = [[204, 830], [206, 890], [225, 933], [250, 950], [300, 967], [367, 975], [440, 980]]
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 5
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[i + 1]
    const n = Math.round(Math.hypot(x2 - x1, y2 - y1) / 12)
    for (let k = 0; k < n; k++) {
      const x = x1 + ((x2 - x1) * k) / n
      const y = y1 + ((y2 - y1) * k) / n
      ctx.beginPath()
      ctx.ellipse(x, y, 7, 9, Math.atan2(y2 - y1, x2 - x1), 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.stroke()
    }
  }
}

function mum(ctx, t, talking) {
  // cardigan over a pale top, one hand on her hip
  shape(ctx, [[-20, 1290], [-20, 900], [20, 862], [83, 825], [179, 822], [250, 822], [330, 838], [362, 870], [367, 1290]], C2.cardigan)
  poly(ctx, [[179, 838], [250, 838], [258, 1290], [176, 1290]], C2.top)
  curve(ctx, [[196, 862], [222, 870], [248, 862]], 5)
  for (const s of [[[190, 1010], [240, 1006]], [[196, 1060], [236, 1058]], [[300, 900], [320, 1000]], [[60, 900], [40, 1000]]]) curve(ctx, s, 4.5)
  curve(ctx, [[40, 880], [20, 960], [30, 1060], [70, 1110], [110, 1090]], 6) // arm bent to her hip
  curve(ctx, [[90, 900], [80, 1000], [100, 1060]], 5)
  shape(ctx, [[196, 770], [248, 770], [252, 840], [194, 840]], '#ffffff', null) // neck
  curve(ctx, [[198, 790], [194, 838]], 5)
  curve(ctx, [[246, 790], [252, 838]], 5)

  // hair behind her face: the same grey bob as in her photo
  const outline = [[108, 775], [92, 767], [79, 700], [83, 617], [104, 550], [150, 515], [215, 505], [275, 512], [325, 542], [350, 600], [358, 683], [350, 767], [325, 787]]
  shape(ctx, [...outline, [220, 800]], C2.hair, null)
  curve(ctx, outline, 6)
  // face
  ctx.beginPath()
  ctx.moveTo(110, 620)
  ctx.bezierCurveTo(110, 540, 280, 530, 278, 610)
  ctx.bezierCurveTo(284, 690, 262, 770, 200, 792)
  ctx.bezierCurveTo(150, 800, 108, 760, 110, 620)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  curve(ctx, [[112, 720], [128, 768], [170, 792], [200, 792], [236, 780]], 6)
  // hair falling past her cheeks, strands from the parting
  shape(ctx, [[122, 560], [170, 526], [128, 600], [116, 690], [124, 776], [92, 770], [80, 690], [90, 600]], C2.hair, null)
  shape(ctx, [[276, 556], [230, 526], [276, 600], [294, 690], [304, 790], [340, 786], [356, 690], [344, 590]], C2.hair, null)
  for (const s of [
    [[200, 510], [150, 530], [118, 590], [100, 680], [100, 770]], [[210, 510], [270, 530], [316, 590], [340, 680], [338, 780]],
    [[190, 514], [140, 560], [120, 640]], [[222, 514], [280, 556], [300, 630]], [[96, 700], [98, 770]], [[322, 700], [326, 780]],
    [[180, 518], [128, 570], [104, 650], [92, 740]], [[232, 518], [296, 566], [330, 650], [342, 740]], [[110, 610], [106, 700]],
  ]) curve(ctx, s, 3.5)
  // glasses, same frames as in her photo
  for (const [x, y, w, h] of [[96, 629, 92, 63], [196, 629, 79, 59]]) {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, 12)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = K.ink
    ctx.lineWidth = 6.5
    ctx.stroke()
    ink(ctx, [[x + 24, y + 44], [x + 40, y + 22]], 5, C2.top)
    ink(ctx, [[x + 44, y + 46], [x + 58, y + 30]], 5, C2.top)
  }
  ink(ctx, [[188, 654], [196, 654]], 8)
  ink(ctx, [[84, 650], [96, 652]], 7)
  curve(ctx, [[174, 680], [166, 698], [178, 704]], 5) // nose
  // mouth: while she talks it goes between a round "o" and a bared-teeth
  // grimace; while she listens it's a short line
  ctx.fillStyle = K.ink
  const phase = Math.floor(t / 0.3) % 3
  if (talking && phase === 2) {
    ctx.beginPath()
    ctx.moveTo(158, 733)
    ctx.quadraticCurveTo(175, 725, 202, 726)
    ctx.quadraticCurveTo(214, 731, 202, 738)
    ctx.quadraticCurveTo(178, 742, 160, 740)
    ctx.closePath()
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = K.ink
    ctx.lineWidth = 6
    ctx.stroke()
  } else {
    ctx.beginPath()
    if (talking) ctx.ellipse(185, 733, 10, 17, 0, 0, Math.PI * 2)
    else ctx.ellipse(185, 736, 12, 3.5, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // the blue handset against her ear, her hand wrapped around it
  poly(ctx, [[179, 770], [236, 748], [284, 700], [296, 640], [336, 626], [348, 656], [326, 706], [272, 762], [254, 818], [196, 830]], C2.phone, 7)
  curve(ctx, [[236, 748], [252, 818]], 5)
  // her hand: thin fingers pointing up over the handset, the back of the hand
  // narrowing down to her wrist at the lower left
  shape(ctx, [[262, 752], [334, 744], [342, 760], [304, 786], [272, 806], [246, 812], [248, 780]], '#ffffff')
  finger(ctx, [[282, 762], [274, 730], [268, 704]], 10)
  finger(ctx, [[298, 752], [290, 722], [285, 698]], 10)
  finger(ctx, [[313, 750], [306, 726], [302, 706]], 10)
  finger(ctx, [[326, 748], [322, 730], [318, 716]], 9)
  shape(ctx, [[258, 756], [334, 750], [338, 762], [302, 784], [270, 802], [250, 806], [252, 780]], '#ffffff', null) // hide the finger bases
  curve(ctx, [[340, 752], [306, 782], [270, 802], [244, 812]], 6)
  cord(ctx)
}

// ---------- Mira, at her desk ----------

function officeBack(ctx) {
  // clock on the wall: twenty-nine minutes past two
  ctx.beginPath()
  ctx.arc(525, 380, 118, 0, Math.PI * 2)
  ctx.fillStyle = C2.clockRim
  ctx.fill()
  ctx.lineWidth = 6
  ctx.strokeStyle = '#7e8a96'
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(525, 380, 96, 0, Math.PI * 2)
  ctx.fillStyle = C2.clockFace
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#6b757d'
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    ctx.fillRect(525 + Math.cos(a) * 80 - 3, 380 + Math.sin(a) * 80 - 3, 6, 6)
  }
  curve(ctx, [[525, 380], [525, 450]], 6, '#6b757d') // minute hand: half past
  curve(ctx, [[525, 380], [562, 392]], 7, '#6b757d') // hour hand, between two and three
  // shelf edge, a planner on the wall, a picture frame, the monitor
  curve(ctx, [[470, 532], [920, 532]], 6, '#7e8a96')
  ctx.strokeStyle = '#7e8a96'
  ctx.lineWidth = 5
  for (let y = 590; y <= 770; y += 45) curve(ctx, [[470, y], [580, y]], 4, '#7e8a96')
  for (let x = 490; x <= 580; x += 30) curve(ctx, [[x, 580], [x, 770]], 4, '#7e8a96')
  ctx.strokeRect(770, 810, 80, 90)
  ctx.fillStyle = '#060606'
  ctx.fillRect(840, 680, 90, 350)
  // her chair back
  ctx.fillStyle = C2.chair
  ctx.fillRect(470, 940, 50, 150)
  // the desk front
  ctx.fillStyle = C2.desk
  ctx.fillRect(470, 1100, 460, 190)
  for (const y of [1150, 1190, 1230]) curve(ctx, [[480, y], [760, y]], 4, '#3a3a3a')
}

function mira(ctx, speaking) {
  // white shirt, collar and placket
  shape(ctx, [[480, 1100], [486, 900], [495, 850], [560, 835], [670, 842], [745, 842], [795, 842], [830, 880], [850, 1100]], '#ffffff')
  shape(ctx, [[668, 770], [737, 770], [742, 848], [666, 848]], '#ffffff', null) // neck
  curve(ctx, [[670, 790], [666, 846]], 5)
  curve(ctx, [[735, 790], [742, 846]], 5)
  poly(ctx, [[666, 842], [704, 884], [708, 848]], '#ffffff', 5)
  poly(ctx, [[744, 842], [716, 882], [712, 848]], '#ffffff', 5)
  curve(ctx, [[710, 884], [708, 1000], [712, 1100]], 5)
  for (const s of [[[740, 950], [770, 990]], [[700, 1040], [740, 1036]], [[780, 900], [800, 960]]]) curve(ctx, s, 4.5)
  shape(ctx, [[830, 1060], [880, 1066], [910, 1100], [890, 1122], [836, 1116]], '#ffffff') // hand on the keyboard

  // hair behind her face, then the face
  const outline = [[541, 771], [528, 742], [532, 658], [553, 575], [600, 520], [680, 505], [753, 512], [803, 575], [816, 658], [820, 767], [800, 792]]
  shape(ctx, [...outline, [680, 790]], C2.miraHair, null)
  curve(ctx, outline, 6)
  ctx.beginPath()
  ctx.moveTo(622, 610)
  ctx.bezierCurveTo(625, 560, 772, 560, 776, 620)
  ctx.bezierCurveTo(784, 700, 770, 760, 740, 775)
  ctx.bezierCurveTo(700, 788, 650, 780, 630, 750)
  ctx.bezierCurveTo(616, 720, 618, 660, 622, 610)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  curve(ctx, [[640, 764], [670, 782], [712, 786], [746, 772], [772, 740]], 6) // jaw
  // side locks and a heavy fringe swept to her left
  shape(ctx, [[776, 600], [802, 588], [816, 660], [820, 767], [790, 792], [782, 700]], C2.miraHair, null)
  shape(ctx, [[622, 610], [592, 600], [556, 640], [534, 700], [541, 771], [596, 770], [614, 720]], C2.miraHair, null)
  shape(ctx, [[598, 548], [680, 508], [760, 520], [800, 580], [790, 600], [640, 600], [620, 606]], C2.miraHair, null)
  // fringe: strands sweeping down from the crown to the left, uneven tips
  for (let i = 0; i < 10; i++) {
    const x = 628 + i * 13
    const tip = 622 + ((i * 7) % 4) * 8
    curve(ctx, [[x + 34, 530], [x + 14, 578], [x, tip]], 16, C2.miraHair)
  }
  for (const s of [[[720, 520], [680, 570], [660, 620]], [[760, 530], [740, 580], [736, 606]], [[552, 690], [548, 766]], [[568, 700], [566, 768]], [[804, 680], [808, 770]]]) curve(ctx, s, 3.5, '#4a3f3f')
  // annoyed: brows pulled down toward her nose, eyes to the side, a flat mouth
  curve(ctx, [[646, 637], [666, 642], [684, 652]], 6)
  curve(ctx, [[736, 650], [754, 642], [772, 637]], 6)
  ctx.fillStyle = K.ink
  for (const [x, y] of [[662, 671], [753, 673]]) {
    ctx.beginPath()
    ctx.ellipse(x, y, 5, 9, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  curve(ctx, [[722, 684], [712, 706], [726, 714]], 5) // nose
  // mouth: a small "o" while she answers, otherwise a flat line
  if (speaking) {
    ctx.fillStyle = K.ink
    ctx.beginPath()
    ctx.ellipse(704, 738, 8, 12, 0, 0, Math.PI * 2)
    ctx.fill()
  } else curve(ctx, [[692, 737], [716, 736]], 5)
  // stress marks by her head
  for (const s of [[[500, 618], [512, 632]], [[490, 652], [508, 656]], [[496, 684], [512, 680]]]) curve(ctx, s, 5)

  // forearm and wrist with her watch, and the hand holding the phone to her ear
  poly(ctx, [[537, 1000], [606, 860], [672, 862], [640, 1000]], '#ffffff', 0)
  curve(ctx, [[608, 868], [576, 920], [548, 970], [537, 1000]], 6)
  curve(ctx, [[670, 870], [656, 930], [640, 1000]], 6)
  poly(ctx, [[606, 846], [668, 840], [672, 866], [610, 872]], '#ffffff', 5) // watch strap
  // her hand: long thin fingers up by her ear, one hooked over the phone, the
  // palm running down to her wrist
  shape(ctx, [[562, 760], [600, 752], [650, 744], [662, 800], [666, 850], [622, 852], [596, 814], [576, 786]], '#ffffff')
  poly(ctx, [[646, 736], [660, 746], [664, 796], [652, 788]], C2.top, 4) // the phone between her fingers
  finger(ctx, [[584, 776], [574, 728], [567, 686]], 12)
  finger(ctx, [[606, 766], [601, 732], [598, 702]], 11)
  finger(ctx, [[620, 764], [617, 734], [624, 718], [640, 716], [648, 734]], 11)
  shape(ctx, [[570, 780], [640, 762], [656, 792], [660, 846], [624, 848], [600, 814]], '#ffffff', null) // hide the finger bases
  curve(ctx, [[562, 762], [576, 792], [600, 816], [622, 846]], 6)
  curve(ctx, [[656, 750], [662, 800], [666, 846]], 6)
}

// ---------- the reply box ----------

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
    ctx.fillStyle = C2.bar
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

// The two replies. Once one is picked it fills blue with white text and the
// other one greys out.
function choices(ctx, options, alpha, picked) {
  const { x, y, w, h } = CHOICE
  ctx.save()
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x, y, w, h * 2)
  ctx.globalAlpha = alpha
  options.forEach(([zh, en], i) => {
    const top = y + i * h
    if (picked === i) {
      ctx.fillStyle = PICKED
      ctx.fillRect(x, top, w, h)
    }
    ctx.fillStyle = picked === i ? '#ffffff' : picked >= 0 ? '#d4d4d4' : '#111111'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    // long replies get a smaller size so they fit on one line
    ctx.font = `400 84px ${CJK}`
    const k = Math.min(1, (w - 60) / ctx.measureText(zh).width)
    ctx.font = `400 ${Math.floor(84 * k)}px ${CJK}`
    ctx.fillText(zh, x + w / 2, top + h * 0.43)
    ctx.font = `700 40px ${UI_FONT}`
    const k2 = Math.min(1, (w - 60) / ctx.measureText(`(${en})`).width)
    ctx.font = `700 ${Math.floor(40 * k2)}px ${UI_FONT}`
    ctx.fillText(`(${en})`, x + w / 2, top + h * 0.78)
  })
  ctx.restore()
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 8
  ctx.strokeRect(x, y, w, h * 2)
  ctx.beginPath()
  ctx.moveTo(x, y + h)
  ctx.lineTo(x + w, y + h)
  ctx.stroke()
}

// ---------- the page ----------

export default function mumTalks(api) {
  let round = 0
  let replies = 0
  let pickedAt = null
  let picked = -1
  let doneAt = null
  const top = () => sheetTop(api.height())
  const toSheet = (x, y) => [x / 0.6, y / 0.6 + top()]
  const toScreen = (x, y) => [x * 0.6, (y - top()) * 0.6]
  // Mira says her reply, then Mum talks for a moment before the next replies
  const talkUntil = () => (pickedAt === null ? 1.4 : pickedAt + SAY + MUM)
  const saying = (t) => pickedAt !== null && t < pickedAt + SAY
  const showing = (t) => doneAt === null && !saying(t) && t > talkUntil() && replyFont

  return {
    tall: true,
    debug: () => ({
      option: toScreen(CHOICE.x + CHOICE.w / 2, CHOICE.y + CHOICE.h / 2),
      replies,
      done: doneAt !== null,
    }),
    draw(ctx, t) {
      const h = api.height()
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, h)
      // after a reply, move on to the next pair once Mum has had her say
      if (pickedAt !== null && picked >= 0 && t > pickedAt + SAY && doneAt === null) {
        round = Math.min(ROUNDS.length - 1, round + 1)
        picked = -1
      }
      ctx.save()
      ctx.scale(0.6, 0.6)
      ctx.translate(0, -top())
      // Mum's panel
      ctx.save()
      ctx.beginPath()
      ctx.rect(LEFT.x, LEFT.y, LEFT.w, LEFT.h)
      ctx.clip()
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(LEFT.x, LEFT.y, LEFT.w, LEFT.h)
      familyPhoto(ctx)
      mum(ctx, t, !showing(t) && !saying(t) && (doneAt === null || t < doneAt + SAY + MUM))
      ctx.restore()
      frame(ctx, LEFT)
      // Mira's panel
      ctx.save()
      ctx.beginPath()
      ctx.rect(RIGHT.x, RIGHT.y, RIGHT.w, RIGHT.h)
      ctx.clip()
      ctx.fillStyle = C2.wall
      ctx.fillRect(RIGHT.x, RIGHT.y, RIGHT.w, RIGHT.h)
      officeBack(ctx)
      mira(ctx, saying(t))
      ctx.restore()
      frame(ctx, RIGHT)

      bar(ctx, replies / ROUNDS.length)
      const a = saying(t) ? 1 : showing(t) ? easeOut((t - talkUntil()) / 0.35) : 0
      choices(ctx, ROUNDS[round], clamp(a, 0, 1), picked)
      ctx.restore()

      if (showing(t) && replies === 0 && t > 3) {
        const [x, y] = toScreen(CHOICE.x + CHOICE.w * 0.82, CHOICE.y + CHOICE.h / 2)
        tapHint(ctx, x, y, t, K.ink)
      }
      if (doneAt !== null && t > doneAt + SAY + MUM) tapHint(ctx, 50, 50, t)
    },
    down(x, y, t) {
      if (doneAt !== null) {
        if (t > doneAt + SAY + MUM) api.finish()
        return
      }
      if (!showing(t)) return
      const [sx, sy] = toSheet(x, y)
      if (sx < CHOICE.x || sx > CHOICE.x + CHOICE.w) return
      const i = Math.floor((sy - CHOICE.y) / CHOICE.h)
      if (i < 0 || i > 1) return
      picked = i
      pickedAt = t
      replies += 1
      pop(520 + replies * 60)
      if (replies >= ROUNDS.length) doneAt = t
    },
  }
}

