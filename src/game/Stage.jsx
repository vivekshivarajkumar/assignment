import { useEffect, useRef } from 'react'
import { W, H, C } from './paint.js'
import { memory } from './engine.js'

const FADE = 0.45

// Runs one page: owns the canvas, the animation loop, pointer input and fades.
export default function Stage({ page, onDone }) {
  const canvasRef = useRef(null)
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
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

    const api = {
      memory,
      finish(value) {
        if (finishedAt !== null) return
        finishedAt = now
        result = value
      },
    }
    const scene = page(api)
    // test hook: lets automated checks skip a page
    window.__game = { finish: api.finish, scene }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    let raf
    const frame = (ts) => {
      now = ts
      const dt = Math.min(0.05, (ts - last) / 1000)
      last = ts
      const t = (ts - start) / 1000
      ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0)
      ctx.globalAlpha = 1
      scene.draw(ctx, t, dt)

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
        ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0)
        ctx.globalAlpha = veil
        ctx.fillStyle = C.paper
        ctx.fillRect(0, 0, W, H)
        ctx.globalAlpha = 1
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    const toLogical = (e) => {
      const r = canvas.getBoundingClientRect()
      return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H]
    }
    const handler = (name) => (e) => {
      if (finishedAt !== null || !scene[name]) return
      if (name === 'down') canvas.setPointerCapture(e.pointerId)
      const [x, y] = toLogical(e)
      scene[name](x, y, (now - start) / 1000)
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
