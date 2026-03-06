'use client'

import { useRouter } from 'next/navigation'
import { MessageSquare } from 'lucide-react'

interface Ticket {
  id: string
  ticketNumber: string
  subject: string
  status: string
  createdAt: string
  resellerOrg?: { name: string }
}

interface TicketsSummaryCardProps {
  openTickets: number
  recentTickets: Ticket[]
  period: 'Mensuel' | 'Semaine' | 'Jour'
  onPeriodChange: (period: 'Mensuel' | 'Semaine' | 'Jour') => void
}

export function TicketsSummaryCard({
  openTickets,
  recentTickets,
  period,
  onPeriodChange,
}: TicketsSummaryCardProps) {
  const router = useRouter()

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Tickets Support</h3>
          <p className="text-sm text-gray-400 mt-1">Demandes en cours</p>
        </div>
        <div className="flex gap-1 text-sm bg-gray-100 rounded-lg p-1">
          {(['Mensuel', 'Semaine', 'Jour'] as const).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                period === p
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 bg-orange-100 rounded flex items-center justify-center">
          <MessageSquare size={12} className="text-orange-600" />
        </div>
        <span className="text-2xl font-bold text-gray-900">{openTickets}</span>
        <span className="text-gray-500">tickets ouverts</span>
      </div>

      <div className="space-y-3">
        {recentTickets.length > 0 ? (
          recentTickets.slice(0, 3).map((ticket) => (
            <div 
              key={ticket.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => router.push(`/platform/support/${ticket.id}`)}
            >
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <MessageSquare size={16} className="text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">{ticket.subject}</div>
                <div className="text-xs text-gray-500">{ticket.resellerOrg?.name || ticket.ticketNumber}</div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                ticket.status === 'OPEN' 
                  ? 'bg-blue-100 text-blue-700'
                  : ticket.status === 'IN_PROGRESS'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {ticket.status === 'OPEN' ? 'Ouvert' : ticket.status === 'IN_PROGRESS' ? 'En cours' : ticket.status}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">Aucun ticket en attente</p>
          </div>
        )}
      </div>

      {openTickets > 0 && (
        <button 
          onClick={() => router.push('/platform/support')}
          className="w-full mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Voir tous les tickets
        </button>
      )}
    </div>
  )
}
