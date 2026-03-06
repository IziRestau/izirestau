export interface OpeningSlot {
  id: string
  openTime: string
  closeTime: string
  serviceTypes: string[]
}

export interface OpeningHours {
  id: string
  dayOfWeek: number
  isOpen: boolean
  slots: OpeningSlot[]
}

export interface SpecialHours {
  id: string
  date: string
  isClosed: boolean
  reason: string | null
  openTime: string | null
  closeTime: string | null
}

export interface RestaurantSettings {
  id: string
  currency: string
  language: string
  timezone: string
  orderPrefix: string
  autoAcceptOrders: boolean
  orderConfirmationEmail: boolean
  orderNotificationSms: boolean
  avgPrepTime: number
  maxOrdersPerSlot: number | null
  acceptCash: boolean
  acceptCard: boolean
  acceptOnlinePayment: boolean
  stripeAccountId: string | null
  stripeAccountStatus: string | null
  monerooPublicKey: string | null
  monerooSecretKey: string | null
  monerooWebhookSecret: string | null
  monerooConfigured: boolean
  tipsEnabled: boolean
  suggestedTips: number[]
  metaTitle: string | null
  metaDescription: string | null
  metaKeywords: string[]
  termsUrl: string | null
  privacyUrl: string | null
  legalNotice: string | null
}

export interface RestaurantSite {
  id: string
  subdomain: string
  customDomain: string | null
  status: string
  publishedAt: string | null
  expiresAt: string | null
  organization: {
    id: string
    name: string
    email: string
    phone: string | null
  }
  client: {
    id: string
    name: string
    email: string
    phone: string | null
    contactFirstName: string
    contactLastName: string
  } | null
}

export interface RestaurantDetails {
  id: string
  name: string
  description: string | null
  shortDescription: string | null
  email: string
  phone: string
  website: string | null
  address: string
  addressLine2: string | null
  city: string
  postalCode: string
  country: string
  latitude: number | null
  longitude: number | null
  businessName: string | null
  siret: string | null
  vatNumber: string | null
  businessType: string
  cuisineTypes: string[]
  logo: string | null
  coverImage: string | null
  images: string[]
  createdAt: string
  updatedAt: string
  site: RestaurantSite | null
  settings: RestaurantSettings | null
  openingHours: OpeningHours[]
  specialHours: SpecialHours[]
  _count: {
    staff: number
    products: number
    categories: number
    orders: number
    customers: number
    reviews: number
  }
  stats: {
    totalRevenue: number
    ordersThisMonth: number
    avgRating: number
  }
}

export interface Product {
  id: string
  name: string
  price: number
  image: string | null
  isActive: boolean
  isVisible: boolean
  stockQuantity: number | null
  category: {
    id: string
    name: string
  } | null
}

export interface Category {
  id: string
  name: string
  productsCount: number
}

export interface Order {
  id: string
  orderNumber: string
  displayNumber: string
  status: string
  paymentStatus: string
  total: number
  serviceType: string
  guestName: string | null
  guestEmail: string | null
  customer: {
    firstName: string
    lastName: string
  } | null
  createdAt: string
}

export interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  totalOrders: number
  totalSpent: number
  lastOrderAt: string | null
  createdAt: string
}

export interface StaffMember {
  id: string
  role: string
  position: string | null
  employeeId: string | null
  isActive: boolean
  posPin: string | null
  permissions: string[]
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    avatar: string | null
    phone: string | null
  }
}

export interface Review {
  id: string
  rating: number
  title: string | null
  comment: string | null
  response: string | null
  respondedAt: string | null
  isPublished: boolean
  createdAt: string
  customer: {
    firstName: string
    lastName: string
  }
}

export const statusLabels: Record<string, string> = {
  ACTIVE: 'Actif',
  DRAFT: 'Brouillon',
  SUSPENDED: 'Suspendu',
  EXPIRED: 'Expire',
}

export const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  DRAFT: 'bg-gray-100 text-gray-600',
  SUSPENDED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-orange-100 text-orange-700',
}

export const businessTypeLabels: Record<string, string> = {
  RESTAURANT: 'Restaurant',
  FAST_FOOD: 'Fast Food',
  CAFE: 'Cafe',
  BAKERY: 'Boulangerie',
  PIZZERIA: 'Pizzeria',
  FOOD_TRUCK: 'Food Truck',
  DARK_KITCHEN: 'Dark Kitchen',
  CATERING: 'Traiteur',
  OTHER: 'Autre',
}

export const dayLabels = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

export const orderStatusLabels: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmee',
  PREPARING: 'En preparation',
  READY: 'Prete',
  OUT_FOR_DELIVERY: 'En livraison',
  DELIVERED: 'Livree',
  PICKED_UP: 'Recuperee',
  COMPLETED: 'Terminee',
  CANCELLED: 'Annulee',
  REFUNDED: 'Remboursee',
}

export const orderStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PREPARING: 'bg-purple-100 text-purple-700',
  READY: 'bg-green-100 text-green-700',
  OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  PICKED_UP: 'bg-emerald-100 text-emerald-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-orange-100 text-orange-700',
}

export const serviceTypeLabels: Record<string, string> = {
  DELIVERY: 'Livraison',
  PICKUP: 'A emporter',
  DINE_IN: 'Sur place',
}

export const roleLabels: Record<string, string> = {
  OWNER: 'Proprietaire',
  MANAGER: 'Manager',
  STAFF: 'Employe',
  CASHIER: 'Caissier',
  KITCHEN: 'Cuisine',
}
