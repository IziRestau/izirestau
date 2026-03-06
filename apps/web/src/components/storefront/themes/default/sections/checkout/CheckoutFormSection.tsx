'use client'

import { useState } from 'react'
import { ShoppingBag, Truck, Store, CreditCard, Banknote, Smartphone, Plus, Minus, Trash2, User, Mail, Phone, MapPin, MessageSquare, Gift } from 'lucide-react'
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
      setLoyaltyPointsToUse(maxPointsUsable)
      setLoyaltyDiscount(maxLoyaltyDiscount)
    } else {
      setLoyaltyPointsToUse(0)
      setLoyaltyDiscount(0)
    }
  }

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

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center">
        <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" style={{ color: theme.textColor }} />
        <p className="text-lg" style={{ color: theme.textColor }}>Votre panier est vide</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10">
          <div className="lg:col-span-3 space-y-6">
            {showLoginPrompt && !isAuthenticated && (
              <div
                className="p-4 rounded-lg border"
                style={{ borderColor: `${theme.primaryColor}30`, backgroundColor: `${theme.primaryColor}08` }}
              >
                <p className="text-sm" style={{ color: theme.textColor }}>
                  <a href={`/store/${settings.subdomain}/login?redirect=checkout`} className="font-medium underline" style={{ color: theme.primaryColor }}>
                    Connectez-vous
                  </a>
                  {showGuestOption && ' ou continuez en tant qu\'invité'}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <h2 className="text-lg font-semibold" style={{ color: theme.textColor, fontFamily: `'${theme.headingFont}', sans-serif` }}>
                Vos informations
              </h2>
              
              {!isAuthenticated && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textColor }}>
                      <User size={14} className="inline mr-1.5" />
                      Nom complet
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerInfo({ name: e.target.value })}
                      required
                      className="w-full px-3 py-2.5 rounded-lg border text-sm"
                      style={{ borderColor: `${theme.textColor}20`, backgroundColor: theme.backgroundColor, color: theme.textColor }}
                      placeholder="Jean Dupont"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textColor }}>
                      <Mail size={14} className="inline mr-1.5" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerInfo({ email: e.target.value })}
                      required
                      className="w-full px-3 py-2.5 rounded-lg border text-sm"
                      style={{ borderColor: `${theme.textColor}20`, backgroundColor: theme.backgroundColor, color: theme.textColor }}
                      placeholder="jean@exemple.com"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textColor }}>
                      <Phone size={14} className="inline mr-1.5" />
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerInfo({ phone: e.target.value })}
                      required
                      className="w-full px-3 py-2.5 rounded-lg border text-sm"
                      style={{ borderColor: `${theme.textColor}20`, backgroundColor: theme.backgroundColor, color: theme.textColor }}
                      placeholder="+221 77 123 45 67"
                    />
                  </div>
                </div>
              )}

              {isAuthenticated && customer && (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border" style={{ borderColor: `${theme.textColor}15` }}>
                    <p className="font-medium" style={{ color: theme.textColor }}>{customer.firstName} {customer.lastName}</p>
                    <p className="text-sm opacity-60" style={{ color: theme.textColor }}>{customer.email}</p>
                    {customer.phone && <p className="text-sm opacity-60" style={{ color: theme.textColor }}>{customer.phone}</p>}
                  </div>
                  {!customer.phone && (
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textColor }}>
                        <Phone size={14} className="inline mr-1.5" />
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerInfo({ phone: e.target.value })}
                        required
                        className="w-full px-3 py-2.5 rounded-lg border text-sm"
                        style={{ borderColor: `${theme.textColor}20`, backgroundColor: theme.backgroundColor, color: theme.textColor }}
                        placeholder="+221 77 123 45 67"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {showServiceTypeSelector && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold" style={{ color: theme.textColor, fontFamily: `'${theme.headingFont}', sans-serif` }}>
                  Type de service
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {settings.deliveryEnabled && (
                    <button
                      type="button"
                      onClick={() => setServiceType('DELIVERY')}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${serviceType === 'DELIVERY' ? 'ring-2' : ''}`}
                      style={{
                        borderColor: serviceType === 'DELIVERY' ? theme.primaryColor : `${theme.textColor}20`,
                                                backgroundColor: serviceType === 'DELIVERY' ? `${theme.primaryColor}10` : 'transparent',
                      }}
                    >
                      <Truck size={20} style={{ color: serviceType === 'DELIVERY' ? theme.primaryColor : theme.textColor }} />
                      <p className="font-medium mt-2" style={{ color: theme.textColor }}>Livraison</p>
                      <p className="text-xs opacity-60" style={{ color: theme.textColor }}>
                        {settings.deliveryFee ? formatPrice(settings.deliveryFee) : 'Gratuite'}
                      </p>
                    </button>
                  )}
                  {settings.pickupEnabled && (
                    <button
                      type="button"
                      onClick={() => setServiceType('PICKUP')}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${serviceType === 'PICKUP' ? 'ring-2' : ''}`}
                      style={{
                        borderColor: serviceType === 'PICKUP' ? theme.primaryColor : `${theme.textColor}20`,
                                                backgroundColor: serviceType === 'PICKUP' ? `${theme.primaryColor}10` : 'transparent',
                      }}
                    >
                      <Store size={20} style={{ color: serviceType === 'PICKUP' ? theme.primaryColor : theme.textColor }} />
                      <p className="font-medium mt-2" style={{ color: theme.textColor }}>À emporter</p>
                      <p className="text-xs opacity-60" style={{ color: theme.textColor }}>Récupérez sur place</p>
                    </button>
                  )}
                  {settings.dineInEnabled && (
                    <button
                      type="button"
                      onClick={() => setServiceType('DINE_IN')}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${serviceType === 'DINE_IN' ? 'ring-2' : ''}`}
                      style={{
                        borderColor: serviceType === 'DINE_IN' ? theme.primaryColor : `${theme.textColor}20`,
                                                backgroundColor: serviceType === 'DINE_IN' ? `${theme.primaryColor}10` : 'transparent',
                      }}
                    >
                      <ShoppingBag size={20} style={{ color: serviceType === 'DINE_IN' ? theme.primaryColor : theme.textColor }} />
                      <p className="font-medium mt-2" style={{ color: theme.textColor }}>Sur place</p>
                      <p className="text-xs opacity-60" style={{ color: theme.textColor }}>Mangez au restaurant</p>
                    </button>
                  )}
                </div>
              </div>
            )}

            {serviceType === 'DELIVERY' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold" style={{ color: theme.textColor, fontFamily: `'${theme.headingFont}', sans-serif` }}>
                  Adresse de livraison
                </h2>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textColor }}>
                    <MapPin size={14} className="inline mr-1.5" />
                    Adresse complète
                  </label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setCustomerInfo({ address: e.target.value })}
                    required
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm resize-none"
                    style={{ borderColor: `${theme.textColor}20`, backgroundColor: theme.backgroundColor, color: theme.textColor }}
                    placeholder="123 Rue Example, Quartier, Ville"
                  />
                </div>
              </div>
            )}

            {showPaymentMethods && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold" style={{ color: theme.textColor, fontFamily: `'${theme.headingFont}', sans-serif` }}>
                  Mode de paiement
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {settings.acceptCash && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${paymentMethod === 'CASH' ? 'ring-2' : ''}`}
                      style={{
                        borderColor: paymentMethod === 'CASH' ? theme.primaryColor : `${theme.textColor}20`,
                                                backgroundColor: paymentMethod === 'CASH' ? `${theme.primaryColor}10` : 'transparent',
                      }}
                    >
                      <Banknote size={20} style={{ color: paymentMethod === 'CASH' ? theme.primaryColor : theme.textColor }} />
                      <p className="font-medium mt-2" style={{ color: theme.textColor }}>Espèces</p>
                    </button>
                  )}
                  {settings.acceptCard && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CARD')}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${paymentMethod === 'CARD' ? 'ring-2' : ''}`}
                      style={{
                        borderColor: paymentMethod === 'CARD' ? theme.primaryColor : `${theme.textColor}20`,
                                                backgroundColor: paymentMethod === 'CARD' ? `${theme.primaryColor}10` : 'transparent',
                      }}
                    >
                      <CreditCard size={20} style={{ color: paymentMethod === 'CARD' ? theme.primaryColor : theme.textColor }} />
                      <p className="font-medium mt-2" style={{ color: theme.textColor }}>Carte bancaire</p>
                    </button>
                  )}
                  {settings.acceptOnlinePayment && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('MOBILE_MONEY')}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${paymentMethod === 'MOBILE_MONEY' ? 'ring-2' : ''}`}
                      style={{
                        borderColor: paymentMethod === 'MOBILE_MONEY' ? theme.primaryColor : `${theme.textColor}20`,
                                                backgroundColor: paymentMethod === 'MOBILE_MONEY' ? `${theme.primaryColor}10` : 'transparent',
                      }}
                    >
                      <Smartphone size={20} style={{ color: paymentMethod === 'MOBILE_MONEY' ? theme.primaryColor : theme.textColor }} />
                      <p className="font-medium mt-2" style={{ color: theme.textColor }}>Mobile Money</p>
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h2 className="text-lg font-semibold" style={{ color: theme.textColor, fontFamily: `'${theme.headingFont}', sans-serif` }}>
                Instructions spéciales
              </h2>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textColor }}>
                  <MessageSquare size={14} className="inline mr-1.5" />
                  Notes pour le restaurant (optionnel)
                </label>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerInfo({ notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm resize-none"
                  style={{ borderColor: `${theme.textColor}20`, backgroundColor: theme.backgroundColor, color: theme.textColor }}
                  placeholder="Allergies, préférences, etc."
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-xl border p-4 sm:p-6" style={{ borderColor: `${theme.textColor}15` }}>
                <h2 className="text-lg font-semibold mb-4" style={{ color: theme.textColor, fontFamily: `'${theme.headingFont}', sans-serif` }}>
                  Récapitulatif
                </h2>

                <div className="space-y-3 mb-4">
                  {items.map((item) => (
                    <div key={item.cartId} className="flex gap-3">
                      {showItemImages && item.image && (
                        <img src={item.image} alt={item.productName} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" style={{ color: theme.textColor }}>{item.productName}</p>
                        {item.variantName && (
                          <p className="text-xs opacity-60" style={{ color: theme.textColor }}>{item.variantName}</p>
                        )}
                        <p className="text-sm font-medium mt-1" style={{ color: theme.primaryColor }}>
                          {formatPrice(item.totalPrice)}
                        </p>
                      </div>
                      {allowQuantityEdit ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                            className="w-7 h-7 rounded-full flex items-center justify-center border"
                            style={{ borderColor: `${theme.textColor}20` }}
                          >
                            <Minus size={12} style={{ color: theme.textColor }} />
                          </button>
                          <span className="w-6 text-center text-sm" style={{ color: theme.textColor }}>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                            className="w-7 h-7 rounded-full flex items-center justify-center border"
                            style={{ borderColor: `${theme.textColor}20` }}
                          >
                            <Plus size={12} style={{ color: theme.textColor }} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(item.cartId)}
                            className="w-7 h-7 rounded-full flex items-center justify-center ml-1"
                          >
                            <Trash2 size={14} className="text-red-500" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm" style={{ color: theme.textColor }}>x{item.quantity}</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Loyalty points option */}
                {isAuthenticated && customerLoyaltyPoints > 0 && (
                  <div className="border-t pt-4 mb-4" style={{ borderColor: `${theme.textColor}15` }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Gift size={16} style={{ color: theme.primaryColor }} />
                        <span className="text-sm font-medium" style={{ color: theme.textColor }}>
                          Points de fidélité
                        </span>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}>
                        {customerLoyaltyPoints.toLocaleString('fr-FR')} pts
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLoyaltyToggle(!useLoyaltyPoints)}
                      className="w-full p-3 text-sm font-medium rounded-xl border transition-all"
                      style={{
                        backgroundColor: useLoyaltyPoints ? `${theme.primaryColor}10` : 'transparent',
                        color: useLoyaltyPoints ? theme.primaryColor : theme.textColor,
                        borderColor: useLoyaltyPoints ? theme.primaryColor : `${theme.textColor}20`,
                      }}
                    >
                      {useLoyaltyPoints 
                        ? `Utiliser ${loyaltyPointsToUse.toLocaleString('fr-FR')} pts (-${formatPrice(loyaltyDiscount)})`
                        : `Utiliser mes points (-${formatPrice(maxLoyaltyDiscount)} max)`
                      }
                    </button>
                  </div>
                )}

                <div className="border-t pt-4 space-y-2" style={{ borderColor: `${theme.textColor}15` }}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: theme.textColor }}>Sous-total</span>
                    <span style={{ color: theme.textColor }}>{formatPrice(subtotal)}</span>
                  </div>
                  {deliveryFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: theme.textColor }}>Livraison</span>
                      <span style={{ color: theme.textColor }}>{formatPrice(deliveryFee)}</span>
                    </div>
                  )}
                  {showTipOption && (
                    <div className="pt-2">
                      <p className="text-sm mb-2" style={{ color: theme.textColor }}>Pourboire</p>
                      <div className="flex gap-2 flex-wrap">
                        {(settings.suggestedTips || [10, 15, 20]).map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setTip(Math.round(subtotal * pct / 100))}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all`}
                            style={{
                              borderColor: tip === Math.round(subtotal * pct / 100) ? theme.primaryColor : `${theme.textColor}20`,
                              backgroundColor: tip === Math.round(subtotal * pct / 100) ? `${theme.primaryColor}15` : 'transparent',
                              color: tip === Math.round(subtotal * pct / 100) ? theme.primaryColor : theme.textColor,
                            }}
                          >
                            {pct}%
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setTip(0)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all`}
                          style={{
                            borderColor: tip === 0 ? theme.primaryColor : `${theme.textColor}20`,
                            backgroundColor: tip === 0 ? `${theme.primaryColor}15` : 'transparent',
                            color: tip === 0 ? theme.primaryColor : theme.textColor,
                          }}
                        >
                          Non merci
                        </button>
                      </div>
                      {tip > 0 && (
                        <div className="flex justify-between text-sm mt-2">
                          <span style={{ color: theme.textColor }}>Pourboire</span>
                          <span style={{ color: theme.textColor }}>{formatPrice(tip)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {loyaltyDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1" style={{ color: theme.primaryColor }}>
                        <Gift size={12} />
                        Fidélité ({loyaltyPointsToUse.toLocaleString('fr-FR')} pts)
                      </span>
                      <span style={{ color: theme.primaryColor }}>-{formatPrice(loyaltyDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t" style={{ borderColor: `${theme.textColor}15` }}>
                    <span style={{ color: theme.textColor }}>Total</span>
                    <span style={{ color: theme.primaryColor }}>{formatPrice(total)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-6 py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  {isSubmitting ? 'Traitement...' : 'Confirmer la commande'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
