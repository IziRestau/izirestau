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
  Link2,
  Search,
  BarChart3,
  Globe,
  Scale,
  Menu,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  GeneralSettings,
  PermalinksSettings,
  SeoSettings,
  ConversionSettings,
  DomainSettings,
  LegalSettings,
} from '@/components/restaurant/site-settings'

type SiteSettingsTab = 'general' | 'permalinks' | 'seo' | 'conversion' | 'domain' | 'legal'

const tabs: { id: SiteSettingsTab; label: string; icon: typeof Settings2; description: string }[] = [
  { id: 'general', label: 'Général', icon: Settings2, description: 'Pages et configuration' },
  { id: 'permalinks', label: 'Permaliens', icon: Link2, description: 'Structure des URLs' },
  { id: 'seo', label: 'SEO', icon: Search, description: 'Référencement' },
  { id: 'conversion', label: 'Conversion', icon: BarChart3, description: 'Pixels et tracking' },
  { id: 'domain', label: 'Domaine', icon: Globe, description: 'Nom de domaine' },
  { id: 'legal', label: 'Mentions légales', icon: Scale, description: 'CGV et confidentialité' },
]

export default function SiteSettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { accessToken } = useAuthStore()
  const { organization, restaurants, currentRestaurantId, switchRestaurant } = useRestaurantStore()
  const navigation = useRestaurantNavigation()

  const tabFromUrl = searchParams.get('tab') as SiteSettingsTab | null
  const [activeTab, setActiveTab] = useState<SiteSettingsTab>(tabFromUrl || 'general')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const primaryColor = organization?.primaryColor || '#10b981'

  useEffect(() => {
    if (tabFromUrl && tabs.some(t => t.id === tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  const handleTabChange = (tabId: SiteSettingsTab) => {
    setActiveTab(tabId)
    router.push(`/restaurant/site/settings?tab=${tabId}`, { scroll: false })
    setIsMobileMenuOpen(false)
  }

  const { data: settingsData, isLoading, refetch } = useQuery({
    queryKey: ['site-settings', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.site.settings.get()
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
        title="Réglages du site"
        variant="detail"
      />
    )
  }

  const renderTabContent = () => {
    if (!settingsData) return null

    switch (activeTab) {
      case 'general':
        return (
          <GeneralSettings
            homePageId={settingsData.general.homePageId}
            aboutPageId={settingsData.general.aboutPageId}
            language={settingsData.general.language}
            currency={settingsData.general.currency}
            pages={settingsData.pages}
            onUpdate={refetch}
            primaryColor={primaryColor}
          />
        )
      case 'permalinks':
        return (
          <PermalinksSettings
            pages={settingsData.pages}
            subdomain={settingsData.domain.subdomain}
            customDomain={settingsData.domain.customDomain}
            primaryColor={primaryColor}
          />
        )
      case 'seo':
        return (
          <SeoSettings
            metaTitle={settingsData.seo.metaTitle}
            metaDescription={settingsData.seo.metaDescription}
            metaKeywords={settingsData.seo.metaKeywords}
            favicon={settingsData.seo.favicon}
            ogImage={settingsData.seo.ogImage}
            subdomain={settingsData.domain.subdomain}
            onUpdate={refetch}
            primaryColor={primaryColor}
            restaurantId={currentRestaurantId || undefined}
          />
        )
      case 'conversion':
        return (
          <ConversionSettings
            facebookPixelId={settingsData.conversion.facebookPixelId}
            googleAnalyticsId={settingsData.conversion.googleAnalyticsId}
            googleTagManagerId={settingsData.conversion.googleTagManagerId}
            tiktokPixelId={settingsData.conversion.tiktokPixelId}
            snapPixelId={settingsData.conversion.snapPixelId}
            customHeadScript={settingsData.conversion.customHeadScript}
            onUpdate={refetch}
            primaryColor={primaryColor}
          />
        )
      case 'domain':
        return (
          <DomainSettings
            subdomain={settingsData.domain.subdomain}
            customDomain={settingsData.domain.customDomain}
            status={settingsData.domain.status}
            onUpdate={refetch}
            primaryColor={primaryColor}
          />
        )
      case 'legal':
        return (
          <LegalSettings
            termsUrl={settingsData.legal.termsUrl}
            privacyUrl={settingsData.legal.privacyUrl}
            legalNotice={settingsData.legal.legalNotice}
            onUpdate={refetch}
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
        title="Réglages du site"
        subtitle="Configurez les paramètres de votre site vitrine"
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
            <SheetContent side="bottom" className="h-[92vh] rounded-t-2xl flex flex-col">
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
