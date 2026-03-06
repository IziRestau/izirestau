'use client'

import type { MenuSectionProps } from '../_types'
import { CatalogSection } from './sections/menu/CatalogSection'
import { LocationsSection } from './sections/home/LocationsSection'

export function MenuSection({ categories, theme, settings, onProductClick, sections, restaurant, openingHours }: MenuSectionProps) {
  return (
    <>
      <CatalogSection
        categories={categories}
        theme={theme}
        settings={settings}
        onProductClick={onProductClick}
        sectionData={sections?.catalog}
      />
      <LocationsSection
        theme={theme}
        sectionData={sections?.locations}
        restaurant={restaurant}
        openingHours={openingHours}
      />
    </>
  )
}
