'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, CheckCircle, XCircle, Lock } from 'lucide-react'
import { api } from '@/lib/api-client'
import type { ResetPasswordPageProps } from '../_types'

export function ResetPasswordPage({
  restaurant,
  theme,
  sections,
  subdomain,
  token,
}: ResetPasswordPageProps) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const sectionData = sections?.['reset-password-form'] || {}
  const title = (sectionData.title as string) || 'Réinitialiser votre mot de passe'
  const subtitle = (sectionData.subtitle as string) || 'Choisissez un nouveau mot de passe sécurisé'
  const successTitle = (sectionData.successTitle as string) || 'Mot de passe modifié'
  const successMessage = (sectionData.successMessage as string) || 'Votre mot de passe a été réinitialisé avec succès.'
  const submitBtnText = (sectionData.submitBtnText as string) || 'Réinitialiser le mot de passe'
  const invalidTokenTitle = (sectionData.invalidTokenTitle as string) || 'Lien invalide'
  const invalidTokenMessage = (sectionData.invalidTokenMessage as string) || 'Ce lien de réinitialisation est invalide ou a expiré.'

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

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    if (!token) {
      setError('Token de réinitialisation manquant')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await api.store.resetPassword(subdomain, token, password)
      if (res.success) {
        setIsSuccess(true)
        setTimeout(() => {
          router.push(`/store/${subdomain}/login`)
        }, 3000)
      } else {
        setError(res.message || 'Une erreur est survenue')
      }
    } catch {
      setError('Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!token) {
    return (
      <div 
        className="min-h-[60vh] flex items-center justify-center px-4"
        style={{ backgroundColor: theme.backgroundColor }}
      >
        <div className="text-center max-w-md">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: '#fef2f2' }}
          >
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 
            className="text-2xl font-bold mb-3"
            style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
          >
            {invalidTokenTitle}
          </h1>
          <p 
            className="text-sm mb-6"
            style={{ color: `${theme.textColor}80` }}
          >
            {invalidTokenMessage}
          </p>
          <Link
            href={`/store/${subdomain}/forgot-password`}
            className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white transition-all hover:opacity-90 ${btnClass}`}
            style={{ backgroundColor: theme.primaryColor }}
          >
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div 
        className="min-h-[60vh] flex items-center justify-center px-4"
        style={{ backgroundColor: theme.backgroundColor }}
      >
        <div className="text-center max-w-md">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: `${theme.primaryColor}15` }}
          >
            <CheckCircle className="w-8 h-8" style={{ color: theme.primaryColor }} />
          </div>
          <h1 
            className="text-2xl font-bold mb-3"
            style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
          >
            {successTitle}
          </h1>
          <p 
            className="text-sm mb-6"
            style={{ color: `${theme.textColor}80` }}
          >
            {successMessage}
          </p>
          <p className="text-xs" style={{ color: `${theme.textColor}60` }}>
            Redirection vers la connexion...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-[60vh] flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div 
            className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${theme.primaryColor}15` }}
          >
            <Lock className="w-7 h-7" style={{ color: theme.primaryColor }} />
          </div>
          <h1 
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
          >
            {title}
          </h1>
          <p 
            className="text-sm"
            style={{ color: `${theme.textColor}70` }}
          >
            {subtitle}
          </p>
        </div>

        <div 
          className="rounded-2xl border p-6 sm:p-8"
          style={{ borderColor: `${theme.textColor}10` }}
        >
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
              <label 
                className="text-xs font-medium mb-1.5 block" 
                style={{ color: theme.textColor }}
              >
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min. 8 caractères"
                  className={`w-full px-4 py-3 border text-sm focus:outline-none focus:ring-2 transition pr-12 ${btnClass}`}
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition"
                  style={{ color: theme.textColor }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label 
                className="text-xs font-medium mb-1.5 block" 
                style={{ color: theme.textColor }}
              >
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirmez votre mot de passe"
                className={`w-full px-4 py-3 border text-sm focus:outline-none focus:ring-2 transition ${btnClass}`}
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 ${btnClass}`}
              style={{ backgroundColor: theme.primaryColor }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Réinitialisation...
                </>
              ) : (
                submitBtnText
              )}
            </button>
          </form>
        </div>

        <p 
          className="text-center text-sm mt-6"
          style={{ color: `${theme.textColor}60` }}
        >
          <Link 
            href={`/store/${subdomain}/login`}
            className="hover:underline"
            style={{ color: theme.primaryColor }}
          >
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  )
}
