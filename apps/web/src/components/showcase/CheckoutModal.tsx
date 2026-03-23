'use client'

import { useState } from 'react'
import { X, CreditCard, Shield, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

interface Plan {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  currency: string
  billingCycle: number
  billingCycleLabel: string | null
  isCustom: boolean
  isPopular: boolean
}

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  plan: Plan
  organizationSlug: string
  organizationName: string
  primaryColor: string
}

const BILLING_CYCLES: Record<number, string> = {
  1: 'mois',
  3: 'trimestre',
  6: 'semestre',
  12: 'an',
  24: '2 ans',
  36: '3 ans',
}

const PLATFORM_FEATURES = [
  'Site web professionnel personnalisable',
  'Système de commandes en ligne',
  'Caisse (POS) intégrée',
  'Gestion du menu et des produits',
  'Gestion des clients',
  'Statistiques et rapports',
]

export function CheckoutModal({
  isOpen,
  onClose,
  plan,
  organizationSlug,
  organizationName,
  primaryColor,
}: CheckoutModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getBillingLabel = () => {
    if (plan.billingCycleLabel) return plan.billingCycleLabel
    return BILLING_CYCLES[plan.billingCycle] || `${plan.billingCycle} mois`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const res = await fetch(`${API_URL}/public/showcase/${organizationSlug}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          planId: plan.id,
          billingCycle: plan.billingCycle,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Erreur lors du paiement')
      }

      if (data.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ email: '', firstName: '', lastName: '', phone: '' })
      setError(null)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Finaliser votre commande</h2>
            <p className="text-sm text-gray-500">{organizationName}</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-0 md:gap-6 p-5">
            {/* Form */}
            <div className="md:col-span-3 order-2 md:order-1">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Prénom</Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Jean"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Nom</Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Dupont"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Email *</Label>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="jean@exemple.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">Téléphone</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+229 XX XX XX XX"
                    className="mt-1"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !formData.email}
                    className="w-full h-12 text-base font-medium"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {isSubmitting ? (
                      <Loader2 size={20} className="animate-spin mr-2" />
                    ) : (
                      <CreditCard size={20} className="mr-2" />
                    )}
                    {isSubmitting ? 'Redirection...' : 'Procéder au paiement'}
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <Shield size={14} />
                  <span>Paiement sécurisé via Moneroo</span>
                </div>
              </form>
            </div>

            {/* Order Summary */}
            <div className="md:col-span-2 order-1 md:order-2 mb-5 md:mb-0">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Récapitulatif</h3>

                <div className="mb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{plan.name}</p>
                      <p className="text-xs text-gray-500">
                        Facturation {getBillingLabel()}
                      </p>
                    </div>
                    {plan.isPopular && (
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full text-white" style={{ backgroundColor: primaryColor }}>
                        Populaire
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 mb-4">
                  {PLATFORM_FEATURES.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                      <CheckCircle size={12} style={{ color: primaryColor }} className="flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span className="text-gray-900">Total</span>
                    <span style={{ color: primaryColor }}>
                      {formatPrice(plan.price, plan.currency)}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Facturé tous les {plan.billingCycle > 1 ? `${plan.billingCycle} mois` : 'mois'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
