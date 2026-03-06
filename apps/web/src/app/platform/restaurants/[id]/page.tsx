'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { platformNavigation } from '@/config/platform-navigation'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'
import { RestaurantHeader } from './_components/RestaurantHeader'
import { RestaurantTabs, type TabId } from './_components/RestaurantTabs'
import { OverviewTab } from './_components/tabs/OverviewTab'
import { InfoTab } from './_components/tabs/InfoTab'
import { MenuTab } from './_components/tabs/MenuTab'
import { OrdersTab } from './_components/tabs/OrdersTab'
import { CustomersTab } from './_components/tabs/CustomersTab'
import { StaffTab } from './_components/tabs/StaffTab'
import { SettingsTab } from './_components/tabs/SettingsTab'
import { ReviewsTab } from './_components/tabs/ReviewsTab'
import { AnalyticsTab } from './_components/tabs/AnalyticsTab'
import type { RestaurantDetails } from './_components/types'

const validTabs: TabId[] = ['overview', 'info', 'menu', 'orders', 'customers', 'staff', 'settings', 'reviews', 'analytics']

export default function PlatformRestaurantDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const restaurantId = params.id as string
  
  const tabFromUrl = searchParams.get('tab') as TabId | null
  const initialTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'overview'
  const [activeTab, setActiveTab] = useState<TabId>(initialTab)

  useEffect(() => {
    if (tabFromUrl && validTabs.includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab)
    router.push(`/platform/restaurants/${restaurantId}?tab=${tab}`, { scroll: false })
  }

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['platform-restaurant', restaurantId],
    queryFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      const res = await apiClient.get<RestaurantDetails>(`/platform/restaurants/${restaurantId}`)
      return res.data
    },
    enabled: !!accessToken && !!restaurantId,
  })

  if (isLoading || !restaurant) {
    return (
      <PageSkeleton
        navigation={platformNavigation}
        basePath="/platform"
        title="Restaurant"
        variant="detail"
      />
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab restaurant={restaurant} />
      case 'info':
        return <InfoTab restaurant={restaurant} />
      case 'menu':
        return <MenuTab restaurant={restaurant} />
      case 'orders':
        return <OrdersTab restaurant={restaurant} />
      case 'customers':
        return <CustomersTab restaurant={restaurant} />
      case 'staff':
        return <StaffTab restaurant={restaurant} />
      case 'settings':
        return <SettingsTab restaurant={restaurant} />
      case 'reviews':
        return <ReviewsTab restaurant={restaurant} />
      case 'analytics':
        return <AnalyticsTab restaurant={restaurant} />
      default:
        return <OverviewTab restaurant={restaurant} />
    }
  }

  return (
    <DashboardLayout
      navigation={platformNavigation}
      basePath="/platform"
    >
      <RestaurantHeader restaurant={restaurant} />

      <div className="flex flex-col lg:flex-row gap-6">
        <RestaurantTabs activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="flex-1 min-w-0">
          {renderTabContent()}
        </div>
      </div>
    </DashboardLayout>
  )
}
