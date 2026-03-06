'use client'

import type { HeroProps } from '../_types'
import { MenuHeroSection } from './sections/menu/MenuHeroSection'

export function Hero({ restaurant, theme, openingHours, settings, delivery, menuHref = '#menu', sections }: HeroProps) {
  return (
    <MenuHeroSection
      restaurant={restaurant}
      theme={theme}
      openingHours={openingHours}
      settings={settings}
      delivery={delivery}
      menuHref={menuHref}
      sectionData={sections?.hero}
    />
  )
}
