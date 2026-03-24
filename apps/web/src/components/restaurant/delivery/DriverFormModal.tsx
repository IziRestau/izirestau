'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, User, Mail, Phone, Car, CreditCard } from 'lucide-react'
import { api, apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'

type VehicleType = 'BIKE' | 'SCOOTER' | 'CAR' | 'WALK'

interface Driver {
  id: string
  userId: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    phone: string | null
    avatar: string | null
  }
  licenseNumber: string | null
  vehicleType: VehicleType
  vehiclePlate: string | null
  isActive: boolean
}

interface DriverFormModalProps {
  isOpen: boolean
  onClose: () => void
  driver?: Driver | null
  primaryColor?: string
}

const vehicleTypes: { value: VehicleType; label: string }[] = [
  { value: 'SCOOTER', label: 'Scooter' },
  { value: 'BIKE', label: 'Velo' },
  { value: 'CAR', label: 'Voiture' },
  { value: 'WALK', label: 'A pied' },
]

export function DriverFormModal({
  isOpen,
  onClose,
  driver,
  primaryColor = '#10b981',
}: DriverFormModalProps) {
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()
  const isEditing = !!driver

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    licenseNumber: '',
    vehicleType: 'SCOOTER' as VehicleType,
    vehiclePlate: '',
  })

  useEffect(() => {
    if (driver) {
      setFormData({
        email: driver.user.email,
        firstName: driver.user.firstName,
        lastName: driver.user.lastName,
        phone: driver.user.phone || '',
        licenseNumber: driver.licenseNumber || '',
        vehicleType: driver.vehicleType,
        vehiclePlate: driver.vehiclePlate || '',
      })
    } else {
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        licenseNumber: '',
        vehicleType: 'SCOOTER',
        vehiclePlate: '',
      })
    }
  }, [driver, isOpen])

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.createDriver({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        licenseNumber: data.licenseNumber || undefined,
        vehicleType: data.vehicleType,
        vehiclePlate: data.vehiclePlate || undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      toast.success('Livreur ajoute avec succes')
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la creation')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.updateDriver(driver!.id, {
        licenseNumber: data.licenseNumber || undefined,
        vehicleType: data.vehicleType,
        vehiclePlate: data.vehiclePlate || undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      toast.success('Livreur modifie avec succes')
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la modification')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.firstName || !formData.lastName) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    if (isEditing) {
      updateMutation.mutate(formData)
    } else {
      createMutation.mutate(formData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier le livreur' : 'Ajouter un livreur'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isEditing && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prenom *</Label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Jean"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Dupont"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jean.dupont@email.com"
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">Une invitation sera envoyee a cette adresse</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telephone</Label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+33 6 12 34 56 78"
                    className="pl-10"
                  />
                </div>
              </div>
            </>
          )}

          {isEditing && (
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-sm font-medium text-gray-900">
                {driver?.user.firstName} {driver?.user.lastName}
              </p>
              <p className="text-sm text-gray-500">{driver?.user.email}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="vehicleType">Type de vehicule</Label>
            <Select
              value={formData.vehicleType}
              onValueChange={(value) => setFormData({ ...formData, vehicleType: value as VehicleType })}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {vehicleTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehiclePlate">Plaque d'immatriculation</Label>
              <div className="relative">
                <Car size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  id="vehiclePlate"
                  value={formData.vehiclePlate}
                  onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
                  placeholder="AB-123-CD"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">N° de permis</Label>
              <div className="relative">
                <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  id="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  placeholder="123456789"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  {isEditing ? 'Modification...' : 'Creation...'}
                </>
              ) : (
                isEditing ? 'Modifier' : 'Ajouter'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
