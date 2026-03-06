'use client'

import { ArrowUpRight, MapPin, Phone, Mail } from 'lucide-react'
import Link from 'next/link'
import type { FooterProps } from '../_types'

const SOCIAL_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'X',
  tiktok: 'TikTok',
  youtube: 'Youtube',
  linkedin: 'LinkedIn',
  behance: 'Behance',
  pinterest: 'Pinterest',
  snapchat: 'Snapchat',
}

const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

function useSocials(theme: FooterProps['theme']) {
  const socialLinks = (theme.socialLinks || {}) as Record<string, string>
  return Object.entries(socialLinks).filter(([, v]) => v && v.length > 0)
}

function SocialBar({ theme }: { theme: FooterProps['theme'] }) {
  const entries = useSocials(theme)
  if (entries.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
      {entries.map(([key, url]) => (
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs sm:text-sm text-white/40 hover:text-white transition-colors"
        >
          {SOCIAL_LABELS[key] || key}
        </a>
      ))}
    </div>
  )
}

function BottomBar({ theme }: { theme: FooterProps['theme'] }) {
  const year = new Date().getFullYear()
  return (
    <div
      className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <SocialBar theme={theme} />
      <p className="text-xs sm:text-sm text-white/30">
        &copy; {year}. Tous droits réservés.
      </p>
    </div>
  )
}

function PageLinks({ pages }: { pages: FooterProps['pages'] }) {
  if (!pages || pages.length === 0) return null
  return (
    <div className="grid grid-cols-2 gap-x-8 sm:gap-x-12 lg:gap-x-16 gap-y-0 w-full">
      {pages.map((page) => (
        <Link
          key={page.slug}
          href={page.href}
          className="group flex items-center justify-between py-4 sm:py-5 transition-colors"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="text-sm sm:text-base text-white/60 group-hover:text-white transition-colors">
            {page.title}
          </span>
          <ArrowUpRight size={16} className="text-white/30 group-hover:text-white/70 transition-colors flex-shrink-0 ml-3" />
        </Link>
      ))}
    </div>
  )
}

function LogoImages({ restaurant, theme }: { restaurant: FooterProps['restaurant']; theme: FooterProps['theme'] }) {
  if (restaurant.images && restaurant.images.length > 0) {
    return (
      <div className="flex items-center mb-6">
        {restaurant.images.slice(0, 3).map((img, i) => (
          <img
            key={i}
            src={img}
            alt={restaurant.name}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2"
            style={{ borderColor: '#0C0C0C', marginLeft: i > 0 ? '-10px' : '0', zIndex: 3 - i, position: 'relative' }}
          />
        ))}
      </div>
    )
  }
  if (restaurant.logo) {
    return (
      <img
        src={restaurant.logo}
        alt={restaurant.name}
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover mb-6"
      />
    )
  }
  return (
    <div
      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-bold text-lg mb-6"
      style={{ backgroundColor: theme.primaryColor, color: '#0C0C0C' }}
    >
      {restaurant.name.substring(0, 2).toUpperCase()}
    </div>
  )
}

function Tagline({ restaurant, theme }: { restaurant: FooterProps['restaurant']; theme: FooterProps['theme'] }) {
  const text = theme.footerText || restaurant.shortDescription || restaurant.name
  return (
    <p
      className="text-xl sm:text-2xl lg:text-3xl font-medium leading-snug max-w-sm"
      style={{ fontFamily: `'${theme.headingFont}', serif`, color: theme.primaryColor }}
    >
      {text}
    </p>
  )
}

function StandardFooter({ restaurant, theme, pages }: FooterProps) {
  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 py-12 sm:py-16 lg:py-20">
        <div
          className="flex flex-col justify-center pr-0 md:pr-12 lg:pr-20 pb-10 md:pb-0 border-b md:border-b-0 md:border-r"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <LogoImages restaurant={restaurant} theme={theme} />
          <Tagline restaurant={restaurant} theme={theme} />
        </div>

        <div className="flex items-center pl-0 md:pl-12 lg:pl-20 pt-10 md:pt-0">
          <PageLinks pages={pages} />
        </div>
      </div>
      <BottomBar theme={theme} />
    </div>
  )
}

