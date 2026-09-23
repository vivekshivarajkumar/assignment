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

import { W, H, FONT, paper, caption, tapHint, text, blob, easeOut } from './paint.js'

export const memory = {}

// A painted panel with an optional caption; tap anywhere to continue.
// draw(ctx, t) paints the picture. Waits `wait` seconds before accepting a tap.
export function vignette(draw, captionText, { wait = 0.8 } = {}) {
  return (api) => ({
    draw(ctx, t) {
      paper(ctx)
      draw(ctx, t)
      caption(ctx, captionText, easeOut((t - 0.3) / 0.6))
      if (t > wait) tapHint(ctx, W - 50, 50, t)
    },
    down(x, y, t) {
      if (t > wait) api.finish()
    },
  })
}

// Opening card of each chapter: black page, "chapter N." and a round arrow to go on.
export function titleCard(act, number, title) {
  return (api) => ({
    draw(ctx, t) {
      ctx.fillStyle = '#0b0b0c'
      ctx.fillRect(0, 0, W, H)
      const a = easeOut(t / 0.8)
      const label = `chapter ${number}.`
      text(ctx, label, W / 2, 290, { size: 40, color: '#f4f1ea', alpha: a })
      ctx.save()
      ctx.globalAlpha = a
      ctx.font = `40px ${FONT}`
      const lw = ctx.measureText(label).width
      ctx.fillStyle = '#f4f1ea'
      ctx.fillRect(W / 2 - lw / 2, 316, lw, 2)
      ctx.restore()
      text(ctx, title.toLowerCase(), W / 2, 370, { size: 58, color: '#f4f1ea', alpha: a })
      text(ctx, act.toLowerCase(), W / 2, 440, { size: 24, color: '#8d8a86', alpha: a })
      if (t > 0.6) {
        const k = easeOut((t - 0.6) / 0.5)
        ctx.save()
        ctx.globalAlpha = k
        blob(ctx, W / 2, H - 230, 42, 42, '#f4f1ea', 77)
        ctx.strokeStyle = '#0b0b0c'
        ctx.lineWidth = 4
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(W / 2 - 22, H - 230)
        ctx.lineTo(W / 2 + 20, H - 230)
        ctx.moveTo(W / 2 + 6, H - 244)
        ctx.lineTo(W / 2 + 21, H - 230)
        ctx.lineTo(W / 2 + 6, H - 216)
        ctx.stroke()
        ctx.restore()
      }
    },
    down(x, y, t) {
      if (t > 0.6) api.finish()
    },
  })
}
