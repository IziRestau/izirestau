'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { api, apiClient } from '@/lib/api-client'
import { 
  X,
  Send,
  Mail,
  Building,
  CreditCard,
  Loader2,
  Check,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface InvitationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface InvitationFormData {
  email: string
  businessName: string
  subscriptionAmount: string
  billingCycle: 'MONTHLY' | 'YEARLY'
}

export function InvitationModal({ isOpen, onClose, onSuccess }: InvitationModalProps) {
  const { accessToken } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState<InvitationFormData>({
    email: '',
    businessName: '',
    subscriptionAmount: '49',
    billingCycle: 'MONTHLY',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({
      email: '',
      businessName: '',
      subscriptionAmount: '49',
      billingCycle: 'MONTHLY',
    })
    setError(null)
    setSuccess(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }

      const response = await api.reseller.createClient({
        name: formData.businessName || 'Restaurant',
        email: formData.email,
        businessName: formData.businessName || undefined,
        subscriptionAmount: parseFloat(formData.subscriptionAmount),
        billingCycle: formData.billingCycle,
      })

      if (response.success) {
        setSuccess(true)
        setTimeout(() => {
          resetForm()
          onSuccess()
          onClose()
        }, 1500)
      } else {
        setError(response.error || 'Une erreur est survenue')
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      
      <div className="relative bg-white rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Nouvelle invitation</h2>
              <p className="text-sm text-gray-500">Inviter un client</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Invitation envoyée</h3>
            <p className="text-gray-500">
              Un email a été envoyé à {formData.email}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email du propriétaire
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="proprietaire@restaurant.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du restaurant
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Chez Jean"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-gray-400" />
                Tarification
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="subscriptionAmount"
                      value={formData.subscriptionAmount}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full pl-4 pr-12 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">EUR</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cycle
                  </label>
                  <Select
                    value={formData.billingCycle}
                    onValueChange={(value: 'MONTHLY' | 'YEARLY') => setFormData(prev => ({ ...prev, billingCycle: value }))}
                  >
                    <SelectTrigger className="w-full h-[42px] bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300">
                      <SelectValue placeholder="Cycle" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-gray-100">
                      <SelectItem value="MONTHLY" className="rounded-lg">Mensuel</SelectItem>
                      <SelectItem value="YEARLY" className="rounded-lg">Annuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 border border-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Envoyer
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
