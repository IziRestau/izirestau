'use client'

import { useState } from 'react'
import { User, Mail, Phone, Lock, Eye, EyeOff, Loader2, Check } from 'lucide-react'
import type { StoreThemeData, StoreSettingsData } from '../../../_types'
import { useStorefrontAuthStore } from '@/stores/storefront-auth.store'

interface AccountProfileTabProps {
  theme: StoreThemeData
  settings: StoreSettingsData
  subdomain: string
  showLoyaltyPoints?: boolean
  showChangePassword?: boolean
}

export function AccountProfileTab({ 
  theme, 
  settings, 
  subdomain,
  showLoyaltyPoints = true,
  showChangePassword = true,
}: AccountProfileTabProps) {
  const { customer, updateCustomer, accessToken } = useStorefrontAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    firstName: customer?.firstName || '',
    lastName: customer?.lastName || '',
    phone: customer?.phone || '',
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)

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

  const handleSaveProfile = async () => {
    setIsSaving(true)
    setError('')
    setSuccessMessage('')

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
      const response = await fetch(`${API_URL}/store/${subdomain}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      if (data.success) {
        updateCustomer(formData)
        setSuccessMessage('Profil mis à jour avec succès')
        setIsEditing(false)
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        setError(data.message || 'Erreur lors de la mise à jour')
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    if (passwordData.newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setIsSaving(true)
    setError('')
    setSuccessMessage('')

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
      const response = await fetch(`${API_URL}/store/${subdomain}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setSuccessMessage('Mot de passe modifié avec succès')
        setShowPasswordForm(false)
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        setError(data.message || 'Erreur lors du changement de mot de passe')
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setIsSaving(false)
    }
  }

  if (!customer) return null

  return (
    <div className="space-y-6">
      {successMessage && (
        <div 
          className="flex items-center gap-2 p-4 rounded-xl text-sm"
          style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}
        >
          <Check size={18} />
          {successMessage}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl text-sm bg-red-50 text-red-600 border border-red-200">
          {error}
        </div>
      )}

      <div 
        className="rounded-2xl border p-6"
        style={{ borderColor: `${theme.textColor}10` }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 
            className="text-lg font-semibold"
            style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
          >
            Informations personnelles
          </h3>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className={`px-4 py-2 text-sm font-medium border transition-colors hover:opacity-80 ${btnClass}`}
              style={{ borderColor: `${theme.textColor}20`, color: theme.textColor }}
            >
              Modifier
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: theme.textColor }}>
                  Prénom
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className={`w-full px-4 py-3 border text-sm ${btnClass}`}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: theme.textColor }}>
                  Nom
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className={`w-full px-4 py-3 border text-sm ${btnClass}`}
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: theme.textColor }}>
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-4 py-3 border text-sm ${btnClass}`}
                style={inputStyle}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50 ${btnClass}`}
                style={{ backgroundColor: theme.primaryColor }}
              >
                {isSaving && <Loader2 size={16} className="animate-spin" />}
                Enregistrer
              </button>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setFormData({
                    firstName: customer.firstName,
                    lastName: customer.lastName,
                    phone: customer.phone || '',
                  })
                }}
                className={`px-5 py-2.5 text-sm font-medium border transition-colors hover:opacity-80 ${btnClass}`}
                style={{ borderColor: `${theme.textColor}20`, color: theme.textColor }}
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: `${theme.textColor}05` }}>
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold"
                style={{ backgroundColor: theme.primaryColor }}
              >
                {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
              </div>
              <div>
                <p className="font-semibold" style={{ color: theme.textColor }}>
                  {customer.firstName} {customer.lastName}
                </p>
                <p className="text-sm opacity-60" style={{ color: theme.textColor }}>
                  Client depuis {new Date().getFullYear()}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: `${theme.textColor}05` }}>
                <Mail size={18} style={{ color: theme.primaryColor }} />
                <div>
                  <p className="text-xs opacity-60" style={{ color: theme.textColor }}>Email</p>
                  <p className="text-sm font-medium" style={{ color: theme.textColor }}>{customer.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: `${theme.textColor}05` }}>
                <Phone size={18} style={{ color: theme.primaryColor }} />
                <div>
                  <p className="text-xs opacity-60" style={{ color: theme.textColor }}>Téléphone</p>
                  <p className="text-sm font-medium" style={{ color: theme.textColor }}>
                    {customer.phone || 'Non renseigné'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showChangePassword && (
        <div 
          className="rounded-2xl border p-6"
          style={{ borderColor: `${theme.textColor}10` }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 
              className="text-lg font-semibold"
              style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
            >
              Sécurité
            </h3>
          </div>

          {showPasswordForm ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: theme.textColor }}>
                Mot de passe actuel
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className={`w-full px-4 py-3 border text-sm ${btnClass}`}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: theme.textColor }}>
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className={`w-full px-4 py-3 border text-sm pr-12 ${btnClass}`}
                  style={inputStyle}
                  placeholder="Min. 8 caractères"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
                  style={{ color: theme.textColor }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: theme.textColor }}>
                Confirmer le nouveau mot de passe
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className={`w-full px-4 py-3 border text-sm ${btnClass}`}
                style={inputStyle}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleChangePassword}
                disabled={isSaving}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50 ${btnClass}`}
                style={{ backgroundColor: theme.primaryColor }}
              >
                {isSaving && <Loader2 size={16} className="animate-spin" />}
                Changer le mot de passe
              </button>
              <button
                onClick={() => {
                  setShowPasswordForm(false)
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                  setError('')
                }}
                className={`px-5 py-2.5 text-sm font-medium border transition-colors hover:opacity-80 ${btnClass}`}
                style={{ borderColor: `${theme.textColor}20`, color: theme.textColor }}
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowPasswordForm(true)}
            className="flex items-center gap-3 p-4 rounded-xl w-full text-left hover:opacity-80 transition-colors"
            style={{ backgroundColor: `${theme.textColor}05` }}
          >
            <Lock size={20} style={{ color: theme.primaryColor }} />
            <div>
              <p className="text-sm font-medium" style={{ color: theme.textColor }}>Modifier le mot de passe</p>
              <p className="text-xs opacity-60" style={{ color: theme.textColor }}>Dernière modification inconnue</p>
            </div>
          </button>
        )}
        </div>
      )}
    </div>
  )
}
