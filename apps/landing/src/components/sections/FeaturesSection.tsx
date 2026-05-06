'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Store, BarChart3, KeyRound, CreditCard, Users, Webhook,
  ShoppingBag, Truck, Monitor, Package, Heart, Megaphone,
  Palette, LayoutDashboard, FileText, Globe, Headphones,
  Tag, Shield, Languages, UserCog, Fingerprint, Layers, Paintbrush,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Drawer, DrawerTrigger, DrawerContent, DrawerTitle } from '@/components/ui/drawer'
import { FeaturePopoverContent } from './features/FeaturePopover'

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

/* ── Media query hook ────────────────────────────────────────── */
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [breakpoint])
  return isMobile
}

/* ── Types ────────────────────────────────────────────────────── */
type Feature = {
  icon: typeof Store
  title: string
  description: string
  illustration: string
}

type ColPosition = 'left' | 'center' | 'right' | 'half-left' | 'half-right'

type Tab = {
  id: string
  label: string
  features: Feature[]
}

/* ── Features data ────────────────────────────────────────────── */
const tabs: Tab[] = [
  {
    id: 'restaurants',
    label: 'Pour les Restaurants',
    features: [
      {
        icon: ShoppingBag,
        title: 'Menu & Produits',
        description: 'Gérez vos catégories, produits, modificateurs et variantes avec une interface intuitive.',
        illustration: 'store',
      },
      {
        icon: Store,
        title: 'Commandes en temps réel',
        description: 'Recevez et traitez les commandes instantanément avec acceptation automatique ou manuelle.',
        illustration: 'chart',
      },
      {
        icon: Truck,
        title: 'Livraison & Zones',
        description: 'Définissez vos zones de livraison, gérez vos livreurs et suivez les courses en direct.',
        illustration: 'keys',
      },
      {
        icon: Monitor,
        title: 'Caisse POS',
        description: 'Une caisse enregistreuse complète avec gestion des rôles, PIN sécurisé et tickets personnalisés.',
        illustration: 'payment',
      },
      {
        icon: Package,
        title: 'Inventaire & Stock',
        description: 'Suivez vos ingrédients, recettes, fournisseurs et mouvements de stock avec alertes automatiques.',
        illustration: 'api',
      },
      {
        icon: Heart,
        title: 'Clients & Fidélité',
        description: 'Base clients complète avec programme de fidélité par points, bonus de bienvenue et parrainage.',
        illustration: 'crm',
      },
      {
        icon: Megaphone,
        title: 'Marketing & Promotions',
        description: 'Campagnes email, coupons, promotions et avis clients pour booster votre visibilité.',
        illustration: 'chart',
      },
      {
        icon: Palette,
        title: 'Site personnalisable',
        description: 'Thèmes, bannières, pages custom, sous-domaine dédié et domaine personnalisé.',
        illustration: 'store',
      },
    ],
  },
  {
    id: 'revendeurs',
    label: 'Pour les Revendeurs',
    features: [
      {
        icon: LayoutDashboard,
        title: 'Dashboard analytique',
        description: "Vue d'ensemble de votre activité : revenus, restaurants actifs, croissance et KPIs en temps réel.",
        illustration: 'chart',
      },
      {
        icon: Store,
        title: 'Gestion des restaurants',
        description: 'Créez, activez ou suspendez les sites de vos clients restaurateurs en quelques clics.',
        illustration: 'store',
      },
      {
        icon: KeyRound,
        title: 'Licences & Abonnements',
        description: 'Gérez les licences, suivez les souscriptions et les paiements de vos clients.',
        illustration: 'keys',
      },
      {
        icon: Users,
        title: 'CRM & Facturation',
        description: 'Suivi des leads, clients actifs, interactions, factures et paiements automatisés.',
        illustration: 'crm',
      },
      {
        icon: Tag,
        title: 'Plans tarifaires',
        description: 'Créez vos propres plans (mensuel, trimestriel, annuel) avec tarifs et cycles personnalisés.',
        illustration: 'payment',
      },
      {
        icon: Globe,
        title: 'Vitrine publique',
        description: "Page de présentation configurable avec templates, pricing et formulaire d'inscription.",
        illustration: 'store',
      },
      {
        icon: Paintbrush,
        title: 'Domaine personnalisé',
        description: 'Connectez votre propre domaine avec vérification DNS et certificat SSL automatique.',
        illustration: 'api',
      },
      {
        icon: Headphones,
        title: 'Support intégré',
        description: 'Système de tickets pour assister vos clients restaurateurs directement depuis la plateforme.',
        illustration: 'crm',
      },
    ],
  },
  {
    id: 'plateforme',
    label: 'Plateforme',
    features: [
      {
        icon: CreditCard,
        title: 'Multi-paiements',
        description: "Stripe, Moneroo et Paytech intégrés nativement pour s'adapter à chaque marché.",
        illustration: 'payment',
      },
      {
        icon: Languages,
        title: 'Multi-devises',
        description: 'Opérez en EUR, XOF et toute autre devise avec conversion et affichage automatiques.',
        illustration: 'chart',
      },
      {
        icon: UserCog,
        title: 'Rôles & Permissions',
        description: 'Système granulaire : super admin, revendeur, restaurateur, livreur, client — chacun son accès.',
        illustration: 'keys',
      },
      {
        icon: Layers,
        title: 'White-label complet',
        description: 'Logo, couleurs, domaine : chaque revendeur offre une expérience à sa propre marque.',
        illustration: 'store',
      },
      {
        icon: Webhook,
        title: 'API & Webhooks',
        description: 'API REST complète et webhooks temps réel pour connecter vos outils et automatiser vos workflows.',
        illustration: 'api',
      },
      {
        icon: Fingerprint,
        title: 'Sécurité 2FA',
        description: 'Authentification à deux facteurs, tokens sécurisés et codes de secours pour tous les comptes.',
        illustration: 'keys',
      },
    ],
  },
]

