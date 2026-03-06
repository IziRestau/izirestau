'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api, apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'
import { toast } from 'sonner'
import { Bell, Mail, FileText, CreditCard, Store, Users, BarChart3, Megaphone, Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

interface NotificationsSettingsProps {
  onUpdate: () => void
}

interface NotificationPreferences {
  notifyEmailInvoice: boolean
  notifyEmailPayment: boolean
  notifyEmailNewSite: boolean
  notifyEmailNewClient: boolean
  notifyEmailWeeklyReport: boolean
  notifyEmailMarketing: boolean
}

const notificationOptions = [
  {
    key: 'notifyEmailInvoice' as const,
    label: 'Factures',
    description: 'Recevoir un email lors de la creation ou mise a jour d\'une facture',
    icon: FileText,
  },
  {
    key: 'notifyEmailPayment' as const,
    label: 'Paiements',
    description: 'Recevoir un email lors d\'un paiement recu',
    icon: CreditCard,
  },
  {
    key: 'notifyEmailNewSite' as const,
    label: 'Nouveaux sites',
    description: 'Recevoir un email lors de la creation d\'un nouveau site',
    icon: Store,
  },
  {
    key: 'notifyEmailNewClient' as const,
    label: 'Nouveaux clients',
    description: 'Recevoir un email lors de l\'inscription d\'un nouveau client',
    icon: Users,
  },
  {
    key: 'notifyEmailWeeklyReport' as const,
    label: 'Rapport hebdomadaire',
    description: 'Recevoir un resume de votre activite chaque semaine',
    icon: BarChart3,
  },
  {
    key: 'notifyEmailMarketing' as const,
    label: 'Communications marketing',
    description: 'Recevoir des offres et nouveautes IziResto',
    icon: Megaphone,
  },
]

export function NotificationsSettings({ onUpdate }: NotificationsSettingsProps) {
  const { accessToken } = useAuthStore()
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    notifyEmailInvoice: true,
    notifyEmailPayment: true,
    notifyEmailNewSite: true,
    notifyEmailNewClient: true,
    notifyEmailWeeklyReport: true,
    notifyEmailMarketing: false,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      return api.reseller.getNotifications()
    },
    enabled: !!accessToken,
  })

  useEffect(() => {
    if (data?.data) {
      setPreferences(data.data)
    }
  }, [data])

  const updateMutation = useMutation({
    mutationFn: async (newPreferences: Partial<NotificationPreferences>) => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      return api.reseller.updateNotifications(newPreferences)
    },
    onSuccess: (result) => {
      if (result.data) {
        setPreferences(result.data)
      }
      toast.success('Preferences mises a jour')
      onUpdate()
    },
    onError: () => {
      toast.error('Erreur lors de la mise a jour')
    },
  })

  const handleToggle = (key: keyof NotificationPreferences) => {
    const newValue = !preferences[key]
    setPreferences(prev => ({ ...prev, [key]: newValue }))
    updateMutation.mutate({ [key]: newValue })
  }

  const handleEnableAll = () => {
    const allEnabled: NotificationPreferences = {
      notifyEmailInvoice: true,
      notifyEmailPayment: true,
      notifyEmailNewSite: true,
      notifyEmailNewClient: true,
      notifyEmailWeeklyReport: true,
      notifyEmailMarketing: true,
    }
    setPreferences(allEnabled)
    updateMutation.mutate(allEnabled)
  }

  const handleDisableAll = () => {
    const allDisabled: NotificationPreferences = {
      notifyEmailInvoice: false,
      notifyEmailPayment: false,
      notifyEmailNewSite: false,
      notifyEmailNewClient: false,
      notifyEmailWeeklyReport: false,
      notifyEmailMarketing: false,
    }
    setPreferences(allDisabled)
    updateMutation.mutate(allDisabled)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Notifications</h3>
          <p className="text-sm text-gray-500">Gerez vos preferences de notifications par email</p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDisableAll}
            disabled={updateMutation.isPending}
          >
            Tout desactiver
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleEnableAll}
            disabled={updateMutation.isPending}
          >
            Tout activer
          </Button>
        </div>
      </div>

      {/* Email Notifications */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Mail size={16} />
          Notifications par email
        </div>

        <div className="space-y-1">
          {notificationOptions.map((option) => {
            const Icon = option.icon
            return (
              <div
                key={option.key}
                className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Icon size={18} className="text-gray-600" />
                  </div>
                  <div>
                    <Label className="font-medium text-gray-900 cursor-pointer">
                      {option.label}
                    </Label>
                    <p className="text-sm text-gray-500">{option.description}</p>
                  </div>
                </div>
                <Switch
                  checked={preferences[option.key]}
                  onCheckedChange={() => handleToggle(option.key)}
                  disabled={updateMutation.isPending}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
        <div className="flex items-start gap-3">
          <Bell size={18} className="text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">A propos des notifications</p>
            <p className="text-sm text-blue-700 mt-1">
              Les notifications importantes concernant la securite de votre compte seront toujours envoyees, 
              independamment de vos preferences.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
