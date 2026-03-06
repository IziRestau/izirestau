'use client'

import { Plus, Clock, Flame, ShoppingCart } from 'lucide-react'
import type { ProductCardProps } from '../_types'

function pc(theme: ProductCardProps['theme'], key: string, fallback: unknown): unknown {
  return (theme.productConfig as Record<string, unknown> | null)?.[key] ?? fallback
}

export function ProductCard({ product, theme, settings, onClick, sectionOverrides }: ProductCardProps) {
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
    : 'rounded-lg'

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price

  const effectiveCardStyle = sectionOverrides?.cardStyle || (pc(theme, 'cardStyle', '') as string) || theme.productCardStyle
  const effectiveShowImages = sectionOverrides?.showImages ?? (pc(theme, 'showImages', true) as boolean) ?? theme.showProductImages
  const effectiveShowPrices = sectionOverrides?.showPrices ?? true
  const effectiveShowDescriptions = sectionOverrides?.showDescriptions ?? (pc(theme, 'showDescription', true) as boolean)
  const effectiveShowBadges = sectionOverrides?.showBadges ?? (pc(theme, 'showBadges', true) as boolean)
  const effectiveImageRatio = sectionOverrides?.imageRatio || (pc(theme, 'imageRatio', '4:3') as string).replace(':', '/')
  const effectiveImageFit = (pc(theme, 'imageFit', 'cover') as string)
  const effectiveDescLines = pc(theme, 'descriptionLines', 2) as number
  const effectivePriceColor = (pc(theme, 'priceColor', '') as string) || theme.primaryColor
  const effectiveAddBtnStyle = pc(theme, 'addButtonStyle', 'icon') as string
  const effectiveCardRadius = pc(theme, 'cardRadius', 'lg') as string
  const effectiveCardShadow = pc(theme, 'cardShadow', 'none') as string
  const effectiveCardBorder = pc(theme, 'cardBorder', true) as boolean
  const effectiveHoverEffect = pc(theme, 'hoverEffect', 'zoom') as string

  const radiusClass = effectiveCardRadius === 'none' ? 'rounded-none'
    : effectiveCardRadius === 'sm' ? 'rounded-lg'
    : effectiveCardRadius === 'md' ? 'rounded-xl'
    : effectiveCardRadius === 'xl' ? 'rounded-3xl'
    : effectiveCardRadius === '2xl' ? 'rounded-[2rem]'
    : 'rounded-2xl'

  const shadowClass = effectiveCardShadow === 'sm' ? 'shadow-sm'
    : effectiveCardShadow === 'md' ? 'shadow-md'
    : effectiveCardShadow === 'lg' ? 'shadow-lg'
    : ''

  const hoverClass = effectiveHoverEffect === 'shadow' ? 'hover:shadow-xl'
    : effectiveHoverEffect === 'scale' ? 'hover:scale-[1.02]'
    : 'hover:shadow-lg'

  const imgHoverClass = effectiveHoverEffect === 'zoom' ? 'group-hover:scale-105' : ''

  const renderAddButton = (size: 'sm' | 'md') => {
    const s = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9'
    const iconSize = size === 'sm' ? 16 : 18
    if (effectiveAddBtnStyle === 'text') {
      return (
        <span
          className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium ${btnClass}`}
          style={{ backgroundColor: theme.primaryColor, color: '#0C0C0C' }}
        >
          Ajouter
        </span>
      )
    }
    if (effectiveAddBtnStyle === 'both') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium ${btnClass}`}
          style={{ backgroundColor: theme.primaryColor, color: '#0C0C0C' }}
        >
          <ShoppingCart size={12} />
          Ajouter
        </span>
      )
    }
    return (
      <div
        className={`${s} flex items-center justify-center transition-transform group-hover:scale-110 ${btnClass}`}
        style={{ backgroundColor: theme.primaryColor, color: '#0C0C0C' }}
      >
        <Plus size={iconSize} />
      </div>
    )
  }

  if (effectiveCardStyle === 'horizontal') {
    const imgPos = sectionOverrides?.listImagePosition || (pc(theme, 'listImagePosition', 'left') as string)
    const isRight = imgPos === 'right'

    const imageEl = effectiveShowImages && product.image ? (
      <img
        src={product.image}
        alt={product.name}
        className={`w-20 h-20 sm:w-24 sm:h-24 ${radiusClass} flex-shrink-0`}
        style={{ objectFit: effectiveImageFit as 'cover' | 'contain' }}
      />
    ) : null

    return (
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-4 p-3 ${radiusClass} ${effectiveCardBorder ? 'border' : ''} ${shadowClass} transition-all ${hoverClass} text-left group`}
        style={{ borderColor: effectiveCardBorder ? 'rgba(255,255,255,0.06)' : undefined, backgroundColor: '#141414' }}
      >
        {!isRight && imageEl}
        <div className="flex-1 min-w-0">
          <h3
            className="font-semibold text-sm sm:text-base truncate text-white"
            style={{ fontFamily: `'${theme.headingFont}', serif` }}
          >
            {product.name}
          </h3>
          {effectiveShowDescriptions && product.description && (
            <p className={`text-xs sm:text-sm mt-1 text-white/50 line-clamp-${effectiveDescLines}`}>
              {product.description}
            </p>
          )}
          {effectiveShowPrices && (
            <div className="flex items-center gap-2 mt-2">
              <span className="font-bold text-sm" style={{ color: effectivePriceColor }}>
                {formatPrice(product.price)}
              </span>
              {hasDiscount && (
                <span className="text-xs line-through text-white/30">
                  {formatPrice(product.compareAtPrice!)}
                </span>
              )}
            </div>
          )}
        </div>
        {renderAddButton('sm')}
        {isRight && imageEl}
      </button>
    )
  }

  if (effectiveCardStyle === 'minimal') {
    return (
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between py-3 px-1 border-b transition-all hover:opacity-80 text-left"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-white">
            {product.name}
          </h3>
          {effectiveShowDescriptions && product.description && (
            <p className={`text-xs mt-0.5 text-white/40 line-clamp-${Math.min(effectiveDescLines, 1)}`}>
              {product.description}
            </p>
          )}
        </div>
        {effectiveShowPrices && (
          <span className="font-semibold text-sm ml-4 flex-shrink-0" style={{ color: effectivePriceColor }}>
            {formatPrice(product.price)}
          </span>
        )}
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`w-full ${radiusClass} overflow-hidden transition-all text-left group ${effectiveCardBorder ? 'border' : ''} ${shadowClass} ${hoverClass}`}
      style={{ borderColor: effectiveCardBorder ? 'rgba(255,255,255,0.06)' : undefined, backgroundColor: '#141414' }}
    >
      {effectiveShowImages && product.image && (
        <div className="relative overflow-hidden" style={{ aspectRatio: effectiveImageRatio }}>
          <img
            src={product.image}
            alt={product.name}
            className={`w-full h-full transition-transform duration-300 ${imgHoverClass}`}
            style={{ objectFit: effectiveImageFit as 'cover' | 'contain' }}
          />
          {effectiveShowBadges && hasDiscount && (
            <span
              className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ backgroundColor: theme.accentColor, color: '#0C0C0C' }}
            >
              Promo
            </span>
          )}
          {effectiveShowBadges && product.isFeatured && (
            <span
              className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ backgroundColor: theme.primaryColor, color: '#0C0C0C' }}
            >
              Populaire
            </span>
          )}
        </div>
      )}
      <div className="p-3 sm:p-4">
        <h3
          className="font-semibold text-sm sm:text-base line-clamp-1 text-white"
          style={{ fontFamily: `'${theme.headingFont}', serif` }}
        >
          {product.name}
        </h3>
        {effectiveShowDescriptions && product.description && (
          <p className={`text-xs sm:text-sm mt-1 text-white/50 line-clamp-${effectiveDescLines}`}>
            {product.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2">
          {theme.showPrepTime && product.prepTime && (
            <span className="inline-flex items-center gap-1 text-xs text-white/40">
              <Clock size={12} />
              {product.prepTime} min
            </span>
          )}
          {product.calories && (
            <span className="inline-flex items-center gap-1 text-xs text-white/40">
              <Flame size={12} />
              {product.calories} cal
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-3">
          {effectiveShowPrices && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-base" style={{ color: effectivePriceColor }}>
                {formatPrice(product.price)}
              </span>
              {hasDiscount && (
                <span className="text-xs line-through text-white/30">
                  {formatPrice(product.compareAtPrice!)}
                </span>
              )}
            </div>
          )}
          {renderAddButton('sm')}
        </div>
      </div>
    </button>
  )
}
