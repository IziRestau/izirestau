'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  CreditCard,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  Info,
} from 'lucide-react'

const monerooSchema = z.object({
  secretKey: z.string().min(1, 'Cle API requise'),
  webhookSecret: z.string().optional(),
})

type MonerooFormData = z.infer<typeof monerooSchema>

interface PaymentSettingsProps {
  onUpdate: () => void
}

export function PaymentSettings({ onUpdate }: PaymentSettingsProps) {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [showWebhookSecret, setShowWebhookSecret] = useState(false)

  const { data: monerooConfig, isLoading } = useQuery({
    queryKey: ['reseller-moneroo'],
    queryFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      const res = await api.reseller.moneroo.get()
      return res.data
    },
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
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
    if (monerooConfig) {
      reset({
        secretKey: monerooConfig.secretKey || '',
        webhookSecret: monerooConfig.webhookSecret || '',
      })
    }
  }, [monerooConfig, reset])

  const updateMutation = useMutation({
    mutationFn: async (data: MonerooFormData) => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      return api.reseller.moneroo.update(data)
    },
    onSuccess: () => {
      toast.success('Configuration Moneroo mise a jour')
      queryClient.invalidateQueries({ queryKey: ['reseller-moneroo'] })
      onUpdate()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la mise a jour')
    },
  })

  const testMutation = useMutation({
    mutationFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      return api.reseller.moneroo.test()
    },
    onSuccess: () => {
      toast.success('Connexion Moneroo reussie')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Echec de connexion')
    },
  })

  const onSubmit = (data: MonerooFormData) => {
    updateMutation.mutate(data)
  }

  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Configuration Moneroo
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Configurez votre compte Moneroo pour recevoir les paiements de vos restaurants
        </p>
      </div>

      {monerooConfig?.isConfigured ? (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span className="text-sm text-emerald-700 font-medium">Moneroo configure</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <span className="text-sm text-amber-700 font-medium">Moneroo non configure</span>
        </div>
      )}

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Comment obtenir vos cles API ?</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-600">
              <li>Connectez-vous a votre compte Moneroo</li>
              <li>Allez dans Developers &gt; API Keys</li>
              <li>Generez et copiez votre cle API</li>
              <li>Pour le webhook, allez dans Developers &gt; Webhooks</li>
            </ol>
            <a
              href="https://app.moneroo.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-blue-700 hover:text-blue-800 font-medium"
            >
              Ouvrir Moneroo
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="secretKey">Cle API</Label>
          <div className="relative">
            <Input
              id="secretKey"
              type={showSecretKey ? 'text' : 'password'}
              placeholder="pvk_..."
              {...register('secretKey')}
              className={errors.secretKey ? 'border-red-300 pr-10' : 'pr-10'}
            />
            <button
              type="button"
              onClick={() => setShowSecretKey(!showSecretKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.secretKey && (
            <p className="text-sm text-red-500">{errors.secretKey.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="webhookSecret">Secret du webhook (optionnel)</Label>
          <div className="relative">
            <Input
              id="webhookSecret"
              type={showWebhookSecret ? 'text' : 'password'}
              placeholder="whsec_..."
              {...register('webhookSecret')}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowWebhookSecret(!showWebhookSecret)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Utilisez pour verifier l'authenticite des webhooks Moneroo
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="submit"
            disabled={updateMutation.isPending || !isDirty}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Enregistrer'
            )}
          </Button>

          {monerooConfig?.isConfigured && (
            <Button
              type="button"
              variant="outline"
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending}
            >
              {testMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Test en cours...
                </>
              ) : (
                'Tester la connexion'
              )}
            </Button>
          )}
        </div>
      </form>

      <div className="border-t border-gray-100 pt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">URL du Webhook</h4>
        <p className="text-xs text-gray-500 mb-2">
          Configurez cette URL dans votre dashboard Moneroo pour recevoir les notifications de paiement
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <code className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-xs sm:text-sm text-gray-700 font-mono overflow-x-auto break-all">
            {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/moneroo/reseller` : '/api/webhooks/moneroo/reseller'}
          </code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/moneroo/reseller`)
              toast.success('URL copiee')
            }}
          >
            Copier
          </Button>
        </div>
      </div>
    </div>
  )
}
