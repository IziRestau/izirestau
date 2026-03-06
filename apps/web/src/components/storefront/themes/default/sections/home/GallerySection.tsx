'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { StoreRestaurantData, StoreThemeData } from '../../../_types'
import { ImageViewer } from './ImageViewer'

interface GallerySectionProps {
  restaurant: StoreRestaurantData
  theme: StoreThemeData
  sectionData?: Record<string, unknown>
}

export function GallerySection({
  restaurant,
  theme,
  sectionData,
}: GallerySectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', false) === false) return null

  const title = (s('title', 'Notre galerie') as string)
  const subtitle = (s('subtitle', '') as string)
  const columns = Number(s('columns', 3))
  const initialCount = Number(s('initialCount', 6))
  const source = (s('source', 'restaurant') as string)
  const customImages = Array.isArray(s('customImages')) ? (s('customImages') as string[]) : []
  const displayMode = (s('displayMode', 'original') as string)
  const aspectRatio = (s('aspectRatio', 'square') as string)
  const enableViewer = s('enableViewer', true) as boolean

  const restaurantImages = restaurant.images.length > 0
    ? restaurant.images
    : restaurant.coverImage
    ? [restaurant.coverImage]
    : []

  const allImages = source === 'custom' && customImages.length > 0
    ? customImages
    : restaurantImages

  const [visibleCount, setVisibleCount] = useState(initialCount)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  if (allImages.length === 0) return null

  const visibleImages = allImages.slice(0, visibleCount)
  const hasMore = visibleCount < allImages.length

  const handleImageClick = (idx: number) => {
    if (!enableViewer) return
    setViewerIndex(idx)
    setViewerOpen(true)
  }

  const loadMore = () => {
    setVisibleCount((prev) => Math.min(prev + initialCount, allImages.length))
  }

  const masonryColsClass = columns === 2
    ? 'sm:columns-2'
    : columns === 4
    ? 'sm:columns-2 lg:columns-4'
    : 'sm:columns-2 lg:columns-3'

  const gridColsClass = columns === 2
    ? 'sm:grid-cols-2'
    : columns === 4
    ? 'sm:grid-cols-2 lg:grid-cols-4'
    : 'sm:grid-cols-2 lg:grid-cols-3'

  const aspectClass = aspectRatio === 'video'
    ? 'aspect-video'
    : aspectRatio === 'portrait'
    ? 'aspect-[3/4]'
    : 'aspect-square'

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  const isMasonry = displayMode === 'original'

  return (
    <section className="py-16 sm:py-20" style={{ backgroundColor: theme.backgroundColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2
            className="text-2xl sm:text-3xl font-bold mb-2"
            style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm opacity-60" style={{ color: theme.textColor }}>{subtitle}</p>
          )}
        </div>

        {isMasonry ? (
          <div className={`columns-1 ${masonryColsClass} gap-4 space-y-4`}>
            {visibleImages.map((img, idx) => (
              <div
                key={idx}
                className={`break-inside-avoid rounded-2xl overflow-hidden group ${enableViewer ? 'cursor-pointer' : ''}`}
                onClick={() => handleImageClick(idx)}
              >
                <img
                  src={img}
                  alt={`${restaurant.name} - ${idx + 1}`}
                  className="w-full h-auto object-contain rounded-2xl group-hover:scale-[1.02] transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className={`grid grid-cols-1 ${gridColsClass} gap-4`}>
            {visibleImages.map((img, idx) => (
              <div
                key={idx}
                className={`relative ${aspectClass} rounded-2xl overflow-hidden group ${enableViewer ? 'cursor-pointer' : ''}`}
                onClick={() => handleImageClick(idx)}
              >
                <img
                  src={img}
                  alt={`${restaurant.name} - ${idx + 1}`}
                  className="absolute inset-0 w-full h-full object-cover rounded-2xl group-hover:scale-[1.02] transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={loadMore}
              className={`px-6 py-2.5 text-sm font-medium border transition-all hover:opacity-80 flex items-center gap-2 ${btnClass}`}
              style={{ borderColor: `${theme.textColor}20`, color: theme.textColor }}
            >
              Charger plus
              <ChevronDown size={16} />
            </button>
          </div>
        )}
      </div>

      {enableViewer && (
        <ImageViewer
          images={allImages}
          initialIndex={viewerIndex}
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          restaurantName={restaurant.name}
        />
      )}
    </section>
  )
}
