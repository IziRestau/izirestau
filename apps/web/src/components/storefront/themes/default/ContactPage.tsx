'use client'

import type { ContactPageProps } from '../_types'
import { BannerCarousel } from './sections/home/BannerCarousel'
import { ContactHeaderSection } from './sections/contact/ContactHeaderSection'
import { ContactInfoSection } from './sections/contact/ContactInfoSection'
import { ContactFormSection } from './sections/contact/ContactFormSection'
import { ContactMapSection } from './sections/contact/ContactMapSection'

export function ContactPage({
  restaurant,
  theme,
  openingHours,
  delivery,
  banners,
  subdomain,
  sections,
}: ContactPageProps) {
  const heroBanners = banners.filter(b => b.position === 'hero')
  const betweenBanners = banners.filter(b => b.position === 'between')
  const bottomBanners = banners.filter(b => b.position === 'bottom')
  const mapPosition = (sections?.map?.position as string) || 'bottom'

  return (
    <div style={{ backgroundColor: theme.backgroundColor }}>
      {heroBanners.length > 0 && (
        <BannerCarousel banners={banners} theme={theme} position="hero" />
      )}
      <ContactHeaderSection
        restaurant={restaurant}
        theme={theme}
        sectionData={sections?.header}
      />

      {mapPosition === 'top' && (
        <ContactMapSection
          restaurant={restaurant}
          theme={theme}
          sectionData={sections?.map}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            <ContactInfoSection
              restaurant={restaurant}
              theme={theme}
              openingHours={openingHours}
              delivery={delivery}
              sectionData={sections?.contactInfo}
            />
          </div>
          <div className="lg:col-span-3">
            <ContactFormSection
              theme={theme}
              subdomain={subdomain}
              sectionData={sections?.form}
            />
          </div>
        </div>
      </div>

      {mapPosition === 'bottom' && (
        <ContactMapSection
          restaurant={restaurant}
          theme={theme}
          sectionData={sections?.map}
        />
      )}
      {betweenBanners.length > 0 && (
        <BannerCarousel banners={banners} theme={theme} position="between" />
      )}
      {bottomBanners.length > 0 && (
        <BannerCarousel banners={banners} theme={theme} position="bottom" />
      )}
    </div>
  )
}
