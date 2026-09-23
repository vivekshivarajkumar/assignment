// Chapter 1, page 5 · Mum calls
// The camera pans on from the 02:29 clock to her phone, ringing: an incoming
// call from Mum. Tap the blue button to answer or the red one to decline.
// Traced on the same 900 x 2000 phone sheet as the other pages.
import { W, FONT, tapHint, easeInOut } from '../paint.js'
import { tone } from '../sound.js'
import { K, ink, shape, bigDisplay, sheetTop } from './ch01-wake.js'

const P = {
  case: '#53a5ce',
  bezel: '#474847',
  photo: '#c6d5df',
  hair: '#7e8695',
  lens: '#c6d5df',
  top: '#2a2222',
  red: '#ff3636',
  blue: '#6fd2fb',
}

const PAN = 1076 // the clock close-up sits this far to the left
const CENTRE = [444, 1030] // the phone body, turned slightly clockwise
const TILT = 0.024
const SCREEN = [[199, 549], [730, 567], [699, 1492], [167, 1480]]
const DECLINE = { x: 318, y: 1282, r: 74 }
const ANSWER = { x: 564, y: 1290, r: 72 }

function poly(ctx, pts, fill, width = 6) {
  ctx.beginPath()
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.closePath()
  if (fill) {
    ctx.fillStyle = fill
    ctx.fill()
  }
  if (width) {
    ctx.strokeStyle = K.ink
    ctx.lineWidth = width
    ctx.lineJoin = 'round'
    ctx.stroke()
  }
}

// Smooth ink stroke through points (curves through midpoints, no corners).
function curve(ctx, pts, width = 5) {
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

// Phone body: blue case, dark bezel, earpiece slot.
function body(ctx) {
  ctx.save()
  ctx.translate(...CENTRE)
  ctx.rotate(TILT)
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.roundRect(-322, -620, 644, 1240, 78)
  ctx.fillStyle = P.case
  ctx.fill()
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 7
  ctx.stroke()
  ctx.beginPath()
  ctx.roundRect(-306, -604, 612, 1208, 66)
  ctx.fillStyle = P.bezel
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.roundRect(-66, -540, 132, 26, 13)
  ctx.lineWidth = 6
  ctx.stroke()
  ctx.restore()
}

// Mum's photo: grey bob parted in the middle, thick glasses, dark top.
function photo(ctx) {
  const frame = [[297, 662], [627, 672], [617, 1003], [302, 997]]
  poly(ctx, frame, P.photo, 0)
  ctx.save()
  poly(ctx, frame, null, 0)
  ctx.clip()
  // hair behind her face: a bob down to her jaw
  shape(ctx, [[322, 925], [318, 850], [330, 780], [362, 724], [410, 696], [456, 692], [506, 708], [546, 748], [566, 810], [572, 880], [568, 930], [450, 935]], P.hair, null)
  // neck with pale shadow, and her dark top over a white collar
  shape(ctx, [[400, 880], [476, 880], [482, 952], [396, 952]], '#ffffff', null)
  ink(ctx, [[402, 905], [398, 950]], 5)
  ink(ctx, [[474, 905], [480, 950]], 5)
  for (const x of [420, 446]) ink(ctx, [[x, 930], [x + 1, 952]], 6, P.photo)
  poly(ctx, [[290, 1010], [300, 990], [340, 968], [380, 956], [400, 946], [440, 966], [480, 946], [502, 955], [560, 968], [606, 988], [630, 1010]], P.top, 6)
  shape(ctx, [[396, 948], [440, 970], [484, 948], [480, 978], [440, 992], [400, 978]], '#ffffff', K.ink, 5)
  ink(ctx, [[367, 960], [360, 1000]], 5) // folds of her top
  ink(ctx, [[520, 960], [530, 1000]], 5)
  // face: a rounded oval with a soft, wide chin
  ctx.beginPath()
  ctx.moveTo(372, 760)
  ctx.bezierCurveTo(372, 720, 520, 720, 524, 760)
  ctx.bezierCurveTo(530, 830, 530, 880, 500, 906)
  ctx.bezierCurveTo(470, 926, 420, 926, 396, 906)
  ctx.bezierCurveTo(366, 880, 368, 830, 372, 760)
  ctx.closePath()
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(376, 866)
  ctx.bezierCurveTo(380, 890, 410, 920, 450, 920)
  ctx.bezierCurveTo(490, 920, 516, 892, 522, 866)
  ctx.stroke()
  // hair falling past her cheeks, parted in the middle at the top
  shape(ctx, [[380, 730], [420, 706], [390, 770], [376, 850], [380, 922], [334, 926], [326, 850], [344, 780]], P.hair, null)
  shape(ctx, [[516, 730], [476, 706], [508, 770], [522, 850], [518, 922], [562, 926], [568, 850], [552, 780]], P.hair, null)
  curve(ctx, [[322, 925], [318, 850], [330, 780], [362, 724], [410, 696], [456, 692], [506, 708], [546, 748], [566, 810], [572, 880], [568, 930]], 6)
  // strands: from the parting down both sides, and loose ends along the bottom
  for (const s of [
    [[446, 700], [410, 712], [382, 748], [370, 800]], [[452, 700], [490, 712], [516, 748], [526, 800]],
    [[430, 700], [390, 720], [360, 770], [346, 850], [344, 920]], [[468, 700], [510, 722], [540, 776], [552, 850], [552, 922]],
    [[410, 706], [370, 740], [346, 800], [336, 880]], [[488, 706], [530, 740], [554, 800], [560, 880]],
    [[360, 860], [362, 928]], [[540, 860], [538, 928]], [[334, 880], [336, 926]], [[566, 880], [564, 926]],
  ]) curve(ctx, s, 4.5)
  // glasses: two rounded frames, a bridge, arms back to her hair
  for (const [x, y, w, h] of [[380, 790, 66, 47], [458, 794, 69, 46]]) {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, 10)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = K.ink
    ctx.lineWidth = 6.5
    ctx.stroke()
    ink(ctx, [[x + 16, y + 30], [x + 30, y + 14]], 5, P.lens)
    ink(ctx, [[x + 30, y + 34], [x + 42, y + 22]], 5, P.lens)
  }
  ink(ctx, [[446, 806], [458, 806]], 7)
  ink(ctx, [[372, 800], [380, 802]], 7)
  ink(ctx, [[527, 806], [536, 804]], 7)
  ink(ctx, [[440, 838], [436, 850], [446, 852]], 5) // nose
  ink(ctx, [[440, 878], [458, 877]], 6) // mouth
  ctx.restore()
  poly(ctx, frame, null, 6)
}

