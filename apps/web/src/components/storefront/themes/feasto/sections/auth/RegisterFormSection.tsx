'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Mail, Lock, User, Phone, UserPlus } from 'lucide-react'
import { useStorefrontAuthStore } from '@/stores/storefront-auth.store'
import type { StoreThemeData } from '../../../_types'

interface RegisterFormSectionProps {
  theme: StoreThemeData
  subdomain: string
  sectionData?: Record<string, unknown>
  redirectTo?: string
  onSuccess?: () => void
}

export function RegisterFormSection({
  theme,
  subdomain,
  sectionData,
  redirectTo,
  onSuccess,
}: RegisterFormSectionProps) {
  const router = useRouter()
  const { register, isLoading } = useStorefrontAuthStore()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [marketingOptIn, setMarketingOptIn] = useState(true)
  const [error, setError] = useState('')

  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const layout = (s('layout', 'minimal') as string)
  const sideImage = (s('sideImage') as string)
  const title = (s('title', 'Créer un compte') as string)
  const subtitle = (s('subtitle', 'Rejoignez-nous pour profiter de tous les avantages') as string)
  const firstNameLabel = (s('firstNameLabel', 'Prénom') as string)
  const lastNameLabel = (s('lastNameLabel', 'Nom') as string)
  const emailLabel = (s('emailLabel', 'Email') as string)
  const phoneLabel = (s('phoneLabel', 'Téléphone') as string)
  const passwordLabel = (s('passwordLabel', 'Mot de passe') as string)
  const confirmPasswordLabel = (s('confirmPasswordLabel', 'Confirmer le mot de passe') as string)
  const submitBtnText = (s('submitBtnText', "Créer mon compte") as string)
  const hasAccountText = (s('hasAccountText', 'Déjà un compte ?') as string)
  const loginLinkText = (s('loginLinkText', 'Se connecter') as string)
  const showLoginLink = s('showLoginLink', true) !== false
  const showMarketingOptIn = s('showMarketingOptIn', true) !== false
  const marketingOptInText = (s('marketingOptInText', 'Je souhaite recevoir les offres et actualités') as string)

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

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    const result = await register({
      firstName,
      lastName,
      email,
      phone: phone || undefined,
      password,
      marketingOptIn,
    })

    if (result.success) {
      if (onSuccess) {
        onSuccess()
      } else if (redirectTo) {
        router.push(redirectTo)
      } else {
        router.push(`/store/${subdomain}/account`)
      }
    } else {
      setError(result.error || "Erreur lors de l'inscription")
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div 
          className={`p-4 text-sm text-center ${btnClass}`}
          style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: theme.textColor }}>
            {firstNameLabel}
          </label>
          <div className="relative">
            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" style={{ color: theme.textColor }} />
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className={`w-full pl-12 pr-4 py-3.5 border-0 focus:outline-none focus:ring-2 transition-all ${btnClass}`}
              style={{ ...inputStyle, '--tw-ring-color': `${theme.primaryColor}40` } as React.CSSProperties}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: theme.textColor }}>
            {lastNameLabel}
          </label>
          <div className="relative">
            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" style={{ color: theme.textColor }} />
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className={`w-full pl-12 pr-4 py-3.5 border-0 focus:outline-none focus:ring-2 transition-all ${btnClass}`}
              style={{ ...inputStyle, '--tw-ring-color': `${theme.primaryColor}40` } as React.CSSProperties}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: theme.textColor }}>
          {emailLabel}
        </label>
        <div className="relative">
          <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" style={{ color: theme.textColor }} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={`w-full pl-12 pr-4 py-3.5 border-0 focus:outline-none focus:ring-2 transition-all ${btnClass}`}
            style={{ ...inputStyle, '--tw-ring-color': `${theme.primaryColor}40` } as React.CSSProperties}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: theme.textColor }}>
          {phoneLabel} <span className="opacity-50">(optionnel)</span>
        </label>
        <div className="relative">
          <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" style={{ color: theme.textColor }} />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={`w-full pl-12 pr-4 py-3.5 border-0 focus:outline-none focus:ring-2 transition-all ${btnClass}`}
            style={{ ...inputStyle, '--tw-ring-color': `${theme.primaryColor}40` } as React.CSSProperties}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: theme.textColor }}>
          {passwordLabel}
        </label>
        <div className="relative">
          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" style={{ color: theme.textColor }} />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Minimum 8 caractères"
            className={`w-full pl-12 pr-12 py-3.5 border-0 focus:outline-none focus:ring-2 transition-all ${btnClass}`}
            style={{ ...inputStyle, '--tw-ring-color': `${theme.primaryColor}40` } as React.CSSProperties}
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

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: theme.textColor }}>
          {confirmPasswordLabel}
        </label>
        <div className="relative">
          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" style={{ color: theme.textColor }} />
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className={`w-full pl-12 pr-4 py-3.5 border-0 focus:outline-none focus:ring-2 transition-all ${btnClass}`}
            style={{ ...inputStyle, '--tw-ring-color': `${theme.primaryColor}40` } as React.CSSProperties}
          />
        </div>
      </div>

      {showMarketingOptIn && (
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={marketingOptIn}
            onChange={(e) => setMarketingOptIn(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded"
            style={{ accentColor: theme.primaryColor }}
          />
          <span className="text-sm" style={{ color: theme.textColor }}>{marketingOptInText}</span>
        </label>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-4 font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 ${btnClass}`}
        style={{ backgroundColor: theme.primaryColor }}
      >
        {isLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <UserPlus size={18} />
        )}
        {isLoading ? 'Création...' : submitBtnText}
      </button>

      {showLoginLink && (
        <p className="text-center text-sm" style={{ color: theme.textColor }}>
          <span className="opacity-60">{hasAccountText}</span>{' '}
          <Link
            href={`/store/${subdomain}/login${redirectTo ? `?redirect=${redirectTo}` : ''}`}
            className="font-semibold hover:underline"
            style={{ color: theme.primaryColor }}
          >
            {loginLinkText}
          </Link>
        </p>
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
                alt="Inscription"
                className="w-full h-64 sm:h-80 lg:h-[550px] object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div
                className={`p-6 sm:p-8 ${btnClass}`}
                style={{ backgroundColor: theme.backgroundColor, border: '1px solid rgba(255,255,255,0.12)' }}
              >
                {iconBox(<UserPlus size={24} style={{ color: theme.primaryColor }} />)}
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
          {iconBox(<UserPlus size={24} style={{ color: theme.primaryColor }} />)}
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
