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
import { useRestaurantPermissions } from '@/hooks/use-restaurant-permissions'
import { api, apiClient } from '@/lib/api-client'
import {
  Settings,
  User,
  Users,
  Store,
  Clock,
  ShoppingBag,
  CreditCard,
  Truck,
  Palette,
  Shield,
  CheckCircle,
  AlertCircle,
  Menu,
  ChevronRight,
  Receipt,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProfileSettings } from '@/components/restaurant/settings/ProfileSettings'
import { RestaurantInfoSettings } from '@/components/restaurant/settings/RestaurantInfoSettings'
import { OpeningHoursSettings } from '@/components/restaurant/settings/OpeningHoursSettings'
import { OrderSettings } from '@/components/restaurant/settings/OrderSettings'
import { PaymentSettings } from '@/components/restaurant/settings/PaymentSettings'
import { DeliverySettings } from '@/components/restaurant/settings/DeliverySettings'
import { ThemeSettings } from '@/components/restaurant/settings/ThemeSettings'
import { SecuritySettings } from '@/components/restaurant/settings/SecuritySettings'
import { TeamSettings } from '@/components/restaurant/settings/TeamSettings'
import { ReceiptSettings } from '@/components/restaurant/settings/ReceiptSettings'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { roleLabels, roleColors } from '@/hooks/use-restaurant-permissions'

type SettingsTab = 'profile' | 'restaurant' | 'hours' | 'orders' | 'payments' | 'delivery' | 'receipts' | 'theme' | 'team' | 'security'

const tabs: { id: SettingsTab; label: string; icon: typeof User; description: string; requiresOwnerOrManager?: boolean; requiresOwner?: boolean }[] = [
  { id: 'profile', label: 'Mon Profil', icon: User, description: 'Informations personnelles' },
  { id: 'restaurant', label: 'Restaurant', icon: Store, description: 'Infos du restaurant', requiresOwnerOrManager: true },
  { id: 'hours', label: 'Horaires', icon: Clock, description: 'Horaires d\'ouverture', requiresOwnerOrManager: true },
  { id: 'orders', label: 'Commandes', icon: ShoppingBag, description: 'Parametres commandes', requiresOwnerOrManager: true },
  { id: 'payments', label: 'Paiements', icon: CreditCard, description: 'Modes de paiement', requiresOwner: true },
  { id: 'delivery', label: 'Livraison', icon: Truck, description: 'Zones et frais', requiresOwnerOrManager: true },
  { id: 'receipts', label: 'Reçus', icon: Receipt, description: 'Tickets et factures', requiresOwnerOrManager: true },
  { id: 'theme', label: 'Apparence', icon: Palette, description: 'Thème et branding', requiresOwnerOrManager: true },
  { id: 'team', label: 'Equipe', icon: Users, description: 'Gestion du staff', requiresOwnerOrManager: true },
  { id: 'security', label: 'Securite', icon: Shield, description: 'Mot de passe' },
]

