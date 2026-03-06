'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'
import { usePOSStore, EditingOrder } from '@/stores/pos.store'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  Users, 
  Clock, 
  ChevronRight,
  Loader2,
  UtensilsCrossed,
  Search,
  LayoutList,
  LayoutGrid,
  RefreshCw,
  Check,
  CreditCard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/hooks/use-media-query'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

interface OpenOrdersPanelProps {
  restaurantId: string | null
  primaryColor: string
  formatPrice: (price: number) => string
  onClose?: () => void
  isOpen: boolean
  onCheckoutOrder?: (order: any) => void
}

type ViewMode = 'list' | 'grid'
type FilterStatus = 'all' | 'dine_in' | 'pickup' | 'delivery'

export function OpenOrdersPanel({
  restaurantId,
  primaryColor,
  formatPrice,
  onClose,
  isOpen,
  onCheckoutOrder,
}: OpenOrdersPanelProps) {
  const { accessToken } = useAuthStore()
  const { startEditOrder, isEditMode, editingOrder } = usePOSStore()
  const isMobile = useMediaQuery('(max-width: 639px)')
  
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')

  const { data: openOrdersData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['open-orders', restaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.getOpenOrders(restaurantId || undefined)
      return res.data || []
    },
    enabled: !!accessToken && !!restaurantId && isOpen,
    refetchInterval: 30000,
  })

  const openOrders = openOrdersData || []

  const filteredOrders = useMemo(() => {
    let result = openOrders

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((order: any) => 
        order.displayNumber?.toLowerCase().includes(query) ||
        order.tableNumber?.toLowerCase().includes(query) ||
        order.customer?.name?.toLowerCase().includes(query) ||
        order.guestName?.toLowerCase().includes(query)
      )
    }

    if (filterStatus !== 'all') {
      result = result.filter((order: any) => 
        order.serviceType?.toLowerCase() === filterStatus
      )
    }

    return result
  }, [openOrders, searchQuery, filterStatus])

  const buildEditOrder = (order: any): EditingOrder => ({
    id: order.id,
    orderNumber: order.orderNumber,
    displayNumber: order.displayNumber,
    tableNumber: order.tableNumber,
    serviceType: order.serviceType as any,
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

  const handleSelectOrder = (order: any) => {
    startEditOrder(buildEditOrder(order))
    onClose?.()
  }

  const filterOptions: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'Tous' },
    { value: 'dine_in', label: 'Sur place' },
    { value: 'pickup', label: 'À emporter' },
    { value: 'delivery', label: 'Livraison' },
  ]

  const panelContent = (
    <>
      {/* Barre de recherche et filtres */}
      <div className="p-4 border-b border-gray-100 space-y-3 bg-gray-50">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par table, numéro, client..."
            className="pl-10 h-11 rounded-xl bg-white border-gray-200 focus:ring-2 focus:ring-offset-0 focus:border-transparent"
            style={{ '--tw-ring-color': `${primaryColor}40` } as React.CSSProperties}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1 flex-1 overflow-x-auto pb-1">
            {filterOptions.map((option) => {
              const isActive = filterStatus === option.value
              return (
                <button
                  key={option.value}
                  onClick={() => setFilterStatus(option.value)}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all border"
                  style={
                    isActive
                      ? { backgroundColor: primaryColor, color: 'white', borderColor: primaryColor }
                      : { backgroundColor: 'white', color: '#4b5563', borderColor: '#e5e7eb' }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = primaryColor
                      e.currentTarget.style.color = primaryColor
                      e.currentTarget.style.backgroundColor = `${primaryColor}08`
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = '#e5e7eb'
                      e.currentTarget.style.color = '#4b5563'
                      e.currentTarget.style.backgroundColor = 'white'
                    }
                  }}
                >
                  {option.label}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 flex-shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "text-white" : "text-gray-500")}
              style={viewMode === 'list' ? { backgroundColor: primaryColor } : {}}
            >
              <LayoutList size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn("p-1.5 rounded-md transition-all", viewMode === 'grid' ? "text-white" : "text-gray-500")}
              style={viewMode === 'grid' ? { backgroundColor: primaryColor } : {}}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Liste des commandes */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <UtensilsCrossed size={48} className="mb-4 opacity-30" />
            <p className="text-base font-medium">
              {searchQuery || filterStatus !== 'all' ? 'Aucun résultat trouvé' : 'Aucune commande ouverte'}
            </p>
            <p className="text-sm mt-1 text-center">
              {searchQuery || filterStatus !== 'all' ? 'Essayez de modifier vos filtres' : 'Les tables en cours apparaîtront ici'}
            </p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-3">
            {filteredOrders.map((order: any) => {
              const isSelected = isEditMode && editingOrder?.id === order.id
              return (
                <div
                  key={order.id}
                  className={cn(
                    "rounded-2xl border transition-all overflow-hidden",
                    isSelected ? "border-2 shadow-sm" : "border-gray-200 hover:shadow-md"
                  )}
                  style={
                    isSelected
                      ? { borderColor: primaryColor, backgroundColor: `${primaryColor}06` }
                      : {}
                  }
                >
                  <button
                    onClick={() => handleSelectOrder(order)}
                    className="w-full p-4 text-left flex items-center gap-4"
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.closest('div')!.style.borderColor = primaryColor
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.closest('div')!.style.borderColor = ''
                      }
                    }}
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-lg"
                      style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                    >
                      {order.tableNumber || '#'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-base">
                          {order.tableNumber ? `Table ${order.tableNumber}` : `#${order.displayNumber}`}
                        </span>
                        {isSelected && (
                          <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: primaryColor }}>
                            Sélectionnée
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: fr })}
                        </span>
                        <span>{order.itemsCount} article{order.itemsCount > 1 ? 's' : ''}</span>
                        {order.customer && (
                          <span className="flex items-center gap-1">
                            <Users size={12} />
                            {order.customer.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-lg" style={{ color: primaryColor }}>
                        {formatPrice(order.total)}
                      </p>
                    </div>

                    <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
                  </button>

                  {onCheckoutOrder && (
                    <div className="px-4 pb-3 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onCheckoutOrder(order)
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-80"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <CreditCard size={14} />
                        Demander l'addition
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredOrders.map((order: any) => {
              const isSelected = isEditMode && editingOrder?.id === order.id
              return (
                <button
                  key={order.id}
                  onClick={() => handleSelectOrder(order)}
                  className={cn(
                    "p-4 rounded-2xl border text-left transition-all hover:shadow-md",
                    isSelected ? "border-2 shadow-sm" : "border-gray-200"
                  )}
                  style={
                    isSelected
                      ? { borderColor: primaryColor, backgroundColor: `${primaryColor}06` }
                      : {}
                  }
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = primaryColor
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = ''
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div 
                      className="text-sm font-bold px-2.5 py-1 rounded-lg"
                      style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                    >
                      {order.tableNumber ? `T${order.tableNumber}` : `#${order.displayNumber}`}
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </div>

                  <p className="text-xl font-bold mb-2" style={{ color: primaryColor }}>
                    {formatPrice(order.total)}
                  </p>

                  <div className="space-y-1 text-xs text-gray-500">
                    <p>{order.itemsCount} article{order.itemsCount > 1 ? 's' : ''}</p>
                    {order.customer && (
                      <p className="flex items-center gap-1 truncate">
                        <Users size={10} />
                        {order.customer.name}
                      </p>
                    )}
                    <p className="flex items-center gap-1">
                      <Clock size={10} />
                      {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: fr })}
                    </p>
                  </div>

                  {onCheckoutOrder && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        onCheckoutOrder(order)
                      }}
                      className="w-full mt-3 py-2 rounded-xl text-white text-xs font-medium transition-opacity hover:opacity-80 flex items-center justify-center gap-1.5"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <CreditCard size={12} />
                      Demander l'addition
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <Button
          variant="outline"
          className="w-full h-11 rounded-xl gap-2 transition-colors"
          style={{ borderColor: primaryColor, color: primaryColor, backgroundColor: 'transparent' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${primaryColor}15` }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
          {isFetching ? 'Actualisation...' : 'Actualiser'}
        </Button>
      </div>
    </>
  )

  // Mobile: Drawer du bas
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
        <DrawerContent className="max-h-[85vh] flex flex-col">
          <DrawerHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <Users size={20} style={{ color: primaryColor }} />
              </div>
              <div>
                <DrawerTitle>Commandes ouvertes</DrawerTitle>
                <DrawerDescription>
                  {filteredOrders.length} commande{filteredOrders.length > 1 ? 's' : ''} en cours
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>
          {panelContent}
        </DrawerContent>
      </Drawer>
    )
  }

  // Desktop: Sheet latéral
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <SheetContent side="right" className="!max-w-none w-[480px] lg:w-[540px] p-0 flex flex-col">
        <SheetHeader className="p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <Users size={20} style={{ color: primaryColor }} />
            </div>
            <div>
              <SheetTitle>Commandes ouvertes</SheetTitle>
              <SheetDescription>
                {filteredOrders.length} commande{filteredOrders.length > 1 ? 's' : ''} en cours
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        {panelContent}
      </SheetContent>
    </Sheet>
  )
}
