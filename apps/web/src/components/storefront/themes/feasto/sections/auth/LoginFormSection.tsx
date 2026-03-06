'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Mail, Lock, LogIn } from 'lucide-react'
import { useStorefrontAuthStore } from '@/stores/storefront-auth.store'
import type { StoreThemeData } from '../../../_types'

interface LoginFormSectionProps {
  theme: StoreThemeData
  subdomain: string
  sectionData?: Record<string, unknown>
  redirectTo?: string
  onSuccess?: () => void
}

export function LoginFormSection({
  theme,
  subdomain,
  sectionData,
  redirectTo,
  onSuccess,
}: LoginFormSectionProps) {
  const router = useRouter()
  const { login, isLoading } = useStorefrontAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')

  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const layout = (s('layout', 'minimal') as string)
  const sideImage = (s('sideImage') as string)
  const title = (s('title', 'Connectez-vous') as string)
  const subtitle = (s('subtitle', 'Accédez à votre espace client') as string)
  const emailLabel = (s('emailLabel', 'Email') as string)
  const emailPlaceholder = (s('emailPlaceholder', 'votre@email.com') as string)
  const passwordLabel = (s('passwordLabel', 'Mot de passe') as string)
  const passwordPlaceholder = (s('passwordPlaceholder', '••••••••') as string)
  const submitBtnText = (s('submitBtnText', 'Se connecter') as string)
  const forgotPasswordText = (s('forgotPasswordText', 'Mot de passe oublié ?') as string)
  const noAccountText = (s('noAccountText', "Pas encore de compte ?") as string)
  const registerLinkText = (s('registerLinkText', "S'inscrire") as string)
  const showRememberMe = s('showRememberMe', true) !== false
  const showForgotPassword = s('showForgotPassword', true) !== false
  const showRegisterLink = s('showRegisterLink', true) !== false
  const showGuestCheckout = s('showGuestCheckout', false) === true
  const guestCheckoutText = (s('guestCheckoutText', 'Commander sans compte') as string)

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-2xl'

  const inputStyle = {
    borderColor: `${theme.textColor}12`,
    color: theme.textColor,
    backgroundColor: `${theme.textColor}04`,
  } as React.CSSProperties

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const result = await login(email, password)
    if (result.success) {
      if (onSuccess) {
        onSuccess()
      } else if (redirectTo) {
        router.push(redirectTo)
      } else {
        router.push(`/store/${subdomain}/account`)
      }
    } else {
      setError(result.error || 'Identifiants incorrects')
    }
  }

  const iconBox = (icon: React.ReactNode) => (
    <div
      className={`w-14 h-14 flex items-center justify-center mx-auto mb-4 ${btnClass}`}
      style={{ backgroundColor: `${theme.primaryColor}15` }}
    >
      {icon}
    </div>
  )

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div 
          className={`p-4 text-sm text-center ${btnClass}`}
          style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}
        >
          {error}
        </div>
      )}

      <div>
        <label 
          className="block text-sm font-medium mb-2"
          style={{ color: theme.textColor }}
        >
          {emailLabel}
        </label>
        <div className="relative">
          <Mail 
            size={18} 
            className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40"
            style={{ color: theme.textColor }}
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={emailPlaceholder}
            required
            className={`w-full pl-12 pr-4 py-3.5 border-0 focus:outline-none focus:ring-2 transition-all ${btnClass}`}
            style={{
              ...inputStyle,
              '--tw-ring-color': `${theme.primaryColor}40`,
            } as React.CSSProperties}
          />
        </div>
      </div>

      <div>
        <label 
          className="block text-sm font-medium mb-2"
          style={{ color: theme.textColor }}
        >
          {passwordLabel}
        </label>
        <div className="relative">
          <Lock 
            size={18} 
            className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40"
            style={{ color: theme.textColor }}
          />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={passwordPlaceholder}
            required
            className={`w-full pl-12 pr-12 py-3.5 border-0 focus:outline-none focus:ring-2 transition-all ${btnClass}`}
            style={{
              ...inputStyle,
              '--tw-ring-color': `${theme.primaryColor}40`,
            } as React.CSSProperties}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70 transition-opacity"
            style={{ color: theme.textColor }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        {showRememberMe && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded"
              style={{ accentColor: theme.primaryColor }}
            />
            <span className="text-sm" style={{ color: theme.textColor }}>Se souvenir de moi</span>
          </label>
        )}
        {showForgotPassword && (
          <Link
            href={`/store/${subdomain}/forgot-password`}
            className="text-sm font-medium hover:underline"
            style={{ color: theme.primaryColor }}
          >
            {forgotPasswordText}
          </Link>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-4 font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 ${btnClass}`}
        style={{ backgroundColor: theme.primaryColor }}
      >
        {isLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <LogIn size={18} />
        )}
        {isLoading ? 'Connexion...' : submitBtnText}
      </button>

      {showRegisterLink && (
        <p 
          className="text-center text-sm"
          style={{ color: theme.textColor }}
        >
          <span className="opacity-60">{noAccountText}</span>{' '}
          <Link
            href={`/store/${subdomain}/register${redirectTo ? `?redirect=${redirectTo}` : ''}`}
            className="font-semibold hover:underline"
            style={{ color: theme.primaryColor }}
          >
            {registerLinkText}
          </Link>
        </p>
      )}

      {showGuestCheckout && (
        <div className="pt-4 border-t" style={{ borderColor: `${theme.textColor}10` }}>
          <Link
            href={`/store/${subdomain}/checkout`}
            className="block text-center text-sm font-medium opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: theme.textColor }}
          >
            {guestCheckoutText}
          </Link>
        </div>
      )}
    </form>
  )

  // Layout avec image latérale
  if (layout === 'with-image' && sideImage) {
    return (
      <section className="py-8 sm:py-12" style={{ backgroundColor: `${theme.textColor}04` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className={`overflow-hidden order-2 lg:order-1 ${btnClass}`}>
              <img
                src={sideImage}
                alt="Connexion"
                className="w-full h-64 sm:h-80 lg:h-[500px] object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div
                className={`p-6 sm:p-8 ${btnClass}`}
                style={{ backgroundColor: theme.backgroundColor, border: '1px solid rgba(255,255,255,0.12)' }}
              >
                {iconBox(<LogIn size={24} style={{ color: theme.primaryColor }} />)}
                <h2
                  className="text-xl sm:text-2xl font-bold text-center mb-1"
                  style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
                >
                  {title}
                </h2>
                <p className="text-sm text-center opacity-60 mb-6" style={{ color: theme.textColor }}>
                  {subtitle}
                </p>
                {formContent}
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Layout minimal (par défaut)
  return (
    <section className="py-8 sm:py-12" style={{ backgroundColor: `${theme.textColor}04` }}>
      <div className="max-w-lg mx-auto px-4 sm:px-6">
        <div
          className={`p-6 sm:p-8 ${btnClass}`}
          style={{ backgroundColor: theme.backgroundColor, border: '1px solid rgba(255,255,255,0.12)' }}
        >
          {iconBox(<LogIn size={24} style={{ color: theme.primaryColor }} />)}
          <h2
            className="text-xl sm:text-2xl font-bold text-center mb-1"
            style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
          >
            {title}
          </h2>
          <p className="text-sm text-center opacity-60 mb-6" style={{ color: theme.textColor }}>
            {subtitle}
          </p>
          {formContent}
        </div>
      </div>
    </section>
  )
}
