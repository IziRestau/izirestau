'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShoppingBag, User, MapPin, Gift } from 'lucide-react'
import type { StoreThemeData, StoreSettingsData } from '../../../_types'
import { AccountOrdersTab } from './AccountOrdersTab'
import { AccountProfileTab } from './AccountProfileTab'
import { AccountAddressesTab } from './AccountAddressesTab'
import { AccountLoyaltyTab } from './AccountLoyaltyTab'

interface AccountDashboardSectionProps {
  theme: StoreThemeData
  settings: StoreSettingsData
  subdomain: string
  initialTab?: string
  sectionData?: Record<string, unknown>
}

export function AccountDashboardSection({
  theme,
  settings,
  subdomain,
  initialTab,
  sectionData,
}: AccountDashboardSectionProps) {
  const searchParams = useSearchParams()
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const showOrdersTab = s('showOrdersTab', true) !== false
  const showProfileTab = s('showProfileTab', true) !== false
  const showAddressesTab = s('showAddressesTab', true) !== false
  const showLoyaltyTab = s('showLoyaltyTab', true) !== false
  const ordersTabLabel = (s('ordersTabLabel', 'Commandes') as string)
  const profileTabLabel = (s('profileTabLabel', 'Profil') as string)
  const addressesTabLabel = (s('addressesTabLabel', 'Adresses') as string)
  const loyaltyTabLabel = (s('loyaltyTabLabel', 'Fidélité') as string)

  const tabs = [
    ...(showOrdersTab ? [{ id: 'orders', label: ordersTabLabel, icon: ShoppingBag }] : []),
    ...(showProfileTab ? [{ id: 'profile', label: profileTabLabel, icon: User }] : []),
    ...(showAddressesTab ? [{ id: 'addresses', label: addressesTabLabel, icon: MapPin }] : []),
    ...(showLoyaltyTab ? [{ id: 'loyalty', label: loyaltyTabLabel, icon: Gift }] : []),
  ]

  const activeTab = searchParams.get('tab') || initialTab || tabs[0]?.id || 'orders'

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  return (
    <section className="pb-12 sm:pb-16" style={{ backgroundColor: theme.backgroundColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tabs - Navigation par liens */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const TabIcon = tab.icon
            return (
              <Link
                key={tab.id}
                href={`/store/${subdomain}/account?tab=${tab.id}`}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all ${btnClass} border`}
                style={{
                  backgroundColor: isActive ? theme.primaryColor : theme.backgroundColor,
                  color: isActive ? 'white' : theme.textColor,
                  borderColor: isActive ? theme.primaryColor : `${theme.textColor}25`,
                }}
              >
                <TabIcon size={16} />
                {tab.label}
              </Link>
            )
          })}
        </div>

        {/* Content */}
        <div>
          {activeTab === 'orders' && showOrdersTab && (
            <AccountOrdersTab
              theme={theme}
              settings={settings}
              subdomain={subdomain}
            />
          )}
          {activeTab === 'profile' && showProfileTab && (
            <AccountProfileTab
              theme={theme}
              subdomain={subdomain}
            />
          )}
          {activeTab === 'addresses' && showAddressesTab && (
            <AccountAddressesTab
              theme={theme}
              subdomain={subdomain}
            />
          )}
          {activeTab === 'loyalty' && showLoyaltyTab && (
            <AccountLoyaltyTab
              theme={theme}
              settings={settings}
              subdomain={subdomain}
            />
          )}
        </div>
      </div>
    </section>
  )
}
