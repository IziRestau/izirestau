'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Mail, Loader2, Send } from 'lucide-react'
import { api } from '@/lib/api-client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SendReceiptEmailModalProps {
  isOpen: boolean
  onClose: () => void
  receiptId: string
  defaultEmail?: string
  primaryColor?: string
}

export function SendReceiptEmailModal({
  isOpen,
  onClose,
  receiptId,
  defaultEmail = '',
  primaryColor = '#10b981',
}: SendReceiptEmailModalProps) {
  const [email, setEmail] = useState(defaultEmail)

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      if (!email) throw new Error('Email requis')
      const res = await api.restaurant.receipts.sendByEmail(receiptId, email)
      return res
    },
    onSuccess: () => {
      toast.success(`Reçu envoyé à ${email}`)
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de l\'envoi')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      toast.error('Veuillez entrer une adresse email valide')
      return
    }
    sendEmailMutation.mutate()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail size={20} style={{ color: primaryColor }} />
            Envoyer le reçu par email
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Adresse email</Label>
            <Input
              id="email"
              type="email"
              placeholder="client@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={sendEmailMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={sendEmailMutation.isPending || !email}
              style={{ backgroundColor: primaryColor }}
              className="text-white"
            >
              {sendEmailMutation.isPending ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send size={16} className="mr-2" />
                  Envoyer
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
