'use client'

import { useRestaurantStore } from '@/stores/restaurant.store'
import { formatCurrency, getCurrencySymbol, convertCurrency, type CurrencyCode } from '@/lib/utils'

export function useRestaurantCurrency() {
  const { settings, organization } = useRestaurantStore()

  const currency = (settings?.currency || organization?.currency || 'XOF') as CurrencyCode

  const convert = (amount: number, from: CurrencyCode = 'EUR') => convertCurrency(amount, from, currency)
  
  const format = (amount: number, from?: CurrencyCode) => {
    const converted = from ? convert(amount, from) : amount
    return formatCurrency(converted, currency)
  }
  
  const symbol = getCurrencySymbol(currency)

  return {
    currency,
    convert,
    format,
    symbol,
  }
}
