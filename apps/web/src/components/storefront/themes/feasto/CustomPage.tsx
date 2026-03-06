'use client'

import type { CustomPageProps } from '../_types'
import { BannerCarousel } from '../default/sections/home/BannerCarousel'
import { CustomHeaderSection } from './sections/custom/CustomHeaderSection'
import { CustomContentSection } from './sections/custom/CustomContentSection'
import { CustomImageTextSection } from './sections/custom/CustomImageTextSection'
import { CustomGallerySection } from './sections/custom/CustomGallerySection'
import { CustomTimelineSection } from './sections/custom/CustomTimelineSection'
import { CustomTeamSection } from './sections/custom/CustomTeamSection'
import { CustomCtaSection } from './sections/custom/CustomCtaSection'

const DEFAULT_ORDER = ['header', 'content', 'imageText', 'gallery', 'timeline', 'team', 'cta']

export function CustomPage({ page, restaurant: _restaurant, theme, banners, sections, sectionOrder }: CustomPageProps) {
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
            sectionData={data}
          />
        )
      case 'timeline':
        return (
          <CustomTimelineSection
            key={sectionId}
            theme={theme}
            sectionData={data}
          />
        )
      case 'team':
        return (
          <CustomTeamSection
            key={sectionId}
            theme={theme}
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
    <div style={{ backgroundColor: '#0C0C0C' }}>
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
