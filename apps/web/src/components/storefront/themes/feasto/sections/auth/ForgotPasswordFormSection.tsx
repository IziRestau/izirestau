'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Mail, CheckCircle } from 'lucide-react'
import { api } from '@/lib/api-client'
import type { StoreThemeData } from '../../../_types'

interface ForgotPasswordFormSectionProps {
  theme: StoreThemeData
  subdomain: string
  sectionData?: Record<string, unknown>
}

export function ForgotPasswordFormSection({
  theme,
  subdomain,
  sectionData,
}: ForgotPasswordFormSectionProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const emailLabel = (s('emailLabel', 'Email') as string)
  const emailPlaceholder = (s('emailPlaceholder', 'votre@email.com') as string)
  const submitBtnText = (s('submitBtnText', 'Envoyer le lien') as string)
  const successTitle = (s('successTitle', 'Email envoyé !') as string)
  const successMessage = (s('successMessage', 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.') as string)
  const backToLoginText = (s('backToLoginText', 'Retour à la connexion') as string)

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  const inputStyle = {
    borderColor: `${theme.textColor}15`,
    color: theme.textColor,
    backgroundColor: theme.backgroundColor,
  } as React.CSSProperties

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await api.store.requestPasswordReset(subdomain, email)
      setIsSuccess(true)
    } catch (err: unknown) {
      setIsSuccess(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <section className="pb-12 sm:pb-16" style={{ backgroundColor: theme.backgroundColor }}>
        <div className="max-w-md mx-auto px-4 sm:px-6 text-center">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: `${theme.primaryColor}15` }}
          >
            <CheckCircle size={32} style={{ color: theme.primaryColor }} />
          </div>
          <h2 
            className="text-xl font-bold mb-2"
            style={{ color: theme.textColor }}
          >
            {successTitle}
          </h2>
          <p 
            className="text-sm opacity-60 mb-6"
            style={{ color: theme.textColor }}
          >
            {successMessage}
          </p>
          <Link
            href={`/store/${subdomain}/login`}
            className={`inline-block px-6 py-3 font-semibold text-white transition-all hover:opacity-90 ${btnClass}`}
            style={{ backgroundColor: theme.primaryColor }}
          >
            {backToLoginText}
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="pb-12 sm:pb-16" style={{ backgroundColor: theme.backgroundColor }}>
      <div className="max-w-md mx-auto px-4 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div 
              className="p-4 rounded-xl text-sm text-center"
              style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}
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
                className={`w-full pl-11 pr-4 py-3 border-2 focus:outline-none transition-colors ${btnClass}`}
                style={inputStyle}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3.5 font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 ${btnClass}`}
            style={{ backgroundColor: theme.primaryColor }}
          >
            {isSubmitting ? (
              <Loader2 size={20} className="animate-spin mx-auto" />
            ) : (
              submitBtnText
            )}
          </button>
        </form>
      </div>
    </section>
  )
}
