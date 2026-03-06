'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { platformNavigation } from '@/config/platform-navigation'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'
import { ResellerHeader } from './_components/ResellerHeader'
import { ResellerTabs, type TabId } from './_components/ResellerTabs'
import { OverviewTab } from './_components/tabs/OverviewTab'
import { InfoTab } from './_components/tabs/InfoTab'
import { LicenseTab } from './_components/tabs/LicenseTab'
import { SitesTab } from './_components/tabs/SitesTab'
import { MembersTab } from './_components/tabs/MembersTab'
import { ClientsTab } from './_components/tabs/ClientsTab'
import { BillingTab } from './_components/tabs/BillingTab'
import { SettingsTab } from './_components/tabs/SettingsTab'
import { ActivityTab } from './_components/tabs/ActivityTab'
import type { ResellerDetails } from './_components/types'

const validTabs: TabId[] = ['overview', 'info', 'license', 'sites', 'members', 'clients', 'billing', 'settings', 'activity']

export default function PlatformResellerDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const resellerId = params.id as string
  
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
    router.push(`/platform/resellers/${resellerId}?tab=${tab}`, { scroll: false })
  }

  const { data: reseller, isLoading } = useQuery({
    queryKey: ['platform-reseller', resellerId],
    queryFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      const res = await apiClient.get<ResellerDetails>(`/platform/resellers/${resellerId}`)
      return res.data
    },
    enabled: !!accessToken && !!resellerId,
  })

  if (isLoading || !reseller) {
    return (
      <PageSkeleton
        navigation={platformNavigation}
        basePath="/platform"
        title="Revendeur"
        variant="detail"
      />
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab reseller={reseller} />
      case 'info':
        return <InfoTab reseller={reseller} />
      case 'license':
        return <LicenseTab reseller={reseller} />
      case 'sites':
        return <SitesTab reseller={reseller} />
      case 'members':
        return <MembersTab reseller={reseller} />
      case 'clients':
        return <ClientsTab reseller={reseller} />
      case 'billing':
        return <BillingTab reseller={reseller} />
      case 'settings':
        return <SettingsTab reseller={reseller} />
      case 'activity':
        return <ActivityTab reseller={reseller} />
      default:
        return <OverviewTab reseller={reseller} />
    }
  }

  return (
    <DashboardLayout
      navigation={platformNavigation}
      basePath="/platform"
    >
      <ResellerHeader reseller={reseller} />

      <div className="flex flex-col lg:flex-row gap-6">
        <ResellerTabs activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="flex-1 min-w-0">
          {renderTabContent()}
        </div>
      </div>
    </DashboardLayout>
  )
}
