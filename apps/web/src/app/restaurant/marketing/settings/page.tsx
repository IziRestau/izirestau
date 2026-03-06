'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { useRestaurantNavigation } from '@/hooks/use-restaurant-navigation'
import { api, apiClient } from '@/lib/api-client'
import {
  Settings2,
  Heart,
  Bell,
  BarChart3,
  Menu,
  ChevronRight,
  Mail,
  Tag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  GeneralMarketingSettings,
  LoyaltySettings,
  NotificationSettings,
  EmailTemplatesSettings,
  TagRulesSettings,
} from '@/components/restaurant/marketing/settings'

type MarketingSettingsTab = 'general' | 'loyalty' | 'notifications' | 'email-templates' | 'tag-rules'

const tabs: { id: MarketingSettingsTab; label: string; icon: typeof Settings2; description: string }[] = [
  { id: 'general', label: 'Général', icon: Settings2, description: 'Configuration globale' },
  { id: 'loyalty', label: 'Fidélité', icon: Heart, description: 'Programme de points' },
  { id: 'tag-rules', label: 'Règles de tags', icon: Tag, description: 'Attribution automatique' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Alertes et emails' },
  { id: 'email-templates', label: 'Templates email', icon: Mail, description: 'Personnalisation des emails' },
]

export default function MarketingSettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { accessToken } = useAuthStore()
  const { organization, restaurants, currentRestaurantId, switchRestaurant } = useRestaurantStore()
  const navigation = useRestaurantNavigation()

  const tabFromUrl = searchParams.get('tab') as MarketingSettingsTab | null
  const [activeTab, setActiveTab] = useState<MarketingSettingsTab>(tabFromUrl || 'general')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const primaryColor = organization?.primaryColor || '#10b981'

  useEffect(() => {
    if (tabFromUrl && tabs.some(t => t.id === tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  const handleTabChange = (tabId: MarketingSettingsTab) => {
    setActiveTab(tabId)
    router.push(`/restaurant/marketing/settings?tab=${tabId}`, { scroll: false })
    setIsMobileMenuOpen(false)
  }

  const { data: settingsData, isLoading, refetch } = useQuery({
    queryKey: ['marketing-settings', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.getSettings(currentRestaurantId || undefined)
      return res.data
    },
    enabled: !!accessToken && !!currentRestaurantId,
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading && !settingsData) {
    return (
      <PageSkeleton
        navigation={navigation}
        basePath="/restaurant"
        title="Réglages Marketing"
        variant="detail"
      />
    )
  }

  const renderTabContent = () => {
    if (!settingsData) return null

    switch (activeTab) {
      case 'general':
        return (
          <GeneralMarketingSettings
            onUpdate={refetch}
            primaryColor={primaryColor}
          />
        )
      case 'loyalty':
        return (
          <LoyaltySettings
            onUpdate={refetch}
            primaryColor={primaryColor}
          />
        )
      case 'notifications':
        return (
          <NotificationSettings
            settings={settingsData.settings}
            onUpdate={refetch}
            primaryColor={primaryColor}
          />
        )
      case 'email-templates':
        return (
          <EmailTemplatesSettings
            primaryColor={primaryColor}
          />
        )
      case 'tag-rules':
        return (
          <TagRulesSettings
            primaryColor={primaryColor}
          />
        )
      default:
        return null
    }
  }

  return (
    <DashboardLayout
      navigation={navigation}
      basePath="/restaurant"
      logoText={organization?.name || 'Restaurant'}
      primaryColor={primaryColor}
      restaurants={restaurants}
      currentRestaurantId={currentRestaurantId}
      onSwitchRestaurant={(id) => accessToken && switchRestaurant(accessToken, id)}
    >
      <PageHeader
        title="Réglages Marketing"
        subtitle="Configurez vos paramètres marketing"
        icon={Settings2}
      />

      {/* Tabs + Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Mobile Tab Selector */}
        <div className="lg:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  {(() => {
                    const currentTab = tabs.find(t => t.id === activeTab)
                    const Icon = currentTab?.icon || Settings2
                    return (
                      <>
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Icon size={18} className="text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{currentTab?.label}</p>
                          <p className="text-xs text-gray-500">{currentTab?.description}</p>
                        </div>
                      </>
                    )
                  })()}
                </div>
                <Menu size={18} className="text-gray-400" />
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[60vh] rounded-t-2xl flex flex-col">
              <SheetHeader className="pb-4 flex-shrink-0">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 overflow-y-auto flex-1 pb-safe scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id

                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        "flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left transition-all w-full",
                        isActive
                          ? "text-white"
                          : "text-gray-600 hover:bg-gray-50"
                      )}
                      style={isActive ? { backgroundColor: primaryColor } : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={20} className="flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{tab.label}</p>
                          <p className={cn(
                            "text-xs",
                            isActive ? "opacity-80" : "text-gray-400"
                          )}>
                            {tab.description}
                          </p>
                        </div>
                      </div>
                      {isActive && <ChevronRight size={16} />}
                    </button>
                  )
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Sidebar Tabs */}
        <div className="hidden lg:block lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-2 sticky top-24">
            <nav className="flex flex-col gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all w-full",
                      isActive
                        ? "text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    )}
                    style={isActive ? { backgroundColor: primaryColor } : undefined}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{tab.label}</p>
                      <p className={cn(
                        "text-xs",
                        isActive ? "opacity-80" : "text-gray-400"
                      )}>
                        {tab.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
