'use client'

import type { HomePageProps } from '../_types'
import { BannerCarousel } from './sections/home/BannerCarousel'
import { HeroSection } from './sections/home/HeroSection'
import { TwoColumnsSection } from './sections/home/TwoColumnsSection'
import { StatsSection } from './sections/home/StatsSection'
import { FeaturedSection } from './sections/home/FeaturedSection'
import { AboutSection } from './sections/home/AboutSection'
import { GallerySection } from './sections/home/GallerySection'
import { TestimonialsSection } from './sections/home/TestimonialsSection'
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
      <TwoColumnsSection
        restaurant={restaurant}
        theme={theme}
        menuHref={menuHref}
        contactHref={contactHref}
        sectionData={sections?.twoColumns}
      />
      <StatsSection
        restaurant={restaurant}
        theme={theme}
        categories={categories}
        sectionData={sections?.stats}
      />
      <FeaturedSection
        theme={theme}
        categories={categories}
        settings={settings}
        menuHref={menuHref}
        onProductClick={onProductClick}
        sectionData={sections?.featured}
      />
      {betweenBanners.length > 0 && (
        <BannerCarousel banners={banners} theme={theme} position="between" />
      )}
      <AboutSection
        restaurant={restaurant}
        theme={theme}
        openingHours={openingHours}
        delivery={delivery}
        settings={settings}
        sectionData={sections?.about}
      />
      <GallerySection
        restaurant={restaurant}
        theme={theme}
        sectionData={sections?.gallery}
      />
      <TestimonialsSection
        theme={theme}
        sectionData={sections?.testimonials}
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
