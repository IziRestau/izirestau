'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { UserPlus, Settings, Rocket, TrendingUp, Clock, ArrowRight, CheckCircle2 } from 'lucide-react'
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

/* ── Types ────────────────────────────────────────────────────── */
type Step = {
  num: string
  icon: typeof UserPlus
  title: string
  description: string
  bullets: string[]
  duration: string
  illustration: 'form' | 'pricing' | 'browser' | 'dashboard'
}

/* ── Data ─────────────────────────────────────────────────────── */
const steps: Step[] = [
  {
    num: '01',
    icon: UserPlus,
    title: 'Créez votre compte revendeur',
    description: 'Inscription en quelques minutes. Renseignez votre entreprise, choisissez votre plan, et accédez immédiatement à votre tableau de bord dédié.',
    bullets: [
      'Formulaire simple en 3 étapes',
      'Vérification email instantanée',
      'Accès immédiat au dashboard',
    ],
    duration: '2 min',
    illustration: 'form',
  },
  {
    num: '02',
    icon: Settings,
    title: 'Configurez vos offres',
    description: 'Créez vos propres plans tarifaires, définissez vos marges, et personnalisez les fonctionnalités incluses dans chaque formule.',
    bullets: [
      'Plans illimités avec cycles personnalisés',
      'Tarification flexible par fonctionnalité',
      'Périodes d\'essai configurables',
    ],
    duration: '5 min',
    illustration: 'pricing',
  },
  {
    num: '03',
    icon: Rocket,
    title: 'Déployez vos restaurants',
    description: 'Créez les sites de commande de vos clients en un clic. Chaque restaurant obtient son propre site personnalisable, son menu digital et sa caisse POS.',
    bullets: [
      'Déploiement en un clic',
      'Site & menu pré-configurés',
      'Domaine personnalisé ou sous-domaine',
    ],
    duration: '1 min / restaurant',
    illustration: 'browser',
  },
  {
    num: '04',
    icon: TrendingUp,
    title: 'Suivez et développez votre réseau',
    description: 'Pilotez votre activité depuis un dashboard analytique complet. Revenus, restaurants actifs, licences, support client — tout est centralisé.',
    bullets: [
      'KPIs en temps réel',
      'Alertes & notifications',
      'Support intégré pour vos clients',
    ],
    duration: 'En continu',
    illustration: 'dashboard',
  },
]

