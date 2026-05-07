'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth.store'
import { Eye, EyeOff, Shield, Lock, Activity, Users } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { toast } from 'sonner'
import { TwoFactorLoginModal } from '@/components/shared/TwoFactorLoginModal'

export default function PlatformLoginPage() {
  const router = useRouter()
  const { login, login2FA } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [show2FAModal, setShow2FAModal] = useState(false)
  const [tempToken, setTempToken] = useState('')
  const [is2FALoading, setIs2FALoading] = useState(false)

  const finalizeLogin = () => {
    const { user, logout } = useAuthStore.getState()
    if (!user?.isSuperAdmin && user?.userType !== 'SUPER_ADMIN') {
      toast.error('Acces reserve aux administrateurs')
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
      <div className="hidden lg:flex lg:w-[480px] bg-[#1e2128] flex-col p-10">
        <Logo size="md" theme="dark" />

        <div className="flex-1 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400 mb-6 w-fit">
            <Shield className="w-3.5 h-3.5" />
            Acces administrateur
          </div>

          <h2 className="text-3xl font-bold text-white mb-4">
            Console d&apos;administration IziResto
          </h2>
          <p className="text-gray-400 mb-10">
            Pilotez l&apos;ensemble de la plateforme : revendeurs, restaurants, licences, support.
            Toutes les actions sont auditees.
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="text-white font-medium">Gestion globale</div>
                <div className="text-sm text-gray-400">Revendeurs, restaurants et utilisateurs</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Lock className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="text-white font-medium">Licences & plans</div>
                <div className="text-sm text-gray-400">Configuration des offres commerciales</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="text-white font-medium">Audit & supervision</div>
                <div className="text-sm text-gray-400">Suivi en temps reel de la plateforme</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-gray-500 text-sm">
          2024 IziResto. Tous droits reserves.
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-[#f8f9fb]">
        <div className="w-full max-w-[420px]">
          <div className="text-center mb-8 lg:hidden">
            <Logo size="md" theme="light" className="justify-center mb-6" />
          </div>

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-xs font-medium text-emerald-700 mb-4">
              <Shield className="w-3.5 h-3.5" />
              Administration
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Console d&apos;administration</h1>
            <p className="mt-2 text-gray-500">Connectez-vous a votre espace super administrateur</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email administrateur
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@iziresto.com"
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
                  placeholder="Mot de passe administrateur"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Connexion en cours...' : 'Acceder a la console'}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-400 text-xs">
            Acces reserve. Toutes les tentatives de connexion sont auditees.
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