function MinimalFooter({ restaurant, theme, pages }: FooterProps) {
  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
      <div className="py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {restaurant.logo ? (
              <img src={restaurant.logo} alt={restaurant.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ backgroundColor: theme.primaryColor, color: '#0C0C0C' }}
              >
                {restaurant.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <span
              className="font-semibold text-base text-white"
              style={{ fontFamily: `'${theme.headingFont}', serif` }}
            >
              {restaurant.name}
            </span>
          </div>

          {pages && pages.length > 0 && (
            <div className="flex flex-wrap items-center gap-6">
              {pages.map((page) => (
                <Link
                  key={page.slug}
                  href={page.href}
                  className="text-sm text-white/50 hover:text-white transition-colors"
                >
                  {page.title}
                </Link>
              ))}
            </div>
          )}
        </div>

        {theme.footerText && (
          <p className="text-sm text-white/30 mt-4 max-w-lg">
            {theme.footerText}
          </p>
        )}
      </div>
      <BottomBar theme={theme} />
    </div>
  )
}

function CenteredFooter({ restaurant, theme, openingHours, pages }: FooterProps) {
  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
      <div className="py-12 sm:py-16 lg:py-20 flex flex-col items-center text-center">
        <LogoImages restaurant={restaurant} theme={theme} />

        <h3
          className="text-lg sm:text-xl font-semibold text-white mb-2"
          style={{ fontFamily: `'${theme.headingFont}', serif` }}
        >
          {restaurant.name}
        </h3>

        {theme.footerText && (
          <p className="text-sm text-white/40 max-w-md mb-8">
            {theme.footerText}
          </p>
        )}

        {pages && pages.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mb-8">
            {pages.map((page) => (
              <Link
                key={page.slug}
                href={page.href}
                className="group flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors"
              >
                {page.title}
                <ArrowUpRight size={14} className="text-white/20 group-hover:text-white/60 transition-colors" />
              </Link>
            ))}
          </div>
        )}

        <div
          className="w-full max-w-lg pt-6 mb-6"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-white/40">
            {restaurant.address && (
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="flex-shrink-0" />
                {restaurant.city}
              </span>
            )}
            {restaurant.phone && (
              <a href={`tel:${restaurant.phone}`} className="flex items-center gap-1.5 hover:text-white/60 transition-colors">
                <Phone size={14} className="flex-shrink-0" />
                {restaurant.phone}
              </a>
            )}
            {restaurant.email && (
              <a href={`mailto:${restaurant.email}`} className="flex items-center gap-1.5 hover:text-white/60 transition-colors">
                <Mail size={14} className="flex-shrink-0" />
                {restaurant.email}
              </a>
            )}
          </div>
        </div>

        {openingHours.length > 0 && (
          <div className="w-full max-w-xs mb-6">
            <p
              className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3"
              style={{ fontFamily: `'${theme.headingFont}', serif` }}
            >
              Horaires
            </p>
            <div className="space-y-1">
              {openingHours.map(oh => (
                <div key={oh.dayOfWeek} className="flex items-center justify-between text-xs">
                  <span className="text-white/40">{DAY_NAMES[oh.dayOfWeek]}</span>
                  {oh.isOpen && oh.slots.length > 0 ? (
                    <span className="text-white/60">
                      {oh.slots.map(s => `${s.openTime} - ${s.closeTime}`).join(', ')}
                    </span>
                  ) : (
                    <span className="text-white/20">Fermé</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <BottomBar theme={theme} />
    </div>
  )
}

export function Footer(props: FooterProps) {
  const design = props.theme.footerDesign || 'standard'

  return (
    <footer style={{ backgroundColor: '#0e1416' }}>
      {design === 'minimal' && <MinimalFooter {...props} />}
      {design === 'centered' && <CenteredFooter {...props} />}
      {design !== 'minimal' && design !== 'centered' && <StandardFooter {...props} />}
    </footer>
  )
}
