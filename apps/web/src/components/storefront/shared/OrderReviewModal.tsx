'use client'

import { useState } from 'react'
import { X, Star, Loader2, Truck, UtensilsCrossed, ThumbsUp } from 'lucide-react'
import type { StoreThemeData } from '../themes/_types'

interface OrderReviewModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ReviewData) => Promise<void>
  theme: StoreThemeData
  orderNumber: string
  serviceType: string
}

export interface ReviewData {
  rating: number
  foodRating?: number
  serviceRating?: number
  deliveryRating?: number
  comment?: string
}

export function OrderReviewModal({
  isOpen,
  onClose,
  onSubmit,
  theme,
  orderNumber,
  serviceType,
}: OrderReviewModalProps) {
  const [rating, setRating] = useState(0)
  const [foodRating, setFoodRating] = useState(0)
  const [serviceRating, setServiceRating] = useState(0)
  const [deliveryRating, setDeliveryRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  const handleSubmit = async () => {
    if (rating === 0) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        rating,
        foodRating: foodRating > 0 ? foodRating : undefined,
        serviceRating: serviceRating > 0 ? serviceRating : undefined,
        deliveryRating: serviceType === 'DELIVERY' && deliveryRating > 0 ? deliveryRating : undefined,
        comment: comment.trim() || undefined,
      })
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const StarRating = ({ 
    value, 
    onChange, 
    size = 28,
    showHover = false,
  }: { 
    value: number
    onChange: (v: number) => void
    size?: number
    showHover?: boolean
  }) => {
    const [localHover, setLocalHover] = useState(0)
    const displayValue = showHover ? (localHover || hoverRating || value) : (localHover || value)

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => {
              setLocalHover(star)
              if (showHover) setHoverRating(star)
            }}
            onMouseLeave={() => {
              setLocalHover(0)
              if (showHover) setHoverRating(0)
            }}
            className="transition-transform hover:scale-110"
          >
            <Star
              size={size}
              fill={star <= displayValue ? '#fbbf24' : 'transparent'}
              stroke={star <= displayValue ? '#fbbf24' : `${theme.textColor}40`}
            />
          </button>
        ))}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div 
        className={`relative w-full max-w-md ${btnClass} overflow-hidden`}
        style={{ backgroundColor: theme.backgroundColor, border: '1px solid rgba(255,255,255,0.12)' }}
      >
        <div 
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: `${theme.textColor}10` }}
        >
          <h2 
            className="text-lg font-bold"
            style={{ color: theme.textColor, fontFamily: `'${theme.headingFont}', sans-serif` }}
          >
            Noter la commande #{orderNumber}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-colors hover:bg-black/10"
          >
            <X size={20} style={{ color: theme.textColor }} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          <div className="text-center">
            <p className="text-sm mb-3 opacity-60" style={{ color: theme.textColor }}>
              Note globale
            </p>
            <div className="flex justify-center">
              <StarRating value={rating} onChange={setRating} size={36} showHover />
            </div>
            {rating > 0 && (
              <p className="mt-2 text-sm font-medium" style={{ color: theme.primaryColor }}>
                {rating === 5 ? 'Excellent !' : rating === 4 ? 'Très bien' : rating === 3 ? 'Correct' : rating === 2 ? 'Décevant' : 'Mauvais'}
              </p>
            )}
          </div>

          <div 
            className="grid grid-cols-2 gap-4 pt-4 border-t"
            style={{ borderColor: `${theme.textColor}10` }}
          >
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <UtensilsCrossed size={16} style={{ color: theme.textColor }} className="opacity-60" />
                <span className="text-sm opacity-60" style={{ color: theme.textColor }}>Nourriture</span>
              </div>
              <div className="flex justify-center">
                <StarRating value={foodRating} onChange={setFoodRating} size={20} />
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <ThumbsUp size={16} style={{ color: theme.textColor }} className="opacity-60" />
                <span className="text-sm opacity-60" style={{ color: theme.textColor }}>Service</span>
              </div>
              <div className="flex justify-center">
                <StarRating value={serviceRating} onChange={setServiceRating} size={20} />
              </div>
            </div>
          </div>

          {serviceType === 'DELIVERY' && (
            <div 
              className="text-center pt-4 border-t"
              style={{ borderColor: `${theme.textColor}10` }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Truck size={16} style={{ color: theme.textColor }} className="opacity-60" />
                <span className="text-sm opacity-60" style={{ color: theme.textColor }}>Livraison</span>
              </div>
              <div className="flex justify-center">
                <StarRating value={deliveryRating} onChange={setDeliveryRating} size={24} />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm mb-2 opacity-60" style={{ color: theme.textColor }}>
              Commentaire (optionnel)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez votre expérience..."
              rows={3}
              className={`w-full px-4 py-3 text-sm resize-none ${btnClass}`}
              style={{ 
                backgroundColor: `${theme.textColor}04`,
                color: theme.textColor,
                border: `1px solid ${theme.textColor}15`,
              }}
            />
          </div>
        </div>

        <div 
          className="flex gap-3 p-4 border-t"
          style={{ borderColor: `${theme.textColor}10` }}
        >
          <button
            onClick={onClose}
            className={`flex-1 py-3 text-sm font-medium transition-all hover:opacity-80 ${btnClass}`}
            style={{ backgroundColor: `${theme.textColor}10`, color: theme.textColor }}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className={`flex-1 py-3 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 ${btnClass}`}
            style={{ backgroundColor: theme.primaryColor }}
          >
            {isSubmitting ? (
              <Loader2 size={18} className="animate-spin mx-auto" />
            ) : (
              'Envoyer'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
