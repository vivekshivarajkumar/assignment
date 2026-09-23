// Page model shared by every chapter.
//
// A chapter is { title, pages: [page, ...] }.
// A page is a function (api) => scene, called once when the page opens.
//   api.finish(value?)   ends the page (the stage fades out and opens the next one);
//                        an optional value is passed to the Stage's onDone
//   api.memory     object shared across the whole playthrough (e.g. Mira's painting)
// A scene is an object with:
//   draw(ctx, t, dt)   required; paints the whole frame. t = seconds since the page opened
//   down(x, y, t), move(x, y, t), up(x, y, t)   optional pointer handlers,
//                                               in logical coordinates (W x H)

import { W, paper, caption, tapHint, rng, easeOut } from './paint.js'

export const memory = {}

// A painted panel with an optional caption; tap anywhere to continue.
// draw(ctx, t) paints the picture. Waits `wait` seconds before accepting a tap.
export function vignette(draw, captionText, { wait = 0.8 } = {}) {
  return (api) => ({
    draw(ctx, t) {
      paper(ctx)
      draw(ctx, t)
      caption(ctx, captionText, easeOut((t - 0.3) / 0.6))
      if (t > wait) tapHint(ctx, 50, 50, t)
    },
    down(x, y, t) {
      if (t > wait) api.finish()
    },
  })
}

// Opening card of each chapter: near-black grainy page, "chapter N." underlined
// in a slab serif, the chapter's name below, and a round arrow button to go on.
// Positions are fractions of the screen height, as on a phone.
const SLAB = "'Josefin Slab', Georgia, serif"
const CARD_TEXT = '#f5f5f5'

export function titleCard(act, number, title) {
  const grain = (() => {
    const r = rng(71)
    return Array.from({ length: 900 }, () => [r() * W, r(), 1 + r() * 2])
  })()
  return (api) => {
    const at = (f) => f * api.height()
    const button = () => ({ x: W / 2, y: at(0.786), r: 41 })
    return {
      tall: true,
      debug: () => ({ tap: [button().x, button().y] }),
      draw(ctx, t) {
        const h = api.height()
        ctx.fillStyle = '#020202'
        ctx.fillRect(0, 0, W, h)
        ctx.fillStyle = 'rgba(255,255,255,0.045)'
        for (const [x, fy, s] of grain) ctx.fillRect(x, fy * h, s, s)

        const a = easeOut(t / 0.8)
        ctx.save()
        ctx.globalAlpha = a
        ctx.fillStyle = CARD_TEXT
        ctx.textAlign = 'center'
        ctx.textBaseline = 'alphabetic'
        const label = `chapter ${number}.`
        ctx.font = `600 41px ${SLAB}`
        ctx.fillText(label, W / 2, at(0.232))
        const lw = ctx.measureText(label).width
        ctx.fillRect(W / 2 - lw / 2, at(0.232) + 10, lw, 2.6)
        ctx.font = `600 62px ${SLAB}`
        ctx.fillText(title.toLowerCase(), W / 2, at(0.305))
        ctx.restore()

        // round white button with a hand-drawn arrow
        const k = easeOut((t - 0.6) / 0.5)
        if (k > 0) {
          const { x, y, r } = button()
          const rr = rng(77)
          ctx.save()
          ctx.globalAlpha = k
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          for (let i = 0; i <= 40; i++) {
            const ang = (i / 40) * Math.PI * 2
            const d = r + (rr() - 0.5) * 1.6
            ctx.lineTo(x + Math.cos(ang) * d, y + Math.sin(ang) * d)
          }
          ctx.fill()
          ctx.strokeStyle = '#111111'
          ctx.lineWidth = 4.6
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.beginPath()
          ctx.moveTo(x - 23, y + 1)
          ctx.lineTo(x + 20, y)
          ctx.moveTo(x + 5, y - 15)
          ctx.lineTo(x + 20, y)
          ctx.lineTo(x + 5, y + 15)
          ctx.stroke()
          ctx.restore()
        }
      },
      down(x, y, t) {
        if (t > 0.6) api.finish()
      },
    }
  }
}
