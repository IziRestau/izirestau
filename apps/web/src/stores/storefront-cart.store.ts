import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, CartItemInput } from '@/components/storefront/themes/_types'

interface ReorderItem {
  productId: string
  productName: string
  variantId?: string | null
  variantName?: string | null
  quantity: number
  unitPrice: number
}

interface StorefrontCartState {
  items: CartItem[]
  serviceType: 'PICKUP' | 'DELIVERY' | 'DINE_IN'
  customerName: string
  customerPhone: string
  customerEmail: string
  customerNotes: string
  deliveryAddress: string
  isCartOpen: boolean

  addItem: (input: CartItemInput) => void
  removeItem: (cartId: string) => void
  updateQuantity: (cartId: string, quantity: number) => void
  clearCart: () => void
  setServiceType: (type: 'PICKUP' | 'DELIVERY' | 'DINE_IN') => void
  setCustomerInfo: (info: { name?: string; phone?: string; email?: string; notes?: string; address?: string }) => void
  reorderItems: (items: ReorderItem[], serviceType?: 'PICKUP' | 'DELIVERY' | 'DINE_IN') => void
  openCart: () => void
  closeCart: () => void

  getItemCount: () => number
  getSubtotal: () => number
}

export const useStorefrontCartStore = create<StorefrontCartState>()(
  persist(
    (set, get) => ({
      items: [],
      serviceType: 'PICKUP',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      customerNotes: '',
      deliveryAddress: '',
      isCartOpen: false,

      addItem: (input: CartItemInput) => {
        const modifierKey = input.modifiers.map(m => m.id).sort().join(',')
        const existingIndex = get().items.findIndex(
          item =>
            item.productId === input.productId &&
            item.variantId === input.variantId &&
            item.modifiers.map(m => m.id).sort().join(',') === modifierKey
        )

        if (existingIndex >= 0) {
          const items = [...get().items]
          const existing = items[existingIndex]
          const newQuantity = existing.quantity + input.quantity
          items[existingIndex] = {
            ...existing,
            quantity: newQuantity,
            totalPrice: existing.unitPrice * newQuantity,
          }
          set({ items })
        } else {
          const modifierTotal = input.modifiers.reduce((sum, m) => sum + m.price, 0)
          const unitPrice = input.unitPrice + modifierTotal
          const cartItem: CartItem = {
            ...input,
            cartId: `cart-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            unitPrice,
            totalPrice: unitPrice * input.quantity,
          }
          set({ items: [...get().items, cartItem] })
        }
      },

      removeItem: (cartId: string) => {
        set({ items: get().items.filter(item => item.cartId !== cartId) })
      },

      updateQuantity: (cartId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(cartId)
          return
        }
        const items = get().items.map(item =>
          item.cartId === cartId
            ? { ...item, quantity, totalPrice: item.unitPrice * quantity }
            : item
        )
        set({ items })
      },

      clearCart: () => {
        set({
          items: [],
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          customerNotes: '',
          deliveryAddress: '',
        })
      },

      setServiceType: (type) => set({ serviceType: type }),

      setCustomerInfo: (info) => {
        set({
          ...(info.name !== undefined && { customerName: info.name }),
          ...(info.phone !== undefined && { customerPhone: info.phone }),
          ...(info.email !== undefined && { customerEmail: info.email }),
          ...(info.notes !== undefined && { customerNotes: info.notes }),
          ...(info.address !== undefined && { deliveryAddress: info.address }),
        })
      },

      reorderItems: (items, serviceType) => {
        const cartItems: CartItem[] = items.map((item, index) => ({
          cartId: `reorder-${Date.now()}-${index}`,
          productId: item.productId,
          productName: item.productName,
          variantId: item.variantId || null,
          variantName: item.variantName || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
          modifiers: [],
          notes: '',
          image: null,
        }))
        set({ 
          items: cartItems,
          serviceType: serviceType || get().serviceType,
          isCartOpen: true,
        })
      },

      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),

      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

      getSubtotal: () => get().items.reduce((sum, item) => sum + item.totalPrice, 0),
    }),
    {
      name: 'storefront-cart',
      partialize: (state) => ({
        items: state.items,
        serviceType: state.serviceType,
        customerName: state.customerName,
        customerPhone: state.customerPhone,
        customerEmail: state.customerEmail,
      }),
    }
  )
)
