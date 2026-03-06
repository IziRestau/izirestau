'use client'

import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api-client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Ticket, Percent, Hash, Calendar } from 'lucide-react'
import type { Coupon, CreateCouponInput, DiscountType } from '@/types/marketing'
import { DISCOUNT_TYPE_LABELS } from '@/types/marketing'

interface CouponFormModalProps {
  isOpen: boolean
  onClose: () => void
  coupon: Coupon | null
  onSuccess: () => void
  primaryColor?: string
}

export function CouponFormModal({
  isOpen,
  onClose,
  coupon,
  onSuccess,
  primaryColor = '#10b981',
}: CouponFormModalProps) {
  const isEditing = !!coupon?.id

  const [formData, setFormData] = useState<CreateCouponInput>({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderAmount: null,
    maxDiscount: null,
    maxUses: null,
    maxUsesPerCustomer: 1,
    appliesToAll: true,
    startDate: new Date().toISOString().split('T')[0],
    endDate: null,
    isActive: true,
  })

  useEffect(() => {
    if (coupon) {
      setFormData({
        code: coupon.code,
        description: coupon.description || '',
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscount: coupon.maxDiscount,
        maxUses: coupon.maxUses,
        maxUsesPerCustomer: coupon.maxUsesPerCustomer,
        appliesToAll: coupon.appliesToAll,
        startDate: coupon.startDate.split('T')[0],
        endDate: coupon.endDate ? coupon.endDate.split('T')[0] : null,
        isActive: coupon.isActive,
      })
    } else {
      setFormData({
        code: '',
        description: '',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minOrderAmount: null,
        maxDiscount: null,
        maxUses: null,
        maxUsesPerCustomer: 1,
        appliesToAll: true,
        startDate: new Date().toISOString().split('T')[0],
        endDate: null,
        isActive: true,
      })
    }
  }, [coupon, isOpen])

  const createMutation = useMutation({
    mutationFn: (data: CreateCouponInput) => api.restaurant.marketing.coupons.create({
      ...data,
      startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
      endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
    }),
    onSuccess: () => {
      toast.success('Coupon créé avec succès')
      onSuccess()
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erreur lors de la création'
      toast.error(message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: CreateCouponInput) => api.restaurant.marketing.coupons.update(coupon!.id, {
      ...data,
      startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
      endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
    }),
    onSuccess: () => {
      toast.success('Coupon mis à jour')
      onSuccess()
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erreur lors de la mise à jour'
      toast.error(message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.code.trim()) {
      toast.error('Le code est requis')
      return
    }

    if (formData.discountValue <= 0) {
      toast.error('La valeur de réduction doit être positive')
      return
    }

    if (formData.discountType === 'PERCENTAGE' && formData.discountValue > 100) {
      toast.error('Le pourcentage ne peut pas dépasser 100%')
      return
    }

    if (isEditing) {
      updateMutation.mutate(formData)
    } else {
      createMutation.mutate(formData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket size={20} style={{ color: primaryColor }} />
            {isEditing ? 'Modifier le coupon' : 'Créer un coupon'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Code */}
          <div className="space-y-2">
            <Label htmlFor="code">Code promo *</Label>
            <div className="relative">
              <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="PROMO2024"
                className="pl-9 h-11 rounded-xl font-mono uppercase border-gray-200 focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                maxLength={20}
              />
            </div>
            <p className="text-xs text-gray-500">Le code que les clients utiliseront</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description du coupon (optionnel)"
              rows={2}
              className="rounded-xl resize-none border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
            />
          </div>

          {/* Discount Type & Value */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type de réduction *</Label>
              <Select
                value={formData.discountType}
                onValueChange={(value: DiscountType) => setFormData({ ...formData, discountType: value })}
              >
                <SelectTrigger 
                  className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent accentColor={primaryColor}>
                  {Object.entries(DISCOUNT_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountValue">Valeur *</Label>
              <div className="relative">
                <Input
                  id="discountValue"
                  type="number"
                  min={0}
                  max={formData.discountType === 'PERCENTAGE' ? 100 : undefined}
                  step={formData.discountType === 'PERCENTAGE' ? 1 : 0.01}
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                  className="h-11 rounded-xl pr-10 border-gray-200 focus:ring-2 focus:ring-offset-0"
                  style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  {formData.discountType === 'PERCENTAGE' ? '%' : 'XOF'}
                </span>
              </div>
            </div>
          </div>

          {/* Min Order & Max Discount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minOrderAmount">Commande minimum</Label>
              <Input
                id="minOrderAmount"
                type="number"
                min={0}
                step={0.01}
                value={formData.minOrderAmount || ''}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder="Aucun"
                className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
              />
            </div>
            {formData.discountType === 'PERCENTAGE' && (
              <div className="space-y-2">
                <Label htmlFor="maxDiscount">Réduction max</Label>
                <Input
                  id="maxDiscount"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.maxDiscount || ''}
                  onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Illimitée"
                  className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                  style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                />
              </div>
            )}
          </div>

          {/* Usage Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxUses">Utilisations max (total)</Label>
              <Input
                id="maxUses"
                type="number"
                min={1}
                value={formData.maxUses || ''}
                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="Illimité"
                className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxUsesPerCustomer">Par client</Label>
              <Input
                id="maxUsesPerCustomer"
                type="number"
                min={1}
                value={formData.maxUsesPerCustomer || ''}
                onChange={(e) => setFormData({ ...formData, maxUsesPerCustomer: e.target.value ? parseInt(e.target.value) : 1 })}
                placeholder="1"
                className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Date de début</Label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="pl-9 h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                  style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Date de fin</Label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value || null })}
                  className="pl-9 h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                  style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                />
              </div>
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Activer le coupon</p>
              <p className="text-sm text-gray-500">Le coupon sera utilisable immédiatement</p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
              className="data-[state=checked]:bg-[--switch-checked-bg]"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="h-11 rounded-xl hover:!bg-gray-100 hover:!text-gray-900"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              style={{ backgroundColor: primaryColor }}
              className="h-11 text-white rounded-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  {isEditing ? 'Mise à jour...' : 'Création...'}
                </>
              ) : (
                isEditing ? 'Mettre à jour' : 'Créer le coupon'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
