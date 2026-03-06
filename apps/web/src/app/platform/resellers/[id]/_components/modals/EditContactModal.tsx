'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { ResellerDetails } from '../types'

interface EditContactModalProps {
  isOpen: boolean
  onClose: () => void
  reseller: ResellerDetails
}

export function EditContactModal({ isOpen, onClose, reseller }: EditContactModalProps) {
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()

  const [formData, setFormData] = useState({
    email: reseller.email,
    phone: reseller.phone || '',
    website: reseller.website || '',
  })

  useEffect(() => {
    if (isOpen) {
      setFormData({
        email: reseller.email,
        phone: reseller.phone || '',
        website: reseller.website || '',
      })
    }
  }, [isOpen, reseller])

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      await apiClient.patch(`/platform/resellers/${reseller.id}`, data)
    },
    onSuccess: () => {
      toast.success('Contact mis a jour')
      queryClient.invalidateQueries({ queryKey: ['platform-reseller', reseller.id] })
      onClose()
    },
    onError: () => {
      toast.error('Erreur lors de la mise a jour')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier le contact</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telephone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Site web</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 size={16} className="animate-spin mr-2" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
