'use client'

import type { AccountPageProps } from '../_types'
import { AccountHeaderSection } from './sections/account/AccountHeaderSection'
import { AccountDashboardSection } from './sections/account/AccountDashboardSection'

export function AccountPage({
  restaurant,
  theme,
  settings,
  sections,
  subdomain,
  initialTab,
}: AccountPageProps) {
  return (
    <div style={{ backgroundColor: theme.backgroundColor }}>
      <AccountHeaderSection
        restaurant={restaurant}
        theme={theme}
        sectionData={sections?.header}
      />
      <AccountDashboardSection
        theme={theme}
        settings={settings}
        subdomain={subdomain}
        initialTab={initialTab}
        sectionData={sections?.dashboard}
      />
    </div>
  )
}
