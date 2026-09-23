// Studio intro, two cards:
//  1. developer card: a cut-paper owl emblem with hand-cut lettering, fading in and out
//  2. publisher card: a big letter snaps into focus out of a horizontal motion blur,
//     then the studio name and a letter-spaced line fade in underneath.
import { W, H, rng, clamp, easeOut, easeInOut } from './paint.js'

const DEVELOPER = 'PAPER OWL'
const STUDIO = { letter: 'M', name: 'MIRA', line: 'INTERACTIVE' }
const OWL_CARD = 3.3 // seconds the developer card lasts
const SANS = "'Montserrat', 'Helvetica Neue', Arial, sans-serif"
const INK = '#0d0d0d'

const LETTER_Y = 450 // centre of the big letter
const LETTER_SIZE = 300
const NAME_Y = 610
const LINE_Y = 652

// The letter is drawn once per frame onto its own canvas, then copied onto the
// page in thin horizontal strips, each strip shifted sideways by its own amount.
const glyph = document.createElement('canvas')
glyph.width = W
glyph.height = 340

function drawGlyph() {
  const g = glyph.getContext('2d')
  g.clearRect(0, 0, glyph.width, glyph.height)
  g.fillStyle = INK
  g.font = `600 ${LETTER_SIZE}px ${SANS}`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(STUDIO.letter, W / 2, glyph.height / 2 + 12)
}

const STRIP = 3
const shifts = (() => {
  const r = rng(21)
  return Array.from({ length: Math.ceil(glyph.height / STRIP) }, () => r() * 2 - 1)
})()

// blur: 0 = sharp, 1 = fully smeared
function drawSmearedGlyph(ctx, blur, alpha) {
  const top = LETTER_Y - glyph.height / 2
  const ghosts = blur > 0.01 ? 5 : 1
  ctx.save()
  for (let k = 0; k < ghosts; k++) {
    // each ghost copy is pushed further along the smear, fainter
    const spread = ghosts === 1 ? 0 : (k / (ghosts - 1) - 0.5) * 2
    ctx.globalAlpha = alpha * (ghosts === 1 ? 1 : 0.34)
    for (let i = 0; i < shifts.length; i++) {
      const sy = i * STRIP
      const dx = (shifts[i] * 26 + spread * 34) * blur
      ctx.drawImage(glyph, 0, sy, W, STRIP, dx, top + sy, W, STRIP)
    }
  }
  ctx.restore()
}

function spaced(ctx, str, x, y, spacing) {
  const widths = [...str].map((ch) => ctx.measureText(ch).width)
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (str.length - 1)
  let cx = x - total / 2
  ;[...str].forEach((ch, i) => {
    ctx.fillText(ch, cx, y)
    cx += widths[i] + spacing
  })
}

// ---------- developer card ----------

// Emblem and wordmark are painted onto their own canvas, then copied in thin
// strips with a tiny sideways jitter so every edge looks cut with scissors.
const cut = document.createElement('canvas')
cut.width = W
cut.height = 560
const CUT_TOP = 180

function leaf(g, x, y, angle, len) {
  g.save()
  g.translate(x, y)
  g.rotate(angle)
  g.fillStyle = INK
  g.beginPath()
  g.moveTo(0, 0)
  g.quadraticCurveTo(len * 0.5, -len * 0.38, len, 0)
  g.quadraticCurveTo(len * 0.5, len * 0.38, 0, 0)
  g.fill()
  g.strokeStyle = '#fff'
  g.lineWidth = 2.5
  g.beginPath()
  g.moveTo(len * 0.18, 0)
  g.lineTo(len * 0.72, 0)
  g.stroke()
  g.restore()
}

