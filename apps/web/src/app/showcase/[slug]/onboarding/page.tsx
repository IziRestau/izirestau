'use client'

import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  CheckCircle, 
  Loader2,
  Store,
  User,
  Lock,
  AlertCircle,
  PartyPopper,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

interface OnboardingData {
  valid: boolean
  reason?: string
  email?: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  organization?: {
    id: string
    name: string
    slug: string
    logo: string | null
    primaryColor: string
  }
  plan?: {
    id: string
    name: string
    priceMonthly: number
    priceYearly: number | null
    currency: string
    features: string[]
  } | null
  amount?: number
  currency?: string
  billingCycle?: string
}

export default function OnboardingPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const slug = params.slug as string
  const token = searchParams.get('token')

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    restaurantName: '',
    restaurantPhone: '',
    restaurantAddress: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ subdomain: string } | null>(null)

  const { data: onboardingData, isLoading, error: fetchError } = useQuery({
    queryKey: ['showcase-onboarding', token],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/public/showcase/onboarding/validate?token=${token}`)
      if (!res.ok) throw new Error('Invalid token')
      const data = await res.json()
      return data.data as OnboardingData
    },
    enabled: !!token,
  })

  useEffect(() => {
    if (onboardingData) {
      setFormData(prev => ({
        ...prev,
        firstName: onboardingData.firstName || '',
        lastName: onboardingData.lastName || '',
        email: onboardingData.email || '',
        phone: onboardingData.phone || '',
      }))
    }
  }, [onboardingData])

  const organization = onboardingData?.organization
  const primaryColor = organization?.primaryColor || '#10b981'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (step === 1) {
      if (!formData.restaurantName.trim()) {
        setError('Le nom du restaurant est requis')
        return
      }
      setStep(2)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch(`${API_URL}/public/showcase/onboarding/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          restaurantName: formData.restaurantName,
          restaurantPhone: formData.restaurantPhone,
          restaurantAddress: formData.restaurantAddress,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Erreur lors de la création')
      }

      setSuccess({ subdomain: data.data.subdomain })
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    )
  }

  if (fetchError || !onboardingData?.valid) {
    const reason = onboardingData?.reason
    let message = 'Ce lien n\'est plus valide.'
    if (reason === 'PAYMENT_NOT_COMPLETED') {
      message = 'Le paiement n\'a pas été complété. Veuillez réessayer.'
    } else if (reason === 'TOKEN_EXPIRED') {
      message = 'Ce lien a expiré. Veuillez contacter le revendeur.'
    } else if (reason === 'ALREADY_COMPLETED') {
      message = 'Votre compte a déjà été créé. Connectez-vous pour accéder à votre dashboard.'
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h1>
          <p className="text-gray-600 mb-6">{message}</p>
          <Link
            href={`/showcase/${slug}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={18} />
            Retour à la vitrine
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md w-full text-center">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <PartyPopper size={32} style={{ color: primaryColor }} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Félicitations !</h1>
          <p className="text-gray-600 mb-6">
            Votre compte a été créé avec succès. Vous pouvez maintenant accéder à votre dashboard.
          </p>
          <div className="p-4 bg-gray-50 rounded-xl mb-6">
            <p className="text-sm text-gray-500 mb-1">Votre sous-domaine</p>
            <p className="font-mono font-medium text-gray-900">{success.subdomain}</p>
          </div>
          <a
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-3 text-white font-medium rounded-xl transition-all hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            Se connecter
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-16">
            <div className="flex items-center gap-3">
              {organization?.logo ? (
                <img src={organization.logo} alt={organization.name} className="h-8 w-auto" />
              ) : (
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  {organization?.name[0]}
                </div>
              )}
              <span className="font-semibold text-gray-900">{organization?.name}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Progress */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'text-white' : 'bg-gray-200 text-gray-500'
              }`}
              style={step >= 1 ? { backgroundColor: primaryColor } : {}}
            >
              {step > 1 ? <CheckCircle size={18} /> : '1'}
            </div>
            <span className={`text-sm ${step >= 1 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              Restaurant
            </span>
          </div>
          <div className="w-12 h-0.5 bg-gray-200">
            <div 
              className="h-full transition-all"
              style={{ 
                width: step > 1 ? '100%' : '0%',
                backgroundColor: primaryColor 
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'text-white' : 'bg-gray-200 text-gray-500'
              }`}
              style={step >= 2 ? { backgroundColor: primaryColor } : {}}
            >
              2
            </div>
            <span className={`text-sm ${step >= 2 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              Compte
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-center gap-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 ? (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <Store size={24} style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Votre restaurant</h1>
                    <p className="text-sm text-gray-500">Informations de base</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Nom du restaurant *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.restaurantName}
                      onChange={(e) => setFormData(prev => ({ ...prev, restaurantName: e.target.value }))}
                      placeholder="Ex: Chez Mario"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Ce nom sera utilisé pour créer votre sous-domaine
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Téléphone du restaurant
                    </label>
                    <input
                      type="tel"
                      value={formData.restaurantPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, restaurantPhone: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Adresse
                    </label>
                    <input
                      type="text"
                      value={formData.restaurantAddress}
                      onChange={(e) => setFormData(prev => ({ ...prev, restaurantAddress: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <User size={24} style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Votre compte</h1>
                    <p className="text-sm text-gray-500">Créez votre compte administrateur</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Prénom *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Nom *
                      </label>
                      <input
                        type="text"
                        required
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
                      disabled
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500"
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Mot de passe *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum 8 caractères</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Confirmer le mot de passe *
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center gap-3 mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Retour
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 py-3 text-white font-medium rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {isSubmitting ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : step === 1 ? (
                  'Continuer'
                ) : (
                  <>
                    <Lock size={18} />
                    Créer mon compte
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Plan Summary */}
        {onboardingData.plan && (
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Votre abonnement</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{onboardingData.plan.name}</p>
                <p className="text-sm text-gray-500">
                  {onboardingData.billingCycle === 'YEARLY' ? 'Annuel' : 'Mensuel'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: onboardingData.currency || 'XOF',
                    minimumFractionDigits: 0,
                  }).format(onboardingData.amount || 0)}
                </p>
                <p className="text-xs text-emerald-600 flex items-center gap-1 justify-end">
                  <CheckCircle size={12} />
                  Payé
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
