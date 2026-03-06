'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Minus, Plus, ShoppingBag, Trash2, ArrowLeft } from 'lucide-react'
import { useStorefrontCartStore } from '@/stores/storefront-cart.store'
import type { CartDrawerProps } from '../_types'

export function CartDrawer({ theme, settings, isOpen, onClose, onCheckout, sectionData }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, clearCart, getSubtotal } = useStorefrontCartStore()
  const currency = settings?.currency || 'XOF'

  const s = <T,>(key: string, fallback: T): T => (sectionData?.[key] as T) ?? fallback

  const cartType = s('cartType', 'drawer') as 'drawer' | 'modal' | 'mini'
  const drawerPosition = s('drawerPosition', 'right') as 'left' | 'right'
  const drawerWidth = s('drawerWidth', 'md') as 'sm' | 'md' | 'lg'
  const itemLayout = s('itemLayout', 'detailed') as 'detailed' | 'compact' | 'minimal'
  const showItemImages = s('showItemImages', true)
  const imageSize = s('imageSize', 'md') as 'sm' | 'md' | 'lg'
  const showVariants = s('showVariants', true)
  const showModifiers = s('showModifiers', true)
  const showUnitPrice = s('showUnitPrice', false)
  const quantityControlStyle = s('quantityControlStyle', 'inline') as 'inline' | 'stepper' | 'input'
  const allowRemoveFromCart = s('allowRemoveFromCart', true)
  const showClearCartButton = s('showClearCartButton', true)
  const showSubtotal = s('showSubtotal', true)
  const showItemCount = s('showItemCount', true)
  const checkoutButtonText = s('checkoutButtonText', 'Commander')
  const showCheckoutButtonPrice = s('showCheckoutButtonPrice', true)
  const emptyCartTitle = s('emptyCartTitle', 'Votre panier est vide')
  const emptyCartMessage = s('emptyCartMessage', 'Ajoutez des articles depuis le menu')
  const showContinueShoppingButton = s('showContinueShoppingButton', false)
  const enableAnimations = s('enableAnimations', true)
  const animationSpeed = s('animationSpeed', 'normal') as 'fast' | 'normal' | 'slow'
  const showBackdrop = s('showBackdrop', true)
  const backdropBlur = s('backdropBlur', true)
  const closeOnBackdropClick = s('closeOnBackdropClick', true)

  const widthClasses = { sm: 'sm:max-w-xs', md: 'sm:max-w-md', lg: 'sm:max-w-lg' }
  const imageSizes = { sm: 'w-12 h-12', md: 'w-16 h-16', lg: 'w-20 h-20' }
  const animationDurations = { fast: 'duration-200', normal: 'duration-300', slow: 'duration-500' }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const subtotal = getSubtotal()

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  const [visible, setVisible] = useState(false)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setVisible(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimating(true))
      })
    } else {
      setAnimating(false)
    }
  }, [isOpen])

  const handleTransitionEnd = useCallback(() => {
    if (!animating) {
      setVisible(false)
    }
  }, [animating])

  if (!visible) return null

  const translateDirection = drawerPosition === 'right' ? 'translateX(100%)' : 'translateX(-100%)'
  const justifyClass = drawerPosition === 'right' ? 'justify-end' : 'justify-start'

  const modalWidthClasses = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }

  const renderQuantityControl = (item: typeof items[0]) => {
    if (quantityControlStyle === 'input') {
      return (
        <input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) => updateQuantity(item.cartId, parseInt(e.target.value) || 1)}
          className={`w-14 h-8 text-center text-xs font-semibold border ${btnClass}`}
          style={{ borderColor: `${theme.textColor}15`, color: theme.textColor, backgroundColor: 'transparent' }}
        />
      )
    }

    if (quantityControlStyle === 'stepper') {
      return (
        <div
          className={`flex flex-col border ${btnClass}`}
          style={{ borderColor: `${theme.textColor}15` }}
        >
          <button
            onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
            className="w-7 h-5 flex items-center justify-center transition-colors hover:opacity-70 border-b"
            style={{ color: theme.textColor, borderColor: `${theme.textColor}15` }}
          >
            <Plus size={10} />
          </button>
          <span className="w-7 h-5 flex items-center justify-center text-xs font-semibold" style={{ color: theme.textColor }}>
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
            className="w-7 h-5 flex items-center justify-center transition-colors hover:opacity-70 border-t"
            style={{ color: theme.textColor, borderColor: `${theme.textColor}15` }}
          >
            <Minus size={10} />
          </button>
        </div>
      )
    }

    return (
      <div
        className={`flex items-center gap-1 border ${btnClass}`}
        style={{ borderColor: `${theme.textColor}15` }}
      >
        <button
          onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
          className="w-7 h-7 flex items-center justify-center transition-colors hover:opacity-70"
          style={{ color: theme.textColor }}
        >
          <Minus size={12} />
        </button>
        <span className="w-5 text-center text-xs font-semibold" style={{ color: theme.textColor }}>
          {item.quantity}
        </span>
        <button
          onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
          className="w-7 h-7 flex items-center justify-center transition-colors hover:opacity-70"
          style={{ color: theme.textColor }}
        >
          <Plus size={12} />
        </button>
      </div>
    )
  }

  const renderCartItem = (item: typeof items[0]) => {
    if (itemLayout === 'minimal') {
      return (
        <div
          key={item.cartId}
          className="flex items-center justify-between py-2 border-b"
          style={{ borderColor: `${theme.textColor}08` }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}>
              {item.quantity}x
            </span>
            <span className="text-sm truncate" style={{ color: theme.textColor }}>{item.productName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: theme.primaryColor }}>{formatPrice(item.totalPrice)}</span>
            {allowRemoveFromCart && (
              <button onClick={() => removeItem(item.cartId)} className="p-1 hover:opacity-70">
                <X size={14} style={{ color: theme.textColor }} />
              </button>
            )}
          </div>
        </div>
      )
    }

    const showImage = itemLayout === 'detailed' && showItemImages && item.image

    return (
      <div
        key={item.cartId}
        className={`flex gap-3 p-3 ${btnClass} border`}
        style={{ borderColor: `${theme.textColor}08` }}
      >
        {showImage && (
          <img
            src={item.image!}
            alt={item.productName}
            className={`${imageSizes[imageSize]} rounded-lg object-cover flex-shrink-0`}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="text-sm font-semibold truncate" style={{ color: theme.textColor }}>
                {item.productName}
              </h4>
              {showVariants && item.variantName && (
                <p className="text-xs opacity-50 mt-0.5" style={{ color: theme.textColor }}>
                  {item.variantName}
                </p>
              )}
              {showModifiers && item.modifiers.length > 0 && (
                <p className="text-xs opacity-40 mt-0.5" style={{ color: theme.textColor }}>
                  {item.modifiers.map(m => m.name).join(', ')}
                </p>
              )}
              {showUnitPrice && item.quantity > 1 && (
                <p className="text-xs opacity-40 mt-0.5" style={{ color: theme.textColor }}>
                  {formatPrice(item.unitPrice)} / unité
                </p>
              )}
            </div>
            {allowRemoveFromCart && (
              <button
                onClick={() => removeItem(item.cartId)}
                className="p-1 rounded-lg transition-colors hover:opacity-70 flex-shrink-0"
                style={{ color: theme.textColor }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            {renderQuantityControl(item)}
            <span className="text-sm font-bold" style={{ color: theme.primaryColor }}>
              {formatPrice(item.totalPrice)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  const renderCartContent = () => (
    <>
      <div
        className="flex items-center justify-between px-4 sm:px-6 py-4 border-b"
        style={{ borderColor: `${theme.textColor}10` }}
      >
        <div className="flex items-center gap-3">
          <ShoppingBag size={20} style={{ color: theme.primaryColor }} />
          <h2
            className="text-lg font-bold"
            style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
          >
            Votre panier
          </h2>
          {showItemCount && (
            <span className="text-sm opacity-50" style={{ color: theme.textColor }}>
              ({items.length} article{items.length > 1 ? 's' : ''})
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:opacity-70"
          style={{ color: theme.textColor, backgroundColor: `${theme.textColor}08` }}
        >
          <X size={18} />
        </button>
      </div>

      <div className={`flex-1 overflow-y-auto px-4 sm:px-6 py-4 ${cartType === 'mini' ? 'max-h-80' : ''}`}>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <ShoppingBag size={48} className="opacity-20 mb-4" style={{ color: theme.textColor }} />
            <p className="text-base font-medium opacity-50" style={{ color: theme.textColor }}>
              {emptyCartTitle}
            </p>
            <p className="text-sm opacity-30 mt-1" style={{ color: theme.textColor }}>
              {emptyCartMessage}
            </p>
            {showContinueShoppingButton && (
              <button
                onClick={onClose}
                className={`mt-4 px-5 py-2.5 text-sm font-medium flex items-center gap-2 ${btnClass}`}
                style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}
              >
                <ArrowLeft size={16} />
                Continuer mes achats
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(renderCartItem)}

            {showClearCartButton && items.length > 0 && (
              <button
                onClick={clearCart}
                className="w-full text-center text-xs py-2 opacity-40 hover:opacity-60 transition-opacity"
                style={{ color: theme.textColor }}
              >
                Vider le panier
              </button>
            )}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div
          className="px-4 sm:px-6 py-4 border-t space-y-3"
          style={{ borderColor: `${theme.textColor}10` }}
        >
          {showSubtotal && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: theme.textColor }}>
                Sous-total
              </span>
              <span className="text-lg font-bold" style={{ color: theme.primaryColor }}>
                {formatPrice(subtotal)}
              </span>
            </div>
          )}
          <button
            onClick={onCheckout}
            className={`w-full py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 ${btnClass}`}
            style={{ backgroundColor: theme.primaryColor }}
          >
            {checkoutButtonText}{showCheckoutButtonPrice ? ` - ${formatPrice(subtotal)}` : ''}
          </button>
        </div>
      )}
    </>
  )

  if (cartType === 'modal') {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {showBackdrop && (
          <div
            className={`absolute inset-0 bg-black/50 ${backdropBlur ? 'backdrop-blur-sm' : ''} transition-opacity ${enableAnimations ? animationDurations[animationSpeed] : ''} ease-out`}
            style={{ opacity: animating ? 1 : 0 }}
            onClick={closeOnBackdropClick ? onClose : undefined}
          />
        )}
        <div
          className={`relative w-full ${modalWidthClasses[drawerWidth]} max-h-[90vh] flex flex-col rounded-2xl shadow-2xl transition-all ${enableAnimations ? animationDurations[animationSpeed] : ''} ease-out`}
          style={{
            backgroundColor: theme.backgroundColor,
            opacity: animating ? 1 : 0,
            transform: animating ? 'scale(1)' : 'scale(0.95)',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {renderCartContent()}
        </div>
      </div>
    )
  }

  if (cartType === 'mini') {
    return (
      <div className="fixed inset-0 z-[60]">
        {showBackdrop && (
          <div
            className={`absolute inset-0 bg-black/30 ${backdropBlur ? 'backdrop-blur-sm' : ''} transition-opacity ${enableAnimations ? animationDurations[animationSpeed] : ''} ease-out`}
            style={{ opacity: animating ? 1 : 0 }}
            onClick={closeOnBackdropClick ? onClose : undefined}
          />
        )}
        <div
          className={`absolute ${drawerPosition === 'right' ? 'right-4' : 'left-4'} top-20 w-80 max-h-[80vh] flex flex-col rounded-2xl shadow-2xl border transition-all ${enableAnimations ? animationDurations[animationSpeed] : ''} ease-out`}
          style={{
            backgroundColor: theme.backgroundColor,
            borderColor: `${theme.textColor}10`,
            opacity: animating ? 1 : 0,
            transform: animating ? 'translateY(0)' : 'translateY(-10px)',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {renderCartContent()}
        </div>
      </div>
    )
  }

  return (
    <div className={`fixed inset-0 z-[60] flex ${justifyClass}`}>
      {showBackdrop && (
        <div
          className={`absolute inset-0 bg-black/50 ${backdropBlur ? 'backdrop-blur-sm' : ''} transition-opacity ${enableAnimations ? animationDurations[animationSpeed] : ''} ease-out`}
          style={{ opacity: animating ? 1 : 0 }}
          onClick={closeOnBackdropClick ? onClose : undefined}
        />
      )}
      <div
        className={`relative w-full ${widthClasses[drawerWidth]} h-full flex flex-col transition-transform ${enableAnimations ? animationDurations[animationSpeed] : ''} ease-out`}
        style={{
          backgroundColor: theme.backgroundColor,
          transform: animating ? 'translateX(0)' : translateDirection,
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {renderCartContent()}
      </div>
    </div>
  )
}
