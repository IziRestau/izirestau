'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Check, X, ArrowRight, Sparkles, Store, Users, Globe,
  BarChart3, Headphones, Palette, Code, Shield, Clock, CreditCard,
  ChevronDown, Gem,
} from 'lucide-react'
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
type BillingCycle = 'monthly' | 'yearly'

type LicensePlan = {
  name: string
  slug: string
  tagline: string
  description: string
  maxSites: number
  maxUsersPerSite: number
  hasCustomDomain: boolean
  hasAdvancedAnalytics: boolean
  hasPrioritySupport: boolean
  hasWhiteLabel: boolean
  hasApiAccess: boolean
  priceMonthly: number | null
  priceYearly: number | null
  isPopular: boolean
  cta: { label: string; href: string }
}

/* ── Data (miroir du modèle LicensePlan Prisma) ───────────────── */
/*
 * Ces plans reflètent le modèle LicensePlan du schema Prisma.
 * En production, ils sont définis et modifiables depuis le
 * dashboard admin IziRestau (SUPER_ADMIN).
 */
const plans: LicensePlan[] = [
  {
    name: 'Starter',
    slug: 'starter',
    tagline: 'Pour démarrer',
    description: 'Idéal pour tester la plateforme avec un petit portefeuille de restaurants.',
    maxSites: 5,
    maxUsersPerSite: 3,
    hasCustomDomain: false,
    hasAdvancedAnalytics: false,
    hasPrioritySupport: false,
    hasWhiteLabel: false,
    hasApiAccess: false,
    priceMonthly: 29,
    priceYearly: 290,
    isPopular: false,
    cta: { label: 'Commencer', href: '/register?plan=starter' },
  },
  {
    name: 'Pro',
    slug: 'pro',
    tagline: 'Le plus populaire',
    description: 'Pour les revendeurs qui veulent scaler leur réseau avec toutes les fonctionnalités clés.',
    maxSites: 50,
    maxUsersPerSite: 10,
    hasCustomDomain: true,
    hasAdvancedAnalytics: true,
    hasPrioritySupport: true,
    hasWhiteLabel: true,
    hasApiAccess: false,
    priceMonthly: 79,
    priceYearly: 790,
    isPopular: true,
    cta: { label: 'Commencer gratuitement', href: '/register?plan=pro' },
  },
  {
    name: 'Entreprise',
    slug: 'enterprise',
    tagline: 'Sur mesure',
    description: 'Pour les grandes structures avec des besoins spécifiques, un SLA et un accès API complet.',
    maxSites: -1,
    maxUsersPerSite: -1,
    hasCustomDomain: true,
    hasAdvancedAnalytics: true,
    hasPrioritySupport: true,
    hasWhiteLabel: true,
    hasApiAccess: true,
    priceMonthly: null,
    priceYearly: null,
    isPopular: false,
    cta: { label: 'Nous contacter', href: '/contact' },
  },
]

/* ── Feature comparison rows ──────────────────────────────────── */
type FeatureRow = {
  label: string
  icon: typeof Store
  values: [string | boolean, string | boolean, string | boolean]
}

const featureRows: FeatureRow[] = [
  { label: 'Restaurants', icon: Store, values: ['5', '50', 'Illimité'] },
  { label: 'Utilisateurs / site', icon: Users, values: ['3', '10', 'Illimité'] },
  { label: 'Domaine personnalisé', icon: Globe, values: [false, true, true] },
  { label: 'Analytics avancés', icon: BarChart3, values: [false, true, true] },
  { label: 'Support prioritaire', icon: Headphones, values: [false, true, true] },
  { label: 'White-label', icon: Palette, values: [false, true, true] },
  { label: 'Accès API', icon: Code, values: [false, false, true] },
]

/* ── FAQ data ─────────────────────────────────────────────────── */
const faqItems = [
  {
    q: 'Puis-je changer de plan à tout moment ?',
    a: 'Oui, vous pouvez upgrader ou downgrader votre licence à tout moment depuis votre tableau de bord. Le changement est effectif immédiatement.',
  },
  {
    q: 'Y a-t-il un engagement ?',
    a: 'Aucun engagement. Vous pouvez annuler votre licence à tout moment. En facturation annuelle, le remboursement est au prorata.',
  },
  {
    q: 'Quels moyens de paiement acceptez-vous ?',
    a: 'Carte bancaire (Visa, Mastercard) via Stripe, et mobile money (Orange Money, Wave) via Moneroo et Paytech pour l\'Afrique de l\'Ouest.',
  },
]

