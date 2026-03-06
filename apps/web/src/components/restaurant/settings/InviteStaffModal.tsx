'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { toast } from 'sonner'
import { UserPlus, User, Mail, Briefcase, Loader2 } from 'lucide-react'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface InviteStaffModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  primaryColor?: string
  isOwner: boolean
}

const roleOptions = [
  { value: 'MANAGER', label: 'Gerant', description: 'Gestion complete' },
  { value: 'STAFF', label: 'Employe', description: 'Acces standard' },
  { value: 'CASHIER', label: 'Caissier', description: 'Caisse uniquement' },
  { value: 'KITCHEN', label: 'Cuisine', description: 'Cuisine uniquement' },
]

export function InviteStaffModal({ isOpen, onClose, onSuccess, primaryColor = '#10b981', isOwner }: InviteStaffModalProps) {
  const queryClient = useQueryClient()
  const { currentRestaurantId } = useRestaurantStore()
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'STAFF',
    position: '',
  })

  const inviteMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return api.restaurant.inviteStaff({ ...data, restaurantId: currentRestaurantId || undefined })
    },
    onSuccess: () => {
      toast.success('Membre ajouté avec succès')
      queryClient.invalidateQueries({ queryKey: ['restaurant-settings'] })
      handleClose()
      onSuccess()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de l\'ajout du membre')
    },
  })

  const handleClose = () => {
    setFormData({ email: '', firstName: '', lastName: '', role: 'STAFF', position: '' })
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    inviteMutation.mutate(formData)
  }

  const availableRoles = isOwner ? roleOptions : roleOptions.filter(r => r.value !== 'MANAGER')

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus size={20} style={{ color: primaryColor }} />
            Ajouter un membre
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prenom</label>
              <IconInput
                icon={User}
                value={formData.firstName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, firstName: e.target.value })}
                required
                placeholder="Jean"
                focusColor={primaryColor}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
              <IconInput
                icon={User}
                value={formData.lastName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, lastName: e.target.value })}
                required
                placeholder="Dupont"
                focusColor={primaryColor}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <IconInput
              icon={Mail}
              type="email"
              value={formData.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="jean.dupont@email.com"
              focusColor={primaryColor}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger 
                className="w-full h-11 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2"
                style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent accentColor={primaryColor}>
                {availableRoles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex flex-col">
                      <span>{role.label}</span>
                      <span className="text-xs text-gray-500">{role.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Poste (optionnel)</label>
            <IconInput
              icon={Briefcase}
              value={formData.position}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, position: e.target.value })}
              placeholder="Ex: Chef de cuisine, Serveur..."
              focusColor={primaryColor}
            />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              style={{ borderColor: primaryColor, color: primaryColor }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${primaryColor}15` }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={inviteMutation.isPending || !formData.email || !formData.firstName || !formData.lastName}
              className="text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {inviteMutation.isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
              Ajouter le membre
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
