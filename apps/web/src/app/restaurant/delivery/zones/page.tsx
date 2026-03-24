'use client'

import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { useRestaurantNavigation } from '@/hooks/use-restaurant-navigation'
import { DashboardLayout } from '@/components/shared/dashboard'
import { DeliveryZonesManager } from '@/components/restaurant/delivery/DeliveryZonesManager'
import { MapPin } from 'lucide-react'

export default function DeliveryZonesPage() {
  const { accessToken } = useAuthStore()
  const { organization, restaurants, currentRestaurantId, switchRestaurant } = useRestaurantStore()
  const navigation = useRestaurantNavigation()
  
  const primaryColor = organization?.primaryColor || '#10b981'

  const handleSwitchRestaurant = (restaurantId: string) => {
    if (accessToken) {
      switchRestaurant(accessToken, restaurantId)
    }
  }

  return (
    <DashboardLayout
      navigation={navigation}
      basePath="/restaurant"
      logoText={organization?.name}
      primaryColor={primaryColor}
      restaurants={restaurants}
      currentRestaurantId={currentRestaurantId}
      onSwitchRestaurant={handleSwitchRestaurant}
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <MapPin size={24} style={{ color: primaryColor }} />
        </div>
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">Zones de livraison</h1>
          <p className="text-sm text-gray-500">
            Definissez vos zones de livraison et leurs tarifs
          </p>
        </div>
      </div>

      {/* Zones Manager */}
      <div className="bg-white rounded-2xl p-6">
        <DeliveryZonesManager
          restaurantId={currentRestaurantId || ''}
          primaryColor={primaryColor}
        />
      </div>
    </DashboardLayout>
  )
}
