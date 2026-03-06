'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Settings2, Info } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface GeneralMarketingSettingsProps {
  onUpdate: () => void
  primaryColor?: string
}

export function GeneralMarketingSettings({
  onUpdate,
  primaryColor = '#10b981',
}: GeneralMarketingSettingsProps) {
  const [settings, setSettings] = useState({
    couponsEnabled: true,
    promotionsEnabled: true,
    reviewsEnabled: true,
    loyaltyEnabled: true,
    autoPublishReviews: false,
    requireVerifiedPurchase: true,
  })

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Configuration générale</h3>
        <p className="text-sm text-gray-500">
          Activez ou désactivez les fonctionnalités marketing
        </p>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
        <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-700">
          <p className="font-medium mb-1">Configuration globale</p>
          <p>
            Ces paramètres contrôlent l'activation des différentes fonctionnalités marketing 
            de votre restaurant. Désactiver une fonctionnalité la masquera de votre site vitrine.
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Fonctionnalités</h4>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <Settings2 size={20} style={{ color: primaryColor }} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Coupons</p>
              <p className="text-xs text-gray-500">Permettre l'utilisation de codes promo</p>
            </div>
          </div>
          <Switch
            checked={settings.couponsEnabled}
            onCheckedChange={() => handleToggle('couponsEnabled')}
            style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
            className="data-[state=checked]:bg-[--switch-checked-bg]"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Settings2 size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Promotions automatiques</p>
              <p className="text-xs text-gray-500">Appliquer les promotions sur le storefront</p>
            </div>
          </div>
          <Switch
            checked={settings.promotionsEnabled}
            onCheckedChange={() => handleToggle('promotionsEnabled')}
            style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
            className="data-[state=checked]:bg-[--switch-checked-bg]"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Settings2 size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Avis clients</p>
              <p className="text-xs text-gray-500">Afficher les avis sur votre site</p>
            </div>
          </div>
          <Switch
            checked={settings.reviewsEnabled}
            onCheckedChange={() => handleToggle('reviewsEnabled')}
            style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
            className="data-[state=checked]:bg-[--switch-checked-bg]"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
              <Settings2 size={20} className="text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Programme de fidélité</p>
              <p className="text-xs text-gray-500">Accumuler des points à chaque commande</p>
            </div>
          </div>
          <Switch
            checked={settings.loyaltyEnabled}
            onCheckedChange={() => handleToggle('loyaltyEnabled')}
            style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
            className="data-[state=checked]:bg-[--switch-checked-bg]"
          />
        </div>
      </div>

      {/* Review Settings */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Paramètres des avis</h4>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-900">Publication automatique</p>
            <p className="text-xs text-gray-500">Publier les avis sans modération</p>
          </div>
          <Switch
            checked={settings.autoPublishReviews}
            onCheckedChange={() => handleToggle('autoPublishReviews')}
            style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
            className="data-[state=checked]:bg-[--switch-checked-bg]"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-900">Achat vérifié requis</p>
            <p className="text-xs text-gray-500">Seuls les clients ayant commandé peuvent laisser un avis</p>
          </div>
          <Switch
            checked={settings.requireVerifiedPurchase}
            onCheckedChange={() => handleToggle('requireVerifiedPurchase')}
            style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
            className="data-[state=checked]:bg-[--switch-checked-bg]"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-4 border-t border-gray-100">
        <Button
          onClick={() => {
            toast.success('Paramètres enregistrés')
            onUpdate()
          }}
          style={{ backgroundColor: primaryColor }}
          className="h-11 text-white rounded-xl"
        >
          Enregistrer
        </Button>
      </div>
    </div>
  )
}
