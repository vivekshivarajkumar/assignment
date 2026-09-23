// The conversation puzzle: each line of dialogue is a speech bubble broken into
// jigsaw pieces. The player drags the pieces into place to "say" it. Fewer
// pieces means the talk comes easily; `hard` bubbles also start with some pieces
// upside down (tap a piece to turn it).
//
// bubblePuzzle({
//   bubbles: [{ speaker: 'mira' | 'arun' | 'mom', pieces: 3, icon(ctx, w, h), hard }],
//   scene(ctx, t),     // background and characters, drawn under the puzzle
//   caption,           // optional narration shown once every bubble is solved
// })
// Bubbles contain pictures, not words: icon() paints inside a w x h box.

import { W, C, rng, dist, clamp, easeOut, lerp, paper, caption, tapHint, roundRect } from './paint.js'
import { pop } from './sound.js'

const BW = 400
const BH = 150
const BX = (W - BW) / 2
const BY = 300
const TAB = 16

export const SPEAKER = {
  mira: { fill: '#f6dcae', tail: 'left' },
  arun: { fill: '#f0c3b8', tail: 'right' },
  mom: { fill: '#dccbe6', tail: 'left' },
}

function edge(ctx, x, dir, down) {
  const m = BH / 2
  if (down) {
    ctx.lineTo(x, m - TAB)
    ctx.arc(x, m, TAB, -Math.PI / 2, Math.PI / 2, dir < 0)
    ctx.lineTo(x, BH + 40)
  } else {
    ctx.lineTo(x, m + TAB)
    ctx.arc(x, m, TAB, Math.PI / 2, -Math.PI / 2, dir > 0)
    ctx.lineTo(x, -40)
  }
}

// Path of piece i in bubble-local coordinates.
function piecePath(ctx, i, n, dirs) {
  const pw = BW / n
  const x0 = i * pw
  const x1 = (i + 1) * pw
  ctx.beginPath()
  ctx.moveTo(x0, -40)
  ctx.lineTo(x1, -40)
  if (i < n - 1) edge(ctx, x1, dirs[i], true)
  else ctx.lineTo(x1, BH + 40)
  ctx.lineTo(x0, BH + 40)
  if (i > 0) edge(ctx, x0, dirs[i - 1], false)
  else ctx.lineTo(x0, -40)
  ctx.closePath()
}

function bubbleBody(ctx, fill, tail) {
  ctx.fillStyle = fill
  roundRect(ctx, 0, 0, BW, BH, 24)
  ctx.fill()
  if (tail) {
    const tx = tail === 'left' ? 60 : BW - 60
    const d = tail === 'left' ? -1 : 1
    ctx.beginPath()
    ctx.moveTo(tx - 16, BH - 1)
    ctx.lineTo(tx + d * 20, BH + 26)
    ctx.lineTo(tx + 16, BH - 1)
    ctx.fill()
  }
}

// Draws one piece (clipped slice of the finished bubble) with its origin at the
// bubble's top-left corner.
function drawPiece(ctx, b, i, outline) {
  const sp = SPEAKER[b.speaker]
  ctx.save()
  piecePath(ctx, i, b.pieces, b.dirs)
  ctx.clip()
  bubbleBody(ctx, sp.fill, sp.tail)
  b.icon(ctx, BW, BH)
  ctx.restore()
  if (outline) {
    // ink edge around the visible part of the piece (piece ∩ bubble)
    ctx.save()
    ctx.strokeStyle = 'rgba(47,43,51,0.6)'
    ctx.lineWidth = 3
    piecePath(ctx, i, b.pieces, b.dirs)
    ctx.clip()
    bubbleBody(ctx, 'rgba(0,0,0,0)', sp.tail)
    ctx.stroke()
    roundRect(ctx, 0, 0, BW, BH, 24)
    ctx.stroke()
    ctx.clip()
    piecePath(ctx, i, b.pieces, b.dirs)
    ctx.stroke()
    ctx.restore()
  }
}

