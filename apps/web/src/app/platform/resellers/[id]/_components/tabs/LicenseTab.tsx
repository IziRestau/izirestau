'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  CreditCard,
  Calendar,
  CheckCircle,
  AlertCircle,
  Pencil,
  Check,
  X,
  Globe,
  BarChart3,
  Headphones,
  Palette,
  Code,
  Store,
  Users,
  XCircle,
  Play,
  Clock,
  MoreHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import type { ResellerDetails } from '../types'
import { cn } from '@/lib/utils'
import { ChangeLicenseModal } from '../modals/ChangeLicenseModal'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'

interface LicenseTabProps {
  reseller: ResellerDetails
}

const statusLabels: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700' },
  TRIALING: { label: 'Essai', color: 'bg-blue-100 text-blue-700' },
  PAST_DUE: { label: 'Impaye', color: 'bg-orange-100 text-orange-700' },
  CANCELLED: { label: 'Annulee', color: 'bg-red-100 text-red-700' },
  UNPAID: { label: 'Non payee', color: 'bg-red-100 text-red-700' },
  PAUSED: { label: 'En pause', color: 'bg-gray-100 text-gray-600' },
}

const featuresList = [
  { key: 'maxSites', label: 'Sites maximum', icon: Store, getValue: (p: any) => p.maxSites },
  { key: 'maxUsersPerSite', label: 'Utilisateurs par site', icon: Users, getValue: (p: any) => p.maxUsersPerSite },
  { key: 'hasCustomDomain', label: 'Domaine personnalise', icon: Globe, isBool: true },
  { key: 'hasAdvancedAnalytics', label: 'Analytics avances', icon: BarChart3, isBool: true },
  { key: 'hasPrioritySupport', label: 'Support prioritaire', icon: Headphones, isBool: true },
  { key: 'hasWhiteLabel', label: 'White label', icon: Palette, isBool: true },
  { key: 'hasApiAccess', label: 'Acces API', icon: Code, isBool: true },
]

