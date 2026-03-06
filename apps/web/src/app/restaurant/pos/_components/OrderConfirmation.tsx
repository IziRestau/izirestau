'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { 
  CheckCircle2, 
  Printer,
  RotateCcw,
  Send,
  FileText,
  Loader2,
} from 'lucide-react'
import { api } from '@/lib/api-client'
import { SendReceiptEmailModal } from '@/components/restaurant/orders/SendReceiptEmailModal'

interface OrderConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onNewOrder: () => void
  orderNumber: string
  total: string
  paymentMethod: string
  change?: string
  primaryColor: string
  receiptId?: string
  customerEmail?: string
}

export function OrderConfirmation({
  isOpen,
  onClose,
  onNewOrder,
  orderNumber,
  total,
  paymentMethod,
  change,
  primaryColor,
  receiptId,
  customerEmail,
}: OrderConfirmationProps) {
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)

  const handlePrintThermal = async () => {
    if (!receiptId) {
      toast.error('Reçu non disponible')
      return
    }
    setIsPrinting(true)
    try {
      const res = await api.restaurant.receipts.getThermalCommands(receiptId, { width: '80mm' })
      if (res.data?.commands) {
        const binaryString = atob(res.data.commands)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const blob = new Blob([bytes], { type: 'application/octet-stream' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `ticket-${orderNumber}.bin`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Fichier d\'impression téléchargé')
      }
    } catch {
      toast.error('Erreur lors de la génération du ticket')
    } finally {
      setIsPrinting(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!receiptId) {
      toast.error('Reçu non disponible')
      return
    }
    try {
      await api.restaurant.receipts.downloadPdf(receiptId, `recu-${orderNumber}.pdf`)
      toast.success('PDF téléchargé')
    } catch {
      toast.error('Erreur lors du téléchargement du PDF')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 rounded-2xl overflow-hidden">
        <div className="p-8 text-center">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <CheckCircle2 size={48} style={{ color: primaryColor }} />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Commande validée !
          </h2>
          
          <p className="text-gray-500 mb-6">
            Commande #{orderNumber}
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total</span>
              <span className="font-semibold text-gray-900">{total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Paiement</span>
              <span className="text-gray-900">
                {paymentMethod === 'CASH' ? 'Espèces' : 'Carte'}
              </span>
            </div>
            {change && (
              <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                <span className="text-gray-600">Rendu</span>
                <span className="font-semibold text-green-600">{change}</span>
              </div>
            )}
          </div>

          {/* Actions de reçu */}
          {receiptId && (
            <div className="flex gap-2 mb-4">
              <Button
                variant="outline"
                onClick={() => setShowEmailModal(true)}
                className="flex-1 h-10 rounded-xl text-sm transition-colors"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = primaryColor
                  e.currentTarget.style.color = primaryColor
                  e.currentTarget.style.backgroundColor = `${primaryColor}10`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.color = ''
                  e.currentTarget.style.backgroundColor = ''
                }}
              >
                <Send size={14} className="mr-1.5" />
                Email
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadPdf}
                className="flex-1 h-10 rounded-xl text-sm transition-colors"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = primaryColor
                  e.currentTarget.style.color = primaryColor
                  e.currentTarget.style.backgroundColor = `${primaryColor}10`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.color = ''
                  e.currentTarget.style.backgroundColor = ''
                }}
              >
                <FileText size={14} className="mr-1.5" />
                PDF
              </Button>
              <Button
                variant="outline"
                onClick={handlePrintThermal}
                disabled={isPrinting}
                className="flex-1 h-10 rounded-xl text-sm transition-colors"
                onMouseEnter={(e) => {
                  if (!isPrinting) {
                    e.currentTarget.style.borderColor = primaryColor
                    e.currentTarget.style.color = primaryColor
                    e.currentTarget.style.backgroundColor = `${primaryColor}10`
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.color = ''
                  e.currentTarget.style.backgroundColor = ''
                }}
              >
                {isPrinting ? (
                  <Loader2 size={14} className="mr-1.5 animate-spin" />
                ) : (
                  <Printer size={14} className="mr-1.5" />
                )}
                Ticket
              </Button>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={onNewOrder}
              className="flex-1 h-12 rounded-xl text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <RotateCcw size={18} className="mr-2" />
              Nouvelle commande
            </Button>
          </div>
        </div>

        {/* Modal d'envoi d'email */}
        {receiptId && (
          <SendReceiptEmailModal
            isOpen={showEmailModal}
            onClose={() => setShowEmailModal(false)}
            receiptId={receiptId}
            defaultEmail={customerEmail || ''}
            primaryColor={primaryColor}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
