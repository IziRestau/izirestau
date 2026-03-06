'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { resellerNavigation, resellerPromoCard } from '@/config/reseller-navigation'
import { useQuery } from '@tanstack/react-query'
import { api, apiClient } from '@/lib/api-client'
import {
  Settings,
  User,
  Building2,
  Palette,
  CreditCard,
  Shield,
  CheckCircle,
  AlertCircle,
  Menu,
  X,
  ChevronRight,
  Bell,
  Globe,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProfileSettings } from '@/components/reseller/settings/ProfileSettings'
import { OrganizationSettings } from '@/components/reseller/settings/OrganizationSettings'
import { BrandingSettings } from '@/components/reseller/settings/BrandingSettings'
import { SecuritySettings } from '@/components/reseller/settings/SecuritySettings'
import { NotificationsSettings } from '@/components/reseller/settings/NotificationsSettings'
import { DomainSettings } from '@/components/reseller/settings/DomainSettings'
import { PaymentSettings } from '@/components/reseller/settings/PaymentSettings'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

type SettingsTab = 'profile' | 'organization' | 'branding' | 'payments' | 'notifications' | 'security' | 'domain'

const tabs: { id: SettingsTab; label: string; icon: typeof User; description: string }[] = [
  { id: 'profile', label: 'Mon Profil', icon: User, description: 'Informations personnelles' },
  { id: 'organization', label: 'Organisation', icon: Building2, description: 'Informations entreprise' },
  { id: 'branding', label: 'Branding', icon: Palette, description: 'Logo et couleurs' },
  { id: 'payments', label: 'Paiements', icon: CreditCard, description: 'Configuration Moneroo' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Preferences email' },
  { id: 'domain', label: 'Domaine', icon: Globe, description: 'Domaine personnalise' },
  { id: 'security', label: 'Securite', icon: Shield, description: 'Mot de passe et 2FA' },
]

export default function SettingsPage() {
  const router = useRouter()
  const { accessToken, user: authUser, setUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const { data: settings, isLoading, refetch } = useQuery({
    queryKey: ['reseller-settings'],
    queryFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      const res = await api.reseller.getSettings()
      return res.data
    },
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
  })

  const user = settings?.user

  useEffect(() => {
    if (user && authUser && user.avatar !== authUser.avatar) {
      setUser({
        ...authUser,
        avatar: user.avatar || undefined,
      })
    }
  }, [user, authUser, setUser])

  if (isLoading && !settings) {
    return (
      <PageSkeleton
        navigation={resellerNavigation}
        basePath="/reseller"
        title="Parametres"
        variant="detail"
      />
    )
  }

  const organization = settings?.organization
  const currentMember = settings?.currentMember
  const isOwnerOrAdmin = currentMember?.role === 'OWNER' || currentMember?.role === 'ADMIN'

  const renderTabContent = () => {
    if (!settings) return null

    switch (activeTab) {
      case 'profile':
        return <ProfileSettings user={settings.user} onUpdate={refetch} />
      case 'organization':
        return <OrganizationSettings organization={settings.organization} canEdit={isOwnerOrAdmin} onUpdate={refetch} />
      case 'branding':
        return <BrandingSettings organization={settings.organization} canEdit={isOwnerOrAdmin} onUpdate={refetch} />
      case 'payments':
        return <PaymentSettings onUpdate={refetch} />
      case 'notifications':
        return <NotificationsSettings onUpdate={refetch} />
      case 'security':
        return <SecuritySettings onUpdate={refetch} />
      case 'domain':
        return <DomainSettings onUpdate={refetch} />
      default:
        return null
    }
  }

  return (
    <DashboardLayout
      navigation={resellerNavigation}
      basePath="/reseller"
      promoCard={{
        ...resellerPromoCard,
        onButtonClick: () => router.push(resellerPromoCard.href),
      }}
    >
      <PageHeader
        title="Parametres"
        subtitle="Gerez votre compte et votre organisation"
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
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <span className="text-emerald-600 font-bold text-xl sm:text-2xl">
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
                <Building2 size={12} />
                {organization?.name}
              </span>
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
                currentMember?.role === 'OWNER' ? 'bg-amber-100 text-amber-700' :
                currentMember?.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              )}>
                {currentMember?.role === 'OWNER' ? 'Proprietaire' :
                 currentMember?.role === 'ADMIN' ? 'Administrateur' :
                 currentMember?.role === 'SALES' ? 'Commercial' : 'Membre'}
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

          {/* Logo Organization */}
          <div className="hidden lg:block flex-shrink-0">
            {organization?.logo ? (
              <img
                src={organization.logo}
                alt={organization.name}
                className="w-16 h-16 rounded-xl object-contain border border-gray-100"
              />
            ) : (
              <div 
                className="w-16 h-16 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: organization?.primaryColor || '#10b981' }}
              >
                <span className="text-white font-bold text-lg">
                  {organization?.name?.substring(0, 2).toUpperCase()}
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
                    const currentTab = tabs.find(t => t.id === activeTab)
                    const Icon = currentTab?.icon || Settings
                    return (
                      <>
                        <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center">
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
            <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-2xl">
              <SheetHeader className="pb-4">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  const isDisabled = (tab.id === 'payments' || tab.id === 'organization' || tab.id === 'branding') && !isOwnerOrAdmin

                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        if (!isDisabled) {
                          setActiveTab(tab.id)
                          setIsMobileMenuOpen(false)
                        }
                      }}
                      disabled={isDisabled}
                      className={cn(
                        "flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left transition-all w-full",
                        isActive
                          ? "bg-emerald-500 text-white"
                          : isDisabled
                          ? "text-gray-300 cursor-not-allowed bg-gray-50"
                          : "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={20} className="flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{tab.label}</p>
                          <p className={cn(
                            "text-xs",
                            isActive ? "text-emerald-100" : "text-gray-400"
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
          <div className="bg-white rounded-2xl border border-gray-100 p-2">
            <nav className="flex flex-col gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                const isDisabled = (tab.id === 'payments' || tab.id === 'organization' || tab.id === 'branding') && !isOwnerOrAdmin

                return (
                  <button
                    key={tab.id}
                    onClick={() => !isDisabled && setActiveTab(tab.id)}
                    disabled={isDisabled}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all w-full",
                      isActive
                        ? "bg-emerald-500 text-white"
                        : isDisabled
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{tab.label}</p>
                      <p className={cn(
                        "text-xs",
                        isActive ? "text-emerald-100" : "text-gray-400"
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
