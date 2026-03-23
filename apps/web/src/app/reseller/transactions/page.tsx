'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/reseller'
import { resellerNavigation, resellerPromoCard } from '@/config/reseller-navigation'
import { api, apiClient } from '@/lib/api-client'
import { useResellerCurrency } from '@/hooks/use-currency'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TransactionDetailModal } from '@/components/reseller/TransactionDetailModal'
import {
  CreditCard,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Eye,
  ExternalLink,
  ArrowRight,
} from 'lucide-react'

type TransactionStatus = 'PENDING' | 'PAID' | 'ONBOARDING' | 'COMPLETED' | 'EXPIRED' | 'FAILED'

const statusConfig: Record<TransactionStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  PENDING: { label: 'En attente', color: 'bg-amber-100 text-amber-700', icon: Clock },
  PAID: { label: 'Paye', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  ONBOARDING: { label: 'Onboarding', color: 'bg-blue-100 text-blue-700', icon: ArrowRight },
  COMPLETED: { label: 'Complete', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  EXPIRED: { label: 'Expire', color: 'bg-gray-100 text-gray-600', icon: AlertCircle },
  FAILED: { label: 'Echoue', color: 'bg-red-100 text-red-700', icon: XCircle },
}

type Transaction = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  plan: { id: string; name: string; slug: string } | null
  amount: number
  currency: string
  billingCycle: number
  status: TransactionStatus
  monerooPaymentId: string | null
  monerooStatus: string | null
  paidAt: string | null
  clientId: string | null
  siteId: string | null
  createdAt: string
}

export default function TransactionsPage() {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const { format: formatAmount } = useResellerCurrency()
  
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['reseller-transactions', statusFilter, searchQuery],
    queryFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      return api.reseller.getTransactions({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery || undefined,
      })
    },
    enabled: !!accessToken,
  })

  if (isLoading) {
    return (
      <PageSkeleton
        navigation={resellerNavigation}
        basePath="/reseller"
        title="Transactions"
        variant="list"
      />
    )
  }

  const transactions = (data?.data?.transactions || []) as Transaction[]
  const stats = data?.data?.stats
  const pagination = data?.data?.pagination

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getClientName = (tx: Transaction) => {
    if (tx.firstName || tx.lastName) {
      return `${tx.firstName || ''} ${tx.lastName || ''}`.trim()
    }
    return tx.email
  }

  const getBillingCycleLabel = (cycle: number) => {
    if (cycle === 1) return '/mois'
    if (cycle === 12) return '/an'
    return `/${cycle} mois`
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
        title="Transactions"
        subtitle="Paiements recus via votre vitrine"
        icon={CreditCard}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-6">
        <StatsCard
          icon={CreditCard}
          value={formatAmount(stats?.total.amount || 0)}
          label={`${stats?.total.count || 0} transactions`}
        />
        <StatsCard
          icon={CheckCircle}
          value={formatAmount(stats?.paid.amount || 0)}
          label={`${stats?.paid.count || 0} payees`}
          iconBgColor="bg-emerald-500"
        />
        <StatsCard
          icon={Clock}
          value={formatAmount(stats?.pending.amount || 0)}
          label={`${stats?.pending.count || 0} en attente`}
          iconBgColor="bg-amber-500"
        />
        <StatsCard
          icon={XCircle}
          value={formatAmount(stats?.failed.amount || 0)}
          label={`${stats?.failed.count || 0} echouees`}
          iconBgColor="bg-red-500"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par email, nom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
            />
          </div>
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] rounded-xl">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="PAID">Paye</SelectItem>
              <SelectItem value="COMPLETED">Complete</SelectItem>
              <SelectItem value="PENDING">En attente</SelectItem>
              <SelectItem value="ONBOARDING">Onboarding</SelectItem>
              <SelectItem value="FAILED">Echoue</SelectItem>
              <SelectItem value="EXPIRED">Expire</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="sm:hidden space-y-3">
        {transactions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <CreditCard size={20} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">Aucune transaction trouvee</p>
          </div>
        ) : (
          transactions.map((tx) => {
            const status = statusConfig[tx.status] || statusConfig.PENDING
            const StatusIcon = status.icon

            return (
              <div
                key={tx.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 cursor-pointer active:bg-gray-50"
                onClick={() => setSelectedTransaction(tx)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">{getClientName(tx)}</p>
                    <p className="text-sm text-gray-500">{tx.email}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                    <StatusIcon size={10} />
                    {status.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {tx.plan?.name || 'Plan inconnu'} - {formatDate(tx.createdAt)}
                  </div>
                  <p className="font-semibold text-gray-900">{formatAmount(tx.amount)}</p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 lg:px-6 py-3 lg:py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="text-left px-4 lg:px-6 py-3 lg:py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="text-left px-4 lg:px-6 py-3 lg:py-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="text-right px-4 lg:px-6 py-3 lg:py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                <th className="text-left px-4 lg:px-6 py-3 lg:py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="text-right px-4 lg:px-6 py-3 lg:py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <CreditCard size={20} className="text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">Aucune transaction trouvee</p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const status = statusConfig[tx.status] || statusConfig.PENDING
                  const StatusIcon = status.icon

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedTransaction(tx)}
                    >
                      <td className="px-4 lg:px-6 py-3 lg:py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{getClientName(tx)}</p>
                          <p className="text-xs text-gray-500">{tx.email}</p>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4">
                        <span className="text-sm text-gray-900">{tx.plan?.name || '-'}</span>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 hidden md:table-cell">
                        <span className="text-sm text-gray-600">{formatDate(tx.createdAt)}</span>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 text-right">
                        <div>
                          <span className="font-medium text-gray-900 text-sm">{formatAmount(tx.amount)}</span>
                          <span className="text-xs text-gray-500 ml-1">{getBillingCycleLabel(tx.billingCycle)}</span>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 lg:px-2.5 lg:py-1 rounded-full text-xs font-medium ${status.color}`}>
                          <StatusIcon size={12} />
                          <span className="hidden lg:inline">{status.label}</span>
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4">
                        <div className="flex items-center justify-end gap-1 lg:gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedTransaction(tx)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Voir les details"
                          >
                            <Eye size={16} />
                          </button>
                          {tx.siteId && (
                            <button
                              onClick={() => router.push(`/reseller/restaurants/${tx.siteId}`)}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Voir le site"
                            >
                              <ExternalLink size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination info */}
        {pagination && pagination.total > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 text-sm text-gray-500">
            Affichage de {transactions.length} sur {pagination.total} transactions
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onViewSite={(siteId) => {
          setSelectedTransaction(null)
          router.push(`/reseller/restaurants/${siteId}`)
        }}
        formatAmount={formatAmount}
      />
    </DashboardLayout>
  )
}
