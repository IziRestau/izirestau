'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import {
  Clock,
  CheckCircle,
  ChefHat,
  Package,
  Truck,
  Check,
  Loader2,
  ArrowRight,
  Info,
} from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface ChangeStatusModalProps {
  orderId: string | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  primaryColor?: string
}

interface StatusInfo {
  key: string
  label: string
  icon: typeof Clock
  bgColor: string
  textColor: string
  iconBg: string
  description: string
  action: string
  serviceTypes?: string[]
}

const statusFlow: StatusInfo[] = [
  { 
    key: 'PENDING', 
    label: 'En attente', 
    icon: Clock, 
    bgColor: 'bg-yellow-50', 
    textColor: 'text-yellow-700', 
    iconBg: 'bg-yellow-100',
    description: 'La commande vient d\'arriver et attend d\'etre traitee.',
    action: 'Verifiez les details et confirmez la commande.',
  },
  { 
    key: 'CONFIRMED', 
    label: 'Confirmee', 
    icon: CheckCircle, 
    bgColor: 'bg-blue-50', 
    textColor: 'text-blue-700', 
    iconBg: 'bg-blue-100',
    description: 'La commande a ete acceptee et sera bientot preparee.',
    action: 'Le client est notifie de la confirmation.',
  },
  { 
    key: 'PREPARING', 
    label: 'En preparation', 
    icon: ChefHat, 
    bgColor: 'bg-purple-50', 
    textColor: 'text-purple-700', 
    iconBg: 'bg-purple-100',
    description: 'La cuisine prepare activement cette commande.',
    action: 'Le client peut suivre l\'avancement.',
  },
  { 
    key: 'READY', 
    label: 'Prete', 
    icon: Package, 
    bgColor: 'bg-green-50', 
    textColor: 'text-green-700', 
    iconBg: 'bg-green-100',
    description: 'La commande est prete a etre recuperee ou livree.',
    action: 'Notification envoyee au client/livreur.',
  },
  { 
    key: 'OUT_FOR_DELIVERY', 
    label: 'En livraison', 
    icon: Truck, 
    bgColor: 'bg-indigo-50', 
    textColor: 'text-indigo-700', 
    iconBg: 'bg-indigo-100',
    description: 'Le livreur est en route vers le client.',
    action: 'Le client peut suivre la livraison en temps reel.',
    serviceTypes: ['DELIVERY'],
  },
  { 
    key: 'DELIVERED', 
    label: 'Livree', 
    icon: Check, 
    bgColor: 'bg-emerald-50', 
    textColor: 'text-emerald-700', 
    iconBg: 'bg-emerald-100',
    description: 'La commande a ete livree avec succes.',
    action: 'Le client peut laisser un avis.',
    serviceTypes: ['DELIVERY'],
  },
  { 
    key: 'PICKED_UP', 
    label: 'Recuperee', 
    icon: Check, 
    bgColor: 'bg-emerald-50', 
    textColor: 'text-emerald-700', 
    iconBg: 'bg-emerald-100',
    description: 'Le client a recupere sa commande.',
    action: 'Le client peut laisser un avis.',
    serviceTypes: ['PICKUP', 'DINE_IN'],
  },
  { 
    key: 'COMPLETED', 
    label: 'Terminee', 
    icon: Check, 
    bgColor: 'bg-gray-50', 
    textColor: 'text-gray-700', 
    iconBg: 'bg-gray-100',
    description: 'La commande est finalisee et archivee.',
    action: 'Aucune action supplementaire requise.',
  },
]

