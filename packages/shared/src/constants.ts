export const APP_NAME = 'IziResto'

export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
  maxLimit: 100,
}

export const USER_TYPES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  RESELLER: 'RESELLER',
  RESTAURANT: 'RESTAURANT',
  DRIVER: 'DRIVER',
  CUSTOMER: 'CUSTOMER',
} as const

export const RESELLER_ROLES = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  SALES: 'SALES',
  MEMBER: 'MEMBER',
} as const

export const RESTAURANT_ROLES = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  CASHIER: 'CASHIER',
  KITCHEN: 'KITCHEN',
} as const

export const SITE_STATUS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  EXPIRED: 'EXPIRED',
} as const

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  PICKED_UP: 'PICKED_UP',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const

export const LICENSE_STATUS = {
  TRIALING: 'TRIALING',
  ACTIVE: 'ACTIVE',
  PAST_DUE: 'PAST_DUE',
  CANCELLED: 'CANCELLED',
  UNPAID: 'UNPAID',
  PAUSED: 'PAUSED',
} as const

export const CURRENCIES = {
  EUR: { code: 'EUR', symbol: '€', locale: 'fr-FR' },
  USD: { code: 'USD', symbol: '$', locale: 'en-US' },
  XOF: { code: 'XOF', symbol: 'CFA', locale: 'fr-SN' },
} as const

export const SUPPORTED_LOCALES = ['fr', 'en'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]