export function bubblePuzzle({ bubbles, scene, caption: captionText }) {
  return (api) => {
    const r = rng(bubbles.length * 31 + bubbles[0].pieces)
    const state = bubbles.map((b) => ({
      ...b,
      dirs: Array.from({ length: b.pieces - 1 }, () => (r() < 0.5 ? -1 : 1)),
    }))
    let cur = 0
    let pieces = []
    let drag = null
    let solvedAt = null
    let doneAt = null

    const setup = (t) => {
      const b = state[cur]
      const pw = BW / b.pieces
      const order = Array.from({ length: b.pieces }, (_, i) => i).sort(() => r() - 0.5)
      pieces = order.map((i, k) => {
        const slot = (k + 0.5) / b.pieces
        return {
          i,
          hx: BX,
          hy: BY,
          // a piece's position is where its bubble origin would be
          x: lerp(40, W - 40, slot) - (i + 0.5) * pw,
          y: 560 + (k % 2) * 90 + (r() - 0.5) * 30 - BH / 2,
          flip: b.hard && r() < 0.6 ? 1 : 0,
          placed: false,
          born: t,
        }
      })
    }
    setup(0)

    const center = (p) => {
      const pw = BW / state[cur].pieces
      return [p.x + (p.i + 0.5) * pw, p.y + BH / 2]
    }

    const hit = (p, x, y) => {
      const pw = BW / state[cur].pieces
      const [cx, cy] = center(p)
      return Math.abs(x - cx) < pw / 2 + TAB && Math.abs(y - cy) < BH / 2 + 10
    }

    return {
      // test hook: where each loose piece is and where it belongs (centres)
      debug: () =>
        pieces.filter((p) => !p.placed).map((p) => {
          const pw = BW / state[cur].pieces
          return { from: center(p), to: [p.hx + (p.i + 0.5) * pw, p.hy + BH / 2], flip: p.flip }
        }),
      draw(ctx, t, dt) {
        paper(ctx)
        scene?.(ctx, t)

        // earlier lines of the conversation, stacked small at the top
        const log = state.slice(0, doneAt !== null ? state.length : cur)
        log.slice(-3).forEach((b, k, arr) => {
          const s = 0.42
          const age = arr.length - k
          ctx.save()
          ctx.globalAlpha = 1 - (age - 1) * 0.25
          // keep clear of the home button in the top-left corner
          const x = b.speaker === 'arun' ? W - 30 - BW * s : 96
          ctx.translate(x, 30 + k * 76)
          ctx.scale(s, s)
          const sp = SPEAKER[b.speaker]
          bubbleBody(ctx, sp.fill, sp.tail)
          b.icon(ctx, BW, BH)
          ctx.restore()
        })

        if (doneAt !== null) {
          caption(ctx, captionText, easeOut((t - doneAt) / 0.6))
          tapHint(ctx, W - 50, 50, t)
          return
        }

        const b = state[cur]
        // empty outline where the bubble goes
        ctx.save()
        ctx.translate(BX, BY)
        ctx.setLineDash([10, 10])
        ctx.strokeStyle = 'rgba(47,43,51,0.3)'
        ctx.lineWidth = 3
        roundRect(ctx, 0, 0, BW, BH, 24)
        ctx.stroke()
        ctx.restore()

        // pieces: placed first, then loose ones, dragged one on top
        const ordered = [...pieces].sort((a, c) => (a === drag) - (c === drag) || c.placed - a.placed)
        for (const p of ordered) {
          if (p.placed) {
            p.x = lerp(p.x, p.hx, clamp(dt * 14, 0, 1))
            p.y = lerp(p.y, p.hy, clamp(dt * 14, 0, 1))
          }
          const [cx, cy] = center(p)
          const grow = easeOut((t - p.born) / 0.4)
          ctx.save()
          ctx.translate(cx, cy)
          ctx.scale(grow, grow)
          if (p.flip) ctx.rotate(Math.PI)
          ctx.translate(-(cx - p.x), -(cy - p.y))
          if (!p.placed) {
            ctx.shadowColor = 'rgba(0,0,0,0.18)'
            ctx.shadowBlur = p === drag ? 18 : 8
            ctx.shadowOffsetY = p === drag ? 8 : 3
          }
          drawPiece(ctx, b, p.i, !p.placed)
          ctx.restore()
        }

        // whole bubble solved: pause, then move to the next one
        if (solvedAt !== null && t - solvedAt > 0.7) {
          solvedAt = null
          if (cur < state.length - 1) {
            cur += 1
            setup(t)
          } else doneAt = t
        }
      },
      down(x, y, t) {
        if (doneAt !== null) {
          if (t - doneAt > 0.5) api.finish()
          return
        }
        for (let k = pieces.length - 1; k >= 0; k--) {
          const p = pieces[k]
          if (!p.placed && hit(p, x, y)) {
            drag = p
            drag.ox = x - p.x
            drag.oy = y - p.y
            drag.sx = x
            drag.sy = y
            return
          }
        }
      },
      move(x, y) {
        if (!drag) return
        drag.x = x - drag.ox
        drag.y = y - drag.oy
      },
      up(x, y, t) {
        if (!drag) return
        const p = drag
        drag = null
        if (dist(x, y, p.sx, p.sy) < 8) {
          if (state[cur].hard) {
            p.flip = 1 - p.flip
            pop(440)
          }
          return
        }
        if (!p.flip && dist(p.x, p.y, p.hx, p.hy) < 45) {
          p.placed = true
          pop(620 + p.i * 60)
          if (pieces.every((q) => q.placed)) solvedAt = t
        }
      },
    }
  }
}