export function ChangeStatusModal({ 
  orderId, 
  isOpen, 
  onClose, 
  onSuccess,
  primaryColor = '#10b981',
}: ChangeStatusModalProps) {
  const { accessToken } = useAuthStore()
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setSelectedStatus(null)
      setMessage('')
    }
  }, [isOpen])

  const { data: order, isLoading } = useQuery({
    queryKey: ['restaurant-order', orderId],
    queryFn: async () => {
      if (!orderId) return null
      const res = await api.restaurant.getOrder(orderId)
      return res.data
    },
    enabled: !!accessToken && isOpen && !!orderId,
  })

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedStatus || !orderId) throw new Error('Statut requis')
      const res = await api.restaurant.updateOrderStatus(orderId, { 
        status: selectedStatus, 
        message: message || undefined 
      })
      return res.data
    },
    onSuccess: () => {
      toast.success('Statut mis a jour avec succes')
      onSuccess()
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la mise a jour')
    },
  })

  const currentStatus = order ? statusFlow.find(s => s.key === order.status) : null
  const currentStatusIndex = order ? statusFlow.findIndex(s => s.key === order.status) : -1

  const availableStatuses = statusFlow.filter((status, index) => {
    if (index <= currentStatusIndex) return false
    if (status.serviceTypes && order && !status.serviceTypes.includes(order.serviceType)) return false
    return true
  })

  const handleSubmit = () => {
    if (!selectedStatus) {
      toast.error('Veuillez selectionner un statut')
      return
    }
    mutation.mutate()
  }

  const handleClose = () => {
    if (!mutation.isPending) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 rounded-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100">
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Changer le statut
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : !order ? (
          <div className="py-12 text-center text-gray-500">Commande non trouvee</div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Statut actuel */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-500">Commande</span>
              <span className="font-semibold text-gray-900">#{order.displayNumber}</span>
              <ArrowRight size={14} className="text-gray-400" />
              {currentStatus && (
                <span className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium',
                  currentStatus.bgColor,
                  currentStatus.textColor
                )}>
                  {currentStatus.label}
                </span>
              )}
            </div>

            {/* Selection nouveau statut */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-900">Nouveau statut</Label>
              {availableStatuses.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <p className="text-sm text-gray-500">Aucun statut suivant disponible</p>
                </div>
              ) : (
                <>
                  <Select 
                    value={selectedStatus || ''} 
                    onValueChange={setSelectedStatus}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-gray-200">
                      <SelectValue placeholder="Selectionner un statut..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {availableStatuses.map((status) => {
                        const Icon = status.icon
                        return (
                          <SelectItem 
                            key={status.key} 
                            value={status.key}
                            className="rounded-lg py-2.5"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={cn(
                                'w-6 h-6 rounded-md flex items-center justify-center',
                                status.iconBg
                              )}>
                                <Icon size={14} className={status.textColor} />
                              </div>
                              <span className="font-medium">{status.label}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>

                  {/* Carte info statut selectionne */}
                  {selectedStatus && (() => {
                    const status = statusFlow.find(s => s.key === selectedStatus)
                    if (!status) return null
                    const Icon = status.icon
                    const primaryBgLight = primaryColor + '15'
                    const primaryBorder = primaryColor + '30'
                    return (
                      <div 
                        className="p-4 rounded-xl border"
                        style={{ 
                          backgroundColor: primaryBgLight,
                          borderColor: primaryBorder,
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: primaryColor + '25' }}
                          >
                            <Icon size={20} style={{ color: primaryColor }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm" style={{ color: primaryColor }}>
                              {status.label}
                            </p>
                            <p className="text-sm mt-1 text-gray-600">
                              {status.description}
                            </p>
                            <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                              <Info size={12} />
                              <span>{status.action}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </>
              )}
            </div>

            {/* Message optionnel */}
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-medium text-gray-900">
                Message <span className="text-gray-400 font-normal">(optionnel)</span>
              </Label>
              <Textarea
                id="message"
                placeholder="Ajouter une note pour l'historique..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                className="resize-none rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-4 border-t border-gray-100 bg-gray-50">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={mutation.isPending}
            className="flex-1 h-11 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!selectedStatus || mutation.isPending || availableStatuses.length === 0}
            className="flex-1 h-11 rounded-xl text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Mise a jour...
              </>
            ) : (
              'Confirmer'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
