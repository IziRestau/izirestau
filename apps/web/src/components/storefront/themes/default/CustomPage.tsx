'use client'

import type { CustomPageProps } from '../_types'
import { BannerCarousel } from './sections/home/BannerCarousel'
import { CustomHeaderSection } from './sections/custom/CustomHeaderSection'
import { CustomContentSection } from './sections/custom/CustomContentSection'
import { CustomImageTextSection } from './sections/custom/CustomImageTextSection'
import { CustomGallerySection } from './sections/custom/CustomGallerySection'
import { CustomCtaSection } from './sections/custom/CustomCtaSection'

const DEFAULT_ORDER = ['header', 'content', 'imageText', 'gallery', 'cta']

export function CustomPage({ page, restaurant, theme, banners, sections, sectionOrder }: CustomPageProps) {
  const heroBanners = banners.filter(b => b.position === 'hero')
  const betweenBanners = banners.filter(b => b.position === 'between')
  const bottomBanners = banners.filter(b => b.position === 'bottom')
  const order = sectionOrder && sectionOrder.length > 0 ? sectionOrder : DEFAULT_ORDER

  const renderSection = (sectionId: string) => {
    const data = sections?.[sectionId]

    switch (sectionId) {
      case 'header':
        return (
          <CustomHeaderSection
            key={sectionId}
            pageTitle={page.title}
            theme={theme}
            sectionData={data}
          />
        )
      case 'content':
        return (
          <CustomContentSection
            key={sectionId}
            pageContent={page.content}
            theme={theme}
            sectionData={data}
          />
        )
      case 'imageText':
        return (
          <CustomImageTextSection
            key={sectionId}
            theme={theme}
            sectionData={data}
          />
        )
      case 'gallery':
        return (
          <CustomGallerySection
            key={sectionId}
            theme={theme}
            restaurant={restaurant}
            sectionData={data}
          />
        )
      case 'cta':
        return (
          <CustomCtaSection
            key={sectionId}
            theme={theme}
            sectionData={data}
          />
        )
      default:
        return null
    }
  }

  return (
    <div>
      {heroBanners.length > 0 && (
        <BannerCarousel banners={banners} theme={theme} position="hero" />
      )}
      {order.map(renderSection)}
      {betweenBanners.length > 0 && (
        <BannerCarousel banners={banners} theme={theme} position="between" />
      )}
      {bottomBanners.length > 0 && (
        <BannerCarousel banners={banners} theme={theme} position="bottom" />
      )}
    </div>
  )
}
