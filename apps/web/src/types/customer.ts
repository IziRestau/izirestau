export interface CustomerAddress {
  id: string
  label: string | null
  street: string
  streetLine2: string | null
  city: string
  postalCode: string
  country: string
  latitude: number | null
  longitude: number | null
  instructions: string | null
  isDefault: boolean
}

export interface CustomerListItem {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  totalOrders: number
  totalSpent: number
  avgOrderValue: number
  lastOrderAt: string | null
  loyaltyPoints: number
  marketingOptIn: boolean
  tags: string[]
  isActive: boolean
  addressesCount: number
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  addresses: CustomerAddress[]
  defaultAddressId: string | null
  totalOrders: number
  totalSpent: number
  avgOrderValue: number
  lastOrderAt: string | null
  loyaltyPoints: number
  marketingOptIn: boolean
  tags: string[]
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CustomerStats {
  total: number
  newThisMonth: number
  newLastMonth: number
  growthPercent: number
  activeCustomers: number
  avgOrderValue: number
  uniqueTags: string[]
}

export interface CustomerOrder {
  id: string
  orderNumber: string
  displayNumber: string
  status: string
  serviceType: string
  paymentStatus: string
  subtotal: number
  total: number
  createdAt: string
}

export interface CustomerFilters {
  search?: string
  status?: 'active' | 'inactive'
  tags?: string
  minOrders?: number
  maxOrders?: number
  minSpent?: number
  maxSpent?: number
  lastOrderAfter?: string
  lastOrderBefore?: string
  createdAfter?: string
  createdBefore?: string
  marketingOptIn?: boolean
  sortBy?: 'firstName' | 'lastName' | 'email' | 'totalOrders' | 'totalSpent' | 'lastOrderAt' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface CustomerFormData {
  email: string
  firstName: string
  lastName: string
  phone?: string | null
  marketingOptIn?: boolean
  tags?: string[]
  notes?: string | null
}