/* ── Animated Price ───────────────────────────────────────────── */
function AnimatedPrice({ plan, cycle, direction }: { plan: LicensePlan; cycle: BillingCycle; direction: 'left' | 'right' | 'none' }) {
  if (plan.priceMonthly === null) {
    return (
      <div className="text-center lg:text-right">
        <div
          key={`${plan.slug}-custom`}
          className={cn(
            'text-[42px] lg:text-[56px] font-[800] tracking-tight text-foreground leading-none',
            direction === 'right' && 'animate-slide-in-right',
            direction === 'left' && 'animate-slide-in-left',
            direction === 'none' && 'animate-price-in',
          )}
        >
          Sur mesure
        </div>
        <p className="mt-3 text-[14px] text-muted-foreground">
          Contactez-nous pour un devis personnalisé
        </p>
      </div>
    )
  }

  const isYearly = cycle === 'yearly'
  const price = isYearly ? plan.priceYearly : plan.priceMonthly

  return (
    <div className="text-center lg:text-right">
      <div className="relative inline-block">
        {/* Glow behind price for popular plan */}
        {plan.isPopular && (
          <div className="absolute inset-0 scale-150 rounded-full bg-primary/10 dark:bg-primary/15 blur-[40px] pointer-events-none" />
        )}
        <span
          key={`${plan.slug}-${cycle}`}
          className={cn(
            'relative text-[64px] lg:text-[80px] font-[800] tracking-tight text-foreground leading-none inline-block',
            direction === 'right' && 'animate-slide-in-right',
            direction === 'left' && 'animate-slide-in-left',
            direction === 'none' && 'animate-price-in',
          )}
        >
          {price}
          <span className="text-[28px] lg:text-[32px] font-[600] text-muted-foreground">€</span>
        </span>
      </div>
      <p className="mt-2 text-[15px] text-muted-foreground">
        {isYearly ? (
          <>par an · soit <span className="font-semibold text-foreground">~{Math.round(price! / 12)}€/mois</span></>
        ) : (
          'par mois'
        )}
      </p>
    </div>
  )
}

