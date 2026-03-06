'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { platformNavigation } from '@/config/platform-navigation'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'
import { StatsCard } from '@/components/reseller'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  CreditCard,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Settings,
  Eye,
  Building2,
  MoreHorizontal,
  Play,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { ConfirmModal } from '@/components/shared/ConfirmModal'

interface LicensePlan {
  id: string
  name: string
  slug: string
  maxSites: number
  priceMonthly: number
  currency: string
}

interface Organization {
  id: string
  name: string
  email: string
  status: string
}

interface License {
  id: string
  planId: string
  plan: LicensePlan
  status: string
  billingCycle: string
  sitesUsed: number
  currentPeriodEnd: string | null
  createdAt: string
  organizations: Organization[]
}

interface LicensesResponse {
  data: License[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface StatsResponse {
  total: number
  active: number
  trialing: number
  pastDue: number
  cancelled: number
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  TRIALING: { label: 'Essai', color: 'bg-blue-100 text-blue-700', icon: Clock },
  PAST_DUE: { label: 'Impaye', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
  CANCELLED: { label: 'Annulee', color: 'bg-red-100 text-red-700', icon: XCircle },
  UNPAID: { label: 'Non payee', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  PAUSED: { label: 'En pause', color: 'bg-gray-100 text-gray-700', icon: Clock },
}

export default function LicensesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'cancel' | 'reactivate'
    license: License
  } | null>(null)

  const { data: stats } = useQuery({
    queryKey: ['platform-licenses-stats'],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await apiClient.get<StatsResponse>('/platform/licenses/stats')
      return res.data
    },
    enabled: !!accessToken,
  })

  const { data: plans } = useQuery({
    queryKey: ['license-plans-all'],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await apiClient.get<LicensePlan[]>('/platform/licenses/plans?includeInactive=true')
      return res.data
    },
    enabled: !!accessToken,
  })

