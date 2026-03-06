'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import { api } from '@/lib/api-client'
import { useRestaurantCurrency } from '@/hooks/use-restaurant-currency'
import { useRestaurantPermissions } from '@/hooks/use-restaurant-permissions'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  Package,
  CreditCard,
  RefreshCw,
  XCircle,
  Printer,
  Check,
  Truck,
  ShoppingBag,
  ChevronRight,
  Loader2,
  Receipt,
  Send,
  FileText,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { OrderStatusBadge, orderStatusLabels } from './OrderStatusBadge'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { SendReceiptEmailModal } from './SendReceiptEmailModal'
import { cn } from '@/lib/utils'

interface OrderDetailPanelProps {
  orderId: string | null
  isOpen: boolean
  onClose: () => void
  primaryColor?: string
  onChangeStatus?: () => void
  onCancel?: () => void
  onPaymentStatusChanged?: () => void
}

const serviceTypeLabels: Record<string, string> = {
  DELIVERY: 'Livraison',
  PICKUP: 'A emporter',
  DINE_IN: 'Sur place',
}

const serviceTypeIcons: Record<string, typeof Truck> = {
  DELIVERY: Truck,
  PICKUP: Package,
  DINE_IN: ShoppingBag,
}

const paymentMethodLabels: Record<string, string> = {
  CASH: 'Especes',
  CARD: 'Carte',
  CARD_ONLINE: 'Carte en ligne',
  APPLE_PAY: 'Apple Pay',
  GOOGLE_PAY: 'Google Pay',
  OTHER: 'Autre',
}

const paymentStatusLabels: Record<string, string> = {
  PENDING: 'En attente',
  AUTHORIZED: 'Autorise',
  PAID: 'Paye',
  PARTIALLY_REFUNDED: 'Partiellement rembourse',
  REFUNDED: 'Rembourse',
  FAILED: 'Echoue',
  CANCELLED: 'Annule',
}

