'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  Receipt,
  FileText,
  Eye,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Send,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ResellerDetails, ClientInvoice } from '../types'
import { invoiceStatusLabels, invoiceStatusColors } from '../types'
import { cn } from '@/lib/utils'
import { InvoiceDetailModal } from '@/components/shared/InvoiceDetailModal'

interface BillingTabProps {
  reseller: ResellerDetails
}

const statusOptions = [
  { value: 'DRAFT', label: 'Brouillon', icon: FileText, color: 'text-gray-600 focus:text-gray-600 focus:bg-gray-50' },
  { value: 'SENT', label: 'Envoyee', icon: Send, color: 'text-blue-600 focus:text-blue-600 focus:bg-blue-50' },
  { value: 'PAID', label: 'Payee', icon: CheckCircle, color: 'text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50' },
  { value: 'OVERDUE', label: 'En retard', icon: AlertTriangle, color: 'text-amber-600 focus:text-amber-600 focus:bg-amber-50' },
  { value: 'CANCELLED', label: 'Annulee', icon: XCircle, color: 'text-red-500 focus:text-red-500 focus:bg-red-50' },
]

export function BillingTab({ reseller }: BillingTabProps) {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const [selectedInvoice, setSelectedInvoice] = useState<ClientInvoice | null>(null)

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['platform-reseller-invoices', reseller.id],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await apiClient.get(`/platform/resellers/${reseller.id}/invoices`)
      return res.data as ClientInvoice[]
    },
    enabled: !!accessToken,
  })

  const changeStatusMutation = useMutation({
    mutationFn: async ({ invoiceId, status }: { invoiceId: string; status: string }) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return apiClient.patch(`/platform/resellers/invoices/${invoiceId}/status`, { status })
    },
    onSuccess: () => {
      toast.success('Statut mis a jour')
      queryClient.invalidateQueries({ queryKey: ['platform-reseller-invoices', reseller.id] })
    },
    onError: () => toast.error('Erreur lors de la mise a jour'),
  })

  const resendMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return apiClient.post(`/platform/resellers/invoices/${invoiceId}/resend`)
    },
    onSuccess: () => {
      toast.success('Facture renvoyee')
    },
    onError: () => toast.error('Erreur lors de l\'envoi'),
  })

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <div className="animate-pulse">
          <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4" />
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto" />
        </div>
      </div>
    )
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <Receipt size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune facture</h3>
        <p className="text-gray-500">Ce revendeur n'a pas encore emis de factures.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <h3 className="font-medium text-gray-900">Factures emises ({invoices.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3">Facture</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Montant</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Echeance</th>
              <th className="px-4 py-3">Cree le</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.map((invoice) => (
              <tr 
                key={invoice.id} 
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedInvoice(invoice)}
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-gray-400" />
                    <span className="font-medium text-gray-900">{invoice.invoiceNumber}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm text-gray-900">{invoice.client.name}</p>
                  <p className="text-xs text-gray-500">{invoice.client.email}</p>
                </td>
                <td className="px-4 py-4">
                  <span className="font-medium text-gray-900">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: invoice.currency || 'EUR' }).format(Number(invoice.amount))}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium',
                    invoiceStatusColors[invoice.status] || 'bg-gray-100 text-gray-600'
                  )}>
                    {invoiceStatusLabels[invoice.status] || invoice.status}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-600">
                    {format(new Date(invoice.dueDate), 'dd MMM yyyy', { locale: fr })}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-600">
                    {format(new Date(invoice.createdAt), 'dd MMM yyyy', { locale: fr })}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedInvoice(invoice)
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Eye size={16} className="text-gray-500" />
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button 
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreHorizontal size={16} className="text-gray-500" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            resendMutation.mutate(invoice.id)
                          }}
                          disabled={resendMutation.isPending}
                          className="rounded-lg px-3 py-2.5 cursor-pointer text-blue-600 focus:text-blue-600 focus:bg-blue-50"
                        >
                          <Send size={16} className="mr-3" />
                          <span className="text-[13px]">Renvoyer par email</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1" />
                        <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase">
                          Changer le statut
                        </div>
                        {statusOptions.map((option) => {
                          const Icon = option.icon
                          const isCurrentStatus = invoice.status === option.value
                          return (
                            <DropdownMenuItem
                              key={option.value}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (!isCurrentStatus) {
                                  changeStatusMutation.mutate({ invoiceId: invoice.id, status: option.value })
                                }
                              }}
                              disabled={isCurrentStatus || changeStatusMutation.isPending}
                              className={cn(
                                'rounded-lg px-3 py-2 cursor-pointer',
                                isCurrentStatus ? 'bg-gray-50 text-gray-400' : option.color
                              )}
                            >
                              <Icon size={14} className="mr-3" />
                              <span className="text-[13px]">{option.label}</span>
                              {isCurrentStatus && <span className="ml-auto text-xs">(actuel)</span>}
                            </DropdownMenuItem>
                          )
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InvoiceDetailModal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice ? {
          id: selectedInvoice.id,
          invoiceNumber: selectedInvoice.invoiceNumber,
          issueDate: selectedInvoice.createdAt,
          dueDate: selectedInvoice.dueDate,
          subtotal: Number(selectedInvoice.amount),
          total: Number(selectedInvoice.amount),
          status: selectedInvoice.status,
        } : null}
        clientName={selectedInvoice?.client.name}
        clientEmail={selectedInvoice?.client.email}
      />
    </div>
  )
}
