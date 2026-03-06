'use client'

import { useState } from 'react'
import { ShoppingBag, Truck, Store, CreditCard, Banknote, Smartphone, Plus, Minus, Trash2, User, Mail, Phone, MapPin, MessageSquare, UtensilsCrossed, Gift } from 'lucide-react'
import type { StoreThemeData, StoreSettingsData, CheckoutSubmitData } from '../../../_types'
import { useStorefrontCartStore } from '@/stores/storefront-cart.store'
import { useStorefrontAuthStore } from '@/stores/storefront-auth.store'

interface CheckoutFormSectionProps {
  theme: StoreThemeData
  settings: StoreSettingsData
  subdomain: string
  sectionData?: Record<string, unknown>
  onSubmit: (data: CheckoutSubmitData) => Promise<void>
}

export function CheckoutFormSection({
  theme,
  settings,
  sectionData,
  onSubmit,
}: CheckoutFormSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  const cartStore = useStorefrontCartStore()
  const { items, getSubtotal, updateQuantity, removeItem, serviceType, setServiceType, setCustomerInfo } = cartStore
  const customerName = cartStore.customerName
  const customerEmail = cartStore.customerEmail
  const customerPhone = cartStore.customerPhone
  const customerNotes = cartStore.customerNotes
  const deliveryAddress = cartStore.deliveryAddress
  const { customer, isAuthenticated } = useStorefrontAuthStore()

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'MOBILE_MONEY'>('CASH')
  const [tip, setTip] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false)
  const [loyaltyPointsToUse, setLoyaltyPointsToUse] = useState(0)
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0)

  const showGuestOption = s('showGuestOption', true) !== false
  const showLoginPrompt = s('showLoginPrompt', true) !== false
  const showServiceTypeSelector = s('showServiceTypeSelector', true) !== false
  const showPaymentMethods = s('showPaymentMethods', true) !== false
  const showTipOption = s('showTipOption', true) !== false && settings.tipsEnabled
  const showItemImages = s('showItemImages', true) !== false
  const allowQuantityEdit = s('allowQuantityEdit', true) !== false

  const subtotal = getSubtotal()
  const deliveryFee = serviceType === 'DELIVERY' ? (settings.deliveryFee || 0) : 0
  const total = subtotal + deliveryFee + tip - loyaltyDiscount

  // Points de fidélité du client connecté
  const customerLoyaltyPoints = isAuthenticated && customer ? (customer as { loyaltyPoints?: number }).loyaltyPoints || 0 : 0
  const pointsToMoneyRate = 100 // 100 points = 1 unité monétaire
  const maxLoyaltyDiscount = Math.min(customerLoyaltyPoints / pointsToMoneyRate, subtotal + deliveryFee + tip)
  const maxPointsUsable = Math.round(maxLoyaltyDiscount * pointsToMoneyRate)

  const handleLoyaltyToggle = (enabled: boolean) => {
    setUseLoyaltyPoints(enabled)
    if (enabled && customerLoyaltyPoints > 0) {
      // Utiliser tous les points disponibles (jusqu'au max)
      setLoyaltyPointsToUse(maxPointsUsable)
      setLoyaltyDiscount(maxLoyaltyDiscount)
    } else {
      setLoyaltyPointsToUse(0)
      setLoyaltyDiscount(0)
    }
  }

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-2xl'

  const inputClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onSubmit({
        serviceType: serviceType as 'DELIVERY' | 'PICKUP' | 'DINE_IN',
        paymentMethod,
        customerName: isAuthenticated && customer ? `${customer.firstName} ${customer.lastName}` : customerName,
        customerEmail: isAuthenticated && customer ? customer.email : customerEmail,
        customerPhone: isAuthenticated && customer ? (customer.phone || customerPhone) : customerPhone,
        deliveryAddress: serviceType === 'DELIVERY' ? deliveryAddress : undefined,
        notes: customerNotes,
        tip,
        loyaltyPointsToUse: useLoyaltyPoints ? loyaltyPointsToUse : 0,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: settings.currency || 'XOF' }).format(price)
  }

  const inputStyle = {
    borderColor: `${theme.textColor}12`,
    color: theme.textColor,
    backgroundColor: `${theme.textColor}04`,
  } as React.CSSProperties

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div 
          className={`w-20 h-20 mx-auto mb-6 flex items-center justify-center ${btnClass}`}
          style={{ backgroundColor: `${theme.textColor}08` }}
        >
          <ShoppingBag size={36} className="opacity-30" style={{ color: theme.textColor }} />
        </div>
        <p className="text-lg font-medium" style={{ color: theme.textColor }}>Votre panier est vide</p>
        <p className="text-sm opacity-50 mt-2" style={{ color: theme.textColor }}>
          Ajoutez des articles depuis le menu
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Left column - Form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Login prompt */}
            {showLoginPrompt && !isAuthenticated && (
              <div
                className={`p-4 sm:p-5 ${btnClass}`}
                style={{ backgroundColor: `${theme.primaryColor}08`, border: `1px solid ${theme.primaryColor}20` }}
              >
                <p className="text-sm" style={{ color: theme.textColor }}>
                  <a 
                    href={`/store/${settings.subdomain}/login?redirect=checkout`} 
                    className="font-semibold underline" 
                    style={{ color: theme.primaryColor }}
                  >
                    Connectez-vous
                  </a>
                  {showGuestOption && ' pour un paiement plus rapide ou continuez en tant qu\'invité'}
                </p>
              </div>
            )}

            {/* Customer info */}
            <div 
              className={`p-4 sm:p-6 ${btnClass}`}
              style={{ backgroundColor: `${theme.textColor}04`, border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <h2 
                className="text-lg font-bold mb-4"
                style={{ color: theme.textColor, fontFamily: `'${theme.headingFont}', sans-serif` }}
              >
                Vos informations
              </h2>
              
              {isAuthenticated && customer ? (
                <div className="space-y-4">
                  <div 
                    className={`p-4 ${inputClass}`}
                    style={{ backgroundColor: theme.backgroundColor, border: '1px solid rgba(255,255,255,0.12)' }}
                  >
                    <p className="font-semibold" style={{ color: theme.textColor }}>
                      {customer.firstName} {customer.lastName}
                    </p>
                    <p className="text-sm opacity-60" style={{ color: theme.textColor }}>{customer.email}</p>
                    {customer.phone && (
                      <p className="text-sm opacity-60" style={{ color: theme.textColor }}>{customer.phone}</p>
                    )}
                  </div>
                  {!customer.phone && (
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: theme.textColor }}>
                        <Phone size={14} />
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerInfo({ phone: e.target.value })}
                        required
                        className={`w-full px-4 py-3 text-sm ${inputClass}`}
                        style={{ ...inputStyle, border: '1px solid rgba(255,255,255,0.12)' }}
                        placeholder="+221 77 123 45 67"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: theme.textColor }}>
                        <User size={14} />
                        Nom complet
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerInfo({ name: e.target.value })}
                        required
                        className={`w-full px-4 py-3 text-sm ${inputClass}`}
                        style={{ ...inputStyle, border: '1px solid rgba(255,255,255,0.12)' }}
                        placeholder="Jean Dupont"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: theme.textColor }}>
                        <Mail size={14} />
                        Email
                      </label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerInfo({ email: e.target.value })}
                        required
                        className={`w-full px-4 py-3 text-sm ${inputClass}`}
                        style={{ ...inputStyle, border: '1px solid rgba(255,255,255,0.12)' }}
                        placeholder="jean@exemple.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: theme.textColor }}>
                      <Phone size={14} />
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerInfo({ phone: e.target.value })}
                      required
                      className={`w-full px-4 py-3 text-sm ${inputClass}`}
                      style={{ ...inputStyle, border: '1px solid rgba(255,255,255,0.12)' }}
                      placeholder="+221 77 123 45 67"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Service type */}
            {showServiceTypeSelector && (
              <div 
                className={`p-4 sm:p-6 ${btnClass}`}
                style={{ backgroundColor: `${theme.textColor}04`, border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <h2 
                  className="text-lg font-bold mb-4"
                  style={{ color: theme.textColor, fontFamily: `'${theme.headingFont}', sans-serif` }}
                >
                  Type de service
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {settings.deliveryEnabled && (
                    <button
                      type="button"
                      onClick={() => setServiceType('DELIVERY')}
                      className={`p-4 text-left transition-all ${btnClass}`}
                      style={{
                        backgroundColor: serviceType === 'DELIVERY' ? `${theme.primaryColor}15` : theme.backgroundColor,
                        border: `2px solid ${serviceType === 'DELIVERY' ? theme.primaryColor : 'rgba(255,255,255,0.12)'}`,
                      }}
                    >
                      <Truck size={24} style={{ color: serviceType === 'DELIVERY' ? theme.primaryColor : theme.textColor }} />
                      <p className="font-semibold mt-2" style={{ color: theme.textColor }}>Livraison</p>
                      <p className="text-xs opacity-50" style={{ color: theme.textColor }}>
                        {settings.deliveryFee ? formatPrice(settings.deliveryFee) : 'Gratuite'}
                      </p>
                    </button>
                  )}
                  {settings.pickupEnabled && (
                    <button
                      type="button"
                      onClick={() => setServiceType('PICKUP')}
                      className={`p-4 text-left transition-all ${btnClass}`}
                      style={{
                        backgroundColor: serviceType === 'PICKUP' ? `${theme.primaryColor}15` : theme.backgroundColor,
                        border: `2px solid ${serviceType === 'PICKUP' ? theme.primaryColor : 'rgba(255,255,255,0.12)'}`,
                      }}
                    >
                      <Store size={24} style={{ color: serviceType === 'PICKUP' ? theme.primaryColor : theme.textColor }} />
                      <p className="font-semibold mt-2" style={{ color: theme.textColor }}>À emporter</p>
                      <p className="text-xs opacity-50" style={{ color: theme.textColor }}>Récupérez sur place</p>
                    </button>
                  )}
                  {settings.dineInEnabled && (
                    <button
                      type="button"
                      onClick={() => setServiceType('DINE_IN')}
                      className={`p-4 text-left transition-all ${btnClass}`}
                      style={{
                        backgroundColor: serviceType === 'DINE_IN' ? `${theme.primaryColor}15` : theme.backgroundColor,
                        border: `2px solid ${serviceType === 'DINE_IN' ? theme.primaryColor : 'rgba(255,255,255,0.12)'}`,
                      }}
                    >
                      <UtensilsCrossed size={24} style={{ color: serviceType === 'DINE_IN' ? theme.primaryColor : theme.textColor }} />
                      <p className="font-semibold mt-2" style={{ color: theme.textColor }}>Sur place</p>
                      <p className="text-xs opacity-50" style={{ color: theme.textColor }}>Mangez au restaurant</p>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Delivery address */}
            {serviceType === 'DELIVERY' && (
              <div 
                className={`p-4 sm:p-6 ${btnClass}`}
                style={{ backgroundColor: `${theme.textColor}04`, border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <h2 
                  className="text-lg font-bold mb-4"
                  style={{ color: theme.textColor, fontFamily: `'${theme.headingFont}', sans-serif` }}
                >
                  Adresse de livraison
                </h2>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: theme.textColor }}>
                    <MapPin size={14} />
                    Adresse complète
                  </label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setCustomerInfo({ address: e.target.value })}
                    required
                    rows={2}
                    className={`w-full px-4 py-3 text-sm resize-none ${inputClass}`}
                    style={{ ...inputStyle, border: '1px solid rgba(255,255,255,0.12)' }}
                    placeholder="123 Rue Example, Quartier, Ville"
                  />
                </div>
              </div>
            )}

            {/* Payment method */}
            {showPaymentMethods && (
              <div 
                className={`p-4 sm:p-6 ${btnClass}`}
                style={{ backgroundColor: `${theme.textColor}04`, border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <h2 
                  className="text-lg font-bold mb-4"
                  style={{ color: theme.textColor, fontFamily: `'${theme.headingFont}', sans-serif` }}
                >
                  Mode de paiement
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {settings.acceptCash && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      className={`p-4 text-left transition-all ${btnClass}`}
                      style={{
                        backgroundColor: paymentMethod === 'CASH' ? `${theme.primaryColor}15` : theme.backgroundColor,
                        border: `2px solid ${paymentMethod === 'CASH' ? theme.primaryColor : 'rgba(255,255,255,0.12)'}`,
                      }}
                    >
                      <Banknote size={24} style={{ color: paymentMethod === 'CASH' ? theme.primaryColor : theme.textColor }} />
                      <p className="font-semibold mt-2" style={{ color: theme.textColor }}>Espèces</p>
                    </button>
                  )}
                  {settings.acceptCard && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CARD')}
                      className={`p-4 text-left transition-all ${btnClass}`}
                      style={{
                        backgroundColor: paymentMethod === 'CARD' ? `${theme.primaryColor}15` : theme.backgroundColor,
                        border: `2px solid ${paymentMethod === 'CARD' ? theme.primaryColor : 'rgba(255,255,255,0.12)'}`,
                      }}
                    >
                      <CreditCard size={24} style={{ color: paymentMethod === 'CARD' ? theme.primaryColor : theme.textColor }} />
                      <p className="font-semibold mt-2" style={{ color: theme.textColor }}>Carte bancaire</p>
                    </button>
                  )}
                  {settings.acceptOnlinePayment && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('MOBILE_MONEY')}
                      className={`p-4 text-left transition-all ${btnClass}`}
                      style={{
                        backgroundColor: paymentMethod === 'MOBILE_MONEY' ? `${theme.primaryColor}15` : theme.backgroundColor,
                        border: `2px solid ${paymentMethod === 'MOBILE_MONEY' ? theme.primaryColor : 'rgba(255,255,255,0.12)'}`,
                      }}
                    >
                      <Smartphone size={24} style={{ color: paymentMethod === 'MOBILE_MONEY' ? theme.primaryColor : theme.textColor }} />
                      <p className="font-semibold mt-2" style={{ color: theme.textColor }}>Mobile Money</p>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            <div 
              className={`p-4 sm:p-6 ${btnClass}`}
              style={{ backgroundColor: `${theme.textColor}04`, border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <h2 
                className="text-lg font-bold mb-4"
                style={{ color: theme.textColor, fontFamily: `'${theme.headingFont}', sans-serif` }}
              >
                Instructions spéciales
              </h2>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: theme.textColor }}>
                  <MessageSquare size={14} />
                  Notes pour le restaurant (optionnel)
                </label>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerInfo({ notes: e.target.value })}
                  rows={2}
                  className={`w-full px-4 py-3 text-sm resize-none ${inputClass}`}
                  style={{ ...inputStyle, border: '1px solid rgba(255,255,255,0.12)' }}
                  placeholder="Allergies, préférences, etc."
                />
              </div>
            </div>
          </div>

          {/* Right column - Summary */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24 space-y-4">
              {/* Order summary */}
              <div 
                className={`p-4 sm:p-6 ${btnClass}`}
                style={{ backgroundColor: `${theme.textColor}04`, border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <h2 
                  className="text-lg font-bold mb-4 flex items-center gap-2"
                  style={{ color: theme.textColor, fontFamily: `'${theme.headingFont}', sans-serif` }}
                >
                  <ShoppingBag size={20} style={{ color: theme.primaryColor }} />
                  Récapitulatif
                </h2>

                <div className="space-y-3 mb-4">
                  {items.map((item) => (
                    <div key={item.cartId} className="flex gap-3">
                      {showItemImages && item.image && (
                        <img 
                          src={item.image} 
                          alt={item.productName} 
                          className={`w-14 h-14 object-cover flex-shrink-0 ${inputClass}`}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" style={{ color: theme.textColor }}>
                          {item.productName}
                        </p>
                        {item.variantName && (
                          <p className="text-xs opacity-50" style={{ color: theme.textColor }}>{item.variantName}</p>
                        )}
                        <p className="text-sm font-bold mt-1" style={{ color: theme.primaryColor }}>
                          {formatPrice(item.totalPrice)}
                        </p>
                      </div>
                      {allowQuantityEdit ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                            className={`w-7 h-7 flex items-center justify-center ${inputClass}`}
                            style={{ backgroundColor: `${theme.textColor}08`, border: '1px solid rgba(255,255,255,0.12)' }}
                          >
                            <Minus size={12} style={{ color: theme.textColor }} />
                          </button>
                          <span className="w-6 text-center text-sm font-medium" style={{ color: theme.textColor }}>
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                            className={`w-7 h-7 flex items-center justify-center ${inputClass}`}
                            style={{ backgroundColor: `${theme.textColor}08`, border: '1px solid rgba(255,255,255,0.12)' }}
                          >
                            <Plus size={12} style={{ color: theme.textColor }} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(item.cartId)}
                            className="w-7 h-7 flex items-center justify-center ml-1 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm font-medium" style={{ color: theme.textColor }}>x{item.quantity}</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Loyalty points option */}
                {isAuthenticated && customerLoyaltyPoints > 0 && (
                  <div className="pt-4 border-t mb-4" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Gift size={16} style={{ color: theme.primaryColor }} />
                        <span className="text-sm font-medium" style={{ color: theme.textColor }}>
                          Points de fidélité
                        </span>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: `${theme.primaryColor}20`, color: theme.primaryColor }}>
                        {customerLoyaltyPoints.toLocaleString('fr-FR')} pts
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLoyaltyToggle(!useLoyaltyPoints)}
                      className={`w-full p-3 text-sm font-medium transition-all ${btnClass}`}
                      style={{
                        backgroundColor: useLoyaltyPoints ? `${theme.primaryColor}15` : `${theme.textColor}08`,
                        color: useLoyaltyPoints ? theme.primaryColor : theme.textColor,
                        border: `1px solid ${useLoyaltyPoints ? theme.primaryColor : 'rgba(255,255,255,0.12)'}`,
                      }}
                    >
                      {useLoyaltyPoints 
                        ? `Utiliser ${loyaltyPointsToUse.toLocaleString('fr-FR')} pts (-${formatPrice(loyaltyDiscount)})`
                        : `Utiliser mes points (-${formatPrice(maxLoyaltyDiscount)} max)`
                      }
                    </button>
                  </div>
                )}

                {/* Tip option */}
                {showTipOption && (
                  <div className="pt-4 border-t mb-4" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                    <p className="text-sm font-medium mb-2" style={{ color: theme.textColor }}>Pourboire</p>
                    <div className="flex gap-2 flex-wrap">
                      {(settings.suggestedTips || [10, 15, 20]).map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setTip(Math.round(subtotal * pct / 100))}
                          className={`px-3 py-1.5 text-xs font-semibold transition-all ${btnClass}`}
                          style={{
                            backgroundColor: tip === Math.round(subtotal * pct / 100) ? theme.primaryColor : `${theme.textColor}08`,
                            color: tip === Math.round(subtotal * pct / 100) ? 'white' : theme.textColor,
                            border: `1px solid ${tip === Math.round(subtotal * pct / 100) ? theme.primaryColor : 'rgba(255,255,255,0.12)'}`,
                          }}
                        >
                          {pct}%
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setTip(0)}
                        className={`px-3 py-1.5 text-xs font-semibold transition-all ${btnClass}`}
                        style={{
                          backgroundColor: tip === 0 ? theme.primaryColor : `${theme.textColor}08`,
                          color: tip === 0 ? 'white' : theme.textColor,
                          border: `1px solid ${tip === 0 ? theme.primaryColor : 'rgba(255,255,255,0.12)'}`,
                        }}
                      >
                        Non merci
                      </button>
                    </div>
                  </div>
                )}

                {/* Totals */}
                <div className="pt-4 border-t space-y-2" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: theme.textColor }}>Sous-total</span>
                    <span className="font-medium" style={{ color: theme.textColor }}>{formatPrice(subtotal)}</span>
                  </div>
                  {deliveryFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: theme.textColor }}>Livraison</span>
                      <span className="font-medium" style={{ color: theme.textColor }}>{formatPrice(deliveryFee)}</span>
                    </div>
                  )}
                  {tip > 0 && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: theme.textColor }}>Pourboire</span>
                      <span className="font-medium" style={{ color: theme.textColor }}>{formatPrice(tip)}</span>
                    </div>
                  )}
                  {loyaltyDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1" style={{ color: theme.primaryColor }}>
                        <Gift size={12} />
                        Fidélité ({loyaltyPointsToUse.toLocaleString('fr-FR')} pts)
                      </span>
                      <span className="font-medium" style={{ color: theme.primaryColor }}>-{formatPrice(loyaltyDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                    <span style={{ color: theme.textColor }}>Total</span>
                    <span style={{ color: theme.primaryColor }}>{formatPrice(total)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full mt-6 py-4 font-bold text-white text-lg transition-all disabled:opacity-50 hover:opacity-90 ${btnClass}`}
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  {isSubmitting ? 'Traitement en cours...' : 'Confirmer la commande'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
