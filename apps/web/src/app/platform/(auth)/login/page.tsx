'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth.store'
import { Eye, EyeOff, Shield, Lock, Activity } from 'lucide-react'
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
    <div className="min-h-screen flex bg-[#0b0d12]">
      <div className="hidden lg:flex lg:w-[480px] bg-[#11141b] flex-col p-10 border-r border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-400" />
          </div>
          <span className="text-xl font-bold text-white">IziResto Admin</span>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Console d&apos;administration
          </h2>
          <p className="text-gray-400 mb-10">
            Acces reserve aux super administrateurs de la plateforme.
            Toute connexion est tracee et auditee.
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
                <Lock className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <div className="text-white font-medium">Acces protege</div>
                <div className="text-sm text-gray-500">Authentification 2FA recommandee</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <div className="text-white font-medium">Audit trail</div>
                <div className="text-sm text-gray-500">Toutes les actions sont enregistrees</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-gray-600 text-xs">
          IziResto Platform &middot; Acces restreint
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-xl font-bold text-white">IziResto Admin</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Administration</h1>
            <p className="mt-2 text-gray-500">Connectez-vous a la console d&apos;administration</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email administrateur
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@iziresto.com"
                className="w-full h-12 px-4 bg-[#161a23] border border-white/5 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Mot de passe
                </label>
                <Link href="/forgot-password" className="text-sm text-amber-400 hover:text-amber-300 font-medium">
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
                  className="w-full h-12 px-4 bg-[#161a23] border border-white/5 rounded-xl text-sm text-white placeholder:text-gray-600 pr-12 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-[#0b0d12] rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Connexion en cours...' : 'Acceder a la console'}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-600 text-xs">
            Acces reserve. Tentatives de connexion auditees.
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
