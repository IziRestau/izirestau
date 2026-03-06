'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { ShoppingBag, Clock, Hash, Mail, MessageSquare, Loader2, Store, UtensilsCrossed } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { IconInput } from '@/components/shared/IconInput'

interface OrderSettingsProps {
  settings: {
    orderPrefix: string
    autoAcceptOrders: boolean
    orderConfirmationEmail: boolean
    orderNotificationSms: boolean
    avgPrepTime: number
    maxOrdersPerSlot: number | null
    pickupEnabled: boolean
    dineInEnabled: boolean
  } | null
  restaurantId: string
  onUpdate: () => void
  primaryColor?: string
}

export function OrderSettings({ settings, restaurantId, onUpdate, primaryColor = '#10b981' }: OrderSettingsProps) {
  const [formData, setFormData] = useState({
    orderPrefix: settings?.orderPrefix || 'CMD',
    autoAcceptOrders: settings?.autoAcceptOrders ?? false,
    orderConfirmationEmail: settings?.orderConfirmationEmail ?? true,
    orderNotificationSms: settings?.orderNotificationSms ?? false,
    avgPrepTime: settings?.avgPrepTime ?? 20,
    maxOrdersPerSlot: settings?.maxOrdersPerSlot ?? null,
    pickupEnabled: settings?.pickupEnabled ?? true,
    dineInEnabled: settings?.dineInEnabled ?? false,
  })

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return api.restaurant.updateOrderSettings({
        ...data,
        maxOrdersPerSlot: data.maxOrdersPerSlot ?? undefined,
        restaurantId,
      })
    },
    onSuccess: () => {
      toast.success('Paramètres de commandes mis à jour')
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
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Parametres des commandes</h3>
        <p className="text-sm text-gray-500">Configurez le comportement des commandes</p>
      </div>

      {/* General Settings */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Parametres generaux</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="orderPrefix">Prefixe des commandes</Label>
            <IconInput
              id="orderPrefix"
              icon={Hash}
              value={formData.orderPrefix}
              onChange={(e) => setFormData({ ...formData, orderPrefix: e.target.value.toUpperCase() })}
              placeholder="CMD"
              maxLength={5}
              focusColor={primaryColor}
            />
            <p className="text-xs text-gray-500">Ex: CMD-001, ORD-001</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="avgPrepTime">Temps de preparation moyen (min)</Label>
            <IconInput
              id="avgPrepTime"
              icon={Clock}
              type="number"
              min={5}
              max={120}
              value={formData.avgPrepTime.toString()}
              onChange={(e) => setFormData({ ...formData, avgPrepTime: parseInt(e.target.value) || 20 })}
              focusColor={primaryColor}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxOrdersPerSlot">Commandes max par creneau (optionnel)</Label>
          <Input
            id="maxOrdersPerSlot"
            type="number"
            min={1}
            max={100}
            value={formData.maxOrdersPerSlot?.toString() || ''}
            onChange={(e) => setFormData({ ...formData, maxOrdersPerSlot: e.target.value ? parseInt(e.target.value) : null })}
            placeholder="Illimite"
            className="h-11 rounded-xl focus:ring-2"
            style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
          />
          <p className="text-xs text-gray-500">Laissez vide pour ne pas limiter</p>
        </div>

        {/* Auto Accept Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <ShoppingBag size={20} style={{ color: primaryColor }} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Acceptation automatique</p>
              <p className="text-xs text-gray-500">Les commandes sont acceptées automatiquement</p>
            </div>
          </div>
          <Switch
            checked={formData.autoAcceptOrders}
            onCheckedChange={(checked) => setFormData({ ...formData, autoAcceptOrders: checked })}
            style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
            className="data-[state=checked]:bg-[--switch-checked-bg]"
          />
        </div>
      </div>

      {/* Types de service */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Types de service</h4>
        
        {/* Pickup */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Store size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">À emporter</p>
              <p className="text-xs text-gray-500">Les clients peuvent récupérer sur place</p>
            </div>
          </div>
          <Switch
            checked={formData.pickupEnabled}
            onCheckedChange={(checked) => setFormData({ ...formData, pickupEnabled: checked })}
            style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
            className="data-[state=checked]:bg-[--switch-checked-bg]"
          />
        </div>

        {/* Dine In */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <UtensilsCrossed size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Sur place</p>
              <p className="text-xs text-gray-500">Les clients peuvent manger sur place</p>
            </div>
          </div>
          <Switch
            checked={formData.dineInEnabled}
            onCheckedChange={(checked) => setFormData({ ...formData, dineInEnabled: checked })}
            style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
            className="data-[state=checked]:bg-[--switch-checked-bg]"
          />
        </div>
      </div>

      {/* Notifications */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Notifications client</h4>
        
        {/* Email Confirmation */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Mail size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Email de confirmation</p>
              <p className="text-xs text-gray-500">Envoyer un email au client apres commande</p>
            </div>
          </div>
          <Switch
            checked={formData.orderConfirmationEmail}
            onCheckedChange={(checked) => setFormData({ ...formData, orderConfirmationEmail: checked })}
            style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
            className="data-[state=checked]:bg-[--switch-checked-bg]"
          />
        </div>

        {/* SMS Notification */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <MessageSquare size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Notification SMS</p>
              <p className="text-xs text-gray-500">Envoyer un SMS au client (frais supplementaires)</p>
            </div>
          </div>
          <Switch
            checked={formData.orderNotificationSms}
            onCheckedChange={(checked) => setFormData({ ...formData, orderNotificationSms: checked })}
            style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
            className="data-[state=checked]:bg-[--switch-checked-bg]"
          />
        </div>
      </div>

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
