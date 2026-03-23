'use client'

import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  CheckCircle, 
  Loader2,
  CreditCard,
  Shield,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

interface Plan {
  id: string
  name: string
  slug: string
  description: string | null
  priceMonthly: number
  priceYearly: number | null
  currency: string
  features: string[]
  isCustom: boolean
  isPopular: boolean
}

interface ShowcaseData {
  organization: {
    name: string
    slug: string
    logo: string | null
    primaryColor: string
  }
}

export default function CheckoutPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const slug = params.slug as string
  const planId = searchParams.get('plan')
  const cycle = searchParams.get('cycle') || 'monthly'

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: showcaseData } = useQuery({
    queryKey: ['public-showcase', slug],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/public/showcase/${slug}`)
      if (!res.ok) throw new Error('Showcase not found')
      const data = await res.json()
      return data.data as ShowcaseData
    },
    enabled: !!slug,
  })

  const { data: plansData } = useQuery({
    queryKey: ['public-showcase-plans', slug],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/public/showcase/${slug}/plans`)
      if (!res.ok) throw new Error('Plans not found')
      const data = await res.json()
      return data.data as Plan[]
    },
    enabled: !!slug,
  })

  const plan = plansData?.find(p => p.id === planId)
  const organization = showcaseData?.organization
  const primaryColor = organization?.primaryColor || '#10b981'

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const res = await fetch(`${API_URL}/public/showcase/${slug}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          planId,
          billingCycle: cycle === 'yearly' ? 'YEARLY' : 'MONTHLY',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Erreur lors du paiement')
      }

      if (data.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!plan || !organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    )
  }

  const price = cycle === 'yearly' && plan.priceYearly 
    ? plan.priceYearly 
    : plan.priceMonthly

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link 
              href={`/showcase/${slug}`}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">Retour</span>
            </Link>
            <div className="flex items-center gap-3">
              {organization.logo ? (
                <img src={organization.logo} alt={organization.name} className="h-8 w-auto" />
              ) : (
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  {organization.name[0]}
                </div>
              )}
              <span className="font-semibold text-gray-900">{organization.name}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-8">
              <h1 className="text-xl font-bold text-gray-900 mb-6">
                Finaliser votre commande
              </h1>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Prénom
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Nom
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.email}
                    className="w-full flex items-center justify-center gap-2 py-3 text-white font-medium rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {isSubmitting ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <CreditCard size={20} />
                    )}
                    {isSubmitting ? 'Redirection...' : 'Procéder au paiement'}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <Shield size={14} />
                  <span>Paiement sécurisé via Moneroo</span>
                </div>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
              <h2 className="font-semibold text-gray-900 mb-4">Récapitulatif</h2>

              <div className="p-4 bg-gray-50 rounded-xl mb-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{plan.name}</p>
                    <p className="text-sm text-gray-500">
                      {cycle === 'yearly' ? 'Facturation annuelle' : 'Facturation mensuelle'}
                    </p>
                  </div>
                </div>
                {plan.features.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {plan.features.slice(0, 3).map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                        <CheckCircle size={12} style={{ color: primaryColor }} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Sous-total</span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(price, plan.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-lg font-bold">
                  <span className="text-gray-900">Total</span>
                  <span style={{ color: primaryColor }}>
                    {formatPrice(price, plan.currency)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {cycle === 'yearly' ? 'Facturé annuellement' : 'Facturé mensuellement'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
