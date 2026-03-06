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
import { Textarea } from '@/components/ui/textarea'
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

const businessTypes = [
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'FAST_FOOD', label: 'Fast Food' },
  { value: 'CAFE', label: 'Cafe' },
  { value: 'BAKERY', label: 'Boulangerie' },
  { value: 'PIZZERIA', label: 'Pizzeria' },
  { value: 'FOOD_TRUCK', label: 'Food Truck' },
  { value: 'DARK_KITCHEN', label: 'Dark Kitchen' },
  { value: 'CATERING', label: 'Traiteur' },
  { value: 'OTHER', label: 'Autre' },
]

interface EditInfoModalProps {
  isOpen: boolean
  onClose: () => void
  restaurant: RestaurantDetails
}

export function EditInfoModal({ isOpen, onClose, restaurant }: EditInfoModalProps) {
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()

  const [formData, setFormData] = useState({
    name: '',
    shortDescription: '',
    description: '',
    businessType: 'RESTAURANT',
    cuisineTypes: '',
  })

  useEffect(() => {
    if (restaurant && isOpen) {
      setFormData({
        name: restaurant.name || '',
        shortDescription: restaurant.shortDescription || '',
        description: restaurant.description || '',
        businessType: restaurant.businessType || 'RESTAURANT',
        cuisineTypes: restaurant.cuisineTypes?.join(', ') || '',
      })
    }
  }, [restaurant, isOpen])

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const cuisineTypesArray = data.cuisineTypes
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)
      await apiClient.patch(`/platform/restaurants/${restaurant.id}`, {
        name: data.name,
        shortDescription: data.shortDescription || null,
        description: data.description || null,
        businessType: data.businessType,
        cuisineTypes: cuisineTypesArray,
      })
    },
    onSuccess: () => {
      toast.success('Informations mises a jour')
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier les informations</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du restaurant *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Type d'etablissement</Label>
            <Select
              value={formData.businessType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, businessType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {businessTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDescription">Description courte</Label>
            <Input
              id="shortDescription"
              type="text"
              value={formData.shortDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
              placeholder="Une phrase pour decrire votre restaurant"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description complete</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              placeholder="Description detaillee"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cuisineTypes">Types de cuisine</Label>
            <Input
              id="cuisineTypes"
              type="text"
              value={formData.cuisineTypes}
              onChange={(e) => setFormData(prev => ({ ...prev, cuisineTypes: e.target.value }))}
              placeholder="Francaise, Italienne, Japonaise (separes par des virgules)"
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
