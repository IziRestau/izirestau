'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { platformNavigation } from '@/config/platform-navigation'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Search,
  ChevronRight,
  Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

type StatusFilter = 'all' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

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

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-orange-100 text-orange-600',
  URGENT: 'bg-red-100 text-red-600',
}

interface Ticket {
  id: string
  ticketNumber: string
  ticketType: string
  subject: string
  category: string
  priority: string
  status: string
  lastMessageAt: string | null
  createdAt: string
  createdBy: { id: string; firstName: string; lastName: string; avatar: string | null }
  resellerOrg: { id: string; name: string } | null
  _count: { messages: number }
}

export default function PlatformSupportPage() {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['platform-support-tickets', statusFilter],
    queryFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      const res = await apiClient.get<{
        tickets: Ticket[]
        stats: { total: number; open: number; inProgress: number; resolved: number }
      }>(`/platform/support/tickets?${params.toString()}`)
      return res.data
    },
    enabled: !!accessToken,
    staleTime: 1 * 60 * 1000,
  })

  const tickets = data?.tickets || []
  const stats = data?.stats || { total: 0, open: 0, inProgress: 0, resolved: 0 }

  const filteredTickets = tickets.filter(ticket => {
    if (!searchQuery) return true
    return (
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.resellerOrg?.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  if (isLoading) {
    return (
      <PageSkeleton
        navigation={platformNavigation}
        basePath="/platform"
        title="Support"
        variant="list"
      />
    )
  }

  return (
    <DashboardLayout
      navigation={platformNavigation}
      basePath="/platform"
      logoText="IziResto Admin"
    >
      <PageHeader
        title="Support"
        subtitle="Gestion des tickets de support"
        icon={MessageSquare}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <MessageSquare size={20} className="text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Clock size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.open}</p>
              <p className="text-xs text-gray-500">Ouverts</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <AlertCircle size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.inProgress}</p>
              <p className="text-xs text-gray-500">En cours</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.resolved}</p>
              <p className="text-xs text-gray-500">Resolus</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex flex-wrap gap-2">
          {(['all', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors',
                statusFilter === status
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50'
              )}
            >
              {status === 'all' ? 'Tous' : statusLabels[status]}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {filteredTickets.length === 0 ? (
          <div className="py-16 text-center">
            <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun ticket</h3>
            <p className="text-gray-500 text-sm">
              {statusFilter !== 'all' 
                ? 'Aucun ticket avec ce statut'
                : 'Aucun ticket de support pour le moment'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredTickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => router.push(`/platform/support/${ticket.id}`)}
                className="w-full p-4 sm:p-5 hover:bg-gray-50 transition-colors text-left flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-gray-400">{ticket.ticketNumber}</span>
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusColors[ticket.status])}>
                      {statusLabels[ticket.status]}
                    </span>
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', priorityColors[ticket.priority])}>
                      {ticket.priority}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 truncate mb-1">{ticket.subject}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    {ticket.resellerOrg && (
                      <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                        <Building2 size={12} />
                        {ticket.resellerOrg.name}
                      </span>
                    )}
                    <span className="bg-gray-100 px-2 py-0.5 rounded">{categoryLabels[ticket.category]}</span>
                    <span>{ticket._count.messages} message{ticket._count.messages > 1 ? 's' : ''}</span>
                    <span>
                      {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
