'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  Store,
  ExternalLink,
  Eye,
  MoreHorizontal,
  Play,
  Pause,
  Trash2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import type { ResellerDetails } from '../types'
import { siteStatusLabels, siteStatusColors } from '../types'
import { cn } from '@/lib/utils'

interface SitesTabProps {
  reseller: ResellerDetails
}

export function SitesTab({ reseller }: SitesTabProps) {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const sites = reseller.sites || []
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'suspend' | 'activate'; siteId: string } | null>(null)

  const activateMutation = useMutation({
    mutationFn: async (siteId: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return apiClient.post(`/platform/resellers/sites/${siteId}/activate`)
    },
    onSuccess: () => {
      toast.success('Site active')
      queryClient.invalidateQueries({ queryKey: ['platform-reseller', reseller.id] })
      setConfirmAction(null)
    },
    onError: () => toast.error('Erreur lors de l\'activation'),
  })

  const suspendMutation = useMutation({
    mutationFn: async (siteId: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return apiClient.post(`/platform/resellers/sites/${siteId}/suspend`)
    },
    onSuccess: () => {
      toast.success('Site suspendu')
      queryClient.invalidateQueries({ queryKey: ['platform-reseller', reseller.id] })
      setConfirmAction(null)
    },
    onError: () => toast.error('Erreur lors de la suspension'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (siteId: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return apiClient.delete(`/platform/resellers/sites/${siteId}`)
    },
    onSuccess: () => {
      toast.success('Site supprime')
      queryClient.invalidateQueries({ queryKey: ['platform-reseller', reseller.id] })
      setConfirmAction(null)
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  if (sites.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <Store size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun site</h3>
        <p className="text-gray-500">Ce revendeur n'a pas encore cree de site.</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-gray-900">Sites ({sites.length})</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {sites.map((site) => {
            const isSuspended = site.status === 'SUSPENDED'
            const isActive = site.status === 'ACTIVE'

            return (
              <div key={site.id} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {site.restaurant?.logo ? (
                      <img
                        src={site.restaurant.logo}
                        alt={site.restaurant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store size={22} className="text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-gray-900 truncate">
                        {site.restaurant?.name || site.subdomain}
                      </p>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0',
                        siteStatusColors[site.status] || 'bg-gray-100 text-gray-600'
                      )}>
                        {siteStatusLabels[site.status] || site.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="truncate">{site.subdomain}.iziresto.com</span>
                      {site.client && (
                        <>
                          <span className="text-gray-300">|</span>
                          <span className="truncate">{site.client.name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="hidden sm:block text-right text-sm text-gray-500 flex-shrink-0">
                    {format(new Date(site.createdAt), 'dd MMM yyyy', { locale: fr })}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => site.restaurant && router.push(`/platform/restaurants/${site.restaurant.id}`)}
                      disabled={!site.restaurant}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40"
                    >
                      <Eye size={16} className="text-gray-500" />
                    </button>
                    <a
                      href={`https://${site.subdomain}.iziresto.com`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ExternalLink size={16} className="text-gray-500" />
                    </a>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreHorizontal size={16} className="text-gray-500" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50">
                        {isSuspended ? (
                          <DropdownMenuItem
                            onClick={() => setConfirmAction({ type: 'activate', siteId: site.id })}
                            className="rounded-lg px-3 py-2.5 cursor-pointer text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50"
                          >
                            <Play size={16} className="mr-3" />
                            <span className="text-[13px]">Activer</span>
                          </DropdownMenuItem>
                        ) : isActive ? (
                          <DropdownMenuItem
                            onClick={() => setConfirmAction({ type: 'suspend', siteId: site.id })}
                            className="rounded-lg px-3 py-2.5 cursor-pointer text-amber-600 focus:text-amber-600 focus:bg-amber-50"
                          >
                            <Pause size={16} className="mr-3" />
                            <span className="text-[13px]">Suspendre</span>
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuSeparator className="my-1" />
                        <DropdownMenuItem
                          onClick={() => setConfirmAction({ type: 'delete', siteId: site.id })}
                          className="rounded-lg px-3 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                        >
                          <Trash2 size={16} className="mr-3" />
                          <span className="text-[13px]">Supprimer</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmAction?.type === 'activate'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && activateMutation.mutate(confirmAction.siteId)}
        title="Activer ce site ?"
        message="Le site sera de nouveau accessible au public."
        confirmText="Activer"
        variant="info"
        icon="play"
        isLoading={activateMutation.isPending}
      />

      <ConfirmModal
        isOpen={confirmAction?.type === 'suspend'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && suspendMutation.mutate(confirmAction.siteId)}
        title="Suspendre ce site ?"
        message="Le site ne sera plus accessible au public tant qu'il ne sera pas reactive."
        confirmText="Suspendre"
        variant="warning"
        icon="pause"
        isLoading={suspendMutation.isPending}
      />

      <ConfirmModal
        isOpen={confirmAction?.type === 'delete'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && deleteMutation.mutate(confirmAction.siteId)}
        title="Supprimer ce site ?"
        message="Cette action est irreversible. Le site et toutes ses donnees seront definitivement supprimes."
        confirmText="Supprimer"
        variant="danger"
        icon="trash"
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}
