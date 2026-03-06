'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'
import { toast } from 'sonner'
import { Smartphone, Copy, Loader2, Key, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface TwoFactorSetupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  setupData: { secret: string; qrCode: string } | null
  primaryColor?: string
}

export function TwoFactorSetupModal({ isOpen, onClose, onSuccess, setupData, primaryColor = '#10b981' }: TwoFactorSetupModalProps) {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const [verificationCode, setVerificationCode] = useState('')
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[]>([])

  const verify2FAMutation = useMutation({
    mutationFn: async (code: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.twoFactor.verify(code)
    },
    onSuccess: (data) => {
      if (data.data?.backupCodes) {
        setBackupCodes(data.data.backupCodes)
        setShowBackupCodes(true)
      }
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] })
      toast.success('2FA active avec succes')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Code invalide')
    },
  })

  const handleVerify = () => {
    if (verificationCode.length === 6) {
      verify2FAMutation.mutate(verificationCode)
    }
  }

  const handleClose = () => {
    setVerificationCode('')
    setShowBackupCodes(false)
    setBackupCodes([])
    onClose()
    if (showBackupCodes && onSuccess) {
      onSuccess()
    }
  }

  const handleBackupCodesSaved = () => {
    handleClose()
  }

  if (showBackupCodes) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key size={20} style={{ color: primaryColor }} />
              Codes de secours
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-sm text-amber-800">
                Conservez ces codes en lieu sur. Ils vous permettront de vous connecter si vous perdez l'acces a votre application d'authentification.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <div key={index} className="px-3 py-2 bg-gray-50 rounded-lg font-mono text-sm text-center">
                  {code}
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                navigator.clipboard.writeText(backupCodes.join('\n'))
                toast.success('Codes copies')
              }}
            >
              <Copy size={14} className="mr-2" />
              Copier tous les codes
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={handleBackupCodesSaved} className="w-full sm:w-auto text-white" style={{ backgroundColor: primaryColor }}>
              J'ai sauvegarde mes codes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone size={20} style={{ color: primaryColor }} />
            Configurer l'authentification 2FA
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Scannez ce QR code avec votre application d'authentification (Google Authenticator, Authy, etc.)
          </p>
          {setupData?.qrCode && (
            <div className="flex justify-center p-4 bg-white rounded-xl border">
              <img src={setupData.qrCode} alt="QR Code 2FA" className="w-48 h-48" />
            </div>
          )}
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">Cle secrete (si vous ne pouvez pas scanner) :</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono bg-white px-2 py-1 rounded border break-all">
                {setupData?.secret}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(setupData?.secret || '')
                  toast.success('Cle copiee')
                }}
              >
                <Copy size={14} />
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entrez le code a 6 chiffres
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
              maxLength={6}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            className="w-full sm:w-auto"
            style={{ borderColor: primaryColor, color: primaryColor }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${primaryColor}15` }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleVerify}
            disabled={verificationCode.length !== 6 || verify2FAMutation.isPending}
            className="w-full sm:w-auto text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {verify2FAMutation.isPending && <Loader2 size={14} className="mr-2 animate-spin" />}
            Verifier et activer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface TwoFactorDisableModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  primaryColor?: string
}

export function TwoFactorDisableModal({ isOpen, onClose, onSuccess, primaryColor = '#10b981' }: TwoFactorDisableModalProps) {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')

  const disable2FAMutation = useMutation({
    mutationFn: async ({ code, password }: { code: string; password: string }) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.twoFactor.disable(code, password)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] })
      toast.success('2FA desactive')
      handleClose()
      onSuccess?.()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la desactivation')
    },
  })

  const handleClose = () => {
    setCode('')
    setPassword('')
    onClose()
  }

  const handleDisable = () => {
    if (code.length === 6 && password) {
      disable2FAMutation.mutate({ code, password })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Shield size={20} />
            Desactiver 2FA
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 bg-red-50 rounded-xl border border-red-100">
            <p className="text-sm text-red-800">
              La desactivation de la 2FA reduira la securite de votre compte. Etes-vous sur de vouloir continuer ?
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code 2FA actuel
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300"
              maxLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300"
            />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            className="w-full sm:w-auto"
            style={{ borderColor: primaryColor, color: primaryColor }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${primaryColor}15` }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleDisable}
            disabled={code.length !== 6 || !password || disable2FAMutation.isPending}
            className="w-full sm:w-auto"
          >
            {disable2FAMutation.isPending && <Loader2 size={14} className="mr-2 animate-spin" />}
            Desactiver 2FA
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
