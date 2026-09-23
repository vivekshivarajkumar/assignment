import { vignette } from '../engine.js'
import { W, H, text } from '../paint.js'

export default {
  title: 'Gallery',
  pages: [vignette((ctx) => text(ctx, '(chapter in progress)', W / 2, H / 2), '')],
}
