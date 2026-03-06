'use client'

import type { StoreThemeData } from '../../../_types'

interface CustomGallerySectionProps {
  theme: StoreThemeData
  sectionData?: Record<string, unknown>
}

export function CustomGallerySection({
  theme,
  sectionData,
}: CustomGallerySectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const title = (s('title', '') as string)
  const subtitle = (s('subtitle', '') as string)
  const columns = (s('columns', '3') as string)
  const gap = (s('gap', 'md') as string)
  const images = (s('images', []) as string[])

  if (images.length === 0) return null

  const gapClass = gap === 'sm' ? 'gap-2' : gap === 'lg' ? 'gap-6' : 'gap-4'
  const colClass = columns === '2'
    ? `grid-cols-1 sm:grid-cols-2 ${gapClass}`
    : columns === '4'
    ? `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 ${gapClass}`
    : `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${gapClass}`

  return (
    <section className="py-12 sm:py-16" style={{ backgroundColor: '#0C0C0C' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {(title || subtitle) && (
          <div className="text-center mb-10">
            {title && (
              <h2
                className="text-2xl sm:text-3xl font-bold text-white"
                style={{ fontFamily: `'${theme.headingFont}', serif` }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm text-white/50 mt-2 max-w-lg mx-auto">{subtitle}</p>
            )}
          </div>
        )}

        <div className={`grid ${colClass}`}>
          {images.map((img, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden aspect-square group"
            >
              <img
                src={img}
                alt=""
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
