'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth.store'
import { Eye, EyeOff, Building2, CreditCard, BarChart3, Check } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuthStore()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!acceptTerms) {
      toast.error('Veuillez accepter les conditions d\'utilisation')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }

    if (formData.password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caracteres')
      return
    }

    setIsLoading(true)

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        userType: 'RESELLER',
      })
      toast.success('Compte cree avec succes')
      router.push('/reseller/onboarding')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="hidden lg:flex lg:w-[480px] bg-[#1e2128] flex-col p-10">
        <Logo size="md" theme="dark" />
        
        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Developpez votre activite avec IziResto
          </h2>
          <p className="text-gray-400 mb-10">
            Creez et gerez des sites de commande en ligne pour vos clients restaurateurs.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="text-white font-medium">Gestion multi-sites</div>
                <div className="text-sm text-gray-400">Creez jusqu&apos;a 20 sites par licence</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-white font-medium">Facturation integree</div>
                <div className="text-sm text-gray-400">Facturez vos clients directement</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="text-white font-medium">Analytics avances</div>
                <div className="text-sm text-gray-400">Suivez les performances en temps reel</div>
              </div>
            </div>
          </div>

          <div className="mt-10 p-6 bg-emerald-500/10 rounded-2xl">
            <p className="text-emerald-400 font-medium mb-2">Offre de lancement</p>
            <p className="text-white text-lg">14 jours d&apos;essai gratuit avec 5 sites inclus</p>
          </div>
        </div>

        <div className="text-gray-500 text-sm">
          2024 IziResto. Tous droits reserves.
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#f8f9fb] overflow-y-auto">
        <div className="w-full max-w-[420px] py-8">
          <div className="text-center mb-8 lg:hidden">
            <Logo size="md" theme="light" className="justify-center mb-6" />
          </div>
          
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Creer votre compte</h1>
            <p className="mt-2 text-gray-500">Commencez votre essai gratuit de 14 jours</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">Prenom</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="Jean"
                  className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Nom</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Dupont"
                  className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email professionnel</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="nom@entreprise.com"
                className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Telephone <span className="text-gray-400 font-normal">(optionnel)</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+33 6 12 34 56 78"
                className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de passe</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Minimum 8 caracteres"
                  className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm pr-12 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Retapez votre mot de passe"
                className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div 
              className="flex items-start gap-3 cursor-pointer group"
              onClick={() => setAcceptTerms(!acceptTerms)}
            >
              <div className={`w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                acceptTerms 
                  ? 'bg-emerald-500 border-emerald-500' 
                  : 'border-gray-300 group-hover:border-emerald-500'
              }`}>
                {acceptTerms && <Check size={14} className="text-white" />}
              </div>
              <span className="text-sm text-gray-600">
                J&apos;accepte les{' '}
                <Link href="/terms" className="text-emerald-500 hover:text-emerald-600" onClick={(e) => e.stopPropagation()}>
                  conditions d&apos;utilisation
                </Link>
                {' '}et la{' '}
                <Link href="/privacy" className="text-emerald-500 hover:text-emerald-600" onClick={(e) => e.stopPropagation()}>
                  politique de confidentialite
                </Link>
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creation en cours...' : 'Creer mon compte'}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-500 text-sm">
            Vous avez deja un compte ?{' '}
            <Link href="/login" className="text-emerald-500 font-semibold hover:text-emerald-600">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