/* ── Step Illustrations (CSS art) ─────────────────────────────── */
function StepIllustration({ type, isVisible }: { type: Step['illustration']; isVisible: boolean }) {
  const base = cn(
    'w-full h-full transition-all duration-700',
    isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
  )

  switch (type) {
    case 'form':
      return (
        <div className={cn(base, 'flex flex-col gap-3 p-6 group/illus')}>
          {/* Form skeleton */}
          <div className="space-y-3 transition-transform duration-500 group-hover/illus:translate-y-[-2px]">
            <div className="h-2.5 w-16 rounded-full bg-foreground/[0.08] dark:bg-foreground/[0.12]" />
            <div className="h-9 w-full rounded-lg border border-border/50 dark:border-white/[0.08] bg-muted/30" />
          </div>
          <div className="space-y-3 transition-transform duration-500 delay-75 group-hover/illus:translate-y-[-2px]">
            <div className="h-2.5 w-20 rounded-full bg-foreground/[0.08] dark:bg-foreground/[0.12]" />
            <div className="h-9 w-full rounded-lg border border-border/50 dark:border-white/[0.08] bg-muted/30" />
          </div>
          <div className="space-y-3 transition-transform duration-500 delay-100 group-hover/illus:translate-y-[-2px]">
            <div className="h-2.5 w-14 rounded-full bg-foreground/[0.08] dark:bg-foreground/[0.12]" />
            <div className="h-9 w-full rounded-lg border border-border/50 dark:border-white/[0.08] bg-muted/30" />
          </div>
          <div className="mt-2 h-10 w-full rounded-xl bg-primary/20 dark:bg-primary/25 flex items-center justify-center transition-all duration-500 delay-150 group-hover/illus:translate-y-[-2px] group-hover/illus:bg-primary/30">
            <div className="h-2.5 w-20 rounded-full bg-primary/50" />
          </div>
        </div>
      )

    case 'pricing':
      return (
        <div className={cn(base, 'flex items-center gap-3 p-6 group/illus')}>
          {[
            { name: 'Starter', active: false },
            { name: 'Pro', active: true },
            { name: 'Entreprise', active: false },
          ].map((plan, idx) => (
            <div
              key={plan.name}
              className={cn(
                'flex-1 rounded-xl border p-3 flex flex-col items-center gap-2 transition-all duration-500',
                plan.active
                  ? 'border-primary/30 bg-primary/[0.06] dark:bg-primary/[0.10] shadow-sm shadow-primary/10 group-hover/illus:-translate-y-1 group-hover/illus:shadow-md group-hover/illus:shadow-primary/15'
                  : 'border-border/40 dark:border-white/[0.06] bg-muted/20'
              )}
              style={{ transitionDelay: `${idx * 50}ms` }}
            >
              <div className="h-2 w-12 rounded-full bg-foreground/[0.08] dark:bg-foreground/[0.12]" />
              <div className={cn(
                'text-[18px] font-bold tracking-tight',
                plan.active ? 'text-primary/60' : 'text-foreground/[0.12]'
              )}>
                ••
              </div>
              <div className="w-full space-y-1.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      plan.active ? 'bg-primary/40' : 'bg-foreground/[0.08]'
                    )} />
                    <div className="h-1.5 flex-1 rounded-full bg-foreground/[0.06] dark:bg-foreground/[0.08]" />
                  </div>
                ))}
              </div>
              <div className={cn(
                'mt-1 h-6 w-full rounded-md',
                plan.active ? 'bg-primary/20' : 'bg-foreground/[0.04] dark:bg-foreground/[0.06]'
              )} />
            </div>
          ))}
        </div>
      )

    case 'browser':
      return (
        <div className={cn(base, 'p-5 group/illus')}>
          {/* Browser chrome */}
          <div className="rounded-xl border border-border/50 dark:border-white/[0.08] overflow-hidden bg-muted/20 transition-all duration-500 group-hover/illus:shadow-lg group-hover/illus:shadow-primary/[0.06]">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 dark:border-white/[0.06] bg-muted/30">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-foreground/[0.10]" />
                <div className="w-2 h-2 rounded-full bg-foreground/[0.10]" />
                <div className="w-2 h-2 rounded-full bg-foreground/[0.10]" />
              </div>
              <div className="flex-1 h-5 rounded-md bg-foreground/[0.05] dark:bg-foreground/[0.08] mx-4 flex items-center px-2">
                <div className="h-1.5 w-24 rounded-full bg-foreground/[0.08]" />
              </div>
            </div>
            {/* Page content */}
            <div className="p-3 space-y-3">
              {/* Hero area */}
              <div className="h-14 rounded-lg bg-primary/[0.06] dark:bg-primary/[0.10] flex items-center justify-center transition-colors duration-500 group-hover/illus:bg-primary/[0.10]">
                <div className="h-2 w-20 rounded-full bg-primary/30" />
              </div>
              {/* Products grid */}
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-1.5 transition-transform duration-500 group-hover/illus:translate-y-[-1px]" style={{ transitionDelay: `${i * 40}ms` }}>
                    <div className="aspect-square rounded-md bg-foreground/[0.04] dark:bg-foreground/[0.06]" />
                    <div className="h-1.5 w-3/4 rounded-full bg-foreground/[0.06]" />
                    <div className="h-1.5 w-1/2 rounded-full bg-primary/20" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )

    case 'dashboard':
      return (
        <div className={cn(base, 'p-5 group/illus')}>
          <div className="rounded-xl border border-border/50 dark:border-white/[0.08] overflow-hidden bg-muted/20 transition-all duration-500 group-hover/illus:shadow-lg group-hover/illus:shadow-primary/[0.06]">
            <div className="flex">
              {/* Sidebar */}
              <div className="w-10 border-r border-border/30 dark:border-white/[0.06] p-2 space-y-3 bg-muted/30">
                <div className="w-full aspect-square rounded-md bg-primary/25" />
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-full aspect-square rounded-md bg-foreground/[0.06]" />
                ))}
              </div>
              {/* Main */}
              <div className="flex-1 p-3 space-y-3">
                {/* KPI row */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { color: 'bg-primary/20', w: 'w-8' },
                    { color: 'bg-foreground/[0.06]', w: 'w-10' },
                    { color: 'bg-foreground/[0.06]', w: 'w-7' },
                  ].map((kpi, i) => (
                    <div key={i} className="rounded-md border border-border/30 dark:border-white/[0.06] p-2 space-y-1.5 transition-transform duration-500 group-hover/illus:translate-y-[-1px]" style={{ transitionDelay: `${i * 40}ms` }}>
                      <div className={cn('h-3 rounded-sm', kpi.w, kpi.color)} />
                      <div className="h-1.5 w-full rounded-full bg-foreground/[0.04]" />
                    </div>
                  ))}
                </div>
                {/* Chart */}
                <div className="rounded-md border border-border/30 dark:border-white/[0.06] p-2">
                  <div className="flex items-end gap-1 h-16">
                    {[35, 50, 40, 65, 55, 75, 60, 80, 70, 85].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm bg-primary/20 dark:bg-primary/25 transition-all duration-500 group-hover/illus:bg-primary/30"
                        style={{ height: `${h}%`, transitionDelay: `${i * 30}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )

    default:
      return null
  }
}

/* ── Timeline Node (with active fill state) ───────────────────── */
function TimelineNode({ isVisible, delay }: { isVisible: boolean; delay: number }) {
  return (
    <div
      className={cn(
        'relative z-10 transition-all duration-500',
        isVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Pulse ring */}
      <div className={cn(
        'absolute inset-0 rounded-full bg-primary/20',
        isVisible && 'animate-timeline-pulse'
      )} />
      {/* Core dot — fills with primary when step becomes visible */}
      <div className={cn(
        'relative w-4 h-4 rounded-full border-2 border-primary shadow-sm shadow-primary/20 transition-colors duration-500',
        isVisible ? 'bg-primary' : 'bg-background'
      )} />
    </div>
  )
}

/* ── Step Card ────────────────────────────────────────────────── */
function StepCard({ step, index }: { step: Step; index: number }) {
  const { ref, isVisible } = useScrollReveal(0.15)
  const Icon = step.icon
  const isEven = index % 2 === 0

  return (
    <div ref={ref} className="relative">
      {/* ── Desktop layout: alternating ── */}
      <div className="hidden lg:flex items-center gap-0">
        {isEven ? (
          <>
            {/* Card on left */}
            <div
              className={cn(
                'flex-1 min-w-0 pr-8 transition-all duration-700',
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10',
              )}
              style={{ transitionDelay: isVisible ? '200ms' : '0ms' }}
            >
              <CardContent step={step} icon={Icon} isVisible={isVisible} align="right" />
            </div>
            {/* Center node */}
            <div className="shrink-0 w-[80px] flex justify-center">
              <TimelineNode isVisible={isVisible} delay={100} />
            </div>
            {/* Illustration on right */}
            <div
              className={cn(
                'flex-1 min-w-0 pl-8 transition-all duration-700',
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10',
              )}
              style={{ transitionDelay: isVisible ? '300ms' : '0ms' }}
            >
              <IllustrationWrapper step={step} isVisible={isVisible} />
            </div>
          </>
        ) : (
          <>
            {/* Illustration on left */}
            <div
              className={cn(
                'flex-1 min-w-0 pr-8 transition-all duration-700',
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10',
              )}
              style={{ transitionDelay: isVisible ? '300ms' : '0ms' }}
            >
              <IllustrationWrapper step={step} isVisible={isVisible} />
            </div>
            {/* Center node */}
            <div className="shrink-0 w-[80px] flex justify-center">
              <TimelineNode isVisible={isVisible} delay={100} />
            </div>
            {/* Card on right */}
            <div
              className={cn(
                'flex-1 min-w-0 pl-8 transition-all duration-700',
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10',
              )}
              style={{ transitionDelay: isVisible ? '200ms' : '0ms' }}
            >
              <CardContent step={step} icon={Icon} isVisible={isVisible} align="left" />
            </div>
          </>
        )}
      </div>

      {/* ── Mobile layout: stacked (no illustrations) ── */}
      <div className="lg:hidden flex gap-4">
        {/* Left timeline rail */}
        <div className="shrink-0 w-4 flex justify-center pt-1">
          <TimelineNode isVisible={isVisible} delay={100} />
        </div>

        {/* Card only — illustrations hidden on mobile */}
        <div
          className={cn(
            'flex-1 min-w-0 transition-all duration-700',
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6',
          )}
          style={{ transitionDelay: isVisible ? '200ms' : '0ms' }}
        >
          <CardContent step={step} icon={Icon} isVisible={isVisible} align="left" />
        </div>
      </div>
    </div>
  )
}

/* ── Card Content ─────────────────────────────────────────────── */
function CardContent({
  step,
  icon: Icon,
  isVisible,
  align,
}: {
  step: Step
  icon: typeof UserPlus
  isVisible: boolean
  align: 'left' | 'right'
}) {
  return (
    <div className={cn(
      'group relative rounded-2xl p-px',
      'bg-gradient-to-b from-border/50 to-border/20 dark:from-white/[0.08] dark:to-white/[0.03]',
      'hover:from-primary/30 hover:to-primary/5 dark:hover:from-primary/25 dark:hover:to-primary/5',
      'transition-all duration-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/[0.04] dark:hover:shadow-primary/[0.08]',
    )}>
      <div className={cn(
        'relative rounded-[15px] bg-background p-7 lg:p-8 overflow-hidden',
        align === 'right' && 'text-right'
      )}>
        {/* Background number — #5: more visible opacity */}
        <span className={cn(
          'absolute top-4 text-[72px] font-[900] font-mono leading-none select-none pointer-events-none',
          'text-foreground/[0.06] dark:text-foreground/[0.08]',
          align === 'right' ? 'left-6' : 'right-6'
        )}>
          {step.num}
        </span>

        {/* Icon */}
        <div
          className={cn(
            'w-12 h-12 rounded-2xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center mb-5',
            'transition-all duration-500 group-hover:scale-110 group-hover:rotate-[-6deg]',
            isVisible ? 'scale-100 rotate-0' : 'scale-50 rotate-12',
            align === 'right' && 'ml-auto'
          )}
          style={{ transitionDelay: isVisible ? '400ms' : '0ms' }}
        >
          <Icon className="w-6 h-6 text-primary" />
        </div>

        {/* Title */}
        <h3 className="text-[20px] font-bold text-foreground tracking-tight mb-3">
          {step.title}
        </h3>

        {/* Description */}
        <p className="text-[15px] leading-relaxed text-muted-foreground mb-5">
          {step.description}
        </p>

        {/* Bullet points */}
        <ul className={cn('space-y-2.5 mb-5', align === 'right' && 'flex flex-col items-end')}>
          {step.bullets.map((bullet, i) => (
            <li
              key={i}
              className={cn(
                'flex items-center gap-2.5 text-[14px] text-muted-foreground transition-all duration-500',
                isVisible ? 'opacity-100 translate-x-0' : align === 'right' ? 'opacity-0 translate-x-4' : 'opacity-0 -translate-x-4',
                align === 'right' && 'flex-row-reverse'
              )}
              style={{ transitionDelay: isVisible ? `${500 + i * 80}ms` : '0ms' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>

        {/* Duration badge */}
        <div
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/[0.08] dark:bg-primary/[0.12] border border-primary/10 dark:border-primary/15',
            'transition-all duration-500',
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90',
            align === 'right' && 'float-right'
          )}
          style={{ transitionDelay: isVisible ? '700ms' : '0ms' }}
        >
          <Clock className="w-3.5 h-3.5 text-primary/70" />
          <span className="text-[12px] font-semibold text-primary tracking-tight">{step.duration}</span>
        </div>
      </div>
    </div>
  )
}

/* ── Illustration Wrapper ─────────────────────────────────────── */
function IllustrationWrapper({ step, isVisible }: { step: Step; isVisible: boolean }) {
  return (
    <div className={cn(
      'rounded-2xl p-px',
      'bg-gradient-to-b from-border/30 to-border/10 dark:from-white/[0.05] dark:to-white/[0.02]',
    )}>
      <div className="rounded-[15px] bg-background/50 dark:bg-background/30 backdrop-blur-sm overflow-hidden h-full min-h-[200px]">
        <StepIllustration type={step.illustration} isVisible={isVisible} />
      </div>
    </div>
  )
}

/* ── Completion Node (end of timeline) ────────────────────────── */
function CompletionNode({ isVisible }: { isVisible: boolean }) {
  return (
    <div
      className={cn(
        'transition-all duration-700',
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
      )}
      style={{ transitionDelay: '500ms' }}
    >
      <div className="relative">
        {/* Glow */}
        <div className="absolute inset-0 rounded-full bg-primary/30 blur-md animate-timeline-pulse" />
        {/* Check icon */}
        <div className="relative w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
          <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
      </div>
    </div>
  )
}

/* ── Section ──────────────────────────────────────────────────── */
export function HowItWorksSection() {
  const { ref, isVisible } = useScrollReveal(0.05)
  const { ref: completionRef, isVisible: completionVisible } = useScrollReveal(0.1)
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollReveal(0.1)

  return (
    <section ref={ref} id="comment-ca-marche" className="py-24 lg:py-32 relative overflow-hidden">
      {/* Subtle radial gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/[0.02] dark:bg-primary/[0.04] blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16 lg:mb-20">
          <p
            className={cn(
              'text-sm font-semibold text-primary tracking-wide uppercase mb-4',
              'transition-all duration-700',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            Comment ça marche
          </p>
          <h2
            className={cn(
              'text-[clamp(28px,4vw,44px)] font-[800] tracking-[-0.03em] leading-[1.1] text-foreground',
              'transition-all duration-700 delay-100',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            )}
          >
            Lancez votre activité en{' '}
            <span className="text-gradient">4 étapes</span>
          </h2>
          <p
            className={cn(
              'mt-5 text-[16px] leading-relaxed text-muted-foreground max-w-lg mx-auto',
              'transition-all duration-700 delay-200',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            De l{"'"}inscription au premier restaurant déployé, le processus est simple et guidé.
          </p>
        </div>

        {/* Timeline + Steps */}
        <div className="max-w-6xl mx-auto relative">
          {/* ── Continuous vertical line (Desktop: centered, Mobile: left) ── */}
          {/* Desktop line */}
          <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 z-0 pointer-events-none">
            <div
              className={cn(
                'w-[2px] h-full rounded-full transition-all duration-[1.5s] origin-top',
                'bg-gradient-to-b from-border/20 via-border/50 to-border/20 dark:from-white/[0.04] dark:via-white/[0.12] dark:to-white/[0.04]',
                isVisible ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'
              )}
              style={{ transitionDelay: '400ms' }}
            />
            {/* Luminous pulse traveling down the line */}
            <div
              className={cn(
                'absolute left-0 right-0 top-0 bottom-0 overflow-hidden',
                isVisible ? 'opacity-100' : 'opacity-0'
              )}
            >
              <div className="absolute left-0 right-0 h-24 animate-scroll-line">
                <div className="w-full h-full bg-gradient-to-b from-transparent via-primary/50 to-transparent blur-[3px]" />
              </div>
            </div>
          </div>

          {/* Mobile line */}
          <div className="lg:hidden absolute left-[7px] top-0 bottom-0 z-0 pointer-events-none">
            <div
              className={cn(
                'w-[2px] h-full rounded-full transition-all duration-[1.5s] origin-top',
                'bg-gradient-to-b from-border/20 via-border/50 to-border/20 dark:from-white/[0.04] dark:via-white/[0.12] dark:to-white/[0.04]',
                isVisible ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'
              )}
              style={{ transitionDelay: '400ms' }}
            />
          </div>

          {/* Steps */}
          <div className="relative z-10 flex flex-col gap-12 lg:gap-16">
            {steps.map((step, index) => (
              <StepCard key={step.num} step={step} index={index} />
            ))}
          </div>

          {/* ── Completion check at end of timeline ── */}
          <div ref={completionRef} className="relative z-10 mt-12 lg:mt-16">
            {/* Desktop: centered */}
            <div className="hidden lg:flex justify-center">
              <CompletionNode isVisible={completionVisible} />
            </div>
            {/* Mobile: left-aligned */}
            <div className="lg:hidden flex gap-4">
              <div className="shrink-0 w-4 flex justify-center">
                <CompletionNode isVisible={completionVisible} />
              </div>
              <div className="flex-1" />
            </div>
          </div>
        </div>

        {/* ── CTA at section end ── */}
        <div
          ref={ctaRef}
          className={cn(
            'mt-16 lg:mt-20 text-center transition-all duration-700',
            ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          )}
          style={{ transitionDelay: '200ms' }}
        >
          <p className="text-muted-foreground text-[15px] mb-6">
            Prêt à lancer votre activité de revendeur ?
          </p>
          <Link
            href="/register"
            className={cn(
              'group/cta inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-[15px] font-semibold',
              'bg-foreground text-background',
              'shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.08)]',
              'dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_4px_16px_rgba(0,0,0,0.3)]',
              'hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_8px_32px_rgba(0,0,0,0.12)]',
              'active:scale-[0.97] transition-all duration-300',
            )}
          >
            Créer mon compte gratuitement
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/cta:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  )
}

