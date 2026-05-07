'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth.store'
import { Eye, EyeOff, UtensilsCrossed, Check } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { toast } from 'sonner'
import { TwoFactorLoginModal } from '@/components/shared/TwoFactorLoginModal'
import { useSubdomainContext, getContextConfig } from '@/lib/subdomain'

type UserRole = 'admin' | 'restaurant' | 'reseller'

function detectRole(user: { isSuperAdmin?: boolean; userType?: string } | null): UserRole | null {
  if (!user) return null
  if (user.isSuperAdmin || user.userType === 'SUPER_ADMIN') return 'admin'
  if (user.userType === 'RESTAURANT' || user.userType === 'DRIVER') return 'restaurant'
  if (user.userType === 'RESELLER') return 'reseller'
  return null
}

const ROLE_TO_SUBDOMAIN: Record<UserRole, 'admin' | 'app' | 'reseller'> = {
  admin: 'admin',
  restaurant: 'app',
  reseller: 'reseller',
}

export default function LoginPage() {
  const router = useRouter()
  const subdomain = useSubdomainContext()
  const cfg = getContextConfig(subdomain)
  const { login, login2FA } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [show2FAModal, setShow2FAModal] = useState(false)
  const [tempToken, setTempToken] = useState('')
  const [is2FALoading, setIs2FALoading] = useState(false)

  const redirectAfterLogin = () => {
    const { user } = useAuthStore.getState()
    const role = detectRole(user)
    if (!role) {
      router.push('/')
      return
    }

    const targetSub = ROLE_TO_SUBDOMAIN[role]

    if (!subdomain || subdomain === targetSub) {
      router.push('/')
      return
    }

    const host = window.location.hostname
    const parts = host.split('.')
    const rootDomain = parts.length >= 2 ? parts.slice(-2).join('.') : host
    window.location.href = `${window.location.protocol}//${targetSub}.${rootDomain}/`
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
      
      toast.success('Connexion reussie')
      redirectAfterLogin()
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
      toast.success('Connexion reussie')
      redirectAfterLogin()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Code invalide')
    } finally {
      setIs2FALoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="hidden lg:flex lg:w-[480px] bg-[#1e2128] flex-col p-10">
        <Logo size="md" theme="dark" />
        
        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            La plateforme complete pour gerer vos restaurants
          </h2>
          <p className="text-gray-400 mb-10">
            Rejoignez plus de 500 revendeurs qui font confiance a IziResto pour developper leur activite.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="text-white font-medium">500+ Restaurants</div>
                <div className="text-sm text-gray-400">Actifs sur la plateforme</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <span className="text-blue-400 text-xl font-bold">K</span>
              </div>
              <div>
                <div className="text-white font-medium">Commandes mensuelles</div>
                <div className="text-sm text-gray-400">Traitees chaque mois</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <span className="text-purple-400 text-xl font-bold">%</span>
              </div>
              <div>
                <div className="text-white font-medium">Satisfaction client</div>
                <div className="text-sm text-gray-400">Note moyenne de nos utilisateurs</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-gray-500 text-sm">
          2024 IziResto. Tous droits reserves.
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#f8f9fb]">
        <div className="w-full max-w-[420px]">
          <div className="text-center mb-8 lg:hidden">
            <Logo size="md" theme="light" className="justify-center mb-6" />
          </div>
          
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">{cfg.title}</h1>
            <p className="mt-2 text-gray-500">{cfg.subtitle}</p>
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
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-emerald-500 hover:text-emerald-600 font-medium"
                >
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

          {cfg.registerEnabled && (
            <p className="mt-8 text-center text-gray-500 text-sm">
              Vous n&apos;avez pas de compte ?{' '}
              <Link href="/register" className="text-emerald-500 font-semibold hover:text-emerald-600">
                Creer un compte
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* 2FA Modal */}
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
