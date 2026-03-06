'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/reseller'
import { InvoiceDetailModal } from '@/components/shared/InvoiceDetailModal'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { resellerNavigation, resellerPromoCard } from '@/config/reseller-navigation'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  Download,
  Send,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Search,
  Euro,
} from 'lucide-react'

type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED'

const statusConfig: Record<InvoiceStatus, { label: string; color: string; icon: any }> = {
  DRAFT: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700', icon: FileText },
  SENT: { label: 'Envoyee', color: 'bg-blue-100 text-blue-700', icon: Send },
  PAID: { label: 'Payee', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  PARTIAL: { label: 'Partiel', color: 'bg-amber-100 text-amber-700', icon: Clock },
  OVERDUE: { label: 'En retard', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  CANCELLED: { label: 'Annulee', color: 'bg-gray-100 text-gray-500', icon: XCircle },
  REFUNDED: { label: 'Remboursee', color: 'bg-purple-100 text-purple-700', icon: Euro },
}

export default function InvoicesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null)
  const [reminderInvoice, setReminderInvoice] = useState<any | null>(null)

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['reseller-invoices', statusFilter],
    queryFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      return api.reseller.getInvoices({ status: statusFilter !== 'all' ? statusFilter : undefined })
    },
    enabled: !!accessToken,
  })

  const { data: statsData } = useQuery({
    queryKey: ['reseller-invoice-stats'],
    queryFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      return api.reseller.getInvoiceStats()
    },
    enabled: !!accessToken,
  })

  const reminderMutation = useMutation({
    mutationFn: (invoiceId: string) => api.reseller.sendInvoiceReminder(invoiceId),
    onSuccess: () => {
      toast.success('Relance envoyee')
      queryClient.invalidateQueries({ queryKey: ['reseller-invoices'] })
    },
    onError: () => {
      toast.error('Erreur lors de l\'envoi de la relance')
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ invoiceId, status }: { invoiceId: string; status: string }) => 
      api.reseller.updateInvoiceStatus(invoiceId, status),
    onSuccess: () => {
      toast.success('Statut mis a jour')
      queryClient.invalidateQueries({ queryKey: ['reseller-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['reseller-invoice-stats'] })
    },
    onError: () => {
      toast.error('Erreur lors de la mise a jour')
    },
  })

  if (isLoading) {
    return (
      <PageSkeleton
        navigation={resellerNavigation}
        basePath="/reseller"
        title="Factures"
        variant="list"
      />
    )
  }

  const invoices = (invoicesData?.data || []) as any[]
  const stats = statsData?.data

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const filteredInvoices = invoices.filter(invoice => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      invoice.invoiceNumber.toLowerCase().includes(query) ||
      invoice.client?.name?.toLowerCase().includes(query) ||
      invoice.client?.email?.toLowerCase().includes(query)
    )
  })

  const handleSendReminder = () => {
    if (!reminderInvoice) return
    reminderMutation.mutate(reminderInvoice.id, {
      onSuccess: () => {
        setReminderInvoice(null)
      }
    })
  }

  const handleMarkAsPaid = (invoiceId: string) => {
    updateStatusMutation.mutate({ invoiceId, status: 'PAID' })
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
        title="Factures"
        subtitle="Historique des factures de vos clients"
        icon={FileText}
      />

      {/* Stats Cards - Coherent avec le dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-6">
        <StatsCard
          icon={FileText}
          value={formatCurrency(stats?.total.amount || 0)}
          label={`${stats?.total.count || 0} factures`}
        />
        <StatsCard
          icon={CheckCircle}
          value={formatCurrency(stats?.paid.amount || 0)}
          label={`${stats?.paid.count || 0} payees`}
          iconBgColor="bg-emerald-500"
        />
        <StatsCard
          icon={Clock}
          value={formatCurrency(stats?.pending.amount || 0)}
          label={`${stats?.pending.count || 0} en attente`}
          iconBgColor="bg-blue-500"
        />
        <StatsCard
          icon={AlertCircle}
          value={formatCurrency(stats?.overdue.amount || 0)}
          label={`${stats?.overdue.count || 0} en retard`}
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
              placeholder="Rechercher par numero, client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
            />
          </div>
          {/* Status Filter - Select shadcn */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] rounded-xl">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="DRAFT">Brouillon</SelectItem>
              <SelectItem value="SENT">Envoyee</SelectItem>
              <SelectItem value="PAID">Payee</SelectItem>
              <SelectItem value="PARTIAL">Partiel</SelectItem>
              <SelectItem value="OVERDUE">En retard</SelectItem>
              <SelectItem value="CANCELLED">Annulee</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="sm:hidden space-y-3">
        {filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <FileText size={20} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">Aucune facture trouvee</p>
          </div>
        ) : (
          filteredInvoices.map((invoice) => {
            const status = statusConfig[invoice.status as InvoiceStatus] || statusConfig.DRAFT
            const StatusIcon = status.icon
            const isOverdue = invoice.status !== 'PAID' && new Date(invoice.dueDate) < new Date()

            return (
              <div 
                key={invoice.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 cursor-pointer active:bg-gray-50"
                onClick={() => setSelectedInvoice(invoice)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-gray-500">{invoice.client?.name}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                    <StatusIcon size={10} />
                    {status.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                      Ech. {formatDate(invoice.dueDate)}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900">{formatCurrency(Number(invoice.total))}</p>
                </div>
                <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setSelectedInvoice(invoice)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Eye size={16} />
                  </button>
                  {invoice.pdfUrl && (
                    <a
                      href={invoice.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Download size={16} />
                    </a>
                  )}
                  {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                    <button
                      onClick={() => setReminderInvoice(invoice)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Send size={16} />
                    </button>
                  )}
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
                <th className="text-left px-4 lg:px-6 py-3 lg:py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Facture</th>
                <th className="text-left px-4 lg:px-6 py-3 lg:py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="text-left px-4 lg:px-6 py-3 lg:py-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="text-left px-4 lg:px-6 py-3 lg:py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Echeance</th>
                <th className="text-right px-4 lg:px-6 py-3 lg:py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                <th className="text-left px-4 lg:px-6 py-3 lg:py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="text-right px-4 lg:px-6 py-3 lg:py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <FileText size={20} className="text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">Aucune facture trouvee</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => {
                  const status = statusConfig[invoice.status as InvoiceStatus] || statusConfig.DRAFT
                  const StatusIcon = status.icon
                  const isOverdue = invoice.status !== 'PAID' && new Date(invoice.dueDate) < new Date()

                  return (
                    <tr 
                      key={invoice.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedInvoice(invoice)}
                    >
                      <td className="px-4 lg:px-6 py-3 lg:py-4">
                        <span className="font-medium text-gray-900 text-sm">{invoice.invoiceNumber}</span>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{invoice.client?.name}</p>
                          <p className="text-xs text-gray-500 hidden lg:block">{invoice.client?.email}</p>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 hidden md:table-cell">
                        <span className="text-sm text-gray-600">{formatDate(invoice.issueDate)}</span>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4">
                        <span className={`text-sm ${isOverdue && invoice.status !== 'PAID' ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                          {formatDate(invoice.dueDate)}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 text-right">
                        <span className="font-medium text-gray-900 text-sm">{formatCurrency(Number(invoice.total))}</span>
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
                            onClick={() => setSelectedInvoice(invoice)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Voir"
                          >
                            <Eye size={16} />
                          </button>
                          {invoice.pdfUrl && (
                            <a
                              href={invoice.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Telecharger"
                            >
                              <Download size={16} />
                            </a>
                          )}
                          {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                            <button
                              onClick={() => setReminderInvoice(invoice)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Envoyer relance"
                            >
                              <Send size={16} />
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
      </div>

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
        clientName={selectedInvoice?.client?.name}
        clientEmail={selectedInvoice?.client?.email}
        onSendReminder={async (invoiceId) => {
          setSelectedInvoice(null)
          const inv = invoices.find((i: any) => i.id === invoiceId)
          if (inv) setReminderInvoice(inv)
        }}
      />

      {/* Confirm Reminder Modal */}
      <ConfirmModal
        isOpen={!!reminderInvoice}
        onClose={() => setReminderInvoice(null)}
        onConfirm={handleSendReminder}
        title="Envoyer une relance"
        message={`Voulez-vous envoyer une relance pour la facture ${reminderInvoice?.invoiceNumber} a ${reminderInvoice?.client?.email} ?`}
        confirmText="Envoyer"
        cancelText="Annuler"
        variant="info"
        isLoading={reminderMutation.isPending}
      />
    </DashboardLayout>
  )
}
