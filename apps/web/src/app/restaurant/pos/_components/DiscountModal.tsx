'use client'

import { useState, useEffect, useMemo } from 'react'
import { usePOSStore, POSDiscount } from '@/stores/pos.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-media-query'
import {
  Percent,
  DollarSign,
  Tag,
  Trash2,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface DiscountModalProps {
  isOpen: boolean
  onClose: () => void
  primaryColor: string
  formatPrice: (price: number) => string
  taxRate: number
}

type DiscountType = 'percentage' | 'fixed'

const QUICK_PERCENTAGES = [5, 10, 15, 20]

export function DiscountModal({
  isOpen,
  onClose,
  primaryColor,
  formatPrice,
  taxRate,
}: DiscountModalProps) {
  const { discount, setDiscount, getSubtotal } = usePOSStore()
  const isMobile = useIsMobile()

  const [type, setType] = useState<DiscountType>('percentage')
  const [value, setValue] = useState('')
  const [reason, setReason] = useState('')

  const subtotal = getSubtotal()

  useEffect(() => {
    if (isOpen) {
      if (discount) {
        setType(discount.type)
        setValue(String(discount.value))
        setReason(discount.reason || '')
      } else {
        setType('percentage')
        setValue('')
        setReason('')
      }
    }
  }, [isOpen, discount])

  const numValue = parseFloat(value) || 0

  const discountAmount = useMemo(() => {
    if (numValue <= 0) return 0
    if (type === 'percentage') {
      return (subtotal * Math.min(numValue, 100)) / 100
    }
    return Math.min(numValue, subtotal)
  }, [type, numValue, subtotal])

  const isValid = useMemo(() => {
    if (numValue <= 0) return false
    if (type === 'percentage' && numValue > 100) return false
    if (type === 'fixed' && numValue > subtotal) return false
    return true
  }, [type, numValue, subtotal])

  const handleApply = () => {
    if (!isValid) return

    setDiscount({
      type,
      value: numValue,
      reason: reason.trim() || undefined,
    })
    toast.success(`Remise de ${type === 'percentage' ? `${numValue}%` : formatPrice(numValue)} appliquée`)
    onClose()
  }

  const handleRemove = () => {
    setDiscount(null)
    toast.success('Remise retirée')
    onClose()
  }

  const handleQuickPercentage = (pct: number) => {
    setType('percentage')
    setValue(String(pct))
  }

  const content = (
    <div className="flex flex-col h-full">
      {discount && (
        <div className="mx-4 mt-3 mb-2 p-3 rounded-xl border-2 flex items-center justify-between" style={{ borderColor: primaryColor, backgroundColor: `${primaryColor}08` }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
              <Percent size={16} style={{ color: primaryColor }} />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-900 text-sm">
                {discount.type === 'percentage' ? `${discount.value}%` : formatPrice(discount.value)}
              </p>
              {discount.reason && <p className="text-xs text-gray-500 truncate">{discount.reason}</p>}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
          >
            <Trash2 size={16} className="mr-1" />
            Retirer
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        <div>
          <Label className="text-xs font-medium text-gray-700 mb-2 block">Type de remise</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('percentage')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all border',
                type === 'percentage'
                  ? 'text-white border-transparent shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              )}
              style={type === 'percentage' ? { backgroundColor: primaryColor } : undefined}
            >
              <Percent size={16} />
              Pourcentage
            </button>
            <button
              type="button"
              onClick={() => setType('fixed')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all border',
                type === 'fixed'
                  ? 'text-white border-transparent shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              )}
              style={type === 'fixed' ? { backgroundColor: primaryColor } : undefined}
            >
              <DollarSign size={16} />
              Montant fixe
            </button>
          </div>
        </div>

        {type === 'percentage' && (
          <div>
            <Label className="text-xs font-medium text-gray-700 mb-2 block">Raccourcis</Label>
            <div className="flex gap-2">
              {QUICK_PERCENTAGES.map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleQuickPercentage(pct)}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-sm font-medium transition-all border',
                    numValue === pct && type === 'percentage'
                      ? 'text-white border-transparent'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  )}
                  style={numValue === pct && type === 'percentage' ? { backgroundColor: primaryColor } : undefined}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="discount-value" className="text-xs font-medium text-gray-700 mb-2 block">
            {type === 'percentage' ? 'Pourcentage (%)' : 'Montant'}
          </Label>
          <div className="relative">
            {type === 'percentage' ? (
              <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            ) : (
              <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            )}
            <Input
              id="discount-value"
              type="number"
              min="0"
              max={type === 'percentage' ? '100' : undefined}
              step={type === 'percentage' ? '1' : '0.01'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === 'percentage' ? '10' : '500'}
              className="pl-9 h-10 rounded-xl border-gray-200 focus:ring-2 text-sm"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              autoFocus
            />
          </div>
          {type === 'percentage' && numValue > 100 && (
            <p className="text-xs text-red-500 mt-1">Le pourcentage ne peut pas dépasser 100%</p>
          )}
          {type === 'fixed' && numValue > subtotal && (
            <p className="text-xs text-red-500 mt-1">Le montant ne peut pas dépasser le sous-total ({formatPrice(subtotal)})</p>
          )}
        </div>

        <div>
          <Label htmlFor="discount-reason" className="text-xs font-medium text-gray-700 mb-2 block">
            Raison (optionnel)
          </Label>
          <div className="relative">
            <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              id="discount-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Fidélité, erreur cuisine..."
              className="pl-9 h-10 rounded-xl border-gray-200 focus:ring-2 text-sm"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>
        </div>

        {numValue > 0 && isValid && (
          <div className="p-3 rounded-xl bg-green-50 border border-green-100">
            <div className="flex justify-between items-center text-sm">
              <span className="text-green-700">Remise appliquée</span>
              <span className="font-semibold text-green-700">-{formatPrice(discountAmount)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-green-600 mt-1">
              <span>Sur un sous-total de {formatPrice(subtotal)}</span>
              <span>Nouveau : {formatPrice(subtotal - discountAmount)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pb-4 pt-3 border-t border-gray-100 flex gap-3">
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1 h-10 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
        >
          Annuler
        </Button>
        <Button
          onClick={handleApply}
          disabled={!isValid}
          className="flex-1 h-10 rounded-xl text-white disabled:opacity-50"
          style={{ backgroundColor: primaryColor }}
        >
          <Check size={16} className="mr-2" />
          Appliquer
        </Button>
      </div>
    </div>
  )

  const title = 'Appliquer une remise'
  const description = 'Choisissez le type et la valeur de la remise'

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[85vh] flex flex-col">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <Percent size={18} style={{ color: primaryColor }} />
              </div>
              <span>{title}</span>
            </DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-hidden">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden rounded-2xl max-h-[80vh] flex flex-col">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <Percent size={18} style={{ color: primaryColor }} />
            </div>
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  )
}
