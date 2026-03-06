'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Building2,
  Loader2,
  MapPin,
  FileText,
  Palette,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'
import type { ResellerDetails } from './types'

interface EditResellerModalProps {
  isOpen: boolean
  onClose: () => void
  reseller: ResellerDetails
}

const editResellerSchema = z.object({
  name: z.string().min(2, 'Nom requis (min 2 caracteres)'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  businessName: z.string().optional().nullable(),
  siret: z.string().optional().nullable(),
  vatNumber: z.string().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur invalide (format #RRGGBB)'),
})

type EditResellerFormData = z.infer<typeof editResellerSchema>

export function EditResellerModal({ isOpen, onClose, reseller }: EditResellerModalProps) {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeSection, setActiveSection] = useState<'general' | 'address' | 'legal' | 'branding'>('general')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<EditResellerFormData>({
    resolver: zodResolver(editResellerSchema),
    defaultValues: {
      name: reseller.name,
      email: reseller.email,
      phone: reseller.phone || '',
      website: reseller.website || '',
      address: reseller.address || '',
      city: reseller.city || '',
      postalCode: reseller.postalCode || '',
      country: reseller.country || 'FR',
      businessName: reseller.businessName || '',
      siret: reseller.siret || '',
      vatNumber: reseller.vatNumber || '',
      primaryColor: reseller.primaryColor || '#3B82F6',
    },
  })

  const primaryColor = watch('primaryColor')

  const mutation = useMutation({
    mutationFn: async (data: EditResellerFormData) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await apiClient.put(`/platform/resellers/${reseller.id}`, data)
      return res.data
    },
    onSuccess: () => {
      toast.success('Revendeur mis a jour')
      queryClient.invalidateQueries({ queryKey: ['platform-reseller', reseller.id] })
      queryClient.invalidateQueries({ queryKey: ['platform-resellers'] })
      onClose()
    },
    onError: () => {
      toast.error('Erreur lors de la mise a jour')
    },
  })

  const onSubmit = (data: EditResellerFormData) => {
    mutation.mutate(data)
  }

  const sections = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'address', label: 'Adresse', icon: MapPin },
    { id: 'legal', label: 'Legal', icon: FileText },
    { id: 'branding', label: 'Branding', icon: Palette },
  ] as const

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 rounded-2xl overflow-hidden max-h-[90vh]">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100">
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Modifier le revendeur
          </DialogTitle>
        </DialogHeader>

        <div className="flex border-b border-gray-100 overflow-x-auto">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeSection === section.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <section.icon size={16} />
              {section.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
          <div className="p-6 space-y-4 overflow-y-auto max-h-[50vh]">
            {activeSection === 'general' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom de l'organisation *</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="Ma Societe"
                      className={errors.name ? 'border-red-300' : ''}
                    />
                    {errors.name && (
                      <p className="text-xs text-red-500">{errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="contact@societe.com"
                      className={errors.email ? 'border-red-300' : ''}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500">{errors.email.message}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telephone</Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                      placeholder="+33 1 23 45 67 89"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Site web</Label>
                    <Input
                      id="website"
                      {...register('website')}
                      placeholder="https://www.societe.com"
                    />
                  </div>
                </div>
              </>
            )}

            {activeSection === 'address' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    {...register('address')}
                    placeholder="123 Rue de la Paix"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Code postal</Label>
                    <Input
                      id="postalCode"
                      {...register('postalCode')}
                      placeholder="75001"
                    />
                  </div>
                  <div className="space-y-2 col-span-1 sm:col-span-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      {...register('city')}
                      placeholder="Paris"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Pays</Label>
                  <Input
                    id="country"
                    {...register('country')}
                    placeholder="FR"
                  />
                </div>
              </>
            )}

            {activeSection === 'legal' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="businessName">Raison sociale</Label>
                  <Input
                    id="businessName"
                    {...register('businessName')}
                    placeholder="Ma Societe SAS"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siret">SIRET</Label>
                    <Input
                      id="siret"
                      {...register('siret')}
                      placeholder="123 456 789 00012"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vatNumber">N° TVA</Label>
                    <Input
                      id="vatNumber"
                      {...register('vatNumber')}
                      placeholder="FR12345678901"
                    />
                  </div>
                </div>
              </>
            )}

            {activeSection === 'branding' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Couleur primaire</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="primaryColor"
                      {...register('primaryColor')}
                      className="w-12 h-12 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <Input
                      {...register('primaryColor')}
                      placeholder="#3B82F6"
                      className={`flex-1 font-mono ${errors.primaryColor ? 'border-red-300' : ''}`}
                    />
                  </div>
                  {errors.primaryColor && (
                    <p className="text-xs text-red-500">{errors.primaryColor.message}</p>
                  )}
                  <div className="mt-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
                    <p className="text-sm text-gray-500 mb-2">Apercu</p>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg"
                        style={{ backgroundColor: primaryColor }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        style={{ backgroundColor: primaryColor }}
                        className="text-white"
                      >
                        Bouton exemple
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3 p-6 pt-4 border-t border-gray-100 bg-gray-50">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={mutation.isPending}
              className="flex-1 h-11 rounded-xl"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
