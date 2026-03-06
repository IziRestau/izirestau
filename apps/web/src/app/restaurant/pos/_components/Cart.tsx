'use client'

import { useState, useMemo } from 'react'
import { usePOSStore, EditingOrder } from '@/stores/pos.store'
import { CartItem } from './CartItem'
import { ServiceTypeSelector } from './ServiceTypeSelector'
import { ItemNotesModal } from './ItemNotesModal'
import { Button } from '@/components/ui/button'
import { 
  ShoppingBag, 
  Trash2, 
  CreditCard,
  Percent,
  User,
  Plus,
  Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CartProps {
  formatPrice: (price: number) => string
  primaryColor: string
  taxRate: number
  onCheckout: () => void
  onSelectCustomer: () => void
  onApplyDiscount: () => void
  isEditMode?: boolean
  editingOrder?: EditingOrder | null
  onOpenOrder?: () => void
  isInDrawer?: boolean
}

export function Cart({
  formatPrice,
  primaryColor,
  taxRate,
  onCheckout,
  onSelectCustomer,
  onApplyDiscount,
  isEditMode = false,
  editingOrder,
  onOpenOrder,
  isInDrawer = false,
}: CartProps) {
  const {
    cart,
    serviceType,
    customer,
    discount,
    setServiceType,
    updateItemQuantity,
    updateItemNotes,
    removeItem,
    clearCart,
    getSubtotal,
    getExistingSubtotal,
    getFullTotal,
    getDiscountAmount,
    getTaxAmount,
    getTotal,
    getItemCount,
    getNewItemsCount,
  } = usePOSStore()

  const [notesModalOpen, setNotesModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<{ id: string; name: string; image?: string; price?: number; notes?: string } | null>(null)

  const existingItems = useMemo(() => cart.filter(item => item.isExisting), [cart])
  const newItems = useMemo(() => cart.filter(item => !item.isExisting), [cart])

  const subtotal = getSubtotal()
  const existingSubtotal = getExistingSubtotal()
  const discountAmount = getDiscountAmount()
  const taxAmount = getTaxAmount(taxRate)
  const total = getTotal(taxRate)
  const fullTotal = getFullTotal(taxRate)
  const itemCount = getItemCount()
  const newItemsCount = getNewItemsCount()

  const handleEditNotes = (itemId: string, itemName: string, itemImage?: string, itemPrice?: number, currentNotes?: string) => {
    setEditingItem({ id: itemId, name: itemName, image: itemImage, price: itemPrice, notes: currentNotes })
    setNotesModalOpen(true)
  }

  const handleSaveNotes = (notes: string) => {
    if (editingItem) {
      updateItemNotes(editingItem.id, notes)
    }
    setNotesModalOpen(false)
    setEditingItem(null)
  }

  return (
    <div className={cn(
      "bg-white flex flex-col",
      isInDrawer 
        ? "h-full border-0 rounded-none" 
        : "w-full lg:w-96 rounded-xl sm:rounded-2xl border border-gray-200 h-full"
    )}>
      <div className={cn("border-b border-gray-100", isInDrawer ? "p-3 pt-0" : "p-3 sm:p-4")}>
        {!isInDrawer && (
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} style={{ color: primaryColor }} />
              <h2 className="font-semibold text-gray-900">
                {isEditMode && editingOrder ? `Commande #${editingOrder.displayNumber}` : 'Panier'}
              </h2>
              {itemCount > 0 && (
                <span 
                  className="text-xs text-white px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: primaryColor }}
                >
                  {itemCount}
                </span>
              )}
            </div>
            {newItems.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} className="mr-1" />
                Vider
              </Button>
            )}
          </div>
        )}

        {isInDrawer && newItems.length > 0 && (
          <div className="flex justify-end mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 size={14} className="mr-1" />
              Vider les ajouts
            </Button>
          </div>
        )}

        <ServiceTypeSelector
          value={serviceType}
          onChange={isEditMode ? () => {} : setServiceType}
          primaryColor={primaryColor}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <ShoppingBag size={48} className="mb-3 opacity-50" />
            <p className="text-sm">Panier vide</p>
            <p className="text-xs">Sélectionnez des produits</p>
          </div>
        ) : (
          <>
            {existingItems.length > 0 && (
              <>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium uppercase tracking-wide pb-1">
                  <Lock size={10} />
                  Articles validés ({existingItems.length})
                </div>
                {existingItems.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={() => {}}
                    onRemove={() => {}}
                    onEditNotes={() => {}}
                    formatPrice={formatPrice}
                    primaryColor={primaryColor}
                  />
                ))}
                {newItems.length > 0 && (
                  <div className="border-t border-dashed border-gray-200 my-2" />
                )}
              </>
            )}
            {newItems.length > 0 && (
              <>
                {existingItems.length > 0 && (
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide pb-1" style={{ color: primaryColor }}>
                    <Plus size={10} />
                    Nouveaux articles ({newItems.length})
                  </div>
                )}
                {newItems.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={(qty) => updateItemQuantity(item.id, qty)}
                    onRemove={() => removeItem(item.id)}
                    onEditNotes={() => handleEditNotes(item.id, item.productName, item.productImage, item.totalPrice, item.notes)}
                    formatPrice={formatPrice}
                    primaryColor={primaryColor}
                  />
                ))}
              </>
            )}
            {isEditMode && existingItems.length > 0 && newItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                <Plus size={32} className="mb-2 opacity-50" />
                <p className="text-xs">Ajoutez des articles ou demandez l'addition</p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="p-3 sm:p-4 border-t border-gray-100 space-y-2 sm:space-y-3">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectCustomer}
            onMouseEnter={(e) => {
              if (!customer) {
                e.currentTarget.style.borderColor = primaryColor
                e.currentTarget.style.color = primaryColor
                e.currentTarget.style.backgroundColor = `${primaryColor}10`
              }
            }}
            onMouseLeave={(e) => {
              if (!customer) {
                e.currentTarget.style.borderColor = ''
                e.currentTarget.style.color = ''
                e.currentTarget.style.backgroundColor = ''
              }
            }}
            className={cn(
              "flex-1 h-9 sm:h-10 rounded-xl text-xs sm:text-sm transition-colors",
              customer && "border-2"
            )}
            style={customer ? { 
              borderColor: primaryColor, 
              color: primaryColor,
              backgroundColor: `${primaryColor}08`
            } : undefined}
          >
            <User size={14} className="mr-1 sm:mr-1.5" />
            <span className="truncate">{customer ? customer.name : 'Client'}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onApplyDiscount}
            onMouseEnter={(e) => {
              if (!discount) {
                e.currentTarget.style.borderColor = primaryColor
                e.currentTarget.style.color = primaryColor
                e.currentTarget.style.backgroundColor = `${primaryColor}10`
              }
            }}
            onMouseLeave={(e) => {
              if (!discount) {
                e.currentTarget.style.borderColor = ''
                e.currentTarget.style.color = ''
                e.currentTarget.style.backgroundColor = ''
              }
            }}
            className={cn(
              "flex-1 h-9 sm:h-10 rounded-xl text-xs sm:text-sm transition-colors",
              discount && "border-2"
            )}
            style={discount ? { 
              borderColor: primaryColor, 
              color: primaryColor,
              backgroundColor: `${primaryColor}08`
            } : undefined}
          >
            <Percent size={14} className="mr-1 sm:mr-1.5" />
            <span className="truncate">{discount ? `-${discount.type === 'percentage' ? `${discount.value}%` : formatPrice(discount.value)}` : 'Remise'}</span>
          </Button>
        </div>

        <div className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm">
          {isEditMode && editingOrder && existingItems.length > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Commande existante</span>
              <span>{formatPrice(editingOrder.total)}</span>
            </div>
          )}
          {newItems.length > 0 && isEditMode && (
            <div className="flex justify-between text-gray-600">
              <span>Nouveaux articles</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
          )}
          {!isEditMode && (
            <div className="flex justify-between text-gray-600">
              <span>Sous-total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
          )}
          {discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Remise</span>
              <span>-{formatPrice(discountAmount)}</span>
            </div>
          )}
          {!isEditMode && (
            <div className="flex justify-between text-gray-600">
              <span>TVA ({taxRate}%)</span>
              <span>{formatPrice(taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base sm:text-lg font-bold text-gray-900 pt-2 border-t border-gray-100">
            <span>Total</span>
            <span style={{ color: primaryColor }}>{formatPrice(isEditMode && editingOrder ? fullTotal : total)}</span>
          </div>
        </div>

        {isEditMode && editingOrder ? (
          <div className="space-y-2">
            {newItems.length > 0 && onOpenOrder && (
              <Button
                onClick={onOpenOrder}
                className="w-full h-10 sm:h-12 rounded-xl text-white font-semibold transition-all hover:opacity-90 hover:shadow-md text-sm sm:text-base"
                style={{ backgroundColor: `${primaryColor}dd` }}
              >
                <Plus size={16} className="mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Ajouter {newItemsCount} article(s) à la commande</span>
                <span className="sm:hidden">+{newItemsCount} article(s)</span>
              </Button>
            )}
            <Button
              onClick={onCheckout}
              className="w-full h-12 sm:h-14 rounded-xl text-white text-base sm:text-lg font-semibold transition-all hover:opacity-90 hover:shadow-lg"
              style={{ backgroundColor: primaryColor }}
            >
              <CreditCard size={18} className="mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Demander l'addition ({formatPrice(fullTotal)})</span>
              <span className="sm:hidden">Addition {formatPrice(fullTotal)}</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Bouton créer commande ouverte (sur place uniquement) */}
            {serviceType === 'DINE_IN' && cart.length > 0 && onOpenOrder && (
              <Button
                onClick={onOpenOrder}
                variant="outline"
                className="w-full h-9 sm:h-10 rounded-xl font-medium transition-colors text-sm"
                style={{ 
                  borderColor: primaryColor, 
                  color: primaryColor,
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${primaryColor}15`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <Plus size={16} className="mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Ouvrir la commande (sans paiement)</span>
                <span className="sm:hidden">Ouvrir commande</span>
              </Button>
            )}
            {/* Bouton encaisser */}
            <Button
              onClick={onCheckout}
              disabled={cart.length === 0}
              className="w-full h-12 sm:h-14 rounded-xl text-white text-base sm:text-lg font-semibold transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-50 disabled:hover:shadow-none"
              style={{ backgroundColor: primaryColor }}
            >
              <CreditCard size={18} className="mr-1 sm:mr-2" />
              Encaisser {formatPrice(total)}
            </Button>
          </div>
        )}
      </div>

      <ItemNotesModal
        isOpen={notesModalOpen}
        onClose={() => {
          setNotesModalOpen(false)
          setEditingItem(null)
        }}
        onSave={handleSaveNotes}
        productName={editingItem?.name || ''}
        productImage={editingItem?.image}
        productPrice={editingItem?.price}
        formatPrice={formatPrice}
        currentNotes={editingItem?.notes}
        primaryColor={primaryColor}
      />
    </div>
  )
}
