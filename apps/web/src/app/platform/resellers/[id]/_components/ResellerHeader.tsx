'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Building2,
  Power,
  Mail,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react'
import type { ResellerDetails } from './types'
import { statusLabels, statusColors } from './types'

interface ResellerHeaderProps {
  reseller: ResellerDetails
}

export function ResellerHeader({ reseller }: ResellerHeaderProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()
  const [statusConfirm, setStatusConfirm] = useState<'activate' | 'suspend' | 'cancel' | null>(null)
  const [resendConfirm, setResendConfirm] = useState(false)

  const isSuspended = reseller.status === 'SUSPENDED'
  const isPending = reseller.status === 'PENDING'
  const isCancelled = reseller.status === 'CANCELLED'

  const activateMutation = useMutation({
    mutationFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      await apiClient.post(`/platform/resellers/${reseller.id}/activate`)
    },
    onSuccess: () => {
      toast.success('Revendeur active')
      queryClient.invalidateQueries({ queryKey: ['platform-reseller', reseller.id] })
      setStatusConfirm(null)
    },
    onError: () => {
      toast.error('Erreur lors de l\'activation')
    },
  })

  const suspendMutation = useMutation({
    mutationFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      await apiClient.post(`/platform/resellers/${reseller.id}/suspend`)
    },
    onSuccess: () => {
      toast.success('Revendeur suspendu')
      queryClient.invalidateQueries({ queryKey: ['platform-reseller', reseller.id] })
      setStatusConfirm(null)
    },
    onError: () => {
      toast.error('Erreur lors de la suspension')
    },
  })

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      await apiClient.post(`/platform/resellers/${reseller.id}/cancel`)
    },
    onSuccess: () => {
      toast.success('Revendeur annule')
      queryClient.invalidateQueries({ queryKey: ['platform-reseller', reseller.id] })
      setStatusConfirm(null)
    },
    onError: () => {
      toast.error('Erreur lors de l\'annulation')
    },
  })

  const resendInviteMutation = useMutation({
    mutationFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      await apiClient.post(`/platform/resellers/${reseller.id}/resend-invite`)
    },
    onSuccess: () => {
      toast.success('Invitation renvoyee')
      setResendConfirm(false)
    },
    onError: () => {
      toast.error('Erreur lors de l\'envoi')
    },
  })

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <button
            onClick={() => router.push('/platform/resellers')}
            className="flex items-center gap-1 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft size={16} />
            Revendeurs
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {reseller.logo ? (
              <img
                src={reseller.logo}
                alt={reseller.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 size={32} className="text-gray-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
                {reseller.name}
              </h1>
              <span className={cn(
                'px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0',
                statusColors[reseller.status]
              )}>
                {statusLabels[reseller.status]}
              </span>
            </div>

            <p className="text-sm text-gray-500 mb-2">
              {reseller.slug}
              {reseller.customDomain && ` • ${reseller.customDomain}`}
            </p>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Mail size={14} />
                {reseller.email}
              </span>
              {reseller.phone && (
                <span>{reseller.phone}</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
            {isPending && (
              <Button
                variant="outline"
                onClick={() => setResendConfirm(true)}
                className="gap-2"
              >
                <RefreshCw size={16} />
                Renvoyer invitation
              </Button>
            )}

            {(isSuspended || isCancelled) ? (
              <Button
                variant="outline"
                onClick={() => setStatusConfirm('activate')}
                className="gap-2 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
              >
                <Power size={16} />
                Activer
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setStatusConfirm('suspend')}
                className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <Power size={16} />
                Suspendre
              </Button>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={statusConfirm === 'activate'}
        onClose={() => setStatusConfirm(null)}
        onConfirm={() => activateMutation.mutate()}
        title="Activer le revendeur"
        message="Etes-vous sur de vouloir activer ce revendeur ? Il pourra acceder a son compte."
        confirmText="Activer"
        variant="info"
        isLoading={activateMutation.isPending}
      />

      <ConfirmModal
        isOpen={statusConfirm === 'suspend'}
        onClose={() => setStatusConfirm(null)}
        onConfirm={() => suspendMutation.mutate()}
        title="Suspendre le revendeur"
        message="Etes-vous sur de vouloir suspendre ce revendeur ? Il ne pourra plus acceder a son compte."
        confirmText="Suspendre"
        variant="danger"
        isLoading={suspendMutation.isPending}
      />

      <ConfirmModal
        isOpen={resendConfirm}
        onClose={() => setResendConfirm(false)}
        onConfirm={() => resendInviteMutation.mutate()}
        title="Renvoyer l'invitation"
        message="Un nouvel email d'invitation sera envoye au proprietaire."
        confirmText="Envoyer"
        variant="info"
        isLoading={resendInviteMutation.isPending}
      />
    </>
  )
}
