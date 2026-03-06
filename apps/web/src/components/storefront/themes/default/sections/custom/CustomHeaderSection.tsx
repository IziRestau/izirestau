'use client'

import type { StoreThemeData } from '../../../_types'

interface CustomHeaderSectionProps {
  pageTitle: string
  theme: StoreThemeData
  sectionData?: Record<string, unknown>
}

export function CustomHeaderSection({ pageTitle, theme, sectionData }: CustomHeaderSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const bgType = s('bgType', 'color') as string
  const bgImage = s('bgImage') as string | undefined
  const bgColor = (s('bgColor') as string) || theme.primaryColor
  const gradientFrom = (s('gradientFrom') as string) || theme.primaryColor
  const gradientTo = (s('gradientTo') as string) || (theme.secondaryColor || theme.primaryColor)
  const overlayOpacity = (s('overlayOpacity', 40) as number) / 100
  const minHeight = s('minHeight', '200px') as string
  const showTitle = s('showTitle', true) as boolean
  const subtitle = s('subtitle') as string | undefined
  const textColor = s('textColor') as string | undefined

  let bgStyle: React.CSSProperties = {}
  let textColorFinal = textColor

  if (bgType === 'image' && bgImage) {
    bgStyle = {
      backgroundImage: `url(${bgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
    if (!textColorFinal) textColorFinal = '#ffffff'
  } else if (bgType === 'gradient') {
    bgStyle = {
      background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
    }
    if (!textColorFinal) textColorFinal = '#ffffff'
  } else {
    bgStyle = { backgroundColor: bgColor }
    if (!textColorFinal) textColorFinal = theme.textColor
  }

  return (
    <section className="relative overflow-hidden" style={{ minHeight, ...bgStyle }}>
      {bgType === 'image' && bgImage && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 sm:px-6 py-12" style={{ minHeight }}>
        {showTitle && (
          <h1
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center"
            style={{ color: textColorFinal, fontFamily: `'${theme.headingFont}', sans-serif` }}
          >
            {pageTitle}
          </h1>
        )}
        {subtitle && (
          <p
            className="text-sm sm:text-base mt-3 text-center max-w-2xl opacity-80"
            style={{ color: textColorFinal }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </section>
  )
}
