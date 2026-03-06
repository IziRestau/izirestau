'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  TrendingUp,
  Star,
  Tag,
  MessageSquare,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Send,
  Clock,
  Package,
  Truck,
  ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { api, apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Separator } from '@/components/ui/separator'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { useIsMobile } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import type { Customer, CustomerOrder } from '@/types/customer'

interface CustomerDetailPanelProps {
  customerId: string | null
  isOpen: boolean
  onClose: () => void
  onEdit: (customer: Customer) => void
  primaryColor?: string
  formatCurrency: (value: number) => string
}

const serviceTypeIcons: Record<string, typeof Truck> = {
  DELIVERY: Truck,
  PICKUP: Package,
  DINE_IN: ShoppingBag,
}

const statusLabels: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  PREPARING: 'En préparation',
  READY: 'Prête',
  OUT_FOR_DELIVERY: 'En livraison',
  DELIVERED: 'Livrée',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PREPARING: 'bg-orange-100 text-orange-700',
  READY: 'bg-purple-100 text-purple-700',
  OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

export function CustomerDetailPanel({
  customerId,
  isOpen,
  onClose,
  onEdit,
  primaryColor = '#10b981',
  formatCurrency,
}: CustomerDetailPanelProps) {
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()
  const { currentRestaurantId } = useRestaurantStore()
  const isMobile = useIsMobile()

  const [activeTab, setActiveTab] = useState('overview')
  const [noteInput, setNoteInput] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const { data: customerData, isLoading } = useQuery({
    queryKey: ['restaurant-customer', customerId],
    queryFn: async () => {
      if (!customerId) return null
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.customers.get(customerId, currentRestaurantId || undefined)
      return res.data
    },
    enabled: !!customerId && isOpen,
  })

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['restaurant-customer-orders', customerId],
    queryFn: async () => {
      if (!customerId) return null
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.customers.getOrders(customerId, {
        limit: 20,
        restaurantId: currentRestaurantId || undefined,
      })
      return res.data
    },
    enabled: !!customerId && isOpen && activeTab === 'orders',
  })

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (!customerId) return
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.customers.toggle(customerId)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-customers'] })
      queryClient.invalidateQueries({ queryKey: ['restaurant-customer', customerId] })
      toast.success(data?.data?.isActive ? 'Client activé' : 'Client désactivé')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la modification')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!customerId) return
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.customers.delete(customerId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-customers'] })
      queryClient.invalidateQueries({ queryKey: ['restaurant-customers-stats'] })
      toast.success('Client supprimé')
      setShowDeleteModal(false)
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la suppression')
    },
  })

  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!customerId) return
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.customers.addNote(customerId, content, currentRestaurantId || undefined)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-customer', customerId] })
      toast.success('Note ajoutée')
      setNoteInput('')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de l\'ajout de la note')
    },
  })

  const handleAddNote = () => {
    if (noteInput.trim()) {
      addNoteMutation.mutate(noteInput.trim())
    }
  }

  const customer = customerData as Customer | undefined

  const renderOverview = () => {
    if (!customer) return null

    return (
      <div className="space-y-6">
        {/* Contact */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Contact</h4>
          <div className="space-y-2">
            <a
              href={`mailto:${customer.email}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Mail size={16} className="text-gray-400" />
              <span className="text-sm text-gray-700">{customer.email}</span>
            </a>
            {customer.phone && (
              <a
                href={`tel:${customer.phone}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Phone size={16} className="text-gray-400" />
                <span className="text-sm text-gray-700">{customer.phone}</span>
              </a>
            )}
          </div>
        </div>

        <Separator />

        {/* Stats */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Statistiques</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingBag size={14} className="text-gray-400" />
                <span className="text-xs text-gray-500">Commandes</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{customer.totalOrders}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={14} className="text-gray-400" />
                <span className="text-xs text-gray-500">Total dépensé</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(customer.totalSpent)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={14} className="text-gray-400" />
                <span className="text-xs text-gray-500">Panier moyen</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(customer.avgOrderValue)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Star size={14} className="text-gray-400" />
                <span className="text-xs text-gray-500">Points fidélité</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{customer.loyaltyPoints}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Adresses */}
        {customer.addresses.length > 0 && (
          <>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Adresses</h4>
              <div className="space-y-2">
                {customer.addresses.map((address) => (
                  <div
                    key={address.id}
                    className={cn(
                      'p-3 rounded-lg border',
                      address.isDefault ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        {address.label && (
                          <p className="text-xs font-medium text-gray-500 mb-1">{address.label}</p>
                        )}
                        <p className="text-sm text-gray-700">
                          {address.street}
                          {address.streetLine2 && `, ${address.streetLine2}`}
                        </p>
                        <p className="text-sm text-gray-700">
                          {address.postalCode} {address.city}
                        </p>
                        {address.instructions && (
                          <p className="text-xs text-gray-500 mt-1 italic">{address.instructions}</p>
                        )}
                      </div>
                      {address.isDefault && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                          Par défaut
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Préférences */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Préférences</h4>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">Consentement marketing</span>
            <span
              className={cn(
                'text-xs font-medium px-2 py-1 rounded',
                customer.marketingOptIn ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
              )}
            >
              {customer.marketingOptIn ? 'Accepté' : 'Refusé'}
            </span>
          </div>
        </div>

        {/* Tags */}
        {customer.tags.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {customer.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Dates */}
        <Separator />
        <div className="text-xs text-gray-500 space-y-1">
          <p>
            <Clock size={12} className="inline mr-1" />
            Inscrit le {format(new Date(customer.createdAt), 'dd MMMM yyyy', { locale: fr })}
          </p>
          {customer.lastOrderAt && (
            <p>
              <ShoppingBag size={12} className="inline mr-1" />
              Dernière commande le {format(new Date(customer.lastOrderAt), 'dd MMMM yyyy', { locale: fr })}
            </p>
          )}
        </div>
      </div>
    )
  }

  const renderOrders = () => {
    if (ordersLoading) {
      return (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-lg animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-32" />
            </div>
          ))}
        </div>
      )
    }

    const orders = ordersData as CustomerOrder[] | undefined

    if (!orders || orders.length === 0) {
      return (
        <div className="text-center py-8">
          <ShoppingBag size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">Aucune commande</p>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {orders.map((order) => {
          const ServiceIcon = serviceTypeIcons[order.serviceType] || ShoppingBag
          return (
            <div
              key={order.id}
              className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">#{order.displayNumber}</span>
                  <span className={cn('text-xs px-2 py-0.5 rounded', statusColors[order.status] || 'bg-gray-100 text-gray-600')}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>
                <span className="font-semibold text-gray-900">{formatCurrency(order.total)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <ServiceIcon size={12} />
                  <span>{format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
                </div>
                <ChevronRight size={14} />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderNotes = () => {
    if (!customer) return null

    const notes = customer.notes?.split('\n\n').filter(Boolean) || []

    return (
      <div className="space-y-4">
        {/* Formulaire ajout note */}
        <div className="flex gap-2">
          <Input
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="Ajouter une note..."
            className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleAddNote()
              }
            }}
          />
          <Button
            onClick={handleAddNote}
            disabled={!noteInput.trim() || addNoteMutation.isPending}
            style={{ backgroundColor: primaryColor }}
            className="text-white shrink-0 h-11 rounded-xl"
          >
            {addNoteMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </Button>
        </div>

        {/* Liste des notes */}
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">Aucune note</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.reverse().map((note, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{note}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const panelHeader = (
    <>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg"
            style={{ backgroundColor: primaryColor }}
          >
            {customer?.firstName?.[0]}{customer?.lastName?.[0]}
          </div>
          <div>
            <div className="text-left font-semibold text-lg">
              {isLoading ? (
                <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
              ) : (
                `${customer?.firstName} ${customer?.lastName}`
              )}
            </div>
            {customer && (
              <p className="text-sm text-gray-500">{customer.email}</p>
            )}
          </div>
        </div>
      </div>

      {/* Badges */}
      {customer && (
        <div className="flex items-center gap-2 mt-3">
          <span
            className={cn(
              'text-xs font-medium px-2 py-1 rounded',
              customer.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
            )}
          >
            {customer.isActive ? 'Actif' : 'Inactif'}
          </span>
          {customer.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-xs font-medium px-2 py-1 rounded"
              style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
            >
              {tag}
            </span>
          ))}
          {customer.tags.length > 2 && (
            <span className="text-xs text-gray-500">+{customer.tags.length - 2}</span>
          )}
        </div>
      )}

      {/* Actions */}
      {customer && (
        <div className="flex items-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(customer)}
            className="flex-1 h-10 rounded-xl transition-colors"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${primaryColor}15`
              e.currentTarget.style.borderColor = primaryColor
              e.currentTarget.style.color = primaryColor
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = ''
              e.currentTarget.style.borderColor = ''
              e.currentTarget.style.color = ''
            }}
          >
            <Edit size={14} className="mr-1" />
            Modifier
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleMutation.mutate()}
            disabled={toggleMutation.isPending}
            className="h-10 rounded-xl transition-colors"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${primaryColor}15`
              e.currentTarget.style.borderColor = primaryColor
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = ''
              e.currentTarget.style.borderColor = ''
            }}
          >
            {customer.isActive ? (
              <ToggleRight size={14} className="text-emerald-600" />
            ) : (
              <ToggleLeft size={14} className="text-gray-400" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-10 rounded-xl"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      )}
    </>
  )

  const panelContent = (
    <>
      <Separator className="my-4" />

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="overview">Aperçu</TabsTrigger>
            <TabsTrigger value="orders">Commandes</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            {renderOverview()}
          </TabsContent>

          <TabsContent value="orders" className="mt-0">
            {renderOrders()}
          </TabsContent>

          <TabsContent value="notes" className="mt-0">
            {renderNotes()}
          </TabsContent>
        </Tabs>
      )}
    </>
  )

  return (
    <>
      {isMobile ? (
        <Drawer open={isOpen} onOpenChange={onClose}>
          <DrawerContent>
            <DrawerHeader className="text-left pb-4">
              {panelHeader}
            </DrawerHeader>
            <div className="max-h-[60vh] overflow-y-auto px-4 pb-4">
              {panelContent}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet open={isOpen} onOpenChange={onClose}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader className="pb-4">
              {panelHeader}
            </SheetHeader>
            {panelContent}
          </SheetContent>
        </Sheet>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Supprimer le client"
        message={`Êtes-vous sûr de vouloir supprimer ${customer?.firstName} ${customer?.lastName} ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
        icon="trash"
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}
