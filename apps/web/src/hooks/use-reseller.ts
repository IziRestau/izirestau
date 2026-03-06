'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'

interface DashboardData {
  organization: {
    id: string
    name: string
    slug: string
    status: string
  }
  license: {
    id: string
    status: string
    billingCycle: string
    currentPeriodEnd: string
    sitesUsed: number
    plan: {
      name: string
      maxSites: number
      priceMonthly: number
      priceYearly: number
    } | null
  } | null
  stats: {
    sitesCount: number
    sitesActive: number
    sitesRemaining: number
    clientsCount: number
    clientsActive: number
  }
}

interface Site {
  id: string
  subdomain: string
  customDomain?: string
  status: string
  createdAt: string
  publishedAt?: string
  restaurant?: {
    name: string
    email: string
    phone: string
  }
  client?: {
    id: string
    name: string
    email: string
    contactFirstName: string
    contactLastName: string
  }
}

interface Client {
  id: string
  name: string
  contactFirstName: string
  contactLastName: string
  email: string
  phone?: string
  businessName?: string
  status: string
  createdAt: string
  _count: { sites: number }
}

export function useResellerDashboard() {
  const { isAuthenticated, _hasHydrated, accessToken } = useAuthStore()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reseller-dashboard'],
    queryFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      const res = await api.reseller.getDashboard()
      return res.data
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
    staleTime: 2 * 60 * 1000,
  })

  return { data: data || null, isLoading, error: error?.message || null, refetch }
}

export function useResellerSites() {
  const { isAuthenticated, _hasHydrated, accessToken } = useAuthStore()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reseller-sites'],
    queryFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      const res = await api.reseller.getSites()
      return res.data
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
    staleTime: 2 * 60 * 1000,
  })

  return { sites: data || [], isLoading, error: error?.message || null, refetch }
}

export function useResellerClients() {
  const { isAuthenticated, _hasHydrated, accessToken } = useAuthStore()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reseller-clients'],
    queryFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      const res = await api.reseller.getClients()
      return res.data
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
    staleTime: 2 * 60 * 1000,
  })

  return { clients: data || [], isLoading, error: error?.message || null, refetch }
}

interface PeriodStats {
  period: string
  startDate: string
  sitesCreated: number
  sitesActivated: number
  clientsCreated: number
  clientsActivated: number
}

interface RevenueData {
  period: string
  filter: string
  totalRevenue: number
  currency: string
  chartData: Array<{
    month: string
    value: number
    sites: number
    services: number
  }>
}

export function useResellerStats(period: 'day' | 'week' | 'month') {
  const { isAuthenticated, _hasHydrated, accessToken } = useAuthStore()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reseller-stats', period],
    queryFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      const res = await api.reseller.getStats(period)
      return res.data
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
    staleTime: 1 * 60 * 1000,
  })

  return { data: data || null, isLoading, error: error?.message || null, refetch }
}

interface ClientSubscription {
  id: string
  name: string
  amount: number
  currency: string
  billingCycle: string
  status: string
  startDate: string
  nextBillingDate?: string
}

interface ClientInvoice {
  id: string
  invoiceNumber: string
  total: number
  status: string
  issueDate: string
  dueDate: string
  paidAt?: string
}

interface ClientInteraction {
  id: string
  type: string
  subject?: string
  content?: string
  performedBy?: string
  createdAt: string
}

interface SiteDetails {
  id: string
  subdomain: string
  customDomain?: string
  status: string
  isActive: boolean
  publishedAt?: string
  createdAt: string
  updatedAt: string
  restaurant?: {
    id: string
    name: string
    email: string
    phone: string
    address: string
    city: string
    postalCode: string
    country: string
    logo?: string
    coverImage?: string
    businessType: string
    cuisineTypes: string[]
  }
  client?: {
    id: string
    name: string
    email: string
    phone?: string
    contactFirstName: string
    contactLastName: string
    businessName?: string
    status: string
    notes?: string
    createdAt: string
    subscriptions: ClientSubscription[]
    invoices: ClientInvoice[]
    interactions: ClientInteraction[]
  }
  stats: {
    ordersCount: number
    ordersThisMonth: number
    revenue: number
    revenueThisMonth: number
    visitorsThisMonth: number
  }
}

export function useResellerSiteDetails(siteId: string | null) {
  const { isAuthenticated, _hasHydrated, accessToken } = useAuthStore()
  const [data, setData] = useState<SiteDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async (token: string, id: string) => {
    try {
      setIsLoading(true)
      setError(null)
      apiClient.setAccessToken(token)
      const res = await api.reseller.getSite(id)
      if (res.data) setData(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (_hasHydrated && isAuthenticated && accessToken && siteId) {
      fetch(accessToken, siteId)
    } else if (_hasHydrated && !isAuthenticated) {
      setIsLoading(false)
    } else if (!siteId) {
      setIsLoading(false)
    }
  }, [fetch, _hasHydrated, isAuthenticated, accessToken, siteId])

  return { data, isLoading, error, refetch: () => accessToken && siteId && fetch(accessToken, siteId) }
}

export function useResellerRevenue(period: 'day' | 'week' | 'month', filter: 'all' | 'sites' | 'services') {
  const { isAuthenticated, _hasHydrated, accessToken } = useAuthStore()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reseller-revenue', period, filter],
    queryFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      const res = await api.reseller.getRevenue(period, filter)
      return res.data
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
    staleTime: 2 * 60 * 1000,
  })

  return { data: data || null, isLoading, error: error?.message || null, refetch }
}

export type { DashboardData, Site, Client, PeriodStats, RevenueData, SiteDetails }
