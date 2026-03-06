'use client'

import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api-client'
import { Bell, Mail, MessageSquare, Info, Loader2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'

interface NotificationSettingsProps {
  settings: {
    orderConfirmationEmail: boolean
    orderNotificationSms: boolean
  } | null
  onUpdate: () => void
  primaryColor?: string
}

export function NotificationSettings({
  settings,
  onUpdate,
  primaryColor = '#10b981',
}: NotificationSettingsProps) {
  const [formData, setFormData] = useState({
    orderConfirmationEmail: settings?.orderConfirmationEmail ?? true,
    orderNotificationSms: settings?.orderNotificationSms ?? false,
    promotionEmails: true,
    reviewRequestEmails: true,
    loyaltyEmails: true,
  })

  useEffect(() => {
    if (settings) {
      setFormData(prev => ({
        ...prev,
        orderConfirmationEmail: settings.orderConfirmationEmail,
        orderNotificationSms: settings.orderNotificationSms,
      }))
    }
  }, [settings])

  const updateMutation = useMutation({
    mutationFn: async () => {
      return api.restaurant.updateOrderSettings({
        orderConfirmationEmail: formData.orderConfirmationEmail,
        orderNotificationSms: formData.orderNotificationSms,
      })
    },
    onSuccess: () => {
      toast.success('Paramètres de notifications mis à jour')
      onUpdate()
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Notifications</h3>
        <p className="text-sm text-gray-500">
          Configurez les notifications envoyées à vos clients
        </p>
      </div>

      {/* Transactional Notifications */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <Bell size={16} style={{ color: primaryColor }} />
          Notifications transactionnelles
        </h4>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Mail size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Email de confirmation</p>
              <p className="text-xs text-gray-500">Envoyer un email après chaque commande</p>
            </div>
          </div>
          <Switch
            checked={formData.orderConfirmationEmail}
            onCheckedChange={(checked) => setFormData({ ...formData, orderConfirmationEmail: checked })}
            style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
            className="data-[state=checked]:bg-[--switch-checked-bg]"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <MessageSquare size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Notification SMS</p>
              <p className="text-xs text-gray-500">Envoyer un SMS au client (frais supplémentaires)</p>
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

      {/* Marketing Notifications */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <Mail size={16} style={{ color: primaryColor }} />
          Emails marketing
        </h4>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-900">Promotions et offres</p>
            <p className="text-xs text-gray-500">Informer les clients des nouvelles promotions</p>
          </div>
          <Switch
            checked={formData.promotionEmails}
            onCheckedChange={(checked) => setFormData({ ...formData, promotionEmails: checked })}
            style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
            className="data-[state=checked]:bg-[--switch-checked-bg]"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-900">Demande d'avis</p>
            <p className="text-xs text-gray-500">Demander un avis après une commande</p>
          </div>
          <Switch
            checked={formData.reviewRequestEmails}
            onCheckedChange={(checked) => setFormData({ ...formData, reviewRequestEmails: checked })}
            style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
            className="data-[state=checked]:bg-[--switch-checked-bg]"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-900">Points de fidélité</p>
            <p className="text-xs text-gray-500">Rappels sur les points accumulés</p>
          </div>
          <Switch
            checked={formData.loyaltyEmails}
            onCheckedChange={(checked) => setFormData({ ...formData, loyaltyEmails: checked })}
            style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
            className="data-[state=checked]:bg-[--switch-checked-bg]"
          />
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
        <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-700">
          <p className="font-medium mb-1">Respect du RGPD</p>
          <p>
            Les emails marketing ne sont envoyés qu'aux clients ayant accepté de les recevoir 
            (opt-in marketing). Les clients peuvent se désabonner à tout moment.
          </p>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-4 border-t border-gray-100">
        <Button
          type="submit"
          disabled={updateMutation.isPending}
          style={{ backgroundColor: primaryColor }}
          className="h-11 text-white rounded-xl"
        >
          {updateMutation.isPending ? (
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
