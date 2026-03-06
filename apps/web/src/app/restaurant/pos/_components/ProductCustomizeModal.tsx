'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { usePOSStore, CartItemModifier } from '@/stores/pos.store'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Minus, 
  Plus, 
  ImageIcon,
  Check,
  ShoppingCart,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Variant {
  id: string
  name: string
  price: number
  isActive: boolean
}

interface Modifier {
  id: string
  name: string
  price: number
  isDefault: boolean
}

interface ModifierGroup {
  id: string
  name: string
  type: 'SINGLE' | 'MULTIPLE' | 'QUANTITY'
  isRequired: boolean
  minSelections: number
  maxSelections: number
  modifiers: Modifier[]
}

interface Product {
  id: string
  name: string
  description?: string
  price: number
  image?: string | null
  variants?: Variant[]
  modifierGroups?: ModifierGroup[]
}

interface ProductCustomizeModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  formatPrice: (price: number) => string
  primaryColor: string
}

export function ProductCustomizeModal({
  product,
  isOpen,
  onClose,
  formatPrice,
  primaryColor,
}: ProductCustomizeModalProps) {
  const { addItem } = usePOSStore()
  
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)
  const [selectedModifiers, setSelectedModifiers] = useState<Map<string, CartItemModifier[]>>(new Map())
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (product && isOpen) {
      setQuantity(1)
      setNotes('')
      
      const variants = product.variants || []
      const activeVars = variants.filter(v => v.isActive)
      if (activeVars.length > 0) {
        setSelectedVariant(activeVars[0])
      } else if (variants.length > 0) {
        setSelectedVariant(variants[0])
      } else {
        setSelectedVariant(null)
      }

      const defaultModifiers = new Map<string, CartItemModifier[]>()
      product.modifierGroups?.forEach(group => {
        const defaults = group.modifiers
          .filter(m => m.isDefault)
          .map(m => ({
            id: m.id,
            name: m.name,
            price: m.price,
            groupId: group.id,
            groupName: group.name,
          }))
        if (defaults.length > 0) {
          defaultModifiers.set(group.id, defaults)
        }
      })
      setSelectedModifiers(defaultModifiers)
    }
  }, [product, isOpen])

  if (!product) return null

  const allVariants = product.variants || []
  const activeVariants = allVariants.filter(v => v.isActive !== false)
  const hasVariants = activeVariants.length > 0
  const hasModifiers = product.modifierGroups && product.modifierGroups.length > 0

  const basePrice = selectedVariant?.price ?? product.price
  const modifiersTotal = Array.from(selectedModifiers.values())
    .flat()
    .reduce((sum, mod) => sum + mod.price, 0)
  const unitPrice = basePrice + modifiersTotal
  const totalPrice = unitPrice * quantity

  const handleModifierToggle = (group: ModifierGroup, modifier: Modifier) => {
    const currentGroupModifiers = selectedModifiers.get(group.id) || []
    const isSelected = currentGroupModifiers.some(m => m.id === modifier.id)

    let newGroupModifiers: CartItemModifier[]

    if (group.type === 'SINGLE') {
      newGroupModifiers = isSelected ? [] : [{
        id: modifier.id,
        name: modifier.name,
        price: modifier.price,
        groupId: group.id,
        groupName: group.name,
      }]
    } else {
      if (isSelected) {
        newGroupModifiers = currentGroupModifiers.filter(m => m.id !== modifier.id)
      } else {
        if (group.maxSelections > 0 && currentGroupModifiers.length >= group.maxSelections) {
          return
        }
        newGroupModifiers = [...currentGroupModifiers, {
          id: modifier.id,
          name: modifier.name,
          price: modifier.price,
          groupId: group.id,
          groupName: group.name,
        }]
      }
    }

    const newSelectedModifiers = new Map(selectedModifiers)
    if (newGroupModifiers.length > 0) {
      newSelectedModifiers.set(group.id, newGroupModifiers)
    } else {
      newSelectedModifiers.delete(group.id)
    }
    setSelectedModifiers(newSelectedModifiers)
  }

  const isModifierSelected = (groupId: string, modifierId: string) => {
    const groupModifiers = selectedModifiers.get(groupId) || []
    return groupModifiers.some(m => m.id === modifierId)
  }

  const canAddToCart = () => {
    if (hasVariants && !selectedVariant) return false
    
    for (const group of product.modifierGroups || []) {
      const groupModifiers = selectedModifiers.get(group.id) || []
      if (group.isRequired && groupModifiers.length < group.minSelections) {
        return false
      }
    }
    
    return true
  }

  const handleAddToCart = () => {
    if (!canAddToCart()) return

    const allModifiers = Array.from(selectedModifiers.values()).flat()

    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.image || undefined,
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.name,
      basePrice,
      quantity,
      modifiers: allModifiers,
      notes: notes || undefined,
    })

    onClose()
  }

  const quickAdd = !hasVariants && !hasModifiers

  if (quickAdd) {
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.image || undefined,
      basePrice: product.price,
      quantity: 1,
      modifiers: [],
    })
    onClose()
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 rounded-2xl overflow-hidden">
        <DialogHeader className="p-4 pb-3 border-b border-gray-100">
          <div className="flex items-start gap-3">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon size={24} className="text-gray-300" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                {product.name}
              </DialogTitle>
              {product.description && (
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{product.description}</p>
              )}
              <p className="text-base font-semibold mt-1" style={{ color: primaryColor }}>
                {formatPrice(product.price)}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-h-[50vh]">
          {hasVariants && (
            <div>
              <Label className="text-sm font-medium text-gray-900 mb-2 block">
                Variante *
              </Label>
              <Select
                value={selectedVariant?.id || ''}
                onValueChange={(value) => {
                  const variant = activeVariants.find(v => v.id === value)
                  if (variant) setSelectedVariant(variant)
                }}
              >
                <SelectTrigger 
                  className="h-12 rounded-xl"
                  style={{ 
                    borderColor: selectedVariant ? primaryColor : undefined,
                    boxShadow: selectedVariant ? `0 0 0 1px ${primaryColor}` : undefined 
                  }}
                >
                  <SelectValue placeholder="Choisir une variante" />
                </SelectTrigger>
                <SelectContent accentColor={primaryColor}>
                  {activeVariants.map((variant) => (
                    <SelectItem key={variant.id} value={variant.id}>
                      <div className="flex items-center justify-between w-full gap-4">
                        <span>{variant.name}</span>
                        <span className="text-gray-500">{formatPrice(variant.price)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {hasModifiers && product.modifierGroups!.map((group) => (
            <div key={group.id}>
              <Label className="text-sm font-medium text-gray-900 mb-2 block">
                {group.name}
                {group.isRequired && ' *'}
                {group.maxSelections > 0 && (
                  <span className="text-xs text-gray-500 ml-1">
                    (max {group.maxSelections})
                  </span>
                )}
              </Label>
              <div className="space-y-2">
                {group.modifiers.map((modifier) => {
                  const isSelected = isModifierSelected(group.id, modifier.id)
                  return (
                    <button
                      key={modifier.id}
                      onClick={() => handleModifierToggle(group, modifier)}
                      className={cn(
                        'w-full p-3 rounded-xl border-2 flex items-center justify-between transition-all',
                        isSelected
                          ? ''
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                      style={isSelected ? { 
                        borderColor: primaryColor,
                        backgroundColor: `${primaryColor}10`
                      } : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className={cn(
                            'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                            !isSelected && 'border-gray-300'
                          )}
                          style={isSelected ? { borderColor: primaryColor, backgroundColor: primaryColor } : undefined}
                        >
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                        <span className="text-sm text-gray-900">{modifier.name}</span>
                      </div>
                      {modifier.price > 0 && (
                        <span className="text-sm text-gray-500">
                          +{formatPrice(modifier.price)}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          <div>
            <Label className="text-sm font-medium text-gray-900 mb-2 block">
              Notes (optionnel)
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instructions speciales..."
              className="rounded-xl resize-none focus:ring-2"
              style={{ 
                '--tw-ring-color': primaryColor,
              } as React.CSSProperties}
              rows={2}
            />
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 space-y-3">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="h-10 w-10 p-0 rounded-xl transition-colors"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = primaryColor
                e.currentTarget.style.color = primaryColor
                e.currentTarget.style.backgroundColor = `${primaryColor}10`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = ''
                e.currentTarget.style.color = ''
                e.currentTarget.style.backgroundColor = ''
              }}
            >
              <Minus size={18} />
            </Button>
            <span className="text-xl font-semibold w-12 text-center" style={{ color: primaryColor }}>{quantity}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(quantity + 1)}
              className="h-10 w-10 p-0 rounded-xl transition-colors"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = primaryColor
                e.currentTarget.style.color = primaryColor
                e.currentTarget.style.backgroundColor = `${primaryColor}10`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = ''
                e.currentTarget.style.color = ''
                e.currentTarget.style.backgroundColor = ''
              }}
            >
              <Plus size={18} />
            </Button>
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={!canAddToCart()}
            className="w-full h-14 rounded-xl text-white text-lg font-semibold"
            style={{ backgroundColor: primaryColor }}
          >
            <ShoppingCart size={20} className="mr-2" />
            Ajouter {formatPrice(totalPrice)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