  const { data: licensesData, isLoading } = useQuery({
    queryKey: ['platform-licenses', searchQuery, statusFilter, planFilter, sortBy, sortOrder, page],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (planFilter !== 'all') params.append('planId', planFilter)
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)
      params.append('page', page.toString())
      params.append('limit', '20')

      const res = await apiClient.get<License[]>(`/platform/licenses?${params.toString()}`) as any
      return { data: res.data || [], pagination: res.pagination }
    },
    enabled: !!accessToken,
    placeholderData: (previousData) => previousData,
  })

  const licenses = licensesData?.data || []
  const pagination = licensesData?.pagination

  const cancelMutation = useMutation({
    mutationFn: async (licenseId: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      await apiClient.post(`/platform/licenses/${licenseId}/cancel`)
    },
    onSuccess: () => {
      toast.success('Licence annulee')
      setConfirmAction(null)
      queryClient.invalidateQueries({ queryKey: ['platform-licenses'] })
      queryClient.invalidateQueries({ queryKey: ['platform-licenses-stats'] })
    },
    onError: () => {
      toast.error('Erreur lors de l\'annulation')
    },
  })

  const reactivateMutation = useMutation({
    mutationFn: async (licenseId: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      await apiClient.post(`/platform/licenses/${licenseId}/reactivate`)
    },
    onSuccess: () => {
      toast.success('Licence reactivee')
      setConfirmAction(null)
      queryClient.invalidateQueries({ queryKey: ['platform-licenses'] })
      queryClient.invalidateQueries({ queryKey: ['platform-licenses-stats'] })
    },
    onError: () => {
      toast.error('Erreur lors de la reactivation')
    },
  })

  const handleConfirmAction = () => {
    if (!confirmAction) return
    if (confirmAction.type === 'cancel') {
      cancelMutation.mutate(confirmAction.license.id)
    } else {
      reactivateMutation.mutate(confirmAction.license.id)
    }
  }

  if (isLoading && !licensesData) {
    return (
      <PageSkeleton
        navigation={platformNavigation}
        basePath="/platform"
        title="Licences"
        variant="list"
      />
    )
  }

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount)
  }

  return (
    <DashboardLayout
      navigation={platformNavigation}
      basePath="/platform"
      pageTitle="Licences"
    >
      <PageHeader
        title="Licences"
        subtitle="Gerez toutes les licences de la plateforme"
        icon={CreditCard}
        actions={
          <Button
            onClick={() => router.push('/platform/licenses/plans')}
            className="gap-2 h-10 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-white"
          >
            <Settings size={16} />
            Gerer les plans
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-5 mb-6">
        <StatsCard
          icon={CreditCard}
          value={stats?.total || 0}
          label="Total"
        />
        <StatsCard
          icon={CheckCircle}
          value={stats?.active || 0}
          label="Actives"
        />
        <StatsCard
          icon={Clock}
          value={stats?.trialing || 0}
          label="En essai"
        />
        <StatsCard
          icon={AlertCircle}
          value={stats?.pastDue || 0}
          label="Impayees"
        />
        <StatsCard
          icon={XCircle}
          value={stats?.cancelled || 0}
          label="Annulees"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Rechercher par revendeur..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="pl-10 h-10 rounded-xl"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="ACTIVE">Actives</SelectItem>
                <SelectItem value="TRIALING">En essai</SelectItem>
                <SelectItem value="PAST_DUE">Impayees</SelectItem>
                <SelectItem value="CANCELLED">Annulees</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={planFilter}
              onValueChange={(value) => {
                setPlanFilter(value)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les plans</SelectItem>
                {plans?.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={(value) => {
                const [field, order] = value.split('-')
                setSortBy(field)
                setSortOrder(order as 'asc' | 'desc')
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">Plus recentes</SelectItem>
                <SelectItem value="createdAt-asc">Plus anciennes</SelectItem>
                <SelectItem value="sitesUsed-desc">Sites (desc)</SelectItem>
                <SelectItem value="sitesUsed-asc">Sites (asc)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Revendeur</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Sites</th>
                <th className="px-4 py-3">Cycle</th>
                <th className="px-4 py-3">Echeance</th>
                <th className="px-4 py-3">Cree le</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {licenses.map((license: License) => {
                const org = license.organizations[0]
                const status = statusConfig[license.status] || statusConfig.ACTIVE
                const StatusIcon = status.icon
                const usagePercent = license.plan.maxSites > 0 
                  ? Math.round((license.sitesUsed / license.plan.maxSites) * 100)
                  : 0

                return (
                  <tr key={license.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      {org ? (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                            <Building2 size={18} className="text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{org.name}</p>
                            <p className="text-xs text-gray-500">{org.email}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                        {license.plan.name}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                        status.color
                      )}>
                        <StatusIcon size={12} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              'h-full rounded-full',
                              usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-orange-500' : 'bg-emerald-500'
                            )}
                            style={{ width: `${Math.min(100, usagePercent)}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {license.sitesUsed}/{license.plan.maxSites}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600">
                        {license.billingCycle === 'YEARLY' ? 'Annuel' : 'Mensuel'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600">
                        {license.currentPeriodEnd 
                          ? format(new Date(license.currentPeriodEnd), 'dd MMM yyyy', { locale: fr })
                          : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600">
                        {format(new Date(license.createdAt), 'dd MMM yyyy', { locale: fr })}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <MoreHorizontal size={16} className="text-gray-500" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50">
                          {org && (
                            <DropdownMenuItem
                              onClick={() => router.push(`/platform/resellers/${org.id}?tab=license`)}
                              className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                            >
                              <Eye size={16} className="mr-3 text-gray-400" />
                              <span className="text-[13px] text-gray-700">Voir les details</span>
                            </DropdownMenuItem>
                          )}
                          {license.status === 'CANCELLED' ? (
                            <DropdownMenuItem
                              onClick={() => setConfirmAction({ type: 'reactivate', license })}
                              className="rounded-lg px-3 py-2.5 cursor-pointer text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50"
                            >
                              <Play size={16} className="mr-3" />
                              <span className="text-[13px]">Reactiver</span>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => setConfirmAction({ type: 'cancel', license })}
                              className="rounded-lg px-3 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                            >
                              <XCircle size={16} className="mr-3" />
                              <span className="text-[13px]">Annuler</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {licenses.length === 0 && (
          <div className="p-12 text-center">
            <CreditCard size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune licence</h3>
            <p className="text-gray-500">Aucune licence ne correspond a vos criteres.</p>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {pagination.total} licence(s) au total
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="h-8 w-8 p-0 rounded-lg"
              >
                <ChevronLeft size={16} />
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} sur {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.totalPages}
                className="h-8 w-8 p-0 rounded-lg"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={confirmAction?.type === 'cancel'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        title="Annuler la licence"
        message={`Etes-vous sur de vouloir annuler la licence de ${confirmAction?.license.organizations[0]?.name || 'ce revendeur'} ? Cette action est irreversible.`}
        confirmText="Annuler la licence"
        variant="danger"
        isLoading={cancelMutation.isPending}
        icon="trash"
      />

      <ConfirmModal
        isOpen={confirmAction?.type === 'reactivate'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        title="Reactiver la licence"
        message={`Etes-vous sur de vouloir reactiver la licence de ${confirmAction?.license.organizations[0]?.name || 'ce revendeur'} ?`}
        confirmText="Reactiver"
        variant="info"
        isLoading={reactivateMutation.isPending}
        icon="play"
      />
    </DashboardLayout>
  )
}
