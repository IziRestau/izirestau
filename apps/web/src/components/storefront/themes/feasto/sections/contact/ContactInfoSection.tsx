'use client'

import { MapPin, Phone, Mail, Clock, Truck, Globe } from 'lucide-react'
import { getIconComponent } from '@/components/shared/IconPicker'
import type { StoreRestaurantData, StoreThemeData, StoreOpeningHour, StoreDeliveryData } from '../../../_types'

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

interface ContactInfoSectionProps {
  restaurant: StoreRestaurantData
  theme: StoreThemeData
  openingHours: StoreOpeningHour[]
  delivery: StoreDeliveryData | null
  sectionData?: Record<string, unknown>
}

export function ContactInfoSection({
  restaurant,
  theme,
  openingHours,
  delivery,
  sectionData,
}: ContactInfoSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  const showAddress = s('showAddress', true) !== false
  const showPhone = s('showPhone', true) !== false
  const showEmail = s('showEmail', true) !== false
  const showWebsite = s('showWebsite', true) !== false
  const showDeliveryInfo = s('showDeliveryInfo', true) !== false
  const showOpeningHours = s('showOpeningHours', true) !== false

  const AddressIcon = getIconComponent(s('addressIcon', '') as string) || MapPin
  const PhoneIcon = getIconComponent(s('phoneIcon', '') as string) || Phone
  const EmailIcon = getIconComponent(s('emailIcon', '') as string) || Mail
  const WebsiteIcon = getIconComponent(s('websiteIcon', '') as string) || Globe
  const DeliveryIcon = getIconComponent(s('deliveryIcon', '') as string) || Truck
  const HoursIcon = getIconComponent(s('hoursIcon', '') as string) || Clock

  const today = new Date().getDay()
  const sortedHours = [...openingHours].sort((a, b) => {
    const order = [1, 2, 3, 4, 5, 6, 0]
    return order.indexOf(a.dayOfWeek) - order.indexOf(b.dayOfWeek)
  })

  const iconBox = (icon: React.ReactNode) => (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: `${theme.primaryColor}15` }}
    >
      {icon}
    </div>
  )

  return (
    <div className="space-y-6">
      {showAddress && (
        <div className="flex items-start gap-4">
          {iconBox(<AddressIcon size={18} style={{ color: theme.primaryColor }} />)}
          <div>
            <h3 className="text-sm font-semibold text-white">Adresse</h3>
            <p className="text-sm mt-1 text-white/50">
              {restaurant.address}
              {restaurant.addressLine2 && <><br />{restaurant.addressLine2}</>}
              <br />{restaurant.postalCode} {restaurant.city}
            </p>
          </div>
        </div>
      )}

      {showPhone && restaurant.phone && (
        <div className="flex items-start gap-4">
          {iconBox(<PhoneIcon size={18} style={{ color: theme.primaryColor }} />)}
          <div>
            <h3 className="text-sm font-semibold text-white">Téléphone</h3>
            <a
              href={`tel:${restaurant.phone}`}
              className="text-sm mt-1 text-white/50 hover:text-white/70 transition-colors block"
            >
              {restaurant.phone}
            </a>
          </div>
        </div>
      )}

      {showEmail && restaurant.email && (
        <div className="flex items-start gap-4">
          {iconBox(<EmailIcon size={18} style={{ color: theme.primaryColor }} />)}
          <div>
            <h3 className="text-sm font-semibold text-white">Email</h3>
            <a
              href={`mailto:${restaurant.email}`}
              className="text-sm mt-1 text-white/50 hover:text-white/70 transition-colors block"
            >
              {restaurant.email}
            </a>
          </div>
        </div>
      )}

      {showWebsite && restaurant.website && (
        <div className="flex items-start gap-4">
          {iconBox(<WebsiteIcon size={18} style={{ color: theme.primaryColor }} />)}
          <div>
            <h3 className="text-sm font-semibold text-white">Site web</h3>
            <a
              href={restaurant.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm mt-1 text-white/50 hover:text-white/70 transition-colors block"
            >
              {restaurant.website}
            </a>
          </div>
        </div>
      )}

      {showDeliveryInfo && delivery?.isEnabled && (
        <div className="flex items-start gap-4">
          {iconBox(<DeliveryIcon size={18} style={{ color: theme.primaryColor }} />)}
          <div>
            <h3 className="text-sm font-semibold text-white">Livraison</h3>
            <p className="text-sm mt-1 text-white/50">
              Temps moyen : ~{delivery.avgDeliveryTime} min
            </p>
          </div>
        </div>
      )}

      {showOpeningHours && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            {iconBox(<HoursIcon size={18} style={{ color: theme.primaryColor }} />)}
            <h3 className="text-sm font-semibold text-white">
              Horaires d&apos;ouverture
            </h3>
          </div>
          <div className="space-y-2 ml-[52px]">
            {sortedHours.map(oh => (
              <div
                key={oh.dayOfWeek}
                className={`flex items-center justify-between text-sm py-1.5 px-3 rounded-lg ${
                  oh.dayOfWeek === today ? 'font-medium' : ''
                }`}
                style={{
                  color: oh.dayOfWeek === today ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)',
                  backgroundColor: oh.dayOfWeek === today ? `${theme.primaryColor}10` : 'transparent',
                }}
              >
                <span>{DAY_NAMES[oh.dayOfWeek]}</span>
                <span>
                  {oh.isOpen && oh.slots.length > 0
                    ? oh.slots.map(sl => `${sl.openTime} - ${sl.closeTime}`).join(', ')
                    : 'Fermé'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
