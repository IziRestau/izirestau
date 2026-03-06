'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'
import { toast } from 'sonner'
import { Key, Lock, Eye, EyeOff, Loader2, Smartphone, CheckCircle, Shield } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { TwoFactorSetupModal, TwoFactorDisableModal } from '@/components/shared/TwoFactorSetupModal'

interface SecuritySettingsProps {
  onUpdate: () => void
  primaryColor?: string
}

type SecurityTab = 'password' | '2fa'

const securityTabs = [
  { id: 'password' as const, label: 'Mot de passe', icon: Key },
  { id: '2fa' as const, label: 'Double authentification', icon: Smartphone },
]

export function SecuritySettings({ onUpdate, primaryColor = '#10b981' }: SecuritySettingsProps) {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<SecurityTab>('password')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [passwordData, setPasswordData] = useState({
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

  const passwordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const strength = passwordStrength(passwordData.newPassword)
  const strengthLabels = ['Tres faible', 'Faible', 'Moyen', 'Fort', 'Tres fort']
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500']

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      return api.restaurant.updatePassword(data)
    },
    onSuccess: () => {
      toast.success('Mot de passe mis a jour')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      onUpdate()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la mise a jour')
    },
  })

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caracteres')
      return
    }

    updatePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    })
  }

  const isLoading = updatePasswordMutation.isPending

  return (
    <div className="space-y-6">
      {/* Header with sub-tabs */}
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
                style={isActive ? { color: primaryColor } : undefined}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Password Tab */}
      {activeTab === 'password' && (
      <form onSubmit={handlePasswordSubmit} className="space-y-4">

        <div className="space-y-2">
          <Label htmlFor="currentPassword">Mot de passe actuel</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showCurrentPassword ? 'text' : 'password'}
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              placeholder="Votre mot de passe actuel"
              className="h-11 rounded-xl pr-10 focus:ring-2"
              style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
              required
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

        <div className="space-y-2">
          <Label htmlFor="newPassword">Nouveau mot de passe</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              placeholder="Minimum 8 caracteres"
              className="h-11 rounded-xl pr-10 focus:ring-2"
              style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              placeholder="Confirmez votre nouveau mot de passe"
              className="h-11 rounded-xl pr-10 focus:ring-2"
              style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
            className="h-11 px-6 rounded-xl text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Mise a jour...
              </>
            ) : (
              'Mettre a jour le mot de passe'
            )}
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
              )}
              style={twoFactorStatus?.data?.enabled ? { backgroundColor: `${primaryColor}20` } : undefined}
              >
                <Smartphone size={24} className={twoFactorStatus?.data?.enabled ? "text-emerald-600" : "text-gray-500"} style={twoFactorStatus?.data?.enabled ? { color: primaryColor } : undefined} />
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
                className="text-white"
                style={{ backgroundColor: primaryColor }}
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
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${primaryColor}20` }}>
                <span className="font-semibold text-sm" style={{ color: primaryColor }}>1</span>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">Installez une app</p>
              <p className="text-xs text-gray-500">Google Authenticator, Authy ou Microsoft Authenticator</p>
            </div>
            <div className="p-4 bg-white border border-gray-100 rounded-xl">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${primaryColor}20` }}>
                <span className="font-semibold text-sm" style={{ color: primaryColor }}>2</span>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">Scannez le QR code</p>
              <p className="text-xs text-gray-500">Liez votre compte a l'application</p>
            </div>
            <div className="p-4 bg-white border border-gray-100 rounded-xl">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${primaryColor}20` }}>
                <span className="font-semibold text-sm" style={{ color: primaryColor }}>3</span>
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
          <div className="p-4 rounded-xl" style={{ backgroundColor: `${primaryColor}10` }}>
            <p className="text-sm font-medium mb-1" style={{ color: primaryColor }}>Codes de secours</p>
            <p className="text-xs text-gray-600">Gardez-les en lieu sur en cas de perte de telephone</p>
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
        primaryColor={primaryColor}
      />

      {/* 2FA Disable Modal */}
      <TwoFactorDisableModal
        isOpen={show2FADisable}
        onClose={() => setShow2FADisable(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['2fa-status'] })
          onUpdate()
        }}
        primaryColor={primaryColor}
      />
    </div>
  )
}
