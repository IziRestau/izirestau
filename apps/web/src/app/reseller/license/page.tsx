'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { resellerNavigation, resellerPromoCard } from '@/config/reseller-navigation'
import { useQuery } from '@tanstack/react-query'
import { api, apiClient } from '@/lib/api-client'
import {
  CreditCard,
  Check,
  X,
  Calendar,
  Store,
  Globe,
  BarChart3,
  Headphones,
  Palette,
  Code,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
} from 'lucide-react'

export default function LicensePage() {
  const router = useRouter()
  const { accessToken } = useAuthStore()

  const { data: licenseData, isLoading } = useQuery({
    queryKey: ['reseller-license'],
    queryFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      return api.reseller.getLicense()
    },
    enabled: !!accessToken,
  })

  const { data: plansData } = useQuery({
    queryKey: ['license-plans'],
    queryFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      return api.reseller.getLicensePlans()
    },
    enabled: !!accessToken,
  })

  if (isLoading) {
    return (
      <PageSkeleton
        navigation={resellerNavigation}
        basePath="/reseller"
        title="Ma Licence"
        variant="detail"
      />
    )
  }

  const license = licenseData?.data as any
  const plans = plansData?.data || []
  const currentPlan = license?.plan as any
  const sitesUsed = license?.sitesUsed || 0
  const maxSites = currentPlan?.maxSites || 10
  const usagePercent = Math.round((sitesUsed / maxSites) * 100)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
            <CheckCircle size={12} />
            Actif
          </span>
        )
      case 'TRIALING':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            <Clock size={12} />
            Periode d'essai
          </span>
        )
      case 'PAST_DUE':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
            <AlertCircle size={12} />
            Paiement en retard
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <X size={12} />
            Annule
          </span>
        )
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
            {status}
          </span>
        )
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'PAID':
        return <span className="text-xs text-emerald-600">Paye</span>
      case 'PENDING':
        return <span className="text-xs text-amber-600">En attente</span>
      case 'FAILED':
        return <span className="text-xs text-red-600">Echoue</span>
      default:
        return <span className="text-xs text-gray-500">{status}</span>
    }
  }

  const featuresList = [
    { key: 'maxSites', label: 'Sites maximum', getValue: (p: any) => p.maxSites },
    { key: 'maxUsersPerSite', label: 'Utilisateurs par site', getValue: (p: any) => p.maxUsersPerSite },
    { key: 'hasCustomDomain', label: 'Domaine personnalise', icon: Globe, isBool: true },
    { key: 'hasAdvancedAnalytics', label: 'Analytics avances', icon: BarChart3, isBool: true },
    { key: 'hasPrioritySupport', label: 'Support prioritaire', icon: Headphones, isBool: true },
    { key: 'hasWhiteLabel', label: 'White label', icon: Palette, isBool: true },
    { key: 'hasApiAccess', label: 'Acces API', icon: Code, isBool: true },
  ]

  return (
    <DashboardLayout
      navigation={resellerNavigation}
      basePath="/reseller"
      promoCard={{
        ...resellerPromoCard,
        onButtonClick: () => router.push(resellerPromoCard.href),
      }}
    >
      <PageHeader
        title="Ma Licence"
        subtitle="Gerez votre abonnement et vos fonctionnalites"
        icon={CreditCard}
        badge={license?.status ? { 
          text: license.status === 'ACTIVE' ? 'Actif' : license.status === 'TRIALING' ? 'Essai' : license.status,
          variant: license.status === 'ACTIVE' ? 'success' : license.status === 'TRIALING' ? 'info' : 'warning'
        } : undefined}
      />
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 mb-6">
        {/* Carte principale - Utilisation (style dashboard) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900">Utilisation de votre licence</h3>
              <p className="text-sm text-gray-400 mt-1">Plan {currentPlan?.name || 'Standard'}</p>
            </div>
            {getStatusBadge(license?.status || 'ACTIVE')}
          </div>

          <div className="flex items-center gap-8">
            {/* Donut Chart */}
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle 
                  cx="50" cy="50" r="40" 
                  fill="none" 
                  stroke="#f3f4f6" 
                  strokeWidth="12" 
                />
                <circle 
                  cx="50" cy="50" r="40" 
                  fill="none" 
                  stroke="#10b981" 
                  strokeWidth="12" 
                  strokeDasharray={`${usagePercent * 2.51} 251`}
                  strokeLinecap="round" 
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{usagePercent}%</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1">
              <div className="text-3xl font-bold text-gray-900">{sitesUsed} / {maxSites}</div>
              <div className="text-sm text-gray-500 mb-3">restaurants utilises</div>
              <p className="text-sm text-gray-400 mb-4">
                Vous avez utilise {usagePercent}% de votre quota de restaurants.
                {usagePercent >= 80 && (
                  <span className="text-amber-600"> Pensez a upgrader votre plan.</span>
                )}
              </p>
              <button 
                onClick={() => router.push('/reseller/restaurants')}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Voir mes restaurants
              </button>
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{sitesUsed}</div>
              <div className="text-sm text-gray-500">Actifs</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{maxSites - sitesUsed}</div>
              <div className="text-sm text-gray-500">Disponibles</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{currentPlan?.maxUsersPerSite || 5}</div>
              <div className="text-sm text-gray-500">Users/site</div>
            </div>
          </div>
        </div>

        {/* Carte Abonnement */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Abonnement</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Plan actuel</span>
              <span className="font-semibold text-gray-900">{currentPlan?.name || 'Standard'}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Cycle</span>
              <span className="text-sm text-gray-900">
                {license?.billingCycle === 'YEARLY' ? 'Annuel' : 'Mensuel'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Montant</span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(Number(license?.billingCycle === 'YEARLY' ? currentPlan?.priceYearly : currentPlan?.priceMonthly) || 99)}
                <span className="text-sm font-normal text-gray-500">/{license?.billingCycle === 'YEARLY' ? 'an' : 'mois'}</span>
              </span>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Calendar size={14} />
                Prochain renouvellement
              </div>
              <div className="font-medium text-gray-900">
                {license?.currentPeriodEnd ? formatDate(license.currentPeriodEnd) : '-'}
              </div>
            </div>
          </div>

          <button 
            onClick={() => router.push('/reseller/license/upgrade')}
            className="w-full mt-6 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
          >
            <Zap size={16} />
            Changer de plan
          </button>
        </div>
      </div>

      {/* Fonctionnalites incluses */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Fonctionnalites incluses</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {featuresList.map((feature) => {
            const isIncluded = feature.isBool ? currentPlan?.[feature.key] : true
            const value = feature.getValue ? feature.getValue(currentPlan) : null
            const Icon = feature.icon || Store
            
            return (
              <div 
                key={feature.key}
                className={`flex items-center gap-3 p-3 rounded-xl ${isIncluded ? 'bg-emerald-50' : 'bg-gray-50'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isIncluded ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                  {feature.isBool ? (
                    isIncluded ? (
                      <Check size={16} className="text-emerald-600" />
                    ) : (
                      <X size={16} className="text-gray-400" />
                    )
                  ) : (
                    <Icon size={16} className="text-emerald-600" />
                  )}
                </div>
                <div>
                  <div className={`text-sm font-medium ${isIncluded ? 'text-gray-900' : 'text-gray-400'}`}>
                    {feature.label}
                  </div>
                  {value && (
                    <div className="text-xs text-gray-500">{value}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Historique des paiements */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Historique des paiements</h3>
          <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            Voir tout
          </button>
        </div>
        
        {license?.payments && license.payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Montant</th>
                  <th className="pb-3 font-medium">Statut</th>
                  <th className="pb-3 font-medium text-right">Facture</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {license.payments.slice(0, 5).map((payment: any) => (
                  <tr key={payment.id}>
                    <td className="py-3 text-gray-900">{formatDate(payment.createdAt)}</td>
                    <td className="py-3 font-medium text-gray-900">{formatCurrency(Number(payment.amount))}</td>
                    <td className="py-3">{getPaymentStatusBadge(payment.status)}</td>
                    <td className="py-3 text-right">
                      {payment.invoiceUrl ? (
                        <button 
                          onClick={() => window.open(payment.invoiceUrl, '_blank')}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Download size={16} className="text-gray-500" />
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <CreditCard size={20} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">Aucun paiement enregistre</p>
          </div>
        )}
      </div>

      </DashboardLayout>
  )
}
