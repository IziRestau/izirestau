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

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    setIsSubmitting(true)

    try {
      await api.store.resetPassword(subdomain, token!, password)
      setIsSuccess(true)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la réinitialisation'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!token) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: theme.backgroundColor }}
      >
        <div className="text-center max-w-md">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: '#fef2f2' }}
          >
            <XCircle size={32} className="text-red-500" />
          </div>
          <h1 
            className="text-xl font-bold mb-2"
            style={{ color: theme.textColor }}
          >
            {invalidTokenTitle}
          </h1>
          <p 
            className="text-sm opacity-60 mb-6"
            style={{ color: theme.textColor }}
          >
            {invalidTokenMessage}
          </p>
          <Link
            href={`/store/${subdomain}/forgot-password`}
            className={`inline-block px-6 py-3 font-semibold text-white transition-all hover:opacity-90 ${btnClass}`}
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
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: theme.backgroundColor }}
      >
        <div className="text-center max-w-md">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: `${theme.primaryColor}15` }}
          >
            <CheckCircle size={32} style={{ color: theme.primaryColor }} />
          </div>
          <h1 
            className="text-xl font-bold mb-2"
            style={{ color: theme.textColor }}
          >
            {successTitle}
          </h1>
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
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <div className="w-full max-w-md">
        {restaurant.logo && (
          <div className="flex justify-center mb-8">
            <img
              src={restaurant.logo}
              alt={restaurant.name}
              className="h-16 w-auto object-contain"
            />
          </div>
        )}

        <div className="text-center mb-8">
          <h1
            className="text-2xl sm:text-3xl font-bold mb-2"
            style={{ 
              fontFamily: `'${theme.headingFont}', sans-serif`,
              color: theme.textColor 
            }}
          >
            {title}
          </h1>
          <p
            className="text-sm opacity-60"
            style={{ color: theme.textColor }}
          >
            {subtitle}
          </p>
        </div>

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
              Nouveau mot de passe
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
                required
                className={`w-full pl-11 pr-12 py-3 border-2 focus:outline-none transition-colors ${btnClass}`}
                style={inputStyle}
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
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: theme.textColor }}
            >
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <Lock 
                size={18} 
                className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40"
                style={{ color: theme.textColor }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
    </div>
  )
}
