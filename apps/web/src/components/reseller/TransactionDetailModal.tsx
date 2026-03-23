'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  User,
  Mail,
  Phone,
  Calendar,
  Package,
  Store,
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

interface Transaction {
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

interface TransactionDetailModalProps {
  transaction: Transaction | null
  isOpen: boolean
  onClose: () => void
  onViewSite?: (siteId: string) => void
  formatAmount: (amount: number) => string
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getClientName(transaction: Transaction) {
  if (transaction.firstName || transaction.lastName) {
    return `${transaction.firstName || ''} ${transaction.lastName || ''}`.trim()
  }
  return transaction.email.split('@')[0]
}

function getBillingCycleLabel(months: number) {
  if (months === 1) return '/ mois'
  if (months === 12) return '/ an'
  return `/ ${months} mois`
}

export function TransactionDetailModal({
  transaction,
  isOpen,
  onClose,
  onViewSite,
  formatAmount,
}: TransactionDetailModalProps) {
  if (!transaction) return null

  const status = statusConfig[transaction.status] || statusConfig.PENDING
  const StatusIcon = status.icon

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>Details de la transaction</SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Statut</span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${status.color}`}>
              <StatusIcon size={14} />
              {status.label}
            </span>
          </div>

          {/* Amount */}
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{formatAmount(transaction.amount)}</p>
            <p className="text-sm text-gray-500 mt-1">
              {transaction.plan?.name || 'Plan'} {getBillingCycleLabel(transaction.billingCycle)}
            </p>
          </div>

          {/* Client Info */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Client</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <User size={16} className="text-gray-400" />
                <span className="text-gray-900">{getClientName(transaction)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail size={16} className="text-gray-400" />
                <span className="text-gray-600">{transaction.email}</span>
              </div>
              {transaction.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone size={16} className="text-gray-400" />
                  <span className="text-gray-600">{transaction.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Plan Info */}
          {transaction.plan && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Plan</h4>
              <div className="flex items-center gap-3 text-sm">
                <Package size={16} className="text-gray-400" />
                <span className="text-gray-900">{transaction.plan.name}</span>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Dates</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <Calendar size={16} className="text-gray-400" />
                <span className="text-gray-600">Cree le {formatDateTime(transaction.createdAt)}</span>
              </div>
              {transaction.paidAt && (
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle size={16} className="text-emerald-500" />
                  <span className="text-gray-600">Paye le {formatDateTime(transaction.paidAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Moneroo Info */}
          {transaction.monerooPaymentId && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Paiement Moneroo</h4>
              <div className="bg-gray-50 rounded-xl p-3 text-sm">
                <p className="text-gray-500 text-xs mb-1">ID Transaction</p>
                <p className="font-mono text-gray-900 text-xs break-all">{transaction.monerooPaymentId}</p>
                {transaction.monerooStatus && (
                  <>
                    <p className="text-gray-500 text-xs mt-2 mb-1">Statut Moneroo</p>
                    <p className="text-gray-900">{transaction.monerooStatus}</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Site Link */}
          {transaction.siteId && onViewSite && (
            <button
              onClick={() => onViewSite(transaction.siteId!)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Store size={16} />
              Voir le restaurant
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
