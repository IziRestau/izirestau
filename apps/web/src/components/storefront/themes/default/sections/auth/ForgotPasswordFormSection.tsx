'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { StoreThemeData } from '../../../_types'
import { api } from '@/lib/api-client'
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { getIconComponent } from '@/components/shared/IconPicker'

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

  const enabled = sectionData?.enabled !== false
  if (!enabled) return null

  const layout = (sectionData?.layout as string) || 'minimal'
  const sideImage = sectionData?.sideImage as string | undefined
  const title = (sectionData?.title as string) || 'Mot de passe oublié ?'
  const subtitle = (sectionData?.subtitle as string) || 'Entrez votre email pour recevoir un lien de réinitialisation'
  const successTitle = (sectionData?.successTitle as string) || 'Email envoyé'
  const successMessage = (sectionData?.successMessage as string) || 'Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation.'
  const submitBtnText = (sectionData?.submitBtnText as string) || 'Envoyer le lien'
  const submitBtnIcon = sectionData?.submitBtnIcon as string | undefined
  const backToLoginText = (sectionData?.backToLoginText as string) || 'Retour à la connexion'

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
    setIsSubmitting(true)

    try {
      const res = await api.store.requestPasswordReset(subdomain, email)
      if (res.success) {
        setIsSuccess(true)
      } else {
        setError(res.message || 'Une erreur est survenue')
      }
    } catch {
      setError('Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  const SubmitIcon = submitBtnIcon ? getIconComponent(submitBtnIcon) : null

  const formContent = (
    <div 
      className="rounded-2xl border p-6 sm:p-8"
      style={{ 
        borderColor: `${theme.textColor}10`,
        backgroundColor: theme.backgroundColor,
      }}
    >
      {isSuccess ? (
        <div className="text-center py-8">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: `${theme.primaryColor}15` }}
          >
            <CheckCircle className="w-8 h-8" style={{ color: theme.primaryColor }} />
          </div>
          <h2 
            className="text-2xl font-bold mb-3"
            style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
          >
            {successTitle}
          </h2>
          <p 
            className="text-sm mb-6"
            style={{ color: `${theme.textColor}80` }}
          >
            {successMessage}
          </p>
          <Link
            href={`/store/${subdomain}/login`}
            className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 ${btnClass}`}
            style={{ backgroundColor: theme.primaryColor }}
          >
            <ArrowLeft className="w-4 h-4" />
            {backToLoginText}
          </Link>
        </div>
      ) : (
        <>
          <div className="text-center mb-8">
            <div 
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${theme.primaryColor}15` }}
            >
              <Mail className="w-7 h-7" style={{ color: theme.primaryColor }} />
            </div>
            <h2 
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
            >
              {title}
            </h2>
            <p 
              className="text-sm"
              style={{ color: `${theme.textColor}70` }}
            >
              {subtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div 
                className="p-3 rounded-xl text-sm border"
                style={{ 
                  backgroundColor: '#FEE2E2',
                  borderColor: '#FECACA',
                  color: '#DC2626',
                }}
              >
                {error}
              </div>
            )}

            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium mb-2"
                style={{ color: theme.textColor }}
              >
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent outline-none transition"
                style={inputStyle}
                placeholder="votre@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${btnClass}`}
              style={{ backgroundColor: theme.primaryColor }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  {SubmitIcon && <SubmitIcon className="w-4 h-4" />}
                  {submitBtnText}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href={`/store/${subdomain}/login`}
              className="inline-flex items-center gap-2 text-sm transition-colors hover:opacity-80"
              style={{ color: theme.primaryColor }}
            >
              <ArrowLeft className="w-4 h-4" />
              {backToLoginText}
            </Link>
          </div>
        </>
      )}
    </div>
  )

  if (layout === 'with-image' && sideImage) {
    return (
      <section 
        className="py-12 sm:py-16"
        style={{ backgroundColor: theme.backgroundColor }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="hidden lg:block">
              <img
                src={sideImage}
                alt=""
                className="w-full h-auto rounded-2xl object-cover"
                style={{ maxHeight: '500px' }}
              />
            </div>
            <div className="max-w-md mx-auto lg:mx-0 w-full">
              {formContent}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section 
      className="py-12 sm:py-16"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <div className="max-w-md mx-auto px-4 sm:px-6">
        {formContent}
      </div>
    </section>
  )
}
