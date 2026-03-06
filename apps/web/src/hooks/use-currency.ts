'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'
import { formatCurrency, getCurrencySymbol, convertCurrency, type CurrencyCode } from '@/lib/utils'

export function useResellerCurrency() {
  const { accessToken, isAuthenticated, _hasHydrated } = useAuthStore()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['reseller-settings'],
    queryFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      const res = await api.reseller.getSettings()
      return res.data
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
    staleTime: 5 * 60 * 1000,
  })

  const currency = (data?.organization?.currency || 'XOF') as CurrencyCode

  const convert = (amount: number, from: CurrencyCode = 'EUR') => convertCurrency(amount, from, currency)
  const format = (amount: number, from?: CurrencyCode) => {
    const converted = from ? convert(amount, from) : amount
    return formatCurrency(converted, currency)
  }
  const symbol = getCurrencySymbol(currency)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['reseller-settings'] })
    queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'reseller-revenue' })
    queryClient.invalidateQueries({ queryKey: ['reseller-dashboard'] })
  }

  return {
    currency,
    convert,
    format,
    symbol,
    isLoading,
    invalidate,
  }
}
