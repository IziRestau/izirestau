'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth.store'
import { Eye, EyeOff, Briefcase, TrendingUp, Users, Wallet, Check } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { toast } from 'sonner'
import { TwoFactorLoginModal } from '@/components/shared/TwoFactorLoginModal'

export default function ResellerLoginPage() {
  const router = useRouter()
  const { login, login2FA } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [show2FAModal, setShow2FAModal] = useState(false)
  const [tempToken, setTempToken] = useState('')
  const [is2FALoading, setIs2FALoading] = useState(false)

  const finalizeLogin = () => {
    const { user, logout } = useAuthStore.getState()
    if (user?.userType !== 'RESELLER') {
      toast.error('Cet espace est reserve aux revendeurs')
      logout()
      return
    }
    toast.success('Connexion reussie')
    router.push('/')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const result = await login(email, password)
      if (result.requires2FA && result.tempToken) {
        setTempToken(result.tempToken)
        setShow2FAModal(true)
        setIsLoading(false)
        return
      }
      finalizeLogin()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  const handle2FASubmit = async (code: string) => {
    setIs2FALoading(true)
    try {
      await login2FA(tempToken, code)
      setShow2FAModal(false)
      finalizeLogin()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Code invalide')
    } finally {
      setIs2FALoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[480px] bg-gradient-to-br from-emerald-600 to-emerald-700 flex-col p-10">
        <Logo size="md" theme="dark" />

        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Developpez votre activite de revendeur
          </h2>
          <p className="text-emerald-50 mb-10">
            Gerez vos restaurants clients, suivez vos commissions
            et boostez vos revenus depuis un seul espace.
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-white font-medium">Gestion centralisee</div>
                <div className="text-sm text-emerald-50/80">Tous vos clients restaurants en un coup d&apos;oeil</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-white font-medium">Commissions automatiques</div>
                <div className="text-sm text-emerald-50/80">Paiements et facturation simplifies</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-white font-medium">Statistiques de croissance</div>
                <div className="text-sm text-emerald-50/80">Suivez vos performances en temps reel</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-white font-medium">Equipe & support</div>
                <div className="text-sm text-emerald-50/80">Invitez vos collaborateurs et ouvrez des tickets</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-emerald-100/70 text-sm">
          2024 IziResto. Tous droits reserves.
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-[#f8f9fb]">
        <div className="w-full max-w-[420px]">
          <div className="text-center mb-8 lg:hidden">
            <Logo size="md" theme="light" className="justify-center mb-6" />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Espace Revendeur</h1>
            <p className="mt-2 text-gray-500">Connectez-vous a votre espace revendeur</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="nom@entreprise.com"
                className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <Link href="/forgot-password" className="text-sm text-emerald-500 hover:text-emerald-600 font-medium">
                  Oublie ?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Entrez votre mot de passe"
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

            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => setRememberMe(!rememberMe)}
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                rememberMe
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'border-gray-300 group-hover:border-emerald-500'
              }`}>
                {rememberMe && <Check size={14} className="text-white" />}
              </div>
              <span className="text-sm text-gray-600">Rester connecte pendant 30 jours</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-500 text-sm">
            Vous n&apos;avez pas de compte ?{' '}
            <Link href="/register" className="text-emerald-500 font-semibold hover:text-emerald-600">
              Devenir revendeur
            </Link>
          </p>
        </div>
      </div>

      <TwoFactorLoginModal
        isOpen={show2FAModal}
        onClose={() => {
          setShow2FAModal(false)
          setTempToken('')
        }}
        onSubmit={handle2FASubmit}
        isLoading={is2FALoading}
      />
    </div>
  )
}
