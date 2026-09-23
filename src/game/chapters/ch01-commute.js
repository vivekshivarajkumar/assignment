// Chapter 1, page 3 · the commute
// The camera pans on from the 08:02 clock into a packed train. Mira stands
// between two grey commuters with her headphones on, scrolling her phone.
// The panel below is her feed: tap the heart (or the share arrows) to like a
// post and scroll on; the bar fills with every post. Then the camera pans on
// past the man beside her to the clock: 08:58. Same 900 x 2000 sheet.
import { W, tapHint, rng, easeInOut } from '../paint.js'
import { pop } from '../sound.js'
import { K, ink, shape, bigDisplay, border, sheetTop } from './ch01-wake.js'

const T = {
  ad: '#8893a0',
  wall: '#c5d3de',
  seat: '#8994a1',
  suit: '#474847',
  shirt: '#8a93a2',
  pale: '#c3d2de',
  face: '#f1f1f1',
  beard: '#87939f',
  sweater: '#bdbdbd',
  blue: '#52a5cf',
  bar: '#6fd2fb',
  frame: '#ccdeea',
  pink: '#f90a77',
  pinkFill: '#ffc0c3',
  green: '#6bbba4',
  heart: '#91ddfa',
}

const PAN = 1076 // the clock close-up sits this far to the left of the train
const BAR = { x: 108, y: 1003, w: 677, h: 68 }
const PANEL = { x: 45, y: 1130, w: 810, h: 650 }
const PHOTO = { x: 140, w: 600, h: 385 } // a post's picture; y scrolls
const HEART = { x: 598, y: 1590 }
const SHARE = { x: 285, y: 1600 }
const POSTS = 6 // posts to like to fill the bar
const PANEL_X = 1076 // where the next clock close-up starts, to the right
const FROM = 8 * 60 + 2
const TO = 8 * 60 + 58
const TICK = 0.03

// ---------- the carriage ----------

function carriage(ctx) {
  // adverts along the top, with scribbled text
  ctx.fillStyle = T.ad
  ctx.fillRect(-40, 0, 1110, 215)
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 7
  for (const x of [150, 540]) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, 210)
    ctx.stroke()
  }
  ink(ctx, [[-40, 212], [1070, 212]], 8)
  const r = rng(301)
  for (const [x0, y0, n] of [[10, 90, 4], [215, 90, 3], [300, 170, 7], [650, 130, 2]]) {
    for (let i = 0; i < n; i++) {
      const x = x0 + i * 24 + r() * 6
      ink(ctx, [[x, y0], [x + 6 + r() * 8, y0 - 26 - r() * 14]], 5)
    }
  }
  // a route map on the right advert
  ink(ctx, [[625, 157], [1060, 152]], 4)
  ctx.fillStyle = K.ink
  for (const x of [630, 740, 875, 1010]) {
    ctx.beginPath()
    ctx.arc(x, 156, 8, 0, Math.PI * 2)
    ctx.fill()
  }

  // wall and windows, with a grey blur of the city rushing by
  ctx.fillStyle = T.wall
  ctx.fillRect(-40, 215, 1110, 1400)
  ctx.fillStyle = T.seat
  ctx.fillRect(-40, 225, 1110, 20)
  for (const [x1, x2] of [[195, 505], [655, 1060]]) {
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = K.ink
    ctx.lineWidth = 7
    ctx.beginPath()
    ctx.roundRect(x1, 265, x2 - x1, 900, 34)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = T.pale
    for (const [y, w] of [[380, 0.55], [545, 0.8], [700, 0.4]]) ctx.fillRect(x1 + 10, y, (x2 - x1) * w, 8)
  }
  // grab pole
  ctx.fillStyle = T.seat
  ctx.fillRect(152, 0, 28, 1100)
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 6
  ctx.strokeRect(152, -10, 28, 1110)
  // seat backs behind Mira
  shape(ctx, [[255, 790], [320, 770], [330, 900], [255, 920]], T.seat)
  shape(ctx, [[560, 790], [640, 780], [650, 900], [570, 910]], T.seat)
}

