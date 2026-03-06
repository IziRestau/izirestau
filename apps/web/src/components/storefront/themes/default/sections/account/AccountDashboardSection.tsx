'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { User, MapPin, ShoppingBag, LogOut, Gift } from 'lucide-react'
import Link from 'next/link'
import type { StoreThemeData, StoreSettingsData } from '../../../_types'
import { useStorefrontAuthStore } from '@/stores/storefront-auth.store'
import { AccountProfileTab } from './AccountProfileTab'
import { AccountOrdersTab } from './AccountOrdersTab'
import { AccountAddressesTab } from './AccountAddressesTab'
import { AccountLoyaltyTab } from './AccountLoyaltyTab'

interface AccountDashboardSectionProps {
  theme: StoreThemeData
  settings: StoreSettingsData
  subdomain: string
  initialTab?: string
  sectionData?: Record<string, unknown>
}

type TabId = 'profile' | 'orders' | 'addresses' | 'loyalty'

interface TabConfig {
  id: TabId
  label: string
  icon: typeof User
  visible: boolean
}

export function AccountDashboardSection({
  theme,
  settings,
  subdomain,
  initialTab,
  sectionData,
}: AccountDashboardSectionProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { customer, logout } = useStorefrontAuthStore()

  const s = <T,>(key: string, fallback: T): T => (sectionData?.[key] as T) ?? fallback

  const showProfileTab = s('showProfileTab', true)
  const showOrdersTab = s('showOrdersTab', true)
  const showAddressesTab = s('showAddressesTab', true)
  const showLoyaltyTab = s('showLoyaltyTab', true)
  const profileTabLabel = s('profileTabLabel', 'Mon profil')
  const ordersTabLabel = s('ordersTabLabel', 'Mes commandes')
  const addressesTabLabel = s('addressesTabLabel', 'Mes adresses')
  const loyaltyTabLabel = s('loyaltyTabLabel', 'Fidélité')
  const configDefaultTab = s('defaultTab', 'profile') as TabId
  const showAvatar = s('showAvatar', true)
  const showLogoutBtn = s('showLogoutBtn', true)
  const sidebarPosition = s('sidebarPosition', 'left') as 'left' | 'right' | 'top'
  const showLoyaltyPoints = s('showLoyaltyPoints', true)
  const showChangePassword = s('showChangePassword', true)
  const ordersPerPage = s('ordersPerPage', 10)
  const showOrderDetails = s('showOrderDetails', true)
  const maxAddresses = s('maxAddresses', 5)

  const allTabs: TabConfig[] = [
    { id: 'profile', label: profileTabLabel, icon: User, visible: showProfileTab },
    { id: 'orders', label: ordersTabLabel, icon: ShoppingBag, visible: showOrdersTab },
    { id: 'addresses', label: addressesTabLabel, icon: MapPin, visible: showAddressesTab },
    { id: 'loyalty', label: loyaltyTabLabel, icon: Gift, visible: showLoyaltyTab },
  ]

  const visibleTabs = allTabs.filter(t => t.visible)
  const validTabIds = visibleTabs.map(t => t.id)

  const urlTab = searchParams.get('tab') as TabId | null
  const resolvedDefault = validTabIds.includes(urlTab as TabId) ? urlTab! :
                          validTabIds.includes(initialTab as TabId) ? (initialTab as TabId) :
                          validTabIds.includes(configDefaultTab) ? configDefaultTab :
                          validTabIds[0] || 'profile'

  const [activeTab, setActiveTab] = useState<TabId>(resolvedDefault)

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId)
    router.push(`/store/${subdomain}/account?tab=${tabId}`, { scroll: false })
  }

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  const handleLogout = () => {
    logout()
    window.location.href = `/store/${subdomain}`
  }

  if (!customer) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
        <p style={{ color: theme.textColor }}>Veuillez vous connecter pour accéder à votre compte.</p>
        <Link
          href={`/store/${subdomain}/login`}
          className={`inline-block mt-4 px-6 py-3 font-semibold text-white ${btnClass}`}
          style={{ backgroundColor: theme.primaryColor }}
        >
          Se connecter
        </Link>
      </div>
    )
  }

  const currentTabLabel = visibleTabs.find(t => t.id === activeTab)?.label || ''

  const renderSidebar = () => (
    <div 
      className={`rounded-2xl border p-4 sm:p-5 ${sidebarPosition === 'top' ? '' : 'sticky top-24'}`}
      style={{ borderColor: `${theme.textColor}10` }}
    >
      {showAvatar && (
        <div className={`flex items-center gap-3 ${sidebarPosition === 'top' ? 'mb-4' : 'mb-6 pb-4 border-b'}`} style={{ borderColor: `${theme.textColor}10` }}>
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0"
            style={{ backgroundColor: theme.primaryColor }}
          >
            {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate" style={{ color: theme.textColor }}>
              {customer.firstName} {customer.lastName}
            </p>
            <p className="text-xs opacity-60 truncate" style={{ color: theme.textColor }}>
              {customer.email}
            </p>
          </div>
        </div>
      )}

      <nav className={sidebarPosition === 'top' ? 'flex flex-wrap gap-2' : 'space-y-1'}>
        {visibleTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-3 ${sidebarPosition === 'top' ? 'px-4 py-2' : 'w-full px-4 py-3'} text-sm font-medium transition-colors ${btnClass}`}
              style={{
                backgroundColor: isActive ? `${theme.primaryColor}15` : 'transparent',
                color: isActive ? theme.primaryColor : theme.textColor,
              }}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          )
        })}
      </nav>

      {showLogoutBtn && sidebarPosition !== 'top' && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: `${theme.textColor}10` }}>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 ${btnClass}`}
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      )}
    </div>
  )

  const renderContent = () => (
    <div className={sidebarPosition === 'top' ? '' : 'lg:col-span-3'}>
      <div className="flex items-center justify-between mb-6">
        <h2 
          className="text-xl sm:text-2xl font-bold"
          style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
        >
          {currentTabLabel}
        </h2>
        {showLogoutBtn && sidebarPosition === 'top' && (
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 ${btnClass}`}
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        )}
      </div>

      {activeTab === 'profile' && (
        <AccountProfileTab 
          theme={theme} 
          settings={settings} 
          subdomain={subdomain}
          showLoyaltyPoints={showLoyaltyPoints}
          showChangePassword={showChangePassword}
        />
      )}
      {activeTab === 'orders' && (
        <AccountOrdersTab 
          theme={theme} 
          settings={settings} 
          subdomain={subdomain}
          ordersPerPage={ordersPerPage}
          showOrderDetails={showOrderDetails}
        />
      )}
      {activeTab === 'addresses' && (
        <AccountAddressesTab 
          theme={theme} 
          settings={settings} 
          subdomain={subdomain}
          maxAddresses={maxAddresses}
        />
      )}
      {activeTab === 'loyalty' && (
        <AccountLoyaltyTab 
          theme={theme} 
          settings={settings} 
          subdomain={subdomain}
        />
      )}
    </div>
  )

  if (sidebarPosition === 'top') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="space-y-6">
          {renderSidebar()}
          {renderContent()}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        {sidebarPosition === 'left' && (
          <div className="lg:col-span-1">{renderSidebar()}</div>
        )}
        {renderContent()}
        {sidebarPosition === 'right' && (
          <div className="lg:col-span-1">{renderSidebar()}</div>
        )}
      </div>
    </div>
  )
}
