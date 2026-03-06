'use client'

import { CheckCircle, Clock, MapPin, Phone, ArrowRight, UserPlus } from 'lucide-react'
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

  const layout = (s('layout', 'centered') as string)
  const showOrderNumber = s('showOrderNumber', true) !== false
  const showEstimatedTime = s('showEstimatedTime', true) !== false
  const showTrackingLink = s('showTrackingLink', true) !== false
  const showCreateAccountPrompt = s('showCreateAccountPrompt', true) !== false && !isAuthenticated
  const showContinueShoppingBtn = s('showContinueShoppingBtn', true) !== false
  const continueShoppingText = (s('continueShoppingText', 'Retour au menu') as string)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: settings.currency || 'XOF' }).format(price)
  }

  const getServiceTypeLabel = (type: string) => {
    switch (type) {
      case 'DELIVERY': return 'Livraison'
      case 'PICKUP': return 'À emporter'
      case 'DINE_IN': return 'Sur place'
      default: return type
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${theme.primaryColor}15` }}>
          <CheckCircle size={32} style={{ color: theme.primaryColor }} />
        </div>

        {showOrderNumber && (
          <div className="mb-4">
            <p className="text-sm opacity-60" style={{ color: theme.textColor }}>Numéro de commande</p>
            <p className="text-2xl font-bold" style={{ color: theme.primaryColor }}>#{order.orderNumber}</p>
          </div>
        )}

        {showEstimatedTime && order.estimatedTime && (
          <div className="flex items-center justify-center gap-2 text-sm" style={{ color: theme.textColor }}>
            <Clock size={16} />
            <span>Temps estimé : {order.estimatedTime} min</span>
          </div>
        )}
      </div>

      {layout === 'with-summary' && (
        <div className="rounded-xl border p-4 sm:p-6 mb-6" style={{ borderColor: `${theme.textColor}15` }}>
          <h3 className="font-semibold mb-4" style={{ color: theme.textColor, fontFamily: `'${theme.headingFont}', sans-serif` }}>
            Récapitulatif
          </h3>
          <div className="space-y-3 mb-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span style={{ color: theme.textColor }}>{item.quantity}x {item.productName}</span>
                <span style={{ color: theme.textColor }}>{formatPrice(item.totalPrice)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 flex justify-between font-semibold" style={{ borderColor: `${theme.textColor}15` }}>
            <span style={{ color: theme.textColor }}>Total</span>
            <span style={{ color: theme.primaryColor }}>{formatPrice(order.total)}</span>
          </div>
        </div>
      )}

      <div className="rounded-xl border p-4 sm:p-6 mb-6" style={{ borderColor: `${theme.textColor}15` }}>
        <div className="flex items-center gap-3 mb-3">
          {order.serviceType === 'DELIVERY' ? <MapPin size={20} style={{ color: theme.primaryColor }} /> : <Phone size={20} style={{ color: theme.primaryColor }} />}
          <span className="font-medium" style={{ color: theme.textColor }}>{getServiceTypeLabel(order.serviceType)}</span>
        </div>
        <p className="text-sm opacity-70" style={{ color: theme.textColor }}>
          {order.serviceType === 'DELIVERY' 
            ? 'Votre commande sera livrée à l\'adresse indiquée.'
            : order.serviceType === 'PICKUP'
            ? 'Présentez-vous au restaurant pour récupérer votre commande.'
            : 'Votre commande vous sera servie sur place.'}
        </p>
      </div>

      {showCreateAccountPrompt && (
        <div className="rounded-xl border p-4 sm:p-6 mb-6" style={{ borderColor: `${theme.primaryColor}30`, backgroundColor: `${theme.primaryColor}08` }}>
          <div className="flex items-start gap-3">
            <UserPlus size={24} style={{ color: theme.primaryColor }} />
            <div>
              <h4 className="font-semibold mb-1" style={{ color: theme.textColor }}>Créez votre compte</h4>
              <p className="text-sm opacity-70 mb-3" style={{ color: theme.textColor }}>
                Suivez vos commandes et gagnez des points fidélité
              </p>
              <Link
                href={`/store/${subdomain}/register`}
                className="inline-flex items-center gap-2 text-sm font-medium"
                style={{ color: theme.primaryColor }}
              >
                Créer un compte <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {showTrackingLink && (
        <Link
          href={`/store/${subdomain}/track/${order.id}`}
          className="block w-full py-3 rounded-lg font-semibold text-center mb-3 border-2"
          style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
        >
          Suivre ma commande
        </Link>
      )}

      {showContinueShoppingBtn && (
        <Link
          href={`/store/${subdomain}/menu`}
          className="block w-full py-3 rounded-lg font-semibold text-white text-center"
          style={{ backgroundColor: theme.primaryColor }}
        >
          {continueShoppingText}
        </Link>
      )}
    </div>
  )
}
