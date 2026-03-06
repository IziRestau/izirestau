'use client'

import Link from 'next/link'
import { getIconComponent } from '@/components/shared/IconPicker'
import type { StoreRestaurantData, StoreThemeData } from '../../../_types'

interface TwoColumnsSectionProps {
  restaurant: StoreRestaurantData
  theme: StoreThemeData
  menuHref: string
  contactHref: string
  sectionData?: Record<string, unknown>
}

export function TwoColumnsSection({
  restaurant,
  theme,
  menuHref,
  contactHref,
  sectionData,
}: TwoColumnsSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const backgroundColor = (s('backgroundColor', '#0C0C0C') as string)
  const imageRatio = (s('imageRatio', '4/5') as string)
  const imageRadius = (s('imageRadius', '2xl') as string)

  const block1Title = (s('block1Title', '') as string) || restaurant.name
  const block1Text = (s('block1Text', '') as string) || restaurant.description || ''
  const block1Image = (s('block1Image', '') as string) || restaurant.coverImage || ''
  const block1BtnText = (s('block1BtnText', 'En savoir plus') as string)
  const block1BtnLink = (s('block1BtnLink', 'contact') as string)
  const showBlock1Btn = s('showBlock1Btn', true) !== false
  const Block1BtnIcon = getIconComponent(s('block1BtnIcon', '') as string)

  const showBlock2 = s('showBlock2', true) !== false
  const block2Title = (s('block2Title', 'Notre passion') as string)
  const block2Text = (s('block2Text', '') as string)
  const block2Image = (s('block2Image', '') as string)
  const block2BtnText = (s('block2BtnText', 'Voir le menu') as string)
  const block2BtnLink = (s('block2BtnLink', 'menu') as string)
  const showBlock2Btn = s('showBlock2Btn', true) !== false
  const Block2BtnIcon = getIconComponent(s('block2BtnIcon', '') as string)

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  const radiusClass = imageRadius === 'none' ? 'rounded-none'
    : imageRadius === 'md' ? 'rounded-md'
    : imageRadius === 'xl' ? 'rounded-xl'
    : imageRadius === '3xl' ? 'rounded-3xl'
    : 'rounded-2xl'

  const getHref = (link: string) => link === 'menu' ? menuHref : contactHref

  const renderBlock = (
    title: string,
    text: string,
    image: string,
    btnText: string,
    btnLink: string,
    showBtn: boolean,
    BtnIcon: ReturnType<typeof getIconComponent>,
    reversed: boolean,
  ) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
      <div className={`relative ${reversed ? 'lg:order-2' : ''}`}>
        {image ? (
          <div 
            className={`${radiusClass} overflow-hidden`}
            style={{ aspectRatio: imageRatio }}
          >
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div
            className={radiusClass}
            style={{ 
              aspectRatio: imageRatio,
              background: `linear-gradient(135deg, ${theme.primaryColor}15, ${theme.primaryColor}05)` 
            }}
          />
        )}
      </div>

      <div className={reversed ? 'lg:order-1' : ''}>
        <h2
          className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-5"
          style={{ fontFamily: `'${theme.headingFont}', serif` }}
        >
          {title}
        </h2>

        {text && (
          <p className="text-sm sm:text-base text-white/50 leading-relaxed whitespace-pre-line mb-8">
            {text}
          </p>
        )}

        {showBtn && (
          <Link
            href={getHref(btnLink)}
            className={`inline-flex items-center gap-2 px-7 py-3 text-sm font-semibold transition-all hover:opacity-90 ${btnClass}`}
            style={{ backgroundColor: theme.primaryColor, color: '#0C0C0C' }}
          >
            {BtnIcon && <BtnIcon size={16} />}
            {btnText}
          </Link>
        )}
      </div>
    </div>
  )

  const shouldShowBlock2 = showBlock2 && (block2Title || block2Text || block2Image)

  return (
    <section className="py-16 sm:py-20" style={{ backgroundColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-20 sm:space-y-28">
        {renderBlock(block1Title, block1Text, block1Image, block1BtnText, block1BtnLink, showBlock1Btn, Block1BtnIcon, false)}
        {shouldShowBlock2 && renderBlock(block2Title, block2Text, block2Image, block2BtnText, block2BtnLink, showBlock2Btn, Block2BtnIcon, true)}
      </div>
    </section>
  )
}
