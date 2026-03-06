'use client'

import { ExternalLink } from 'lucide-react'
import type { StoreThemeData } from '../../../_types'

interface SocialGallerySectionProps {
  theme: StoreThemeData
  sectionData?: Record<string, unknown>
}

export function SocialGallerySection({
  theme,
  sectionData,
}: SocialGallerySectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const title = (s('title', 'Suivez-nous') as string)
  const handle = (s('handle', '') as string)
  const linkUrl = (s('linkUrl', '') as string)
  const rawImages = s('images', []) as string[]
  const images = (Array.isArray(rawImages) ? rawImages : []).slice(0, 6)

  if (images.length === 0) return null

  return (
    <section className="py-16 sm:py-20" style={{ backgroundColor: '#0C0C0C' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2
            className="text-3xl sm:text-4xl font-bold text-white"
            style={{ fontFamily: `'${theme.headingFont}', serif` }}
          >
            {title}
          </h2>
          {handle && (
            <p className="text-sm text-white/40 mt-2">{handle}</p>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {images.map((img, i) => (
            <div
              key={i}
              className="aspect-square rounded-xl overflow-hidden group relative"
            >
              <img
                src={img}
                alt=""
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ExternalLink size={20} className="text-white" />
              </div>
            </div>
          ))}
        </div>

        {linkUrl && (
          <div className="text-center mt-8">
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: theme.primaryColor }}
            >
              Voir plus sur Instagram
              <ExternalLink size={14} />
            </a>
          </div>
        )}
      </div>
    </section>
  )
}
