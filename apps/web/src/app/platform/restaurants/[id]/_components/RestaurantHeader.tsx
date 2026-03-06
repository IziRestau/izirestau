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
  Store,
  Power,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react'
import type { RestaurantDetails } from './types'
import { statusLabels, statusColors, businessTypeLabels } from './types'

interface RestaurantHeaderProps {
  restaurant: RestaurantDetails
}

export function RestaurantHeader({ restaurant }: RestaurantHeaderProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()
  const [statusConfirm, setStatusConfirm] = useState<'activate' | 'suspend' | null>(null)

  const siteStatus = restaurant.site?.status || 'DRAFT'
  const isSuspended = siteStatus === 'SUSPENDED'

  const activateMutation = useMutation({
    mutationFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      await apiClient.post(`/platform/restaurants/${restaurant.id}/activate`)
    },
    onSuccess: () => {
      toast.success('Restaurant active')
      queryClient.invalidateQueries({ queryKey: ['platform-restaurant', restaurant.id] })
      setStatusConfirm(null)
    },
    onError: () => {
      toast.error('Erreur lors de l\'activation')
    },
  })

  const suspendMutation = useMutation({
    mutationFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      await apiClient.post(`/platform/restaurants/${restaurant.id}/suspend`)
    },
    onSuccess: () => {
      toast.success('Restaurant suspendu')
      queryClient.invalidateQueries({ queryKey: ['platform-restaurant', restaurant.id] })
      setStatusConfirm(null)
    },
    onError: () => {
      toast.error('Erreur lors de la suspension')
    },
  })

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <button
            onClick={() => router.push('/platform/restaurants')}
            className="flex items-center gap-1 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft size={16} />
            Restaurants
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {restaurant.logo ? (
              <img
                src={restaurant.logo}
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Store size={32} className="text-gray-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
                {restaurant.name}
              </h1>
              <span className={cn(
                'px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0',
                statusColors[siteStatus]
              )}>
                {statusLabels[siteStatus]}
              </span>
            </div>

            <p className="text-sm text-gray-500 mb-2">
              {businessTypeLabels[restaurant.businessType] || restaurant.businessType}
              {restaurant.city && ` - ${restaurant.city}`}
            </p>

            {restaurant.site && (
              <div className="flex items-center gap-2">
                <code className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                  {restaurant.site.subdomain}.iziresto.com
                </code>
                <a
                  href={`https://${restaurant.site.subdomain}.iziresto.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-700"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
            {isSuspended ? (
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
        title="Activer le restaurant"
        message="Etes-vous sur de vouloir activer ce restaurant ? Il sera accessible au public."
        confirmText="Activer"
        variant="info"
        isLoading={activateMutation.isPending}
      />

      <ConfirmModal
        isOpen={statusConfirm === 'suspend'}
        onClose={() => setStatusConfirm(null)}
        onConfirm={() => suspendMutation.mutate()}
        title="Suspendre le restaurant"
        message="Etes-vous sur de vouloir suspendre ce restaurant ? Il ne sera plus accessible au public."
        confirmText="Suspendre"
        variant="danger"
        isLoading={suspendMutation.isPending}
      />
    </>
  )
}
