'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'
import { toast } from 'sonner'
import { 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Heart, 
  Loader2, 
  CheckCircle,
  Settings,
  Coins,
  Lock,
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useRestaurantPermissions } from '@/hooks/use-restaurant-permissions'
import { MonerooConfigModal } from './MonerooConfigModal'

const CURRENCIES = [
  { code: 'XOF', name: 'Franc CFA', symbol: 'FCFA' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'USD', name: 'Dollar US', symbol: '$' },
]

interface PaymentSettingsProps {
  settings: {
    acceptCash: boolean
    acceptCard: boolean
    acceptOnlinePayment: boolean
    tipsEnabled: boolean
    suggestedTips: number[]
    currency: string
  } | null
  restaurantId: string
  onUpdate: () => void
  primaryColor?: string
}

export function PaymentSettings({ settings, restaurantId, onUpdate, primaryColor = '#10b981' }: PaymentSettingsProps) {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const { isOwner } = useRestaurantPermissions()
  
  const [formData, setFormData] = useState({
    acceptCash: settings?.acceptCash ?? true,
    acceptCard: settings?.acceptCard ?? true,
    acceptOnlinePayment: settings?.acceptOnlinePayment ?? false,
    tipsEnabled: settings?.tipsEnabled ?? false,
    suggestedTips: settings?.suggestedTips ?? [10, 15, 20],
  })

  const [selectedCurrency, setSelectedCurrency] = useState(settings?.currency ?? 'XOF')
  const [newTip, setNewTip] = useState('')
  const [monerooModalOpen, setMonerooModalOpen] = useState(false)

  // Vérifier si la devise peut être modifiée
  const { data: canChangeData } = useQuery({
    queryKey: ['can-change-currency', restaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.canChangeCurrency(restaurantId)
      return res.data
    },
    enabled: !!accessToken && !!restaurantId && isOwner,
  })

  // Moneroo config query
  const { data: monerooConfig } = useQuery({
    queryKey: ['restaurant-moneroo'],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.moneroo.get()
      return res.data
    },
    enabled: !!accessToken && isOwner,
    staleTime: 5 * 60 * 1000,
  })

  // Mutation pour la devise
  const currencyMutation = useMutation({
    mutationFn: async (currency: string) => {
      return api.restaurant.updateCurrency({ currency, restaurantId })
    },
    onSuccess: () => {
      toast.success('Devise mise à jour')
      onUpdate()
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return api.restaurant.updatePaymentSettings({ ...data, restaurantId })
    },
    onSuccess: () => {
      toast.success('Paramètres de paiement mis à jour')
      onUpdate()
    },
    onError: () => {
      toast.error('Erreur lors de la mise a jour')
    },
  })

  const handleAddTip = () => {
    const tipValue = parseInt(newTip)
    if (tipValue > 0 && tipValue <= 100 && !formData.suggestedTips.includes(tipValue)) {
      setFormData({
        ...formData,
        suggestedTips: [...formData.suggestedTips, tipValue].sort((a, b) => a - b),
      })
      setNewTip('')
    }
  }

  const handleRemoveTip = (tip: number) => {
    setFormData({
      ...formData,
      suggestedTips: formData.suggestedTips.filter(t => t !== tip),
    })
  }

  const handleOnlinePaymentToggle = (checked: boolean) => {
    if (checked && !monerooConfig?.isConfigured) {
      setMonerooModalOpen(true)
    } else {
      setFormData({ ...formData, acceptOnlinePayment: checked })
    }
  }

  const handleMonerooConfigured = () => {
    queryClient.invalidateQueries({ queryKey: ['restaurant-moneroo'] })
    setFormData({ ...formData, acceptOnlinePayment: true })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  const isLoading = updateMutation.isPending

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Modes de paiement</h3>
          <p className="text-sm text-gray-500">Configurez les modes de paiement acceptes</p>
        </div>

        {/* Currency - Owner only */}
        {isOwner && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Devise</h4>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <Coins size={20} style={{ color: primaryColor }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Devise du restaurant</p>
                  <p className="text-xs text-gray-500">Utilisée pour les prix et les paiements</p>
                </div>
              </div>

              {canChangeData?.canChange ? (
                <div className="flex gap-2">
                  {CURRENCIES.map((currency) => (
                    <button
                      key={currency.code}
                      type="button"
                      onClick={() => {
                        setSelectedCurrency(currency.code)
                        currencyMutation.mutate(currency.code)
                      }}
                      disabled={currencyMutation.isPending}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        selectedCurrency === currency.code
                          ? 'text-white'
                          : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                      }`}
                      style={selectedCurrency === currency.code ? { 
                        backgroundColor: primaryColor 
                      } : undefined}
                    >
                      {currency.symbol} {currency.code}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <Lock size={14} className="text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">
                    {CURRENCIES.find(c => c.code === selectedCurrency)?.symbol} {selectedCurrency}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Methods */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Modes de paiement</h4>
          {/* Cash */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Banknote size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Especes</p>
                <p className="text-xs text-gray-500">Paiement en especes a la livraison ou sur place</p>
              </div>
            </div>
            <Switch
              checked={formData.acceptCash}
              onCheckedChange={(checked) => setFormData({ ...formData, acceptCash: checked })}
              style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
              className="data-[state=checked]:bg-[--switch-checked-bg]"
            />
          </div>

          {/* Card */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <CreditCard size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Carte bancaire</p>
                <p className="text-xs text-gray-500">Paiement par carte sur place</p>
              </div>
            </div>
            <Switch
              checked={formData.acceptCard}
              onCheckedChange={(checked) => setFormData({ ...formData, acceptCard: checked })}
              style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
              className="data-[state=checked]:bg-[--switch-checked-bg]"
            />
          </div>

          {/* Online Payment */}
          {isOwner && (
            <div className="p-4 bg-gray-50 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Smartphone size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Mobile Money</p>
                    <p className="text-xs text-gray-500">Paiement via Moneroo (MoMo, Wave, etc.)</p>
                  </div>
                </div>
                <Switch
                  checked={formData.acceptOnlinePayment}
                  onCheckedChange={handleOnlinePaymentToggle}
                  style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
                  className="data-[state=checked]:bg-[--switch-checked-bg]"
                />
              </div>

              {/* Moneroo Status */}
              <div 
                className="flex items-center justify-between p-3 rounded-xl border"
                style={{ 
                  backgroundColor: monerooConfig?.isConfigured ? `${primaryColor}08` : '#fffbeb',
                  borderColor: monerooConfig?.isConfigured ? `${primaryColor}30` : '#fde68a'
                }}
              >
                <div className="flex items-center gap-2">
                  {monerooConfig?.isConfigured ? (
                    <>
                      <CheckCircle size={16} style={{ color: primaryColor }} />
                      <span className="text-sm font-medium" style={{ color: primaryColor }}>Moneroo configure</span>
                    </>
                  ) : (
                    <>
                      <Settings size={16} className="text-amber-600" />
                      <span className="text-sm font-medium text-amber-700">Moneroo non configure</span>
                    </>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMonerooModalOpen(true)}
                  className="h-9 px-4 rounded-xl text-sm"
                  style={monerooConfig?.isConfigured ? {} : { borderColor: primaryColor, color: primaryColor }}
                  onMouseEnter={(e) => { 
                    if (!monerooConfig?.isConfigured) {
                      e.currentTarget.style.backgroundColor = `${primaryColor}15`
                    }
                  }}
                  onMouseLeave={(e) => { 
                    if (!monerooConfig?.isConfigured) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  {monerooConfig?.isConfigured ? 'Gerer' : 'Configurer'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Pourboires</h4>
          
          {/* Tips Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Heart size={20} style={{ color: primaryColor }} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Activer les pourboires</p>
                <p className="text-xs text-gray-500">Permettre aux clients de laisser un pourboire</p>
              </div>
            </div>
            <Switch
              checked={formData.tipsEnabled}
              onCheckedChange={(checked) => setFormData({ ...formData, tipsEnabled: checked })}
              style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
              className="data-[state=checked]:bg-[--switch-checked-bg]"
            />
          </div>

          {/* Suggested Tips */}
          {formData.tipsEnabled && (
            <div className="space-y-3">
              <Label>Suggestions de pourboire (%)</Label>
              <div className="flex flex-wrap gap-2">
                {formData.suggestedTips.map((tip) => (
                  <button
                    key={tip}
                    type="button"
                    onClick={() => handleRemoveTip(tip)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-white flex items-center gap-1 hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {tip}%
                    <span className="text-xs opacity-70">x</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={newTip}
                  onChange={(e) => setNewTip(e.target.value)}
                  placeholder="Ajouter %"
                  className="h-10 rounded-xl w-32 focus:ring-2"
                  style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTip}
                  className="h-10 rounded-xl"
                  style={{ borderColor: primaryColor, color: primaryColor }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${primaryColor}15` }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  disabled={!newTip}
                >
                  Ajouter
                </Button>
              </div>
            </div>
          )}
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

      {/* Moneroo Config Modal */}
      <MonerooConfigModal
        isOpen={monerooModalOpen}
        onClose={() => setMonerooModalOpen(false)}
        onConfigured={handleMonerooConfigured}
        primaryColor={primaryColor}
      />
    </>
  )
}
