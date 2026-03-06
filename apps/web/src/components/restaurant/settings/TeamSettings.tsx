'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { Users, UserPlus, MoreHorizontal, Shield, Trash2, UserX, UserCheck, Mail, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { InviteStaffModal } from './InviteStaffModal'
import { cn } from '@/lib/utils'

type ActionType = 'delete' | 'toggle' | 'role' | 'resend' | 'cancel'
interface PendingAction {
  type: ActionType
  member: StaffMember
  newRole?: string
}

interface StaffMember {
  id: string
  role: string
  position: string | null
  isActive: boolean
  createdAt: string
  inviteStatus?: 'pending' | 'expired' | 'accepted'
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    avatar: string | null
  }
}

interface TeamSettingsProps {
  staffMembers: StaffMember[]
  currentStaff: {
    id: string
    role: string
    permissions: string[]
  }
  onUpdate: () => void
  primaryColor?: string
}

const roleLabels: Record<string, string> = {
  OWNER: 'Proprietaire',
  MANAGER: 'Gerant',
  STAFF: 'Employe',
  CASHIER: 'Caissier',
  KITCHEN: 'Cuisine',
}

const roleColors: Record<string, string> = {
  OWNER: 'bg-amber-100 text-amber-700',
  MANAGER: 'bg-blue-100 text-blue-700',
  STAFF: 'bg-gray-100 text-gray-700',
  CASHIER: 'bg-purple-100 text-purple-700',
  KITCHEN: 'bg-orange-100 text-orange-700',
}

