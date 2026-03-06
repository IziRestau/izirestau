'use client'

import { useState } from 'react'
import { X, Download, Mail, Calendar, CreditCard, FileText, CheckCircle, Clock, AlertCircle, Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  subtotal: number
  taxRate?: number
  taxAmount?: number
  total: number
  status: string
  paidAt?: string
  paidAmount?: number
  items?: InvoiceItem[]
  notes?: string
  remindersSent?: number
  lastReminderAt?: string
}

interface InvoiceDetailModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: Invoice | null
  clientName?: string
  clientEmail?: string
  onSendReminder?: (invoiceId: string) => Promise<void>
}

export function InvoiceDetailModal({ 
  isOpen, 
  onClose, 
  invoice,
  clientName,
  clientEmail,
  onSendReminder
}: InvoiceDetailModalProps) {
  const [isSendingReminder, setIsSendingReminder] = useState(false)

  if (!isOpen || !invoice) return null

  const handleSendReminder = async () => {
    if (!onSendReminder) return
    
    setIsSendingReminder(true)
    try {
      await onSendReminder(invoice.id)
    } finally {
      setIsSendingReminder(false)
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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PAID':
        return { 
          label: 'Payee', 
          bgColor: 'bg-emerald-100', 
          textColor: 'text-emerald-700',
          icon: CheckCircle
        }
      case 'SENT':
      case 'PENDING':
        return { 
          label: 'En attente', 
          bgColor: 'bg-amber-100', 
          textColor: 'text-amber-700',
          icon: Clock
        }
      case 'OVERDUE':
        return { 
          label: 'En retard', 
          bgColor: 'bg-red-100', 
          textColor: 'text-red-700',
          icon: AlertCircle
        }
      case 'DRAFT':
        return { 
          label: 'Brouillon', 
          bgColor: 'bg-gray-100', 
          textColor: 'text-gray-600',
          icon: FileText
        }
      default:
        return { 
          label: status, 
          bgColor: 'bg-gray-100', 
          textColor: 'text-gray-600',
          icon: FileText
        }
    }
  }

  const statusConfig = getStatusConfig(invoice.status)
  const StatusIcon = statusConfig.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] sm:max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Facture {invoice.invoiceNumber}</h2>
            {clientName && (
              <p className="text-sm text-gray-500 mt-0.5">{clientName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-160px)] sm:max-h-[calc(85vh-180px)]">
          {/* Status + Montant */}
          <div className="flex items-center justify-between mb-6">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.bgColor}`}>
              <StatusIcon size={14} className={statusConfig.textColor} />
              <span className={`text-sm font-medium ${statusConfig.textColor}`}>{statusConfig.label}</span>
            </div>
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(Number(invoice.total))}</div>
              <div className="text-xs text-gray-500">TTC</div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
                <span className="text-[10px] sm:text-xs font-medium">Emission</span>
              </div>
              <div className="text-xs sm:text-sm font-medium text-gray-900">{formatDate(invoice.issueDate)}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
                <span className="text-[10px] sm:text-xs font-medium">Echeance</span>
              </div>
              <div className="text-xs sm:text-sm font-medium text-gray-900">{formatDate(invoice.dueDate)}</div>
            </div>
          </div>

          {/* Paiement */}
          {invoice.status === 'PAID' && invoice.paidAt && (
            <div className="bg-emerald-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 text-emerald-700 mb-1">
                <CheckCircle size={14} />
                <span className="text-xs font-medium">Paiement recu</span>
              </div>
              <div className="text-sm font-medium text-emerald-800">
                {formatCurrency(Number(invoice.paidAmount || invoice.total))} le {formatDate(invoice.paidAt)}
              </div>
            </div>
          )}

          {/* Details */}
          <div className="mb-4 sm:mb-6">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">Details</h3>
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              {invoice.items && invoice.items.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {invoice.items.map((item, index) => (
                    <div key={item.id || index} className="p-3 sm:p-4 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.description}</div>
                        <div className="text-xs text-gray-500">
                          {item.quantity} x {formatCurrency(Number(item.unitPrice))}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(Number(item.total))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Abonnement mensuel</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(Number(invoice.subtotal))}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Totaux */}
          <div className="space-y-2 mb-4 sm:mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Sous-total HT</span>
              <span className="text-gray-900">{formatCurrency(Number(invoice.subtotal))}</span>
            </div>
            {invoice.taxRate && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">TVA ({invoice.taxRate}%)</span>
                <span className="text-gray-900">{formatCurrency(Number(invoice.taxAmount || 0))}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm font-semibold pt-2 border-t border-gray-200">
              <span className="text-gray-900">Total TTC</span>
              <span className="text-gray-900">{formatCurrency(Number(invoice.total))}</span>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs font-medium text-gray-500 mb-1">Notes</div>
              <p className="text-sm text-gray-700">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Relances info */}
        {invoice.status !== 'PAID' && invoice.remindersSent && invoice.remindersSent > 0 && (
          <div className="px-6 pb-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Send size={12} />
              <span>{invoice.remindersSent} relance(s) envoyee(s)</span>
              {invoice.lastReminderAt && (
                <span>- Derniere le {formatDate(invoice.lastReminderAt)}</span>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Fermer
          </button>
          {invoice.status !== 'PAID' && onSendReminder && (
            <button
              onClick={handleSendReminder}
              disabled={isSendingReminder}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isSendingReminder ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              <span className="sm:inline">Relance</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