function paintOwlCard() {
  const g = cut.getContext('2d')
  g.clearRect(0, 0, cut.width, cut.height)
  const cx = W / 2
  const cy = 250
  g.fillStyle = INK
  g.strokeStyle = INK
  g.lineCap = 'round'
  g.lineJoin = 'round'

  // branch with leaves at both ends
  g.lineWidth = 15
  g.beginPath()
  g.moveTo(cx - 185, cy + 122)
  g.quadraticCurveTo(cx, cy + 102, cx + 185, cy + 128)
  g.stroke()
  leaf(g, cx - 180, cy + 118, -2.5, 46)
  leaf(g, cx - 150, cy + 116, 2.3, 38)
  leaf(g, cx + 180, cy + 126, -0.6, 46)
  leaf(g, cx + 150, cy + 124, 0.8, 38)

  // body and ear tufts
  g.beginPath()
  g.ellipse(cx, cy + 8, 84, 112, 0, 0, Math.PI * 2)
  g.fill()
  for (const d of [-1, 1]) {
    g.beginPath()
    g.moveTo(cx + d * 82, cy - 50)
    g.lineTo(cx + d * 78, cy - 142)
    g.lineTo(cx + d * 18, cy - 96)
    g.closePath()
    g.fill()
  }

  // eyes, beak
  g.fillStyle = '#fff'
  for (const d of [-1, 1]) {
    g.beginPath()
    g.arc(cx + d * 36, cy - 36, 29, 0, Math.PI * 2)
    g.fill()
  }
  g.fillStyle = INK
  for (const d of [-1, 1]) {
    g.beginPath()
    g.arc(cx + d * 36, cy - 32, 12, 0, Math.PI * 2)
    g.fill()
  }
  g.fillStyle = '#fff'
  g.beginPath()
  g.moveTo(cx - 11, cy - 10)
  g.lineTo(cx + 11, cy - 10)
  g.lineTo(cx, cy + 16)
  g.closePath()
  g.fill()

  // feather marks: rows of little white seeds
  for (let row = 0; row < 4; row++) {
    const n = 5 - Math.abs(row - 1)
    for (let i = 0; i < n; i++) {
      const x = cx + (i - (n - 1) / 2) * 24
      const y = cy + 36 + row * 26
      g.beginPath()
      g.ellipse(x, y, 3.5, 9, 0, 0, Math.PI * 2)
      g.fill()
    }
  }
  // wing cuts
  g.strokeStyle = '#fff'
  g.lineWidth = 4
  for (const d of [-1, 1]) {
    g.beginPath()
    g.arc(cx + d * 30, cy + 40, 58, d < 0 ? Math.PI - 0.2 : -0.75, d < 0 ? Math.PI + 0.75 : 0.2)
    g.stroke()
  }
  // claws gripping the branch
  g.strokeStyle = INK
  g.lineWidth = 7
  for (const d of [-1, 1]) {
    for (const k of [-10, 0, 10]) {
      g.beginPath()
      g.moveTo(cx + d * 28 + k, cy + 108)
      g.lineTo(cx + d * 28 + k * 1.3, cy + 124)
      g.stroke()
    }
  }

  // wordmark: heavy capitals, widely spaced
  g.fillStyle = INK
  g.textBaseline = 'middle'
  g.font = `700 44px ${SANS}`
  const letters = [...DEVELOPER]
  const gap = 14
  const widths = letters.map((ch) => (ch === ' ' ? 26 : g.measureText(ch).width))
  let x = cx - (widths.reduce((a, b) => a + b, 0) + gap * (letters.length - 1)) / 2
  letters.forEach((ch, i) => {
    g.fillText(ch, x, cy + 250)
    x += widths[i] + gap
  })
}

const cutJitter = (() => {
  const r = rng(33)
  return Array.from({ length: Math.ceil(cut.height / 2) }, () => (r() - 0.5) * 2.4)
})()

function drawOwlCard(ctx, t) {
  const a = easeOut(t / 0.6) * (1 - easeInOut((t - OWL_CARD + 0.6) / 0.6))
  paintOwlCard()
  ctx.save()
  ctx.globalAlpha = a
  for (let i = 0; i < cutJitter.length; i++) {
    const sy = i * 2
    ctx.drawImage(cut, 0, sy, W, 2, cutJitter[i], CUT_TOP + sy, W, 2)
  }
  ctx.restore()
}

// ---------- the intro ----------

export default function splash(api) {
  // the animation clock starts once the font is ready (or after 1.5s regardless)
  let start = null
  let ready = false
  Promise.race([
    document.fonts.load(`600 ${LETTER_SIZE}px ${SANS}`),
    new Promise((r) => setTimeout(r, 1500)),
  ]).then(() => (ready = true))

  return {
    draw(ctx, pageT) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, H)
      if (!ready) return
      if (start === null) start = pageT
      if (pageT - start < OWL_CARD) {
        drawOwlCard(ctx, pageT - start)
        return
      }
      const t = pageT - start - OWL_CARD - 0.3
      if (t < 0) return

      // letter: fades in smeared (0–0.4s), comes into focus (0.4–1.5s)
      const out = 1 - easeInOut((t - 3.4) / 0.6)
      const blur = 1 - easeOut(clamp((t - 0.4) / 1.1, 0, 1))
      drawGlyph()
      drawSmearedGlyph(ctx, blur, easeOut(t / 0.4) * out)

      // name and line fade in once the letter is sharp
      const a = easeOut((t - 1.4) / 0.6) * out
      ctx.save()
      ctx.globalAlpha = a
      ctx.fillStyle = INK
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.font = `500 62px ${SANS}`
      spaced(ctx, STUDIO.name, W / 2, NAME_Y, 2)
      ctx.font = `400 19px ${SANS}`
      spaced(ctx, STUDIO.line, W / 2, LINE_Y, 15)
      ctx.restore()

      if (t > 4.1) api.finish()
    },
    // a tap skips the card that's showing
    down(x, y, pageT) {
      if (start === null) return
      if (pageT - start < OWL_CARD) start = pageT - OWL_CARD
      else api.finish()
    },
  }
}
