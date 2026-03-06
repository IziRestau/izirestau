'use client'

import { useState } from 'react'
import { Receipt, ChevronDown } from 'lucide-react'
import type { StoreThemeData, StoreSettingsData } from '../../../_types'

interface OrderItem {
  id: string
  productName: string
  variantName: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface TrackOrderDetailsSectionProps {
  theme: StoreThemeData
  settings: StoreSettingsData
  order: {
    subtotal: number
    taxAmount: number
    total: number
    items: OrderItem[]
  }
  sectionData?: Record<string, unknown>
}

export function TrackOrderDetailsSection({
  theme,
  settings,
  order,
  sectionData,
}: TrackOrderDetailsSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const defaultExpanded = s('defaultExpanded', false) === true
  const showSubtotal = s('showSubtotal', true) !== false
  const showTaxes = s('showTaxes', true) !== false

  const [showDetails, setShowDetails] = useState(defaultExpanded)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: settings.currency || 'XOF' 
    }).format(price)
  }

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  return (
    <section className="py-4 sm:py-6" style={{ backgroundColor: theme.backgroundColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div 
          className={`overflow-hidden ${btnClass}`}
          style={{ backgroundColor: `${theme.textColor}04` }}
        >
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full p-4 sm:p-5 flex items-center justify-between hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${theme.primaryColor}15` }}
              >
                <Receipt size={20} style={{ color: theme.primaryColor }} />
              </div>
              <span 
                className="font-semibold"
                style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
              >
                Détails de la commande
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold" style={{ color: theme.primaryColor }}>
                {formatPrice(order.total)}
              </span>
              <ChevronDown 
                size={20}
                className={`transition-transform ${showDetails ? 'rotate-180' : ''}`}
                style={{ color: `${theme.textColor}40` }}
              />
            </div>
          </button>

          {showDetails && (
            <div style={{ borderTop: `1px solid ${theme.textColor}10` }}>
              <div>
                {order.items.map((item, index) => (
                  <div 
                    key={item.id} 
                    className="p-4 sm:p-5 flex justify-between items-start"
                    style={{ borderTop: index > 0 ? `1px solid ${theme.textColor}08` : undefined }}
                  >
                    <div className="flex items-start gap-3">
                      <span 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: theme.primaryColor }}
                      >
                        {item.quantity}
                      </span>
                      <div>
                        <p className="font-medium" style={{ color: theme.textColor }}>{item.productName}</p>
                        {item.variantName && (
                          <p className="text-sm opacity-60" style={{ color: theme.textColor }}>{item.variantName}</p>
                        )}
                      </div>
                    </div>
                    <p className="font-semibold" style={{ color: theme.textColor }}>{formatPrice(item.totalPrice)}</p>
                  </div>
                ))}
              </div>
              
              <div 
                className="p-4 sm:p-5"
                style={{ backgroundColor: `${theme.textColor}04`, borderTop: `1px solid ${theme.textColor}10` }}
              >
                {showSubtotal && (
                  <div className="flex justify-between items-center text-sm mb-2 opacity-70" style={{ color: theme.textColor }}>
                    <span>Sous-total</span>
                    <span>{formatPrice(order.subtotal)}</span>
                  </div>
                )}
                {showTaxes && order.taxAmount > 0 && (
                  <div className="flex justify-between items-center text-sm mb-2 opacity-70" style={{ color: theme.textColor }}>
                    <span>Taxes</span>
                    <span>{formatPrice(order.taxAmount)}</span>
                  </div>
                )}
                <div 
                  className="flex justify-between items-center pt-2"
                  style={{ borderTop: `1px solid ${theme.textColor}15` }}
                >
                  <span className="font-bold" style={{ color: theme.textColor }}>Total</span>
                  <span className="text-xl font-bold" style={{ color: theme.primaryColor }}>
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
