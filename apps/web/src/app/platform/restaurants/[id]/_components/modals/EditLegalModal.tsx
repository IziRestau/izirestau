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

interface EditLegalModalProps {
  isOpen: boolean
  onClose: () => void
  restaurant: RestaurantDetails
}

export function EditLegalModal({ isOpen, onClose, restaurant }: EditLegalModalProps) {
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()

  const [formData, setFormData] = useState({
    businessName: '',
    siret: '',
    vatNumber: '',
  })

  useEffect(() => {
    if (restaurant && isOpen) {
      setFormData({
        businessName: restaurant.businessName || '',
        siret: restaurant.siret || '',
        vatNumber: restaurant.vatNumber || '',
      })
    }
  }, [restaurant, isOpen])

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      await apiClient.patch(`/platform/restaurants/${restaurant.id}`, {
        businessName: data.businessName || null,
        siret: data.siret || null,
        vatNumber: data.vatNumber || null,
      })
    },
    onSuccess: () => {
      toast.success('Informations legales mises a jour')
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
          <DialogTitle>Informations legales</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Raison sociale</Label>
            <Input
              id="businessName"
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="siret">SIRET</Label>
            <Input
              id="siret"
              type="text"
              value={formData.siret}
              onChange={(e) => setFormData(prev => ({ ...prev, siret: e.target.value }))}
              placeholder="123 456 789 00012"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vatNumber">N° TVA</Label>
            <Input
              id="vatNumber"
              type="text"
              value={formData.vatNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, vatNumber: e.target.value }))}
              placeholder="FR12345678901"
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
