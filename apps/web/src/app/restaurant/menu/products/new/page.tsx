'use client'

import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { useRestaurantNavigation } from '@/hooks/use-restaurant-navigation'
import { DashboardLayout } from '@/components/shared/dashboard'
import { ProductForm } from '../_components/ProductForm'

export default function NewProductPage() {
  const { accessToken } = useAuthStore()
  const { organization, restaurants, currentRestaurantId, switchRestaurant } = useRestaurantStore()
  const navigation = useRestaurantNavigation()
  const primaryColor = organization?.primaryColor || '#10b981'

  return (
    <DashboardLayout
      navigation={navigation}
      basePath="/restaurant"
      title="Nouveau produit"
      subtitle="Créer un nouveau produit"
      logoText={organization?.name || 'Restaurant'}
      primaryColor={primaryColor}
      restaurants={restaurants}
      currentRestaurantId={currentRestaurantId}
      onSwitchRestaurant={(id) => accessToken && switchRestaurant(accessToken, id)}
    >
      <ProductForm primaryColor={primaryColor} />
    </DashboardLayout>
  )
}