// Straight-edged filled shape with an ink outline (for suits, collars, ties).
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

// Man on the left in a suit and striped tie, holding his phone.
function manLeft(ctx) {
  poly(ctx, [[-60, 565], [120, 560], [215, 610], [250, 700], [262, 1150], [-60, 1150]], T.suit)
  poly(ctx, [[-20, 565], [115, 562], [70, 760]], T.shirt, 5)
  poly(ctx, [[48, 600], [84, 600], [96, 930], [66, 975], [36, 930]], T.pale, 5)
  for (let y = 630; y < 940; y += 30) ink(ctx, [[42, y], [90, y + 16]], 4)
  poly(ctx, [[115, 562], [150, 690], [120, 700], [95, 610]], T.suit, 6) // lapel
  // head: grey-blue skin, short dark hair, eyes half closed
  shape(ctx, [[-10, 300], [60, 272], [130, 285], [155, 360], [152, 450], [130, 525], [80, 560], [10, 555], [-15, 470]], T.pale)
  poly(ctx, [[-20, 330], [0, 285], [60, 262], [130, 272], [158, 330], [140, 360], [120, 322], [60, 318], [10, 340], [-20, 380]], '#3a3a3a', 5)
  ink(ctx, [[10, 405], [42, 400]], 6)
  ink(ctx, [[100, 400], [132, 405]], 6)
  ink(ctx, [[60, 470], [74, 480], [90, 472]], 5)
  ink(ctx, [[152, 400], [168, 420], [150, 450]], 5) // ear
  // his phone, in a pale hand
  poly(ctx, [[34, 742], [118, 742], [118, 910], [34, 910]], '#464747')
  shape(ctx, [[-20, 815], [55, 805], [112, 832], [104, 872], [40, 895], [-20, 885]], T.pale)
  for (const y of [826, 848, 868]) ink(ctx, [[40, y], [104, y - 4]], 4)
  poly(ctx, [[-20, 1012], [245, 1018], [245, 1052], [-20, 1046]], T.pale, 5) // belt
}