export function TeamSettings({ staffMembers, currentStaff, onUpdate, primaryColor = '#10b981' }: TeamSettingsProps) {
  const queryClient = useQueryClient()
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  const isOwner = currentStaff.role === 'OWNER'
  const canEdit = currentStaff.role === 'OWNER' || currentStaff.role === 'MANAGER'

  const updateStaffMutation = useMutation({
    mutationFn: async ({ staffId, data }: { staffId: string; data: { role?: string; isActive?: boolean } }) => {
      return api.restaurant.updateStaff(staffId, data)
    },
    onSuccess: () => {
      toast.success('Membre mis a jour')
      setPendingAction(null)
      queryClient.invalidateQueries({ queryKey: ['restaurant-settings'] })
      onUpdate()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la mise a jour')
    },
  })

  const deleteStaffMutation = useMutation({
    mutationFn: async (staffId: string) => {
      return api.restaurant.deleteStaff(staffId)
    },
    onSuccess: () => {
      toast.success('Membre supprime')
      setPendingAction(null)
      queryClient.invalidateQueries({ queryKey: ['restaurant-settings'] })
      onUpdate()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la suppression')
    },
  })

  const resendInviteMutation = useMutation({
    mutationFn: async (staffId: string) => {
      return api.restaurant.resendInvite(staffId)
    },
    onSuccess: () => {
      toast.success('Invitation renvoyee')
      setPendingAction(null)
      queryClient.invalidateQueries({ queryKey: ['restaurant-settings'] })
      onUpdate()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de l\'envoi')
    },
  })

  const handleConfirmAction = () => {
    if (!pendingAction) return

    switch (pendingAction.type) {
      case 'delete':
      case 'cancel':
        deleteStaffMutation.mutate(pendingAction.member.id)
        break
      case 'toggle':
        updateStaffMutation.mutate({ 
          staffId: pendingAction.member.id, 
          data: { isActive: !pendingAction.member.isActive } 
        })
        break
      case 'role':
        if (pendingAction.newRole) {
          updateStaffMutation.mutate({ 
            staffId: pendingAction.member.id, 
            data: { role: pendingAction.newRole } 
          })
        }
        break
      case 'resend':
        resendInviteMutation.mutate(pendingAction.member.id)
        break
    }
  }

  const getConfirmModalProps = () => {
    if (!pendingAction) return null

    const memberName = `${pendingAction.member.user.firstName} ${pendingAction.member.user.lastName}`

    switch (pendingAction.type) {
      case 'delete':
        return {
          title: 'Supprimer le membre',
          message: `Etes-vous sur de vouloir supprimer ${memberName} de l'equipe ? Cette action est irreversible.`,
          confirmText: 'Supprimer',
          variant: 'danger' as const,
        }
      case 'cancel':
        return {
          title: 'Annuler l\'invitation',
          message: `Etes-vous sur de vouloir annuler l'invitation de ${memberName} ? Cette action est irreversible.`,
          confirmText: 'Annuler l\'invitation',
          variant: 'danger' as const,
        }
      case 'resend':
        return {
          title: 'Renvoyer l\'invitation',
          message: `Voulez-vous renvoyer l'email d'invitation a ${memberName} ?`,
          confirmText: 'Renvoyer',
          variant: 'info' as const,
        }
      case 'toggle':
        return pendingAction.member.isActive
          ? {
              title: 'Desactiver le membre',
              message: `Etes-vous sur de vouloir desactiver ${memberName} ? Il ne pourra plus acceder au dashboard.`,
              confirmText: 'Desactiver',
              variant: 'warning' as const,
            }
          : {
              title: 'Reactiver le membre',
              message: `Etes-vous sur de vouloir reactiver ${memberName} ? Il pourra a nouveau acceder au dashboard.`,
              confirmText: 'Reactiver',
              variant: 'success' as const,
            }
      case 'role':
        return {
          title: 'Changer le role',
          message: `Etes-vous sur de vouloir changer le role de ${memberName} en ${roleLabels[pendingAction.newRole || ''] || pendingAction.newRole} ?`,
          confirmText: 'Confirmer',
          variant: 'info' as const,
        }
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Equipe</h3>
          <p className="text-sm text-gray-500">{staffMembers.length} membre{staffMembers.length > 1 ? 's' : ''}</p>
        </div>
        {canEdit && (
          <Button 
            onClick={() => setIsInviteOpen(true)}
            className="text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <UserPlus size={16} className="mr-2" />
            Ajouter
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {staffMembers.map((member) => {
          const isCurrentUser = member.id === currentStaff.id
          const isMemberOwner = member.role === 'OWNER'
          const canModify = canEdit && !isCurrentUser && !isMemberOwner
          const canModifyManager = isOwner && member.role === 'MANAGER'
          const isPending = member.inviteStatus === 'pending'
          const isExpired = member.inviteStatus === 'expired'
          const isInvitePending = isPending || isExpired

          return (
            <div
              key={member.id}
              className={cn(
                "flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border transition-colors",
                isInvitePending 
                  ? "bg-amber-50/50 border-amber-200" 
                  : member.isActive 
                    ? "bg-white border-gray-100" 
                    : "bg-gray-50 border-gray-200"
              )}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {member.user.avatar ? (
                  <img
                    src={member.user.avatar}
                    alt={`${member.user.firstName} ${member.user.lastName}`}
                    className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div 
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                      isInvitePending && "opacity-60"
                    )}
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <span style={{ color: primaryColor }} className="font-medium text-sm">
                      {member.user.firstName[0]}{member.user.lastName[0]}
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "font-medium truncate",
                      isInvitePending ? "text-gray-600" : "text-gray-900"
                    )}>
                      {member.user.firstName} {member.user.lastName}
                    </p>
                    {isCurrentUser && (
                      <span className="text-xs text-gray-500">(vous)</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{member.user.email}</p>
                  {member.position && (
                    <p className="text-xs text-gray-400 truncate">{member.position}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span className={cn(
                  "px-2 py-1 rounded-lg text-xs font-medium",
                  roleColors[member.role] || roleColors.STAFF
                )}>
                  {roleLabels[member.role] || member.role}
                </span>

                {isPending && (
                  <span className="px-2 py-1 rounded-lg text-xs font-medium bg-amber-100 text-amber-700 flex items-center gap-1">
                    <Clock size={12} />
                    En attente
                  </span>
                )}

                {isExpired && (
                  <span className="px-2 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Expiree
                  </span>
                )}

                {!isInvitePending && !member.isActive && (
                  <span className="px-2 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700">
                    Inactif
                  </span>
                )}

                {(canModify || canModifyManager) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors">
                        <MoreHorizontal size={16} className="text-gray-500" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50">
                      {isInvitePending ? (
                        <>
                          <DropdownMenuItem 
                            onClick={() => setPendingAction({ type: 'resend', member })}
                            className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                          >
                            <Mail size={16} className="mr-3 text-gray-400" />
                            <span className="text-[13px] text-gray-700">Renvoyer l'invitation</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem 
                            onClick={() => setPendingAction({ type: 'cancel', member })}
                            className="rounded-lg px-3 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                          >
                            <Trash2 size={16} className="mr-3" />
                            <span className="text-[13px]">Annuler l'invitation</span>
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          {isOwner && member.role !== 'MANAGER' && (
                            <DropdownMenuItem 
                              onClick={() => setPendingAction({ type: 'role', member, newRole: 'MANAGER' })}
                              className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                            >
                              <Shield size={16} className="mr-3 text-gray-400" />
                              <span className="text-[13px] text-gray-700">Promouvoir Gerant</span>
                            </DropdownMenuItem>
                          )}
                          {member.role !== 'STAFF' && (
                            <DropdownMenuItem 
                              onClick={() => setPendingAction({ type: 'role', member, newRole: 'STAFF' })}
                              className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                            >
                              <Shield size={16} className="mr-3 text-gray-400" />
                              <span className="text-[13px] text-gray-700">Definir Employe</span>
                            </DropdownMenuItem>
                          )}
                          {member.role !== 'CASHIER' && (
                            <DropdownMenuItem 
                              onClick={() => setPendingAction({ type: 'role', member, newRole: 'CASHIER' })}
                              className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                            >
                              <Shield size={16} className="mr-3 text-gray-400" />
                              <span className="text-[13px] text-gray-700">Definir Caissier</span>
                            </DropdownMenuItem>
                          )}
                          {member.role !== 'KITCHEN' && (
                            <DropdownMenuItem 
                              onClick={() => setPendingAction({ type: 'role', member, newRole: 'KITCHEN' })}
                              className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                            >
                              <Shield size={16} className="mr-3 text-gray-400" />
                              <span className="text-[13px] text-gray-700">Definir Cuisine</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem 
                            onClick={() => setPendingAction({ type: 'toggle', member })}
                            className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                          >
                            {member.isActive ? (
                              <>
                                <UserX size={16} className="mr-3 text-gray-400" />
                                <span className="text-[13px] text-gray-700">Desactiver</span>
                              </>
                            ) : (
                              <>
                                <UserCheck size={16} className="mr-3 text-gray-400" />
                                <span className="text-[13px] text-gray-700">Reactiver</span>
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem 
                            onClick={() => setPendingAction({ type: 'delete', member })}
                            className="rounded-lg px-3 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                          >
                            <Trash2 size={16} className="mr-3" />
                            <span className="text-[13px]">Supprimer</span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          )
        })}

        {staffMembers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p>Aucun membre dans l'equipe</p>
          </div>
        )}
      </div>

      <InviteStaffModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSuccess={onUpdate}
        primaryColor={primaryColor}
        isOwner={isOwner}
      />

      {pendingAction && getConfirmModalProps() && (
        <ConfirmModal
          isOpen={!!pendingAction}
          onClose={() => setPendingAction(null)}
          onConfirm={handleConfirmAction}
          title={getConfirmModalProps()!.title}
          message={getConfirmModalProps()!.message}
          confirmText={getConfirmModalProps()!.confirmText}
          variant={getConfirmModalProps()!.variant}
          isLoading={updateStaffMutation.isPending || deleteStaffMutation.isPending || resendInviteMutation.isPending}
        />
      )}
    </div>
  )
}