/* ── Micro-illustrations CSS ──────────────────────────────────── */
function MicroIllustration({ type }: { type: string }) {
  const base = 'absolute top-5 right-5 opacity-[0.06] dark:opacity-[0.08] pointer-events-none transition-opacity duration-300 group-hover:opacity-[0.1] dark:group-hover:opacity-[0.14]'

  switch (type) {
    case 'store':
      return (
        <div className={cn(base, 'w-16 h-14')}>
          <div className="grid grid-cols-3 gap-1 w-full h-full">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-sm bg-foreground" />
            ))}
          </div>
        </div>
      )
    case 'chart':
      return (
        <div className={cn(base, 'flex items-end gap-1 w-16 h-14')}>
          {[40, 65, 50, 80, 60, 90, 70].map((h, i) => (
            <div key={i} className="flex-1 rounded-sm bg-foreground" style={{ height: `${h}%` }} />
          ))}
        </div>
      )
    case 'keys':
      return (
        <div className={cn(base, 'w-14 h-14')}>
          <div className="w-full h-full rounded-full border-[3px] border-foreground relative">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1 h-5 bg-foreground rounded-full" />
          </div>
        </div>
      )
    case 'payment':
      return (
        <div className={cn(base, 'w-16 h-11 space-y-1')}>
          <div className="w-full h-3 rounded-sm bg-foreground" />
          <div className="w-2/3 h-2 rounded-sm bg-foreground" />
          <div className="w-1/3 h-2 rounded-sm bg-foreground" />
        </div>
      )
    case 'crm':
      return (
        <div className={cn(base, 'w-14 h-14 flex items-center justify-center')}>
          <div className="w-6 h-6 rounded-full bg-foreground" />
          <div className="w-4 h-4 rounded-full bg-foreground absolute -top-0 -right-0" />
          <div className="w-4 h-4 rounded-full bg-foreground absolute -bottom-0 -left-0" />
        </div>
      )
    case 'api':
      return (
        <div className={cn(base, 'w-16 h-14 flex flex-col justify-center gap-1.5')}>
          <div className="w-full h-0.5 bg-foreground rounded-full" />
          <div className="w-3/4 h-0.5 bg-foreground rounded-full" />
          <div className="w-full h-0.5 bg-foreground rounded-full" />
          <div className="w-1/2 h-0.5 bg-foreground rounded-full" />
        </div>
      )
    default:
      return null
  }
}

