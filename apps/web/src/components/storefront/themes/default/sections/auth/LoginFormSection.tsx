'use client'

import { useState } from 'react'
import { LogIn, Loader2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { getIconComponent } from '@/components/shared/IconPicker'
import type { StoreThemeData } from '../../../_types'
import { useStorefrontAuthStore } from '@/stores/storefront-auth.store'

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
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  const { login, isLoading } = useStorefrontAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')

  if (s('enabled', true) === false) return null

  const layout = (s('layout', 'minimal') as string)
  const sideImage = (s('sideImage') as string)
  const title = (s('title', 'Connectez-vous') as string)
  const subtitle = (s('subtitle', 'Accédez à votre espace client') as string)
  const showRememberMe = s('showRememberMe', true) !== false
  const showForgotPassword = s('showForgotPassword', true) !== false
  const showRegisterLink = s('showRegisterLink', true) !== false
  const registerLinkText = (s('registerLinkText', 'Pas encore de compte ? Inscrivez-vous') as string)
  const showGuestCheckout = s('showGuestCheckout', false) === true
  const guestCheckoutText = (s('guestCheckoutText', 'Commander sans compte') as string)
  const submitBtnText = (s('submitBtnText', 'Se connecter') as string)
  const SubmitIcon = getIconComponent(s('submitBtnIcon', '') as string) || LogIn

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  const inputStyle = {
    borderColor: `${theme.textColor}15`,
    color: theme.textColor,
    backgroundColor: theme.backgroundColor,
    '--tw-ring-color': `${theme.primaryColor}40`,
  } as React.CSSProperties

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const result = await login(email, password)
    if (result.success) {
      onSuccess?.()
    } else {
      setError(result.error || 'Erreur de connexion')
    }
  }

  const iconBox = (icon: React.ReactNode) => (
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
      style={{ backgroundColor: `${theme.primaryColor}15` }}
    >
      {icon}
    </div>
  )

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div
          className="p-3 rounded-xl text-sm"
          style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}
        >
          {error}
        </div>
      )}

      <div>
        <label className="text-xs font-medium mb-1.5 block" style={{ color: theme.textColor }}>
          Email *
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
          style={inputStyle}
          placeholder="votre@email.com"
        />
      </div>

      <div>
        <label className="text-xs font-medium mb-1.5 block" style={{ color: theme.textColor }}>
          Mot de passe *
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 pr-12 rounded-xl border text-sm focus:outline-none focus:ring-2"
            style={inputStyle}
            placeholder="Votre mot de passe"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity"
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
            <span className="text-xs" style={{ color: theme.textColor }}>Se souvenir de moi</span>
          </label>
        )}
        {showForgotPassword && (
          <Link
            href={`/store/${subdomain}/forgot-password`}
            className="text-xs font-medium hover:underline"
            style={{ color: theme.primaryColor }}
          >
            Mot de passe oublié ?
          </Link>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 ${btnClass}`}
        style={{ backgroundColor: theme.primaryColor }}
      >
        {isLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <SubmitIcon size={14} />
        )}
        {isLoading ? 'Connexion...' : submitBtnText}
      </button>

      {showRegisterLink && (
        <p className="text-center text-sm" style={{ color: theme.textColor }}>
          <Link
            href={`/store/${subdomain}/register${redirectTo ? `?redirect=${redirectTo}` : ''}`}
            className="font-medium hover:underline"
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

  if (layout === 'with-image' && sideImage) {
    return (
      <section className="py-12 sm:py-16" style={{ backgroundColor: `${theme.textColor}04` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="rounded-2xl overflow-hidden order-2 lg:order-1">
              <img
                src={sideImage}
                alt="Connexion"
                className="w-full h-64 sm:h-80 lg:h-[500px] object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div
                className="rounded-2xl p-6 sm:p-8"
                style={{ backgroundColor: theme.backgroundColor }}
              >
                {iconBox(<LogIn size={20} style={{ color: theme.primaryColor }} />)}
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

  return (
    <section className="py-12 sm:py-16" style={{ backgroundColor: `${theme.textColor}04` }}>
      <div className="max-w-md mx-auto px-4 sm:px-6">
        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{ backgroundColor: theme.backgroundColor }}
        >
          {iconBox(<LogIn size={20} style={{ color: theme.primaryColor }} />)}
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
