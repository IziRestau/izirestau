'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  Users,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Play,
  Pause,
  Trash2,
  Send,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import type { ResellerDetails } from '../types'
import { roleLabels } from '../types'
import { cn } from '@/lib/utils'

interface MembersTabProps {
  reseller: ResellerDetails
}

export function MembersTab({ reseller }: MembersTabProps) {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const members = reseller.members || []
  const [confirmAction, setConfirmAction] = useState<{ type: 'revoke' | 'activate' | 'deactivate' | 'resend'; memberId: string } | null>(null)

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ memberId, isActive }: { memberId: string; isActive: boolean }) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return apiClient.patch(`/platform/resellers/members/${memberId}/status`, { isActive })
    },
    onSuccess: (_, { isActive }) => {
      toast.success(isActive ? 'Membre active' : 'Membre desactive')
      queryClient.invalidateQueries({ queryKey: ['platform-reseller', reseller.id] })
    },
    onError: () => toast.error('Erreur lors de la mise a jour'),
  })

  const revokeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return apiClient.delete(`/platform/resellers/members/${memberId}`)
    },
    onSuccess: () => {
      toast.success('Membre revoque')
      queryClient.invalidateQueries({ queryKey: ['platform-reseller', reseller.id] })
      setConfirmAction(null)
    },
    onError: () => toast.error('Erreur lors de la revocation'),
  })

  const resendInviteMutation = useMutation({
    mutationFn: async (memberId: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return apiClient.post(`/platform/resellers/members/${memberId}/resend-invite`)
    },
    onSuccess: () => {
      toast.success('Invitation renvoyee')
    },
    onError: () => toast.error('Erreur lors de l\'envoi'),
  })

  if (members.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <Users size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun membre</h3>
        <p className="text-gray-500">Ce revendeur n'a pas de membres.</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-medium text-gray-900">Membres ({members.length})</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {members.map((member) => {
            const isOwner = member.role === 'OWNER'
            const isPending = !member.user.firstName && !member.user.lastName

            return (
              <div key={member.id} className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  {member.user.avatar ? (
                    <img
                      src={member.user.avatar}
                      alt={`${member.user.firstName} ${member.user.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-medium text-gray-500">
                      {member.user.firstName?.[0] || '?'}{member.user.lastName?.[0] || ''}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900">
                      {isPending ? 'Invitation en attente' : `${member.user.firstName} ${member.user.lastName}`}
                    </p>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      member.role === 'OWNER' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                    )}>
                      {roleLabels[member.role] || member.role}
                    </span>
                    {member.isActive ? (
                      <CheckCircle size={14} className="text-green-500" />
                    ) : (
                      <XCircle size={14} className="text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Mail size={12} />
                      {member.user.email}
                    </span>
                    {member.user.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={12} />
                        {member.user.phone}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500 hidden sm:block">
                  <p>Membre depuis</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(member.createdAt), 'dd MMM yyyy', { locale: fr })}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreHorizontal size={16} className="text-gray-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50">
                    {isPending && (
                      <DropdownMenuItem
                        onClick={() => setConfirmAction({ type: 'resend', memberId: member.id })}
                        className="rounded-lg px-3 py-2.5 cursor-pointer text-blue-600 focus:text-blue-600 focus:bg-blue-50"
                      >
                        <Send size={16} className="mr-3" />
                        <span className="text-[13px]">Renvoyer l'invitation</span>
                      </DropdownMenuItem>
                    )}
                    {!isOwner && (
                      <>
                        {member.isActive ? (
                          <DropdownMenuItem
                            onClick={() => setConfirmAction({ type: 'deactivate', memberId: member.id })}
                            className="rounded-lg px-3 py-2.5 cursor-pointer text-amber-600 focus:text-amber-600 focus:bg-amber-50"
                          >
                            <Pause size={16} className="mr-3" />
                            <span className="text-[13px]">Desactiver</span>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => setConfirmAction({ type: 'activate', memberId: member.id })}
                            className="rounded-lg px-3 py-2.5 cursor-pointer text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50"
                          >
                            <Play size={16} className="mr-3" />
                            <span className="text-[13px]">Activer</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className="my-1" />
                        <DropdownMenuItem
                          onClick={() => setConfirmAction({ type: 'revoke', memberId: member.id })}
                          className="rounded-lg px-3 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                        >
                          <Trash2 size={16} className="mr-3" />
                          <span className="text-[13px]">Revoquer l'acces</span>
                        </DropdownMenuItem>
                      </>
                    )}
                    {isOwner && !isPending && (
                      <div className="px-3 py-2 text-xs text-gray-400">
                        Le proprietaire ne peut pas etre modifie
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          })}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmAction?.type === 'activate'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && toggleStatusMutation.mutate({ memberId: confirmAction.memberId, isActive: true })}
        title="Activer ce membre ?"
        message="Ce membre pourra de nouveau acceder a l'organisation."
        confirmText="Activer"
        variant="info"
        icon="play"
        isLoading={toggleStatusMutation.isPending}
      />

      <ConfirmModal
        isOpen={confirmAction?.type === 'deactivate'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && toggleStatusMutation.mutate({ memberId: confirmAction.memberId, isActive: false })}
        title="Desactiver ce membre ?"
        message="Ce membre ne pourra plus acceder a l'organisation tant qu'il ne sera pas reactive."
        confirmText="Desactiver"
        variant="warning"
        icon="pause"
        isLoading={toggleStatusMutation.isPending}
      />

      <ConfirmModal
        isOpen={confirmAction?.type === 'revoke'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && revokeMutation.mutate(confirmAction.memberId)}
        title="Revoquer ce membre ?"
        message="Ce membre perdra immediatement son acces a l'organisation. Cette action est irreversible."
        confirmText="Revoquer"
        variant="danger"
        icon="trash"
        isLoading={revokeMutation.isPending}
      />

      <ConfirmModal
        isOpen={confirmAction?.type === 'resend'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && resendInviteMutation.mutate(confirmAction.memberId)}
        title="Renvoyer l'invitation ?"
        message="Un nouvel email d'invitation sera envoye a ce membre."
        confirmText="Envoyer"
        variant="info"
        icon="mail"
        isLoading={resendInviteMutation.isPending}
      />
    </>
  )
}
