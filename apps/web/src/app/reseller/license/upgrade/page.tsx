'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { resellerNavigation } from '@/config/reseller-navigation'
import { useQuery } from '@tanstack/react-query'
import { api, apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { Check, X, CreditCard } from 'lucide-react'

export default function UpgradePlanPage() {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const { data: licenseData, isLoading: isLoadingLicense } = useQuery({
    queryKey: ['reseller-license'],
    queryFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      return api.reseller.getLicense()
    },
    enabled: !!accessToken,
  })

  const { data: plansData, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['license-plans'],
    queryFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      return api.reseller.getLicensePlans()
    },
    enabled: !!accessToken,
  })

  if (isLoadingLicense || isLoadingPlans) {
    return (
      <PageSkeleton
        navigation={resellerNavigation}
        basePath="/reseller"
        title="Changer de plan"
        variant="detail"
      />
    )
  }

  const license = licenseData?.data as any
  const plans = (plansData?.data || []) as any[]
  const currentPlan = license?.plan as any

  const handleSelectPlan = (plan: any) => {
    if (currentPlan?.id === plan.id) return
    toast.info(`Pour passer au plan ${plan.name}, contactez notre equipe commerciale.`)
  }

  return (
    <DashboardLayout
      navigation={resellerNavigation}
      basePath="/reseller"
    >
      <PageHeader
        title="Changer de plan"
        subtitle="Selectionnez le plan adapte a vos besoins"
        icon={CreditCard}
        actions={
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                billingCycle === 'monthly' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                billingCycle === 'yearly' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Annuel
              <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded">
                -17%
              </span>
            </button>
          </div>
        }
      />

      {/* Plans Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan: any) => {
          const isCurrentPlan = currentPlan?.id === plan.id
          const isUpgrade = Number(plan.priceMonthly) > Number(currentPlan?.priceMonthly || 0)
          const price = billingCycle === 'yearly' ? Number(plan.priceYearly) : Number(plan.priceMonthly)
          const priceLabel = billingCycle === 'yearly' ? '/an' : '/mois'
          
          return (
            <div 
              key={plan.id}
              className={`bg-white rounded-2xl border p-5 ${
                isCurrentPlan 
                  ? 'border-emerald-500 ring-1 ring-emerald-500' 
                  : 'border-gray-100'
              }`}
            >
              {/* Badges */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                {plan.isPopular && !isCurrentPlan && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-medium rounded-full">
                    Populaire
                  </span>
                )}
                {isCurrentPlan && (
                  <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-medium rounded-full">
                    Actuel
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">{price}€</span>
                <span className="text-gray-500 text-sm">{priceLabel}</span>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-500 mb-4">
                {plan.description || `Jusqu'a ${plan.maxSites} restaurants`}
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-5 text-sm">
                <li className="flex items-center gap-2 text-gray-700">
                  <Check size={14} className="text-emerald-500 flex-shrink-0" />
                  {plan.maxSites} restaurants
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <Check size={14} className="text-emerald-500 flex-shrink-0" />
                  {plan.maxUsersPerSite} utilisateurs/site
                </li>
                <li className={`flex items-center gap-2 ${plan.hasCustomDomain ? 'text-gray-700' : 'text-gray-400'}`}>
                  {plan.hasCustomDomain ? (
                    <Check size={14} className="text-emerald-500 flex-shrink-0" />
                  ) : (
                    <X size={14} className="text-gray-300 flex-shrink-0" />
                  )}
                  Domaine personnalise
                </li>
                <li className={`flex items-center gap-2 ${plan.hasAdvancedAnalytics ? 'text-gray-700' : 'text-gray-400'}`}>
                  {plan.hasAdvancedAnalytics ? (
                    <Check size={14} className="text-emerald-500 flex-shrink-0" />
                  ) : (
                    <X size={14} className="text-gray-300 flex-shrink-0" />
                  )}
                  Analytics avances
                </li>
                <li className={`flex items-center gap-2 ${plan.hasPrioritySupport ? 'text-gray-700' : 'text-gray-400'}`}>
                  {plan.hasPrioritySupport ? (
                    <Check size={14} className="text-emerald-500 flex-shrink-0" />
                  ) : (
                    <X size={14} className="text-gray-300 flex-shrink-0" />
                  )}
                  Support prioritaire
                </li>
                <li className={`flex items-center gap-2 ${plan.hasWhiteLabel ? 'text-gray-700' : 'text-gray-400'}`}>
                  {plan.hasWhiteLabel ? (
                    <Check size={14} className="text-emerald-500 flex-shrink-0" />
                  ) : (
                    <X size={14} className="text-gray-300 flex-shrink-0" />
                  )}
                  White label
                </li>
                <li className={`flex items-center gap-2 ${plan.hasApiAccess ? 'text-gray-700' : 'text-gray-400'}`}>
                  {plan.hasApiAccess ? (
                    <Check size={14} className="text-emerald-500 flex-shrink-0" />
                  ) : (
                    <X size={14} className="text-gray-300 flex-shrink-0" />
                  )}
                  Acces API
                </li>
              </ul>

              {/* Button */}
              {isCurrentPlan ? (
                <button
                  disabled
                  className="w-full px-4 py-2.5 bg-gray-100 text-gray-400 rounded-xl text-sm font-medium cursor-not-allowed"
                >
                  Plan actuel
                </button>
              ) : (
                <button
                  onClick={() => handleSelectPlan(plan)}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isUpgrade
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {isUpgrade ? 'Passer a ce plan' : 'Changer de plan'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Help */}
      <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-900">Besoin d'un plan sur mesure ?</h3>
            <p className="text-sm text-gray-500 mt-1">Contactez notre equipe pour discuter de vos besoins specifiques.</p>
          </div>
          <a 
            href="mailto:support@iziresto.com"
            className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors text-center"
          >
            Nous contacter
          </a>
        </div>
      </div>
    </DashboardLayout>
  )
}
