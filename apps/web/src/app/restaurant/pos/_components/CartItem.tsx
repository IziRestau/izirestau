'use client'

import { useState } from 'react'
import { Minus, Plus, Trash2, MessageSquare, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CartItem as CartItemType } from '@/stores/pos.store'

interface CartItemProps {
  item: CartItemType
  onUpdateQuantity: (quantity: number) => void
  onRemove: () => void
  onEditNotes: () => void
  formatPrice: (price: number) => string
  primaryColor: string
}

export function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
  onEditNotes,
  formatPrice,
  primaryColor,
}: CartItemProps) {
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null)
  const isLocked = !!item.isExisting

  const getButtonStyle = (btnId: string) => {
    if (hoveredBtn === btnId) {
      return { backgroundColor: `${primaryColor}15`, color: primaryColor }
    }
    return { color: '#6b7280' }
  }

  return (
    <div className={`rounded-xl p-3 border ${isLocked ? 'bg-gray-50 border-gray-200 opacity-75' : 'bg-white border-gray-100'}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {isLocked && <Lock size={10} className="text-gray-400 flex-shrink-0" />}
            <h4 className="font-medium text-gray-900 text-sm truncate">
              {item.productName}
            </h4>
          </div>
          {item.variantName && (
            <p className="text-xs text-gray-500">{item.variantName}</p>
          )}
          {item.modifiers.length > 0 && (
            <div className="mt-1 space-y-0.5">
              {item.modifiers.map((mod) => (
                <p key={mod.id} className="text-xs text-gray-500">
                  + {mod.name} {mod.price > 0 && `(${formatPrice(mod.price)})`}
                </p>
              ))}
            </div>
          )}
          {item.notes && (
            <p 
              className="text-xs mt-1 flex items-center gap-1"
              style={{ color: primaryColor }}
            >
              <MessageSquare size={10} />
              {item.notes}
            </p>
          )}
        </div>
        <p className="font-semibold text-sm" style={{ color: isLocked ? '#6b7280' : primaryColor }}>
          {formatPrice(item.totalPrice)}
        </p>
      </div>

      {isLocked ? (
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>x{item.quantity}</span>
          <span className="flex items-center gap-1">
            <Lock size={10} />
            Validé
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpdateQuantity(item.quantity - 1)}
              onMouseEnter={() => setHoveredBtn('minus')}
              onMouseLeave={() => setHoveredBtn(null)}
              className="h-8 w-8 p-0 rounded-lg transition-colors"
              style={item.quantity === 1 
                ? (hoveredBtn === 'minus' ? { backgroundColor: '#fef2f2' } : undefined)
                : getButtonStyle('minus')
              }
            >
              {item.quantity === 1 ? (
                <Trash2 size={14} className="text-red-500" />
              ) : (
                <Minus size={14} />
              )}
            </Button>
            <span 
              className="w-8 text-center font-semibold text-sm"
              style={{ color: primaryColor }}
            >
              {item.quantity}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpdateQuantity(item.quantity + 1)}
              onMouseEnter={() => setHoveredBtn('plus')}
              onMouseLeave={() => setHoveredBtn(null)}
              className="h-8 w-8 p-0 rounded-lg transition-colors"
              style={getButtonStyle('plus')}
            >
              <Plus size={14} />
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEditNotes}
              onMouseEnter={() => setHoveredBtn('notes')}
              onMouseLeave={() => setHoveredBtn(null)}
              className="h-8 w-8 p-0 rounded-lg transition-colors"
              style={getButtonStyle('notes')}
            >
              <MessageSquare size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              onMouseEnter={() => setHoveredBtn('remove')}
              onMouseLeave={() => setHoveredBtn(null)}
              className="h-8 w-8 p-0 rounded-lg transition-colors"
              style={hoveredBtn === 'remove' 
                ? { backgroundColor: '#fef2f2', color: '#ef4444' } 
                : { color: '#ef4444' }
              }
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
