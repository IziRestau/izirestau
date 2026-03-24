'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, User, Bike, Car, Footprints, Star, MapPin } from 'lucide-react'
import { api, apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'

type VehicleType = 'BIKE' | 'SCOOTER' | 'CAR' | 'WALK'

interface Driver {
  id: string
  user: {
    id: string
    firstName: string
    lastName: string
    phone: string | null
    avatar: string | null
  }
  vehicleType: VehicleType
  isActive: boolean
  isOnline: boolean
  isAvailable: boolean
  currentLatitude: number | null
  currentLongitude: number | null
  totalDeliveries: number
  avgRating: number | null
}

interface Delivery {
  id: string
  orderId: string
  order: {
    orderNumber: string
  }
}

interface AssignDriverModalProps {
  isOpen: boolean
  onClose: () => void
  delivery: Delivery | null
  orderId?: string
  onSuccess: () => void
  primaryColor?: string
}

const vehicleTypeIcons: Record<VehicleType, typeof Bike> = {
  BIKE: Bike,
  SCOOTER: Bike,
  CAR: Car,
  WALK: Footprints,
}

export function AssignDriverModal({
  isOpen,
  onClose,
  delivery,
  orderId,
  onSuccess,
  primaryColor = '#10b981',
}: AssignDriverModalProps) {
  const { accessToken } = useAuthStore()
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null)
  const [createdDeliveryId, setCreatedDeliveryId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['drivers-for-assign'],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.getDrivers()
    },
    enabled: isOpen && !!accessToken,
  })

  // Mutation pour créer une livraison si elle n'existe pas
  const createDeliveryMutation = useMutation({
    mutationFn: async (orderIdToCreate: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return apiClient.post(`/restaurant/orders/${orderIdToCreate}/create-delivery`, {})
    },
    onSuccess: (result) => {
      const newDeliveryId = (result as { data?: { id?: string } })?.data?.id
      if (newDeliveryId) {
        setCreatedDeliveryId(newDeliveryId)
      }
    },
    onError: () => {
      toast.error('Erreur lors de la création de la livraison')
    },
  })

  const assignMutation = useMutation({
    mutationFn: async (driverId: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const deliveryId = delivery?.id || createdDeliveryId
      if (!deliveryId) {
        throw new Error('Pas de livraison')
      }
      return apiClient.post(`/restaurant/deliveries/${deliveryId}/assign`, { driverId })
    },
    onSuccess: () => {
      toast.success('Livreur assigne avec succes')
      setSelectedDriverId(null)
      setCreatedDeliveryId(null)
      onSuccess()
    },
    onError: () => {
      toast.error('Erreur lors de l\'assignation')
    },
  })

  const allDrivers: Driver[] = (data?.data || []) as Driver[]
  const drivers = allDrivers.filter(d => d.isActive)

  const handleAssign = async () => {
    if (!selectedDriverId) return

    // Si pas de livraison, la créer d'abord
    if (!delivery?.id && !createdDeliveryId && orderId) {
      try {
        if (accessToken) apiClient.setAccessToken(accessToken)
        const result = await apiClient.post(`/restaurant/orders/${orderId}/create-delivery`, {})
        const newDeliveryId = (result as { data?: { id?: string } })?.data?.id
        if (newDeliveryId) {
          setCreatedDeliveryId(newDeliveryId)
          // Assigner directement après création
          await apiClient.post(`/restaurant/deliveries/${newDeliveryId}/assign`, { driverId: selectedDriverId })
          toast.success('Livreur assigne avec succes')
          setSelectedDriverId(null)
          setCreatedDeliveryId(null)
          onSuccess()
        }
      } catch {
        toast.error('Erreur lors de l\'assignation')
      }
      return
    }

    // Si livraison existe, assigner directement
    if (delivery?.id || createdDeliveryId) {
      assignMutation.mutate(selectedDriverId)
    }
  }

  const handleClose = () => {
    setSelectedDriverId(null)
    setCreatedDeliveryId(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Assigner un livreur
            {delivery && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                Commande #{delivery.order.orderNumber}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : drivers.length === 0 ? (
            <div className="text-center py-8">
              <User className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <p className="text-gray-500">Aucun livreur actif</p>
              <p className="text-sm text-gray-400 mt-1">
                Ajoutez des livreurs dans la section Livreurs
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {drivers.map((driver) => {
                const VehicleIcon = vehicleTypeIcons[driver.vehicleType]
                const isSelected = selectedDriverId === driver.id
                
                return (
                  <button
                    key={driver.id}
                    onClick={() => setSelectedDriverId(driver.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      isSelected 
                        ? 'border-current bg-opacity-10' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={isSelected ? { borderColor: primaryColor, backgroundColor: `${primaryColor}10` } : {}}
                  >
                    <div className="relative">
                      {driver.user.avatar ? (
                        <img 
                          src={driver.user.avatar} 
                          alt={driver.user.firstName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {driver.user.firstName[0]}{driver.user.lastName[0]}
                        </div>
                      )}
                      {driver.isOnline && (
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full ${driver.isAvailable ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">
                        {driver.user.firstName} {driver.user.lastName}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <VehicleIcon size={12} />
                          {driver.totalDeliveries} livraisons
                        </span>
                        {!driver.isOnline && (
                          <span className="text-gray-400">Hors ligne</span>
                        )}
                        {driver.isOnline && !driver.isAvailable && (
                          <span className="text-amber-600">En course</span>
                        )}
                        {driver.avgRating && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <Star size={12} fill="currentColor" />
                            {driver.avgRating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-current' : 'border-gray-300'
                    }`}
                    style={isSelected ? { borderColor: primaryColor } : {}}
                    >
                      {isSelected && (
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: primaryColor }}
                        />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="flex-1"
              disabled={assignMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedDriverId || assignMutation.isPending}
              className="flex-1 text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {assignMutation.isPending ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Assignation...
                </>
              ) : (
                'Assigner'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
