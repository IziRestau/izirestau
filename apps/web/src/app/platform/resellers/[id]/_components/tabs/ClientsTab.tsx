'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  UserCheck,
  Mail,
  Phone,
  Store,
  MoreHorizontal,
  UserPlus,
  UserMinus,
  UserX,
  Clock,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ResellerDetails } from '../types'
import { clientStatusLabels, clientStatusColors } from '../types'
import { cn } from '@/lib/utils'

interface ClientsTabProps {
  reseller: ResellerDetails
}

const statusOptions = [
  { value: 'PROSPECT', label: 'Prospect', icon: Clock, color: 'text-blue-600 focus:text-blue-600 focus:bg-blue-50' },
  { value: 'ACTIVE', label: 'Actif', icon: UserPlus, color: 'text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50' },
  { value: 'INACTIVE', label: 'Inactif', icon: UserMinus, color: 'text-amber-600 focus:text-amber-600 focus:bg-amber-50' },
  { value: 'CHURNED', label: 'Perdu', icon: UserX, color: 'text-red-500 focus:text-red-500 focus:bg-red-50' },
]

export function ClientsTab({ reseller }: ClientsTabProps) {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const clients = reseller.clients || []

  const changeStatusMutation = useMutation({
    mutationFn: async ({ clientId, status }: { clientId: string; status: string }) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return apiClient.patch(`/platform/resellers/clients/${clientId}/status`, { status })
    },
    onSuccess: () => {
      toast.success('Statut mis a jour')
      queryClient.invalidateQueries({ queryKey: ['platform-reseller', reseller.id] })
    },
    onError: () => toast.error('Erreur lors de la mise a jour'),
  })

  if (clients.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <UserCheck size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun client</h3>
        <p className="text-gray-500">Ce revendeur n'a pas encore de clients.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <h3 className="font-medium text-gray-900">Clients ({clients.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-center">Sites</th>
              <th className="px-4 py-3">Cree le</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{client.name}</p>
                    <p className="text-xs text-gray-500">
                      {client.contactFirstName} {client.contactLastName}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-900 flex items-center gap-1">
                      <Mail size={12} className="text-gray-400" />
                      {client.email}
                    </p>
                    {client.phone && (
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone size={12} className="text-gray-400" />
                        {client.phone}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium',
                    clientStatusColors[client.status] || 'bg-gray-100 text-gray-600'
                  )}>
                    {clientStatusLabels[client.status] || client.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                    <Store size={14} />
                    {client._count?.sites ?? 0}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-600">
                    {format(new Date(client.createdAt), 'dd MMM yyyy', { locale: fr })}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreHorizontal size={16} className="text-gray-500" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50">
                      <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase">
                        Changer le statut
                      </div>
                      {statusOptions.map((option) => {
                        const Icon = option.icon
                        const isCurrentStatus = client.status === option.value
                        return (
                          <DropdownMenuItem
                            key={option.value}
                            onClick={() => !isCurrentStatus && changeStatusMutation.mutate({ clientId: client.id, status: option.value })}
                            disabled={isCurrentStatus || changeStatusMutation.isPending}
                            className={cn(
                              'rounded-lg px-3 py-2.5 cursor-pointer',
                              isCurrentStatus ? 'bg-gray-50 text-gray-400' : option.color
                            )}
                          >
                            <Icon size={16} className="mr-3" />
                            <span className="text-[13px]">{option.label}</span>
                            {isCurrentStatus && <span className="ml-auto text-xs">(actuel)</span>}
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
