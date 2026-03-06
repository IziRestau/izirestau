'use client'

import type { MenuSectionProps } from '../_types'
import { CatalogSection } from './sections/menu/CatalogSection'

export function MenuSection({ categories, theme, settings, onProductClick, sections }: MenuSectionProps) {
  return (
    <CatalogSection
      categories={categories}
      theme={theme}
      settings={settings}
      onProductClick={onProductClick}
      sectionData={sections?.catalog}
    />
  )
}
