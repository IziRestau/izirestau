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
import { Loader2, Percent, Calendar, Clock } from 'lucide-react'
import type { Promotion, CreatePromotionInput, DiscountType, PromotionType } from '@/types/marketing'
import { DISCOUNT_TYPE_LABELS, PROMOTION_TYPE_LABELS, DAY_SHORT_LABELS } from '@/types/marketing'
import { cn } from '@/lib/utils'

interface PromotionFormModalProps {
  isOpen: boolean
  onClose: () => void
  promotion: Promotion | null
  onSuccess: () => void
  primaryColor?: string
}

export function PromotionFormModal({
  isOpen,
  onClose,
  promotion,
  onSuccess,
  primaryColor = '#10b981',
}: PromotionFormModalProps) {
  const isEditing = !!promotion?.id

  const [formData, setFormData] = useState<CreatePromotionInput>({
    name: '',
    description: '',
    type: 'DISCOUNT',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderAmount: null,
    maxDiscount: null,
    appliesToAll: true,
    startDate: new Date().toISOString().split('T')[0],
    endDate: null,
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    activeFrom: null,
    activeTo: null,
    isActive: true,
  })

  useEffect(() => {
    if (promotion) {
      setFormData({
        name: promotion.name,
        description: promotion.description || '',
        type: promotion.type as PromotionType,
        discountType: promotion.discountType as DiscountType,
        discountValue: promotion.discountValue,
        minOrderAmount: promotion.minOrderAmount,
        maxDiscount: promotion.maxDiscount,
        appliesToAll: promotion.appliesToAll,
        startDate: promotion.startDate.split('T')[0],
        endDate: promotion.endDate ? promotion.endDate.split('T')[0] : null,
        activeDays: promotion.activeDays,
        activeFrom: promotion.activeFrom,
        activeTo: promotion.activeTo,
        isActive: promotion.isActive,
      })
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'DISCOUNT',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minOrderAmount: null,
        maxDiscount: null,
        appliesToAll: true,
        startDate: new Date().toISOString().split('T')[0],
        endDate: null,
        activeDays: [0, 1, 2, 3, 4, 5, 6],
        activeFrom: null,
        activeTo: null,
        isActive: true,
      })
    }
  }, [promotion, isOpen])

  const createMutation = useMutation({
    mutationFn: (data: CreatePromotionInput) => api.restaurant.marketing.promotions.create({
      ...data,
      startDate: new Date(data.startDate).toISOString(),
      endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
    }),
    onSuccess: () => {
      toast.success('Promotion créée avec succès')
      onSuccess()
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erreur lors de la création'
      toast.error(message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: CreatePromotionInput) => api.restaurant.marketing.promotions.update(promotion!.id, {
      ...data,
      startDate: new Date(data.startDate).toISOString(),
      endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
    }),
    onSuccess: () => {
      toast.success('Promotion mise à jour')
      onSuccess()
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erreur lors de la mise à jour'
      toast.error(message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Le nom est requis')
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

  const toggleDay = (day: number) => {
    const days = formData.activeDays || []
    if (days.includes(day)) {
      setFormData({ ...formData, activeDays: days.filter(d => d !== day) })
    } else {
      setFormData({ ...formData, activeDays: [...days, day].sort() })
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Percent size={20} style={{ color: primaryColor }} />
            {isEditing ? 'Modifier la promotion' : 'Créer une promotion'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la promotion *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Happy Hour -20%"
              className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description de la promotion (optionnel)"
              rows={2}
              className="rounded-xl resize-none border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Type de promotion *</Label>
            <Select
              value={formData.type}
              onValueChange={(value: PromotionType) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger 
                className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent accentColor={primaryColor}>
                {Object.entries(PROMOTION_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Date de début *</Label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="pl-9 h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                  style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                  required
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

          {/* Active Days */}
          <div className="space-y-2">
            <Label>Jours actifs</Label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    formData.activeDays?.includes(day)
                      ? "text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                  style={formData.activeDays?.includes(day) ? { backgroundColor: primaryColor } : undefined}
                >
                  {DAY_SHORT_LABELS[day]}
                </button>
              ))}
            </div>
          </div>

          {/* Active Hours */}
          {(formData.type === 'HAPPY_HOUR') && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="activeFrom">Heure de début</Label>
                <div className="relative">
                  <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="activeFrom"
                    type="time"
                    value={formData.activeFrom || ''}
                    onChange={(e) => setFormData({ ...formData, activeFrom: e.target.value || null })}
                    className="pl-9 h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                    style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="activeTo">Heure de fin</Label>
                <div className="relative">
                  <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="activeTo"
                    type="time"
                    value={formData.activeTo || ''}
                    onChange={(e) => setFormData({ ...formData, activeTo: e.target.value || null })}
                    className="pl-9 h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                    style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Activer la promotion</p>
              <p className="text-sm text-gray-500">La promotion sera appliquée automatiquement</p>
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
                isEditing ? 'Mettre à jour' : 'Créer la promotion'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
