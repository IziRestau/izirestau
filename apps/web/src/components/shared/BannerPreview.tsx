'use client'

import { Copy, X } from 'lucide-react'
import Link from 'next/link'
import { getIconComponent } from '@/components/shared/IconPicker'

export interface BannerPreviewStyles {
  bgType?: 'solid' | 'gradient' | 'image'
  bgColor?: string
  bgGradientFrom?: string
  bgGradientTo?: string
  bgGradientDirection?: string
  textColor?: string
  overlayOpacity?: number
  objectFit?: 'cover' | 'contain' | 'fill'
  blur?: number
  ctaBgColor?: string
  ctaTextColor?: string
  ctaIcon?: string
}

export interface BannerPreviewCoupon {
  code: string
  discountType?: string
  discountValue?: string | number
}

export interface BannerPreviewData {
  displayType: string
  contentMode: string
  title: string | null
  subtitle: string | null
  image: string | null
  ctaText: string | null
  ctaLink: string | null
  coupon: BannerPreviewCoupon | null
  dismissable: boolean
  styles: BannerPreviewStyles | null
}

export interface BannerPreviewTheme {
  primaryColor: string
  headingFont: string
  bodyFont: string
  buttonStyle: string
}

function getBannerBg(styles: BannerPreviewStyles | null, primaryColor: string): React.CSSProperties {
  if (!styles) return { backgroundColor: primaryColor }
  if (styles.bgType === 'gradient' && styles.bgGradientFrom && styles.bgGradientTo) {
    return { background: `linear-gradient(${styles.bgGradientDirection || 'to right'}, ${styles.bgGradientFrom}, ${styles.bgGradientTo})` }
  }
  if (styles.bgType === 'solid' && styles.bgColor) {
    return { backgroundColor: styles.bgColor }
  }
  return { backgroundColor: primaryColor }
}

interface StripBannerPreviewProps {
  banner: BannerPreviewData
  theme: BannerPreviewTheme
  onDismiss?: () => void
  isPreview?: boolean
}

