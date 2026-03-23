'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { StatsCard } from '@/components/reseller'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { resellerNavigation, resellerPromoCard } from '@/config/reseller-navigation'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { PlanFormModal } from '@/components/reseller/plans/PlanFormModal'
import {
  Package,
  Plus,
  MoreHorizontal,
  Star,
  Archive,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Users,
  Search,
  CheckCircle,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
  isActive: boolean
  isArchived: boolean
  isPopular: boolean
  isPublic: boolean
  sortOrder: number
  subscribersCount: number
  createdAt: string
}

const BILLING_CYCLES: Record<number, string> = {
  1: 'mois',
  3: 'trimestre',
  6: 'semestre',
  12: 'an',
  24: '2 ans',
  36: '3 ans',
}

export default function PlansPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: plansData, isLoading } = useQuery({
    queryKey: ['reseller-plans', filter === 'archived'],
    queryFn: () => api.reseller.getPlans(filter === 'archived'),
  })

  const deleteMutation = useMutation({
    mutationFn: (planId: string) => api.reseller.deletePlan(planId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reseller-plans'] })
      if (data.data?.archived) {
        toast.success('Plan archivé')
      } else {
        toast.success('Plan supprimé')
      }
      setDeletingPlan(null)
    },
    onError: () => {
      toast.error('Erreur lors de la suppression')
    },
  })

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <PageSkeleton
        navigation={resellerNavigation}
        basePath="/reseller"
        title="Plans"
        variant="list"
      />
    )
  }

  const plans = (plansData?.data || []) as Plan[]
  
  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (!matchesSearch) return false
    
    if (filter === 'active') return plan.isActive && !plan.isArchived
    if (filter === 'archived') return plan.isArchived
    return !plan.isArchived
  })

  const activePlans = plans.filter(p => p.isActive && !p.isArchived)
  const archivedPlans = plans.filter(p => p.isArchived)
  const totalSubscribers = plans.reduce((sum, p) => sum + p.subscribersCount, 0)

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setShowFormModal(true)
  }

  const handleCloseModal = () => {
    setShowFormModal(false)
    setEditingPlan(null)
  }

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
        title="Plans tarifaires"
        subtitle="Gérez les plans proposés à vos clients"
        icon={Package}
        actions={
          <button
            onClick={() => setShowFormModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Nouveau plan</span>
          </button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-6">
        <StatsCard
          icon={Package}
          value={plans.length}
          label="Total plans"
        />
        <StatsCard
          icon={CheckCircle}
          value={activePlans.length}
          label="Actifs"
          iconBgColor="bg-emerald-500"
        />
        <StatsCard
          icon={Users}
          value={totalSubscribers}
          label="Abonnés"
          iconBgColor="bg-blue-500"
        />
        <StatsCard
          icon={Archive}
          value={archivedPlans.length}
          label="Archivés"
          iconBgColor="bg-gray-400"
        />
      </div>

      {/* Filter Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex flex-wrap gap-2">
          {(['all', 'active', 'archived'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? 'Tous' : f === 'active' ? 'Actifs' : 'Archivés'}
              <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-white/20">
                {f === 'all' ? plans.filter(p => !p.isArchived).length : f === 'active' ? activePlans.length : archivedPlans.length}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
          />
        </div>
      </div>

      {/* Plans Grid */}
      {filteredPlans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-12 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Aucun plan</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Créez votre premier plan tarifaire pour vos clients.
          </p>
          <button
            onClick={() => setShowFormModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={18} />
            Créer un plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl border ${plan.isPopular ? 'border-emerald-200 ring-2 ring-emerald-100' : 'border-gray-100'} p-5 relative ${plan.isArchived ? 'opacity-60' : ''}`}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full">
                    <Star size={12} fill="currentColor" />
                    Populaire
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                  {plan.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{plan.description}</p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                      <MoreHorizontal size={16} className="text-gray-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50">
                    <DropdownMenuItem 
                      onClick={() => handleEdit(plan)}
                      className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                    >
                      <Edit size={16} className="mr-3 text-gray-400" />
                      <span className="text-[13px] text-gray-700">Modifier</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        api.reseller.updatePlan(plan.id, { isPublic: !plan.isPublic })
                          .then(() => {
                            queryClient.invalidateQueries({ queryKey: ['reseller-plans'] })
                            toast.success(plan.isPublic ? 'Plan masqué' : 'Plan visible')
                          })
                      }}
                      className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                    >
                      {plan.isPublic ? <EyeOff size={16} className="mr-3 text-gray-400" /> : <Eye size={16} className="mr-3 text-gray-400" />}
                      <span className="text-[13px] text-gray-700">{plan.isPublic ? 'Masquer' : 'Rendre visible'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        api.reseller.updatePlan(plan.id, { isPopular: !plan.isPopular })
                          .then(() => {
                            queryClient.invalidateQueries({ queryKey: ['reseller-plans'] })
                            toast.success(plan.isPopular ? 'Badge retiré' : 'Marqué populaire')
                          })
                      }}
                      className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                    >
                      <Star size={16} className="mr-3 text-gray-400" />
                      <span className="text-[13px] text-gray-700">{plan.isPopular ? 'Retirer populaire' : 'Marquer populaire'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1.5" />
                    <DropdownMenuItem 
                      onClick={() => setDeletingPlan(plan)}
                      className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-red-50 text-red-600 focus:text-red-600"
                    >
                      {plan.subscribersCount > 0 ? <Archive size={16} className="mr-3" /> : <Trash2 size={16} className="mr-3" />}
                      <span className="text-[13px]">{plan.subscribersCount > 0 ? 'Archiver' : 'Supprimer'}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Price */}
              <div className="mb-4">
                {plan.isCustom ? (
                  <div className="text-2xl font-bold text-gray-900">Sur devis</div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">
                      {formatPrice(plan.price, plan.currency)}
                    </span>
                    <span className="text-sm text-gray-500">
                      /{plan.billingCycleLabel || BILLING_CYCLES[plan.billingCycle] || `${plan.billingCycle} mois`}
                    </span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-500">{plan.subscribersCount} abonné{plan.subscribersCount > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  {!plan.isPublic && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                      <EyeOff size={10} />
                      Masqué
                    </span>
                  )}
                  {plan.isArchived && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                      <Archive size={10} />
                      Archivé
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <PlanFormModal
        isOpen={showFormModal}
        onClose={handleCloseModal}
        plan={editingPlan}
      />

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deletingPlan}
        onClose={() => setDeletingPlan(null)}
        onConfirm={() => deletingPlan && deleteMutation.mutate(deletingPlan.id)}
        title={deletingPlan?.subscribersCount ? 'Archiver le plan' : 'Supprimer le plan'}
        message={
          deletingPlan?.subscribersCount
            ? `Ce plan a ${deletingPlan.subscribersCount} abonné(s). Il sera archivé et ne sera plus visible pour les nouveaux clients.`
            : `Êtes-vous sûr de vouloir supprimer le plan "${deletingPlan?.name}" ?`
        }
        confirmText={deletingPlan?.subscribersCount ? 'Archiver' : 'Supprimer'}
        isLoading={deleteMutation.isPending}
        variant={deletingPlan?.subscribersCount ? 'warning' : 'danger'}
      />
    </DashboardLayout>
  )
}