/* ── Feature Card ─────────────────────────────────────────────── */
function FeatureCard({
  feature,
  index,
  isVisible,
  isActive,
  onOpenChange,
  colPosition,
}: {
  feature: Feature
  index: number
  isVisible: boolean
  isActive: boolean
  onOpenChange: (open: boolean) => void
  colPosition: ColPosition
}) {
  const Icon = feature.icon
  const num = String(index + 1).padStart(2, '0')
  const isMobile = useIsMobile()
  const popoverSide = colPosition === 'right' || colPosition === 'half-right' ? 'left' as const : 'right' as const

  /* Shared card visual */
  const cardInner = (
    <div
      className={cn(
        'group relative rounded-2xl p-px cursor-pointer',
        'bg-gradient-to-b from-border/50 to-border/20 dark:from-white/[0.08] dark:to-white/[0.03]',
        isActive
          ? 'from-primary/40 to-primary/10 dark:from-primary/35 dark:to-primary/10 shadow-xl shadow-primary/[0.06] dark:shadow-primary/[0.12] -translate-y-1'
          : 'hover:from-primary/30 hover:to-primary/5 dark:hover:from-primary/25 dark:hover:to-primary/5 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/[0.04] dark:hover:shadow-primary/[0.08]',
        'transition-all duration-500',
      )}
    >
      <div className="relative rounded-[15px] bg-background p-6 lg:p-7 h-full overflow-hidden">
        <span className="absolute top-5 right-5 text-[13px] font-mono font-bold text-foreground/[0.06] dark:text-foreground/[0.08] select-none z-10">
          {num}
        </span>
        <MicroIllustration type={feature.illustration} />
        <div
          className={cn(
            'w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center mb-5',
            'transition-all duration-500 group-hover:scale-110 group-hover:rotate-[-6deg]',
            isVisible ? 'scale-100 rotate-0' : 'scale-50 rotate-12',
          )}
          style={{ transitionDelay: isVisible ? `${400 + index * 80}ms` : '0ms' }}
        >
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-[16px] font-bold text-foreground tracking-tight mb-2">
          {feature.title}
        </h3>
        <p className="text-[14px] leading-relaxed text-muted-foreground">
          {feature.description}
        </p>
        <div className="mt-4 flex items-center gap-1 text-[12px] font-medium text-primary/60 group-hover:text-primary transition-colors">
          <span>En savoir plus</span>
          <ChevronRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  )

  return (
    <div
      className={cn(
        'relative transition-all',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
      )}
      style={{
        transitionDelay: isVisible ? `${300 + index * 80}ms` : '0ms',
        transitionDuration: '700ms',
      }}
    >
      {isMobile ? (
        /* ── Mobile: Drawer ── */
        <Drawer open={isActive} onOpenChange={onOpenChange}>
          <DrawerTrigger asChild>
            {cardInner}
          </DrawerTrigger>
          <DrawerContent className="max-h-[80vh]">
            <DrawerTitle className="sr-only">{feature.title}</DrawerTitle>
            <div className="px-5 pt-3 pb-6 overflow-y-auto overscroll-contain popover-scroll">
              <FeaturePopoverContent
                title={feature.title}
                icon={feature.icon}
                onClose={() => onOpenChange(false)}
              />
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        /* ── Desktop: Popover ── */
        <Popover open={isActive} onOpenChange={onOpenChange}>
          <PopoverTrigger asChild>
            {cardInner}
          </PopoverTrigger>
          <PopoverContent
            side={popoverSide}
            align="center"
            sideOffset={12}
            collisionPadding={12}
            className="w-80 lg:w-[380px] p-4 rounded-xl border-border/60 dark:border-white/10 bg-background shadow-2xl shadow-black/10 dark:shadow-black/40 max-h-[45vh] overflow-y-auto overscroll-contain popover-scroll"
          >
            <FeaturePopoverContent
              title={feature.title}
              icon={feature.icon}
              onClose={() => onOpenChange(false)}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

/* ── Tab subtitles ────────────────────────────────────────────── */
const tabSubtitles: Record<string, string> = {
  restaurants: 'Tout pour piloter votre restaurant au quotidien.',
  revendeurs: 'Les outils pour développer et piloter votre réseau.',
  plateforme: 'Une infrastructure robuste, sécurisée et extensible.',
}

/* ── Features Section ─────────────────────────────────────────── */
export function FeaturesSection() {
  const { ref, isVisible } = useScrollReveal(0.05)
  const [activeTab, setActiveTab] = useState('restaurants')
  const [animating, setAnimating] = useState(false)
  const [displayedTab, setDisplayedTab] = useState('restaurants')
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right')
  const [activeFeature, setActiveFeature] = useState<string | null>(null)
  const tabBarRef = useRef<HTMLDivElement>(null)

  const handleFeatureOpenChange = useCallback((title: string, open: boolean) => {
    setActiveFeature(open ? title : null)
  }, [])

  const getColPosition = (index: number, total: number, isLastRow: boolean): ColPosition => {
    if (isLastRow && total % 3 !== 0) {
      return index === 0 ? 'half-left' : 'half-right'
    }
    const col = index % 3
    if (col === 0) return 'left'
    if (col === 2) return 'right'
    return 'center'
  }

  const handleTabChange = (tabId: string) => {
    if (tabId === activeTab || animating) return
    setActiveFeature(null)

    const currentIndex = tabs.findIndex(t => t.id === activeTab)
    const nextIndex = tabs.findIndex(t => t.id === tabId)
    setSlideDirection(nextIndex > currentIndex ? 'right' : 'left')

    setAnimating(true)
    setActiveTab(tabId)

    // Fade out → swap → fade in
    setTimeout(() => {
      setDisplayedTab(tabId)
      setTimeout(() => setAnimating(false), 50)
    }, 250)
  }

  const currentTab = tabs.find(t => t.id === displayedTab)!

  return (
    <section ref={ref} id="fonctionnalites" className="py-24 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-12 lg:mb-16">
          <p
            className={cn(
              'text-sm font-semibold text-primary tracking-wide uppercase mb-4',
              'transition-all duration-700',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            Fonctionnalités
          </p>
          <h2
            className={cn(
              'text-[clamp(28px,4vw,44px)] font-[800] tracking-[-0.03em] leading-[1.1] text-foreground',
              'transition-all duration-700 delay-100',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            )}
          >
            Tout ce dont vous avez besoin pour développer votre activité
          </h2>
          <p
            className={cn(
              'mt-5 text-[16px] leading-relaxed text-muted-foreground max-w-lg mx-auto',
              'transition-all duration-700 delay-200',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            Une suite d{"'"}outils complète pour les restaurateurs, les revendeurs et la gestion de plateforme.
          </p>
        </div>

        {/* Tabs pill bar */}
        <div
          className={cn(
            'flex flex-col items-center mb-12 lg:mb-16',
            'transition-all duration-700 delay-300',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <div
            ref={tabBarRef}
            className="relative inline-flex items-center gap-0.5 sm:gap-1 p-1 rounded-full border border-border/50 dark:border-white/10 bg-background/50 backdrop-blur-sm"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'relative z-10 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-sm font-medium transition-colors duration-300 whitespace-nowrap flex items-center gap-1.5 sm:gap-2',
                  activeTab === tab.id
                    ? 'text-background'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.replace('Pour les ', '').replace('Pour la ', '')}</span>
                <span className={cn(
                  'text-[11px] font-semibold px-1.5 py-0.5 rounded-full transition-all duration-300',
                  activeTab === tab.id
                    ? 'bg-background/20 text-background'
                    : 'bg-muted/50 text-muted-foreground'
                )}>
                  {tab.features.length}
                </span>
              </button>
            ))}

            {/* Sliding background indicator */}
            <div
              className="absolute top-1 bottom-1 rounded-full bg-foreground shadow-sm transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                left: (() => {
                  const idx = tabs.findIndex(t => t.id === activeTab)
                  if (!tabBarRef.current) return `${4 + idx * 33.33}%`
                  const buttons = tabBarRef.current.querySelectorAll('button')
                  if (!buttons[idx]) return '4px'
                  const bar = tabBarRef.current.getBoundingClientRect()
                  const btn = buttons[idx].getBoundingClientRect()
                  return `${btn.left - bar.left}px`
                })(),
                width: (() => {
                  const idx = tabs.findIndex(t => t.id === activeTab)
                  if (!tabBarRef.current) return '33.33%'
                  const buttons = tabBarRef.current.querySelectorAll('button')
                  if (!buttons[idx]) return '33.33%'
                  return `${buttons[idx].getBoundingClientRect().width}px`
                })(),
              }}
            />
          </div>

          {/* Subtitle contextuel */}
          <p className={cn(
            'mt-4 text-[14px] text-muted-foreground transition-all duration-300',
            animating ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
          )}>
            {tabSubtitles[displayedTab]}
          </p>
        </div>


        {/* Grille de cartes */}
        <div className="max-w-6xl mx-auto">
          <div
            className={cn(
              'transition-all duration-300',
              animating && slideDirection === 'right' && 'opacity-0 -translate-x-6',
              animating && slideDirection === 'left' && 'opacity-0 translate-x-6',
              !animating && 'opacity-100 translate-x-0'
            )}
          >
            {(() => {
              const cols = 3
              const total = currentTab.features.length
              const remainder = total % cols
              const completeCount = total - remainder
              const completeFeatures = currentTab.features.slice(0, completeCount)
              const remainingFeatures = currentTab.features.slice(completeCount)
              const isLastRow = remainder > 0

              return (
                <>
                  {completeFeatures.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {completeFeatures.map((feature, i) => (
                        <FeatureCard
                          key={`${displayedTab}-${feature.title}`}
                          feature={feature}
                          index={i}
                          isVisible={isVisible && !animating}
                          isActive={activeFeature === feature.title}
                          onOpenChange={(open) => handleFeatureOpenChange(feature.title, open)}
                          colPosition={getColPosition(i, total, false)}
                        />
                      ))}
                    </div>
                  )}
                  {remainingFeatures.length > 0 && (
                    <div className={cn(
                      'grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto',
                      completeFeatures.length > 0 && 'mt-5'
                    )}>
                      {remainingFeatures.map((feature, i) => (
                        <FeatureCard
                          key={`${displayedTab}-${feature.title}`}
                          feature={feature}
                          index={completeCount + i}
                          isVisible={isVisible && !animating}
                          isActive={activeFeature === feature.title}
                          onOpenChange={(open) => handleFeatureOpenChange(feature.title, open)}
                          colPosition={getColPosition(i, total, isLastRow)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        </div>
      </div>
    </section>
  )
}
