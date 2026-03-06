'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { platformNavigation } from '@/config/platform-navigation'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { toast } from 'sonner'
import {
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Star,
  ArrowLeft,
  Users,
  Globe,
  BarChart3,
  Headphones,
  Palette,
  Code,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PlanFormModal } from './_components/PlanFormModal'

interface LicensePlan {
  id: string
  name: string
  slug: string
  description: string | null
  maxSites: number
  maxUsersPerSite: number
  priceMonthly: number
  priceYearly: number
  currency: string
  hasCustomDomain: boolean
  hasAdvancedAnalytics: boolean
  hasPrioritySupport: boolean
  hasWhiteLabel: boolean
  hasApiAccess: boolean
  isActive: boolean
  isPopular: boolean
  sortOrder: number
  _count: { licenses: number }
}

export default function PlansPage() {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const [selectedPlan, setSelectedPlan] = useState<LicensePlan | null>(null)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<LicensePlan | null>(null)

  const { data: plans, isLoading } = useQuery({
    queryKey: ['license-plans-admin'],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await apiClient.get<LicensePlan[]>('/platform/licenses/plans?includeInactive=true')
      return res.data
    },
    enabled: !!accessToken,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return apiClient.delete(`/platform/licenses/plans/${id}`)
    },
    onSuccess: () => {
      toast.success('Plan supprime/desactive')
      queryClient.invalidateQueries({ queryKey: ['license-plans-admin'] })
      setPlanToDelete(null)
    },
    onError: () => {
      toast.error('Erreur lors de la suppression')
    },
  })

  if (isLoading) {
    return (
      <PageSkeleton
        navigation={platformNavigation}
        basePath="/platform"
        title="Plans de licence"
        variant="list"
      />
    )
  }

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleEdit = (plan: LicensePlan) => {
    setSelectedPlan(plan)
    setIsFormModalOpen(true)
  }

  const handleCreate = () => {
    setSelectedPlan(null)
    setIsFormModalOpen(true)
  }

  const features = [
    { key: 'hasCustomDomain', label: 'Domaine personnalise', icon: Globe },
    { key: 'hasAdvancedAnalytics', label: 'Analytics avances', icon: BarChart3 },
    { key: 'hasPrioritySupport', label: 'Support prioritaire', icon: Headphones },
    { key: 'hasWhiteLabel', label: 'White label', icon: Palette },
    { key: 'hasApiAccess', label: 'Acces API', icon: Code },
  ]

  return (
    <DashboardLayout
      navigation={platformNavigation}
      basePath="/platform"
      pageTitle="Plans de licence"
    >
      <PageHeader
        title="Plans de licence"
        subtitle="Configurez les offres disponibles pour les revendeurs"
        icon={CreditCard}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/platform/licenses')}
              className="gap-2 h-10 px-4 rounded-xl"
            >
              <ArrowLeft size={16} />
              Retour
            </Button>
            <Button
              onClick={handleCreate}
              className="gap-2 h-10 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-white"
            >
              <Plus size={16} />
              Nouveau plan
            </Button>
          </div>
        }
      />

      {/* Plans Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        {plans?.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              'bg-white rounded-2xl border p-5 relative',
              !plan.isActive ? 'opacity-60 border-gray-200' : 'border-gray-100',
              plan.isPopular && plan.isActive && 'ring-2 ring-emerald-500'
            )}
          >
            {/* Badges */}
            <div className="flex items-center gap-2 mb-3">
              {plan.isPopular && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                  <Star size={10} />
                  Populaire
                </span>
              )}
              {!plan.isActive && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                  Inactif
                </span>
              )}
            </div>

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{plan.name}</h3>
                <p className="text-xs text-gray-400">{plan.slug}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(plan)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Pencil size={14} className="text-gray-500" />
                </button>
                <button
                  onClick={() => setPlanToDelete(plan)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={14} className="text-red-500" />
                </button>
              </div>
            </div>

            {/* Price */}
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-900">
                {formatCurrency(Number(plan.priceMonthly), plan.currency)}
              </span>
              <span className="text-gray-500 text-sm">/mois</span>
              <p className="text-xs text-gray-400 mt-1">
                ou {formatCurrency(Number(plan.priceYearly), plan.currency)}/an
              </p>
            </div>

            {/* Limits */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-gray-50 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-gray-500 mb-0.5">
                  <CreditCard size={12} />
                  <span className="text-[10px] uppercase font-medium">Sites</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{plan.maxSites}</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-gray-500 mb-0.5">
                  <Users size={12} />
                  <span className="text-[10px] uppercase font-medium">Users/site</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{plan.maxUsersPerSite}</span>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-1.5 mb-4">
              {features.map((feature) => {
                const isIncluded = plan[feature.key as keyof LicensePlan]
                const Icon = feature.icon
                return (
                  <div
                    key={feature.key}
                    className={cn(
                      'flex items-center gap-2 text-sm',
                      isIncluded ? 'text-gray-700' : 'text-gray-400'
                    )}
                  >
                    {isIncluded ? (
                      <Check size={14} className="text-emerald-500" />
                    ) : (
                      <X size={14} className="text-gray-300" />
                    )}
                    {feature.label}
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {plan._count.licenses} licence(s)
              </span>
              <span className="text-xs text-gray-400">
                Ordre: {plan.sortOrder}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {(!plans || plans.length === 0) && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <CreditCard size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun plan</h3>
          <p className="text-gray-500 mb-4">Creez votre premier plan de licence.</p>
          <Button onClick={handleCreate} className="gap-2">
            <Plus size={16} />
            Creer un plan
          </Button>
        </div>
      )}

      {/* Form Modal */}
      <PlanFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setSelectedPlan(null)
        }}
        plan={selectedPlan}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!planToDelete}
        onClose={() => setPlanToDelete(null)}
        onConfirm={() => planToDelete && deleteMutation.mutate(planToDelete.id)}
        title="Supprimer le plan"
        message={
          planToDelete?._count.licenses && planToDelete._count.licenses > 0
            ? `Ce plan a ${planToDelete._count.licenses} licence(s) active(s). Il sera desactive mais pas supprime.`
            : 'Etes-vous sur de vouloir supprimer ce plan ? Cette action est irreversible.'
        }
        confirmText="Supprimer"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </DashboardLayout>
  )
}
