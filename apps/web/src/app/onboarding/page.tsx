'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Store, User, Lock, Mail, Phone, Building2, Loader2, CheckCircle, ArrowRight, UtensilsCrossed, Shield, Zap, HeartHandshake, Eye, EyeOff } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { Logo } from '@/components/ui/logo'
import { toast } from 'sonner'

interface OnboardingFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  restaurantName: string
  restaurantPhone: string
  restaurantAddress: string
  acceptTerms: boolean
}

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const emailParam = searchParams.get('email')

  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [resellerName, setResellerName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<OnboardingFormData>({
    firstName: '',
    lastName: '',
    email: emailParam || '',
    phone: '',
    password: '',
    confirmPassword: '',
    restaurantName: '',
    restaurantPhone: '',
    restaurantAddress: '',
    acceptTerms: false,
  })

  useEffect(() => {
    if (!token) {
      setIsValidating(false)
      return
    }

    const validateToken = async () => {
      try {
        const response = await apiClient.get<{
          valid: boolean
          email: string
          resellerName: string
          clientName: string
        }>(`/onboarding/validate?token=${token}`)
        
        if (response.data?.valid) {
          setTokenValid(true)
          setResellerName(response.data.resellerName || '')
          setFormData(prev => ({
            ...prev,
            email: response.data?.email || emailParam || '',
          }))
        }
      } catch (error) {
        console.error('Token validation error:', error)
      } finally {
        setIsValidating(false)
      }
    }

    validateToken()
  }, [token, emailParam])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const validateStep1 = () => {
    if (!formData.firstName || !formData.lastName) {
      toast.error('Veuillez remplir votre prenom et nom')
      return false
    }
    if (!formData.email) {
      toast.error('Veuillez remplir votre email')
      return false
    }
    if (!formData.password || formData.password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caracteres')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!formData.restaurantName) {
      toast.error('Veuillez remplir le nom du restaurant')
      return false
    }
    if (!formData.acceptTerms) {
      toast.error('Veuillez accepter les conditions d\'utilisation')
      return false
    }
    return true
  }

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep2()) return

    setIsLoading(true)
    try {
      await apiClient.post('/onboarding/complete', {
        token,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        restaurantName: formData.restaurantName,
        restaurantPhone: formData.restaurantPhone,
        restaurantAddress: formData.restaurantAddress,
      })

      toast.success('Compte cree avec succes!')
      router.push('/login?onboarding=success')
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la creation du compte')
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    { icon: UtensilsCrossed, title: 'Gestion complete', description: 'Menu, commandes, clients en un seul endroit' },
    { icon: Zap, title: 'Mise en ligne rapide', description: 'Votre site pret en quelques minutes' },
    { icon: Shield, title: 'Securise', description: 'Paiements et donnees proteges' },
    { icon: HeartHandshake, title: 'Support dedié', description: 'Une equipe a votre ecoute' },
  ]

  if (isValidating) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verification en cours...</p>
        </div>
      </div>
    )
  }

  if (!token || !tokenValid) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Store className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Lien invalide ou expire</h1>
          <p className="text-sm text-gray-500 mb-6">
            Ce lien d'invitation n'est plus valide. Veuillez contacter votre revendeur pour recevoir une nouvelle invitation.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Retour a l'accueil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding (Gingo style) */}
      <div className="hidden lg:flex lg:w-[480px] bg-[#1e2128] flex-col p-10">
        <Logo size="md" theme="dark" />
        
        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Lancez votre restaurant en ligne
          </h2>
          <p className="text-gray-400 mb-10">
            Rejoignez des centaines de restaurateurs qui font confiance a IziResto pour developper leur activite.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="text-white font-medium">Gestion complete</div>
                <div className="text-sm text-gray-400">Menu, commandes, clients</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-white font-medium">Mise en ligne rapide</div>
                <div className="text-sm text-gray-400">Votre site pret en minutes</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="text-white font-medium">Securise</div>
                <div className="text-sm text-gray-400">Paiements et donnees proteges</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <HeartHandshake className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <div className="text-white font-medium">Support dedie</div>
                <div className="text-sm text-gray-400">Une equipe a votre ecoute</div>
              </div>
            </div>
          </div>
        </div>

        <div>
          {resellerName && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
              <p className="text-gray-400 text-sm mb-1">Invitation de</p>
              <p className="text-white font-medium">{resellerName}</p>
            </div>
          )}
          <div className="text-gray-500 text-sm">
            2024 IziResto. Tous droits reserves.
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#f8f9fb]">
        <div className="w-full max-w-[420px]">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <Logo size="md" theme="light" className="justify-center mb-6" />
            {resellerName && (
              <p className="text-sm text-gray-500">
                Invitation de <span className="font-medium text-gray-700">{resellerName}</span>
              </p>
            )}
          </div>

          {/* Desktop Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Creez votre compte</h1>
            <p className="mt-2 text-gray-500">Completez les informations pour demarrer</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-4 mb-8 p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => step > 1 && setStep(1)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                step === 1 ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                {step > 1 ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">1</span>}
                Compte
              </span>
            </button>
            <button
              type="button"
              disabled={step < 2}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                step === 2 ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${step >= 2 ? 'bg-emerald-500 text-white' : 'bg-gray-300 text-white'}`}>2</span>
                Restaurant
              </span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Prenom</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Jean"
                    className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Nom</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Dupont"
                    className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jean@restaurant.com"
                  disabled={!!emailParam}
                  className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-60 disabled:bg-gray-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Telephone (optionnel)</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="06 12 34 56 78"
                  className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 8 caracteres"
                    className="w-full h-12 px-4 pr-12 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirmer le mot de passe"
                  className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                className="w-full h-12 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
              >
                Continuer
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Nom du restaurant</label>
                <input
                  type="text"
                  name="restaurantName"
                  value={formData.restaurantName}
                  onChange={handleChange}
                  placeholder="Chez Jean"
                  className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Telephone du restaurant (optionnel)</label>
                <input
                  type="tel"
                  name="restaurantPhone"
                  value={formData.restaurantPhone}
                  onChange={handleChange}
                  placeholder="01 23 45 67 89"
                  className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Adresse (optionnel)</label>
                <input
                  type="text"
                  name="restaurantAddress"
                  value={formData.restaurantAddress}
                  onChange={handleChange}
                  placeholder="123 rue de la Paix, 75001 Paris"
                  className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  id="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className="w-5 h-5 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="acceptTerms" className="text-sm text-gray-600 cursor-pointer">
                  J'accepte les <a href="/terms" className="text-emerald-500 hover:text-emerald-600 font-medium">conditions d'utilisation</a>
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 h-12 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 h-12 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Creer mon compte'
                  )}
                </button>
              </div>
            </div>
          )}
          </form>
        </div>
      </div>
    </div>
  )
}