export function LicenseTab({ reseller }: LicenseTabProps) {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const [isChangeLicenseModalOpen, setIsChangeLicenseModalOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'cancel' | 'reactivate' | 'extend' | null>(null)
  const license = reseller.license
  const plan = license?.plan

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return apiClient.post(`/platform/licenses/${license?.id}/cancel`, { immediate: true })
    },
    onSuccess: () => {
      toast.success('Licence annulee')
      queryClient.invalidateQueries({ queryKey: ['platform-reseller', reseller.id] })
      setConfirmAction(null)
    },
    onError: () => toast.error('Erreur lors de l\'annulation'),
  })

  const reactivateMutation = useMutation({
    mutationFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return apiClient.post(`/platform/licenses/${license?.id}/reactivate`)
    },
    onSuccess: () => {
      toast.success('Licence reactivee')
      queryClient.invalidateQueries({ queryKey: ['platform-reseller', reseller.id] })
      setConfirmAction(null)
    },
    onError: () => toast.error('Erreur lors de la reactivation'),
  })

  const extendTrialMutation = useMutation({
    mutationFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return apiClient.post(`/platform/licenses/${license?.id}/extend-trial`, { days: 7 })
    },
    onSuccess: () => {
      toast.success('Essai prolonge de 7 jours')
      queryClient.invalidateQueries({ queryKey: ['platform-reseller', reseller.id] })
      setConfirmAction(null)
    },
    onError: () => toast.error('Erreur lors de la prolongation'),
  })

  if (!license || !plan) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <CreditCard size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune licence</h3>
        <p className="text-gray-500">Ce revendeur n'a pas de licence assignee.</p>
      </div>
    )
  }

  const usagePercent = plan.maxSites > 0 ? Math.round((license.sitesUsed / plan.maxSites) * 100) : 0
  const statusConfig = statusLabels[license.status] || statusLabels.ACTIVE
  const isCancelled = license.status === 'CANCELLED'
  const isTrialing = license.status === 'TRIALING'

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: plan.currency || 'EUR',
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        {/* Usage Card with Donut */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900">Utilisation de la licence</h3>
              <p className="text-sm text-gray-400 mt-1">Plan {plan.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('px-3 py-1 rounded-full text-sm font-medium', statusConfig.color)}>
                {statusConfig.label}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreHorizontal size={16} className="text-gray-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50">
                  {isCancelled ? (
                    <DropdownMenuItem 
                      onClick={() => setConfirmAction('reactivate')}
                      className="rounded-lg px-3 py-2.5 cursor-pointer text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50"
                    >
                      <Play size={16} className="mr-3" />
                      <span className="text-[13px]">Reactiver</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem 
                      onClick={() => setConfirmAction('cancel')}
                      className="rounded-lg px-3 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                    >
                      <XCircle size={16} className="mr-3" />
                      <span className="text-[13px]">Annuler la licence</span>
                    </DropdownMenuItem>
                  )}
                  {isTrialing && (
                    <>
                      <DropdownMenuSeparator className="my-1" />
                      <DropdownMenuItem 
                        onClick={() => setConfirmAction('extend')}
                        className="rounded-lg px-3 py-2.5 cursor-pointer text-blue-600 focus:text-blue-600 focus:bg-blue-50"
                      >
                        <Clock size={16} className="mr-3" />
                        <span className="text-[13px]">Prolonger l'essai (+7j)</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8">
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
                  stroke={usagePercent >= 90 ? '#ef4444' : usagePercent >= 70 ? '#f59e0b' : '#10b981'}
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
            <div className="flex-1 text-center sm:text-left">
              <div className="text-3xl font-bold text-gray-900">{license.sitesUsed} / {plan.maxSites}</div>
              <div className="text-sm text-gray-500 mb-3">restaurants utilises</div>
              <p className="text-sm text-gray-400 mb-4">
                {usagePercent >= 80 ? (
                  <span className="text-amber-600">Quota presque atteint. Envisagez un upgrade.</span>
                ) : (
                  `${plan.maxSites - license.sitesUsed} sites disponibles`
                )}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChangeLicenseModalOpen(true)}
                className="gap-2 h-9 rounded-xl"
              >
                <Pencil size={14} />
                Changer de plan
              </Button>
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{license.sitesUsed}</div>
              <div className="text-sm text-gray-500">Actifs</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{plan.maxSites - license.sitesUsed}</div>
              <div className="text-sm text-gray-500">Disponibles</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{plan.maxUsersPerSite || 5}</div>
              <div className="text-sm text-gray-500">Users/site</div>
            </div>
          </div>
        </div>

        {/* Subscription Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Abonnement</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Plan actuel</span>
              <span className="font-semibold text-gray-900">{plan.name}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Cycle</span>
              <span className="text-sm text-gray-900">
                {license.billingCycle === 'YEARLY' ? 'Annuel' : 'Mensuel'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Montant</span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(Number(license.billingCycle === 'YEARLY' ? plan.priceYearly : plan.priceMonthly))}
                <span className="text-sm font-normal text-gray-500">/{license.billingCycle === 'YEARLY' ? 'an' : 'mois'}</span>
              </span>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Calendar size={14} />
                Prochain renouvellement
              </div>
              <div className="font-medium text-gray-900">
                {license.currentPeriodEnd 
                  ? format(new Date(license.currentPeriodEnd), 'dd MMMM yyyy', { locale: fr })
                  : '-'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Fonctionnalites incluses</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {featuresList.map((feature) => {
            const isIncluded = feature.isBool ? (plan as any)[feature.key] : true
            const value = feature.getValue ? feature.getValue(plan) : null
            const Icon = feature.icon
            
            return (
              <div 
                key={feature.key}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl',
                  isIncluded ? 'bg-emerald-50' : 'bg-gray-50'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  isIncluded ? 'bg-emerald-100' : 'bg-gray-100'
                )}>
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
                  <div className={cn(
                    'text-sm font-medium',
                    isIncluded ? 'text-gray-900' : 'text-gray-400'
                  )}>
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

      {license.payments && license.payments.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-medium text-gray-900">Historique des paiements</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {license.payments.map((payment) => (
              <div key={payment.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {payment.status === 'PAID' ? (
                    <CheckCircle size={20} className="text-green-500" />
                  ) : (
                    <AlertCircle size={20} className="text-yellow-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: payment.currency || 'EUR' }).format(Number(payment.amount))}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(payment.createdAt), 'dd MMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  payment.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                )}>
                  {payment.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ChangeLicenseModal
        isOpen={isChangeLicenseModalOpen}
        onClose={() => setIsChangeLicenseModalOpen(false)}
        resellerId={reseller.id}
        currentPlanId={plan?.id}
      />

      {/* Confirm Cancel */}
      <ConfirmModal
        isOpen={confirmAction === 'cancel'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => cancelMutation.mutate()}
        title="Annuler la licence"
        message="Etes-vous sur de vouloir annuler cette licence ? Le revendeur perdra l'acces a ses fonctionnalites."
        confirmText="Annuler la licence"
        variant="danger"
        isLoading={cancelMutation.isPending}
      />

      {/* Confirm Reactivate */}
      <ConfirmModal
        isOpen={confirmAction === 'reactivate'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => reactivateMutation.mutate()}
        title="Reactiver la licence"
        message="Voulez-vous reactiver cette licence ? Le revendeur retrouvera l'acces a ses fonctionnalites."
        confirmText="Reactiver"
        variant="info"
        isLoading={reactivateMutation.isPending}
      />

      {/* Confirm Extend Trial */}
      <ConfirmModal
        isOpen={confirmAction === 'extend'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => extendTrialMutation.mutate()}
        title="Prolonger l'essai"
        message="Voulez-vous prolonger la periode d'essai de 7 jours supplementaires ?"
        confirmText="Prolonger"
        variant="info"
        isLoading={extendTrialMutation.isPending}
      />
    </div>
  )
}