/* ── FAQ Item ─────────────────────────────────────────────────── */
function FAQItem({ item, index, isVisible }: { item: typeof faqItems[0]; index: number; isVisible: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className={cn(
        'border-b border-border/30 dark:border-white/[0.04] last:border-b-0 transition-all duration-500',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
      )}
      style={{ transitionDelay: `${700 + index * 80}ms` }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <span className="text-[14px] font-medium text-foreground group-hover:text-primary transition-colors pr-4">
          {item.q}
        </span>
        <ChevronDown className={cn(
          'w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-300',
          open && 'rotate-180'
        )} />
      </button>
      <div className={cn(
        'overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
        open ? 'max-h-40 opacity-100 pb-4' : 'max-h-0 opacity-0 pb-0'
      )}>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          {item.a}
        </p>
      </div>
    </div>
  )
}

/* ── Section ──────────────────────────────────────────────────── */
export function PricingSection() {
  const { ref, isVisible } = useScrollReveal(0.05)
  const [activePlan, setActivePlan] = useState(1)
  const [prevPlan, setPrevPlan] = useState(1)
  const [cycle, setCycle] = useState<BillingCycle>('monthly')
  const [slideDir, setSlideDir] = useState<'left' | 'right' | 'none'>('none')

  const plan = plans[activePlan]

  const handlePlanChange = useCallback((newIndex: number) => {
    if (newIndex === activePlan) return
    setPrevPlan(activePlan)
    setSlideDir(newIndex > activePlan ? 'right' : 'left')
    setActivePlan(newIndex)
  }, [activePlan])

  // Trust badges data
  const trustBadges = [
    { icon: Clock, label: 'Essai gratuit 14 jours' },
    { icon: Shield, label: 'Sans engagement' },
    { icon: CreditCard, label: 'Paiement sécurisé' },
  ]

  return (
    <section
      ref={ref}
      id="tarifs"
      className="py-24 lg:py-32 relative overflow-hidden bg-muted/30 dark:bg-muted/10"
    >
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full bg-primary/[0.02] dark:bg-primary/[0.03] blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ── Header ── */}
        <div className="max-w-2xl mx-auto text-center mb-12 lg:mb-16">
          {/* Badge label with icon */}
          <div
            className={cn(
              'inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 dark:bg-primary/10 mb-5',
              'transition-all duration-700',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <Gem className="w-3.5 h-3.5 text-primary" />
            <span className="text-[12px] font-semibold text-primary uppercase tracking-wider">
              Tarifs
            </span>
          </div>

          <h2
            className={cn(
              'text-[clamp(28px,4vw,44px)] font-[800] tracking-[-0.03em] leading-[1.1] text-foreground',
              'transition-all duration-700 delay-100',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            )}
          >
            Des tarifs simples et{' '}
            <span className="text-gradient">transparents</span>
          </h2>

          {/* Trust pills instead of subtitle paragraph */}
          <div
            className={cn(
              'mt-6 flex flex-wrap justify-center gap-3',
              'transition-all duration-700 delay-200',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            {trustBadges.map((badge) => (
              <div
                key={badge.label}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/40 dark:border-white/[0.06] bg-background/60 dark:bg-background/30 backdrop-blur-sm"
              >
                <badge.icon className="w-3.5 h-3.5 text-primary" />
                <span className="text-[13px] font-medium text-muted-foreground">
                  {badge.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Billing toggle ── */}
        <div
          className={cn(
            'flex justify-center mb-8',
            'transition-all duration-700 delay-250',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <div className="inline-flex items-center gap-3 text-sm">
            <button
              onClick={() => setCycle('monthly')}
              className={cn(
                'font-medium transition-colors',
                cycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Mensuel
            </button>
            <button
              onClick={() => setCycle(c => c === 'monthly' ? 'yearly' : 'monthly')}
              className="relative w-11 h-6 rounded-full bg-border/60 dark:bg-white/[0.12] transition-colors data-[active=true]:bg-primary/60"
              data-active={cycle === 'yearly'}
            >
              <div className={cn(
                'absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300',
                cycle === 'yearly' ? 'left-6' : 'left-1'
              )} />
            </button>
            <button
              onClick={() => setCycle('yearly')}
              className={cn(
                'font-medium transition-colors flex items-center gap-1.5',
                cycle === 'yearly' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Annuel
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 dark:bg-primary/15 text-primary">
                -17%
              </span>
            </button>
          </div>
        </div>

        {/* ── Plan selector cards ── */}
        <div
          className={cn(
            'max-w-6xl mx-auto mb-10 lg:mb-14',
            'transition-all duration-700 delay-300',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {plans.map((p, i) => {
              const isActive = activePlan === i
              const price = cycle === 'yearly' ? p.priceYearly : p.priceMonthly

              return (
                <button
                  key={p.slug}
                  onClick={() => handlePlanChange(i)}
                  className={cn(
                    'group relative rounded-2xl p-px transition-all duration-400 text-left',
                    isActive
                      ? 'bg-gradient-to-b from-primary/40 to-primary/15 shadow-lg shadow-primary/[0.08]'
                      : 'bg-gradient-to-b from-border/40 to-border/15 hover:from-border/60 hover:to-border/25',
                  )}
                >
                  <div className={cn(
                    'rounded-[15px] px-5 py-4 bg-background/80 dark:bg-background/60 backdrop-blur-xl transition-colors duration-300',
                    isActive && 'bg-background/95 dark:bg-background/70',
                  )}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {p.isPopular && (
                          <Sparkles className={cn(
                            'w-3.5 h-3.5 transition-colors duration-300',
                            isActive ? 'text-primary' : 'text-primary/50'
                          )} />
                        )}
                        <span className={cn(
                          'text-[14px] font-semibold transition-colors duration-300',
                          isActive ? 'text-foreground' : 'text-muted-foreground'
                        )}>
                          {p.name}
                        </span>
                      </div>
                      {/* Active indicator */}
                      <div className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300',
                        isActive
                          ? 'border-primary bg-primary'
                          : 'border-border/60 dark:border-white/[0.15]'
                      )}>
                        {isActive && (
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        )}
                      </div>
                    </div>
                    <p className="text-[12px] text-muted-foreground mb-3 leading-relaxed">
                      {p.tagline}
                    </p>
                    <div className="flex items-baseline gap-1">
                      {price !== null ? (
                        <>
                          <span className={cn(
                            'text-[28px] font-[800] tracking-tight leading-none transition-colors duration-300',
                            isActive ? 'text-foreground' : 'text-muted-foreground'
                          )}>
                            {price}€
                          </span>
                          <span className="text-[13px] text-muted-foreground font-medium">
                            /{cycle === 'yearly' ? 'an' : 'mois'}
                          </span>
                        </>
                      ) : (
                        <span className={cn(
                          'text-[28px] font-[800] tracking-tight leading-none transition-colors duration-300',
                          isActive ? 'text-foreground' : 'text-muted-foreground'
                        )}>
                          Sur mesure
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Main pricing panel (glass) ── */}
        <div className="max-w-6xl mx-auto">
          <div
            className={cn(
              'rounded-3xl p-px transition-all duration-500',
              plan.isPopular
                ? 'bg-gradient-to-b from-primary/30 to-primary/5 dark:from-primary/25 dark:to-primary/5 shadow-2xl shadow-primary/[0.06] dark:shadow-primary/[0.12]'
                : 'bg-gradient-to-b from-border/50 to-border/20 dark:from-white/[0.08] dark:to-white/[0.03]'
            )}
          >
            <div className="rounded-[23px] bg-background/70 dark:bg-background/50 backdrop-blur-xl overflow-hidden">
              {/* Top section — plan details + price */}
              <div className="p-8 lg:p-12">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                  {/* Left: plan info */}
                  <div className="lg:max-w-md">
                    <h3
                      key={`${plan.slug}-tagline`}
                      className={cn(
                        'text-[13px] font-semibold text-primary uppercase tracking-wider mb-3',
                        slideDir === 'right' && 'animate-slide-in-right',
                        slideDir === 'left' && 'animate-slide-in-left',
                      )}
                    >
                      {plan.tagline}
                    </h3>
                    <p
                      key={`${plan.slug}-desc`}
                      className={cn(
                        'text-[15px] text-muted-foreground leading-relaxed',
                        slideDir === 'right' && 'animate-slide-in-right',
                        slideDir === 'left' && 'animate-slide-in-left',
                        slideDir === 'none' && 'animate-price-in',
                      )}
                    >
                      {plan.description}
                    </p>
                  </div>

                  {/* Right: price hero */}
                  <AnimatedPrice plan={plan} cycle={cycle} direction={slideDir} />
                </div>

                {/* CTA + social proof */}
                <div className="mt-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <Link
                    key={`${plan.slug}-cta`}
                    href={plan.cta.href}
                    className={cn(
                      'group/btn inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-[15px] font-semibold transition-all duration-300 active:scale-[0.97]',
                      slideDir === 'right' && 'animate-slide-in-right',
                      slideDir === 'left' && 'animate-slide-in-left',
                      slideDir === 'none' && 'animate-price-in',
                      plan.isPopular
                        ? 'bg-foreground text-background hover:-translate-y-0.5 shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_8px_32px_rgba(0,0,0,0.12)]'
                        : 'border border-border/60 dark:border-white/[0.12] text-foreground hover:bg-muted/30 hover:border-border'
                    )}
                  >
                    {plan.cta.label}
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                  </Link>

                  {/* Social proof */}
                  <div className="flex items-center gap-3">
                    {/* Mini avatar stack */}
                    <div className="flex -space-x-2">
                      {[
                        'bg-emerald-400', 'bg-blue-400', 'bg-amber-400', 'bg-violet-400'
                      ].map((color, i) => (
                        <div
                          key={i}
                          className={cn(
                            'w-7 h-7 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold text-white',
                            color
                          )}
                        >
                          {['ZM', 'AK', 'SN', 'LB'][i]}
                        </div>
                      ))}
                    </div>
                    <span className="text-[13px] text-muted-foreground">
                      <span className="font-semibold text-foreground">120+</span> revendeurs actifs
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Feature grid (always visible, with stagger) ── */}
              <div className="border-t border-border/30 dark:border-white/[0.04]">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  {featureRows.map((row, i) => {
                    const value = row.values[activePlan]
                    const isIncluded = typeof value === 'boolean' ? value : true

                    return (
                      <div
                        key={row.label}
                        className={cn(
                          'flex items-center gap-3 px-6 lg:px-5 py-4',
                          'border-b sm:border-b-0 border-border/20 dark:border-white/[0.03]',
                          // Vertical borders between columns
                          'sm:[&:nth-child(n+2)]:border-l lg:[&:nth-child(n+2)]:border-l',
                          'sm:[&:nth-child(2n+1)]:border-l-0 lg:[&:nth-child(2n+1)]:border-l',
                          'lg:[&:nth-child(4n+1)]:border-l-0',
                          // Bottom border for first row on lg
                          'lg:[&:nth-child(-n+4)]:border-b lg:border-b-0',
                          'border-border/20 dark:border-white/[0.03]',
                          'transition-all duration-300',
                          !isIncluded && 'opacity-35',
                        )}
                        style={{
                          transitionDelay: `${i * 40}ms`,
                        }}
                      >
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300',
                          isIncluded
                            ? 'bg-primary/10 dark:bg-primary/15'
                            : 'bg-muted/50 dark:bg-muted/30'
                        )}>
                          {typeof value === 'boolean' ? (
                            value ? (
                              <Check className="w-4 h-4 text-primary" strokeWidth={2.5} />
                            ) : (
                              <X className="w-4 h-4 text-muted-foreground/50" strokeWidth={2} />
                            )
                          ) : (
                            <row.icon className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium text-foreground truncate">
                            {row.label}
                          </div>
                          {typeof value === 'string' && (
                            <div className="text-[12px] text-muted-foreground font-medium">
                              {value}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── Comparison table (always visible, desktop) ── */}
          <div
            className={cn(
              'mt-8 transition-all duration-700 delay-500',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            )}
          >
            <div className="hidden lg:block">
              <div className="rounded-2xl border border-border/40 dark:border-white/[0.06] bg-background/50 dark:bg-background/30 backdrop-blur-sm overflow-hidden">
                {/* Column headers */}
                <div className="grid grid-cols-[1fr_repeat(3,minmax(130px,1fr))] items-center">
                  <div className="px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Comparatif
                  </div>
                  {plans.map((p, i) => (
                    <button
                      key={p.slug}
                      onClick={() => handlePlanChange(i)}
                      className={cn(
                        'px-4 py-3 text-[12px] font-semibold text-center transition-all duration-300 border-l border-border/20 dark:border-white/[0.04]',
                        activePlan === i
                          ? 'text-primary bg-primary/[0.04] dark:bg-primary/[0.08]'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>

                {/* Rows with stagger */}
                {featureRows.map((row, i) => (
                  <div
                    key={row.label}
                    className={cn(
                      'grid grid-cols-[1fr_repeat(3,minmax(130px,1fr))] items-center border-t border-border/20 dark:border-white/[0.04]',
                      i % 2 === 1 && 'bg-muted/15 dark:bg-muted/5',
                      'transition-all duration-500',
                      isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4',
                    )}
                    style={{ transitionDelay: `${600 + i * 60}ms` }}
                  >
                    <div className="px-5 py-3 text-[13px] text-muted-foreground flex items-center gap-2.5">
                      <row.icon className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                      {row.label}
                    </div>
                    {row.values.map((val, vi) => (
                      <div
                        key={vi}
                        className={cn(
                          'px-4 py-3 text-center border-l border-border/20 dark:border-white/[0.04] transition-all duration-300',
                          activePlan === vi && 'bg-primary/[0.04] dark:bg-primary/[0.08]',
                        )}
                      >
                        {typeof val === 'boolean' ? (
                          val ? (
                            <Check className="w-4 h-4 text-primary mx-auto" strokeWidth={2.5} />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground/25 mx-auto" strokeWidth={2} />
                          )
                        ) : (
                          <span className="text-[13px] font-medium text-foreground">{val}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── FAQ mini ── */}
          <div
            className={cn(
              'mt-12 lg:mt-16 transition-all duration-700',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            )}
            style={{ transitionDelay: '600ms' }}
          >
            <h3 className="text-[14px] font-semibold text-foreground mb-4">
              Questions fréquentes
            </h3>
            <div className="rounded-2xl border border-border/40 dark:border-white/[0.06] bg-background/50 dark:bg-background/30 backdrop-blur-sm divide-y divide-border/30 dark:divide-white/[0.04] px-6">
              {faqItems.map((item, i) => (
                <FAQItem key={i} item={item} index={i} isVisible={isVisible} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