// Bearded man on the right in a dark jacket over a ribbed sweater, reading his
// phone. Most of him is off-screen until the camera pans on after the feed.
function manRight(ctx) {
  const SWEATER = '#8895a0'
  const JEANS = '#8994a1'
  // jacket, jeans, and the sweater between the jacket's fronts
  poly(ctx, [[615, 1150], [620, 760], [650, 650], [720, 590], [790, 560], [930, 550], [1000, 520], [1070, 510], [1070, 1150]], T.suit)
  poly(ctx, [[790, 1100], [1060, 1100], [1060, 1400], [790, 1400]], JEANS, 0)
  ink(ctx, [[800, 1110], [805, 1250], [800, 1400]], 5)
  ink(ctx, [[1000, 1110], [1030, 1160], [1060, 1170]], 5) // pocket
  for (const s of [[[850, 1170], [900, 1175]], [[830, 1260], [870, 1262]], [[960, 1300], [1000, 1310]]]) ink(ctx, s, 4)
  poly(ctx, [[798, 600], [925, 600], [932, 1085], [800, 1085]], SWEATER, 0)
  for (const s of [[[830, 850], [880, 846]], [[820, 940], [880, 936]], [[850, 1010], [900, 1006]], [[860, 900], [900, 896]]]) ink(ctx, s, 4)
  poly(ctx, [[796, 1080], [934, 1080], [934, 1112], [796, 1112]], SWEATER, 5) // ribbed hem
  for (let x = 804; x < 930; x += 10) ink(ctx, [[x, 1084], [x, 1108]], 2.5)
  ink(ctx, [[798, 720], [795, 900], [798, 1100]], 6) // jacket fronts
  ink(ctx, [[925, 720], [930, 900], [936, 1100]], 6)
  // jacket collar and lapels
  poly(ctx, [[760, 570], [800, 522], [900, 516], [945, 540], [935, 580], [905, 556], [805, 562]], T.suit)
  ink(ctx, [[805, 560], [735, 700], [790, 730], [830, 800]], 6)
  ink(ctx, [[925, 556], [955, 625], [925, 690], [945, 720]], 6)
  // neck and ribbed sweater collar
  shape(ctx, [[795, 488], [885, 488], [890, 585], [795, 585]], T.face, null)
  ink(ctx, [[798, 500], [796, 575]], 5)
  ink(ctx, [[886, 500], [888, 572]], 5)
  poly(ctx, [[778, 590], [850, 600], [930, 575], [938, 620], [860, 642], [790, 632]], SWEATER, 5)
  for (let x = 790; x < 930; x += 11) ink(ctx, [[x, 598], [x + 2, 628]], 2.5)

  // head: grey hair and beard, heavy-lidded eyes
  shape(ctx, [[738, 380], [752, 372], [762, 420], [750, 438], [736, 420]], T.face) // ear
  shape(ctx, [[908, 378], [926, 372], [930, 410], [914, 425]], T.face)
  shape(ctx, [[750, 300], [762, 258], [802, 230], [870, 228], [905, 258], [912, 320], [910, 420], [890, 480], [850, 505], [800, 500], [765, 460], [750, 400]], T.face)
  shape(ctx, [[745, 335], [750, 270], [790, 232], [860, 220], [906, 244], [916, 300], [906, 330], [882, 288], [830, 272], [790, 292], [772, 330], [762, 385]], '#8893a0', null)
  for (const s of [[[790, 250], [820, 240], [850, 245]], [[830, 262], [860, 256], [890, 268]], [[760, 300], [775, 280]]]) ink(ctx, s, 3.5)
  shape(ctx, [[766, 420], [800, 440], [830, 432], [870, 440], [906, 420], [900, 470], [870, 500], [830, 516], [790, 505], [768, 470]], '#8893a0', null)
  ink(ctx, [[760, 430], [770, 480], [800, 506], [835, 518], [872, 502], [900, 470], [908, 425]], 5)
  ink(ctx, [[796, 452], [820, 440], [846, 446], [870, 440], [890, 454]], 7) // moustache
  ink(ctx, [[782, 350], [800, 346], [816, 350]], 5)
  ink(ctx, [[852, 352], [868, 350], [884, 356]], 5)
  ctx.fillStyle = K.ink
  for (const [x, y] of [[800, 372], [866, 376]]) {
    ctx.beginPath()
    ctx.ellipse(x, y, 4, 7, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ink(ctx, [[846, 366], [849, 408], [838, 428], [852, 432]], 5) // nose

  // his right arm: sleeve bending up to the hand that holds his phone
  poly(ctx, [[640, 650], [690, 720], [790, 790], [845, 820], [835, 860], [680, 975], [615, 985], [612, 800]], T.suit, 0)
  ink(ctx, [[615, 985], [676, 975], [840, 852]], 6)
  ink(ctx, [[682, 722], [790, 792]], 5)
  ctx.save()
  ctx.translate(872, 700)
  ctx.rotate(0.15)
  ctx.beginPath()
  ctx.roundRect(-36, -84, 72, 168, 18)
  ctx.fillStyle = '#c7c7c7'
  ctx.fill()
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 6
  ctx.stroke()
  ctx.restore()
  shape(ctx, [[792, 704], [842, 692], [892, 704], [898, 762], [872, 800], [832, 812], [798, 792], [786, 744]], T.face)
  for (const y of [722, 748, 772]) ink(ctx, [[852, y], [896, y - 4]], 4.5)
  poly(ctx, [[790, 780], [840, 812], [832, 848], [786, 822]], T.suit, 5) // cuff
}

// Mira in a striped cardigan and big blue headphones, eyes on her phone.
function mira(ctx, t) {
  const blink = t % 4.3 < 0.12
  // cardigan and collar
  const cardigan = [[230, 1150], [240, 900], [280, 820], [360, 780], [540, 780], [610, 820], [640, 900], [650, 1150]]
  shape(ctx, cardigan, T.sweater)
  ctx.save()
  shape(ctx, cardigan, null, null)
  ctx.clip()
  const r = rng(311)
  for (let x = 240; x < 650; x += 22) {
    ink(ctx, [[x + r() * 6, 800], [x - 4 + r() * 6, 960], [x + r() * 6, 1150]], 4)
  }
  ctx.restore()
  shape(ctx, cardigan, null)
  // white shirt between the cardigan's fronts, with a pointed collar
  poly(ctx, [[380, 790], [500, 790], [514, 1010], [370, 1010]], '#ffffff', 0)
  ink(ctx, [[380, 800], [374, 900], [370, 1005]], 6) // cardigan fronts
  ink(ctx, [[500, 800], [510, 900], [516, 1005]], 6)
  ink(ctx, [[438, 830], [438, 1005]], 5) // button placket
  ink(ctx, [[404, 880], [412, 900]], 4) // creases
  ink(ctx, [[462, 872], [456, 896]], 4)
  // bag strap over her right shoulder
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 16
  ctx.beginPath()
  ctx.moveTo(548, 790)
  ctx.lineTo(572, 1150)
  ctx.stroke()
  // neck and face
  shape(ctx, [[398, 745], [476, 745], [480, 800], [396, 800]], '#ffffff', null)
  ink(ctx, [[400, 752], [398, 798]], 6)
  ink(ctx, [[474, 748], [476, 796]], 6)
  poly(ctx, [[396, 788], [440, 824], [412, 856]], '#ffffff', 6)
  poly(ctx, [[480, 788], [440, 824], [468, 856]], '#ffffff', 6)
  shape(ctx, [[365, 636], [510, 636], [512, 700], [505, 735], [470, 756], [420, 763], [385, 749], [368, 720]], '#ffffff', null)
  ctx.strokeStyle = K.ink // jaw: a smooth, rounded curve
  ctx.lineWidth = 7
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(372, 742)
  ctx.bezierCurveTo(394, 766, 486, 768, 510, 736)
  ctx.stroke()
  // hair: a dark mop with a heavy fringe
  // hair around her face, falling in long strands past her jaw
  const hair = [
    [310, 700], [312, 580], [360, 500], [440, 470], [520, 490], [575, 560], [592, 650],
    [596, 740], [590, 790, 's'], [570, 770], [556, 796, 's'], [540, 766], [522, 700], [524, 640],
    [376, 640], [372, 700], [356, 770], [340, 800, 's'], [330, 772], [314, 796, 's'], [306, 760],
  ]
  shape(ctx, hair, '#0f0f0f', null)
  for (const x of [330, 350, 540, 560, 578]) ink(ctx, [[x, 660], [x + 2, 720], [x - 2, 780]], 3, '#3a3a3a')
  // fringe: uneven strands down to her eyebrows
  shape(ctx, [[350, 560], [420, 528], [520, 540], [560, 600], [524, 640], [376, 640]], '#0f0f0f', null)
  const lengths = [18, 28, 14, 30, 22, 16, 32, 24, 16, 28]
  lengths.forEach((len, i) => {
    const x = 382 + i * 15
    ink(ctx, [[x, 600], [x + 2, 630], [x + 4, 630 + len * 0.6], [x + 6, 630 + len]], 11, '#0f0f0f')
  })
  // strand lines in the hair above the fringe (they stop before her face)
  for (let i = 0; i < 12; i++) {
    const x = 330 + i * 22
    ink(ctx, [[x, 520], [x - 4, 570], [x - 6, 620]], 3, '#3a3a3a')
  }
  // eyes: two small upright ovals; a hooked nose; a small round mouth
  if (blink) {
    ink(ctx, [[382, 670], [398, 671]], 5)
    ink(ctx, [[482, 670], [498, 671]], 5)
  } else {
    ctx.fillStyle = K.ink
    for (const x of [390, 490]) {
      ctx.beginPath()
      ctx.ellipse(x, 668, 5, 10, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ink(ctx, [[441, 662], [439, 688], [430, 696], [436, 704], [447, 701]], 6)
  ctx.fillStyle = K.ink
  ctx.beginPath()
  ctx.ellipse(440, 723, 8, 4.5, 0, 0, Math.PI * 2)
  ctx.fill()
  // headphones: a band over her head and two cups
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 24
  ctx.beginPath()
  ctx.ellipse(446, 640, 136, 168, 0, Math.PI * 1.02, Math.PI * 1.98)
  ctx.stroke()
  ctx.strokeStyle = T.blue
  ctx.lineWidth = 13
  ctx.stroke()
  shape(ctx, [[306, 604], [330, 600], [334, 712], [308, 716]], T.blue)
  shape(ctx, [[558, 594], [580, 598], [578, 704], [556, 700]], T.blue)
  // cord down to her phone
  ctx.strokeStyle = T.blue
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(320, 716)
  ctx.quadraticCurveTo(330, 860, 380, 975)
  ctx.stroke()
  // phone held in both hands
  ctx.beginPath()
  ctx.roundRect(392, 912, 92, 92, 16)
  ctx.fillStyle = T.blue
  ctx.fill()
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 8
  ctx.stroke()
  ctx.strokeStyle = '#7cc0e2'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(404, 930)
  ctx.lineTo(472, 930)
  ctx.stroke()
  poly(ctx, [[350, 1004], [366, 978], [394, 964], [410, 978], [404, 1004]], '#ffffff', 6)
  ink(ctx, [[372, 990], [396, 984]], 4)
  poly(ctx, [[474, 1004], [478, 972], [500, 966], [514, 990], [506, 1004]], '#ffffff', 6)
}

// ---------- the feed ----------

// Posts are drawn in hot-pink line over pink and green, inside a w x h box.
const L = (ctx, pts, w = 5) => ink(ctx, pts, w, T.pink)
function fillPink(ctx, pts, fill) {
  shape(ctx, pts, fill, T.pink, 5)
}

const POST_ART = [
  // two friends cheek to cheek, taking a selfie
  (ctx, w, h) => {
    ctx.fillStyle = T.green
    ctx.fillRect(0, h * 0.5, w, h)
    // her friend on the left: pink skin, short hair
    fillPink(ctx, [[60, 90], [170, 50], [280, 90], [290, 220], [240, 300], [140, 310], [70, 240]], T.pinkFill)
    fillPink(ctx, [[40, 110], [120, 20], [260, 10], [320, 80], [280, 110], [180, 80], [80, 150]], '#ffffff')
    L(ctx, [[130, 170], [150, 166]], 7)
    L(ctx, [[220, 170], [240, 166]], 7)
    fillPink(ctx, [[150, 230], [230, 226], [200, 262], [170, 262]], '#ffffff')
    // the other, white skin, long pink hair falling on her shoulders
    fillPink(ctx, [[300, 60], [430, 40], [560, 110], [590, 300], [540, 380], [500, 250], [320, 150]], T.pinkFill)
    fillPink(ctx, [[300, 110], [400, 80], [500, 120], [510, 250], [440, 320], [340, 300], [290, 200]], '#ffffff')
    L(ctx, [[360, 180], [380, 176]], 7)
    L(ctx, [[450, 180], [470, 176]], 7)
    fillPink(ctx, [[370, 240], [450, 236], [430, 262], [390, 262]], '#ffffff')
    // an arm around her shoulders, and a hand in front
    fillPink(ctx, [[0, 300], [140, 290], [300, 330], [300, 380], [120, 360], [0, 380]], '#ffffff')
    fillPink(ctx, [[180, 330], [250, 300], [290, 340], [260, 400], [180, 400]], '#ffffff')
    L(ctx, [[200, 340], [250, 330]])
    L(ctx, [[200, 362], [256, 352]])
  },
  // birthday cake
  (ctx, w, h) => {
    ctx.fillStyle = T.pinkFill
    ctx.fillRect(0, 0, w, h)
    fillPink(ctx, [[120, 220], [480, 220], [480, 380], [120, 380]], '#ffffff')
    fillPink(ctx, [[120, 220], [480, 220], [470, 270], [400, 250], [330, 280], [260, 250], [190, 280], [120, 260]], T.green)
    for (const x of [200, 300, 400]) {
      fillPink(ctx, [[x - 10, 150], [x + 10, 150], [x + 10, 220], [x - 10, 220]], '#ffffff')
      fillPink(ctx, [[x, 110], [x + 12, 136], [x, 148], [x - 12, 136]], T.pinkFill)
    }
    ctx.fillStyle = T.green
    ctx.fillRect(0, 380, w, 80)
  },
  // a dog in the park
  (ctx, w, h) => {
    ctx.fillStyle = T.green
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, 150)
    fillPink(ctx, [[160, 220], [400, 210], [440, 330], [380, 380], [180, 380], [140, 300]], '#ffffff')
    fillPink(ctx, [[360, 120], [470, 110], [510, 200], [460, 260], [370, 250], [340, 190]], '#ffffff')
    fillPink(ctx, [[350, 130], [380, 90], [400, 160]], T.pinkFill)
    fillPink(ctx, [[470, 120], [500, 80], [505, 160]], T.pinkFill)
    L(ctx, [[400, 170], [408, 172]], 9)
    L(ctx, [[450, 170], [458, 172]], 9)
    fillPink(ctx, [[418, 200], [440, 200], [430, 214]], T.pink)
    L(ctx, [[150, 260], [110, 220], [100, 180]], 7)
  },
  // beach and sun
  (ctx, w) => {
    ctx.fillStyle = T.pinkFill
    ctx.fillRect(0, 0, w, 250)
    ctx.fillStyle = T.green
    ctx.fillRect(0, 250, w, 100)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 350, w, 90)
    fillPink(ctx, [[260, 110], [340, 110], [360, 190], [300, 230], [240, 190]], '#ffffff')
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      L(ctx, [[300 + Math.cos(a) * 90, 170 + Math.sin(a) * 90], [300 + Math.cos(a) * 120, 170 + Math.sin(a) * 120]])
    }
    L(ctx, [[0, 250], [w, 250]])
    L(ctx, [[60, 300], [140, 296]])
    L(ctx, [[380, 310], [470, 306]])
    L(ctx, [[0, 350], [w, 350]])
  },
  // latte art
  (ctx, w, h) => {
    ctx.fillStyle = T.green
    ctx.fillRect(0, 0, w, h)
    fillPink(ctx, [[150, 90], [450, 90], [470, 250], [420, 380], [180, 380], [130, 250]], '#ffffff')
    fillPink(ctx, [[190, 120], [410, 120], [420, 230], [300, 280], [180, 230]], T.pinkFill)
    fillPink(ctx, [[300, 150], [340, 170], [340, 210], [300, 250], [260, 210], [260, 170]], '#ffffff')
    L(ctx, [[460, 180], [540, 190], [540, 280], [440, 300]], 7)
  },
  // a cat asleep in the sun
  (ctx, w, h) => {
    ctx.fillStyle = T.pinkFill
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 300, w, 140)
    fillPink(ctx, [[120, 260], [400, 220], [480, 290], [460, 360], [160, 380], [100, 320]], T.green)
    fillPink(ctx, [[380, 180], [480, 170], [510, 250], [470, 300], [390, 300], [360, 240]], T.green)
    fillPink(ctx, [[385, 190], [400, 140], [430, 180]], T.green)
    fillPink(ctx, [[460, 175], [490, 130], [500, 200]], T.green)
    L(ctx, [[405, 245], [425, 250]])
    L(ctx, [[455, 245], [475, 250]])
    L(ctx, [[120, 330], [60, 360], [40, 300]], 7)
  },
]

function post(ctx, i, y) {
  ctx.save()
  ctx.translate(PHOTO.x, y)
  ctx.beginPath()
  ctx.rect(0, 0, PHOTO.w, PHOTO.h)
  ctx.save()
  ctx.clip()
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, PHOTO.w, PHOTO.h)
  POST_ART[i % POST_ART.length](ctx, PHOTO.w, PHOTO.h)
  ctx.restore()
  ctx.strokeStyle = T.pink
  ctx.lineWidth = 8
  ctx.strokeRect(0, 0, PHOTO.w, PHOTO.h)
  ctx.restore()
}