function button(ctx, { x, y, r }, fill, k) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(k, k)
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 7
  ctx.stroke()
  ctx.restore()
}

// Handset icon: a curved bar with an ear and a mouth piece, white with ink.
function handset(ctx, x, y, angle) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.scale(1.3, 1.3)
  ctx.beginPath()
  ctx.moveTo(-36, 6)
  ctx.quadraticCurveTo(-38, -18, -20, -20)
  ctx.lineTo(20, -20)
  ctx.quadraticCurveTo(38, -18, 36, 6)
  ctx.lineTo(22, 8)
  ctx.lineTo(18, -4)
  ctx.lineTo(-18, -4)
  ctx.lineTo(-22, 8)
  ctx.closePath()
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.strokeStyle = K.ink
  ctx.lineWidth = 5
  ctx.lineJoin = 'round'
  ctx.stroke()
  ctx.restore()
}

export default function mumCalls(api) {
  const PAN_TIME = 1.6
  let lastRing = 0
  let answeredAt = null
  const top = () => sheetTop(api.height())
  const toSheet = (x, y) => [x / 0.6, y / 0.6 + top()]
  const toScreen = (x, y) => [x * 0.6, (y - top()) * 0.6]
  const inside = (b, x, y) => Math.hypot(x - b.x, y - b.y) < b.r + 18

  return {
    tall: true,
    debug: () => ({ answer: toScreen(ANSWER.x, ANSWER.y), decline: toScreen(DECLINE.x, DECLINE.y) }),
    draw(ctx, t) {
      const h = api.height()
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, h)
      const offset = (1 - easeInOut(t / PAN_TIME)) * PAN
      const ringing = t > PAN_TIME && answeredAt === null
      // the phone buzzes in short bursts
      const burst = ringing && (t - PAN_TIME) % 1.4 < 0.7
      const buzz = burst ? Math.sin(t * 90) * 4 : 0
      if (burst && t - lastRing > 0.35) {
        lastRing = t
        tone(880, 0.25, { type: 'sine', gain: 0.06 })
        tone(1175, 0.25, { type: 'sine', gain: 0.04 })
      }
      ctx.save()
      ctx.scale(0.6, 0.6)
      ctx.translate(offset + buzz, -top())

      body(ctx)
      poly(ctx, SCREEN, '#ffffff', 7)
      photo(ctx)
      ctx.save()
      ctx.translate(450, 1046)
      ctx.rotate(0.015)
      ctx.fillStyle = K.ink
      ctx.font = `74px ${FONT}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Mum', 0, 0)
      ctx.strokeStyle = K.ink
      ctx.lineWidth = 2.5
      ctx.strokeText('Mum', 0, 0)
      ctx.restore()
      const pulse = ringing ? 1 + 0.04 * Math.max(0, Math.sin(t * 6)) : 1
      button(ctx, DECLINE, P.red, 1)
      handset(ctx, DECLINE.x, DECLINE.y - 6, 0)
      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = K.ink
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(DECLINE.x - 10, DECLINE.y + 16)
      ctx.lineTo(DECLINE.x + 10, DECLINE.y + 16)
      ctx.lineTo(DECLINE.x, DECLINE.y + 30)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      button(ctx, ANSWER, P.blue, pulse)
      handset(ctx, ANSWER.x, ANSWER.y, -2.3)

      // the 02:29 clock we're panning away from, to the left
      if (offset > 0) {
        ctx.save()
        ctx.translate(-PAN, 0)
        bigDisplay(ctx, '0229', -1, 0)
        ctx.restore()
      }
      ctx.restore()

      if (ringing && t > PAN_TIME + 2) {
        const [x, y] = toScreen(ANSWER.x, ANSWER.y)
        tapHint(ctx, x, y - 60, t, K.ink)
      }
    },
    down(x, y, t) {
      if (t < PAN_TIME || answeredAt !== null) return
      const [sx, sy] = toSheet(x, y)
      const choice = inside(ANSWER, sx, sy) ? 'answered' : inside(DECLINE, sx, sy) ? 'declined' : null
      if (!choice) return
      answeredAt = t
      api.memory.mumCall = choice
      tone(choice === 'answered' ? 660 : 330, 0.2, { type: 'sine', gain: 0.08 })
      api.finish(choice)
    },
  }
}

