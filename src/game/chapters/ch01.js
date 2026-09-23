// Chapter 1 · Morning — the alarm (ch01-wake.js), brushing teeth (ch01-brush.js),
// the same grey day again.
import { vignette } from '../engine.js'
import { W, H, C, paper, wash, blob, panel, mira, person, easeOut } from '../paint.js'
import wakeUp from './ch01-wake.js'
import brushTeeth from './ch01-brush.js'

const GREY = 0.65 // Mira's colour is mostly drained in Act I

const leaving = vignette((ctx, t) => {
  paper(ctx, '#3b3f4a')
  panel(ctx, 20, 20, W - 40, 470, (ctx) => {
    ctx.translate(-20, -220)
    wash(ctx, 0, 0, W, H, C.greyLight, 120)
    // stairwell door
    wash(ctx, 300, 260, 170, 380, C.greyDark, 121)
    blob(ctx, 440, 460, 8, 8, C.ink, 122)
    wash(ctx, 0, 640, W, 320, C.grey, 123)
    mira(ctx, 160 + Math.min(t, 2) * 30, 700, { pose: 'walk', t, grey: GREY, eyes: 'down' })
  })
  // the street: a crowd of grey commuters, Mira one of them
  panel(ctx, 20, 510, W - 40, 300, (ctx, w, h) => {
    wash(ctx, 0, 0, w, h, '#c3c6c9', 124)
    for (let i = 0; i < 6; i++) wash(ctx, i * 90 - 20, 20 + (i % 3) * 20, 80, 200, C.grey, 125 + i)
    wash(ctx, 0, 230, w, 80, C.greyDark, 131)
    const walk = t * 20
    for (let i = 0; i < 7; i++) {
      const x = ((i * 83 + walk) % (w + 80)) - 40
      person(ctx, { x, y: h + 20, s: 0.62, top: C.greyDark, bottom: '#6f6b67', hair: '#55514e', skin: '#a9a39c', pose: 'walk', t: t + i })
    }
    mira(ctx, w / 2, h + 20, { s: 0.62, pose: 'walk', t, grey: GREY, eyes: 'down' })
  }, { alpha: easeOut((t - 0.4) / 0.5) })
}, 'She is good at her job. She is tired.')

export default {
  title: 'Morning',
  pages: [wakeUp, brushTeeth, leaving],
}