function heartPath(ctx, x, y, s) {
  ctx.beginPath()
  ctx.moveTo(x, y + 36 * s)
  ctx.bezierCurveTo(x - 60 * s, y - 4 * s, x - 36 * s, y - 50 * s, x, y - 22 * s)
  ctx.bezierCurveTo(x + 36 * s, y - 50 * s, x + 60 * s, y - 4 * s, x, y + 36 * s)
  ctx.closePath()
}

// Repost icon: two curved arrows chasing each other, white with an ink outline.
function shareIcon(ctx, x, y) {
  ctx.save()
  ctx.translate(x, y)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const flip of [1, -1]) {
    ctx.save()
    ctx.scale(flip, flip)
    // the curved shaft, drawn as a thick ink stroke with a white core
    const shaft = () => {
      ctx.beginPath()
      ctx.moveTo(-40, 6)
      ctx.quadraticCurveTo(-42, -30, -8, -30)
      ctx.lineTo(14, -30)
    }
    shaft()
    ctx.strokeStyle = K.ink
    ctx.lineWidth = 24
    ctx.stroke()
    // arrowhead
    ctx.beginPath()
    ctx.moveTo(10, -54)
    ctx.lineTo(44, -30)
    ctx.lineTo(10, -6)
    ctx.closePath()
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.lineWidth = 6
    ctx.stroke()
    shaft()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 12
    ctx.stroke()
    ctx.restore()
  }
  ctx.restore()
}

