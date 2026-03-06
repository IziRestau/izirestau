'use client'

import { useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { ImageIcon, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageViewerProps {
  images: string[]
  alt?: string
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto'
  showThumbnails?: boolean
  thumbnailSize?: 'sm' | 'md' | 'lg'
  thumbnailPosition?: 'bottom' | 'right'
  showNavigation?: boolean
  rounded?: 'none' | 'md' | 'lg' | 'xl' | '2xl'
  maxWidth?: string
  className?: string
  primaryColor?: string
  emptyIcon?: React.ReactNode
  emptyText?: string
  enableLightbox?: boolean
  portalContainer?: HTMLElement | null
  renderLightboxInline?: boolean
}

const aspectClasses = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
  auto: '',
}

const roundedClasses = {
  none: 'rounded-none',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
}

const thumbnailSizeClasses = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
}

export function ImageViewer({
  images,
  alt = '',
  aspectRatio = 'square',
  showThumbnails = true,
  thumbnailSize = 'md',
  thumbnailPosition = 'bottom',
  showNavigation = false,
  rounded = 'xl',
  maxWidth,
  className,
  primaryColor = '#10b981',
  emptyIcon,
  emptyText,
  enableLightbox = true,
  portalContainer,
  renderLightboxInline = false,
}: ImageViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const validImages = images.filter(Boolean)
  const hasMultipleImages = validImages.length > 1

  useEffect(() => {
    setMounted(true)
  }, [])

  const handlePrevious = useCallback(() => {
    setSelectedIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1))
  }, [validImages.length])

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1))
  }, [validImages.length])

  const openLightbox = () => {
    if (enableLightbox && validImages.length > 0) {
      setLightboxOpen(true)
    }
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  useEffect(() => {
    if (!lightboxOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') handlePrevious()
      if (e.key === 'ArrowRight') handleNext()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [lightboxOpen, handlePrevious, handleNext])

  const containerClasses = cn(
    'relative bg-gray-100 overflow-hidden',
    aspectClasses[aspectRatio],
    roundedClasses[rounded],
    className
  )

  const renderEmptyState = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
      {emptyIcon || <ImageIcon size={48} className="text-gray-300" />}
      {emptyText && <p className="text-sm mt-2">{emptyText}</p>}
    </div>
  )

  const renderMainImage = () => {
    if (validImages.length === 0) {
      return renderEmptyState()
    }

    return (
      <>
        <Image
          src={validImages[selectedIndex]}
          alt={alt}
          fill
          className="object-cover"
        />
        {enableLightbox && (
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer">
            <ZoomIn size={24} className="text-white drop-shadow-lg" />
          </div>
        )}
        {showNavigation && hasMultipleImages && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handlePrevious() }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleNext() }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </>
    )
  }

  const renderLightbox = () => {
    if (!lightboxOpen || !mounted) return null

    const lightboxElement = (
      <div 
        className="flex items-center justify-center"
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          margin: 0,
          padding: 0,
        }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); closeLightbox() }}
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation() }}
        onTouchStart={(e) => { e.preventDefault(); e.stopPropagation() }}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); closeLightbox() }}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
        >
          <X size={24} />
        </button>

        {hasMultipleImages && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePrevious() }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <ChevronLeft size={28} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleNext() }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <ChevronRight size={28} />
            </button>
          </>
        )}

        <div 
          className="relative max-w-[90vw] max-h-[90vh] w-full h-full"
          onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
        >
          <Image
            src={validImages[selectedIndex]}
            alt={alt}
            fill
            className="object-contain"
          />
        </div>

        {hasMultipleImages && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {validImages.map((_, index) => (
              <button
                key={index}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedIndex(index) }}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  selectedIndex === index ? 'bg-white' : 'bg-white/40 hover:bg-white/60'
                )}
              />
            ))}
          </div>
        )}
      </div>
    )

    if (renderLightboxInline) {
      return lightboxElement
    }

    return createPortal(lightboxElement, portalContainer || document.body)
  }

  const renderThumbnails = () => {
    if (!showThumbnails || !hasMultipleImages) return null

    const isVertical = thumbnailPosition === 'right'

    return (
      <div
        className={cn(
          'flex gap-2',
          isVertical ? 'flex-col' : 'flex-row overflow-x-auto pb-1',
          thumbnailPosition === 'bottom' && 'mt-3'
        )}
      >
        {validImages.map((img, index) => (
          <button
            key={index}
            onClick={() => setSelectedIndex(index)}
            className={cn(
              'relative flex-shrink-0 overflow-hidden border-2 transition-all',
              roundedClasses[rounded === '2xl' ? 'xl' : rounded],
              thumbnailSizeClasses[thumbnailSize],
              selectedIndex === index
                ? 'border-current'
                : 'border-transparent hover:border-gray-200'
            )}
            style={{ color: selectedIndex === index ? primaryColor : undefined }}
          >
            <Image src={img} alt="" fill className="object-cover" />
          </button>
        ))}
      </div>
    )
  }

  if (thumbnailPosition === 'right' && hasMultipleImages && showThumbnails) {
    return (
      <>
        <div className="flex gap-3" style={{ maxWidth }}>
          <div className={cn(containerClasses, 'flex-1 cursor-pointer')} onClick={openLightbox}>
            {renderMainImage()}
          </div>
          {renderThumbnails()}
        </div>
        {renderLightbox()}
      </>
    )
  }

  return (
    <>
      <div style={{ maxWidth }}>
        <div className={cn(containerClasses, enableLightbox && validImages.length > 0 ? 'cursor-pointer' : '')} onClick={openLightbox}>
          {renderMainImage()}
        </div>
        {renderThumbnails()}
      </div>
      {renderLightbox()}
    </>
  )
}
