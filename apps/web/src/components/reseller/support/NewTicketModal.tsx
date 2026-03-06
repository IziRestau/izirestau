'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { Loader2, HelpCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface NewTicketModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const categories = [
  { value: 'BILLING', label: 'Facturation', description: 'Questions sur les paiements, factures' },
  { value: 'TECHNICAL', label: 'Technique', description: 'Problemes techniques, bugs' },
  { value: 'FEATURE_REQUEST', label: 'Suggestion', description: 'Demande de fonctionnalite' },
  { value: 'ACCOUNT', label: 'Compte', description: 'Licence, parametres du compte' },
  { value: 'OTHER', label: 'Autre', description: 'Autre demande' },
]

const priorities = [
  { value: 'LOW', label: 'Basse', color: 'text-gray-600' },
  { value: 'MEDIUM', label: 'Moyenne', color: 'text-blue-600' },
  { value: 'HIGH', label: 'Haute', color: 'text-orange-600' },
  { value: 'URGENT', label: 'Urgente', color: 'text-red-600' },
]

export function NewTicketModal({ isOpen, onClose, onSuccess }: NewTicketModalProps) {
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [message, setMessage] = useState('')

  const createMutation = useMutation({
    mutationFn: async () => {
      return api.support.createTicket({
        subject,
        category,
        priority,
        message,
      })
    },
    onSuccess: () => {
      toast.success('Ticket cree avec succes')
      resetForm()
      onSuccess()
    },
    onError: () => {
      toast.error('Erreur lors de la creation du ticket')
    },
  })

  const resetForm = () => {
    setSubject('')
    setCategory('')
    setPriority('MEDIUM')
    setMessage('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !category || !message.trim()) {
      toast.error('Veuillez remplir tous les champs')
      return
    }
    if (subject.length < 5) {
      toast.error('Le sujet doit contenir au moins 5 caracteres')
      return
    }
    if (message.length < 10) {
      toast.error('Le message doit contenir au moins 10 caracteres')
      return
    }
    createMutation.mutate()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 rounded-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Nouveau ticket
              </DialogTitle>
              <p className="text-sm text-gray-500">Contactez l'equipe IziResto</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Sujet</Label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Decrivez brievement votre demande"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
              disabled={createMutation.isPending}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categorie</Label>
              <Select value={category} onValueChange={setCategory} disabled={createMutation.isPending}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priorite</Label>
              <Select value={priority} onValueChange={setPriority} disabled={createMutation.isPending}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className={p.color}>{p.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Decrivez votre probleme ou votre demande en detail..."
              rows={5}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 resize-none"
              disabled={createMutation.isPending}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createMutation.isPending}
              className="flex-1 h-11 rounded-xl"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || !subject || !category || !message}
              className="flex-1 h-11 rounded-xl"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creation...
                </>
              ) : (
                'Creer le ticket'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
