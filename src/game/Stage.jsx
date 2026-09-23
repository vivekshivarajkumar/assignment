import { useEffect, useRef } from 'react'
import { W, H, C } from './paint.js'
import { memory } from './engine.js'

const FADE = 0.45

// Runs one page: owns the canvas, the animation loop, pointer input and fades.
// While `paused`, the page's clock stops and nothing is redrawn.
//
// The canvas fills the screen, so on a phone it is taller than 9:16. Pages are
// W wide and at least H tall:
//  - a page that sets `tall: true` draws over the full height, api.height()
//  - any other page is drawn in a W x H band centred on the screen, and the band's
//    top and bottom rows are stretched to fill the space above and below it.
export default function Stage({ page, onDone, paused = false }) {
  const canvasRef = useRef(null)
  const onDoneRef = useRef(onDone)
  const pausedRef = useRef(paused)
  useEffect(() => {
    onDoneRef.current = onDone
    pausedRef.current = paused
  })

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let finishedAt = null
    let result
    let done = false
    const start = performance.now()
    let last = start
    let now = start
    let pausedFor = 0 // ms spent paused, left out of the page's clock
    const clock = () => (now - start - pausedFor) / 1000
    let height = H // logical height of the screen

    const api = {
      memory,
      height: () => height,
      finish(value) {
        if (finishedAt !== null) return
        finishedAt = now
        result = value
      },
    }
    const scene = page(api)
    // test hook: lets automated checks skip a page
    window.__game = { finish: api.finish, scene }

    // where the W x H band of an ordinary page starts, in logical units
    const bandTop = () => (scene.tall ? 0 : (height - H) / 2)
    window.__game.bandTop = bandTop

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      height = Math.max(H, (W * rect.height) / rect.width)
    }
    resize()
    window.addEventListener('resize', resize)

    let raf
    const frame = (ts) => {
      now = ts
      if (pausedRef.current) {
        pausedFor += ts - last
        last = ts
        raf = requestAnimationFrame(frame)
        return
      }
      const dt = Math.min(0.05, (ts - last) / 1000)
      last = ts
      const t = clock()
      const s = canvas.width / W
      const top = bandTop()
      ctx.setTransform(s, 0, 0, s, 0, top * s)
      ctx.globalAlpha = 1
      scene.draw(ctx, t, dt)

      // stretch the band's edge rows over the space above and below it
      if (top > 0) {
        const px = Math.ceil(top * s)
        const bandPx = Math.floor(H * s)
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.drawImage(canvas, 0, px, canvas.width, 1, 0, 0, canvas.width, px)
        ctx.drawImage(canvas, 0, px + bandPx - 2, canvas.width, 1, 0, px + bandPx - 1, canvas.width, canvas.height - px - bandPx + 1)
      }

      // fade in on open, fade out after finish()
      let veil = Math.max(0, 1 - t / FADE)
      if (finishedAt !== null) {
        const k = (ts - finishedAt) / 1000 / FADE
        veil = Math.max(veil, Math.min(1, k))
        if (k >= 1 && !done) {
          done = true
          onDoneRef.current(result)
          return
        }
      }
      if (veil > 0) {
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.globalAlpha = veil
        ctx.fillStyle = C.paper
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.globalAlpha = 1
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    const toLogical = (e) => {
      const r = canvas.getBoundingClientRect()
      const k = W / r.width
      return [(e.clientX - r.left) * k, (e.clientY - r.top) * k - bandTop()]
    }
    const handler = (name) => (e) => {
      if (finishedAt !== null || pausedRef.current || !scene[name]) return
      if (name === 'down') canvas.setPointerCapture(e.pointerId)
      const [x, y] = toLogical(e)
      scene[name](x, y, clock())
    }
    const down = handler('down')
    const move = handler('move')
    const up = handler('up')
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
    }
  }, [page])

  return <canvas ref={canvasRef} className="stage" />
}
