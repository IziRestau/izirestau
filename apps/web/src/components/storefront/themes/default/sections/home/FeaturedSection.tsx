'use client'

import { ArrowRight, ChevronLeft, ChevronRight, Plus, ShoppingCart } from 'lucide-react'
import { useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { getIconComponent } from '@/components/shared/IconPicker'
import type { StoreThemeData, StoreCategory, StoreProduct, StoreSettingsData } from '../../../_types'

interface FeaturedSectionProps {
  theme: StoreThemeData
  categories: StoreCategory[]
  settings: StoreSettingsData | null
  menuHref: string
  onProductClick: (product: StoreProduct) => void
  sectionData?: Record<string, unknown>
}

export function FeaturedSection({
  theme,
  categories,
  settings,
  menuHref,
  onProductClick,
  sectionData,
}: FeaturedSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  const carouselRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const updateScrollState = useCallback(() => {
    const el = carouselRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  const scrollCarousel = (direction: 'left' | 'right') => {
    const el = carouselRef.current
    if (!el) return
    const amount = el.clientWidth * 0.7
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
    setTimeout(updateScrollState, 350)
  }

  const currency = settings?.currency || 'XOF'

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  const pConfig = (theme.productConfig as Record<string, unknown> | null) || {}
  const p = (key: string, fallback: unknown): unknown => pConfig[key] ?? fallback

  if (s('enabled', true) === false) return null

  const maxProducts = (pConfig.featuredMaxItems as number) || 6
  const featuredSource = (s('source', 'featured') as string)
  const columns = (pConfig.featuredColumns as string) || '3'
  const featuredLayout = (pConfig.featuredLayout as string) || 'grid'
  const cardStyle = (pConfig.featuredCardStyle as string) || 'vertical'
  const imageRatio = ((pConfig.featuredImageRatio as string) || '16:10').replace(':', '/')
  const showImage = (p('showImages', true) as boolean) !== false
  const showDescription = (p('showDescription', true) as boolean) !== false
  const showPrice = true
  const showOrderBtn = s('showOrderBtn', true) !== false
  const orderBtnText = (s('orderBtnText', 'Commander') as string)
  const showViewAllLink = s('showViewAllLink', true) !== false
  const OrderBtnIcon = getIconComponent(s('orderBtnIcon', '') as string)

  const cardRadius = p('cardRadius', 'lg') as string
  const cardShadow = p('cardShadow', 'none') as string
  const cardBorder = p('cardBorder', true) as boolean
  const priceColor = (p('priceColor', '') as string) || theme.primaryColor
  const pricePosition = p('pricePosition', 'below') as string
  const imageFit = p('imageFit', 'cover') as string
  const hoverEffect = p('hoverEffect', 'zoom') as string
  const descLines = p('descriptionLines', 2) as number
  const showBadges = (p('featuredShowBadge', true) as boolean) && (p('showBadges', true) as boolean)
  const addBtnStyle = p('addButtonStyle', 'icon') as string

  const radiusClass = cardRadius === 'none' ? 'rounded-none'
    : cardRadius === 'sm' ? 'rounded-lg'
    : cardRadius === 'md' ? 'rounded-xl'
    : cardRadius === 'xl' ? 'rounded-3xl'
    : cardRadius === '2xl' ? 'rounded-[2rem]'
    : 'rounded-2xl'

  const shadowClass = cardShadow === 'sm' ? 'shadow-sm'
    : cardShadow === 'md' ? 'shadow-md'
    : cardShadow === 'lg' ? 'shadow-lg'
    : ''

  const hoverClass = hoverEffect === 'shadow' ? 'hover:shadow-xl'
    : hoverEffect === 'scale' ? 'hover:scale-[1.02]'
    : 'hover:shadow-lg'

  const imgHoverClass = hoverEffect === 'zoom' ? 'group-hover:scale-105' : ''

  const allProducts = categories.flatMap(c => c.products)
  const featuredProducts = allProducts.filter(prod => prod.isFeatured)

  const products = (() => {
    if (featuredSource === 'popular') return allProducts.slice(0, maxProducts)
    if (featuredSource === 'recent') return [...allProducts].reverse().slice(0, maxProducts)
    return (featuredProducts.length > 0 ? featuredProducts : allProducts).slice(0, maxProducts)
  })()

  if (products.length === 0) return null

  const effectiveCols = cardStyle === 'horizontal' ? Math.min(parseInt(columns), 2).toString() : columns

  const colsClass = effectiveCols === '4'
    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
    : effectiveCols === '2'
    ? 'grid-cols-1 sm:grid-cols-2'
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'

  const hasDiscount = (product: StoreProduct) => product.compareAtPrice && product.compareAtPrice > product.price

  const renderAddBtn = (size: 'sm' | 'md' = 'sm') => {
    if (!showOrderBtn) return null
    const iconSize = size === 'sm' ? 12 : 14
    const BtnIcon = OrderBtnIcon || (addBtnStyle === 'icon' ? Plus : ShoppingCart)

    if (addBtnStyle === 'icon') {
      const s = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8'
      return (
        <div
          className={`${s} flex items-center justify-center text-white transition-transform group-hover:scale-110 ${btnClass}`}
          style={{ backgroundColor: theme.primaryColor }}
        >
          <BtnIcon size={iconSize} />
        </div>
      )
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white transition-all group-hover:opacity-90 ${btnClass}`}
        style={{ backgroundColor: theme.primaryColor }}
      >
        {(addBtnStyle === 'both' || OrderBtnIcon) && <BtnIcon size={iconSize} />}
        {orderBtnText}
      </span>
    )
  }

  const renderPriceBlock = (product: StoreProduct, isOverlay = false) => {
    if (!showPrice) return null
    const color = isOverlay ? '#ffffff' : priceColor
    const oldColor = isOverlay ? 'text-white/50' : 'opacity-40'

    if (pricePosition === 'badge') {
      return (
        <span
          className="inline-block px-2.5 py-1 rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: theme.primaryColor }}
        >
          {formatPrice(product.price)}
        </span>
      )
    }

    return (
      <div className="flex items-center gap-2">
        <span className="text-base font-bold" style={{ color }}>
          {formatPrice(product.price)}
        </span>
        {hasDiscount(product) && (
          <span className={`text-xs line-through ${oldColor}`} style={isOverlay ? undefined : { color: theme.textColor }}>
            {formatPrice(product.compareAtPrice!)}
          </span>
        )}
      </div>
    )
  }

  const renderVerticalCard = (product: StoreProduct) => {
    const isPriceRight = pricePosition === 'right'
    return (
      <button
        key={product.id}
        type="button"
        onClick={() => onProductClick(product)}
        className={`group text-left w-full ${radiusClass} overflow-hidden ${cardBorder ? 'border' : ''} ${shadowClass} transition-all ${hoverClass}`}
        style={{ borderColor: cardBorder ? `${theme.textColor}08` : undefined, backgroundColor: theme.backgroundColor }}
      >
        {showImage && product.image && theme.showProductImages && (
          <div className="relative overflow-hidden" style={{ aspectRatio: imageRatio }}>
            <img
              src={product.image}
              alt={product.name}
              className={`w-full h-full transition-transform duration-500 ${imgHoverClass}`}
              style={{ objectFit: imageFit as 'cover' | 'contain' }}
            />
            {showBadges && hasDiscount(product) && (
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: theme.accentColor }}>Promo</span>
            )}
            {showBadges && product.isFeatured && (
              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: theme.primaryColor }}>Populaire</span>
            )}
          </div>
        )}
        <div className="p-4">
          <div className={isPriceRight ? 'flex items-start justify-between gap-2' : ''}>
            <h3
              className="font-semibold text-base line-clamp-1"
              style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
            >
              {product.name}
            </h3>
            {isPriceRight && renderPriceBlock(product)}
          </div>
          {showDescription && product.description && (
            <p className={`text-sm mt-1 opacity-50 line-clamp-${descLines}`} style={{ color: theme.textColor }}>
              {product.description}
            </p>
          )}
          <div className="flex items-center justify-between mt-3">
            {!isPriceRight && renderPriceBlock(product)}
            {renderAddBtn('sm')}
          </div>
        </div>
      </button>
    )
  }

  const renderHorizontalCard = (product: StoreProduct) => (
    <button
      key={product.id}
      type="button"
      onClick={() => onProductClick(product)}
      className={`group text-left w-full ${radiusClass} overflow-hidden ${cardBorder ? 'border' : ''} ${shadowClass} transition-all ${hoverClass} flex`}
      style={{ borderColor: cardBorder ? `${theme.textColor}08` : undefined, backgroundColor: theme.backgroundColor }}
    >
      {showImage && product.image && theme.showProductImages && (
        <div className="w-32 sm:w-40 flex-shrink-0 overflow-hidden relative" style={{ aspectRatio: imageRatio }}>
          <img
            src={product.image}
            alt={product.name}
            className={`w-full h-full transition-transform duration-500 ${imgHoverClass}`}
            style={{ objectFit: imageFit as 'cover' | 'contain' }}
          />
          {showBadges && hasDiscount(product) && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: theme.accentColor }}>Promo</span>
          )}
        </div>
      )}
      <div className="p-4 flex flex-col justify-between flex-1 min-w-0">
        <div>
          <h3
            className="font-semibold text-base line-clamp-1"
            style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
          >
            {product.name}
          </h3>
          {showDescription && product.description && (
            <p className={`text-sm mt-1 opacity-50 line-clamp-${descLines}`} style={{ color: theme.textColor }}>
              {product.description}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between mt-3">
          {renderPriceBlock(product)}
          {renderAddBtn('sm')}
        </div>
      </div>
    </button>
  )

  const renderOverlayCard = (product: StoreProduct) => (
    <button
      key={product.id}
      type="button"
      onClick={() => onProductClick(product)}
      className={`group text-left w-full ${radiusClass} overflow-hidden relative transition-all ${hoverClass}`}
      style={{ aspectRatio: imageRatio }}
    >
      {product.image && theme.showProductImages ? (
        <img
          src={product.image}
          alt={product.name}
          className={`absolute inset-0 w-full h-full transition-transform duration-500 ${imgHoverClass}`}
          style={{ objectFit: imageFit as 'cover' | 'contain' }}
        />
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: `${theme.primaryColor}20` }} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      {showBadges && hasDiscount(product) && (
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold text-white z-10" style={{ backgroundColor: theme.accentColor }}>Promo</span>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <h3
          className="font-semibold text-base line-clamp-1"
          style={{ fontFamily: `'${theme.headingFont}', sans-serif` }}
        >
          {product.name}
        </h3>
        {showDescription && product.description && (
          <p className="text-sm mt-1 text-white/70 line-clamp-1">{product.description}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          {renderPriceBlock(product, true)}
          {renderAddBtn('sm')}
        </div>
      </div>
    </button>
  )

  const renderMinimalCard = (product: StoreProduct) => (
    <button
      key={product.id}
      type="button"
      onClick={() => onProductClick(product)}
      className={`group text-left w-full transition-all ${hoverClass}`}
    >
      {showImage && product.image && theme.showProductImages && (
        <div className={`relative overflow-hidden ${radiusClass} mb-3`} style={{ aspectRatio: imageRatio }}>
          <img
            src={product.image}
            alt={product.name}
            className={`w-full h-full transition-transform duration-500 ${imgHoverClass}`}
            style={{ objectFit: imageFit as 'cover' | 'contain' }}
          />
          {showBadges && hasDiscount(product) && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: theme.accentColor }}>Promo</span>
          )}
        </div>
      )}
      <h3
        className="font-semibold text-base line-clamp-1"
        style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
      >
        {product.name}
      </h3>
      {showDescription && product.description && (
        <p className={`text-sm mt-1 opacity-50 line-clamp-${descLines}`} style={{ color: theme.textColor }}>
          {product.description}
        </p>
      )}
      <div className="flex items-center justify-between mt-2">
        {renderPriceBlock(product)}
        {renderAddBtn('sm')}
      </div>
    </button>
  )

  const renderCard = (product: StoreProduct) => {
    switch (cardStyle) {
      case 'horizontal': return renderHorizontalCard(product)
      case 'overlay': return renderOverlayCard(product)
      case 'minimal': return renderMinimalCard(product)
      default: return renderVerticalCard(product)
    }
  }

  return (
    <section className="py-12 sm:py-16" style={{ backgroundColor: theme.backgroundColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2
              className="text-2xl sm:text-3xl font-bold"
              style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
            >
              {(s('title') as string) || (featuredProducts.length > 0 ? 'Nos coups de c\u0153ur' : 'Nos plats')}
            </h2>
            <p className="text-sm mt-1 opacity-60" style={{ color: theme.textColor }}>
              {(s('subtitle') as string) || (featuredProducts.length > 0
                ? 'Les plats les plus appréciés par nos clients'
                : 'Découvrez notre sélection')}
            </p>
          </div>
          {showViewAllLink && (
            <Link
              href={menuHref}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: theme.primaryColor }}
            >
              Voir tout le menu
              <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {featuredLayout === 'carousel' ? (
          <div className="relative group/carousel">
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollCarousel('left')}
                className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity"
                style={{ color: theme.textColor }}
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <div
              ref={carouselRef}
              onScroll={updateScrollState}
              className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {products.map(product => (
                <div
                  key={product.id}
                  className="snap-start flex-shrink-0"
                  style={{ width: `calc((100% - ${(parseInt(effectiveCols) - 1) * 24}px) / ${effectiveCols})`, minWidth: '240px' }}
                >
                  {renderCard(product)}
                </div>
              ))}
            </div>
            {canScrollRight && (
              <button
                type="button"
                onClick={() => scrollCarousel('right')}
                className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity"
                style={{ color: theme.textColor }}
              >
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        ) : (
          <div className={`grid ${colsClass} gap-4 sm:gap-6`}>
            {products.map(product => renderCard(product))}
          </div>
        )}

        {showViewAllLink && (
          <div className="sm:hidden mt-6 text-center">
            <Link
              href={menuHref}
              className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white ${btnClass}`}
              style={{ backgroundColor: theme.primaryColor }}
            >
              Voir tout le menu
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
