import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type CurrencyCode = 'XOF' | 'EUR' | 'USD'

const CURRENCY_CONFIG: Record<CurrencyCode, { symbol: string; locale: string; position: 'before' | 'after'; decimals: number }> = {
  XOF: { symbol: 'FCFA', locale: 'fr-FR', position: 'after', decimals: 0 },
  EUR: { symbol: '€', locale: 'fr-FR', position: 'after', decimals: 2 },
  USD: { symbol: '$', locale: 'en-US', position: 'before', decimals: 2 },
}

const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  EUR: 1,
  XOF: 655.957,
  USD: 1.08,
}

export function convertCurrency(amount: number, from: CurrencyCode, to: CurrencyCode): number {
  if (from === to) return amount
  const amountInEur = amount / EXCHANGE_RATES[from]
  return amountInEur * EXCHANGE_RATES[to]
}

export function formatCurrency(amount: number, currency: CurrencyCode = 'XOF'): string {
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.XOF
  
  const formatted = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount)

  if (config.position === 'before') {
    return `${config.symbol}${formatted}`
  }
  return `${formatted} ${config.symbol}`
}

export function getCurrencySymbol(currency: CurrencyCode = 'XOF'): string {
  return CURRENCY_CONFIG[currency]?.symbol || 'FCFA'
}

export function hexToRgba(hex: string, alpha: number = 1): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return `rgba(59, 130, 246, ${alpha})`
  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
