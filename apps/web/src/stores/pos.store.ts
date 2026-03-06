'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ServiceType = 'DINE_IN' | 'PICKUP' | 'DELIVERY'
export type PaymentMethod = 'CASH' | 'CARD' | 'MIXED'

export interface CartItemModifier {
  id: string
  name: string
  price: number
  groupId: string
  groupName: string
}

export interface CartItem {
  id: string
  productId: string
  productName: string
  productImage?: string
  variantId?: string
  variantName?: string
  basePrice: number
  quantity: number
  modifiers: CartItemModifier[]
  notes?: string
  unitPrice: number
  totalPrice: number
  isExisting?: boolean
}

export interface POSCustomer {
  id: string
  name: string
  phone?: string
  email?: string
}

export interface POSDiscount {
  type: 'percentage' | 'fixed'
  value: number
  reason?: string
  code?: string
}

export interface EditingOrder {
  id: string
  orderNumber: string
  displayNumber: string
  tableNumber?: string
  serviceType?: ServiceType
  total: number
  subtotal: number
  discount: number
  customer?: {
    id: string
    name: string
    phone?: string
    email?: string
  } | null
  existingItems: Array<{
    id: string
    productId: string
    productName: string
    variantName?: string
    quantity: number
    unitPrice: number
    totalPrice: number
    modifiers: Array<{ id: string; name: string; price: number }>
  }>
}

interface POSState {
  cart: CartItem[]
  serviceType: ServiceType
  customer: POSCustomer | null
  discount: POSDiscount | null
  tableNumber?: string
  deliveryAddress?: string
  orderNotes?: string
  
  // Mode édition commande ouverte
  editingOrder: EditingOrder | null
  isEditMode: boolean

  addItem: (item: Omit<CartItem, 'id' | 'unitPrice' | 'totalPrice'>) => void
  removeItem: (itemId: string) => void
  updateItemQuantity: (itemId: string, quantity: number) => void
  updateItemNotes: (itemId: string, notes: string) => void
  clearCart: () => void

  setServiceType: (type: ServiceType) => void
  setCustomer: (customer: POSCustomer | null) => void
  setDiscount: (discount: POSDiscount | null) => void
  setTableNumber: (tableNumber: string | undefined) => void
  setDeliveryAddress: (address: string | undefined) => void
  setOrderNotes: (notes: string | undefined) => void

  // Mode édition
  startEditOrder: (order: EditingOrder) => void
  cancelEditOrder: () => void

  getSubtotal: () => number
  getExistingSubtotal: () => number
  getFullTotal: (taxRate: number) => number
  getDiscountAmount: () => number
  getTaxAmount: (taxRate: number) => number
  getTotal: (taxRate: number) => number
  getItemCount: () => number
  getNewItemsCount: () => number

  resetOrder: () => void
}

const calculateItemPrice = (item: Omit<CartItem, 'id' | 'unitPrice' | 'totalPrice'>): { unitPrice: number; totalPrice: number } => {
  const modifiersTotal = item.modifiers.reduce((sum, mod) => sum + mod.price, 0)
  const unitPrice = item.basePrice + modifiersTotal
  const totalPrice = unitPrice * item.quantity
  return { unitPrice, totalPrice }
}

