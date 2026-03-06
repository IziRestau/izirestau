'use client'

import { useState } from 'react'
import { usePOSStore, PaymentMethod } from '@/stores/pos.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Banknote, 
  CreditCard, 
  Check,
  Calculator,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (paymentMethod: PaymentMethod, amountReceived?: number) => Promise<void>
  formatPrice: (price: number) => string
  primaryColor: string
  taxRate: number
}

const quickAmounts = [5, 10, 20, 50, 100]

export function PaymentModal({
  isOpen,
  onClose,
  onConfirm,
  formatPrice,
  primaryColor,
  taxRate,
}: PaymentModalProps) {
  const { getTotal, getFullTotal, getSubtotal, getExistingSubtotal, getDiscountAmount, getTaxAmount, getItemCount, isEditMode, editingOrder } = usePOSStore()
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [amountReceived, setAmountReceived] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const total = isEditMode && editingOrder ? getFullTotal(taxRate) : getTotal(taxRate)
  const subtotal = getSubtotal()
  const existingTotal = isEditMode && editingOrder ? editingOrder.total : 0
  const discountAmount = getDiscountAmount()
  const taxAmount = getTaxAmount(taxRate)
  const itemCount = getItemCount()

  const amountReceivedNum = parseFloat(amountReceived) || 0
  const change = amountReceivedNum - total

  const canConfirm = () => {
    if (paymentMethod === 'CASH') {
      return amountReceivedNum >= total
    }
    return true
  }

  const handleQuickAmount = (amount: number) => {
    setAmountReceived(amount.toString())
  }

  const handleExactAmount = () => {
    setAmountReceived(total.toFixed(2))
  }

  const handleConfirm = async () => {
    if (!canConfirm()) return

    setIsProcessing(true)
    try {
      await onConfirm(
        paymentMethod,
        paymentMethod === 'CASH' ? amountReceivedNum : undefined
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setPaymentMethod('CASH')
    setAmountReceived('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 rounded-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Encaissement
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            {isEditMode && editingOrder ? (
              <>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Commande existante ({editingOrder.existingItems.length} article{editingOrder.existingItems.length > 1 ? 's' : ''})</span>
                  <span>{formatPrice(existingTotal)}</span>
                </div>
                {subtotal > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Nouveaux articles</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex justify-between text-sm text-gray-600">
                <span>{itemCount} article{itemCount > 1 ? 's' : ''}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Remise</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}
            {!isEditMode && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>TVA ({taxRate}%)</span>
                <span>{formatPrice(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span style={{ color: primaryColor }}>{formatPrice(total)}</span>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-900 mb-3 block">
              Mode de paiement
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod('CASH')}
                className={cn(
                  'p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all',
                  paymentMethod === 'CASH'
                    ? 'border-current'
                    : 'border-gray-200 hover:border-gray-300'
                )}
                style={paymentMethod === 'CASH' ? { 
                  borderColor: primaryColor,
                  backgroundColor: `${primaryColor}10`
                } : undefined}
              >
                <Banknote size={24} style={paymentMethod === 'CASH' ? { color: primaryColor } : undefined} />
                <span className="text-sm font-medium">Especes</span>
              </button>
              <button
                onClick={() => setPaymentMethod('CARD')}
                className={cn(
                  'p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all',
                  paymentMethod === 'CARD'
                    ? 'border-current'
                    : 'border-gray-200 hover:border-gray-300'
                )}
                style={paymentMethod === 'CARD' ? { 
                  borderColor: primaryColor,
                  backgroundColor: `${primaryColor}10`
                } : undefined}
              >
                <CreditCard size={24} style={paymentMethod === 'CARD' ? { color: primaryColor } : undefined} />
                <span className="text-sm font-medium">Carte</span>
              </button>
            </div>
          </div>

          {paymentMethod === 'CASH' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-900 block">
                Montant recu
              </Label>
              <div className="relative">
                <Calculator size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  type="number"
                  step="0.01"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  placeholder="0.00"
                  className="h-14 pl-10 text-xl font-semibold rounded-xl focus:ring-2"
                  style={{ 
                    '--tw-ring-color': primaryColor,
                  } as React.CSSProperties}
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExactAmount}
                  className="rounded-lg text-xs transition-colors"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = primaryColor
                    e.currentTarget.style.color = primaryColor
                    e.currentTarget.style.backgroundColor = `${primaryColor}10`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = ''
                    e.currentTarget.style.color = ''
                    e.currentTarget.style.backgroundColor = ''
                  }}
                >
                  Montant exact
                </Button>
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAmount(amount)}
                    className="rounded-lg text-xs transition-colors"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = primaryColor
                      e.currentTarget.style.color = primaryColor
                      e.currentTarget.style.backgroundColor = `${primaryColor}10`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = ''
                      e.currentTarget.style.color = ''
                      e.currentTarget.style.backgroundColor = ''
                    }}
                  >
                    {amount} €
                  </Button>
                ))}
              </div>

              {amountReceivedNum > 0 && (
                <div className={cn(
                  'p-4 rounded-xl text-center',
                  change >= 0 ? 'bg-green-50' : 'bg-red-50'
                )}>
                  <p className="text-sm text-gray-600 mb-1">
                    {change >= 0 ? 'Rendu monnaie' : 'Montant insuffisant'}
                  </p>
                  <p className={cn(
                    'text-2xl font-bold',
                    change >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {change >= 0 ? formatPrice(change) : formatPrice(Math.abs(change))}
                  </p>
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'CARD' && (
            <div 
              className="rounded-xl p-4 text-center"
              style={{ backgroundColor: `${primaryColor}10` }}
            >
              <CreditCard size={32} className="mx-auto mb-2" style={{ color: primaryColor }} />
              <p className="text-sm" style={{ color: primaryColor }}>
                Presentez la carte au terminal de paiement
              </p>
            </div>
          )}
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isProcessing}
            className="flex-1 h-12 rounded-xl transition-colors"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${primaryColor}10`
              e.currentTarget.style.color = primaryColor
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = ''
              e.currentTarget.style.color = ''
            }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm() || isProcessing}
            className="flex-1 h-12 rounded-xl text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <Check size={18} className="mr-2" />
                Valider
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
