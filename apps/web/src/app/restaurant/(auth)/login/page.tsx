'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'
import { Eye, EyeOff, UtensilsCrossed, Check } from 'lucide-react'
import { toast } from 'sonner'

interface BrandingData {
  organization: {
    id: string
    name: string
    logo: string | null
    primaryColor: string
    email: string
    phone: string | null
  } | null
  restaurant: {
    name: string
    logo: string | null
  } | null
}

export default function RestaurantLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const subdomain = searchParams.get('subdomain') || ''
  
  const { login } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [branding, setBranding] = useState<BrandingData | null>(null)

  useEffect(() => {
    if (subdomain) {
      apiClient.get<BrandingData>(`/store/${subdomain}/branding`)
        .then(res => {
          if (res.success && res.data) {
            setBranding(res.data)
          }
        })
        .catch(() => {})
    }
  }, [subdomain])

  const orgName = branding?.organization?.name || branding?.restaurant?.name || 'Restaurant'
  const primaryColor = branding?.organization?.primaryColor || '#10b981'
  const supportEmail = branding?.organization?.email || ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await login(email, password)
      const { user } = useAuthStore.getState()
      
      if (user?.userType === 'RESTAURANT' || user?.userType === 'DRIVER') {
        toast.success('Connexion reussie')
        router.push('/restaurant')
      } else {
        toast.error('Acces non autorise pour ce type de compte')
        useAuthStore.getState().logout()
        return
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div 
        className="hidden lg:flex lg:w-[480px] flex-col p-10"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">
            {orgName}
          </span>
        </div>
        
        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Gerez votre restaurant en toute simplicite
          </h2>
          <p className="text-white/80 mb-10">
            Commandes, menu, clients, livraisons... Tout est centralise dans votre espace de gestion.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-white font-medium">Commandes en temps reel</div>
                <div className="text-sm text-white/70">Recevez et gerez vos commandes instantanement</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-white font-medium">Menu personnalisable</div>
                <div className="text-sm text-white/70">Modifiez vos plats et prix en quelques clics</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-white font-medium">Statistiques detaillees</div>
                <div className="text-sm text-white/70">Suivez vos performances et revenus</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-10 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: primaryColor }}
            >
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              {orgName}
            </span>
          </div>

          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            Espace Restaurant
          </h1>
          <p className="text-gray-500 mb-8">
            Connectez-vous pour gerer votre etablissement
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                placeholder="votre@email.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <Link 
                  href="/restaurant/forgot-password" 
                  className="text-sm font-medium"
                  style={{ color: primaryColor }}
                >
                  Oublie ?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all pr-12"
                  placeholder="Votre mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => setRememberMe(!rememberMe)}
            >
              <div 
                className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
                style={rememberMe ? { backgroundColor: primaryColor, borderColor: primaryColor } : { borderColor: '#d1d5db' }}
              >
                {rememberMe && <Check size={14} className="text-white" />}
              </div>
              <span className="text-sm text-gray-600">Rester connecte pendant 30 jours</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          {supportEmail && (
            <p className="mt-8 text-center text-sm text-gray-500">
              Besoin d&apos;aide ?{' '}
              <a 
                href={`mailto:${supportEmail}`} 
                className="font-medium"
                style={{ color: primaryColor }}
              >
                Contactez le support
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
