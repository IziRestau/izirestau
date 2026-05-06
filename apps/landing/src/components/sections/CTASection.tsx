'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, Shield, Clock, CreditCard } from 'lucide-react'
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

/* ── Section ──────────────────────────────────────────────────── */
export function CTASection() {
  const { ref, isVisible } = useScrollReveal(0.1)

  const trustItems = [
    { icon: Clock, label: 'Essai gratuit 14 jours' },
    { icon: Shield, label: 'Sans engagement' },
    { icon: CreditCard, label: 'Paiement sécurisé' },
  ]

  return (
    <section
      ref={ref}
      className="py-24 lg:py-32 relative overflow-hidden bg-muted/30 dark:bg-muted/10"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Glass panel */}
          <div
            className={cn(
              'rounded-3xl p-px',
              'bg-gradient-to-b from-primary/25 to-primary/5 dark:from-primary/20 dark:to-primary/5',
              'transition-all duration-700',
              isVisible ? 'opacity-100 translate-y-0 shadow-2xl shadow-primary/[0.06]' : 'opacity-0 translate-y-8'
            )}
          >
            <div className="rounded-[23px] bg-background/80 dark:bg-background/60 backdrop-blur-xl relative overflow-hidden">
              {/* Radial glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-primary/[0.04] dark:bg-primary/[0.08] blur-[80px] pointer-events-none" />

              <div className="relative px-8 py-16 lg:px-16 lg:py-20 text-center">
                {/* Title */}
                <h2
                  className={cn(
                    'text-[clamp(26px,4vw,40px)] font-[800] tracking-[-0.03em] leading-[1.15] text-foreground max-w-2xl mx-auto',
                    'transition-all duration-700 delay-150',
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                  )}
                >
                  Prêt à lancer votre réseau{' '}
                  <span className="text-gradient">de restaurants ?</span>
                </h2>

                {/* Subtitle */}
                <p
                  className={cn(
                    'mt-5 text-[16px] leading-relaxed text-muted-foreground max-w-lg mx-auto',
                    'transition-all duration-700 delay-250',
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  )}
                >
                  Rejoignez <span className="font-semibold text-foreground">120+ revendeurs</span> qui font confiance à IziRestau pour développer leur activité.
                </p>

                {/* CTAs */}
                <div
                  className={cn(
                    'mt-8 flex flex-col sm:flex-row justify-center gap-3',
                    'transition-all duration-700 delay-350',
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  )}
                >
                  <Link
                    href="/register"
                    className="group/btn inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full text-[15px] font-semibold bg-foreground text-background hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.97] shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_8px_32px_rgba(0,0,0,0.12)]"
                  >
                    Commencer gratuitement
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                  </Link>
                  <button
                    onClick={() => {
                      const el = document.getElementById('tarifs')
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-[15px] font-semibold border border-border/60 dark:border-white/[0.12] text-foreground hover:bg-muted/30 hover:border-border transition-all duration-300"
                  >
                    Voir les tarifs
                  </button>
                </div>

                {/* Trust line */}
                <div
                  className={cn(
                    'mt-8 flex flex-wrap justify-center gap-5',
                    'transition-all duration-700 delay-[450ms]',
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  )}
                >
                  {trustItems.map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <item.icon className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[13px] text-muted-foreground font-medium">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
