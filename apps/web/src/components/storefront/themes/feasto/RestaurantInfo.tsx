'use client'

import type { RestaurantInfoProps } from '../_types'
import { MenuInfoSection } from './sections/menu/MenuInfoSection'

export function RestaurantInfo({ restaurant, theme, openingHours, delivery, sections }: RestaurantInfoProps) {
  return (
    <MenuInfoSection
      restaurant={restaurant}
      theme={theme}
      openingHours={openingHours}
      delivery={delivery}
      sectionData={sections?.info}
    />
  )
}
