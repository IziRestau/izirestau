'use client'

import { useMemo } from 'react'
import type { TrackPageProps } from '../_types'
import { TrackHeaderSection } from './sections/track/TrackHeaderSection'
import { TrackProgressSection } from './sections/track/TrackProgressSection'
import { TrackInfoSection } from './sections/track/TrackInfoSection'
import { TrackOrderDetailsSection } from './sections/track/TrackOrderDetailsSection'
import { TrackRestaurantSection } from './sections/track/TrackRestaurantSection'
import { TrackActionsSection } from './sections/track/TrackActionsSection'

export function TrackPage({
  restaurant,
  theme,
  settings,
  sections,
  subdomain,
  order,
  onRefresh,
  isRefreshing,
  dataUpdatedAt,
  onMarkPickedUp,
}: TrackPageProps) {
  const lastUpdated = useMemo(() => {
    if (!dataUpdatedAt) return null
    return new Date(dataUpdatedAt)
  }, [dataUpdatedAt])

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.backgroundColor }}>
      <TrackHeaderSection
        theme={theme}
        restaurant={restaurant}
        subdomain={subdomain}
        order={order}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        sectionData={sections?.header}
      />

      <TrackProgressSection
        theme={theme}
        order={order}
        lastUpdated={lastUpdated}
        sectionData={sections?.progress}
      />

      <TrackInfoSection
        theme={theme}
        settings={settings}
        order={order}
        sectionData={sections?.info}
      />

      <TrackOrderDetailsSection
        theme={theme}
        settings={settings}
        order={order}
        sectionData={sections?.details}
      />

      <TrackRestaurantSection
        theme={theme}
        restaurant={restaurant}
        sectionData={sections?.restaurant}
      />

      <TrackActionsSection
        theme={theme}
        subdomain={subdomain}
        order={order}
        onMarkPickedUp={onMarkPickedUp}
        sectionData={sections?.actions}
      />
    </div>
  )
}