function feed(ctx, index, scroll, liked, t) {
  const { x, y, w, h } = PANEL
  ctx.save()
  // phone body: pale blue frame with a white screen
  ctx.fillStyle = T.frame
  ctx.fillRect(x, y, w, h)
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.roundRect(x + 33, y - 40, w - 66, h + 10 - 30, 26)
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.roundRect(x + 33, y - 40, w - 66, h + 10 - 30, 26)
  ctx.clip()
  // the current post and the next one below it, scrolling up together
  const gap = 720
  const py = y - 40 - scroll * gap
  for (const k of [0, 1]) {
    const top = py + k * gap
    post(ctx, index + k, top)
    const pop = k === 0 && liked ? 1 + 0.25 * Math.max(0, 1 - (t - liked) / 0.25) : 1
    shareIcon(ctx, SHARE.x, top + 510)
    heartPath(ctx, HEART.x, top + 500, 0.95 * pop)
    ctx.fillStyle = k === 0 && liked ? T.bar : T.heart
    ctx.fill()
    ctx.strokeStyle = K.ink
    ctx.lineWidth = 8
    ctx.stroke()
  }
  ctx.restore()
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 8
  ctx.strokeRect(x, y, w, h)
}

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
  ctx.fillStyle = T.bar
  const fx = x + 48 + (w - 48) * p
  ctx.fillRect(x, y, fx - x, h)
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(fx, y)
  ctx.lineTo(fx, y + h)
  ctx.stroke()
  ctx.restore()
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, h / 2)
  ctx.stroke()
}

