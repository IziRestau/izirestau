'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, Store, TrendingUp, Shield, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GridBackground } from '@/components/shared/ParticleField'

function useScrollReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
      { threshold }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, isVisible }
}

function useCountUp(target: number, active: boolean, duration = 1400) {
  const [count, setCount] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (!active || target <= 0 || started.current) return
    started.current = true
    const start = performance.now()

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, active, duration])

  return count
}

const stats = [
  { icon: Store, value: 500, suffix: '+', label: 'Restaurants actifs' },
  { icon: TrendingUp, value: 99, suffix: '.9%', label: 'Uptime garanti' },
  { icon: Shield, value: 50, suffix: '+', label: 'Revendeurs partenaires' },
  { icon: Zap, value: 24, suffix: '/7', label: 'Support dédié' },
]

export function HeroSection() {
  const { ref, isVisible } = useScrollReveal(0.05)

  return (
    <section ref={ref} className="relative min-h-screen overflow-hidden flex flex-col justify-center">
      {/* Grille interactive */}
      <GridBackground interactive />
      {/* Overlay transparent + blur par-dessus les particules */}
      <div className="absolute inset-0 z-[1] bg-background/30 backdrop-blur-[3px] pointer-events-none" />

      <div className="relative z-[2] container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 lg:pt-32 lg:pb-20">
        <div className="max-w-4xl mx-auto text-center">

          {/* Badge */}
          <div
            className={cn(
              'inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-10',
              'bg-primary/[0.06] dark:bg-primary/[0.10]',
              'border border-primary/10 dark:border-primary/15',
              'backdrop-blur-sm',
              'transition-all duration-700',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-[13px] font-medium text-primary tracking-tight">
              Plateforme conçue pour les revendeurs
            </span>
          </div>

          {/* Titre — une seule ligne */}
          <h1
            className={cn(
              'text-[clamp(38px,6vw,72px)] font-[900] tracking-[-0.04em] leading-[1.05] text-foreground',
              'transition-all duration-700 delay-100',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            )}
          >
            Donnez à vos restaurants <span className="text-gradient-hero">une présence digitale</span>
          </h1>

          {/* Sous-titre */}
          <p
            className={cn(
              'mt-7 text-[clamp(16px,1.6vw,18px)] leading-[1.7] text-muted-foreground max-w-xl mx-auto',
              'transition-all duration-700 delay-200',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            )}
          >
            Créez des sites de commande en ligne, gérez vos clients restaurateurs
            et suivez votre croissance — le tout depuis un seul tableau de bord.
          </p>

          {/* CTAs */}
          <div
            className={cn(
              'mt-10 flex flex-col sm:flex-row items-center justify-center gap-4',
              'transition-all duration-700 delay-300',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            )}
          >
            <Link
              href="/register"
              className={cn(
                'group inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-[15px] font-semibold',
                'bg-foreground text-background',
                'shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.08)]',
                'dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_4px_16px_rgba(0,0,0,0.3)]',
                'hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_8px_32px_rgba(0,0,0,0.12)]',
                'active:scale-[0.97] transition-all duration-300',
                'w-full sm:w-auto justify-center'
              )}
            >
              Commencer gratuitement
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/tarifs"
              className={cn(
                'inline-flex items-center px-8 py-4 rounded-full text-[15px] font-medium',
                'text-muted-foreground border border-border/60',
                'hover:text-foreground hover:bg-muted/30 hover:border-border',
                'transition-all duration-300',
                'w-full sm:w-auto justify-center'
              )}
            >
              Voir les tarifs
            </Link>
          </div>
        </div>

        {/* Stats — carte glass en dehors du conteneur texte */}
        <div
          className={cn(
            'mt-16 lg:mt-20 max-w-6xl mx-auto',
            'transition-all duration-700 delay-500',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          )}
        >
          <div className="rounded-2xl border border-border/50 dark:border-border/30 bg-background/5 backdrop-blur-sm">
            <div className="grid grid-cols-2 lg:grid-cols-4">
              {stats.map((stat, i) => (
                <StatItem key={stat.label} stat={stat} index={i} total={stats.length} active={isVisible} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Composant StatItem séparé pour respecter les règles des hooks ── */
function StatItem({ stat, index, total, active }: {
  stat: typeof stats[number]
  index: number
  total: number
  active: boolean
}) {
  const count = useCountUp(stat.value, active)
  const Icon = stat.icon

  return (
    <div
      className={cn(
        'flex items-center gap-3 py-6 lg:py-7 px-5 lg:px-6',
        index < total - 1 && 'border-r border-border/30 dark:border-border/20',
        index < 2 && 'border-b border-border/30 dark:border-border/20 lg:border-b-0',
      )}
    >
      <Icon className="w-5 h-5 text-primary/60 shrink-0 hidden sm:block" />
      <div>
        <div className="text-xl lg:text-2xl font-bold text-foreground tracking-tight leading-none">
          {count}{stat.suffix}
        </div>
        <div className="text-[12px] lg:text-[13px] text-muted-foreground mt-1">
          {stat.label}
        </div>
      </div>
    </div>
  )
}
