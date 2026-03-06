'use client'

import { useState } from 'react'
import { X, Minus, Plus, Clock, Flame, AlertTriangle } from 'lucide-react'
import type { ProductModalProps, CartItemInput } from '../_types'

export function ProductModal({ product, theme, settings, isOpen, onClose, onAddToCart }: ProductModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({})
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')

  const currency = settings?.currency || 'XOF'

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  if (!isOpen || !product) return null

  const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0]
  const activeVariantId = selectedVariant || defaultVariant?.id || null
  const activeVariant = product.variants.find(v => v.id === activeVariantId)
  const basePrice = activeVariant ? activeVariant.price : product.price

  const modifierTotal = Object.values(selectedModifiers)
    .flat()
    .reduce((sum, modId) => {
      for (const group of product.modifierGroups) {
        const mod = group.modifiers.find(m => m.id === modId)
        if (mod) return sum + mod.price
      }
      return sum
    }, 0)

  const unitPrice = basePrice + modifierTotal
  const totalPrice = unitPrice * quantity

  const toggleModifier = (groupId: string, modifierId: string, maxSelections: number) => {
    setSelectedModifiers(prev => {
      const current = prev[groupId] || []
      if (current.includes(modifierId)) {
        return { ...prev, [groupId]: current.filter(id => id !== modifierId) }
      }
      if (maxSelections === 1) {
        return { ...prev, [groupId]: [modifierId] }
      }
      if (current.length >= maxSelections) {
        return prev
      }
      return { ...prev, [groupId]: [...current, modifierId] }
    })
  }

  const handleAddToCart = () => {
    const mods = Object.values(selectedModifiers)
      .flat()
      .map(modId => {
        for (const group of product.modifierGroups) {
          const mod = group.modifiers.find(m => m.id === modId)
          if (mod) return { id: mod.id, name: mod.name, price: mod.price }
        }
        return null
      })
      .filter(Boolean) as { id: string; name: string; price: number }[]

    const item: CartItemInput = {
      productId: product.id,
      productName: product.name,
      variantId: activeVariantId,
      variantName: activeVariant?.name || null,
      quantity,
      unitPrice: basePrice,
      modifiers: mods,
      notes: notes || null,
      image: product.image,
    }

    onAddToCart(item)
    setQuantity(1)
    setSelectedVariant(null)
    setSelectedModifiers({})
    setNotes('')
    onClose()
  }

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-lg max-h-[90vh] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: '#141414' }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="overflow-y-auto flex-1">
          {product.image && (
            <div className="relative aspect-video">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="p-4 sm:p-6 space-y-5">
            <div>
              <h2
                className="text-xl sm:text-2xl font-bold text-white"
                style={{ fontFamily: `'${theme.headingFont}', serif` }}
              >
                {product.name}
              </h2>
              {product.description && (
                <p className="text-sm mt-2 text-white/50">
                  {product.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-3">
                {theme.showPrepTime && product.prepTime && (
                  <span className="inline-flex items-center gap-1 text-xs text-white/40">
                    <Clock size={12} /> {product.prepTime} min
                  </span>
                )}
                {product.calories && (
                  <span className="inline-flex items-center gap-1 text-xs text-white/40">
                    <Flame size={12} /> {product.calories} cal
                  </span>
                )}
              </div>
              {theme.showAllergens && product.allergens.length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
                  <span className="text-xs text-amber-400">
                    Allergènes : {product.allergens.join(', ')}
                  </span>
                </div>
              )}
            </div>

            {product.variants.length > 1 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 text-white">
                  Taille / Variante
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${btnClass}`}
                      style={
                        activeVariantId === v.id
                          ? { borderColor: theme.primaryColor, backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }
                          : { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }
                      }
                    >
                      {v.name} - {formatPrice(v.price)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.modifierGroups.map(group => (
              <div key={group.id}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-white">
                    {group.name}
                  </h3>
                  <span className="text-xs text-white/40">
                    {group.isRequired ? 'Obligatoire' : 'Optionnel'}
                    {group.maxSelections > 1 && ` (max ${group.maxSelections})`}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {group.modifiers.map(mod => {
                    const isSelected = (selectedModifiers[group.id] || []).includes(mod.id)
                    return (
                      <button
                        key={mod.id}
                        onClick={() => toggleModifier(group.id, mod.id, group.maxSelections)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all text-left"
                        style={
                          isSelected
                            ? { borderColor: theme.primaryColor, backgroundColor: `${theme.primaryColor}10` }
                            : { borderColor: 'rgba(255,255,255,0.06)' }
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              group.maxSelections === 1 ? 'rounded-full' : 'rounded-md'
                            }`}
                            style={
                              isSelected
                                ? { borderColor: theme.primaryColor, backgroundColor: theme.primaryColor }
                                : { borderColor: 'rgba(255,255,255,0.2)' }
                            }
                          >
                            {isSelected && (
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                <path d="M1 4L3.5 6.5L9 1" stroke="#0C0C0C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <span className="text-sm text-white/80">{mod.name}</span>
                        </div>
                        {mod.price > 0 && (
                          <span className="text-sm font-medium" style={{ color: theme.primaryColor }}>
                            +{formatPrice(mod.price)}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            <div>
              <h3 className="text-sm font-semibold mb-2 text-white">
                Notes
              </h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Instructions spéciales..."
                className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none h-20 focus:outline-none focus:ring-2 text-white placeholder-white/30"
                style={{
                  borderColor: 'rgba(255,255,255,0.1)',
                  backgroundColor: '#0C0C0C',
                  '--tw-ring-color': `${theme.primaryColor}40`,
                } as React.CSSProperties}
              />
            </div>
          </div>
        </div>

        <div
          className="p-4 sm:p-6 border-t flex items-center gap-4"
          style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#141414' }}
        >
          <div className="flex items-center gap-3 border rounded-xl px-1" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:opacity-70 text-white/70"
            >
              <Minus size={16} />
            </button>
            <span className="w-6 text-center font-semibold text-sm text-white">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:opacity-70 text-white/70"
            >
              <Plus size={16} />
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            className={`flex-1 py-3 text-sm font-semibold transition-all hover:opacity-90 ${btnClass}`}
            style={{ backgroundColor: theme.primaryColor, color: '#0C0C0C' }}
          >
            Ajouter - {formatPrice(totalPrice)}
          </button>
        </div>
      </div>
    </div>
  )
}
