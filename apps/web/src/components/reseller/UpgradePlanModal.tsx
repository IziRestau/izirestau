'use client'

import { useState } from 'react'
import { X, Check, Zap, Rocket, Crown, Building2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

interface Plan {
  id: string
  name: string
  slug: string
  description: string | null
  maxSites: number
  maxUsersPerSite: number
  features: string[]
  hasCustomDomain: boolean
  hasAdvancedAnalytics: boolean
  hasPrioritySupport: boolean
  hasWhiteLabel: boolean
  hasApiAccess: boolean
  priceMonthly: number
  priceYearly: number
  currency: string
  isPopular: boolean
}

interface UpgradePlanModalProps {
  isOpen: boolean
  onClose: () => void
  plans: Plan[]
  currentPlan: Plan | null
  onSelectPlan?: (plan: Plan) => void
}

export function UpgradePlanModal({ 
  isOpen, 
  onClose, 
  plans, 
  currentPlan,
  onSelectPlan 
}: UpgradePlanModalProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  if (!isOpen) return null

  const getPlanIcon = (slug: string) => {
    switch (slug) {
      case 'starter':
        return Zap
      case 'pro':
        return Rocket
      case 'business':
        return Crown
      case 'enterprise':
        return Building2
      default:
        return Zap
    }
  }

  const handleSelectPlan = (plan: Plan) => {
    if (currentPlan?.id === plan.id) return
    
    if (onSelectPlan) {
      onSelectPlan(plan)
    } else {
      toast.info(`Pour passer au plan ${plan.name}, contactez notre equipe commerciale.`)
    }
    onClose()
  }

  const getPrice = (plan: Plan) => {
    return billingCycle === 'yearly' 
      ? Math.round(Number(plan.priceYearly) / 12) 
      : Number(plan.priceMonthly)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Changer de plan</h2>
            <p className="text-sm text-gray-500">Choisissez le plan adapte a vos besoins</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className={`text-sm ${billingCycle === 'monthly' ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
              Mensuel
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                billingCycle === 'yearly' ? 'bg-emerald-500' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                billingCycle === 'yearly' ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
            <span className={`text-sm ${billingCycle === 'yearly' ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
              Annuel
            </span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
              -17%
            </span>
          </div>

          {/* Plans Grid - 2x2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plans.map((plan) => {
              const PlanIcon = getPlanIcon(plan.slug)
              const isCurrentPlan = currentPlan?.id === plan.id
              const price = getPrice(plan)
              const isUpgrade = Number(plan.priceMonthly) > Number(currentPlan?.priceMonthly || 0)
              
              return (
                <div 
                  key={plan.id}
                  className={`relative rounded-xl border-2 p-4 transition-all ${
                    isCurrentPlan 
                      ? 'border-emerald-500 bg-emerald-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  {/* Badges */}
                  <div className="absolute -top-2.5 left-4 flex gap-2">
                    {plan.isPopular && !isCurrentPlan && (
                      <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-medium rounded-full">
                        Populaire
                      </span>
                    )}
                    {isCurrentPlan && (
                      <span className="px-2 py-0.5 bg-gray-900 text-white text-[10px] font-medium rounded-full">
                        Actuel
                      </span>
                    )}
                  </div>

                  {/* Plan Header */}
                  <div className="flex items-start justify-between mt-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isCurrentPlan ? 'bg-emerald-100' : 'bg-gray-100'
                      }`}>
                        <PlanIcon size={16} className={isCurrentPlan ? 'text-emerald-600' : 'text-gray-600'} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{plan.name}</h3>
                        <p className="text-xs text-gray-500">{plan.maxSites} sites</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">{price}€</div>
                      <div className="text-[10px] text-gray-500">/mois</div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full">
                      {plan.maxUsersPerSite} users/site
                    </span>
                    {plan.hasCustomDomain && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full">
                        Domaine perso
                      </span>
                    )}
                    {plan.hasAdvancedAnalytics && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full">
                        Analytics
                      </span>
                    )}
                    {plan.hasPrioritySupport && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full">
                        Support VIP
                      </span>
                    )}
                    {plan.hasWhiteLabel && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full">
                        White label
                      </span>
                    )}
                    {plan.hasApiAccess && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full">
                        API
                      </span>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="mt-4">
                    {isCurrentPlan ? (
                      <button
                        disabled
                        className="w-full px-3 py-2 bg-gray-100 text-gray-400 rounded-lg text-xs font-medium cursor-not-allowed"
                      >
                        Plan actuel
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSelectPlan(plan)}
                        className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                          isUpgrade
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                        }`}
                      >
                        {isUpgrade ? 'Upgrader' : 'Downgrader'}
                        <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Besoin d'aide ? <a href="mailto:support@iziresto.com" className="text-emerald-600 font-medium hover:underline">Contactez-nous</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