// ---------- pictograms for bubbles ----------
// Small painted symbols the chapters combine to "write" dialogue.

export const icons = {
  question(ctx, w, h) {
    ctx.fillStyle = C.ink
    ctx.font = `bold ${h * 0.6}px Georgia`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('?', w / 2, h / 2 + 4)
  },
  exclaim(ctx, w, h) {
    ctx.fillStyle = C.ink
    ctx.font = `bold ${h * 0.6}px Georgia`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('!', w / 2, h / 2 + 4)
  },
  wave(ctx, w, h) {
    // a waving hand: palm + fingers
    ctx.fillStyle = C.skin1
    ctx.beginPath()
    ctx.ellipse(w / 2, h / 2 + 12, 26, 30, 0, 0, Math.PI * 2)
    ctx.fill()
    for (let i = 0; i < 4; i++) {
      ctx.beginPath()
      ctx.ellipse(w / 2 - 18 + i * 12, h / 2 - 22, 5, 16, (i - 1.5) * 0.12, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.strokeStyle = C.ink
    ctx.lineWidth = 3
    for (const d of [-1, 1]) {
      ctx.beginPath()
      ctx.arc(w / 2 + d * 50, h / 2, 14, -0.8, 0.8)
      if (d < 0) ctx.arc(w / 2 - 50, h / 2, 14, Math.PI - 0.8, Math.PI + 0.8)
      ctx.stroke()
    }
  },
  music(ctx, w, h) {
    for (let i = 0; i < 3; i++) {
      const x = w / 2 - 70 + i * 60
      const y = h / 2 + 22 - (i % 2) * 20
      ctx.fillStyle = C.arun
      ctx.strokeStyle = C.arun
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.ellipse(x, y, 11, 8, -0.4, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(x + 9, y - 3)
      ctx.lineTo(x + 9, y - 44)
      ctx.stroke()
    }
  },
  heart(ctx, w, h) {
    ctx.fillStyle = C.rose
    ctx.save()
    ctx.translate(w / 2, h / 2 + 10)
    ctx.scale(2.2, 2.2)
    ctx.beginPath()
    ctx.moveTo(0, 10)
    ctx.bezierCurveTo(-26, -8, -12, -30, 0, -14)
    ctx.bezierCurveTo(12, -30, 26, -8, 0, 10)
    ctx.fill()
    ctx.restore()
  },
  sun(ctx, w, h) {
    ctx.fillStyle = '#f2c14e'
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 30, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#f2c14e'
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(w / 2 + Math.cos(a) * 40, h / 2 + Math.sin(a) * 40)
      ctx.lineTo(w / 2 + Math.cos(a) * 54, h / 2 + Math.sin(a) * 54)
      ctx.stroke()
    }
  },
  coffee(ctx, w, h) {
    ctx.fillStyle = C.cream
    ctx.strokeStyle = C.ink
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(w / 2 - 34, h / 2 - 20)
    ctx.lineTo(w / 2 + 30, h / 2 - 20)
    ctx.lineTo(w / 2 + 24, h / 2 + 40)
    ctx.lineTo(w / 2 - 28, h / 2 + 40)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(w / 2 + 34, h / 2 + 6, 14, -1.2, 1.2)
    ctx.stroke()
    ctx.strokeStyle = C.inkSoft
    ctx.lineWidth = 3
    for (const dx of [-12, 8]) {
      ctx.beginPath()
      ctx.moveTo(w / 2 + dx, h / 2 - 30)
      ctx.quadraticCurveTo(w / 2 + dx + 10, h / 2 - 44, w / 2 + dx, h / 2 - 58)
      ctx.stroke()
    }
  },
  paint(ctx, w, h) {
    // brush and three dabs of colour
    const dabs = [C.mira, C.teal, C.rose]
    dabs.forEach((c, i) => {
      ctx.fillStyle = c
      ctx.beginPath()
      ctx.ellipse(w / 2 - 80 + i * 36, h / 2 + 20, 15, 11, 0, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.strokeStyle = '#9a5a2c'
    ctx.lineWidth = 8
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(w / 2 + 40, h / 2 + 40)
    ctx.lineTo(w / 2 + 90, h / 2 - 40)
    ctx.stroke()
    ctx.fillStyle = C.ink
    ctx.beginPath()
    ctx.ellipse(w / 2 + 36, h / 2 + 46, 6, 10, 0.6, 0, Math.PI * 2)
    ctx.fill()
  },
  laugh(ctx, w, h) {
    ctx.fillStyle = '#f2c14e'
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 44, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = C.ink
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(w / 2 - 15, h / 2 - 10, 7, Math.PI + 0.3, -0.3)
    ctx.arc(w / 2 + 15, h / 2 - 10, 7, Math.PI + 0.3, -0.3)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(w / 2, h / 2 + 6, 22, 0.1, Math.PI - 0.1)
    ctx.closePath()
    ctx.fillStyle = C.ink
    ctx.fill()
  },
  storm(ctx, w, h) {
    ctx.fillStyle = C.greyDark
    for (const [dx, dy, rr] of [[-30, 0, 28], [0, -14, 34], [34, 0, 26]]) {
      ctx.beginPath()
      ctx.arc(w / 2 + dx, h / 2 + dy - 10, rr, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#f2c14e'
    ctx.beginPath()
    ctx.moveTo(w / 2 + 4, h / 2 + 8)
    ctx.lineTo(w / 2 - 14, h / 2 + 40)
    ctx.lineTo(w / 2, h / 2 + 38)
    ctx.lineTo(w / 2 - 8, h / 2 + 66)
    ctx.lineTo(w / 2 + 20, h / 2 + 28)
    ctx.lineTo(w / 2 + 6, h / 2 + 30)
    ctx.closePath()
    ctx.fill()
  },
  money(ctx, w, h) {
    ctx.fillStyle = '#9dbf8c'
    ctx.fillRect(w / 2 - 70, h / 2 - 34, 140, 68)
    ctx.strokeStyle = C.ink
    ctx.lineWidth = 3
    ctx.strokeRect(w / 2 - 70, h / 2 - 34, 140, 68)
    ctx.fillStyle = C.ink
    ctx.font = `bold 48px Georgia`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('$', w / 2, h / 2 + 3)
  },
  clock(ctx, w, h) {
    ctx.fillStyle = C.cream
    ctx.strokeStyle = C.ink
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 44, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(w / 2, h / 2)
    ctx.lineTo(w / 2, h / 2 - 30)
    ctx.moveTo(w / 2, h / 2)
    ctx.lineTo(w / 2 + 22, h / 2 + 8)
    ctx.stroke()
  },
  home(ctx, w, h) {
    ctx.fillStyle = C.arun
    ctx.beginPath()
    ctx.moveTo(w / 2 - 56, h / 2 - 4)
    ctx.lineTo(w / 2, h / 2 - 54)
    ctx.lineTo(w / 2 + 56, h / 2 - 4)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = C.mira
    ctx.fillRect(w / 2 - 42, h / 2 - 6, 84, 58)
    ctx.fillStyle = C.ink
    ctx.fillRect(w / 2 - 10, h / 2 + 18, 20, 34)
  },
  star(ctx, w, h) {
    ctx.fillStyle = '#f2c14e'
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? 22 : 50
      const a = -Math.PI / 2 + (i / 10) * Math.PI * 2
      ctx.lineTo(w / 2 + Math.cos(a) * rr, h / 2 + Math.sin(a) * rr)
    }
    ctx.closePath()
    ctx.fill()
  },
  // Combine several icons side by side: icons.row(icons.coffee, icons.question)
  row(...fns) {
    return (ctx, w, h) => {
      const cw = w / fns.length
      fns.forEach((fn, i) => {
        ctx.save()
        ctx.translate(i * cw, 0)
        ctx.translate(cw / 2, h / 2)
        const k = Math.min(1, cw / (w * 0.6))
        ctx.scale(k, k)
        ctx.translate(-w / 2, -h / 2)
        fn(ctx, w, h)
        ctx.restore()
      })
    }
  },
}
