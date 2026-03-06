'use client'

import { useState } from 'react'
import { CheckCircle, Loader2, RotateCcw } from 'lucide-react'
import { getIconComponent } from '@/components/shared/IconPicker'
import { useStorefrontCartStore } from '@/stores/storefront-cart.store'
import type { StoreThemeData } from '../../../_types'

interface OrderItem {
  productId: string
  productName: string
  variantId?: string | null
  variantName?: string | null
  quantity: number
  unitPrice: number
}

interface TrackActionsSectionProps {
  theme: StoreThemeData
  subdomain: string
  order: {
    id: string
    status: string
    serviceType: string
    createdAt: string
    items?: OrderItem[]
  }
  onMarkPickedUp?: () => Promise<void>
  sectionData?: Record<string, unknown>
}

export function TrackActionsSection({
  theme,
  subdomain,
  order,
  onMarkPickedUp,
  sectionData,
}: TrackActionsSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback
  const [isMarking, setIsMarking] = useState(false)
  const { reorderItems } = useStorefrontCartStore()

  if (s('enabled', true) === false) return null

  const showOrderDate = s('showOrderDate', true) !== false
  const showReorderButton = s('showReorderButton', true) !== false
  const reorderButtonText = (s('reorderButtonText', 'Commander à nouveau') as string)
  const ReorderIcon = getIconComponent(s('reorderButtonIcon', '') as string)

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(date))
  }

  const canMarkAsPickedUp = order.status === 'READY' && order.serviceType === 'PICKUP'
  const isCompleted = ['COMPLETED', 'DELIVERED', 'PICKED_UP'].includes(order.status)

  const handleMarkPickedUp = async () => {
    if (!onMarkPickedUp || isMarking) return
    setIsMarking(true)
    try {
      await onMarkPickedUp()
    } finally {
      setIsMarking(false)
    }
  }

  return (
    <section className="py-6 sm:py-8" style={{ backgroundColor: theme.backgroundColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
        {/* Bouton récupération */}
        {canMarkAsPickedUp && onMarkPickedUp && (
          <button
            onClick={handleMarkPickedUp}
            disabled={isMarking}
            className={`flex items-center justify-center gap-2 w-full py-4 font-semibold text-center text-white shadow-lg hover:shadow-xl hover:opacity-90 transition-all disabled:opacity-50 ${btnClass}`}
            style={{ backgroundColor: '#22c55e' }}
          >
            {isMarking ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <CheckCircle size={18} />
            )}
            J'ai récupéré ma commande
          </button>
        )}

        {/* Date de commande */}
        {showOrderDate && (
          <p 
            className="text-center text-sm opacity-50"
            style={{ color: theme.textColor }}
          >
            Commande passée le {formatDate(order.createdAt)}
          </p>
        )}

        {/* Actions */}
        {showReorderButton && isCompleted && order.items && order.items.length > 0 && (
          <button
            onClick={() => {
              reorderItems(
                order.items!.map(item => ({
                  productId: item.productId,
                  productName: item.productName,
                  variantId: item.variantId,
                  variantName: item.variantName,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                })),
                order.serviceType as 'PICKUP' | 'DELIVERY' | 'DINE_IN'
              )
            }}
            className={`flex items-center justify-center gap-2 w-full py-4 font-semibold text-center text-white shadow-lg hover:shadow-xl hover:opacity-90 transition-all ${btnClass}`}
            style={{ backgroundColor: theme.primaryColor }}
          >
            {ReorderIcon ? <ReorderIcon size={18} /> : <RotateCcw size={18} />}
            {reorderButtonText}
          </button>
        )}
      </div>
    </section>
  )
}