export default function RestaurantSettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { accessToken } = useAuthStore()
  const { organization, restaurants, currentRestaurantId, switchRestaurant } = useRestaurantStore()
  const navigation = useRestaurantNavigation()
  const { isOwner, isOwnerOrManager, isDriver, role } = useRestaurantPermissions()
  
  const tabFromUrl = searchParams.get('tab') as SettingsTab | null
  const [activeTab, setActiveTab] = useState<SettingsTab>(tabFromUrl || 'profile')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const primaryColor = organization?.primaryColor || '#10b981'

  useEffect(() => {
    if (tabFromUrl && tabs.some(t => t.id === tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  const handleTabChange = (tabId: SettingsTab) => {
    setActiveTab(tabId)
    router.push(`/restaurant/settings?tab=${tabId}`, { scroll: false })
    setIsMobileMenuOpen(false)
  }

  const { data: settings, isLoading, refetch } = useQuery({
    queryKey: ['restaurant-settings', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      const res = await api.restaurant.getSettings(currentRestaurantId || undefined)
      return res.data
    },
    enabled: !!accessToken && !!currentRestaurantId,
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading && !settings) {
    return (
      <PageSkeleton
        navigation={navigation}
        basePath="/restaurant"
        title="Parametres"
        variant="detail"
      />
    )
  }

  const user = settings?.user
  const restaurant = settings?.restaurant

  const isTabVisible = (tab: typeof tabs[0]) => {
    if (tab.requiresOwner && !isOwner) return false
    if (tab.requiresOwnerOrManager && !isOwnerOrManager) return false
    return true
  }

  // Filtrer les onglets visibles
  const visibleTabs = tabs.filter(isTabVisible)

  const renderTabContent = () => {
    if (!settings) return null
    const restaurantId = currentRestaurantId || settings.restaurant.id

    switch (activeTab) {
      case 'profile':
        return <ProfileSettings user={settings.user} onUpdate={refetch} primaryColor={primaryColor} restaurantId={restaurantId} />
      case 'restaurant':
        return <RestaurantInfoSettings restaurant={settings.restaurant} onUpdate={refetch} primaryColor={primaryColor} />
      case 'hours':
        return <OpeningHoursSettings openingHours={settings.openingHours} specialHours={settings.specialHours} restaurantId={restaurantId} onUpdate={refetch} primaryColor={primaryColor} />
      case 'orders':
        return <OrderSettings settings={settings.settings} restaurantId={restaurantId} onUpdate={refetch} primaryColor={primaryColor} />
      case 'payments':
        return <PaymentSettings settings={settings.settings} restaurantId={restaurantId} onUpdate={refetch} primaryColor={primaryColor} />
      case 'delivery':
        return <DeliverySettings deliverySettings={settings.deliverySettings} restaurant={settings.restaurant} restaurantId={restaurantId} onUpdate={refetch} primaryColor={primaryColor} />
      case 'receipts':
        return <ReceiptSettings receiptSettings={settings.receiptSettings} receiptTemplates={settings.receiptTemplates || []} restaurantId={restaurantId} onUpdate={refetch} primaryColor={primaryColor} />
      case 'theme':
        return <ThemeSettings theme={settings.theme} restaurantId={restaurantId} onUpdate={refetch} primaryColor={primaryColor} />
      case 'team':
        return <TeamSettings staffMembers={settings.staffMembers} currentStaff={settings.currentStaff} onUpdate={refetch} primaryColor={primaryColor} />
      case 'security':
        return <SecuritySettings onUpdate={refetch} primaryColor={primaryColor} />
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
        title="Paramètres"
        subtitle="Gérez votre compte et votre restaurant"
        icon={Settings}
      />

      {/* Summary Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover"
              />
            ) : (
              <div 
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                <span className="text-white font-bold text-xl sm:text-2xl">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
                <Store size={12} />
                {restaurant?.name}
              </span>
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
                roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-700'
              )}>
                {roleLabels[role as keyof typeof roleLabels] || role}
              </span>
              {user?.emailVerified ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-medium">
                  <CheckCircle size={12} />
                  Email verifie
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-medium">
                  <AlertCircle size={12} />
                  Email non verifie
                </span>
              )}
            </div>
          </div>

          {/* Logo Restaurant */}
          <div className="hidden lg:block flex-shrink-0">
            {restaurant?.logo ? (
              <img
                src={restaurant.logo}
                alt={restaurant.name}
                className="w-16 h-16 rounded-xl object-contain border border-gray-100"
              />
            ) : (
              <div 
                className="w-16 h-16 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                <span className="text-white font-bold text-lg">
                  {restaurant?.name?.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs + Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Mobile Tab Selector */}
        <div className="lg:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  {(() => {
                    const currentTab = visibleTabs.find(t => t.id === activeTab)
                    const Icon = currentTab?.icon || Settings
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
                {visibleTabs.map((tab) => {
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
              {visibleTabs.map((tab) => {
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
