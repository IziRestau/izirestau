'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Plus, Minus, RotateCcw, Trash2, ArrowUpDown } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { api, apiClient } from '@/lib/api-client'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  INGREDIENT_UNIT_ABBREVIATIONS,
  type Ingredient,
  type IngredientUnit,
  type StockMovementType,
} from '@/types/inventory'

interface AdjustStockModalProps {
  isOpen: boolean
  onClose: () => void
  ingredient: Ingredient | null
  primaryColor?: string
}

const ADJUSTMENT_TYPES: { value: StockMovementType; label: string; icon: typeof Plus; color: string }[] = [
  { value: 'PURCHASE', label: 'Achat', icon: Plus, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { value: 'ADJUSTMENT', label: 'Ajustement', icon: RotateCcw, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'WASTE', label: 'Perte', icon: Trash2, color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 'SALE', label: 'Vente', icon: Minus, color: 'text-amber-600 bg-amber-50 border-amber-200' },
]

export function AdjustStockModal({
  isOpen,
  onClose,
  ingredient,
  primaryColor = '#10b981',
}: AdjustStockModalProps) {
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()
  const isMobile = useIsMobile()

  const [type, setType] = useState<StockMovementType>('PURCHASE')
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')

  const resetForm = () => {
    setType('PURCHASE')
    setQuantity('')
    setUnitCost('')
    setReason('')
    setNotes('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const adjustMutation = useMutation({
    mutationFn: async () => {
      if (!ingredient) return
      if (accessToken) apiClient.setAccessToken(accessToken)
      
      const qty = parseFloat(quantity)
      const adjustedQty = ['SALE', 'WASTE'].includes(type) ? -Math.abs(qty) : Math.abs(qty)
      
      return api.restaurant.ingredients.adjustStock(ingredient.id, {
        quantity: adjustedQty,
        type,
        reason: reason || undefined,
        notes: notes || undefined,
        unitCost: unitCost ? parseFloat(unitCost) : undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] })
      queryClient.invalidateQueries({ queryKey: ['low-stock'] })
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
      toast.success('Stock ajusté')
      handleClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de l\'ajustement')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!quantity || parseFloat(quantity) <= 0) {
      toast.error('La quantité doit être supérieure à 0')
      return
    }
    adjustMutation.mutate()
  }

  if (!ingredient) return null

  const unit = INGREDIENT_UNIT_ABBREVIATIONS[ingredient.unit as IngredientUnit]
  const newStock = ['SALE', 'WASTE'].includes(type)
    ? ingredient.currentStock - Math.abs(parseFloat(quantity) || 0)
    : ingredient.currentStock + Math.abs(parseFloat(quantity) || 0)

  const formContent = (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Ingrédient info */}
          <div className="p-4 rounded-xl bg-gray-50">
            <p className="font-medium text-gray-900">{ingredient.name}</p>
            <p className="text-sm text-gray-500">
              Stock actuel: <span className="font-medium">{ingredient.currentStock} {unit}</span>
            </p>
          </div>

          {/* Type d'ajustement */}
          <div className="space-y-2">
            <Label>Type d'ajustement</Label>
            <div className="grid grid-cols-2 gap-2">
              {ADJUSTMENT_TYPES.map((t) => {
                const Icon = t.icon
                const isSelected = type === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                      isSelected ? t.color : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{t.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quantité */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantité ({unit}) *</Label>
            <Input
              id="quantity"
              type="number"
              step="0.001"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              autoFocus
            />
          </div>

          {/* Coût unitaire (pour achat) */}
          {type === 'PURCHASE' && (
            <div className="space-y-2">
              <Label htmlFor="unitCost">Coût unitaire (FCFA)</Label>
              <Input
                id="unitCost"
                type="number"
                step="0.01"
                min="0"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                placeholder={String(ingredient.unitCost)}
                className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            </div>
          )}

          {/* Raison */}
          <div className="space-y-2">
            <Label htmlFor="reason">Raison</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Réception commande, Inventaire..."
              className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes additionnelles..."
              className="rounded-xl resize-none border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              rows={2}
            />
          </div>

          {/* Aperçu */}
          {quantity && parseFloat(quantity) > 0 && (
            <div className="p-4 rounded-xl bg-gray-50 border">
              <p className="text-sm text-gray-500">Nouveau stock après ajustement:</p>
              <p className={`text-xl font-bold ${newStock < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {newStock.toFixed(3)} {unit}
              </p>
              {newStock < 0 && (
                <p className="text-sm text-red-500 mt-1">
                  Attention: le stock sera négatif
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="h-11 rounded-xl hover:!bg-gray-100 hover:!text-gray-900"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={adjustMutation.isPending || !quantity}
              style={{ backgroundColor: primaryColor }}
              className="h-11 rounded-xl text-white"
            >
              {adjustMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajuster
            </Button>
          </div>
        </form>
  )

  return (
    <>
      {isMobile ? (
        <Drawer open={isOpen} onOpenChange={handleClose}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-50">
                  <ArrowUpDown size={18} className="text-blue-500" />
                </div>
                <span>Ajuster le stock</span>
              </DrawerTitle>
              <DrawerDescription>
                Modifiez la quantité en stock de cet ingrédient
              </DrawerDescription>
            </DrawerHeader>
            <div className="max-h-[70vh] overflow-y-auto">
              {formContent}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isOpen} onOpenChange={handleClose}>
          <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden rounded-2xl">
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-50">
                  <ArrowUpDown size={18} className="text-blue-500" />
                </div>
                <span>Ajuster le stock</span>
              </DialogTitle>
              <DialogDescription>
                Modifiez la quantité en stock de cet ingrédient
              </DialogDescription>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
