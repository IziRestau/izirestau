'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { TrendingUp, Globe, Store, Users, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ── Scroll reveal ────────────────────────────────────────────── */
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

/* ── Animated Counter ─────────────────────────────────────────── */
function useAnimatedCounter(target: number, isVisible: boolean, duration = 2000) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isVisible) return
    let start = 0
    const increment = target / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [isVisible, target, duration])

  return count
}

/* ── Data ─────────────────────────────────────────────────────── */
const stats = [
  {
    icon: Users,
    value: 120,
    suffix: '+',
    label: 'Revendeurs actifs',
    detail: 'sur 3 continents',
  },
  {
    icon: Store,
    value: 2400,
    suffix: '+',
    label: 'Restaurants connectés',
    detail: 'en croissance mensuelle',
  },
  {
    icon: Globe,
    value: 15,
    suffix: '',
    label: 'Pays',
    detail: 'Afrique, Europe, Moyen-Orient',
  },
  {
    icon: Zap,
    value: 99.9,
    suffix: '%',
    label: 'Disponibilité',
    detail: 'SLA garanti',
    isDecimal: true,
  },
]

/*
 * Logos des entreprises partenaires / revendeurs.
 * En production, ils seront dynamiques depuis l'admin.
 */
const logos = [
  'FastFood Dakar', 'Digital Resto', 'RestoConnect', 'ClickMenu',
  'OrderPro', 'FoodTech Solutions', 'AfriDelivery', 'QuickBite EU',
  'NordicEats', 'TechResto DZ',
]

const quote = {
  text: "IziRestau a transformé notre façon de gérer nos restaurants partenaires. En 3 mois, on est passé de 5 à 30 restaurants avec le même effort.",
  name: 'Amadou Diallo',
  role: 'CEO, FastFood Dakar',
}

/* ── Stat Card ────────────────────────────────────────────────── */
function StatCard({
  stat,
  index,
  isVisible,
}: {
  stat: typeof stats[0]
  index: number
  isVisible: boolean
}) {
  const count = useAnimatedCounter(
    stat.isDecimal ? 999 : stat.value,
    isVisible,
    1800 + index * 200
  )

  const displayValue = stat.isDecimal ? '99.9' : count.toLocaleString('fr-FR')

  return (
    <div
      className={cn(
        'group relative text-center lg:text-left transition-all duration-700',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
      )}
      style={{ transitionDelay: `${300 + index * 120}ms` }}
    >
      {/* Icon */}
      <div className="inline-flex lg:flex items-center justify-center w-10 h-10 rounded-xl bg-primary/[0.06] dark:bg-primary/[0.10] mb-4 transition-colors group-hover:bg-primary/[0.10] dark:group-hover:bg-primary/[0.15]">
        <stat.icon className="w-4.5 h-4.5 text-primary" />
      </div>

      {/* Number */}
      <div className="flex items-baseline justify-center lg:justify-start gap-0.5">
        <span className="text-[42px] lg:text-[52px] font-[800] tracking-[-0.04em] leading-none text-foreground tabular-nums">
          {displayValue}
        </span>
        {stat.suffix && (
          <span className="text-[24px] lg:text-[28px] font-[700] text-primary leading-none">
            {stat.suffix}
          </span>
        )}
      </div>

      {/* Label */}
      <p className="mt-2 text-[14px] font-semibold text-foreground">
        {stat.label}
      </p>
      <p className="text-[12px] text-muted-foreground/60 mt-0.5">
        {stat.detail}
      </p>
    </div>
  )
}

/* ── Section ──────────────────────────────────────────────────── */
export function SocialProofSection() {
  const { ref, isVisible } = useScrollReveal(0.05)

  return (
    <section
      ref={ref}
      id="temoignages"
      className="py-24 lg:py-32 relative overflow-hidden"
    >
      {/* Background accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-primary/[0.02] dark:bg-primary/[0.03] blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-14 lg:mb-20">
          <div
            className={cn(
              'inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 dark:bg-primary/10 mb-5',
              'transition-all duration-700',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <span className="text-[12px] font-semibold text-primary uppercase tracking-wider">
              Notre impact
            </span>
          </div>

          <h2
            className={cn(
              'text-[clamp(28px,4vw,44px)] font-[800] tracking-[-0.03em] leading-[1.1] text-foreground',
              'transition-all duration-700 delay-100',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            )}
          >
            Des chiffres qui{' '}
            <span className="text-gradient">parlent</span>
          </h2>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* ── Stats grid ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 mb-16 lg:mb-20">
            {stats.map((stat, i) => (
              <StatCard key={stat.label} stat={stat} index={i} isVisible={isVisible} />
            ))}
          </div>

          {/* ── Quote accent (single, prominent) ── */}
          <div
            className={cn(
              'mb-16 lg:mb-20 transition-all duration-700 delay-500',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            )}
          >
            <div className="rounded-2xl p-px bg-gradient-to-r from-primary/20 via-primary/5 to-transparent dark:from-primary/15 dark:via-primary/5 dark:to-transparent">
              <div className="rounded-[15px] bg-background/60 dark:bg-background/40 backdrop-blur-xl px-8 py-8 lg:px-12 lg:py-10 flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
                {/* ❝ */}
                <span className="text-[64px] leading-none font-serif text-primary/15 dark:text-primary/20 select-none shrink-0 -mt-4 hidden lg:block">
                  &ldquo;
                </span>

                {/* Quote text */}
                <blockquote className="flex-1">
                  <p className="text-[16px] lg:text-[18px] font-[420] leading-[1.7] text-foreground/80">
                    {quote.text}
                  </p>
                  <footer className="mt-4 flex items-center gap-3">
                    <div className="w-[2px] h-8 rounded-full bg-primary/30" />
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">{quote.name}</p>
                      <p className="text-[12px] text-muted-foreground">{quote.role}</p>
                    </div>
                  </footer>
                </blockquote>
              </div>
            </div>
          </div>

          {/* ── Logo ticker ── */}
          <div
            className={cn(
              'transition-all duration-700 delay-[600ms]',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <p className="text-center text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-6">
              Ils nous font confiance
            </p>

            <div
              className="relative overflow-hidden"
              style={{ maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' }}
            >
              <div className="flex w-max animate-scroll-logos">
                {[...logos, ...logos].map((name, i) => (
                  <div
                    key={`${name}-${i}`}
                    className="shrink-0 mx-6 lg:mx-8 flex items-center gap-2 select-none"
                  >
                    {/* Minimal logo mark */}
                    <div className="w-7 h-7 rounded-lg bg-muted/40 dark:bg-muted/20 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-muted-foreground/50">
                        {name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <span className="text-[13px] font-medium text-muted-foreground/40 whitespace-nowrap">
                      {name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
