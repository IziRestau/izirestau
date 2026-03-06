'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { Users, UserPlus, MoreHorizontal, Mail, Shield, Trash2, Loader2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IconInput } from '@/components/shared/IconInput'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { cn } from '@/lib/utils'

interface Member {
  id: string
  role: string
  isActive: boolean
  joinedAt: string | null
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    avatar: string | null
  }
}

interface TeamSettingsProps {
  members: Member[]
  currentMember: {
    id: string
    role: string
    permissions: string[]
  }
  canEdit: boolean
  onUpdate: () => void
}

const roleLabels: Record<string, string> = {
  OWNER: 'Proprietaire',
  ADMIN: 'Administrateur',
  SALES: 'Commercial',
  MEMBER: 'Membre',
}

const roleColors: Record<string, string> = {
  OWNER: 'bg-amber-100 text-amber-700',
  ADMIN: 'bg-blue-100 text-blue-700',
  SALES: 'bg-purple-100 text-purple-700',
  MEMBER: 'bg-gray-100 text-gray-700',
}

export function TeamSettings({ members, currentMember, canEdit, onUpdate }: TeamSettingsProps) {
  const queryClient = useQueryClient()
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Member | null>(null)
  const [inviteData, setInviteData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'MEMBER',
  })

  const inviteMutation = useMutation({
    mutationFn: async (data: typeof inviteData) => {
      return api.reseller.inviteMember(data)
    },
    onSuccess: () => {
      toast.success('Invitation envoyee')
      setIsInviteOpen(false)
      setInviteData({ email: '', firstName: '', lastName: '', role: 'MEMBER' })
      onUpdate()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de l\'envoi de l\'invitation')
    },
  })

  const updateMemberMutation = useMutation({
    mutationFn: async ({ memberId, data }: { memberId: string; data: { role?: string; isActive?: boolean } }) => {
      return api.reseller.updateMember(memberId, data)
    },
    onSuccess: () => {
      toast.success('Membre mis a jour')
      onUpdate()
    },
    onError: () => {
      toast.error('Erreur lors de la mise a jour')
    },
  })

  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      return api.reseller.deleteMember(memberId)
    },
    onSuccess: () => {
      toast.success('Membre supprime')
      setDeleteConfirm(null)
      onUpdate()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la suppression')
    },
  })

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    inviteMutation.mutate(inviteData)
  }

  const handleRoleChange = (memberId: string, role: string) => {
    updateMemberMutation.mutate({ memberId, data: { role } })
  }

  const handleToggleActive = (memberId: string, isActive: boolean) => {
    updateMemberMutation.mutate({ memberId, data: { isActive: !isActive } })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Equipe</h3>
          <p className="text-sm text-gray-500">{members.length} membre{members.length > 1 ? 's' : ''}</p>
        </div>
        {canEdit && (
          <Button onClick={() => setIsInviteOpen(true)}>
            <UserPlus size={16} className="mr-2" />
            Inviter
          </Button>
        )}
      </div>

      {/* Members List */}
      <div className="space-y-3">
        {members.map((member) => {
          const isCurrentUser = member.id === currentMember.id
          const isOwner = member.role === 'OWNER'
          const canModify = canEdit && !isCurrentUser && !isOwner

          return (
            <div
              key={member.id}
              className={cn(
                "flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border transition-colors",
                member.isActive ? "bg-white border-gray-100" : "bg-gray-50 border-gray-200"
              )}
            >
              {/* Avatar */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {member.user.avatar ? (
                  <img
                    src={member.user.avatar}
                    alt={`${member.user.firstName} ${member.user.lastName}`}
                    className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-600 font-medium text-sm">
                      {member.user.firstName[0]}{member.user.lastName[0]}
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">
                      {member.user.firstName} {member.user.lastName}
                    </p>
                    {isCurrentUser && (
                      <span className="text-xs text-gray-500">(vous)</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{member.user.email}</p>
                </div>
              </div>

              {/* Role & Actions */}
              <div className="flex items-center gap-2 sm:gap-3">
                <span className={cn(
                  "px-2 py-1 rounded-lg text-xs font-medium",
                  roleColors[member.role] || roleColors.MEMBER
                )}>
                  {roleLabels[member.role] || member.role}
                </span>

                {!member.isActive && (
                  <span className="px-2 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700">
                    Inactif
                  </span>
                )}

                {canModify && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'ADMIN')}>
                        <Shield size={14} className="mr-2" />
                        Definir Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'SALES')}>
                        <Shield size={14} className="mr-2" />
                        Definir Commercial
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'MEMBER')}>
                        <Shield size={14} className="mr-2" />
                        Definir Membre
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleToggleActive(member.id, member.isActive)}>
                        {member.isActive ? 'Desactiver' : 'Activer'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setDeleteConfirm(member)}
                        className="text-red-600"
                      >
                        <Trash2 size={14} className="mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Invite Modal */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus size={20} />
              Inviter un membre
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prenom</label>
                <IconInput
                  icon={User}
                  value={inviteData.firstName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteData({ ...inviteData, firstName: e.target.value })}
                  required
                  placeholder="Jean"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                <IconInput
                  icon={User}
                  value={inviteData.lastName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteData({ ...inviteData, lastName: e.target.value })}
                  required
                  placeholder="Dupont"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <IconInput
                icon={Mail}
                type="email"
                value={inviteData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteData({ ...inviteData, email: e.target.value })}
                required
                placeholder="jean.dupont@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <Select
                value={inviteData.role}
                onValueChange={(value) => setInviteData({ ...inviteData, role: value })}
              >
                <SelectTrigger className="w-full h-[42px] bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-gray-100">
                  <SelectItem value="ADMIN" className="rounded-lg">Administrateur</SelectItem>
                  <SelectItem value="SALES" className="rounded-lg">Commercial</SelectItem>
                  <SelectItem value="MEMBER" className="rounded-lg">Membre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={inviteMutation.isPending}>
                {inviteMutation.isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
                Envoyer l'invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && deleteMemberMutation.mutate(deleteConfirm.id)}
        title="Supprimer le membre"
        message={`Etes-vous sur de vouloir supprimer ${deleteConfirm?.user.firstName} ${deleteConfirm?.user.lastName} de l'equipe ?`}
        confirmText="Supprimer"
        variant="danger"
        isLoading={deleteMemberMutation.isPending}
      />
    </div>
  )
}
