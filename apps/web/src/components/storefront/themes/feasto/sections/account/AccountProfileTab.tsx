'use client'

import { useState } from 'react'
import { User, Mail, Phone, Lock, Eye, EyeOff, Loader2, Check, Edit3, Save } from 'lucide-react'
import { useStorefrontAuthStore } from '@/stores/storefront-auth.store'
import type { StoreThemeData } from '../../../_types'

interface AccountProfileTabProps {
  theme: StoreThemeData
  subdomain: string
}

export function AccountProfileTab({
  theme,
  subdomain,
}: AccountProfileTabProps) {
  const { customer, updateCustomer, accessToken } = useStorefrontAuthStore()
  const [firstName, setFirstName] = useState(customer?.firstName || '')
  const [lastName, setLastName] = useState(customer?.lastName || '')
  const [email, setEmail] = useState(customer?.email || '')
  const [phone, setPhone] = useState(customer?.phone || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setIsSubmitting(true)

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
      const response = await fetch(`${API_URL}/store/${subdomain}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ firstName, lastName, phone }),
      })
      const data = await response.json()
      if (data.success) {
        updateCustomer({ firstName, lastName, phone })
        setMessage({ type: 'success', text: 'Profil mis à jour avec succès' })
      } else {
        throw new Error(data.message || 'Erreur lors de la mise à jour')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour'
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères' })
      return
    }

    setIsChangingPassword(true)

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
      const response = await fetch(`${API_URL}/store/${subdomain}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await response.json()
      if (data.success) {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setMessage({ type: 'success', text: 'Mot de passe modifié avec succès' })
      } else {
        throw new Error(data.message || 'Erreur lors du changement de mot de passe')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du changement de mot de passe'
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="space-y-8">
      {message && (
        <div 
          className={`p-4 text-sm text-center ${btnClass}`}
          style={{ 
            backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: message.type === 'success' ? '#16a34a' : '#dc2626'
          }}
        >
          {message.text}
        </div>
      )}

      {/* Profile Form */}
      <div 
        className={`p-6 ${btnClass}`}
        style={{ backgroundColor: `${theme.textColor}04`, border: '1px solid rgba(255,255,255,0.12)' }}
      >
        <h3 
          className="text-lg font-semibold mb-4"
          style={{ color: theme.textColor }}
        >
          Informations personnelles
        </h3>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: theme.textColor }}
              >
                Prénom
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className={`w-full px-4 py-3 border-2 focus:outline-none transition-colors ${btnClass}`}
                style={inputStyle}
              />
            </div>
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: theme.textColor }}
              >
                Nom
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className={`w-full px-4 py-3 border-2 focus:outline-none transition-colors ${btnClass}`}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: theme.textColor }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className={`w-full px-4 py-3 border-2 opacity-50 cursor-not-allowed ${btnClass}`}
              style={inputStyle}
            />
            <p className="text-xs opacity-50 mt-1" style={{ color: theme.textColor }}>
              L'email ne peut pas être modifié
            </p>
          </div>

          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: theme.textColor }}
            >
              Téléphone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`w-full px-4 py-3 border-2 focus:outline-none transition-colors ${btnClass}`}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex items-center justify-center gap-2 w-full py-3 font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 ${btnClass}`}
            style={{ backgroundColor: theme.primaryColor }}
          >
            {isSubmitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            Enregistrer
          </button>
        </form>
      </div>

      {/* Password Form */}
      <div 
        className={`p-6 ${btnClass}`}
        style={{ backgroundColor: `${theme.textColor}04`, border: '1px solid rgba(255,255,255,0.12)' }}
      >
        <h3 
          className="text-lg font-semibold mb-4"
          style={{ color: theme.textColor }}
        >
          Changer le mot de passe
        </h3>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: theme.textColor }}
            >
              Mot de passe actuel
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className={`w-full px-4 py-3 pr-12 border-2 focus:outline-none transition-colors ${btnClass}`}
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70"
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
              Nouveau mot de passe
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className={`w-full px-4 py-3 border-2 focus:outline-none transition-colors ${btnClass}`}
              style={inputStyle}
            />
          </div>

          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: theme.textColor }}
            >
              Confirmer le nouveau mot de passe
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={`w-full px-4 py-3 border-2 focus:outline-none transition-colors ${btnClass}`}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={isChangingPassword}
            className={`flex items-center justify-center gap-2 w-full py-3 font-semibold transition-all hover:opacity-90 disabled:opacity-50 ${btnClass}`}
            style={{ 
              backgroundColor: `${theme.textColor}08`,
              color: theme.textColor 
            }}
          >
            {isChangingPassword ? (
              <Loader2 size={18} className="animate-spin" />
            ) : null}
            Changer le mot de passe
          </button>
        </form>
      </div>
    </div>
  )
}
