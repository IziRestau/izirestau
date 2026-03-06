'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { resellerNavigation, resellerPromoCard } from '@/config/reseller-navigation'
import { useAuthStore } from '@/stores/auth.store'
import { api, apiClient } from '@/lib/api-client'
import { 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle,
  XCircle,
  RotateCcw,
  Loader2,
  User,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'
import { ConfirmModal } from '@/components/shared/ConfirmModal'

const statusLabels: Record<string, string> = {
  OPEN: 'Ouvert',
  IN_PROGRESS: 'En cours',
  WAITING_REPLY: 'En attente',
  RESOLVED: 'Resolu',
  CLOSED: 'Ferme',
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  WAITING_REPLY: 'bg-orange-100 text-orange-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-500',
}

const categoryLabels: Record<string, string> = {
  BILLING: 'Facturation',
  TECHNICAL: 'Technique',
  FEATURE_REQUEST: 'Suggestion',
  ACCOUNT: 'Compte',
  OTHER: 'Autre',
}

const priorityLabels: Record<string, string> = {
  LOW: 'Basse',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
  URGENT: 'Urgente',
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-orange-100 text-orange-600',
  URGENT: 'bg-red-100 text-red-600',
}

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { accessToken, user } = useAuthStore()
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [confirmAction, setConfirmAction] = useState<'close' | 'reopen' | null>(null)

  const ticketId = params.id as string

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['support-ticket', ticketId],
    queryFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      const res = await api.support.getTicket(ticketId)
      return res.data
    },
    enabled: !!accessToken && !!ticketId,
    refetchInterval: 30000,
  })

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      return api.support.addMessage(ticketId, newMessage)
    },
    onSuccess: () => {
      setNewMessage('')
      queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] })
    },
    onError: () => {
      toast.error('Erreur lors de l\'envoi du message')
    },
  })

  const closeTicketMutation = useMutation({
    mutationFn: async () => {
      return api.support.closeTicket(ticketId)
    },
    onSuccess: () => {
      toast.success('Ticket ferme')
      queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
    },
    onError: () => {
      toast.error('Erreur lors de la fermeture du ticket')
    },
  })

  const reopenTicketMutation = useMutation({
    mutationFn: async () => {
      return api.support.reopenTicket(ticketId)
    },
    onSuccess: () => {
      toast.success('Ticket reouvert')
      queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
    },
    onError: () => {
      toast.error('Erreur lors de la reouverture du ticket')
    },
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ticket?.messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    sendMessageMutation.mutate()
  }

  const isClosed = ticket?.status === 'CLOSED' || ticket?.status === 'RESOLVED'

  if (isLoading) {
    return (
      <PageSkeleton
        navigation={resellerNavigation}
        basePath="/reseller"
        title="Ticket"
        variant="detail"
      />
    )
  }

  if (!ticket) {
    return (
      <DashboardLayout
        navigation={resellerNavigation}
        basePath="/reseller"
        promoCard={resellerPromoCard}
      >
        <div className="flex flex-col items-center justify-center py-16">
          <MessageSquare size={48} className="text-gray-300 mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Ticket non trouve</h2>
          <p className="text-gray-500 mb-6">Ce ticket n'existe pas ou a ete supprime</p>
          <Button onClick={() => router.push('/reseller/support')}>
            Retour aux tickets
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      navigation={resellerNavigation}
      basePath="/reseller"
      promoCard={resellerPromoCard}
    >
      <PageHeader
        title={ticket.ticketNumber}
        subtitle={ticket.subject}
        icon={MessageSquare}
        actions={
          <div className="flex gap-2">
            {isClosed ? (
              <Button
                variant="outline"
                onClick={() => setConfirmAction('reopen')}
                className="gap-2"
              >
                <RotateCcw size={16} />
                Reouvrir
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setConfirmAction('close')}
                className="gap-2"
              >
                <XCircle size={16} />
                Fermer
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-medium text-gray-900">Conversation</h3>
            </div>

            <div className="p-4 space-y-4 min-h-[300px] max-h-[500px] overflow-y-auto">
              {ticket.messages.length === 0 && (
                <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">
                  Aucun message pour le moment
                </div>
              )}
              {ticket.messages.map((message) => {
                const isAdmin = message.isFromAdmin || message.sender.userType === 'SUPER_ADMIN'
                const isMe = message.sender.id === user?.id

                return (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3',
                      isMe ? 'flex-row-reverse' : ''
                    )}
                  >
                    <div className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
                      isAdmin ? 'bg-emerald-100' : 'bg-gray-100'
                    )}>
                      {message.sender.avatar ? (
                        <img
                          src={message.sender.avatar}
                          alt={`${message.sender.firstName} ${message.sender.lastName}`}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : isAdmin ? (
                        <Shield size={16} className="text-emerald-600" />
                      ) : (
                        <User size={16} className="text-gray-500" />
                      )}
                    </div>
                    <div className={cn(
                      'flex-1 max-w-[80%]',
                      isMe ? 'text-right' : ''
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          'text-sm font-medium',
                          isAdmin ? 'text-emerald-600' : 'text-gray-900'
                        )}>
                          {isAdmin ? 'Support IziResto' : `${message.sender.firstName} ${message.sender.lastName}`}
                        </span>
                        <span className="text-xs text-gray-400">
                          {format(new Date(message.createdAt), 'dd MMM HH:mm', { locale: fr })}
                        </span>
                      </div>
                      <div className={cn(
                        'inline-block px-4 py-3 rounded-2xl text-sm',
                        isMe 
                          ? 'bg-gray-900 text-white rounded-tr-sm' 
                          : isAdmin 
                            ? 'bg-emerald-50 text-gray-800 rounded-tl-sm'
                            : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                      )}>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {!isClosed && (
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100">
                <div className="flex gap-3">
                  <textarea
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value)
                      e.target.style.height = 'auto'
                      e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px'
                    }}
                    placeholder="Ecrivez votre message..."
                    rows={1}
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 resize-none min-h-[44px] max-h-[150px] overflow-hidden"
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    className="h-auto px-4"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Send size={20} />
                    )}
                  </Button>
                </div>
              </form>
            )}

            {isClosed && (
              <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
                <p className="text-sm text-gray-500">
                  Ce ticket est {ticket.status === 'CLOSED' ? 'ferme' : 'resolu'}. 
                  Vous pouvez le reouvrir si necessaire.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-medium text-gray-900 mb-4">Details du ticket</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Statut</p>
                <span className={cn('px-3 py-1 rounded-full text-sm font-medium', statusColors[ticket.status])}>
                  {statusLabels[ticket.status]}
                </span>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Categorie</p>
                <p className="text-sm text-gray-900">{categoryLabels[ticket.category]}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Priorite</p>
                <span className={cn('px-3 py-1 rounded-full text-sm font-medium', priorityColors[ticket.priority])}>
                  {priorityLabels[ticket.priority]}
                </span>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Cree par</p>
                <div className="flex items-center gap-2">
                  {ticket.createdBy.avatar ? (
                    <img
                      src={ticket.createdBy.avatar}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <User size={12} className="text-gray-500" />
                    </div>
                  )}
                  <span className="text-sm text-gray-900">
                    {ticket.createdBy.firstName} {ticket.createdBy.lastName}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Date de creation</p>
                <p className="text-sm text-gray-900">
                  {format(new Date(ticket.createdAt), 'dd MMMM yyyy a HH:mm', { locale: fr })}
                </p>
              </div>

              {ticket.resolvedAt && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Resolu le</p>
                  <p className="text-sm text-gray-900">
                    {format(new Date(ticket.resolvedAt), 'dd MMMM yyyy a HH:mm', { locale: fr })}
                  </p>
                </div>
              )}

              {ticket.closedAt && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Ferme le</p>
                  <p className="text-sm text-gray-900">
                    {format(new Date(ticket.closedAt), 'dd MMMM yyyy a HH:mm', { locale: fr })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {ticket.assignedTo && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-medium text-gray-900 mb-4">Assigne a</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  {ticket.assignedTo.avatar ? (
                    <img
                      src={ticket.assignedTo.avatar}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <Shield size={20} className="text-emerald-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
                  </p>
                  <p className="text-xs text-emerald-600">Support IziResto</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmAction === 'close'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          closeTicketMutation.mutate()
          setConfirmAction(null)
        }}
        title="Fermer le ticket"
        message="Etes-vous sur de vouloir fermer ce ticket ? Vous pourrez le reouvrir si necessaire."
        confirmText="Fermer"
        variant="warning"
        isLoading={closeTicketMutation.isPending}
      />

      <ConfirmModal
        isOpen={confirmAction === 'reopen'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          reopenTicketMutation.mutate()
          setConfirmAction(null)
        }}
        title="Reouvrir le ticket"
        message="Etes-vous sur de vouloir reouvrir ce ticket ?"
        confirmText="Reouvrir"
        variant="info"
        isLoading={reopenTicketMutation.isPending}
      />
    </DashboardLayout>
  )
}