export function StripBannerPreview({ banner, theme, onDismiss, isPreview }: StripBannerPreviewProps) {
  const styles = banner.styles
  const textColor = styles?.textColor || '#ffffff'
  const bgStyle = getBannerBg(styles, theme.primaryColor)

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
  }

  const ctaBg = styles?.ctaBgColor || 'rgba(255,255,255,0.2)'
  const ctaText = styles?.ctaTextColor || textColor
  const CtaIcon = getIconComponent(styles?.ctaIcon)

  const ctaClassName = 'inline-flex items-center gap-1 px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-full transition-all hover:opacity-80 whitespace-nowrap'
  const ctaStyle = { backgroundColor: ctaBg, color: ctaText }

  return (
    <div className="relative" style={{ ...bgStyle, color: textColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-2 sm:gap-3 py-2.5 sm:py-3 min-h-[44px]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 min-w-0 flex-1">
            {banner.title && (
              <span
                className="text-xs sm:text-sm font-medium leading-snug"
                style={{ fontFamily: `'${theme.bodyFont}', sans-serif` }}
              >
                {banner.title}
              </span>
            )}
            {banner.contentMode === 'promo' && banner.coupon && (
              <button
                type="button"
                onClick={() => handleCopyCode(banner.coupon!.code)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded font-mono text-[11px] sm:text-xs font-bold flex-shrink-0 hover:opacity-80 transition-opacity"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: textColor }}
              >
                {banner.coupon.code}
                <Copy size={10} />
              </button>
            )}
            {banner.subtitle && (
              <span className="text-[10px] sm:text-xs opacity-75 basis-full sm:basis-auto">{banner.subtitle}</span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {banner.ctaText && banner.ctaLink && (
              isPreview ? (
                <span className={ctaClassName} style={ctaStyle}>
                  {banner.ctaText}
                  {CtaIcon && <CtaIcon size={12} />}
                </span>
              ) : (
                <Link href={banner.ctaLink} className={ctaClassName} style={ctaStyle}>
                  {banner.ctaText}
                  {CtaIcon && <CtaIcon size={12} />}
                </Link>
              )
            )}
            {banner.dismissable && onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                style={{ color: textColor }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface LargeBannerPreviewProps {
  banner: BannerPreviewData
  theme: BannerPreviewTheme
  onDismiss?: () => void
  compact?: boolean
  isPreview?: boolean
}

export function LargeBannerPreview({ banner, theme, onDismiss, compact = false, isPreview }: LargeBannerPreviewProps) {
  const styles = banner.styles
  const textColor = styles?.textColor || '#ffffff'
  const overlayOpacity = (styles?.overlayOpacity ?? 50) / 100
  const objectFit = styles?.objectFit || 'cover'
  const blurPx = styles?.blur ?? 0
  const bgStyle = getBannerBg(styles, theme.primaryColor)
  const bgType = (styles?.bgType as string) || 'solid'
  const useImage = banner.image && (bgType === 'image' || bgType === 'theme' || !styles?.bgType)

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  const height = compact ? '25vh' : '45vh'
  const previewHeight = isPreview ? (compact ? '180px' : '280px') : height
  const titleClass = compact
    ? 'text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3'
    : 'text-2xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4'
  const subtitleClass = compact
    ? 'text-xs sm:text-sm opacity-80 mb-3 max-w-lg mx-auto'
    : 'text-sm sm:text-lg opacity-80 mb-4 max-w-xl mx-auto'

  const previewTitleClass = isPreview
    ? 'text-lg sm:text-xl font-bold mb-2'
    : titleClass
  const previewSubtitleClass = isPreview
    ? 'text-xs sm:text-sm opacity-80 mb-3 max-w-lg mx-auto'
    : subtitleClass

  const ctaBg = styles?.ctaBgColor || theme.primaryColor
  const ctaText = styles?.ctaTextColor || '#ffffff'
  const CtaIcon = getIconComponent(styles?.ctaIcon)

  const ctaClassName = `inline-flex items-center gap-1.5 ${isPreview ? 'px-5 py-2 text-xs' : 'px-6 sm:px-8 py-3 text-sm'} font-semibold transition-all hover:opacity-90 shadow-lg ${btnClass}`
  const ctaStyle = { backgroundColor: ctaBg, color: ctaText }

  return (
    <div className="relative w-full overflow-hidden" style={{ minHeight: previewHeight, ...(isPreview ? { borderRadius: '0.75rem' } : {}) }}>
      {useImage ? (
        <>
          <img
            src={banner.image!}
            alt={banner.title || ''}
            className="absolute inset-0 w-full h-full"
            style={{ objectFit, filter: blurPx > 0 ? `blur(${blurPx}px)` : undefined, transform: blurPx > 0 ? 'scale(1.05)' : undefined }}
          />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}
          />
        </>
      ) : (
        <div className="absolute inset-0" style={bgStyle} />
      )}
      <div
        className="relative z-10 flex flex-col items-center justify-center text-center px-4 sm:px-6"
        style={{ minHeight: previewHeight, color: textColor }}
      >
        <div className="max-w-3xl">
          {banner.title && (
            <h2
              className={previewTitleClass}
              style={{ fontFamily: `'${theme.headingFont}', sans-serif` }}
            >
              {banner.title}
            </h2>
          )}
          {banner.subtitle && (
            <p
              className={previewSubtitleClass}
              style={{ fontFamily: `'${theme.bodyFont}', sans-serif` }}
            >
              {banner.subtitle}
            </p>
          )}
          {banner.contentMode === 'promo' && banner.coupon && (
            <div className="mb-4">
              <span
                className={isPreview
                  ? 'inline-flex items-center px-3 py-1.5 rounded-lg font-mono text-sm font-bold tracking-wider'
                  : 'inline-flex items-center px-4 py-2 rounded-lg font-mono text-lg sm:text-xl font-bold tracking-wider'
                }
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', color: textColor }}
              >
                {banner.coupon.code}
              </span>
            </div>
          )}
          {banner.ctaText && banner.ctaLink && (
            isPreview ? (
              <span className={ctaClassName} style={ctaStyle}>
                  {banner.ctaText}
                  {CtaIcon && <CtaIcon size={isPreview ? 14 : 16} />}
                </span>
            ) : (
              <Link href={banner.ctaLink} className={ctaClassName} style={ctaStyle}>
                  {banner.ctaText}
                  {CtaIcon && <CtaIcon size={16} />}
                </Link>
            )
          )}
        </div>
      </div>
      {banner.dismissable && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-3 right-3 z-20 w-7 h-7 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/30 transition-colors"
          style={{ color: textColor }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
