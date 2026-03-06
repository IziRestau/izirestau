'use client'

import { CheckCircle, Clock, MapPin, Store, UtensilsCrossed, ArrowRight, UserPlus, Navigation } from 'lucide-react'
import Link from 'next/link'
import type { StoreThemeData, StoreSettingsData } from '../../../_types'
import { useStorefrontAuthStore } from '@/stores/storefront-auth.store'

interface OrderData {
  id: string
  orderNumber: string
  status: string
  serviceType: string
  estimatedTime?: number
  total: number
  items: { productName: string; quantity: number; totalPrice: number }[]
}

interface ThanksConfirmationSectionProps {
  theme: StoreThemeData
  settings: StoreSettingsData
  subdomain: string
  order: OrderData
  sectionData?: Record<string, unknown>
}

export function ThanksConfirmationSection({
  theme,
  settings,
  subdomain,
  order,
  sectionData,
}: ThanksConfirmationSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  const { isAuthenticated } = useStorefrontAuthStore()

  const showOrderNumber = s('showOrderNumber', true) !== false
  const showEstimatedTime = s('showEstimatedTime', true) !== false
  const showTrackingLink = s('showTrackingLink', true) !== false
  const showCreateAccountPrompt = s('showCreateAccountPrompt', true) !== false && !isAuthenticated
  const showContinueShoppingBtn = s('showContinueShoppingBtn', true) !== false
  const showOrderSummary = s('showOrderSummary', true) !== false

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-2xl'

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: settings.currency || 'XOF' }).format(price)
  }

  const getServiceTypeIcon = (type: string) => {
    switch (type) {
      case 'DELIVERY': return MapPin
      case 'PICKUP': return Store
      case 'DINE_IN': return UtensilsCrossed
      default: return Store
    }
  }

  const getServiceTypeLabel = (type: string) => {
    switch (type) {
      case 'DELIVERY': return 'Livraison'
      case 'PICKUP': return 'À emporter'
      case 'DINE_IN': return 'Sur place'
      default: return type
    }
  }

  const getServiceTypeMessage = (type: string) => {
    switch (type) {
      case 'DELIVERY': return 'Votre commande sera livrée à l\'adresse indiquée'
      case 'PICKUP': return 'Présentez-vous au restaurant pour récupérer votre commande'
      case 'DINE_IN': return 'Votre commande vous sera servie sur place'
      default: return ''
    }
  }

  const ServiceIcon = getServiceTypeIcon(order.serviceType)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      {/* Order number card */}
      {showOrderNumber && (
        <div 
          className={`p-6 mb-4 text-center ${btnClass}`}
          style={{ backgroundColor: `${theme.primaryColor}10`, border: `2px solid ${theme.primaryColor}30` }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle size={20} style={{ color: theme.primaryColor }} />
            <span className="text-sm font-medium" style={{ color: theme.primaryColor }}>
              Commande confirmée
            </span>
          </div>
          <p className="text-3xl sm:text-4xl font-bold" style={{ color: theme.primaryColor }}>
            #{order.orderNumber}
          </p>
          {showEstimatedTime && order.estimatedTime && (
            <div 
              className="flex items-center justify-center gap-2 mt-3 text-sm"
              style={{ color: theme.textColor }}
            >
              <Clock size={16} />
              <span>Temps estimé : <strong>{order.estimatedTime} min</strong></span>
            </div>
          )}
        </div>
      )}

      {/* Service type info */}
      <div 
        className={`p-5 mb-4 ${btnClass}`}
        style={{ backgroundColor: `${theme.textColor}04`, border: '1px solid rgba(255,255,255,0.12)' }}
      >
        <div className="flex items-center gap-4">
          <div 
            className={`w-12 h-12 flex items-center justify-center flex-shrink-0 ${btnClass}`}
            style={{ backgroundColor: `${theme.primaryColor}15` }}
          >
            <ServiceIcon size={22} style={{ color: theme.primaryColor }} />
          </div>
          <div>
            <p className="font-semibold" style={{ color: theme.textColor }}>
              {getServiceTypeLabel(order.serviceType)}
            </p>
            <p className="text-sm opacity-60" style={{ color: theme.textColor }}>
              {getServiceTypeMessage(order.serviceType)}
            </p>
          </div>
        </div>
      </div>

      {/* Order summary */}
      {showOrderSummary && (
        <div 
          className={`p-5 mb-4 ${btnClass}`}
          style={{ backgroundColor: `${theme.textColor}04`, border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <h3 
            className="font-bold mb-4"
            style={{ color: theme.textColor, fontFamily: `'${theme.headingFont}', sans-serif` }}
          >
            Récapitulatif
          </h3>
          <div className="space-y-2 mb-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span style={{ color: theme.textColor }}>
                  <span className="font-medium">{item.quantity}x</span> {item.productName}
                </span>
                <span className="font-medium" style={{ color: theme.textColor }}>
                  {formatPrice(item.totalPrice)}
                </span>
              </div>
            ))}
          </div>
          <div 
            className="border-t pt-3 flex justify-between"
            style={{ borderColor: `${theme.textColor}15` }}
          >
            <span className="font-bold" style={{ color: theme.textColor }}>Total</span>
            <span className="font-bold text-lg" style={{ color: theme.primaryColor }}>
              {formatPrice(order.total)}
            </span>
          </div>
        </div>
      )}

      {/* Create account prompt */}
      {showCreateAccountPrompt && (
        <div 
          className={`p-5 mb-4 ${btnClass}`}
          style={{ backgroundColor: `${theme.primaryColor}08`, border: `1px solid ${theme.primaryColor}20` }}
        >
          <div className="flex items-start gap-4">
            <div 
              className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${btnClass}`}
              style={{ backgroundColor: `${theme.primaryColor}15` }}
            >
              <UserPlus size={18} style={{ color: theme.primaryColor }} />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1" style={{ color: theme.textColor }}>
                Créez votre compte
              </h4>
              <p className="text-sm opacity-60 mb-3" style={{ color: theme.textColor }}>
                Suivez vos commandes et gagnez des points fidélité
              </p>
              <Link
                href={`/store/${subdomain}/register`}
                className="inline-flex items-center gap-2 text-sm font-semibold"
                style={{ color: theme.primaryColor }}
              >
                Créer un compte <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-3">
        {showTrackingLink && (
          <Link
            href={`/store/${subdomain}/track/${order.id}`}
            className={`flex items-center justify-center gap-2 w-full py-4 font-bold text-white transition-all hover:opacity-90 ${btnClass}`}
            style={{ backgroundColor: theme.primaryColor }}
          >
            <Navigation size={18} />
            Suivre ma commande
          </Link>
        )}

        {showContinueShoppingBtn && (
          <Link
            href={`/store/${subdomain}/menu`}
            className={`block w-full py-4 font-semibold text-center transition-all hover:opacity-80 ${btnClass}`}
            style={{ 
              backgroundColor: `${theme.textColor}08`,
              color: theme.textColor 
            }}
          >
            Retour au menu
          </Link>
        )}
      </div>
    </div>
  )
}
