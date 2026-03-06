'use client'

import type { HomePageProps } from '../_types'
import { BannerCarousel } from '../default/sections/home/BannerCarousel'
import { HeroSection } from './sections/home/HeroSection'
import { QualityFoodSection } from './sections/home/QualityFoodSection'
import { TwoColumnsSection } from './sections/home/TwoColumnsSection'
import { LatestMenuSection } from './sections/home/LatestMenuSection'
import { TestimonialsSection } from './sections/home/TestimonialsSection'
import { LocationsSection } from './sections/home/LocationsSection'
import { SocialGallerySection } from './sections/home/SocialGallerySection'
import { CtaSection } from './sections/home/CtaSection'

export function HomePage({
  restaurant,
  theme,
  openingHours,
  categories,
  settings,
  delivery,
  banners,
  menuHref,
  contactHref,
  onProductClick,
  sections,
}: HomePageProps) {
  const heroBanners = banners.filter(b => b.position === 'hero')
  const betweenBanners = banners.filter(b => b.position === 'between')
  const bottomBanners = banners.filter(b => b.position === 'bottom')

  return (
    <div>
      {heroBanners.length > 0 && (
        <BannerCarousel banners={banners} theme={theme} position="hero" />
      )}
      <HeroSection
        restaurant={restaurant}
        theme={theme}
        openingHours={openingHours}
        settings={settings}
        delivery={delivery}
        menuHref={menuHref}
        contactHref={contactHref}
        sectionData={sections?.hero}
      />
      <QualityFoodSection
        theme={theme}
        sectionData={sections?.qualityFood}
      />
      <TwoColumnsSection
        restaurant={restaurant}
        theme={theme}
        menuHref={menuHref}
        contactHref={contactHref}
        sectionData={sections?.twoColumns}
      />
      <LatestMenuSection
        theme={theme}
        categories={categories}
        settings={settings}
        menuHref={menuHref}
        onProductClick={onProductClick}
        sectionData={sections?.latestMenu}
      />
      <TestimonialsSection
        theme={theme}
        categories={categories}
        sectionData={sections?.testimonials}
      />
      <LocationsSection
        theme={theme}
        sectionData={sections?.locations}
        restaurant={restaurant}
        openingHours={openingHours}
      />
      {betweenBanners.length > 0 && (
        <BannerCarousel banners={banners} theme={theme} position="between" />
      )}
      <SocialGallerySection
        theme={theme}
        sectionData={sections?.socialGallery}
      />
      <CtaSection
        theme={theme}
        menuHref={menuHref}
        contactHref={contactHref}
        sectionData={sections?.cta}
      />
      {bottomBanners.length > 0 && (
        <BannerCarousel banners={banners} theme={theme} position="bottom" />
      )}
    </div>
  )
}
