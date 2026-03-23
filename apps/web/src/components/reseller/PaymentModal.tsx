'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, CheckCircle, FileText } from 'lucide-react'

type PaymentMethod = 'BANK_TRANSFER' | 'CHECK' | 'CASH' | 'CARD' | 'OTHER'

interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  status: string
  currency: string
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    amount: number
    method: PaymentMethod
    reference?: string
    notes?: string
    invoiceId?: string
  }) => Promise<void>
  isLoading?: boolean
  clientName?: string
  unpaidInvoices?: Invoice[]
  currency?: string
}

export function PaymentModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  clientName,
  unpaidInvoices = [],
  currency = 'XOF',
}: PaymentModalProps) {
  const [form, setForm] = useState({
    amount: '',
    method: 'BANK_TRANSFER' as PaymentMethod,
    reference: '',
    notes: '',
    invoiceId: '',
  })

  useEffect(() => {
    if (form.invoiceId && form.invoiceId !== 'none') {
      const invoice = unpaidInvoices.find(inv => inv.id === form.invoiceId)
      if (invoice) {
        setForm(prev => ({ ...prev, amount: String(invoice.amount) }))
      }
    }
  }, [form.invoiceId, unpaidInvoices])

  const handleSubmit = async () => {
    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) return

    await onSubmit({
      amount,
      method: form.method,
      reference: form.reference || undefined,
      notes: form.notes || undefined,
      invoiceId: form.invoiceId && form.invoiceId !== 'none' ? form.invoiceId : undefined,
    })

    setForm({ amount: '', method: 'BANK_TRANSFER', reference: '', notes: '', invoiceId: '' })
  }

  const handleClose = () => {
    setForm({ amount: '', method: 'BANK_TRANSFER', reference: '', notes: '', invoiceId: '' })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enregistrer un paiement</DialogTitle>
          {clientName && (
            <p className="text-sm text-gray-500">Client: {clientName}</p>
          )}
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {/* Liaison facture optionnelle */}
          {unpaidInvoices.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="invoice">Lier a une facture (optionnel)</Label>
              <Select
                value={form.invoiceId}
                onValueChange={(value) => setForm({ ...form, invoiceId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Aucune facture" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-gray-500">Aucune facture</span>
                  </SelectItem>
                  {unpaidInvoices.map((invoice) => (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-gray-400" />
                        <span>{invoice.invoiceNumber}</span>
                        <span className="text-gray-500">
                          - {Number(invoice.amount).toFixed(0)} {invoice.currency}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Si vous liez ce paiement a une facture, elle sera automatiquement marquee comme payee.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Montant *</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                {currency}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="method">Methode de paiement *</Label>
            <Select
              value={form.method}
              onValueChange={(value: PaymentMethod) => 
                setForm({ ...form, method: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BANK_TRANSFER">Virement bancaire</SelectItem>
                <SelectItem value="CHECK">Cheque</SelectItem>
                <SelectItem value="CASH">Especes</SelectItem>
                <SelectItem value="CARD">Carte bancaire</SelectItem>
                <SelectItem value="OTHER">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reference">Reference (optionnel)</Label>
            <Input
              id="reference"
              placeholder="Ex: VIR-2024-001"
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Notes sur ce paiement..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="resize-none h-20"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !form.amount || parseFloat(form.amount) <= 0}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle size={14} />
              )}
              Enregistrer
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
