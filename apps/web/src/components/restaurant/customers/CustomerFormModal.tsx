'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, Loader2, Mail, User, Phone, Tag, MessageSquare } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { api, apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-media-query'
import type { Customer, CustomerFormData } from '@/types/customer'

interface CustomerFormModalProps {
  isOpen: boolean
  onClose: () => void
  customer?: Customer | null
  primaryColor?: string
}

export function CustomerFormModal({
  isOpen,
  onClose,
  customer,
  primaryColor = '#10b981',
}: CustomerFormModalProps) {
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()
  const { currentRestaurantId } = useRestaurantStore()
  const isMobile = useIsMobile()

  const [formData, setFormData] = useState<CustomerFormData>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    marketingOptIn: true,
    tags: [],
    notes: '',
  })

  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (customer) {
      setFormData({
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone || '',
        marketingOptIn: customer.marketingOptIn,
        tags: customer.tags,
        notes: customer.notes || '',
      })
    } else {
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        marketingOptIn: true,
        tags: [],
        notes: '',
      })
    }
    setTagInput('')
  }, [customer, isOpen])

  const createMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.customers.create({
        ...data,
        phone: data.phone || null,
        notes: data.notes || null,
        restaurantId: currentRestaurantId || undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-customers'] })
      queryClient.invalidateQueries({ queryKey: ['restaurant-customers-stats'] })
      toast.success('Client créé avec succès')
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la création')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      if (!customer) return
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.customers.update(customer.id, {
        ...data,
        phone: data.phone || null,
        notes: data.notes || null,
        restaurantId: currentRestaurantId || undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-customers'] })
      queryClient.invalidateQueries({ queryKey: ['restaurant-customer', customer?.id] })
      toast.success('Client modifié avec succès')
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la modification')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (customer) {
      updateMutation.mutate(formData)
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !formData.tags?.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag],
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tagToRemove) || [],
    }))
  }

  const isLoading = createMutation.isPending || updateMutation.isPending
  const isEditing = !!customer

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Jean"
                className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Dupont"
                className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" style={{ zIndex: 1 }} />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="jean.dupont@email.com"
                className="pl-10 h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" style={{ zIndex: 1 }} />
              <Input
                id="phone"
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="06 12 34 56 78"
                className="pl-10 h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" style={{ zIndex: 1 }} />
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                  placeholder="Ajouter un tag..."
                  className="pl-10 h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                className="h-11 rounded-xl transition-colors"
                onMouseEnter={(e) => {
                  if (tagInput.trim()) {
                    e.currentTarget.style.backgroundColor = `${primaryColor}15`
                    e.currentTarget.style.borderColor = primaryColor
                    e.currentTarget.style.color = primaryColor
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = ''
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.color = ''
                }}
              >
                Ajouter
              </Button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:opacity-70"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes internes</Label>
            <div className="relative">
              <MessageSquare size={16} className="absolute left-3.5 top-3.5 text-gray-400" style={{ zIndex: 1 }} />
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notes sur le client..."
                className="pl-10 min-h-[80px] rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-900">Consentement marketing</p>
              <p className="text-xs text-gray-500">Accepte de recevoir des communications</p>
            </div>
            <Switch
              checked={formData.marketingOptIn}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, marketingOptIn: checked }))}
              style={{ 
                '--switch-thumb-bg': formData.marketingOptIn ? primaryColor : undefined,
                backgroundColor: formData.marketingOptIn ? primaryColor : undefined,
              } as React.CSSProperties}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={isLoading} 
              className="h-11 rounded-xl transition-colors"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${primaryColor}15`
                e.currentTarget.style.borderColor = primaryColor
                e.currentTarget.style.color = primaryColor
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = ''
                e.currentTarget.style.borderColor = ''
                e.currentTarget.style.color = ''
              }}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.email || !formData.firstName || !formData.lastName}
              style={{ backgroundColor: primaryColor }}
              className="text-white h-11 rounded-xl"
            >
              {isLoading && <Loader2 size={16} className="mr-2 animate-spin" />}
              {isEditing ? 'Enregistrer' : 'Créer le client'}
            </Button>
          </div>
    </form>
  )

  return (
    <>
      {isMobile ? (
        <Drawer open={isOpen} onOpenChange={onClose}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <User size={18} style={{ color: primaryColor }} />
                </div>
                <span>{isEditing ? 'Modifier le client' : 'Nouveau client'}</span>
              </DrawerTitle>
              <DrawerDescription>
                {isEditing ? 'Modifiez les informations du client' : 'Ajoutez un nouveau client'}
              </DrawerDescription>
            </DrawerHeader>
            <div className="max-h-[70vh] overflow-y-auto">
              {formContent}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden rounded-2xl">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <User size={18} style={{ color: primaryColor }} />
                </div>
                <span>{isEditing ? 'Modifier le client' : 'Nouveau client'}</span>
              </DialogTitle>
              <DialogDescription>
                {isEditing ? 'Modifiez les informations du client' : 'Ajoutez un nouveau client'}
              </DialogDescription>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
