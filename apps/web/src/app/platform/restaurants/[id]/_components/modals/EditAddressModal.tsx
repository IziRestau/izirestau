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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { RestaurantDetails } from '../types'

interface EditAddressModalProps {
  isOpen: boolean
  onClose: () => void
  restaurant: RestaurantDetails
}

export function EditAddressModal({ isOpen, onClose, restaurant }: EditAddressModalProps) {
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()

  const [formData, setFormData] = useState({
    address: '',
    addressLine2: '',
    postalCode: '',
    city: '',
    country: '',
  })

  useEffect(() => {
    if (restaurant && isOpen) {
      setFormData({
        address: restaurant.address || '',
        addressLine2: restaurant.addressLine2 || '',
        postalCode: restaurant.postalCode || '',
        city: restaurant.city || '',
        country: restaurant.country || 'FR',
      })
    }
  }, [restaurant, isOpen])

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      await apiClient.patch(`/platform/restaurants/${restaurant.id}`, {
        address: data.address,
        addressLine2: data.addressLine2 || null,
        postalCode: data.postalCode,
        city: data.city,
        country: data.country,
      })
    },
    onSuccess: () => {
      toast.success('Adresse mise a jour')
      queryClient.invalidateQueries({ queryKey: ['platform-restaurant', restaurant.id] })
      onClose()
    },
    onError: () => {
      toast.error('Erreur lors de la mise a jour')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier l'adresse</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Adresse *</Label>
            <Input
              id="address"
              type="text"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressLine2">Complement d'adresse</Label>
            <Input
              id="addressLine2"
              type="text"
              value={formData.addressLine2}
              onChange={(e) => setFormData(prev => ({ ...prev, addressLine2: e.target.value }))}
              placeholder="Batiment, etage, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalCode">Code postal *</Label>
              <Input
                id="postalCode"
                type="text"
                value={formData.postalCode}
                onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ville *</Label>
              <Input
                id="city"
                type="text"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Pays</Label>
            <Input
              id="country"
              type="text"
              value={formData.country}
              onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
            />
          </div>

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
