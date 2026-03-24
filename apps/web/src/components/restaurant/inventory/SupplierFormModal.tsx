'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Truck } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { api, apiClient } from '@/lib/api-client'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import type { Supplier } from '@/types/inventory'

const supplierSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  contactName: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean(),
})

type SupplierFormData = z.infer<typeof supplierSchema>

interface SupplierFormModalProps {
  isOpen: boolean
  onClose: () => void
  supplier: Supplier | null
  primaryColor?: string
}

export function SupplierFormModal({
  isOpen,
  onClose,
  supplier,
  primaryColor = '#10b981',
}: SupplierFormModalProps) {
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()
  const { currentRestaurantId } = useRestaurantStore()
  const isMobile = useIsMobile()

  const isEditing = !!supplier

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      contactName: '',
      notes: '',
      isActive: true,
    },
  })

  useEffect(() => {
    if (supplier) {
      form.reset({
        name: supplier.name,
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        contactName: supplier.contactName || '',
        notes: supplier.notes || '',
        isActive: supplier.isActive,
      })
    } else {
      form.reset({
        name: '',
        email: '',
        phone: '',
        address: '',
        contactName: '',
        notes: '',
        isActive: true,
      })
    }
  }, [supplier, form])

  const createMutation = useMutation({
    mutationFn: async (data: SupplierFormData) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.suppliers.create({
        ...data,
        email: data.email || undefined,
        restaurantId: currentRestaurantId,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['suppliers-stats'] })
      toast.success('Fournisseur créé')
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la création')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: SupplierFormData) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.suppliers.update(supplier!.id, {
        ...data,
        email: data.email || undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['suppliers-stats'] })
      toast.success('Fournisseur modifié')
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la modification')
    },
  })

  const onSubmit = (data: SupplierFormData) => {
    if (isEditing) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="Ex: Fournisseur ABC"
              className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <Label htmlFor="contactName">Nom du contact</Label>
            <Input
              id="contactName"
              {...form.register('contactName')}
              placeholder="Ex: Jean Dupont"
              className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>

          {/* Email et Téléphone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                placeholder="contact@fournisseur.com"
                className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                {...form.register('phone')}
                placeholder="+225 XX XX XX XX"
                className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Adresse */}
          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Textarea
              id="address"
              {...form.register('address')}
              placeholder="Adresse complète..."
              className="rounded-xl resize-none border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              rows={2}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...form.register('notes')}
              placeholder="Notes additionnelles..."
              className="rounded-xl resize-none border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              rows={2}
            />
          </div>

          {/* Statut */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-gray-900">Fournisseur actif</p>
              <p className="text-sm text-gray-500">Désactiver pour masquer ce fournisseur</p>
            </div>
            <Switch
              checked={form.watch('isActive')}
              onCheckedChange={(checked) => form.setValue('isActive', checked)}
              style={{ 
                backgroundColor: form.watch('isActive') ? primaryColor : undefined,
              } as React.CSSProperties}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="h-11 rounded-xl"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              style={{ backgroundColor: primaryColor }}
              className="h-11 rounded-xl text-white"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Enregistrer' : 'Créer'}
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
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-50"
                >
                  <Truck size={18} className="text-emerald-500" />
                </div>
                <span>{isEditing ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</span>
              </DrawerTitle>
              <DrawerDescription>
                {isEditing ? 'Modifiez les informations du fournisseur' : 'Ajoutez un nouveau fournisseur'}
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
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-50"
                >
                  <Truck size={18} className="text-emerald-500" />
                </div>
                <span>{isEditing ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</span>
              </DialogTitle>
              <DialogDescription>
                {isEditing ? 'Modifiez les informations du fournisseur' : 'Ajoutez un nouveau fournisseur'}
              </DialogDescription>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
