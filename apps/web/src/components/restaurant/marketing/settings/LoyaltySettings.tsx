'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Heart, Info, Award, Gift, Loader2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth.store'
import { api, apiClient } from '@/lib/api-client'

interface LoyaltySettingsProps {
  onUpdate: () => void
  primaryColor?: string
}

export function LoyaltySettings({
  onUpdate,
  primaryColor = '#10b981',
}: LoyaltySettingsProps) {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()

  const [settings, setSettings] = useState({
    enabled: true,
    pointsPerCurrency: 1,
    currencyPerPoint: 100,
    minPointsToRedeem: 100,
    welcomeBonus: 0,
    birthdayBonus: 0,
    referralBonus: 0,
  })

  // Charger les paramètres depuis le backend
  const { data: savedSettings, isLoading } = useQuery({
    queryKey: ['loyalty-settings'],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.marketing.loyalty.getSettings()
      return res.data
    },
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
  })

  // Mettre à jour le state local quand les données arrivent
  useEffect(() => {
    if (savedSettings) {
      setSettings(savedSettings)
    }
  }, [savedSettings])

  // Mutation pour sauvegarder
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.marketing.loyalty.updateSettings(settings)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-settings'] })
      toast.success('Paramètres de fidélité enregistrés')
      onUpdate()
    },
    onError: () => {
      toast.error('Erreur lors de l\'enregistrement')
    },
  })

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Programme de fidélité</h3>
        <p className="text-sm text-gray-500">
          Configurez les règles d'accumulation et d'échange de points
        </p>
      </div>

      {/* Enable Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <Heart size={20} style={{ color: primaryColor }} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Activer le programme</p>
            <p className="text-xs text-gray-500">Les clients accumuleront des points</p>
          </div>
        </div>
        <Switch
          checked={settings.enabled}
          onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
          style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
          className="data-[state=checked]:bg-[--switch-checked-bg]"
        />
      </div>

      {/* Points Rules */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <Award size={16} style={{ color: primaryColor }} />
          Règles de points
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pointsPerCurrency">Points par 1000 XOF dépensés</Label>
            <Input
              id="pointsPerCurrency"
              type="number"
              min={1}
              value={settings.pointsPerCurrency}
              onChange={(e) => setSettings({ ...settings, pointsPerCurrency: parseInt(e.target.value) || 1 })}
              className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
            />
            <p className="text-xs text-gray-500">Ex: 1 point pour 1000 XOF</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="currencyPerPoint">Valeur d'un point (XOF)</Label>
            <Input
              id="currencyPerPoint"
              type="number"
              min={1}
              value={settings.currencyPerPoint}
              onChange={(e) => setSettings({ ...settings, currencyPerPoint: parseInt(e.target.value) || 100 })}
              className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
            />
            <p className="text-xs text-gray-500">Ex: 1 point = 100 XOF de réduction</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="minPointsToRedeem">Minimum de points pour échanger</Label>
          <Input
            id="minPointsToRedeem"
            type="number"
            min={1}
            value={settings.minPointsToRedeem}
            onChange={(e) => setSettings({ ...settings, minPointsToRedeem: parseInt(e.target.value) || 100 })}
            className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
            style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
          />
          <p className="text-xs text-gray-500">Les clients doivent avoir au moins ce nombre de points pour les utiliser</p>
        </div>
      </div>

      {/* Bonus Points */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <Gift size={16} style={{ color: primaryColor }} />
          Points bonus
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="welcomeBonus">Bonus de bienvenue</Label>
            <Input
              id="welcomeBonus"
              type="number"
              min={0}
              value={settings.welcomeBonus}
              onChange={(e) => setSettings({ ...settings, welcomeBonus: parseInt(e.target.value) || 0 })}
              className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
            />
            <p className="text-xs text-gray-500">À l'inscription</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthdayBonus">Bonus anniversaire</Label>
            <Input
              id="birthdayBonus"
              type="number"
              min={0}
              value={settings.birthdayBonus}
              onChange={(e) => setSettings({ ...settings, birthdayBonus: parseInt(e.target.value) || 0 })}
              className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
            />
            <p className="text-xs text-gray-500">Chaque année</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="referralBonus">Bonus parrainage</Label>
            <Input
              id="referralBonus"
              type="number"
              min={0}
              value={settings.referralBonus}
              onChange={(e) => setSettings({ ...settings, referralBonus: parseInt(e.target.value) || 0 })}
              className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
            />
            <p className="text-xs text-gray-500">Par filleul</p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
        <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-700">
          <p className="font-medium mb-1">Comment ça marche</p>
          <p>
            Les clients gagnent des points à chaque commande complétée et peuvent les utiliser 
            au checkout pour réduire le montant de leur prochaine commande.
          </p>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-4 border-t border-gray-100">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || isLoading}
          style={{ backgroundColor: primaryColor }}
          className="h-11 text-white rounded-xl"
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            'Enregistrer'
          )}
        </Button>
      </div>
    </div>
  )
}
