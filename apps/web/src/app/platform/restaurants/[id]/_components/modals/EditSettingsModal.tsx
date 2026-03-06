'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { RestaurantDetails } from '../types'

interface EditSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  restaurant: RestaurantDetails
  type: 'general' | 'payment'
}

export function EditSettingsModal({ isOpen, onClose, restaurant, type }: EditSettingsModalProps) {
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()

  const [generalData, setGeneralData] = useState({
    currency: 'XOF',
    language: 'fr',
    timezone: 'Europe/Paris',
    orderPrefix: 'ORD',
    avgPrepTime: 30,
    autoAcceptOrders: false,
  })

  const [paymentData, setPaymentData] = useState({
    acceptCash: true,
    acceptCard: true,
    acceptOnlinePayment: true,
    tipsEnabled: true,
  })

  useEffect(() => {
    if (restaurant.settings && isOpen) {
      if (type === 'general') {
        setGeneralData({
          currency: restaurant.settings.currency || 'XOF',
          language: restaurant.settings.language || 'fr',
          timezone: restaurant.settings.timezone || 'Europe/Paris',
          orderPrefix: restaurant.settings.orderPrefix || 'ORD',
          avgPrepTime: restaurant.settings.avgPrepTime || 30,
          autoAcceptOrders: restaurant.settings.autoAcceptOrders || false,
        })
      } else {
        setPaymentData({
          acceptCash: restaurant.settings.acceptCash ?? true,
          acceptCard: restaurant.settings.acceptCard ?? true,
          acceptOnlinePayment: restaurant.settings.acceptOnlinePayment ?? true,
          tipsEnabled: restaurant.settings.tipsEnabled ?? true,
        })
      }
    }
  }, [restaurant.settings, isOpen, type])

  const mutation = useMutation({
    mutationFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const data = type === 'general' ? generalData : paymentData
      await apiClient.patch(`/platform/restaurants/${restaurant.id}/settings`, data)
    },
    onSuccess: () => {
      toast.success('Configuration mise a jour')
      queryClient.invalidateQueries({ queryKey: ['platform-restaurant', restaurant.id] })
      onClose()
    },
    onError: () => {
      toast.error('Erreur lors de la mise a jour')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {type === 'general' ? 'Configuration generale' : 'Configuration paiements'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'general' ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Devise</Label>
                  <Select
                    value={generalData.currency}
                    onValueChange={(value) => setGeneralData(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Devise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XOF">XOF (Franc CFA)</SelectItem>
                      <SelectItem value="EUR">EUR (Euro)</SelectItem>
                      <SelectItem value="USD">USD (Dollar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Langue</Label>
                  <Select
                    value={generalData.language}
                    onValueChange={(value) => setGeneralData(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Langue" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Francais</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fuseau horaire</Label>
                <Select
                  value={generalData.timezone}
                  onValueChange={(value) => setGeneralData(prev => ({ ...prev, timezone: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Fuseau horaire" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                    <SelectItem value="Africa/Dakar">Africa/Dakar</SelectItem>
                    <SelectItem value="Africa/Abidjan">Africa/Abidjan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orderPrefix">Prefixe commande</Label>
                  <Input
                    id="orderPrefix"
                    type="text"
                    value={generalData.orderPrefix}
                    onChange={(e) => setGeneralData(prev => ({ ...prev, orderPrefix: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avgPrepTime">Temps preparation (min)</Label>
                  <Input
                    id="avgPrepTime"
                    type="number"
                    value={generalData.avgPrepTime}
                    onChange={(e) => setGeneralData(prev => ({ ...prev, avgPrepTime: parseInt(e.target.value) || 30 }))}
                    min={5}
                    max={120}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Checkbox
                  id="autoAccept"
                  checked={generalData.autoAcceptOrders}
                  onCheckedChange={(checked) => setGeneralData(prev => ({ ...prev, autoAcceptOrders: checked === true }))}
                />
                <Label htmlFor="autoAccept" className="cursor-pointer font-normal">
                  Accepter automatiquement les commandes
                </Label>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <Label>Moyens de paiement acceptes</Label>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Checkbox
                    id="acceptCash"
                    checked={paymentData.acceptCash}
                    onCheckedChange={(checked) => setPaymentData(prev => ({ ...prev, acceptCash: checked === true }))}
                  />
                  <Label htmlFor="acceptCash" className="cursor-pointer font-normal">
                    Especes
                  </Label>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Checkbox
                    id="acceptCard"
                    checked={paymentData.acceptCard}
                    onCheckedChange={(checked) => setPaymentData(prev => ({ ...prev, acceptCard: checked === true }))}
                  />
                  <Label htmlFor="acceptCard" className="cursor-pointer font-normal">
                    Carte bancaire
                  </Label>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Checkbox
                    id="acceptOnline"
                    checked={paymentData.acceptOnlinePayment}
                    onCheckedChange={(checked) => setPaymentData(prev => ({ ...prev, acceptOnlinePayment: checked === true }))}
                  />
                  <Label htmlFor="acceptOnline" className="cursor-pointer font-normal">
                    Paiement en ligne
                  </Label>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Checkbox
                    id="tipsEnabled"
                    checked={paymentData.tipsEnabled}
                    onCheckedChange={(checked) => setPaymentData(prev => ({ ...prev, tipsEnabled: checked === true }))}
                  />
                  <Label htmlFor="tipsEnabled" className="cursor-pointer font-normal">
                    Activer les pourboires
                  </Label>
                </div>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 size={16} className="animate-spin mr-2" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
