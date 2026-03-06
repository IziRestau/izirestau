'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'
import { toast } from 'sonner'
import { Key, Eye, EyeOff, Loader2, Smartphone, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TwoFactorSetupModal, TwoFactorDisableModal } from '@/components/shared/TwoFactorSetupModal'

interface SecuritySettingsProps {
  onUpdate: () => void
}

type SecurityTab = 'password' | '2fa'

const securityTabs = [
  { id: 'password' as const, label: 'Mot de passe', icon: Key },
  { id: '2fa' as const, label: 'Double authentification', icon: Smartphone },
]

export function SecuritySettings({ onUpdate }: SecuritySettingsProps) {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<SecurityTab>('password')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [show2FADisable, setShow2FADisable] = useState(false)
  const [setupData, setSetupData] = useState<{ secret: string; qrCode: string } | null>(null)

  const { data: twoFactorStatus, isLoading: is2FALoading } = useQuery({
    queryKey: ['2fa-status'],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.twoFactor.getStatus()
    },
    enabled: !!accessToken,
  })

  const setup2FAMutation = useMutation({
    mutationFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.twoFactor.setup()
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        setSetupData({ secret: response.data.secret, qrCode: response.data.qrCode })
        setShow2FASetup(true)
      }
    },
    onError: () => {
      toast.error('Erreur lors de la configuration 2FA')
    },
  })

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      return api.reseller.updatePassword(data)
    },
    onSuccess: () => {
      toast.success('Mot de passe mis a jour')
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      onUpdate()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la mise a jour du mot de passe')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caracteres')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }

    updatePasswordMutation.mutate({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    })
  }

  const passwordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const strength = passwordStrength(formData.newPassword)
  const strengthLabels = ['Tres faible', 'Faible', 'Moyen', 'Fort', 'Tres fort']
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500']

  return (
    <div className="space-y-6">
      {/* Header with sub-tabs on the right */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Securite</h3>
          <p className="text-sm text-gray-500">Gerez la securite de votre compte</p>
        </div>
        
        {/* Sub-tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {securityTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Password Tab */}
      {activeTab === 'password' && (
      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe actuel</label>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              required
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              required
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          
          {/* Password Strength */}
          {formData.newPassword && (
            <div className="space-y-2">
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full ${
                      i < strength ? strengthColors[strength - 1] : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Force: {strengthLabels[strength - 1] || 'Tres faible'}
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
            <p className="text-xs text-red-500">Les mots de passe ne correspondent pas</p>
          )}
          {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
            <p className="text-xs text-emerald-500 flex items-center gap-1">
              <CheckCircle size={12} />
              Les mots de passe correspondent
            </p>
          )}
        </div>

        {/* Password Requirements */}
        <div className="p-4 bg-gray-50 rounded-xl space-y-2">
          <p className="text-sm font-medium text-gray-700">Exigences du mot de passe:</p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li className={formData.newPassword.length >= 8 ? 'text-emerald-600' : ''}>
              {formData.newPassword.length >= 8 ? <CheckCircle size={12} className="inline mr-1" /> : '•'} Au moins 8 caracteres
            </li>
            <li className={/[A-Z]/.test(formData.newPassword) ? 'text-emerald-600' : ''}>
              {/[A-Z]/.test(formData.newPassword) ? <CheckCircle size={12} className="inline mr-1" /> : '•'} Une lettre majuscule
            </li>
            <li className={/[0-9]/.test(formData.newPassword) ? 'text-emerald-600' : ''}>
              {/[0-9]/.test(formData.newPassword) ? <CheckCircle size={12} className="inline mr-1" /> : '•'} Un chiffre
            </li>
            <li className={/[^A-Za-z0-9]/.test(formData.newPassword) ? 'text-emerald-600' : ''}>
              {/[^A-Za-z0-9]/.test(formData.newPassword) ? <CheckCircle size={12} className="inline mr-1" /> : '•'} Un caractere special
            </li>
          </ul>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button type="submit" disabled={updatePasswordMutation.isPending}>
            {updatePasswordMutation.isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
            Mettre a jour
          </Button>
        </div>
      </form>
      )}

      {/* 2FA Tab */}
      {activeTab === '2fa' && (
      <div className="space-y-6">
        {/* 2FA Status Card */}
        <div className="p-5 bg-gray-50 rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                twoFactorStatus?.data?.enabled ? "bg-emerald-100" : "bg-gray-200"
              )}>
                <Smartphone size={24} className={twoFactorStatus?.data?.enabled ? "text-emerald-600" : "text-gray-500"} />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {twoFactorStatus?.data?.enabled ? '2FA active' : '2FA desactive'}
                </p>
                <p className="text-sm text-gray-500">
                  {twoFactorStatus?.data?.enabled 
                    ? 'Votre compte est protege'
                    : 'Ajoutez une couche de securite'}
                </p>
              </div>
            </div>
            {is2FALoading ? (
              <Loader2 size={20} className="animate-spin text-gray-400" />
            ) : twoFactorStatus?.data?.enabled ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShow2FADisable(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Desactiver 2FA
              </Button>
            ) : (
              <Button
                onClick={() => setup2FAMutation.mutate()}
                disabled={setup2FAMutation.isPending}
              >
                {setup2FAMutation.isPending && <Loader2 size={14} className="mr-2 animate-spin" />}
                Activer 2FA
              </Button>
            )}
          </div>
        </div>

        {/* How it works */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Comment ca fonctionne</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white border border-gray-100 rounded-xl">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
                <span className="text-emerald-600 font-semibold text-sm">1</span>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">Installez une app</p>
              <p className="text-xs text-gray-500">Google Authenticator, Authy ou Microsoft Authenticator</p>
            </div>
            <div className="p-4 bg-white border border-gray-100 rounded-xl">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
                <span className="text-emerald-600 font-semibold text-sm">2</span>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">Scannez le QR code</p>
              <p className="text-xs text-gray-500">Liez votre compte a l'application</p>
            </div>
            <div className="p-4 bg-white border border-gray-100 rounded-xl">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
                <span className="text-emerald-600 font-semibold text-sm">3</span>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">Entrez le code</p>
              <p className="text-xs text-gray-500">Validez avec le code a 6 chiffres</p>
            </div>
          </div>
        </div>

        {/* Security tips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-sm font-medium text-blue-900 mb-1">Protection renforcee</p>
            <p className="text-xs text-blue-700">La 2FA bloque 99% des attaques automatisees</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl">
            <p className="text-sm font-medium text-emerald-900 mb-1">Codes de secours</p>
            <p className="text-xs text-emerald-700">Gardez-les en lieu sur en cas de perte de telephone</p>
          </div>
        </div>
      </div>
      )}

      {/* 2FA Setup Modal */}
      <TwoFactorSetupModal
        isOpen={show2FASetup}
        onClose={() => {
          setShow2FASetup(false)
          setSetupData(null)
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['2fa-status'] })
          onUpdate()
        }}
        setupData={setupData}
      />

      {/* 2FA Disable Modal */}
      <TwoFactorDisableModal
        isOpen={show2FADisable}
        onClose={() => setShow2FADisable(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['2fa-status'] })
          onUpdate()
        }}
      />
    </div>
  )
}
