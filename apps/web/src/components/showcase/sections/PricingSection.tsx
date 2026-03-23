'use client'

import { CheckCircle, Star } from 'lucide-react'
import { PricingConfig, DEFAULT_PRICING_CONFIG } from '@/types/showcase'

interface Plan {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  currency: string
  billingCycle: number
  billingCycleLabel: string | null
  isCustom: boolean
  isPopular: boolean
}

const BILLING_CYCLES: Record<number, string> = {
  1: 'mois',
  3: 'trimestre',
  6: 'semestre',
  12: 'an',
  24: '2 ans',
  36: '3 ans',
}

const PLATFORM_FEATURES = [
  'Site web professionnel personnalisable',
  'Système de commandes en ligne',
  'Caisse (POS) intégrée',
  'Gestion du menu et des produits',
  'Gestion des clients',
  'Statistiques et rapports',
  'Gestion de l\'inventaire',
  'Marketing et fidélisation',
]

interface PricingSectionProps {
  config: PricingConfig | null
  plans: Plan[]
  primaryColor: string
  onSelectPlan: (plan: Plan) => void
}

export function PricingSection({ config, plans, primaryColor, onSelectPlan }: PricingSectionProps) {
  const pricing = config || DEFAULT_PRICING_CONFIG
  
  if (!pricing.enabled || plans.length === 0) return null

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <section id="pricing" className="py-16 sm:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            {pricing.title}
          </h2>
          {pricing.subtitle && (
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {pricing.subtitle}
            </p>
          )}
        </div>

        <div className={`grid gap-6 lg:gap-8 ${
          plans.length === 1 ? 'max-w-md mx-auto' :
          plans.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto' :
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {plans.map((plan) => {
            const isHighlighted = plan.isPopular || plan.id === pricing.highlightedPlanId
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl p-6 lg:p-8 transition-all duration-300 ${
                  isHighlighted 
                    ? 'border-2 shadow-xl scale-[1.02] z-10' 
                    : 'border border-gray-100 hover:border-gray-200 hover:shadow-lg'
                }`}
                style={isHighlighted ? { borderColor: primaryColor } : {}}
              >
                {isHighlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span 
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 text-white text-sm font-medium rounded-full shadow-lg"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Star size={14} fill="currentColor" />
                      Populaire
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  {plan.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">{plan.description}</p>
                  )}
                </div>

                <div className="mb-8">
                  {plan.isCustom ? (
                    <div>
                      <span className="text-3xl font-bold text-gray-900">Sur devis</span>
                      <p className="text-sm text-gray-500 mt-1">Contactez-nous pour un tarif personnalisé</p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl lg:text-5xl font-bold text-gray-900">
                          {formatPrice(plan.price, plan.currency)}
                        </span>
                      </div>
                      <p className="text-gray-500 mt-1">
                        par {plan.billingCycleLabel || BILLING_CYCLES[plan.billingCycle] || `${plan.billingCycle} mois`}
                      </p>
                    </div>
                  )}
                </div>

                {pricing.showFeatures && (
                  <ul className="space-y-3 mb-8">
                    {PLATFORM_FEATURES.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-gray-600">
                        <CheckCircle 
                          size={18} 
                          className="flex-shrink-0 mt-0.5"
                          style={{ color: primaryColor }}
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  onClick={() => {
                    if (plan.isCustom) {
                      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
                    } else {
                      onSelectPlan(plan)
                    }
                  }}
                  className={`w-full py-3.5 px-6 text-center font-semibold rounded-xl transition-all duration-200 ${
                    isHighlighted
                      ? 'text-white hover:opacity-90 shadow-lg hover:shadow-xl'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                  style={isHighlighted ? { backgroundColor: primaryColor } : {}}
                >
                  {plan.isCustom ? 'Nous contacter' : pricing.ctaText}
                </button>
              </div>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Tous les plans incluent un support technique et des mises à jour régulières.
          </p>
        </div>
      </div>
    </section>
  )
}
