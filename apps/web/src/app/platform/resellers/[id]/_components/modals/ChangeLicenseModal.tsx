'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, CreditCard, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'
import { cn } from '@/lib/utils'

interface LicensePlan {
  id: string
  name: string
  slug: string
  maxSites: number
  priceMonthly: number
  priceYearly: number
  currency: string
  features: string[]
  isActive: boolean
}

interface ChangeLicenseModalProps {
  isOpen: boolean
  onClose: () => void
  resellerId: string
  currentPlanId?: string
}

export function ChangeLicenseModal({ isOpen, onClose, resellerId, currentPlanId }: ChangeLicenseModalProps) {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['license-plans'],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await apiClient.get<LicensePlan[]>('/platform/licenses/plans')
      return res.data
    },
    enabled: !!accessToken && isOpen,
  })

  const mutation = useMutation({
    mutationFn: async (planId: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await apiClient.put(`/platform/resellers/${resellerId}/license`, { planId })
      return res.data
    },
    onSuccess: () => {
      toast.success('Licence mise a jour')
      queryClient.invalidateQueries({ queryKey: ['platform-reseller', resellerId] })
      onClose()
    },
    onError: () => {
      toast.error('Erreur lors de la mise a jour de la licence')
    },
  })

  const handleSubmit = () => {
    if (selectedPlanId) {
      mutation.mutate(selectedPlanId)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 rounded-2xl overflow-hidden max-h-[90vh]">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100">
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Changer de licence
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {plansLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans?.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  disabled={plan.id === currentPlanId}
                  className={cn(
                    'relative p-4 rounded-xl border-2 text-left transition-all',
                    plan.id === currentPlanId
                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                      : selectedPlanId === plan.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  {plan.id === currentPlanId && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">
                      Actuel
                    </span>
                  )}
                  {selectedPlanId === plan.id && plan.id !== currentPlanId && (
                    <span className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </span>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      selectedPlanId === plan.id ? 'bg-blue-100' : 'bg-gray-100'
                    )}>
                      <CreditCard size={20} className={selectedPlanId === plan.id ? 'text-blue-600' : 'text-gray-600'} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                      <p className="text-xs text-gray-500">{plan.maxSites} sites max</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: plan.currency || 'EUR' }).format(Number(plan.priceMonthly))}
                    <span className="text-sm font-normal text-gray-500">/mois</span>
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 pt-4 border-t border-gray-100 bg-gray-50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
            className="flex-1 h-11 rounded-xl"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending || !selectedPlanId || selectedPlanId === currentPlanId}
            className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Mise a jour...
              </>
            ) : (
              'Changer de licence'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
