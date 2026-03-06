'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { usePOSStore, PaymentMethod, EditingOrder } from '@/stores/pos.store'
import { useRestaurantCurrency } from '@/hooks/use-restaurant-currency'
import { useRestaurantNavigation } from '@/hooks/use-restaurant-navigation'
import { DashboardLayout } from '@/components/shared/dashboard'
import { api, apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { CategoryTabs } from './_components/CategoryTabs'
import { ProductGrid } from './_components/ProductGrid'
import { Cart } from './_components/Cart'
import { ProductCustomizeModal } from './_components/ProductCustomizeModal'
import { PaymentModal } from './_components/PaymentModal'
import { OrderConfirmation } from './_components/OrderConfirmation'
import { CustomerSelectModal } from './_components/CustomerSelectModal'
import { DiscountModal } from './_components/DiscountModal'
import { Search, Loader2, Users, X, ShoppingBag } from 'lucide-react'
import { OpenOrdersPanel } from './_components/OpenOrdersPanel'
import { Button } from '@/components/ui/button'
import { useQueryClient } from '@tanstack/react-query'
import { useMediaQuery } from '@/hooks/use-media-query'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

export default function POSPage() {
  const { accessToken } = useAuthStore()
  const { restaurant, organization, restaurants, currentRestaurantId, switchRestaurant } = useRestaurantStore()
  const navigation = useRestaurantNavigation()
  const { format: formatPrice } = useRestaurantCurrency()
  const { 
    cart, 
    serviceType, 
    customer, 
    discount,
    tableNumber,
    deliveryAddress,
    orderNotes,
    getTotal,
    resetOrder,
    isEditMode,
    editingOrder,
    cancelEditOrder,
    startEditOrder,
  } = usePOSStore()
  const queryClient = useQueryClient()

  const primaryColor = organization?.primaryColor || '#10b981'
  const taxRate = 10

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const PRODUCTS_PER_PAGE = 15
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [customizeModalOpen, setCustomizeModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [lastOrder, setLastOrder] = useState<{
    orderNumber: string
    total: string
    paymentMethod: string
    change?: string
    receiptId?: string
    customerEmail?: string
  } | null>(null)
  const [openOrdersPanelOpen, setOpenOrdersPanelOpen] = useState(false)
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false)
  const [customerModalOpen, setCustomerModalOpen] = useState(false)
  const [discountModalOpen, setDiscountModalOpen] = useState(false)
  const isMobile = useMediaQuery('(max-width: 1023px)')

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['pos-categories', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.categories.list(currentRestaurantId || undefined)
      return res.data || []
    },
    enabled: !!accessToken && !!currentRestaurantId,
    staleTime: 5 * 60 * 1000,
  })

  const { data: productsResponse, isLoading: productsLoading } = useQuery({
    queryKey: ['pos-products', currentRestaurantId, selectedCategoryId, searchQuery, currentPage],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.products.list({
        restaurantId: currentRestaurantId || undefined,
        categoryId: selectedCategoryId || undefined,
        search: searchQuery || undefined,
        page: currentPage,
        limit: PRODUCTS_PER_PAGE,
      })
      return res
    },
    enabled: !!accessToken && !!currentRestaurantId,
    staleTime: 2 * 60 * 1000,
  })

  const productsData = productsResponse?.data || []
  const pagination = productsResponse?.pagination

  const categories = categoriesData || []
  const products = productsData

  // Reset page when category or search changes
  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId)
    setCurrentPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const filteredProducts = useMemo(() => {
    return products.filter((p: any) => p.isActive)
  }, [products])

  // Mutation pour créer une nouvelle commande
  const createOrderMutation = useMutation({
    mutationFn: async (data: {
      paymentMethod?: PaymentMethod
      amountReceived?: number
      openOrder?: boolean // Créer une commande ouverte sans paiement
    }) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      
      const orderData = {
        restaurantId: currentRestaurantId || undefined,
        serviceType,
        source: 'POS',
        customerId: customer?.id,
        tableNumber: serviceType === 'DINE_IN' ? tableNumber : undefined,
        deliveryAddress: serviceType === 'DELIVERY' ? deliveryAddress : undefined,
        customerNotes: orderNotes,
        paymentMethod: data.openOrder ? undefined : data.paymentMethod,
        items: cart.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          notes: item.notes,
          modifiers: item.modifiers.map(m => ({
            modifierId: m.id,
          })),
        })),
        discount: discount ? {
          type: discount.type,
          value: discount.value,
          reason: discount.reason,
          code: discount.code,
        } : undefined,
      }

      const res = await api.restaurant.createOrder(orderData)
      return { ...res.data, openOrder: data.openOrder }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['open-orders'] })
      
      if (variables.openOrder) {
        // Commande ouverte créée
        toast.success(`Commande #${data?.displayNumber} ouverte${tableNumber ? ` - Table ${tableNumber}` : ''}`)
        resetOrder()
      } else {
        // Commande payée
        const total = getTotal(taxRate)
        const change = variables.amountReceived 
          ? variables.amountReceived - total 
          : undefined

        setLastOrder({
          orderNumber: data?.orderNumber || data?.displayNumber || 'N/A',
          total: formatPrice(total),
          paymentMethod: variables.paymentMethod || 'CASH',
          change: change !== undefined && change > 0 ? formatPrice(change) : undefined,
          receiptId: (data as any)?.receipt?.id,
          customerEmail: customer?.email,
        })

        setPaymentModalOpen(false)
        setConfirmationOpen(true)
      }
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la création de la commande', {
        description: error.message || 'Une erreur est survenue',
      })
    },
  })

  // Mutation pour ajouter des articles à une commande existante
  const addItemsMutation = useMutation({
    mutationFn: async (data: { orderId: string }) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      
      const newItems = cart.filter(item => !item.isExisting)
      const res = await api.restaurant.addItemsToOrder(data.orderId, {
        restaurantId: currentRestaurantId || undefined,
        items: newItems.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          notes: item.notes,
          modifiers: item.modifiers.map(m => ({
            modifierId: m.id,
          })),
        })),
      })
      return res.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['open-orders'] })
      toast.success(`${data?.addedItems} article(s) ajouté(s) à la commande #${data?.orderNumber}`)
      resetOrder()
    },
    onError: (error: any) => {
      toast.error('Erreur lors de l\'ajout des articles', {
        description: error.message || 'Une erreur est survenue',
      })
    },
  })

  // Mutation pour clôturer une commande ouverte
  const closeOrderMutation = useMutation({
    mutationFn: async (data: {
      orderId: string
      paymentMethod: PaymentMethod
      amountReceived?: number
    }) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      
      const res = await api.restaurant.closeOrder(data.orderId, {
        restaurantId: currentRestaurantId || undefined,
        paymentMethod: data.paymentMethod,
        amountReceived: data.amountReceived,
      })
      return res.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['open-orders'] })
      
      setLastOrder({
        orderNumber: data?.orderNumber || data?.displayNumber || 'N/A',
        total: formatPrice(data?.total || 0),
        paymentMethod: variables.paymentMethod,
        change: data?.change ? formatPrice(data.change) : undefined,
        receiptId: data?.receipt?.id,
        customerEmail: customer?.email,
      })

      setPaymentModalOpen(false)
      setConfirmationOpen(true)
      resetOrder()
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la clôture de la commande', {
        description: error.message || 'Une erreur est survenue',
      })
    },
  })

  const handleProductClick = (product: any) => {
    const hasVariants = product.variants && product.variants.length > 0
    const hasModifiers = product.modifierGroups && product.modifierGroups.length > 0

    if (!hasVariants && !hasModifiers) {
      usePOSStore.getState().addItem({
        productId: product.id,
        productName: product.name,
        productImage: product.image || undefined,
        basePrice: product.price,
        quantity: 1,
        modifiers: [],
      })
      toast.success(`${product.name} ajoute au panier`)
    } else {
      setSelectedProduct(product)
      setCustomizeModalOpen(true)
    }
  }

  const handleCheckout = () => {
    if (cart.length === 0 && !(isEditMode && editingOrder)) {
      toast.error('Le panier est vide')
      return
    }
    setPaymentModalOpen(true)
  }

  const handlePaymentConfirm = async (paymentMethod: PaymentMethod, amountReceived?: number) => {
    if (isEditMode && editingOrder) {
      const newItems = cart.filter(item => !item.isExisting)
      if (newItems.length > 0) {
        await addItemsMutation.mutateAsync({ orderId: editingOrder.id })
      }
      await closeOrderMutation.mutateAsync({ 
        orderId: editingOrder.id, 
        paymentMethod, 
        amountReceived 
      })
    } else {
      await createOrderMutation.mutateAsync({ paymentMethod, amountReceived })
    }
  }

  const handleOpenOrder = async () => {
    const newItems = cart.filter(item => !item.isExisting)
    if (newItems.length === 0) {
      toast.error('Aucun nouvel article à ajouter')
      return
    }
    if (isEditMode && editingOrder) {
      await addItemsMutation.mutateAsync({ orderId: editingOrder.id })
    } else {
      await createOrderMutation.mutateAsync({ openOrder: true })
    }
  }

  const handleNewOrder = () => {
    resetOrder()
    setConfirmationOpen(false)
    setLastOrder(null)
  }

  const handleSelectCustomer = () => {
    setCustomerModalOpen(true)
  }

  const handleApplyDiscount = () => {
    setDiscountModalOpen(true)
  }

  const handleCheckoutOrder = (order: any) => {
    startEditOrder({
      id: order.id,
      orderNumber: order.orderNumber,
      displayNumber: order.displayNumber,
      tableNumber: order.tableNumber,
      serviceType: order.serviceType,
      total: order.total,
      subtotal: order.subtotal,
      discount: order.discount || 0,
      customer: order.customer || null,
      existingItems: order.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        modifiers: item.modifiers,
      })),
    })
    setOpenOrdersPanelOpen(false)
    setPaymentModalOpen(true)
  }

  if (!accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    )
  }

  const restaurantName = organization?.name || restaurant?.name || ''

  return (
    <DashboardLayout
      navigation={navigation}
      basePath="/restaurant"
      pageTitle="Caisse"
      logoText={restaurantName}
      primaryColor={primaryColor}
      restaurants={restaurants}
      currentRestaurantId={currentRestaurantId}
      onSwitchRestaurant={(id) => accessToken && switchRestaurant(accessToken, id)}
    >
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-[calc(100vh-120px)] sm:min-h-[calc(100vh-140px)] lg:h-[calc(100vh-180px)] pb-20 lg:pb-0 overflow-x-hidden">
        <div className="flex-1 flex flex-col min-h-0 min-w-0 w-full overflow-hidden">
          {/* Bandeau mode édition */}
          {isEditMode && editingOrder && (
            <div 
              className="mb-3 sm:mb-4 p-2 sm:p-3 rounded-xl flex items-center justify-between gap-2"
              style={{ backgroundColor: `${primaryColor}15`, borderColor: primaryColor, borderWidth: 1 }}
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div 
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Users size={18} className="text-white sm:hidden" />
                  <Users size={20} className="text-white hidden sm:block" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                    #{editingOrder.displayNumber}
                    {editingOrder.tableNumber && ` - T${editingOrder.tableNumber}`}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                    {editingOrder.existingItems.length} article(s) • {formatPrice(editingOrder.total)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={cancelEditOrder}
                className="rounded-lg transition-colors flex-shrink-0 h-8 sm:h-9 px-2 sm:px-3"
                style={{ 
                  borderColor: 'rgb(239 68 68)', 
                  color: 'rgb(239 68 68)',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgb(254 226 226)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <X size={16} className="sm:mr-1" />
                <span className="hidden sm:inline">Annuler</span>
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-4 mb-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Rechercher..."
                className="pl-10 h-10 sm:h-11 rounded-xl bg-white border-gray-200 focus:ring-2 text-sm sm:text-base"
                style={{ 
                  '--tw-ring-color': primaryColor,
                } as React.CSSProperties}
              />
            </div>
            
            {/* Bouton commandes ouvertes */}
            <Button
              variant="outline"
              onClick={() => setOpenOrdersPanelOpen(true)}
              className="h-10 sm:h-11 rounded-xl gap-2 transition-colors px-3 sm:px-4 flex-shrink-0"
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
              <Users size={18} />
              <span className="hidden md:inline">Tables ouvertes</span>
            </Button>
          </div>

          <CategoryTabs
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={handleCategoryChange}
            primaryColor={primaryColor}
          />

          <div className="flex-1 overflow-y-auto overflow-x-hidden mt-3 sm:mt-4 min-h-0">
            <ProductGrid
              products={filteredProducts}
              isLoading={productsLoading}
              onProductClick={handleProductClick}
              formatPrice={formatPrice}
              primaryColor={primaryColor}
            />

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 sm:gap-2 mt-4 pb-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  <span className="hidden sm:inline">Précédent</span>
                  <span className="sm:hidden">Préc.</span>
                </button>
                <div className="flex items-center gap-0.5 sm:gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum: number
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? 'text-white'
                            : 'border border-gray-200 hover:bg-gray-50'
                        }`}
                        style={currentPage === pageNum ? { backgroundColor: primaryColor } : {}}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  <span className="hidden sm:inline">Suivant</span>
                  <span className="sm:hidden">Suiv.</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Cart - Desktop sidebar */}
        {!isMobile && (
          <Cart
            formatPrice={formatPrice}
            primaryColor={primaryColor}
            taxRate={taxRate}
            onCheckout={handleCheckout}
            onSelectCustomer={handleSelectCustomer}
            onApplyDiscount={handleApplyDiscount}
            isEditMode={isEditMode}
            editingOrder={editingOrder}
            onOpenOrder={handleOpenOrder}
          />
        )}
      </div>

      {/* Mobile: Bouton flottant panier + Drawer */}
      {isMobile && (
        <>
          <button
            onClick={() => setCartDrawerOpen(true)}
            className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-4 py-3 rounded-full text-white font-semibold shadow-lg transition-transform active:scale-95"
            style={{ backgroundColor: primaryColor }}
          >
            <ShoppingBag size={20} />
            {cart.length > 0 && (
              <>
                <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                <span className="text-white/80">•</span>
                <span>{formatPrice(getTotal(taxRate))}</span>
              </>
            )}
            {cart.length === 0 && <span>Panier</span>}
          </button>

          <Drawer open={cartDrawerOpen} onOpenChange={setCartDrawerOpen}>
            <DrawerContent className="max-h-[85vh] flex flex-col">
              <DrawerHeader className="pb-0">
                <DrawerTitle className="flex items-center gap-2">
                  <ShoppingBag size={20} style={{ color: primaryColor }} />
                  Panier
                  {cart.length > 0 && (
                    <span 
                      className="text-xs text-white px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  )}
                </DrawerTitle>
              </DrawerHeader>
              <div className="flex-1 overflow-hidden">
                <Cart
                  formatPrice={formatPrice}
                  primaryColor={primaryColor}
                  taxRate={taxRate}
                  onCheckout={() => {
                    setCartDrawerOpen(false)
                    handleCheckout()
                  }}
                  onSelectCustomer={handleSelectCustomer}
                  onApplyDiscount={handleApplyDiscount}
                  isEditMode={isEditMode}
                  editingOrder={editingOrder}
                  onOpenOrder={() => {
                    setCartDrawerOpen(false)
                    handleOpenOrder()
                  }}
                  isInDrawer
                />
              </div>
            </DrawerContent>
          </Drawer>
        </>
      )}

      <ProductCustomizeModal
        product={selectedProduct}
        isOpen={customizeModalOpen}
        onClose={() => {
          setCustomizeModalOpen(false)
          setSelectedProduct(null)
        }}
        formatPrice={formatPrice}
        primaryColor={primaryColor}
      />

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onConfirm={handlePaymentConfirm}
        formatPrice={formatPrice}
        primaryColor={primaryColor}
        taxRate={taxRate}
      />

      {lastOrder && (
        <OrderConfirmation
          isOpen={confirmationOpen}
          onClose={() => setConfirmationOpen(false)}
          onNewOrder={handleNewOrder}
          orderNumber={lastOrder.orderNumber}
          total={lastOrder.total}
          paymentMethod={lastOrder.paymentMethod}
          change={lastOrder.change}
          primaryColor={primaryColor}
          receiptId={lastOrder.receiptId}
          customerEmail={lastOrder.customerEmail}
        />
      )}

      <OpenOrdersPanel
        restaurantId={currentRestaurantId}
        primaryColor={primaryColor}
        formatPrice={formatPrice}
        isOpen={openOrdersPanelOpen}
        onClose={() => setOpenOrdersPanelOpen(false)}
        onCheckoutOrder={handleCheckoutOrder}
      />

      <CustomerSelectModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        primaryColor={primaryColor}
      />

      <DiscountModal
        isOpen={discountModalOpen}
        onClose={() => setDiscountModalOpen(false)}
        primaryColor={primaryColor}
        formatPrice={formatPrice}
        taxRate={taxRate}
      />
    </DashboardLayout>
  )
}