export function OrderDetailPanel({ 
  orderId, 
  isOpen, 
  onClose, 
  primaryColor = '#10b981',
  onChangeStatus,
  onCancel,
  onPaymentStatusChanged,
}: OrderDetailPanelProps) {
  const { accessToken } = useAuthStore()
  const { format: formatCurrency } = useRestaurantCurrency()
  const queryClient = useQueryClient()
  const { canMarkAsPaid: hasMarkPaidPermission, canCancelOrders } = useRestaurantPermissions()
  
  const [confirmMarkPaid, setConfirmMarkPaid] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [receiptId, setReceiptId] = useState<string | null>(null)

  const { data: order, isLoading } = useQuery({
    queryKey: ['restaurant-order', orderId],
    queryFn: async () => {
      if (!orderId) return null
      const res = await api.restaurant.getOrder(orderId)
      return res.data
    },
    enabled: !!accessToken && isOpen && !!orderId,
  })

  const markAsPaidMutation = useMutation({
    mutationFn: async () => {
      if (!orderId) throw new Error('ID commande requis')
      const res = await api.restaurant.updatePaymentStatus(orderId, { paymentStatus: 'PAID' })
      return res.data
    },
    onSuccess: () => {
      toast.success('Commande marquee comme payee')
      queryClient.invalidateQueries({ queryKey: ['restaurant-order', orderId] })
      queryClient.invalidateQueries({ queryKey: ['restaurant-orders'] })
      onPaymentStatusChanged?.()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la mise a jour')
    },
  })

  const ServiceIcon = order ? serviceTypeIcons[order.serviceType] || Package : Package
  const canModify = order && !['CANCELLED', 'COMPLETED', 'REFUNDED', 'DELIVERED', 'PICKED_UP'].includes(order.status)
  const canMarkAsPaid = order && order.paymentStatus === 'PENDING' && order.status !== 'CANCELLED' && hasMarkPaidPermission
  const isPaid = order?.paymentStatus === 'PAID'

  // Récupérer le reçu de la commande si elle est payée
  const { data: receiptData } = useQuery({
    queryKey: ['order-receipt', orderId],
    queryFn: async () => {
      if (!orderId) return null
      try {
        const res = await api.restaurant.receipts.getForOrder(orderId)
        return res.data
      } catch {
        return null
      }
    },
    enabled: !!accessToken && isOpen && !!orderId && isPaid,
  })

  const handleSheetOpenChange = (open: boolean) => {
    if (!open && !confirmMarkPaid && !showEmailModal) {
      onClose()
    }
  }

  const handleSendEmail = () => {
    if (receiptData?.id) {
      setReceiptId(receiptData.id)
      setShowEmailModal(true)
    } else {
      toast.error('Aucun reçu disponible pour cette commande')
    }
  }

  const handlePrintThermal = async () => {
    if (!receiptData?.id) {
      toast.error('Aucun reçu disponible pour cette commande')
      return
    }
    try {
      const res = await api.restaurant.receipts.getThermalCommands(receiptData.id, { width: '80mm' })
      if (res.data?.commands) {
        // Décoder les commandes base64 et créer un blob pour téléchargement
        const binaryString = atob(res.data.commands)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const blob = new Blob([bytes], { type: 'application/octet-stream' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `ticket-${receiptData.receiptNumber || 'receipt'}.bin`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Fichier d\'impression téléchargé')
      }
    } catch (error) {
      toast.error('Erreur lors de la génération du ticket')
    }
  }

  const handleDownloadPdf = async () => {
    if (!receiptData?.id) {
      toast.error('Aucun reçu disponible pour cette commande')
      return
    }
    try {
      await api.restaurant.receipts.downloadPdf(receiptData.id, `recu-${order?.displayNumber || receiptData.id}.pdf`)
      toast.success('PDF téléchargé')
    } catch {
      toast.error('Erreur lors du téléchargement du PDF')
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-lg p-0 flex flex-col [&>button]:hidden"
      >
        {/* Header */}
        <SheetHeader className="p-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <X size={18} className="text-gray-500" />
            </button>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg font-semibold text-gray-900">
                {order ? `Commande #${order.displayNumber}` : 'Details commande'}
              </SheetTitle>
            </div>
            {order && <OrderStatusBadge status={order.status} />}
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : !order ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Package className="w-12 h-12 mb-3 text-gray-300" />
              <p>Commande non trouvee</p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Info rapide */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl text-sm">
                  <Clock size={14} className="text-gray-400" />
                  <span className="text-gray-600">
                    {format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm', { locale: fr })}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl text-sm">
                  <ServiceIcon size={14} className="text-gray-400" />
                  <span className="text-gray-600">{serviceTypeLabels[order.serviceType]}</span>
                </div>
                {order.paymentMethod && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl text-sm">
                    <CreditCard size={14} className="text-gray-400" />
                    <span className="text-gray-600">{paymentMethodLabels[order.paymentMethod]}</span>
                    <span className={cn(
                      'px-1.5 py-0.5 rounded text-xs font-medium',
                      order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    )}>
                      {paymentStatusLabels[order.paymentStatus]}
                    </span>
                  </div>
                )}
              </div>

              {/* Client */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  Client
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">
                      {order.customer 
                        ? `${order.customer.firstName} ${order.customer.lastName}`
                        : order.guestName || 'Anonyme'
                      }
                    </span>
                    {order.customer && (
                      <span className="text-xs px-2 py-1 bg-white rounded-lg text-gray-500">
                        {order.customer.totalOrders} commandes
                      </span>
                    )}
                  </div>
                  {(order.customer?.phone || order.guestPhone) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={14} className="text-gray-400" />
                      {order.customer?.phone || order.guestPhone}
                    </div>
                  )}
                  {(order.customer?.email || order.guestEmail) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={14} className="text-gray-400" />
                      {order.customer?.email || order.guestEmail}
                    </div>
                  )}
                  {order.deliveryAddress && order.serviceType === 'DELIVERY' && (
                    <div className="flex items-start gap-2 text-sm text-gray-600 pt-2 border-t border-gray-100">
                      <MapPin size={14} className="text-gray-400 mt-0.5" />
                      <div>
                        {typeof order.deliveryAddress === 'object' && (
                          <>
                            <p>{(order.deliveryAddress as Record<string, string>).street}</p>
                            <p>{(order.deliveryAddress as Record<string, string>).postalCode} {(order.deliveryAddress as Record<string, string>).city}</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Articles */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ShoppingBag size={16} className="text-gray-400" />
                  Articles ({order.items.length})
                </h3>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                      {item.productImage ? (
                        <img 
                          src={item.productImage} 
                          alt={item.productName}
                          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <Package size={20} className="text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{item.productName}</p>
                            {item.variantName && (
                              <p className="text-xs text-gray-500">{item.variantName}</p>
                            )}
                          </div>
                          <span className="font-semibold text-gray-900 text-sm flex-shrink-0">
                            {formatCurrency(item.totalPrice)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.quantity} x {formatCurrency(item.unitPrice)}
                        </p>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.modifiers.map(mod => (
                              <span key={mod.id} className="text-xs px-1.5 py-0.5 bg-white rounded text-gray-500">
                                + {mod.name}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.specialInstructions && (
                          <p className="mt-1 text-xs text-orange-600 italic">
                            {item.specialInstructions}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recapitulatif */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Recapitulatif</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Sous-total</span>
                    <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                  </div>
                  {order.taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Taxes</span>
                      <span className="text-gray-900">{formatCurrency(order.taxAmount)}</span>
                    </div>
                  )}
                  {order.deliveryFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Livraison</span>
                      <span className="text-gray-900">{formatCurrency(order.deliveryFee)}</span>
                    </div>
                  )}
                  {order.tip > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Pourboire</span>
                      <span className="text-gray-900">{formatCurrency(order.tip)}</span>
                    </div>
                  )}
                  {order.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">
                        Reduction {order.couponCode && <span className="text-xs">({order.couponCode})</span>}
                      </span>
                      <span className="text-green-600">-{formatCurrency(order.discount)}</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-900">Total</span>
                    <span style={{ color: primaryColor }}>{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {(order.customerNotes || order.internalNotes || order.deliveryNotes) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Notes</h3>
                  <div className="space-y-2">
                    {order.customerNotes && (
                      <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                        <p className="text-xs font-medium text-yellow-800 mb-1">Note du client</p>
                        <p className="text-sm text-yellow-700">{order.customerNotes}</p>
                      </div>
                    )}
                    {order.deliveryNotes && (
                      <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-xs font-medium text-blue-800 mb-1">Instructions livraison</p>
                        <p className="text-sm text-blue-700">{order.deliveryNotes}</p>
                      </div>
                    )}
                    {order.internalNotes && (
                      <div className="p-3 bg-gray-100 rounded-xl">
                        <p className="text-xs font-medium text-gray-700 mb-1">Notes internes</p>
                        <p className="text-sm text-gray-600">{order.internalNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timeline */}
              {order.timeline && order.timeline.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Historique</h3>
                  <div className="space-y-0">
                    {order.timeline.map((event, index) => (
                      <div key={event.id} className="flex gap-3 relative">
                        <div className="flex flex-col items-center">
                          <div 
                            className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
                            style={{ backgroundColor: index === 0 ? primaryColor : '#d1d5db' }}
                          />
                          {index < order.timeline.length - 1 && (
                            <div className="w-px flex-1 bg-gray-200 my-1" />
                          )}
                        </div>
                        <div className="pb-4 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {orderStatusLabels[event.status] || event.status}
                          </p>
                          {event.message && (
                            <p className="text-xs text-gray-500 mt-0.5">{event.message}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {format(new Date(event.createdAt), 'dd/MM HH:mm', { locale: fr })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Annulation */}
              {order.status === 'CANCELLED' && order.cancelReason && (
                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                  <p className="text-sm font-medium text-red-800 mb-1">Commande annulee</p>
                  <p className="text-sm text-red-700">{order.cancelReason}</p>
                  {order.cancelledAt && (
                    <p className="text-xs text-red-600 mt-2">
                      {format(new Date(order.cancelledAt), 'dd/MM/yyyy a HH:mm', { locale: fr })}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {order && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0 space-y-2">
            {/* Bouton Marquer comme payé */}
            {canMarkAsPaid && (
              <Button 
                onClick={() => setConfirmMarkPaid(true)}
                className="w-full h-11 rounded-xl text-white"
                style={{ backgroundColor: '#10b981' }}
              >
                <Check size={16} className="mr-2" />
                Marquer comme payé
              </Button>
            )}

            {/* Actions de reçu si commande payée */}
            {isPaid && receiptData && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleSendEmail}
                  className="flex-1 h-10 rounded-xl transition-colors"
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
                  <Send size={14} className="mr-2" />
                  Email
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDownloadPdf}
                  className="flex-1 h-10 rounded-xl transition-colors"
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
                  <FileText size={14} className="mr-2" />
                  PDF
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handlePrintThermal}
                  className="flex-1 h-10 rounded-xl transition-colors"
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
                  <Printer size={14} className="mr-2" />
                  Ticket
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              {canModify && onChangeStatus && (
                <Button 
                  onClick={onChangeStatus}
                  className="flex-1 h-11 rounded-xl text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <RefreshCw size={16} className="mr-2" />
                  Changer statut
                </Button>
              )}
              {canModify && onCancel && canCancelOrders && (
                <Button 
                  variant="outline" 
                  onClick={onCancel} 
                  className="h-11 rounded-xl text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                >
                  <XCircle size={16} className="mr-2" />
                  Annuler
                </Button>
              )}
              {!canModify && !isPaid && (
                <Button 
                  variant="outline" 
                  onClick={() => window.print()}
                  className="flex-1 h-11 rounded-xl"
                >
                  <Printer size={16} className="mr-2" />
                  Imprimer
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Modal de confirmation - Marquer comme payé */}
        <ConfirmModal
          isOpen={confirmMarkPaid}
          onClose={() => setConfirmMarkPaid(false)}
          onConfirm={() => {
            markAsPaidMutation.mutate()
            setConfirmMarkPaid(false)
          }}
          title="Marquer comme payé"
          message="Confirmez-vous que le paiement a été reçu pour cette commande ?"
          confirmText="Confirmer le paiement"
          variant="success"
          icon="check"
          isLoading={markAsPaidMutation.isPending}
        />

        {/* Modal d'envoi d'email */}
        {receiptId && (
          <SendReceiptEmailModal
            isOpen={showEmailModal}
            onClose={() => {
              setShowEmailModal(false)
              setReceiptId(null)
            }}
            receiptId={receiptId}
            defaultEmail={order?.customer?.email || order?.guestEmail || ''}
            primaryColor={primaryColor}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
