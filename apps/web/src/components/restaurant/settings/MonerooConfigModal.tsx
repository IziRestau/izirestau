'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  Info,
  Trash2,
  Settings,
  Copy,
} from 'lucide-react'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { useIsMobile } from '@/hooks/use-media-query'

const monerooSchema = z.object({
  secretKey: z.string().min(1, 'Cle API requise'),
  webhookSecret: z.string().optional(),
})

type MonerooFormData = z.infer<typeof monerooSchema>

interface MonerooConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onConfigured?: () => void
  primaryColor?: string
}

export function MonerooConfigModal({ 
  isOpen, 
  onClose, 
  onConfigured,
  primaryColor = '#10b981' 
}: MonerooConfigModalProps) {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [showWebhookSecret, setShowWebhookSecret] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showReconfigure, setShowReconfigure] = useState(false)

  const { data: monerooConfig, isLoading } = useQuery({
    queryKey: ['restaurant-moneroo'],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.moneroo.get()
      return res.data
    },
    enabled: !!accessToken && isOpen,
    staleTime: 5 * 60 * 1000,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<MonerooFormData>({
    resolver: zodResolver(monerooSchema),
    defaultValues: {
      secretKey: '',
      webhookSecret: '',
    },
  })

  useEffect(() => {
    if (monerooConfig && showReconfigure) {
      reset({
        secretKey: monerooConfig.secretKey || '',
        webhookSecret: monerooConfig.webhookSecret || '',
      })
    }
  }, [monerooConfig, reset, showReconfigure])

  useEffect(() => {
    if (isOpen) {
      setShowReconfigure(false)
      setShowSecretKey(false)
      setShowWebhookSecret(false)
    }
  }, [isOpen])

  const updateMutation = useMutation({
    mutationFn: async (data: MonerooFormData) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.moneroo.update(data)
    },
    onSuccess: () => {
      toast.success('Configuration Moneroo enregistree')
      queryClient.invalidateQueries({ queryKey: ['restaurant-moneroo'] })
      setShowReconfigure(false)
      onConfigured?.()
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la configuration')
    },
  })

  const testMutation = useMutation({
    mutationFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.moneroo.test()
    },
    onSuccess: () => {
      toast.success('Connexion Moneroo reussie')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Echec de la connexion')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.moneroo.delete()
    },
    onSuccess: () => {
      toast.success('Configuration Moneroo supprimee')
      queryClient.invalidateQueries({ queryKey: ['restaurant-moneroo'] })
      reset({ secretKey: '', webhookSecret: '' })
      setConfirmDelete(false)
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la suppression')
    },
  })

  const onSubmit = (data: MonerooFormData) => {
    updateMutation.mutate(data)
  }

  const isConfigured = monerooConfig?.isConfigured
  const isMobile = useIsMobile()

  const webhookUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/webhooks/moneroo/restaurant` 
    : '/api/webhooks/moneroo/restaurant'

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl)
    toast.success('URL copiee')
  }

  const modalContent = (
    <div className="p-4 max-h-[70vh] overflow-y-auto">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: primaryColor }} />
        </div>
      ) : isConfigured && !showReconfigure ? (
        <div className="space-y-4">
          <div 
            className="flex items-center gap-3 p-3 rounded-xl border"
            style={{ backgroundColor: `${primaryColor}08`, borderColor: `${primaryColor}30` }}
          >
            <CheckCircle size={20} style={{ color: primaryColor }} className="flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: primaryColor }}>Moneroo configure</p>
              <p className="text-xs text-gray-500">Passerelle active</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Cle API</p>
              <code className="text-xs font-mono text-gray-800 break-all">{monerooConfig?.secretKey}</code>
            </div>
            {monerooConfig?.hasWebhookSecret && (
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Webhook Secret</p>
                <code className="text-xs font-mono text-gray-800 break-all">{monerooConfig?.webhookSecret}</code>
              </div>
            )}
          </div>

          <div className="p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">URL du Webhook</p>
              <button
                type="button"
                onClick={copyWebhookUrl}
                className="text-xs font-medium flex items-center gap-1 hover:opacity-70"
                style={{ color: primaryColor }}
              >
                <Copy size={12} />
                Copier
              </button>
            </div>
            <code className="text-xs font-mono text-gray-700 break-all block">{webhookUrl}</code>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending}
              className="h-10 rounded-xl text-sm"
            >
              {testMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <CheckCircle size={14} className="mr-1.5" />
                  Tester
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowReconfigure(true)}
              className="h-10 rounded-xl text-sm"
            >
              <Settings size={14} className="mr-1.5" />
              Modifier
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmDelete(true)}
            className="w-full h-10 rounded-xl text-sm text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 size={14} className="mr-1.5" />
            Supprimer
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!isConfigured && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Configuration requise</p>
                <p className="text-xs text-amber-600">Ajoutez vos cles API</p>
              </div>
            </div>
          )}

          <div 
            className="p-3 rounded-xl border"
            style={{ backgroundColor: `${primaryColor}05`, borderColor: `${primaryColor}20` }}
          >
            <div className="flex gap-3">
              <Info size={16} style={{ color: primaryColor }} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-800 mb-1">Obtenir vos cles API</p>
                <ol className="list-decimal list-inside space-y-0.5 text-xs text-gray-600">
                  <li>Connectez-vous a Moneroo</li>
                  <li>Developers &gt; API Keys</li>
                  <li>Copiez votre cle API</li>
                </ol>
                <a
                  href="https://app.moneroo.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs font-medium hover:underline"
                  style={{ color: primaryColor }}
                >
                  Ouvrir Moneroo
                  <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="secretKey" className="text-sm">Cle API</Label>
              <div className="relative mt-1.5">
                <Input
                  id="secretKey"
                  type={showSecretKey ? 'text' : 'password'}
                  placeholder="pvk_..."
                  {...register('secretKey')}
                  className={`h-10 rounded-xl pr-10 text-sm focus-visible:ring-2 focus-visible:ring-offset-0 ${errors.secretKey ? 'border-red-300' : ''}`}
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showSecretKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.secretKey?.message && (
                <p className="text-xs text-red-500 mt-1">{errors.secretKey.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="webhookSecret" className="text-sm">Secret Webhook (optionnel)</Label>
              <div className="relative mt-1.5">
                <Input
                  id="webhookSecret"
                  type={showWebhookSecret ? 'text' : 'password'}
                  placeholder="whsec_..."
                  {...register('webhookSecret')}
                  className="h-10 rounded-xl pr-10 text-sm focus-visible:ring-2 focus-visible:ring-offset-0"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
                <button
                  type="button"
                  onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showWebhookSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-700">URL du Webhook</p>
              <button
                type="button"
                onClick={copyWebhookUrl}
                className="text-xs font-medium flex items-center gap-1 hover:opacity-70"
                style={{ color: primaryColor }}
              >
                <Copy size={12} />
                Copier
              </button>
            </div>
            <code className="text-xs font-mono text-gray-600 break-all block">{webhookUrl}</code>
          </div>

          <div className="flex gap-2 pt-2">
            {showReconfigure && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowReconfigure(false)}
                className="flex-1 h-10 rounded-xl text-sm"
              >
                Annuler
              </Button>
            )}
            <Button
              type="submit"
              disabled={updateMutation.isPending || (!isDirty && showReconfigure)}
              className="flex-1 h-10 rounded-xl text-sm text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {updateMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                'Enregistrer'
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  )

  const headerContent = (
    <>
      <div className="flex items-center gap-3">
        <div 
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <Settings size={18} style={{ color: primaryColor }} />
        </div>
        <span className="text-base font-semibold">Configuration Moneroo</span>
      </div>
      <p className="text-sm text-gray-500 mt-1">Configurez votre passerelle de paiement</p>
    </>
  )

  return (
    <>
      {isMobile ? (
        <Drawer open={isOpen} onOpenChange={onClose}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle className="flex items-center gap-3">
                <div 
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <Settings size={18} style={{ color: primaryColor }} />
                </div>
                <span>Configuration Moneroo</span>
              </DrawerTitle>
              <DrawerDescription>
                Configurez votre passerelle de paiement
              </DrawerDescription>
            </DrawerHeader>
            {modalContent}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle className="flex items-center gap-3 text-base">
                <div 
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <Settings size={18} style={{ color: primaryColor }} />
                </div>
                <span>Configuration Moneroo</span>
              </DialogTitle>
              <DialogDescription className="text-sm mt-1">
                Configurez votre passerelle de paiement
              </DialogDescription>
            </DialogHeader>
            {modalContent}
          </DialogContent>
        </Dialog>
      )}

      <ConfirmModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Supprimer la configuration"
        message="Les paiements en ligne seront desactives."
        confirmText="Supprimer"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}
