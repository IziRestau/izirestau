'use client'

import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { AlertTriangle, Loader2, XCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface CancelOrderModalProps {
  orderId: string | null
  orderNumber?: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const cancelReasons = [
  'Client absent',
  'Produit indisponible',
  'Erreur de commande',
  'Demande du client',
  'Probleme de paiement',
  'Autre',
]

export function CancelOrderModal({ 
  orderId, 
  orderNumber,
  isOpen, 
  onClose, 
  onSuccess,
}: CancelOrderModalProps) {
  const [reason, setReason] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setReason('')
      setSelectedPreset(null)
    }
  }, [isOpen])

  const mutation = useMutation({
    mutationFn: async () => {
      if (!orderId) throw new Error('ID commande requis')
      const finalReason = selectedPreset === 'Autre' ? reason.trim() : selectedPreset || reason.trim()
      if (!finalReason) throw new Error('Raison requise')
      const res = await api.restaurant.cancelOrder(orderId, { reason: finalReason })
      return res.data
    },
    onSuccess: () => {
      toast.success('Commande annulee avec succes')
      onSuccess()
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de l\'annulation')
    },
  })

  const handleSubmit = () => {
    const finalReason = selectedPreset === 'Autre' ? reason.trim() : selectedPreset
    if (!finalReason) {
      toast.error('Veuillez indiquer une raison d\'annulation')
      return
    }
    mutation.mutate()
  }

  const handleClose = () => {
    if (!mutation.isPending) {
      onClose()
    }
  }

  const isValid = selectedPreset && (selectedPreset !== 'Autre' || reason.trim())

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 rounded-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100">
          <DialogTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-gray-900">Annuler la commande</p>
              {orderNumber && (
                <p className="text-sm font-normal text-gray-500">#{orderNumber}</p>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">
              Cette action est irreversible. La commande sera definitivement annulee.
            </p>
          </div>

          {/* Raisons predefinies */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-900">
              Raison de l'annulation <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {cancelReasons.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSelectedPreset(preset)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all border-2 ${
                    selectedPreset === preset
                      ? 'bg-red-50 text-red-700 border-red-300'
                      : 'bg-gray-50 text-gray-700 border-transparent hover:border-gray-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Champ texte si "Autre" */}
          {selectedPreset === 'Autre' && (
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-medium text-gray-900">
                Preciser la raison
              </Label>
              <Textarea
                id="reason"
                placeholder="Decrivez la raison de l'annulation..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="resize-none rounded-xl border-gray-200"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-4 border-t border-gray-100 bg-gray-50">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={mutation.isPending}
            className="flex-1 h-11 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            Retour
          </Button>
          <Button 
            variant="destructive"
            onClick={handleSubmit}
            disabled={!isValid || mutation.isPending}
            className="flex-1 h-11 rounded-xl"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Annulation...
              </>
            ) : (
              'Confirmer l\'annulation'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
