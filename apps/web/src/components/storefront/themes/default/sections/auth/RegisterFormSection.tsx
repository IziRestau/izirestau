'use client'

import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react'
import Link from 'next/link'
import type { StoreThemeData } from '../../../_types'
import { useStorefrontAuthStore } from '@/stores/storefront-auth.store'

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
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  const { register, isLoading } = useStorefrontAuthStore()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    marketingOptIn: true,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const showPhoneField = s('showPhoneField', true) !== false
  const phoneRequired = s('phoneRequired', false) === true
  const showMarketingOptIn = s('showMarketingOptIn', true) !== false
  const marketingOptInText = (s('marketingOptInText', 'Je souhaite recevoir les offres et actualités') as string)
  const showLoginLink = s('showLoginLink', true) !== false
  const loginLinkText = (s('loginLinkText', 'Déjà un compte ? Connectez-vous') as string)

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    const result = await register({
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone || undefined,
      marketingOptIn: formData.marketingOptIn,
    })

    if (result.success) {
      onSuccess?.()
    } else {
      setError(result.error || 'Erreur lors de l\'inscription')
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textColor }}>
              <User size={14} className="inline mr-1.5" />
              Prénom
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border text-sm"
              style={{ borderColor: `${theme.textColor}20`, backgroundColor: theme.backgroundColor, color: theme.textColor }}
              placeholder="Jean"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textColor }}>
              <User size={14} className="inline mr-1.5" />
              Nom
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border text-sm"
              style={{ borderColor: `${theme.textColor}20`, backgroundColor: theme.backgroundColor, color: theme.textColor }}
              placeholder="Dupont"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textColor }}>
            <Mail size={14} className="inline mr-1.5" />
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border text-sm"
            style={{ borderColor: `${theme.textColor}20`, backgroundColor: theme.backgroundColor, color: theme.textColor }}
            placeholder="votre@email.com"
          />
        </div>

        {showPhoneField && (
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textColor }}>
              <Phone size={14} className="inline mr-1.5" />
              Téléphone {!phoneRequired && <span className="opacity-50">(optionnel)</span>}
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              required={phoneRequired}
              className="w-full px-4 py-3 rounded-lg border text-sm"
              style={{ borderColor: `${theme.textColor}20`, backgroundColor: theme.backgroundColor, color: theme.textColor }}
              placeholder="+221 77 123 45 67"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textColor }}>
            <Lock size={14} className="inline mr-1.5" />
            Mot de passe
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 pr-12 rounded-lg border text-sm"
              style={{ borderColor: `${theme.textColor}20`, backgroundColor: theme.backgroundColor, color: theme.textColor }}
              placeholder="Minimum 8 caractères"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: theme.textColor }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textColor }}>
            <Lock size={14} className="inline mr-1.5" />
            Confirmer le mot de passe
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border text-sm"
            style={{ borderColor: `${theme.textColor}20`, backgroundColor: theme.backgroundColor, color: theme.textColor }}
            placeholder="Confirmez votre mot de passe"
          />
        </div>

        {showMarketingOptIn && (
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.marketingOptIn}
              onChange={(e) => handleChange('marketingOptIn', e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded"
              style={{ accentColor: theme.primaryColor }}
            />
            <span className="text-sm" style={{ color: theme.textColor }}>{marketingOptInText}</span>
          </label>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
          style={{ backgroundColor: theme.primaryColor }}
        >
          {isLoading ? 'Création...' : 'Créer mon compte'}
        </button>

        {showLoginLink && (
          <p className="text-center text-sm" style={{ color: theme.textColor }}>
            <Link
              href={`/store/${subdomain}/login${redirectTo ? `?redirect=${redirectTo}` : ''}`}
              className="font-medium underline"
              style={{ color: theme.primaryColor }}
            >
              {loginLinkText}
            </Link>
          </p>
        )}
      </form>
    </div>
  )
}