// ---------- the page ----------

export default function commute(api) {
  const PAN_TIME = 1.4
  let index = 0 // which post is showing
  let likedAt = null // when the current post was liked (it then scrolls away)
  let liked = 0
  let doneAt = null
  const top = () => sheetTop(api.height())
  const toScreen = (x, y) => [x * 0.6, (y - top()) * 0.6]
  const toSheet = (x, y) => [x / 0.6, y / 0.6 + top()]
  const panOut = (t) => (doneAt === null ? 0 : easeInOut((t - doneAt - 0.9) / 1.6) * PANEL_X)
  const tickStart = () => doneAt + 2.6
  const minuteAt = (t) => Math.min(TO, FROM + Math.max(0, Math.floor((t - tickStart()) / TICK)))
  const countDone = (t) => doneAt !== null && t > tickStart() + (TO - FROM) * TICK + 0.4
  const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}${String(m % 60).padStart(2, '0')}`
  const scrollAt = (t) => (likedAt === null ? 0 : easeInOut((t - likedAt - 0.35) / 0.45))

  return {
    tall: true,
    debug: () => ({ heart: toScreen(HEART.x, HEART.y), liked, done: doneAt !== null }),
    draw(ctx, t) {
      const h = api.height()
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, h)
      // once a liked post has scrolled away, the next one is current
      if (likedAt !== null && scrollAt(t) >= 1) {
        index += 1
        likedAt = null
      }
      const offset = (1 - easeInOut(t / PAN_TIME)) * PAN - panOut(t)
      ctx.save()
      ctx.scale(0.6, 0.6)
      ctx.translate(offset, -top())

      // the train, cut off with a torn bottom edge
      ctx.save()
      const r = rng(321)
      ctx.beginPath()
      ctx.moveTo(-40, 0)
      ctx.lineTo(1070, 0)
      for (let x = 1070; x >= -40; x -= 18) ctx.lineTo(x, 1390 + (r() - 0.5) * 22)
      ctx.closePath()
      ctx.clip()
      carriage(ctx)
      manLeft(ctx)
      manRight(ctx)
      mira(ctx, t)
      ctx.restore()
      bar(ctx, liked / POSTS)
      feed(ctx, index, scrollAt(t), likedAt, t)

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
        bigDisplay(ctx, hhmm(m), m < TO && tick > 0 ? 3 : -1, m < TO && tick > 0 ? tick % 1 : 0)
        ctx.restore()
      }

      // the 08:02 clock we're panning away from, to the left
      if (offset > 0) {
        const bottom = top() + h / 0.6
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(-PAN - 40, top(), PAN + 30, bottom - top())
        border(ctx, -25, top(), bottom)
        ctx.save()
        ctx.translate(-PAN, 0)
        bigDisplay(ctx, '0802', -1, 0)
        ctx.restore()
      }
      ctx.restore()

      if (t > PAN_TIME + 1 && liked === 0 && likedAt === null) {
        const [x, y] = toScreen(HEART.x, HEART.y)
        tapHint(ctx, x, y, t, K.ink)
      }
      if (countDone(t)) tapHint(ctx, 50, 50, t)
    },
    down(x, y, t) {
      if (doneAt !== null) {
        if (countDone(t)) api.finish()
        return
      }
      if (t < PAN_TIME || likedAt !== null) return
      const [sx, sy] = toSheet(x, y)
      const onHeart = Math.hypot(sx - HEART.x, sy - HEART.y) < 90
      const onShare = Math.hypot(sx - SHARE.x, sy - SHARE.y) < 90
      if (!onHeart && !onShare) return
      likedAt = t
      liked = Math.min(POSTS, liked + 1)
      pop(520 + liked * 40)
      if (liked >= POSTS) doneAt = t
    },
  }
}

