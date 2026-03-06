'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { Loader2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CreateResellerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface LicensePlan {
  id: string
  name: string
  slug: string
  maxSites: number
  priceMonthly: number
  currency: string
}

export function CreateResellerModal({ isOpen, onClose, onSuccess }: CreateResellerModalProps) {
  const { accessToken } = useAuthStore()

  const [formData, setFormData] = useState({
    email: '',
    planId: '',
  })

  const { data: plans } = useQuery({
    queryKey: ['license-plans'],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await apiClient.get<LicensePlan[]>('/platform/licenses/plans')
      return res.data || []
    },
    enabled: !!accessToken && isOpen,
  })

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      await apiClient.post('/platform/resellers', {
        email: data.email,
        planId: data.planId || null,
      })
    },
    onSuccess: () => {
      toast.success('Revendeur cree et invitation envoyee')
      setFormData({ email: '', planId: '' })
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la creation')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email) {
      toast.error('Email requis')
      return
    }
    mutation.mutate(formData)
  }

  const handleClose = () => {
    setFormData({ email: '', planId: '' })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau revendeur</DialogTitle>
          <DialogDescription>
            Un email d'invitation sera envoye pour completer l'inscription.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email du proprietaire *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="contact@entreprise.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Licence (optionnel)</Label>
            <Select
              value={formData.planId || undefined}
              onValueChange={(value) => setFormData(prev => ({ ...prev, planId: value === 'none' ? '' : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selectionner un plan..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune licence</SelectItem>
                {plans?.map(plan => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} ({plan.maxSites} sites)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
            <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              Le revendeur recevra un email pour definir son mot de passe et completer son profil.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 size={16} className="animate-spin mr-2" />}
              Creer et inviter
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
