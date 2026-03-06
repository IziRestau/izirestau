'use client'

import { MapPin, Phone, Mail, Globe } from 'lucide-react'
import type { FooterProps } from '../_types'

const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

function LogoBlock({ restaurant, theme }: { restaurant: FooterProps['restaurant']; theme: FooterProps['theme'] }) {
  return (
    <div className="flex items-center gap-3">
      {restaurant.logo ? (
        <img src={restaurant.logo} alt={restaurant.name} className="h-10 w-10 rounded-xl object-cover" />
      ) : (
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: theme.primaryColor }}
        >
          {restaurant.name.substring(0, 2).toUpperCase()}
        </div>
      )}
      <span
        className="font-bold text-lg"
        style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
      >
        {restaurant.name}
      </span>
    </div>
  )
}

function SocialLinks({ theme }: { theme: FooterProps['theme'] }) {
  const socialLinks = (theme.socialLinks || {}) as Record<string, string>
  const entries = Object.entries(socialLinks).filter(([, v]) => v && v.length > 0)
  if (entries.length === 0) return null

  return (
    <div className="flex items-center gap-3">
      {entries.map(([key, url]) => (
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
          style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}
        >
          <Globe size={16} />
        </a>
      ))}
    </div>
  )
}

function ContactInfo({ restaurant, theme }: { restaurant: FooterProps['restaurant']; theme: FooterProps['theme'] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2.5 text-sm opacity-60" style={{ color: theme.textColor }}>
        <MapPin size={16} className="flex-shrink-0 mt-0.5" />
        <span>{restaurant.address}, {restaurant.city} {restaurant.postalCode}</span>
      </div>
      <div className="flex items-center gap-2.5 text-sm opacity-60" style={{ color: theme.textColor }}>
        <Phone size={16} className="flex-shrink-0" />
        <a href={`tel:${restaurant.phone}`} className="hover:opacity-80">{restaurant.phone}</a>
      </div>
      <div className="flex items-center gap-2.5 text-sm opacity-60" style={{ color: theme.textColor }}>
        <Mail size={16} className="flex-shrink-0" />
        <a href={`mailto:${restaurant.email}`} className="hover:opacity-80">{restaurant.email}</a>
      </div>
      {restaurant.website && (
        <div className="flex items-center gap-2.5 text-sm opacity-60" style={{ color: theme.textColor }}>
          <Globe size={16} className="flex-shrink-0" />
          <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="hover:opacity-80">{restaurant.website}</a>
        </div>
      )}
    </div>
  )
}

function OpeningHoursBlock({ openingHours, theme }: { openingHours: FooterProps['openingHours']; theme: FooterProps['theme'] }) {
  return (
    <div className="space-y-1.5">
      {openingHours.map(oh => (
        <div key={oh.dayOfWeek} className="flex items-center justify-between text-sm" style={{ color: theme.textColor }}>
          <span className="opacity-60">{DAY_NAMES[oh.dayOfWeek]}</span>
          {oh.isOpen && oh.slots.length > 0 ? (
            <span className="font-medium opacity-80">
              {oh.slots.map(s => `${s.openTime} - ${s.closeTime}`).join(', ')}
            </span>
          ) : (
            <span className="opacity-40">Fermé</span>
          )}
        </div>
      ))}
    </div>
  )
}

function PoweredBy({ theme }: { theme: FooterProps['theme'] }) {
  return (
    <div
      className="border-t px-4 sm:px-6 py-4 text-center"
      style={{ borderColor: `${theme.textColor}08` }}
    >
      <p className="text-xs opacity-30" style={{ color: theme.textColor }}>
        Propulsé par IziResto
      </p>
    </div>
  )
}

function MinimalFooter({ restaurant, theme }: FooterProps) {
  return (
    <footer
      className="border-t"
      style={{ borderColor: `${theme.textColor}10`, backgroundColor: `${theme.textColor}05` }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span
              className="font-semibold text-sm"
              style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
            >
              {restaurant.name}
            </span>
            {theme.footerText && (
              <span className="text-sm opacity-50 hidden sm:inline" style={{ color: theme.textColor }}>
                {theme.footerText}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {restaurant.phone && (
              <a href={`tel:${restaurant.phone}`} className="text-sm opacity-50 hover:opacity-80 transition-opacity" style={{ color: theme.textColor }}>
                {restaurant.phone}
              </a>
            )}
            {restaurant.email && (
              <a href={`mailto:${restaurant.email}`} className="text-sm opacity-50 hover:opacity-80 transition-opacity" style={{ color: theme.textColor }}>
                {restaurant.email}
              </a>
            )}
            <SocialLinks theme={theme} />
          </div>
        </div>
      </div>
      <PoweredBy theme={theme} />
    </footer>
  )
}

function CenteredFooter({ restaurant, theme, openingHours }: FooterProps) {
  return (
    <footer
      className="border-t"
      style={{ borderColor: `${theme.textColor}10`, backgroundColor: `${theme.textColor}05` }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="flex flex-col items-center text-center gap-5">
          <LogoBlock restaurant={restaurant} theme={theme} />

          {theme.footerText && (
            <p className="text-sm opacity-60 max-w-md" style={{ color: theme.textColor }}>
              {theme.footerText}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm opacity-60" style={{ color: theme.textColor }}>
            {restaurant.phone && (
              <a href={`tel:${restaurant.phone}`} className="flex items-center gap-1.5 hover:opacity-80">
                <Phone size={14} /> {restaurant.phone}
              </a>
            )}
            {restaurant.email && (
              <a href={`mailto:${restaurant.email}`} className="flex items-center gap-1.5 hover:opacity-80">
                <Mail size={14} /> {restaurant.email}
              </a>
            )}
            <span className="flex items-center gap-1.5">
              <MapPin size={14} /> {restaurant.city}
            </span>
          </div>

          <SocialLinks theme={theme} />
        </div>
      </div>
      <PoweredBy theme={theme} />
    </footer>
  )
}

function StandardFooter({ restaurant, theme, openingHours }: FooterProps) {
  return (
    <footer
      className="border-t"
      style={{ borderColor: `${theme.textColor}10`, backgroundColor: `${theme.textColor}05` }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          <div>
            <div className="mb-4">
              <LogoBlock restaurant={restaurant} theme={theme} />
            </div>
            {theme.footerText && (
              <p className="text-sm opacity-60 mb-4" style={{ color: theme.textColor }}>
                {theme.footerText}
              </p>
            )}
            <SocialLinks theme={theme} />
          </div>

          <div>
            <h3
              className="font-semibold text-sm mb-4"
              style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
            >
              Contact
            </h3>
            <ContactInfo restaurant={restaurant} theme={theme} />
          </div>

          <div>
            <h3
              className="font-semibold text-sm mb-4"
              style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
            >
              Horaires
            </h3>
            <OpeningHoursBlock openingHours={openingHours} theme={theme} />
          </div>
        </div>
      </div>
      <PoweredBy theme={theme} />
    </footer>
  )
}

export function Footer(props: FooterProps) {
  const design = props.theme.footerDesign || 'standard'

  if (design === 'minimal') return <MinimalFooter {...props} />
  if (design === 'centered') return <CenteredFooter {...props} />
  return <StandardFooter {...props} />
}
