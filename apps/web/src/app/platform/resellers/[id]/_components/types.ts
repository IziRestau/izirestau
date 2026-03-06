export interface LicensePlan {
  id: string
  name: string
  slug: string
  maxSites: number
  maxUsersPerSite: number
  priceMonthly: number
  priceYearly: number
  currency: string
  features: string[]
}

export interface License {
  id: string
  status: string
  billingCycle: string
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  sitesUsed: number
  plan: LicensePlan
  payments: LicensePayment[]
}

export interface LicensePayment {
  id: string
  amount: number
  currency: string
  status: string
  paidAt: string | null
  createdAt: string
}

export interface ResellerMember {
  id: string
  role: string
  permissions: string[]
  isActive: boolean
  invitedAt: string | null
  joinedAt: string | null
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    avatar: string | null
    phone: string | null
    createdAt: string
  }
}

export interface Site {
  id: string
  subdomain: string
  customDomain: string | null
  status: string
  publishedAt: string | null
  createdAt: string
  restaurant: {
    id: string
    name: string
    logo: string | null
  } | null
  client: {
    id: string
    name: string
    email: string
  } | null
}

export interface Client {
  id: string
  name: string
  email: string
  phone: string | null
  status: string
  contactFirstName: string
  contactLastName: string
  notes: string | null
  createdAt: string
  sites: {
    id: string
    subdomain: string
    status: string
  }[]
  _count: {
    sites: number
  }
}

export interface ClientInvoice {
  id: string
  invoiceNumber: string
  status: string
  amount: number
  currency: string
  dueDate: string
  paidAt: string | null
  createdAt: string
  client: {
    id: string
    name: string
    email: string
  }
}

export interface AuditLog {
  id: string
  entityType: string
  entityId: string
  action: string
  performedBy: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  performedByUser?: {
    id: string
    firstName: string
    lastName: string
  } | null
}

export interface ResellerDetails {
  id: string
  name: string
  slug: string
  email: string
  phone: string | null
  website: string | null
  address: string | null
  city: string | null
  postalCode: string | null
  country: string
  businessName: string | null
  siret: string | null
  vatNumber: string | null
  logo: string | null
  primaryColor: string
  customDomain: string | null
  domainVerified: boolean
  currency: string
  status: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  license: License | null
  members: ResellerMember[]
  sites: Site[]
  clients: Client[]
  _count: {
    sites: number
    members: number
    clients: number
    clientInvoices: number
  }
}

export const statusLabels: Record<string, string> = {
  PENDING: 'En attente',
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
  CANCELLED: 'Annule',
}

export const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

export const roleLabels: Record<string, string> = {
  OWNER: 'Proprietaire',
  ADMIN: 'Administrateur',
  SALES: 'Commercial',
  MEMBER: 'Membre',
}

export const siteStatusLabels: Record<string, string> = {
  DRAFT: 'Brouillon',
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
  EXPIRED: 'Expire',
}

export const siteStatusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-orange-100 text-orange-700',
}

export const clientStatusLabels: Record<string, string> = {
  LEAD: 'Prospect',
  ACTIVE: 'Actif',
  CHURNED: 'Perdu',
}

export const clientStatusColors: Record<string, string> = {
  LEAD: 'bg-blue-100 text-blue-700',
  ACTIVE: 'bg-green-100 text-green-700',
  CHURNED: 'bg-gray-100 text-gray-500',
}

export const invoiceStatusLabels: Record<string, string> = {
  DRAFT: 'Brouillon',
  SENT: 'Envoyee',
  PAID: 'Payee',
  OVERDUE: 'En retard',
  CANCELLED: 'Annulee',
}

export const invoiceStatusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SENT: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

export const auditActionLabels: Record<string, string> = {
  CREATED: 'Revendeur cree',
  UPDATED: 'Informations modifiees',
  ACTIVATED: 'Compte reactive',
  SUSPENDED: 'Compte suspendu',
  CANCELLED: 'Compte annule',
  INVITE_RESENT: 'Invitation renvoyee',
  INVITE_ACCEPTED: 'Invitation acceptee',
  LICENSE_CHANGED: 'Licence modifiee',
  SITE_CREATED: 'Site cree',
  SITE_DELETED: 'Site supprime',
  MEMBER_ADDED: 'Membre ajoute',
  MEMBER_REMOVED: 'Membre supprime',
}

export const auditActionColors: Record<string, { bg: string; icon: string }> = {
  CREATED: { bg: 'bg-blue-100', icon: 'text-blue-600' },
  UPDATED: { bg: 'bg-gray-100', icon: 'text-gray-600' },
  ACTIVATED: { bg: 'bg-green-100', icon: 'text-green-600' },
  SUSPENDED: { bg: 'bg-amber-100', icon: 'text-amber-600' },
  CANCELLED: { bg: 'bg-red-100', icon: 'text-red-600' },
  INVITE_RESENT: { bg: 'bg-blue-100', icon: 'text-blue-600' },
  INVITE_ACCEPTED: { bg: 'bg-green-100', icon: 'text-green-600' },
  LICENSE_CHANGED: { bg: 'bg-purple-100', icon: 'text-purple-600' },
  SITE_CREATED: { bg: 'bg-emerald-100', icon: 'text-emerald-600' },
  SITE_DELETED: { bg: 'bg-red-100', icon: 'text-red-600' },
  MEMBER_ADDED: { bg: 'bg-blue-100', icon: 'text-blue-600' },
  MEMBER_REMOVED: { bg: 'bg-orange-100', icon: 'text-orange-600' },
}
