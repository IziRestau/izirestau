'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { Truck, Clock, MapPin, DollarSign, Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

interface DeliverySettingsProps {
  deliverySettings: {
    id: string
    isEnabled: boolean
    baseFee: number
    feePerKm: number
    freeDeliveryMin: number | null
    maxDistance: number
    minOrderAmount: number
    avgDeliveryTime: number
    autoAssign: boolean
  } | null
  restaurantId: string
  onUpdate: () => void
  primaryColor?: string
}

export function DeliverySettings({ deliverySettings, restaurantId, onUpdate, primaryColor = '#10b981' }: DeliverySettingsProps) {
  const [formData, setFormData] = useState({
    isEnabled: deliverySettings?.isEnabled ?? false,
    baseFee: deliverySettings?.baseFee ?? 2.5,
    feePerKm: deliverySettings?.feePerKm ?? 0.5,
    freeDeliveryMin: deliverySettings?.freeDeliveryMin ?? null,
    maxDistance: deliverySettings?.maxDistance ?? 10,
    minOrderAmount: deliverySettings?.minOrderAmount ?? 15,
    avgDeliveryTime: deliverySettings?.avgDeliveryTime ?? 30,
    autoAssign: deliverySettings?.autoAssign ?? false,
  })

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return api.restaurant.updateDeliverySettings({
        ...data,
        freeDeliveryMin: data.freeDeliveryMin ?? undefined,
        restaurantId,
      })
    },
    onSuccess: () => {
      toast.success('Paramètres de livraison mis à jour')
      onUpdate()
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  const isLoading = updateMutation.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Parametres de livraison</h3>
        <p className="text-sm text-gray-500">Configurez les zones et frais de livraison</p>
      </div>

      {/* Enable Delivery */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <Truck size={20} style={{ color: primaryColor }} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Activer la livraison</p>
            <p className="text-xs text-gray-500">Proposer la livraison a vos clients</p>
          </div>
        </div>
        <Switch
          checked={formData.isEnabled}
          onCheckedChange={(checked) => setFormData({ ...formData, isEnabled: checked })}
          style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
          className="data-[state=checked]:bg-[--switch-checked-bg]"
        />
      </div>

      {formData.isEnabled && (
        <>
          {/* General Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Parametres generaux</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="avgDeliveryTime">Temps de livraison moyen (min)</Label>
                <div className="relative">
                  <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="avgDeliveryTime"
                    type="number"
                    min={10}
                    max={120}
                    value={formData.avgDeliveryTime}
                    onChange={(e) => setFormData({ ...formData, avgDeliveryTime: parseInt(e.target.value) || 30 })}
                    className="h-11 rounded-xl pl-10 focus:ring-2"
                    style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxDistance">Distance maximale (km)</Label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="maxDistance"
                    type="number"
                    min={1}
                    max={50}
                    step={0.5}
                    value={formData.maxDistance}
                    onChange={(e) => setFormData({ ...formData, maxDistance: parseFloat(e.target.value) || 10 })}
                    className="h-11 rounded-xl pl-10 focus:ring-2"
                    style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minOrderAmount">Montant minimum de commande</Label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  id="minOrderAmount"
                  type="number"
                  min={0}
                  step={0.5}
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) || 0 })}
                  className="h-11 rounded-xl pl-10 focus:ring-2"
                  style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Tarification</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="baseFee">Frais de base</Label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="baseFee"
                    type="number"
                    min={0}
                    step={0.5}
                    value={formData.baseFee}
                    onChange={(e) => setFormData({ ...formData, baseFee: parseFloat(e.target.value) || 0 })}
                    className="h-11 rounded-xl pl-10 focus:ring-2"
                    style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="feePerKm">Frais par km</Label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="feePerKm"
                    type="number"
                    min={0}
                    step={0.1}
                    value={formData.feePerKm}
                    onChange={(e) => setFormData({ ...formData, feePerKm: parseFloat(e.target.value) || 0 })}
                    className="h-11 rounded-xl pl-10 focus:ring-2"
                    style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="freeDeliveryMin">Livraison gratuite a partir de (optionnel)</Label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  id="freeDeliveryMin"
                  type="number"
                  min={0}
                  step={1}
                  value={formData.freeDeliveryMin?.toString() || ''}
                  onChange={(e) => setFormData({ ...formData, freeDeliveryMin: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Pas de livraison gratuite"
                  className="h-11 rounded-xl pl-10 focus:ring-2"
                  style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                />
              </div>
              <p className="text-xs text-gray-500">Laissez vide pour desactiver la livraison gratuite</p>
            </div>
          </div>

          {/* Auto Assign */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Truck size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Attribution automatique</p>
                <p className="text-xs text-gray-500">Assigner automatiquement les livreurs disponibles</p>
              </div>
            </div>
            <Switch
              checked={formData.autoAssign}
              onCheckedChange={(checked) => setFormData({ ...formData, autoAssign: checked })}
              style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
              className="data-[state=checked]:bg-[--switch-checked-bg]"
            />
          </div>
        </>
      )}

      {/* Submit */}
      <div className="flex justify-end pt-4 border-t border-gray-100">
        <Button
          type="submit"
          disabled={isLoading}
          className="h-11 px-6 rounded-xl text-white"
          style={{ backgroundColor: primaryColor }}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            'Enregistrer'
          )}
        </Button>
      </div>
    </form>
  )
}
