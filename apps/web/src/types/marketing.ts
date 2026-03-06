// Types pour le module Marketing

export type DiscountType = 'PERCENTAGE' | 'FIXED' | 'FREE_ITEM'

export type PromotionType = 'DISCOUNT' | 'HAPPY_HOUR' | 'BUNDLE' | 'BOGO' | 'FREE_DELIVERY'

// ============================================
// COUPONS
// ============================================

export interface Coupon {
  id: string
  code: string
  description: string | null
  discountType: DiscountType
  discountValue: number
  minOrderAmount: number | null
  maxDiscount: number | null
  maxUses: number | null
  maxUsesPerCustomer: number
  usedCount: number
  appliesToAll: boolean
  productIds: string[]
  categoryIds: string[]
  startDate: string
  endDate: string | null
  isActive: boolean
  ordersCount: number
  createdAt: string
  updatedAt: string
}

export interface CouponDetail extends Coupon {
  recentOrders: Array<{
    id: string
    orderNumber: string
    total: number
    discount: number
    createdAt: string
    customer: {
      id: string
      firstName: string
      lastName: string
    } | null
  }>
}

export interface CreateCouponInput {
  code: string
  description?: string | null
  discountType: DiscountType
  discountValue: number
  minOrderAmount?: number | null
  maxDiscount?: number | null
  maxUses?: number | null
  maxUsesPerCustomer?: number
  appliesToAll?: boolean
  productIds?: string[]
  categoryIds?: string[]
  startDate?: string
  endDate?: string | null
  isActive?: boolean
}

export type UpdateCouponInput = Partial<CreateCouponInput>

// ============================================
// PROMOTIONS
// ============================================

export interface Promotion {
  id: string
  name: string
  description: string | null
  type: PromotionType | string
  discountType: DiscountType | string
  discountValue: number
  minOrderAmount: number | null
  maxDiscount: number | null
  appliesToAll: boolean
  productIds: string[]
  categoryIds: string[]
  startDate: string
  endDate: string | null
  activeDays: number[]
  activeFrom: string | null
  activeTo: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreatePromotionInput {
  name: string
  description?: string | null
  type: PromotionType
  discountType: DiscountType
  discountValue: number
  minOrderAmount?: number | null
  maxDiscount?: number | null
  appliesToAll?: boolean
  productIds?: string[]
  categoryIds?: string[]
  startDate: string
  endDate?: string | null
  activeDays?: number[]
  activeFrom?: string | null
  activeTo?: string | null
  isActive?: boolean
}

export type UpdatePromotionInput = Partial<CreatePromotionInput>

// ============================================
// REVIEWS (AVIS)
// ============================================

export interface Review {
  id: string
  rating: number
  title: string | null
  comment: string | null
  foodRating: number | null
  serviceRating: number | null
  deliveryRating: number | null
  response: string | null
  respondedAt: string | null
  respondedBy?: string | null
  isPublished: boolean
  isVerified: boolean
  customer: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
  orderId: string | null
  createdAt: string
  updatedAt?: string
}

export interface ReviewStats {
  avgRating: number | null
  distribution: Array<{
    rating: number
    count: number
  }>
}

export interface UpdateReviewInput {
  response?: string | null
  isPublished?: boolean
}

// ============================================
// LOYALTY (FIDÉLITÉ)
// ============================================

export interface LoyaltyStats {
  totalCustomers: number
  customersWithPoints: number
  totalPoints: number
  avgPoints: number
  topCustomers: Array<{
    id: string
    firstName: string
    lastName: string
    email: string
    loyaltyPoints: number
    totalOrders: number
    totalSpent: number
  }>
}

// ============================================
// MARKETING STATS
// ============================================

export interface MarketingStats {
  coupons: {
    total: number
    active: number
    totalUsed: number
  }
  promotions: {
    total: number
    active: number
  }
  reviews: {
    total: number
    avgRating: number | null
    thisMonth: number
  }
  loyalty: {
    customersWithPoints: number
  }
  orders: {
    withCoupon: number
  }
}

// ============================================
// FILTERS
// ============================================

export interface CouponFilters {
  search?: string
  status?: 'all' | 'active' | 'inactive'
  page?: number
  limit?: number
}

export interface PromotionFilters {
  search?: string
  status?: 'all' | 'active' | 'inactive'
  type?: PromotionType | 'all'
  page?: number
  limit?: number
}

export interface ReviewFilters {
  search?: string
  rating?: number
  status?: 'all' | 'published' | 'hidden' | 'pending'
  page?: number
  limit?: number
}

// ============================================
// LABELS & CONSTANTS
// ============================================

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  PERCENTAGE: 'Pourcentage',
  FIXED: 'Montant fixe',
  FREE_ITEM: 'Produit offert',
}

export const PROMOTION_TYPE_LABELS: Record<PromotionType, string> = {
  DISCOUNT: 'Remise',
  HAPPY_HOUR: 'Happy Hour',
  BUNDLE: 'Offre groupée',
  BOGO: 'Achetez-en 1, obtenez-en 1',
  FREE_DELIVERY: 'Livraison gratuite',
}

export const PROMOTION_TYPE_COLORS: Record<PromotionType, { bg: string; text: string }> = {
  DISCOUNT: { bg: 'bg-blue-100', text: 'text-blue-700' },
  HAPPY_HOUR: { bg: 'bg-amber-100', text: 'text-amber-700' },
  BUNDLE: { bg: 'bg-purple-100', text: 'text-purple-700' },
  BOGO: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  FREE_DELIVERY: { bg: 'bg-rose-100', text: 'text-rose-700' },
}

export const DAY_LABELS: Record<number, string> = {
  0: 'Dimanche',
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi',
}

export const DAY_SHORT_LABELS: Record<number, string> = {
  0: 'Dim',
  1: 'Lun',
  2: 'Mar',
  3: 'Mer',
  4: 'Jeu',
  5: 'Ven',
  6: 'Sam',
}
