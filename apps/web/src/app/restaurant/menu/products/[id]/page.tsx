'use client'

import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { useRestaurantNavigation } from '@/hooks/use-restaurant-navigation'
import { DashboardLayout } from '@/components/shared/dashboard'
import { ProductForm } from '../_components/ProductForm'

interface EditProductPageProps {
  params: { id: string }
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { accessToken } = useAuthStore()
  const { organization, restaurants, currentRestaurantId, switchRestaurant } = useRestaurantStore()
  const navigation = useRestaurantNavigation()
  const primaryColor = organization?.primaryColor || '#10b981'

  return (
    <DashboardLayout
      navigation={navigation}
      basePath="/restaurant"
      title="Modifier le produit"
      subtitle="Modifier les informations du produit"
      logoText={organization?.name || 'Restaurant'}
      primaryColor={primaryColor}
      restaurants={restaurants}
      currentRestaurantId={currentRestaurantId}
      onSwitchRestaurant={(id) => accessToken && switchRestaurant(accessToken, id)}
    >
      <ProductForm productId={params.id} primaryColor={primaryColor} />
    </DashboardLayout>
  )
}
