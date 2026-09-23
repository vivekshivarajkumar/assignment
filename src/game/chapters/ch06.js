// Chapter 6 · Hello — the first conversation. Every line is a puzzle; it isn't easy yet.
import { vignette } from '../engine.js'
import { W, C, wash, blob, mira, arun, note } from '../paint.js'
import { bubblePuzzle, icons } from '../bubblePuzzle.js'

function park(ctx) {
  wash(ctx, 0, 0, W, 700, '#e8c9a8', 601) // warm evening sky
  blob(ctx, 420, 180, 70, 70, '#f2c14e', 602, 0.8)
  for (let i = 0; i < 4; i++) blob(ctx, 60 + i * 150, 640, 90, 70, C.leaf, 603 + i)
  wash(ctx, 0, 680, W, 280, '#b9c98f', 607)
}

const meet = vignette((ctx, t) => {
  park(ctx)
  arun(ctx, 360, 820, { pose: t < 1.5 ? 'violin' : 'stand', t, facing: -1, mouth: t < 1.5 ? 'none' : 'smile' })
  mira(ctx, 160, 820, { eyes: 'open' })
  if (t < 1.5) note(ctx, 300, 440 - t * 40, 1, C.arun, 1 - t / 1.5)
}, 'The music stopped. He looked up.')

const talk = bubblePuzzle({
  scene(ctx) {
    park(ctx)
    ctx.save()
    ctx.globalAlpha = 0.9
    mira(ctx, 150, 940, { s: 0.55 })
    arun(ctx, 390, 940, { s: 0.55, facing: -1 })
    ctx.restore()
  },
  bubbles: [
    { speaker: 'arun', pieces: 4, icon: icons.wave },
    { speaker: 'mira', pieces: 4, icon: icons.row(icons.music, icons.question) },
    { speaker: 'arun', pieces: 3, icon: icons.laugh },
    { speaker: 'mira', pieces: 3, icon: icons.star },
  ],
  caption: 'She forgot to check her phone for an hour.',
})

export default {
  title: 'Hello',
  pages: [meet, talk],
}
