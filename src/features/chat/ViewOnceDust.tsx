import { useEffect, useRef } from 'react'
import DotRendererCore, { buildDotRendererConfig } from '@/features/chat/spoiler/DotRendererCore'

/** Decorative layer only; no original photo is passed to the particle renderer. */
export default function ViewOnceDust() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const core = new DotRendererCore(canvas, { vertex: 'vertex', fragment: 'fragment' })
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let visible = false
    let ready = false
    let disposed = false
    let frame = 0
    let lastFrame = 0
    const draw = (now: number) => {
      if (now - lastFrame >= 1000 / 30) {
        core.draw()
        lastFrame = now
      }
      frame = requestAnimationFrame(draw)
    }
    const update = () => {
      cancelAnimationFrame(frame)
      const animate = ready && visible && !document.hidden && !motion.matches
      canvas.dataset.motion = animate ? 'running' : 'paused'
      if (ready) {
        core.lastDrawTime = Date.now()
        core.draw()
      }
      if (animate) frame = requestAnimationFrame(draw)
    }
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect()
      const dpr = Math.min(devicePixelRatio || 1, 2)
      core.resize(Math.max(1, width), Math.max(1, height), dpr, buildDotRendererConfig(width, height, dpr))
      update()
    }
    const intersection = new IntersectionObserver(entries => {
      visible = entries[0]?.isIntersecting ?? false
      update()
    })
    const observer = new ResizeObserver(resize)
    resize()
    intersection.observe(canvas)
    observer.observe(canvas)
    document.addEventListener('visibilitychange', update)
    motion.addEventListener('change', update)
    void Promise.resolve(core.init()).then(result => {
      if (disposed) { core.destroy(); return }
      ready = result
      canvas.dataset.renderer = result ? 'webgl' : 'static'
      update()
    }).catch(() => {
      core.destroy()
      if (!disposed) canvas.dataset.renderer = 'static'
    })
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      intersection.disconnect()
      observer.disconnect()
      document.removeEventListener('visibilitychange', update)
      motion.removeEventListener('change', update)
      if (ready) core.destroy()
    }
  }, [])
  return <canvas ref={ref} className="cv-view-once-dust" aria-hidden="true" />
}
