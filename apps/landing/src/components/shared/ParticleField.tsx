'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useTheme } from 'next-themes'

interface GridBackgroundProps {
  interactive?: boolean
}

export function GridBackground({ interactive = true }: GridBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const particlesRef = useRef<Array<{
    x: number; y: number; baseX: number; baseY: number;
    vx: number; vy: number; radius: number; alpha: number;
  }>>([])
  const rafRef = useRef(0)
  const timeRef = useRef(0)
  const { resolvedTheme } = useTheme()

  const isDark = resolvedTheme === 'dark'
  const rgb = isDark ? '255, 255, 255' : '0, 0, 0'

  const init = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return

    canvas.width = parent.offsetWidth
    canvas.height = parent.offsetHeight

    const particles: typeof particlesRef.current = []
    const gap = 40
    const cols = Math.ceil(canvas.width / gap) + 2
    const rows = Math.ceil(canvas.height / gap) + 2

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        particles.push({
          x: c * gap, y: r * gap,
          baseX: c * gap, baseY: r * gap,
          vx: 0, vy: 0,
          radius: 0.6 + Math.random() * 0.2,
          alpha: 0.08 + Math.random() * 0.06,
        })
      }
    }
    particlesRef.current = particles
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    init()

    function render() {
      timeRef.current += 0.008
      const t = timeRef.current
      const w = canvas!.width
      const h = canvas!.height
      const mouse = mouseRef.current
      const particles = particlesRef.current

      ctx!.clearRect(0, 0, w, h)

      // Grid lines
      const gap = 40
      ctx!.lineWidth = 0.5

      for (let x = 0; x <= w; x += gap) {
        const wave = Math.sin(t + x * 0.003) * 0.01
        ctx!.strokeStyle = `rgba(${rgb}, ${0.03 + wave})`
        ctx!.beginPath()
        ctx!.moveTo(x, 0)
        ctx!.lineTo(x, h)
        ctx!.stroke()
      }
      for (let y = 0; y <= h; y += gap) {
        const wave = Math.cos(t + y * 0.003) * 0.01
        ctx!.strokeStyle = `rgba(${rgb}, ${0.03 + wave})`
        ctx!.beginPath()
        ctx!.moveTo(0, y)
        ctx!.lineTo(w, y)
        ctx!.stroke()
      }

      // Particles
      for (const p of particles) {
        if (interactive) {
          const dx = mouse.x - p.x
          const dy = mouse.y - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const influence = 300

          if (dist < influence) {
            const force = (1 - dist / influence) * 1.0
            p.vx -= (dx / dist) * force
            p.vy -= (dy / dist) * force
          }
        }

        // Breathing
        let breathX, breathY
        if (interactive) {
          breathX = Math.sin(t * 0.5 + p.baseX * 0.01) * 0.3
          breathY = Math.cos(t * 0.4 + p.baseY * 0.01) * 0.3
        } else {
          breathX =
            Math.sin(t * 0.6 + p.baseX * 0.02 + p.baseY * 0.008) * 8 +
            Math.sin(t * 1.1 + p.baseX * 0.01) * 3 +
            Math.cos(t * 0.3 + p.baseY * 0.015) * 4
          breathY =
            Math.cos(t * 0.5 + p.baseY * 0.02 + p.baseX * 0.008) * 8 +
            Math.cos(t * 0.9 + p.baseY * 0.01) * 3 +
            Math.sin(t * 0.35 + p.baseX * 0.015) * 4
        }

        // Spring
        p.vx += (p.baseX + breathX - p.x) * 0.045
        p.vy += (p.baseY + breathY - p.y) * 0.045
        p.vx *= 0.85
        p.vy *= 0.85
        p.x += p.vx
        p.y += p.vy

        const disp = Math.sqrt((p.x - p.baseX) ** 2 + (p.y - p.baseY) ** 2)
        const r = p.radius + disp * 0.15
        const a = Math.min(p.alpha + disp * 0.03, 0.6)

        ctx!.beginPath()
        ctx!.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(${rgb}, ${a})`
        ctx!.fill()

        // Connect nearby disturbed particles
        if (disp > 2) {
          for (const q of particles) {
            const qdist = Math.sqrt((p.x - q.x) ** 2 + (p.y - q.y) ** 2)
            if (qdist < gap * 1.5 && qdist > 1) {
              const qdisp = Math.sqrt((q.x - q.baseX) ** 2 + (q.y - q.baseY) ** 2)
              if (qdisp > 2) {
                ctx!.beginPath()
                ctx!.moveTo(p.x, p.y)
                ctx!.lineTo(q.x, q.y)
                ctx!.strokeStyle = `rgba(${rgb}, ${Math.min(0.05 + disp * 0.005, 0.2)})`
                ctx!.lineWidth = 0.5
                ctx!.stroke()
              }
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(render)
    }

    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    function onTouchMove(e: TouchEvent) {
      const touch = e.touches[0]
      if (touch) {
        const rect = canvas!.getBoundingClientRect()
        mouseRef.current = { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
      }
    }

    function onLeave() {
      mouseRef.current = { x: -9999, y: -9999 }
    }

    function onResize() {
      init()
    }

    window.addEventListener('resize', onResize)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('touchmove', onTouchMove)
    window.addEventListener('mouseleave', onLeave)
    window.addEventListener('touchend', onLeave)

    render()

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('touchend', onLeave)
    }
  }, [init, rgb, interactive])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
