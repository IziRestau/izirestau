'use client'

import { useState } from 'react'
import type { StoreThemeData, StoreRestaurantData } from '../../../_types'
import { ImageViewer } from '../home/ImageViewer'

interface CustomGallerySectionProps {
  theme: StoreThemeData
  restaurant: StoreRestaurantData
  sectionData?: Record<string, unknown>
}

const PADDING_MAP: Record<string, string> = {
  sm: 'py-6 sm:py-8',
  md: 'py-8 sm:py-12',
  lg: 'py-12 sm:py-16',
  xl: 'py-16 sm:py-24',
}

const GAP_MAP: Record<string, string> = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
}

const ROUNDED_MAP: Record<string, string> = {
  none: 'rounded-none',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
}

const GRID_COLS_MAP: Record<string, string> = {
  '2': 'sm:grid-cols-2',
  '3': 'sm:grid-cols-2 lg:grid-cols-3',
  '4': 'sm:grid-cols-2 lg:grid-cols-4',
}

const MASONRY_COLS_MAP: Record<string, string> = {
  '2': 'sm:columns-2',
  '3': 'sm:columns-2 lg:columns-3',
  '4': 'sm:columns-2 lg:columns-4',
}

const ASPECT_MAP: Record<string, string> = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
}

export function CustomGallerySection({ theme, restaurant, sectionData }: CustomGallerySectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', false) === false) return null

  const title = s('title') as string | undefined
  const subtitle = s('subtitle') as string | undefined
  const columnsKey = s('columns', '3') as string
  const gap = GAP_MAP[s('gap', 'md') as string] || 'gap-4'
  const imageRounded = ROUNDED_MAP[s('imageRounded', 'lg') as string] || 'rounded-lg'
  const bgColor = s('bgColor') as string | undefined
  const paddingY = PADDING_MAP[s('paddingY', 'lg') as string] || 'py-12 sm:py-16'
  const displayMode = s('displayMode', 'cover') as string
  const aspectRatio = s('aspectRatio', 'square') as string
  const enableViewer = s('enableViewer', true) as boolean

  const source = s('source', 'restaurant') as string
  const customImages = Array.isArray(s('customImages')) ? (s('customImages') as string[]) : []
  const restaurantImages = restaurant.images || []

  const images = source === 'custom' && customImages.length > 0
    ? customImages
    : restaurantImages

  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  if (images.length === 0) return null

  const handleImageClick = (idx: number) => {
    if (!enableViewer) return
    setViewerIndex(idx)
    setViewerOpen(true)
  }

  const isMasonry = displayMode === 'original'
  const gridCols = GRID_COLS_MAP[columnsKey] || 'sm:grid-cols-2 lg:grid-cols-3'
  const masonryCols = MASONRY_COLS_MAP[columnsKey] || 'sm:columns-2 lg:columns-3'
  const aspectClass = ASPECT_MAP[aspectRatio] || 'aspect-square'

  return (
    <section
      className={paddingY}
      style={bgColor ? { backgroundColor: bgColor } : undefined}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {(title || subtitle) && (
          <div className="text-center mb-8">
            {title && (
              <h2
                className="text-xl sm:text-2xl font-bold"
                style={{ color: theme.textColor, fontFamily: `'${theme.headingFont}', sans-serif` }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm mt-2 opacity-60" style={{ color: theme.textColor }}>
                {subtitle}
              </p>
            )}
          </div>
        )}

        {isMasonry ? (
          <div className={`columns-1 ${masonryCols} ${gap} space-y-4`}>
            {images.map((img: string, idx: number) => (
              <div
                key={idx}
                className={`break-inside-avoid overflow-hidden group ${imageRounded} ${enableViewer ? 'cursor-pointer' : ''}`}
                onClick={() => handleImageClick(idx)}
              >
                <img
                  src={img}
                  alt={`Image ${idx + 1}`}
                  className={`w-full h-auto object-contain ${imageRounded} group-hover:scale-[1.02] transition-transform duration-300`}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className={`grid grid-cols-1 ${gridCols} ${gap}`}>
            {images.map((img: string, idx: number) => (
              <div
                key={idx}
                className={`relative ${aspectClass} overflow-hidden ${imageRounded} group ${enableViewer ? 'cursor-pointer' : ''}`}
                onClick={() => handleImageClick(idx)}
              >
                <img
                  src={img}
                  alt={`Image ${idx + 1}`}
                  className={`absolute inset-0 w-full h-full object-cover ${imageRounded} group-hover:scale-[1.02] transition-transform duration-300`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {enableViewer && (
        <ImageViewer
          images={images}
          initialIndex={viewerIndex}
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          restaurantName={restaurant.name}
        />
      )}
    </section>
  )
}
