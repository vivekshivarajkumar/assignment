// Studio intro: a big letter snaps into focus out of a horizontal motion blur,
// then the studio name and a letter-spaced line fade in underneath.
import { W, H, rng, clamp, easeOut, easeInOut } from './paint.js'

const STUDIO = { letter: 'M', name: 'MIRA', line: 'INTERACTIVE' }
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
      const t = pageT - start

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
    down() {
      if (start !== null) api.finish()
    },
  }
}