const generateItemId = () => `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export const usePOSStore = create<POSState>()(
  persist(
    (set, get) => ({
      cart: [],
      serviceType: 'DINE_IN',
      customer: null,
      discount: null,
      tableNumber: undefined,
      deliveryAddress: undefined,
      orderNotes: undefined,
      editingOrder: null,
      isEditMode: false,

      addItem: (item) => {
        const { unitPrice, totalPrice } = calculateItemPrice(item)
        const newItem: CartItem = {
          ...item,
          id: generateItemId(),
          unitPrice,
          totalPrice,
          isExisting: false,
        }

        set((state) => ({
          cart: [...state.cart, newItem],
        }))
      },

      removeItem: (itemId) => {
        set((state) => ({
          cart: state.cart.filter((item) => item.id !== itemId || item.isExisting),
        }))
      },

      updateItemQuantity: (itemId, quantity) => {
        const item = get().cart.find(i => i.id === itemId)
        if (item?.isExisting) return

        if (quantity <= 0) {
          get().removeItem(itemId)
          return
        }

        set((state) => ({
          cart: state.cart.map((item) => {
            if (item.id === itemId && !item.isExisting) {
              const totalPrice = item.unitPrice * quantity
              return { ...item, quantity, totalPrice }
            }
            return item
          }),
        }))
      },

      updateItemNotes: (itemId, notes) => {
        set((state) => ({
          cart: state.cart.map((item) =>
            item.id === itemId ? { ...item, notes } : item
          ),
        }))
      },

      clearCart: () => {
        set((state) => ({
          cart: state.cart.filter(item => item.isExisting),
        }))
      },

      setServiceType: (serviceType) => {
        set({ serviceType })
      },

      setCustomer: (customer) => {
        set({ customer })
      },

      setDiscount: (discount) => {
        set({ discount })
      },

      setTableNumber: (tableNumber) => {
        set({ tableNumber })
      },

      setDeliveryAddress: (deliveryAddress) => {
        set({ deliveryAddress })
      },

      setOrderNotes: (orderNotes) => {
        set({ orderNotes })
      },

      getSubtotal: () => {
        return get().cart.filter(item => !item.isExisting).reduce((sum, item) => sum + item.totalPrice, 0)
      },

      getExistingSubtotal: () => {
        return get().cart.filter(item => item.isExisting).reduce((sum, item) => sum + item.totalPrice, 0)
      },

      getFullTotal: (taxRate: number) => {
        const state = get()
        if (state.isEditMode && state.editingOrder) {
          const newSubtotal = state.cart.filter(item => !item.isExisting).reduce((sum, item) => sum + item.totalPrice, 0)
          return state.editingOrder.total + newSubtotal + (newSubtotal * taxRate / 100)
        }
        return state.getTotal(taxRate)
      },

      getDiscountAmount: () => {
        const { discount } = get()
        if (!discount) return 0

        const subtotal = get().getSubtotal()
        if (discount.type === 'percentage') {
          return (subtotal * discount.value) / 100
        }
        return Math.min(discount.value, subtotal)
      },

      getTaxAmount: (taxRate: number) => {
        const subtotal = get().getSubtotal()
        const discountAmount = get().getDiscountAmount()
        return ((subtotal - discountAmount) * taxRate) / 100
      },

      getTotal: (taxRate: number) => {
        const subtotal = get().getSubtotal()
        const discountAmount = get().getDiscountAmount()
        const taxAmount = get().getTaxAmount(taxRate)
        return subtotal - discountAmount + taxAmount
      },

      getItemCount: () => {
        return get().cart.reduce((sum, item) => sum + item.quantity, 0)
      },

      getNewItemsCount: () => {
        return get().cart.filter(item => !item.isExisting).reduce((sum, item) => sum + item.quantity, 0)
      },

      startEditOrder: (order: EditingOrder) => {
        const existingCartItems: CartItem[] = order.existingItems.map(item => ({
          id: `existing-${item.id}`,
          productId: item.productId,
          productName: item.productName,
          variantName: item.variantName,
          basePrice: item.unitPrice,
          quantity: item.quantity,
          modifiers: item.modifiers.map(m => ({
            id: m.id,
            name: m.name,
            price: m.price,
            groupId: '',
            groupName: '',
          })),
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          isExisting: true,
        }))

        set({
          editingOrder: order,
          isEditMode: true,
          cart: existingCartItems,
          serviceType: order.serviceType || 'DINE_IN',
          tableNumber: order.tableNumber,
          customer: order.customer ? {
            id: order.customer.id,
            name: order.customer.name,
            phone: order.customer.phone,
            email: order.customer.email,
          } : null,
        })
      },

      cancelEditOrder: () => {
        set({
          editingOrder: null,
          isEditMode: false,
          cart: [],
          tableNumber: undefined,
        })
      },

      resetOrder: () => {
        set({
          cart: [],
          customer: null,
          discount: null,
          tableNumber: undefined,
          deliveryAddress: undefined,
          orderNotes: undefined,
          editingOrder: null,
          isEditMode: false,
        })
      },
    }),
    {
      name: 'iziresto-pos-store',
      partialize: (state) => ({
        cart: state.cart,
        serviceType: state.serviceType,
        customer: state.customer,
        discount: state.discount,
        tableNumber: state.tableNumber,
        deliveryAddress: state.deliveryAddress,
        orderNotes: state.orderNotes,
        editingOrder: state.editingOrder,
        isEditMode: state.isEditMode,
      }),
    }
  )
)
