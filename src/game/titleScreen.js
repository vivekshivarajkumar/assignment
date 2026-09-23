import { W, H, C, FONT, paper, blob, text, rng, easeOut } from './paint.js'
import { pop } from './sound.js'

const BG = '#f2b632'
const INK = '#26244a'

// Big profile portrait of Mira, facing right, with her hair in a bun.
function portrait(ctx, t) {
  const sway = Math.sin(t * 0.8) * 3
  ctx.save()
  ctx.translate(0, sway)
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.strokeStyle = INK
  ctx.lineWidth = 4

  // shoulders / shirt
  ctx.fillStyle = C.cream
  ctx.beginPath()
  ctx.moveTo(-20, H + 10)
  ctx.lineTo(-20, 800)
  ctx.quadraticCurveTo(60, 740, 170, 760)
  ctx.quadraticCurveTo(250, 790, 290, H + 10)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  // coat collar
  ctx.fillStyle = C.mira
  ctx.beginPath()
  ctx.moveTo(-20, 820)
  ctx.quadraticCurveTo(60, 770, 120, 790)
  ctx.lineTo(90, H + 10)
  ctx.lineTo(-20, H + 10)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // neck
  ctx.fillStyle = C.skin1
  ctx.beginPath()
  ctx.moveTo(120, 640)
  ctx.lineTo(125, 770)
  ctx.quadraticCurveTo(180, 790, 215, 760)
  ctx.lineTo(205, 640)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // face in profile
  ctx.beginPath()
  ctx.moveTo(90, 470)
  ctx.bezierCurveTo(150, 400, 280, 420, 300, 520)
  ctx.lineTo(302, 540)
  ctx.quadraticCurveTo(330, 560, 318, 575) // nose
  ctx.quadraticCurveTo(305, 585, 300, 590)
  ctx.quadraticCurveTo(302, 615, 292, 628) // lips
  ctx.quadraticCurveTo(290, 660, 250, 680) // chin
  ctx.quadraticCurveTo(200, 700, 150, 680)
  ctx.lineTo(90, 640)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // hair: back mass, fringe and bun
  ctx.fillStyle = INK
  ctx.beginPath()
  ctx.moveTo(40, 700)
  ctx.bezierCurveTo(-10, 560, 30, 420, 150, 410)
  ctx.bezierCurveTo(230, 400, 285, 440, 290, 500)
  ctx.bezierCurveTo(250, 470, 215, 480, 190, 520)
  ctx.bezierCurveTo(175, 560, 180, 600, 150, 640)
  ctx.quadraticCurveTo(110, 690, 40, 700)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(95, 400, 58, 0, Math.PI * 2)
  ctx.fill()
  // hair strands
  ctx.strokeStyle = '#4b4a7a'
  ctx.lineWidth = 3
  const r = rng(4)
  for (let i = 0; i < 12; i++) {
    const x = 60 + r() * 90
    const y = 440 + r() * 170
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo(x - 20, y + 40, x - 30 + r() * 10, y + 70)
    ctx.stroke()
  }

  // ear, eye, smile
  ctx.fillStyle = C.skin2
  ctx.beginPath()
  ctx.ellipse(170, 560, 13, 20, 0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = INK
  ctx.lineWidth = 5
  const blinkT = t % 4.2
  ctx.beginPath()
  if (blinkT < 0.12) {
    ctx.moveTo(250, 522)
    ctx.lineTo(262, 522)
  } else {
    ctx.moveTo(256, 508)
    ctx.lineTo(256, 530)
  }
  ctx.stroke()
  ctx.lineWidth = 3.5
  ctx.beginPath()
  ctx.moveTo(240, 612)
  ctx.quadraticCurveTo(262, 622, 282, 608)
  ctx.stroke()
  // blush
  blob(ctx, 225, 580, 18, 11, C.rose, 5, 0.45)
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
    y: H - 60 - (items.length - 1 - i) * 62,
  }))

  return (api) => {
    let picked = null
    return {
      draw(ctx, t) {
        paper(ctx, BG)
        portrait(ctx, t)
        const a = easeOut(t / 1.2)
        text(ctx, 'mira', W / 2, 190, { size: 150, color: INK, alpha: a })
        for (const row of rows) {
          const isBig = row.key === big
          ctx.save()
          ctx.globalAlpha = a * (picked && picked !== row.key ? 0.4 : 1)
          ctx.font = `${isBig ? 52 : 36}px ${FONT}`
          ctx.fillStyle = INK
          ctx.textAlign = 'right'
          ctx.textBaseline = 'middle'
          ctx.fillText(row.label, W - 40, row.y)
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
