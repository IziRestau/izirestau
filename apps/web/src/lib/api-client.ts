const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: PaginationInfo
}

export interface MediaItem {
  id: string
  restaurantId: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  thumbnailUrl: string | null
  width: number | null
  height: number | null
  title: string | null
  description: string | null
  folder: string | null
  tags: string[]
  alt: string | null
  uploadedBy: string | null
  createdAt: string
  updatedAt: string
}

class ApiClient {
  private accessToken: string | null = null
  private isRefreshing = false
  private refreshPromise: Promise<boolean> | null = null

  setAccessToken(token: string | null) {
    this.accessToken = token
    if (token) {
      localStorage.setItem('accessToken', token)
    } else {
      localStorage.removeItem('accessToken')
    }
  }

  getAccessToken(): string | null {
    if (this.accessToken) return this.accessToken
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken')
    }
    return this.accessToken
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null
    try {
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        const parsed = JSON.parse(authStorage)
        return parsed.state?.refreshToken || null
      }
    } catch {
      return null
    }
    return null
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise
    }

    this.isRefreshing = true
    this.refreshPromise = (async () => {
      const refreshToken = this.getRefreshToken()
      if (!refreshToken) {
        this.isRefreshing = false
        return false
      }

      try {
        const response = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        })

        if (!response.ok) {
          this.isRefreshing = false
          return false
        }

        const data = await response.json()
        if (data.success && data.data?.accessToken) {
          this.setAccessToken(data.data.accessToken)
          
          if (typeof window !== 'undefined' && data.data.refreshToken) {
            const authStorage = localStorage.getItem('auth-storage')
            if (authStorage) {
              const parsed = JSON.parse(authStorage)
              parsed.state.accessToken = data.data.accessToken
              parsed.state.refreshToken = data.data.refreshToken
              localStorage.setItem('auth-storage', JSON.stringify(parsed))
            }
          }
          this.isRefreshing = false
          return true
        }
      } catch {
        this.isRefreshing = false
        return false
      }
      this.isRefreshing = false
      return false
    })()

    return this.refreshPromise
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false
  ): Promise<ApiResponse<T>> {
    const token = this.getAccessToken()

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      if (response.status === 401 && !isRetry && !endpoint.includes('/auth/')) {
        const refreshed = await this.refreshAccessToken()
        if (refreshed) {
          return this.request<T>(endpoint, options, true)
        }
        
        this.setAccessToken(null)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage')
          window.location.href = '/login'
        }
      }
      throw new Error(data.message || 'Une erreur est survenue')
    }

    return data
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async delete<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { 
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async uploadFile<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const token = this.getAccessToken()

    const headers: HeadersInit = {}

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      if (response.status === 401) {
        this.setAccessToken(null)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage')
          window.location.href = '/login'
        }
      }
      throw new Error(data.message || 'Une erreur est survenue')
    }

    return data
  }
}

export const apiClient = new ApiClient()

export const api = {
  auth: {
    register: (data: {
      email: string
      password: string
      firstName: string
      lastName: string
      phone?: string
      userType?: string
    }) => apiClient.post('/auth/register', data),

    login: (data: { email: string; password: string }) =>
      apiClient.post<{
        user?: {
          id: string
          email: string
          firstName: string
          lastName: string
          userType: string
        }
        accessToken?: string
        refreshToken?: string
        requires2FA?: boolean
        tempToken?: string
      }>('/auth/login', data),

    login2FA: (data: { tempToken: string; code: string }) =>
      apiClient.post<{
        user: {
          id: string
          email: string
          firstName: string
          lastName: string
          userType: string
        }
        accessToken: string
        refreshToken: string
      }>('/auth/login/2fa', data),

    logout: (refreshToken: string) =>
      apiClient.post('/auth/logout', { refreshToken }),

    refresh: (refreshToken: string) =>
      apiClient.post<{ accessToken: string; refreshToken: string }>(
        '/auth/refresh',
        { refreshToken }
      ),

    me: () =>
      apiClient.get<{
        id: string
        email: string
        firstName: string
        lastName: string
        userType: string
      }>('/auth/me'),

    forgotPassword: (email: string) =>
      apiClient.post('/auth/forgot-password', { email }),

    resetPassword: (data: { token: string; email: string; password: string }) =>
      apiClient.post('/auth/reset-password', data),

    setupPassword: (data: { token: string; password: string }) =>
      apiClient.post<{ success: boolean; message: string }>('/auth/setup-password', data),
  },

  reseller: {
    getDashboard: () =>
      apiClient.get<{
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
      }>('/reseller/dashboard'),

    getSites: () =>
      apiClient.get<Array<{
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
      }>>('/reseller/sites'),

    createSite: (data: { subdomain: string; clientId?: string }) =>
      apiClient.post('/reseller/sites', data),

    getClients: () =>
      apiClient.get<Array<{
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
      }>>('/reseller/clients'),

    createClient: (data: {
      name: string
      email: string
      contactFirstName?: string
      contactLastName?: string
      phone?: string
      businessName?: string
      siret?: string
      subscriptionAmount?: number
      billingCycle?: 'MONTHLY' | 'YEARLY'
    }) => apiClient.post<{
      id: string
      name: string
      email: string
      status: string
    }>('/reseller/clients', data),

    getLicense: () =>
      apiClient.get<{
        id: string
        status: string
        billingCycle: string
        currentPeriodStart: string
        currentPeriodEnd: string
        trialEndsAt: string | null
        sitesUsed: number
        plan: {
          id: string
          name: string
          slug: string
          description: string | null
          maxSites: number
          maxUsersPerSite: number
          features: string[]
          hasCustomDomain: boolean
          hasAdvancedAnalytics: boolean
          hasPrioritySupport: boolean
          hasWhiteLabel: boolean
          hasApiAccess: boolean
          priceMonthly: number
          priceYearly: number
          currency: string
          isPopular: boolean
        }
        payments: Array<{
          id: string
          amount: number
          currency: string
          status: string
          createdAt: string
          invoiceUrl?: string
        }>
        organization: {
          name: string
          email: string
        }
      }>('/reseller/license'),

    getLicensePlans: () =>
      apiClient.get<Array<{
        id: string
        name: string
        slug: string
        description: string | null
        maxSites: number
        maxUsersPerSite: number
        features: string[]
        hasCustomDomain: boolean
        hasAdvancedAnalytics: boolean
        hasPrioritySupport: boolean
        hasWhiteLabel: boolean
        hasApiAccess: boolean
        priceMonthly: number
        priceYearly: number
        currency: string
        isPopular: boolean
      }>>('/reseller/license/plans'),

    getInvoices: (params?: { status?: string; clientId?: string; page?: number; limit?: number }) => {
      const searchParams = new URLSearchParams()
      if (params?.status) searchParams.set('status', params.status)
      if (params?.clientId) searchParams.set('clientId', params.clientId)
      if (params?.page) searchParams.set('page', String(params.page))
      if (params?.limit) searchParams.set('limit', String(params.limit))
      const query = searchParams.toString()
      return apiClient.get<Array<{
        id: string
        invoiceNumber: string
        issueDate: string
        dueDate: string
        subtotal: number
        taxRate: number
        taxAmount: number
        total: number
        status: string
        paidAmount: number
        paidAt: string | null
        client: { id: string; name: string; email: string }
        items: Array<{ id: string; description: string; quantity: number; unitPrice: number; total: number }>
      }>>(`/reseller/invoices${query ? `?${query}` : ''}`)
    },

    getInvoice: (invoiceId: string) =>
      apiClient.get<{
        id: string
        invoiceNumber: string
        issueDate: string
        dueDate: string
        subtotal: number
        taxRate: number
        taxAmount: number
        total: number
        status: string
        paidAmount: number
        paidAt: string | null
        pdfUrl: string | null
        notes: string | null
        client: {
          id: string
          name: string
          email: string
          phone: string | null
          address: string | null
          city: string | null
          postalCode: string | null
          siret: string | null
          vatNumber: string | null
        }
        items: Array<{ id: string; description: string; quantity: number; unitPrice: number; total: number }>
      }>(`/reseller/invoices/${invoiceId}`),

    getInvoiceStats: () =>
      apiClient.get<{
        total: { count: number; amount: number }
        paid: { count: number; amount: number }
        pending: { count: number; amount: number }
        overdue: { count: number; amount: number }
      }>('/reseller/invoices/stats/summary'),

    createInvoice: (data: {
      clientId: string
      items: Array<{ description: string; quantity: number; unitPrice: number }>
      dueDate?: string
      notes?: string
    }) => apiClient.post<{ id: string; invoiceNumber: string }>('/reseller/invoices', data),

    updateInvoiceStatus: (invoiceId: string, status: string, paidAmount?: number) =>
      apiClient.patch<{ id: string; status: string }>(`/reseller/invoices/${invoiceId}/status`, { status, paidAmount }),

    sendInvoiceReminder: (invoiceId: string) =>
      apiClient.post<{ success: boolean; remindersSent: number }>(`/reseller/invoices/${invoiceId}/reminder`),

    // Transactions (ShowcasePayment)
    getTransactions: (params?: { status?: string; search?: string; page?: number; limit?: number }) => {
      const searchParams = new URLSearchParams()
      if (params?.status) searchParams.set('status', params.status)
      if (params?.search) searchParams.set('search', params.search)
      if (params?.page) searchParams.set('page', String(params.page))
      if (params?.limit) searchParams.set('limit', String(params.limit))
      const query = searchParams.toString()
      return apiClient.get<{
        transactions: Array<{
          id: string
          email: string
          firstName: string | null
          lastName: string | null
          phone: string | null
          plan: { id: string; name: string; slug: string } | null
          amount: number
          currency: string
          billingCycle: number
          status: 'PENDING' | 'PAID' | 'ONBOARDING' | 'COMPLETED' | 'EXPIRED' | 'FAILED'
          monerooPaymentId: string | null
          monerooStatus: string | null
          paidAt: string | null
          clientId: string | null
          siteId: string | null
          createdAt: string
        }>
        pagination: {
          page: number
          limit: number
          total: number
          totalPages: number
        }
        stats: {
          total: { count: number; amount: number }
          paid: { count: number; amount: number }
          pending: { count: number; amount: number }
          failed: { count: number; amount: number }
        }
      }>(`/reseller/transactions${query ? `?${query}` : ''}`)
    },

    getTransaction: (transactionId: string) =>
      apiClient.get<{
        id: string
        email: string
        firstName: string | null
        lastName: string | null
        phone: string | null
        plan: { id: string; name: string; slug: string; description: string | null } | null
        amount: number
        currency: string
        billingCycle: number
        status: 'PENDING' | 'PAID' | 'ONBOARDING' | 'COMPLETED' | 'EXPIRED' | 'FAILED'
        monerooPaymentId: string | null
        monerooStatus: string | null
        paidAt: string | null
        onboardingToken: string
        onboardingExpires: string
        client: {
          id: string
          name: string
          email: string
          contactFirstName: string
          contactLastName: string
          status: string
        } | null
        site: {
          id: string
          subdomain: string
          status: string
          restaurant: { name: string } | null
        } | null
        createdAt: string
        updatedAt: string
      }>(`/reseller/transactions/${transactionId}`),

    getStats: (period: 'day' | 'week' | 'month') =>
      apiClient.get<{
        period: string
        startDate: string
        sitesCreated: number
        sitesActivated: number
        clientsCreated: number
        clientsActivated: number
      }>(`/reseller/stats?period=${period}`),

    getRevenue: (period: 'day' | 'week' | 'month', filter: 'all' | 'sites' | 'services') =>
      apiClient.get<{
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
      }>(`/reseller/revenue?period=${period}&filter=${filter}`),

    resendInvitation: (clientId: string) =>
      apiClient.post<{ success: boolean }>(`/reseller/clients/${clientId}/resend-invitation`),

    deleteClient: (clientId: string) =>
      apiClient.delete<{ success: boolean }>(`/reseller/clients/${clientId}`),

    getSite: (siteId: string) =>
      apiClient.get<{
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
          subscriptions: Array<{
            id: string
            name: string
            amount: number
            currency: string
            billingCycle: string
            status: string
            startDate: string
            nextBillingDate?: string
          }>
          invoices: Array<{
            id: string
            invoiceNumber: string
            total: number
            status: string
            issueDate: string
            dueDate: string
            paidAt?: string
          }>
          interactions: Array<{
            id: string
            type: string
            subject?: string
            content?: string
            performedBy?: string
            createdAt: string
          }>
        }
        stats: {
          ordersCount: number
          ordersThisMonth: number
          revenue: number
          revenueThisMonth: number
          visitorsThisMonth: number
        }
      }>(`/reseller/sites/${siteId}`),

    updateSiteStatus: (siteId: string, status: 'DRAFT' | 'ACTIVE' | 'SUSPENDED') =>
      apiClient.patch<{ id: string; status: string }>(`/reseller/sites/${siteId}/status`, { status }),

    resendAccess: (siteId: string) =>
      apiClient.post<{ success: boolean; message: string; email: string }>(`/reseller/sites/${siteId}/resend-access`),

    addClientNote: (clientId: string, content: string, type?: string, subject?: string) =>
      apiClient.post<{ id: string; type: string; content: string; createdAt: string }>(`/reseller/clients/${clientId}/notes`, { content, type, subject }),

    updateClientNotes: (clientId: string, notes: string) =>
      apiClient.patch<{ id: string; notes: string }>(`/reseller/clients/${clientId}/notes`, { notes }),

    // Client Payments (paiements manuels)
    getClientPayments: (clientId: string) =>
      apiClient.get<Array<{
        id: string
        amount: number
        currency: string
        method: 'BANK_TRANSFER' | 'CHECK' | 'CASH' | 'CARD' | 'OTHER'
        reference: string | null
        notes: string | null
        receivedAt: string
        createdAt: string
      }>>(`/reseller/clients/${clientId}/payments`),

    createClientPayment: (clientId: string, data: {
      amount: number
      currency?: string
      method: 'BANK_TRANSFER' | 'CHECK' | 'CASH' | 'CARD' | 'OTHER'
      reference?: string
      notes?: string
      invoiceId?: string
      receivedAt?: string
    }) => apiClient.post<{
      id: string
      amount: number
      currency: string
      method: string
      reference: string | null
      notes: string | null
      receivedAt: string
      createdAt: string
    }>(`/reseller/clients/${clientId}/payments`, data),

    deleteClientPayment: (clientId: string, paymentId: string) =>
      apiClient.delete<{ success: boolean }>(`/reseller/clients/${clientId}/payments/${paymentId}`),

    // Subscriptions (gestion des abonnements)
    updateSubscription: (subscriptionId: string, data: {
      name?: string
      amount?: number
      billingCycle?: 'MONTHLY' | 'YEARLY'
      nextBillingDate?: string
    }) => apiClient.put<{
      id: string
      name: string
      amount: number
      currency: string
      billingCycle: string
      status: string
      nextBillingDate: string | null
    }>(`/reseller/subscriptions/${subscriptionId}`, data),

    cancelSubscription: (subscriptionId: string) =>
      apiClient.post<{ id: string; status: string; cancelledAt: string }>(`/reseller/subscriptions/${subscriptionId}/cancel`),

    pauseSubscription: (subscriptionId: string) =>
      apiClient.post<{ id: string; status: string }>(`/reseller/subscriptions/${subscriptionId}/pause`),

    resumeSubscription: (subscriptionId: string) =>
      apiClient.post<{ id: string; status: string }>(`/reseller/subscriptions/${subscriptionId}/resume`),

    getSettings: () =>
      apiClient.get<{
        user: {
          id: string
          email: string
          firstName: string
          lastName: string
          phone: string | null
          avatar: string | null
          language: string
          timezone: string
          emailVerified: boolean
        }
        organization: {
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
          status: string
          currency: string
        }
        license: {
          id: string
          status: string
          plan: {
            id: string
            name: string
            maxSites: number
          }
        } | null
        members: Array<{
          id: string
          role: string
          isActive: boolean
          joinedAt: string | null
          user: {
            id: string
            email: string
            firstName: string
            lastName: string
            avatar: string | null
          }
        }>
        currentMember: {
          id: string
          role: string
          permissions: string[]
        }
      }>('/reseller/settings'),

    updateProfile: (data: {
      firstName?: string
      lastName?: string
      phone?: string | null
      avatar?: string | null
      language?: string
      timezone?: string
    }) => apiClient.put<{
      id: string
      email: string
      firstName: string
      lastName: string
      phone: string | null
      avatar: string | null
      language: string
      timezone: string
    }>('/reseller/settings/profile', data),

    updateOrganization: (data: {
      name?: string
      email?: string
      phone?: string | null
      website?: string | null
      address?: string | null
      city?: string | null
      postalCode?: string | null
      country?: string
      businessName?: string | null
      siret?: string | null
      vatNumber?: string | null
    }) => apiClient.put<{
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
    }>('/reseller/settings/organization', data),

    updateBranding: (data: {
      logo?: string | null
      primaryColor?: string
    }) => apiClient.put<{
      id: string
      logo: string | null
      primaryColor: string
    }>('/reseller/settings/branding', data),

    updatePassword: (data: {
      currentPassword: string
      newPassword: string
    }) => apiClient.put<{ success: boolean; message: string }>('/reseller/settings/password', data),

    getMembers: () =>
      apiClient.get<Array<{
        id: string
        role: string
        isActive: boolean
        joinedAt: string | null
        invitedAt: string | null
        user: {
          id: string
          email: string
          firstName: string
          lastName: string
          avatar: string | null
        }
      }>>('/reseller/settings/members'),

    inviteMember: (data: {
      email: string
      firstName: string
      lastName: string
      role?: string
    }) => apiClient.post<{ success: boolean; message: string }>('/reseller/settings/members/invite', data),

    updateMember: (memberId: string, data: {
      role?: string
      isActive?: boolean
    }) => apiClient.put<{
      id: string
      role: string
      isActive: boolean
      user: {
        id: string
        email: string
        firstName: string
        lastName: string
        avatar: string | null
      }
    }>(`/reseller/settings/members/${memberId}`, data),

    deleteMember: (memberId: string) =>
      apiClient.delete<{ success: boolean; message: string }>(`/reseller/settings/members/${memberId}`),

    resendVerificationEmail: () =>
      apiClient.post<{ success: boolean; message: string }>('/reseller/settings/resend-verification'),

    exportData: () =>
      apiClient.get<unknown>('/reseller/settings/export-data'),

    getNotifications: () =>
      apiClient.get<{
        notifyEmailInvoice: boolean
        notifyEmailPayment: boolean
        notifyEmailNewSite: boolean
        notifyEmailNewClient: boolean
        notifyEmailWeeklyReport: boolean
        notifyEmailMarketing: boolean
      }>('/reseller/settings/notifications'),

    updateNotifications: (data: {
      notifyEmailInvoice?: boolean
      notifyEmailPayment?: boolean
      notifyEmailNewSite?: boolean
      notifyEmailNewClient?: boolean
      notifyEmailWeeklyReport?: boolean
      notifyEmailMarketing?: boolean
    }) => apiClient.put<{
      notifyEmailInvoice: boolean
      notifyEmailPayment: boolean
      notifyEmailNewSite: boolean
      notifyEmailNewClient: boolean
      notifyEmailWeeklyReport: boolean
      notifyEmailMarketing: boolean
    }>('/reseller/settings/notifications', data),

    // Plans
    getPlans: (includeArchived?: boolean) =>
      apiClient.get<Array<{
        id: string
        name: string
        slug: string
        description: string | null
        priceMonthly: number
        priceYearly: number | null
        currency: string
        features: string[]
        isCustom: boolean
        isActive: boolean
        isArchived: boolean
        isPopular: boolean
        isPublic: boolean
        sortOrder: number
        subscribersCount: number
        createdAt: string
      }>>(`/reseller/plans${includeArchived ? '?includeArchived=true' : ''}`),

    getPlan: (planId: string) =>
      apiClient.get<{
        id: string
        name: string
        slug: string
        description: string | null
        priceMonthly: number
        priceYearly: number | null
        currency: string
        features: string[]
        isCustom: boolean
        isActive: boolean
        isArchived: boolean
        isPopular: boolean
        isPublic: boolean
        sortOrder: number
        subscribersCount: number
        subscriptions: Array<{
          id: string
          client: {
            id: string
            name: string
            email: string
            status: string
          }
        }>
      }>(`/reseller/plans/${planId}`),

    createPlan: (data: {
      name: string
      description?: string
      price: number
      currency?: string
      billingCycle?: number
      billingCycleLabel?: string
      isCustom?: boolean
      isPopular?: boolean
      isPublic?: boolean
      sortOrder?: number
    }) => apiClient.post<{
      id: string
      name: string
      slug: string
    }>('/reseller/plans', data),

    updatePlan: (planId: string, data: {
      name?: string
      description?: string
      price?: number
      currency?: string
      billingCycle?: number
      billingCycleLabel?: string
      isCustom?: boolean
      isPopular?: boolean
      isPublic?: boolean
      sortOrder?: number
    }) => apiClient.put<{
      id: string
      name: string
      slug: string
    }>(`/reseller/plans/${planId}`, data),

    deletePlan: (planId: string) =>
      apiClient.delete<{ success: boolean; archived?: boolean; deleted?: boolean }>(`/reseller/plans/${planId}`),

    // Showcase
    getShowcase: () =>
      apiClient.get<{
        showcase: {
          id: string
          isEnabled: boolean
          // Nouvelles configurations avancées
          heroConfig: Record<string, unknown> | null
          productConfig: Record<string, unknown> | null
          howItWorksConfig: Record<string, unknown> | null
          benefitsConfig: Record<string, unknown> | null
          pricingConfig: Record<string, unknown> | null
          testimonialsConfig: Record<string, unknown> | null
          faqConfig: Record<string, unknown> | null
          contactConfig: Record<string, unknown> | null
          footerConfig: Record<string, unknown> | null
          sectionsOrder: string[] | null
          globalStyles: Record<string, unknown> | null
          template: string
          metaTitle: string | null
          metaDescription: string | null
        }
        organization: {
          id: string
          name: string
          slug: string
          logo: string | null
          primaryColor: string
          customDomain: string | null
          domainVerified: boolean
          monerooConfigured: boolean
        }
        canPublish: boolean
      }>('/reseller/showcase'),

    updateShowcase: (data: Record<string, unknown>) => 
      apiClient.put<{
        id: string
        isEnabled: boolean
      }>('/reseller/showcase', data),

    toggleShowcase: (enable: boolean) =>
      apiClient.post<{ isEnabled: boolean; message: string }>('/reseller/showcase/toggle', { enable }),

    // Invitations
    getInvitations: (params?: { status?: string; page?: number; limit?: number }) => {
      const searchParams = new URLSearchParams()
      if (params?.status) searchParams.set('status', params.status)
      if (params?.page) searchParams.set('page', String(params.page))
      if (params?.limit) searchParams.set('limit', String(params.limit))
      const query = searchParams.toString()
      return apiClient.get<Array<{
        id: string
        email: string
        firstName: string | null
        lastName: string | null
        phone: string | null
        amount: number
        currency: string
        billingCycle: string
        status: string
        plan: { id: string; name: string } | null
        createdAt: string
        onboardingExpires: string
      }>>(`/reseller/invitations${query ? `?${query}` : ''}`)
    },

    createInvitation: (data: {
      email: string
      firstName?: string
      lastName?: string
      phone?: string
      amount: number
      currency?: string
      billingCycle?: 'MONTHLY' | 'YEARLY'
      planId?: string
      message?: string
    }) => apiClient.post<{
      id: string
      email: string
      amount: number
      currency: string
      paymentLink: string
      expiresAt: string
    }>('/reseller/invitations', data),

    cancelInvitation: (invitationId: string) =>
      apiClient.delete<{ success: boolean }>(`/reseller/invitations/${invitationId}`),

    moneroo: {
      get: () =>
        apiClient.get<{
          secretKey: string
          webhookSecret: string
          isConfigured: boolean
          hasSecretKey: boolean
          hasWebhookSecret: boolean
        }>('/reseller/settings/moneroo'),

      update: (data: { secretKey: string; webhookSecret?: string }) =>
        apiClient.put<{ message: string }>('/reseller/settings/moneroo', data),

      test: () =>
        apiClient.post<{ message: string }>('/reseller/settings/moneroo/test'),
    },
  },

  twoFactor: {
    getStatus: () =>
      apiClient.get<{ enabled: boolean; verifiedAt: string | null }>('/auth/2fa/status'),

    setup: () =>
      apiClient.post<{ secret: string; qrCode: string; otpauth: string }>('/auth/2fa/setup'),

    verify: (code: string) =>
      apiClient.post<{ backupCodes: string[]; message: string }>('/auth/2fa/verify', { code }),

    disable: (code: string, password: string) =>
      apiClient.post<{ message: string }>('/auth/2fa/disable', { code, password }),

    regenerateBackupCodes: (code: string) =>
      apiClient.post<{ backupCodes: string[] }>('/auth/2fa/regenerate-backup-codes', { code }),
  },

  domain: {
    get: () =>
      apiClient.get<{
        slug: string
        customDomain: string | null
        domainVerified: boolean
        domainTxtRecord: string | null
        vercelConfigured: boolean
        vercelStatus: {
          verified: boolean
          verification?: Array<{
            type: string
            domain: string
            value: string
            reason: string
          }>
        } | null
      }>('/reseller/domain'),

    add: (domain: string) =>
      apiClient.post<{
        customDomain: string
        domainVerified: boolean
        verification?: Array<{
          type: string
          domain: string
          value: string
        }>
        message: string
      }>('/reseller/domain', { domain }),

    verify: () =>
      apiClient.post<{
        verified: boolean
        verification?: Array<{
          type: string
          domain: string
          value: string
          reason: string
        }>
        message: string
      }>('/reseller/domain/verify'),

    remove: () =>
      apiClient.delete<{ message: string }>('/reseller/domain'),
  },

  currency: {
    get: () =>
      apiClient.get<{ currency: string }>('/reseller/settings/currency'),

    update: (currency: string) =>
      apiClient.put<{ currency: string; message: string }>('/reseller/settings/currency', { currency }),
  },

  upload: {
    uploadImage: (file: File, folder: string, restaurantId?: string) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)
      if (restaurantId) formData.append('restaurantId', restaurantId)
      return apiClient.uploadFile<{ url: string; key: string; mediaItem?: MediaItem }>('/upload/image', formData)
    },

    uploadDocument: (file: File, folder: string) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)
      return apiClient.uploadFile<{ url: string; key: string }>('/upload/document', formData)
    },

    deleteFile: (urlOrKey: string) => {
      const isUrl = urlOrKey.startsWith('http')
      return apiClient.delete<{ success: boolean }>('/upload', isUrl ? { url: urlOrKey } : { key: urlOrKey })
    },

    getStatus: () =>
      apiClient.get<{ configured: boolean }>('/upload/status'),
  },

  media: {
    getList: (params?: { folder?: string; search?: string; page?: number; limit?: number; restaurantId?: string }) => {
      const searchParams = new URLSearchParams()
      if (params?.folder) searchParams.append('folder', params.folder)
      if (params?.search) searchParams.append('search', params.search)
      if (params?.page) searchParams.append('page', params.page.toString())
      if (params?.limit) searchParams.append('limit', params.limit.toString())
      if (params?.restaurantId) searchParams.append('restaurantId', params.restaurantId)
      return apiClient.get<{
        items: MediaItem[]
        pagination: { page: number; limit: number; total: number; totalPages: number }
        folders: { name: string; count: number; size: number }[]
      }>(`/restaurant/media?${searchParams.toString()}`)
    },

    upload: (file: File, folder: string, restaurantId?: string, options?: { title?: string; alt?: string; tags?: string[] }) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)
      if (restaurantId) formData.append('restaurantId', restaurantId)
      if (options?.title) formData.append('title', options.title)
      if (options?.alt) formData.append('alt', options.alt)
      if (options?.tags) options.tags.forEach(tag => formData.append('tags', tag))
      return apiClient.uploadFile<MediaItem>('/restaurant/media', formData)
    },

    get: (id: string, restaurantId?: string) =>
      apiClient.get<MediaItem>(`/restaurant/media/${id}${restaurantId ? `?restaurantId=${restaurantId}` : ''}`),

    update: (id: string, data: { title?: string; alt?: string; description?: string; folder?: string; tags?: string[] }) =>
      apiClient.put<MediaItem>(`/restaurant/media/${id}`, data),

    delete: (id: string) =>
      apiClient.delete<{ success: boolean }>(`/restaurant/media/${id}`),

    getFolders: () =>
      apiClient.get<{ name: string; count: number }[]>('/restaurant/media/folders/list'),
  },

  support: {
    getTickets: (status?: string, category?: string) => {
      const params = new URLSearchParams()
      if (status) params.append('status', status)
      if (category) params.append('category', category)
      return apiClient.get<{
        tickets: Array<{
          id: string
          ticketNumber: string
          subject: string
          category: string
          priority: string
          status: string
          lastMessageAt: string | null
          createdAt: string
          createdBy: { id: string; firstName: string; lastName: string; avatar: string | null }
          assignedTo: { id: string; firstName: string; lastName: string; avatar: string | null } | null
          _count: { messages: number }
        }>
        stats: { total: number; open: number; inProgress: number; resolved: number }
      }>(`/reseller/support/tickets?${params.toString()}`)
    },

    getTicket: (ticketId: string) =>
      apiClient.get<{
        id: string
        ticketNumber: string
        subject: string
        category: string
        priority: string
        status: string
        lastMessageAt: string | null
        resolvedAt: string | null
        closedAt: string | null
        createdAt: string
        createdBy: { id: string; firstName: string; lastName: string; avatar: string | null }
        assignedTo: { id: string; firstName: string; lastName: string; avatar: string | null } | null
        messages: Array<{
          id: string
          content: string
          isFromAdmin: boolean
          createdAt: string
          sender: { id: string; firstName: string; lastName: string; avatar: string | null; userType: string }
        }>
      }>(`/reseller/support/tickets/${ticketId}`),

    createTicket: (data: { subject: string; category: string; priority?: string; message: string }) =>
      apiClient.post<{
        id: string
        ticketNumber: string
        subject: string
        category: string
        priority: string
        status: string
      }>('/reseller/support/tickets', data),

    addMessage: (ticketId: string, content: string) =>
      apiClient.post<{
        id: string
        content: string
        createdAt: string
        sender: { id: string; firstName: string; lastName: string; avatar: string | null }
      }>(`/reseller/support/tickets/${ticketId}/messages`, { content }),

    closeTicket: (ticketId: string) =>
      apiClient.post<{ id: string; status: string }>(`/reseller/support/tickets/${ticketId}/close`),

    reopenTicket: (ticketId: string) =>
      apiClient.post<{ id: string; status: string }>(`/reseller/support/tickets/${ticketId}/reopen`),
  },

  restaurant: {
    getMyRestaurants: () =>
      apiClient.get<Array<{
        id: string
        name: string
        logo: string | null
        address: string
        city: string
        role: string
        organization: {
          id: string
          name: string
          primaryColor: string
        } | null
      }>>('/restaurant/my-restaurants'),

    getMe: (restaurantId?: string) =>
      apiClient.get<{
        restaurant: {
          id: string
          name: string
          description: string | null
          email: string
          phone: string
          address: string
          city: string
          postalCode: string
          country: string
          logo: string | null
          coverImage: string | null
          businessType: string
          cuisineTypes: string[]
        }
        organization: {
          id: string
          name: string
          slug: string
          logo: string | null
          primaryColor: string
          currency: string
        } | null
        site: {
          id: string
          subdomain: string
          customDomain: string | null
          status: string
        } | null
        staff: {
          id: string
          role: string
          permissions: string[]
          position: string | null
        }
        settings: {
          currency: string
          language: string
          timezone: string
        } | null
      }>(restaurantId ? `/restaurant/me?restaurantId=${restaurantId}` : '/restaurant/me'),

    getDashboardStats: (restaurantId?: string) =>
      apiClient.get<{
        orders: {
          today: number
          week: number
          month: number
          pending: number
          preparing: number
        }
        revenue: {
          today: number
          week: number
          month: number
        }
        customers: {
          total: number
          new: number
        }
        products: {
          total: number
          active: number
        }
      }>(restaurantId ? `/restaurant/dashboard/stats?restaurantId=${restaurantId}` : '/restaurant/dashboard/stats'),

    getRecentOrders: (restaurantId?: string) =>
      apiClient.get<Array<{
        id: string
        orderNumber: string
        displayNumber: string
        status: string
        paymentStatus: string
        total: number
        serviceType: string
        createdAt: string
        customer: {
          id?: string
          name: string
          phone: string | null
        } | null
        itemsCount: number
      }>>(restaurantId ? `/restaurant/orders/recent?restaurantId=${restaurantId}` : '/restaurant/orders/recent'),

    getTrendingProducts: (restaurantId?: string) =>
      apiClient.get<Array<{
        id: string
        name: string
        description: string | null
        image: string | null
        price: number
        totalSold: number
      }>>(restaurantId ? `/restaurant/products/trending?restaurantId=${restaurantId}` : '/restaurant/products/trending'),

    getRevenueChart: (restaurantId?: string) =>
      apiClient.get<Array<{
        month: string
        value: number
      }>>(restaurantId ? `/restaurant/revenue/chart?restaurantId=${restaurantId}` : '/restaurant/revenue/chart'),

    getOrders: (params?: {
      restaurantId?: string
      page?: number
      limit?: number
      status?: string
      serviceType?: string
      dateFrom?: string
      dateTo?: string
      search?: string
    }) => {
      const searchParams = new URLSearchParams()
      if (params?.restaurantId) searchParams.append('restaurantId', params.restaurantId)
      if (params?.page) searchParams.append('page', params.page.toString())
      if (params?.limit) searchParams.append('limit', params.limit.toString())
      if (params?.status) searchParams.append('status', params.status)
      if (params?.serviceType) searchParams.append('serviceType', params.serviceType)
      if (params?.dateFrom) searchParams.append('dateFrom', params.dateFrom)
      if (params?.dateTo) searchParams.append('dateTo', params.dateTo)
      if (params?.search) searchParams.append('search', params.search)
      const query = searchParams.toString()
      return apiClient.get<{
        orders: Array<{
          id: string
          orderNumber: string
          displayNumber: string
          status: string
          paymentStatus: string
          paymentMethod: string | null
          total: number
          serviceType: string
          source: string
          createdAt: string
          scheduledFor: string | null
          isScheduled: boolean
          customer: {
            id: string
            firstName: string
            lastName: string
            phone: string | null
            email: string | null
          } | null
          guestName: string | null
          guestPhone: string | null
          guestEmail: string | null
          itemsCount: number
        }>
        pagination: {
          total: number
          page: number
          limit: number
          pages: number
        }
        stats: {
          total: number
          pending: number
          confirmed: number
          preparing: number
          ready: number
          completed: number
          cancelled: number
          revenueToday: number
        }
      }>(`/restaurant/orders${query ? `?${query}` : ''}`)
    },

    getOrder: (id: string) =>
      apiClient.get<{
        id: string
        orderNumber: string
        displayNumber: string
        status: string
        paymentStatus: string
        paymentMethod: string | null
        serviceType: string
        source: string
        subtotal: number
        taxAmount: number
        deliveryFee: number
        tip: number
        discount: number
        total: number
        customer: {
          id: string
          firstName: string
          lastName: string
          email: string | null
          phone: string | null
          totalOrders: number
          totalSpent: number
        } | null
        guestName: string | null
        guestEmail: string | null
        guestPhone: string | null
        deliveryAddress: Record<string, unknown> | null
        deliveryNotes: string | null
        pickupTime: string | null
        scheduledFor: string | null
        isScheduled: boolean
        estimatedPrepTime: number | null
        prepStartedAt: string | null
        prepCompletedAt: string | null
        customerNotes: string | null
        internalNotes: string | null
        cancelledAt: string | null
        cancelReason: string | null
        cancelledBy: string | null
        refundedAmount: number | null
        refundedAt: string | null
        refundReason: string | null
        paidAt: string | null
        coupon: {
          id: string
          code: string
          discountType: string
          discountValue: number
        } | null
        couponCode: string | null
        items: Array<{
          id: string
          productId: string
          productName: string
          productImage: string | null
          variantId: string | null
          variantName: string | null
          quantity: number
          unitPrice: number
          totalPrice: number
          modifiersTotal: number
          specialInstructions: string | null
          modifiers: Array<{
            id: string
            name: string
            price: number
            quantity: number
          }>
        }>
        timeline: Array<{
          id: string
          status: string
          message: string | null
          userId: string | null
          createdAt: string
        }>
        createdAt: string
        updatedAt: string
      }>(`/restaurant/orders/${id}`),

    updateOrderStatus: (id: string, data: { status: string; message?: string }) =>
      apiClient.post<{ id: string; status: string }>(`/restaurant/orders/${id}/status`, data),

    cancelOrder: (id: string, data: { reason: string }) =>
      apiClient.post<{ id: string; status: string; cancelledAt: string; cancelReason: string }>(`/restaurant/orders/${id}/cancel`, data),

    updateOrder: (id: string, data: { internalNotes?: string }) =>
      apiClient.put<{ id: string; internalNotes: string | null }>(`/restaurant/orders/${id}`, data),

    updatePaymentStatus: (id: string, data: { paymentStatus: string }) =>
      apiClient.post<{ id: string; paymentStatus: string; paidAt: string | null }>(`/restaurant/orders/${id}/payment-status`, data),

    getOpenOrders: (restaurantId?: string) =>
      apiClient.get<any>(restaurantId ? `/restaurant/orders/open?restaurantId=${restaurantId}` : '/restaurant/orders/open'),

    addItemsToOrder: (orderId: string, data: {
      restaurantId?: string
      items: Array<{
        productId: string
        variantId?: string
        quantity: number
        notes?: string
        modifiers?: Array<{ modifierId: string }>
      }>
    }) =>
      apiClient.post<{
        id: string
        orderNumber: string
        subtotal: number
        taxAmount: number
        discount: number
        total: number
        itemsCount: number
        addedItems: number
      }>(`/restaurant/orders/${orderId}/items`, data),

    closeOrder: (orderId: string, data: {
      restaurantId?: string
      paymentMethod: string
      amountReceived?: number
    }) =>
      apiClient.post<{
        id: string
        orderNumber: string
        displayNumber: string
        status: string
        paymentStatus: string
        paymentMethod: string
        total: number
        change?: number
        receipt?: {
          id: string
          receiptNumber: string
          type: string
        }
      }>(`/restaurant/orders/${orderId}/close`, data),

    createOrder: (data: {
      serviceType: string
      source?: string
      customerId?: string
      tableNumber?: string
      deliveryAddress?: string
      customerNotes?: string
      paymentMethod?: string
      items: Array<{
        productId: string
        variantId?: string
        quantity: number
        notes?: string
        modifiers?: Array<{ modifierId: string }>
      }>
      discount?: {
        type: 'percentage' | 'fixed'
        value: number
        reason?: string
        code?: string
      }
    }) =>
      apiClient.post<{
        id: string
        orderNumber: string
        displayNumber: string
        status: string
        paymentStatus: string
        total: number
      }>('/restaurant/orders', data),

    // Settings
    getSettings: (restaurantId?: string) =>
      apiClient.get<{
        user: {
          id: string
          email: string
          firstName: string
          lastName: string
          phone: string | null
          avatar: string | null
          language: string | null
          timezone: string | null
          emailVerified: boolean
          twoFactorEnabled: boolean
        }
        restaurant: {
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
        }
        settings: {
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
          tipsEnabled: boolean
          suggestedTips: number[]
          metaTitle: string | null
          metaDescription: string | null
          metaKeywords: string[]
          termsUrl: string | null
          privacyUrl: string | null
          legalNotice: string | null
        } | null
        deliverySettings: {
          id: string
          isEnabled: boolean
          baseFee: number
          feePerKm: number
          freeDeliveryMin: number | null
          maxDistance: number
          minOrderAmount: number
          avgDeliveryTime: number
          autoAssign: boolean
        } | null
        openingHours: Array<{
          id: string
          dayOfWeek: number
          isOpen: boolean
          slots: Array<{
            id: string
            openTime: string
            closeTime: string
            serviceTypes: string[]
          }>
        }>
        specialHours: Array<{
          id: string
          date: string
          isClosed: boolean
          reason: string | null
          openTime: string | null
          closeTime: string | null
        }>
        theme: {
          id: string
          baseTheme: string
          primaryColor: string
          secondaryColor: string | null
          accentColor: string | null
          backgroundColor: string | null
          textColor: string | null
          headingFont: string | null
          bodyFont: string | null
          layoutStyle: string | null
          headerStyle: string | null
          customCss: string | null
          socialLinks: Record<string, string> | null
          heroTitle: string | null
          heroSubtitle: string | null
          heroCtaText: string | null
          aboutTitle: string | null
          aboutText: string | null
          footerText: string | null
          announcementText: string | null
          announcementActive: boolean
          announcementBgColor: string | null
          logoPosition: string
          showRatings: boolean
          showPrepTime: boolean
          showAllergens: boolean
          showCuisineTypes: boolean
          heroStyle: string
          heroOverlayOpacity: number
          heroImageUrl: string | null
          heroImages: string[] | null
          heroVideoUrl: string | null
          heroCtaLink: string | null
          announcementLink: string | null
          menuStyle: string
          productCardStyle: string
          showProductImages: boolean
          productConfig: Record<string, unknown> | null
          buttonStyle: string
          buttonSize: string
          showAboutPage: boolean
          showContactPage: boolean
          showGallery: boolean
          showTestimonials: boolean
          showNewsletter: boolean
          showMap: boolean
          legalText: string | null
          privacyText: string | null
          navigationConfig: Record<string, unknown> | null
        } | null
        currentStaff: {
          id: string
          role: string
          permissions: string[]
        }
        staffMembers: Array<{
          id: string
          role: string
          position: string | null
          isActive: boolean
          createdAt: string
          user: {
            id: string
            email: string
            firstName: string
            lastName: string
            avatar: string | null
          }
        }>
      }>(restaurantId ? `/restaurant/settings?restaurantId=${restaurantId}` : '/restaurant/settings'),

    getStaff: (restaurantId?: string) =>
      apiClient.get<Array<{
        id: string
        role: string
        position: string | null
        employeeId: string | null
        isActive: boolean
        permissions: string[]
        createdAt: string
        user: {
          id: string
          email: string
          firstName: string
          lastName: string
          avatar: string | null
        }
      }>>(restaurantId ? `/restaurant/settings/staff?restaurantId=${restaurantId}` : '/restaurant/settings/staff'),

    inviteStaff: (data: {
      email: string
      firstName: string
      lastName: string
      role?: string
      position?: string
      restaurantId?: string
    }) => apiClient.post<{
      success: boolean
      message: string
      data: {
        id: string
        role: string
        position: string | null
        isActive: boolean
        user: {
          id: string
          email: string
          firstName: string
          lastName: string
          avatar: string | null
        }
      }
    }>('/restaurant/settings/staff/invite', data),

    updateStaff: (staffId: string, data: {
      role?: string
      isActive?: boolean
      position?: string
    }) => apiClient.put<{
      id: string
      role: string
      position: string | null
      isActive: boolean
      user: {
        id: string
        email: string
        firstName: string
        lastName: string
        avatar: string | null
      }
    }>(`/restaurant/settings/staff/${staffId}`, data),

    deleteStaff: (staffId: string) =>
      apiClient.delete<{ success: boolean; message: string }>(`/restaurant/settings/staff/${staffId}`),

    resendInvite: (staffId: string) =>
      apiClient.post<{ success: boolean; message: string }>(`/restaurant/settings/staff/${staffId}/resend-invite`),

    updateProfile: (data: {
      firstName?: string
      lastName?: string
      phone?: string
      language?: string
      timezone?: string
    }) => apiClient.put<{
      id: string
      email: string
      firstName: string
      lastName: string
      phone: string | null
      language: string | null
      timezone: string | null
    }>('/restaurant/settings/profile', data),

    updateRestaurantInfo: (data: {
      name?: string
      description?: string
      shortDescription?: string
      email?: string
      phone?: string
      website?: string
      address?: string
      addressLine2?: string
      city?: string
      postalCode?: string
      country?: string
      latitude?: number
      longitude?: number
      businessName?: string
      siret?: string
      vatNumber?: string
      businessType?: string
      cuisineTypes?: string[]
      logo?: string
      coverImage?: string
      images?: string[]
      restaurantId?: string
    }) => apiClient.put<{
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
    }>('/restaurant/settings/restaurant', data),

    updateCurrency: (data: { currency: string; restaurantId?: string }) =>
      apiClient.put<{ currency: string }>('/restaurant/settings/currency', data),

    geocodeAddress: (address: string) =>
      apiClient.post<{ latitude: number; longitude: number; displayName: string }>('/restaurant/settings/geocode', { address }),

    reverseGeocodeAddress: (latitude: number, longitude: number) =>
      apiClient.post<{ address: string | null }>('/restaurant/settings/reverse-geocode', { latitude, longitude }),

    canChangeCurrency: (restaurantId?: string) =>
      apiClient.get<{ canChange: boolean; ordersCount: number; message: string }>(
        `/restaurant/settings/currency/can-change${restaurantId ? `?restaurantId=${restaurantId}` : ''}`
      ),

    updateOrderSettings: (data: {
      orderPrefix?: string
      autoAcceptOrders?: boolean
      orderConfirmationEmail?: boolean
      orderNotificationSms?: boolean
      avgPrepTime?: number
      maxOrdersPerSlot?: number
      restaurantId?: string
    }) => apiClient.put<{
      orderPrefix: string
      autoAcceptOrders: boolean
      orderConfirmationEmail: boolean
      orderNotificationSms: boolean
      avgPrepTime: number
      maxOrdersPerSlot: number | null
    }>('/restaurant/settings/orders', data),

    updatePaymentSettings: (data: {
      acceptCash?: boolean
      acceptCard?: boolean
      acceptOnlinePayment?: boolean
      tipsEnabled?: boolean
      suggestedTips?: number[]
      restaurantId?: string
    }) => apiClient.put<{
      acceptCash: boolean
      acceptCard: boolean
      acceptOnlinePayment: boolean
      tipsEnabled: boolean
      suggestedTips: number[]
    }>('/restaurant/settings/payments', data),

    updateDeliverySettings: (data: {
      isEnabled?: boolean
      baseFee?: number
      feePerKm?: number
      freeDeliveryMin?: number
      maxDistance?: number
      minOrderAmount?: number
      avgDeliveryTime?: number
      autoAssign?: boolean
      restaurantId?: string
    }) => apiClient.put<{
      isEnabled: boolean
      baseFee: number
      feePerKm: number
      freeDeliveryMin: number | null
      maxDistance: number
      minOrderAmount: number
      avgDeliveryTime: number
      autoAssign: boolean
    }>('/restaurant/settings/delivery', data),

    // Delivery Zones
    getDeliveryZones: () => apiClient.get<Array<{
      id: string
      name: string
      polygon: Array<{ lat: number; lng: number }>
      deliveryFee: number
      minOrderAmount: number | null
      estimatedTime: number | null
      isActive: boolean
      priority: number
      createdAt: string
      updatedAt: string
    }>>('/restaurant/delivery-zones'),

    createDeliveryZone: (data: {
      name: string
      polygon: Array<{ lat: number; lng: number }>
      addresses?: string[]
      deliveryFee?: number
      minOrderAmount?: number
      estimatedTime?: number
      priority?: number
    }) => apiClient.post<{
      id: string
      name: string
      polygon: Array<{ lat: number; lng: number }>
      addresses: string[] | null
      deliveryFee: number
      minOrderAmount: number | null
      estimatedTime: number | null
      isActive: boolean
      priority: number
      createdAt: string
      updatedAt: string
    }>('/restaurant/delivery-zones', data),

    updateDeliveryZone: (id: string, data: {
      name?: string
      polygon?: Array<{ lat: number; lng: number }>
      addresses?: string[]
      deliveryFee?: number
      minOrderAmount?: number
      estimatedTime?: number
      priority?: number
      isActive?: boolean
    }) => apiClient.put<{
      id: string
      name: string
      polygon: Array<{ lat: number; lng: number }>
      addresses: string[] | null
      deliveryFee: number
      minOrderAmount: number | null
      estimatedTime: number | null
      isActive: boolean
      priority: number
      createdAt: string
      updatedAt: string
    }>(`/restaurant/delivery-zones/${id}`, data),

    deleteDeliveryZone: (id: string) => apiClient.delete<{ message: string }>(`/restaurant/delivery-zones/${id}`),

    toggleDeliveryZone: (id: string) => apiClient.put<{
      id: string
      isActive: boolean
    }>(`/restaurant/delivery-zones/${id}/toggle`, {}),

    checkDeliveryZone: (latitude: number, longitude: number) => apiClient.post<{
      inZone: boolean
      zone: {
        id: string
        name: string
        deliveryFee: number
        minOrderAmount: number | null
        estimatedTime: number | null
      } | null
    }>('/restaurant/delivery-zones/check', { latitude, longitude }),

    // Drivers
    getDrivers: () => apiClient.get<Array<{
      id: string
      userId: string
      user: {
        id: string
        email: string
        firstName: string
        lastName: string
        phone: string | null
        avatar: string | null
      }
      invitePending: boolean
      inviteExpired: boolean
      licenseNumber: string | null
      vehicleType: 'BIKE' | 'SCOOTER' | 'CAR' | 'WALK'
      vehiclePlate: string | null
      isActive: boolean
      isOnline: boolean
      isAvailable: boolean
      currentLatitude: number | null
      currentLongitude: number | null
      lastLocationUpdate: string | null
      totalDeliveries: number
      avgRating: number | null
      currentDeliveryId: string | null
      createdAt: string
      updatedAt: string
    }>>('/restaurant/drivers'),

    resendDriverInvite: (id: string) => apiClient.post<{ message: string }>(`/restaurant/drivers/${id}/resend-invite`),

    getAvailableDrivers: () => apiClient.get<Array<{
      id: string
      user: {
        id: string
        firstName: string
        lastName: string
        phone: string | null
        avatar: string | null
      }
      vehicleType: 'BIKE' | 'SCOOTER' | 'CAR' | 'WALK'
      currentLatitude: number | null
      currentLongitude: number | null
      totalDeliveries: number
      avgRating: number | null
    }>>('/restaurant/drivers/available'),

    createDriver: (data: {
      email: string
      firstName: string
      lastName: string
      phone?: string
      licenseNumber?: string
      vehicleType?: 'BIKE' | 'SCOOTER' | 'CAR' | 'WALK'
      vehiclePlate?: string
    }) => apiClient.post<{
      id: string
      userId: string
      user: {
        id: string
        email: string
        firstName: string
        lastName: string
        phone: string | null
        avatar: string | null
      }
      licenseNumber: string | null
      vehicleType: 'BIKE' | 'SCOOTER' | 'CAR' | 'WALK'
      vehiclePlate: string | null
      isActive: boolean
      isOnline: boolean
      isAvailable: boolean
      totalDeliveries: number
      avgRating: number | null
      createdAt: string
    }>('/restaurant/drivers', data),

    updateDriver: (id: string, data: {
      licenseNumber?: string
      vehicleType?: 'BIKE' | 'SCOOTER' | 'CAR' | 'WALK'
      vehiclePlate?: string
      isActive?: boolean
    }) => apiClient.put<{
      id: string
      licenseNumber: string | null
      vehicleType: 'BIKE' | 'SCOOTER' | 'CAR' | 'WALK'
      vehiclePlate: string | null
      isActive: boolean
      updatedAt: string
    }>(`/restaurant/drivers/${id}`, data),

    deleteDriver: (id: string) => apiClient.delete<{ message: string }>(`/restaurant/drivers/${id}`),

    toggleDriverStatus: (id: string) => apiClient.put<{
      id: string
      isActive: boolean
    }>(`/restaurant/drivers/${id}/status`, {}),

    updateOpeningHours: (openingHours: Array<{
      dayOfWeek: number
      isOpen: boolean
      slots: Array<{
        openTime: string
        closeTime: string
        serviceTypes: string[]
      }>
    }>, restaurantId?: string) => apiClient.put<Array<{
      id: string
      dayOfWeek: number
      isOpen: boolean
      slots: Array<{
        id: string
        openTime: string
        closeTime: string
        serviceTypes: string[]
      }>
    }>>('/restaurant/settings/opening-hours', { openingHours, restaurantId }),

    addSpecialHours: (data: {
      date: string
      isClosed?: boolean
      reason?: string
      openTime?: string
      closeTime?: string
    }) => apiClient.post<{
      id: string
      date: string
      isClosed: boolean
      reason: string | null
      openTime: string | null
      closeTime: string | null
    }>('/restaurant/settings/special-hours', data),

    deleteSpecialHours: (id: string) =>
      apiClient.delete<{ success: boolean }>(`/restaurant/settings/special-hours/${id}`),

    updateTheme: (data: {
      baseTheme?: string
      primaryColor?: string
      secondaryColor?: string
      accentColor?: string
      backgroundColor?: string
      textColor?: string
      headingFont?: string
      bodyFont?: string
      layoutStyle?: string
      headerStyle?: string
      customCss?: string | null
      socialLinks?: Record<string, string>
      heroTitle?: string | null
      heroSubtitle?: string | null
      heroCtaText?: string | null
      aboutTitle?: string | null
      aboutText?: string | null
      footerText?: string | null
      announcementText?: string | null
      announcementActive?: boolean
      announcementBgColor?: string | null
      logoPosition?: string
      showRatings?: boolean
      showPrepTime?: boolean
      showAllergens?: boolean
      showCuisineTypes?: boolean
      heroStyle?: string
      heroOverlayOpacity?: number
      heroImageUrl?: string | null
      heroImages?: string[] | null
      heroVideoUrl?: string | null
      heroCtaLink?: string | null
      announcementLink?: string | null
      menuStyle?: string
      productCardStyle?: string
      showProductImages?: boolean
      productConfig?: Record<string, unknown> | null
      buttonStyle?: string
      buttonSize?: string
      showAboutPage?: boolean
      showContactPage?: boolean
      showGallery?: boolean
      showTestimonials?: boolean
      showNewsletter?: boolean
      showMap?: boolean
      legalText?: string | null
      privacyText?: string | null
      headerDesign?: string
      headerSticky?: boolean
      headerTransparent?: boolean
      headerBgOpacity?: number
      headerTextColor?: string
      footerDesign?: string
      navigationConfig?: Record<string, unknown> | null
      cartConfig?: Record<string, unknown> | null
      restaurantId?: string
    }) => apiClient.put<Record<string, unknown>>('/restaurant/settings/theme', data),

    updateSeo: (data: {
      metaTitle?: string
      metaDescription?: string
      metaKeywords?: string[]
      termsUrl?: string
      privacyUrl?: string
      legalNotice?: string
    }) => apiClient.put<{
      metaTitle: string | null
      metaDescription: string | null
      metaKeywords: string[]
      termsUrl: string | null
      privacyUrl: string | null
      legalNotice: string | null
    }>('/restaurant/settings/seo', data),

    updatePassword: (data: {
      currentPassword: string
      newPassword: string
    }) => apiClient.put<{ success: boolean; message: string }>('/restaurant/settings/security/password', data),

    moneroo: {
      get: () => apiClient.get<{
        secretKey: string
        webhookSecret: string
        isConfigured: boolean
        hasSecretKey: boolean
        hasWebhookSecret: boolean
      }>('/restaurant/settings/moneroo'),

      update: (data: { secretKey?: string; webhookSecret?: string }) =>
        apiClient.put<{ success: boolean; message: string }>('/restaurant/settings/moneroo', data),

      test: () =>
        apiClient.post<{ success: boolean; message: string }>('/restaurant/settings/moneroo/test'),

      delete: () =>
        apiClient.delete<{ success: boolean; message: string }>('/restaurant/settings/moneroo'),
    },

    categories: {
      list: (restaurantId?: string) => apiClient.get<Array<{
        id: string
        name: string
        nameEn: string | null
        slug: string
        description: string | null
        image: string | null
        parentId: string | null
        sortOrder: number
        isActive: boolean
        isVisible: boolean
        productsCount: number
        children: Array<{
          id: string
          name: string
          slug: string
          isActive: boolean
          sortOrder: number
        }>
        createdAt: string
        updatedAt: string
      }>>(restaurantId ? `/restaurant/categories?restaurantId=${restaurantId}` : '/restaurant/categories'),

      get: (id: string) => apiClient.get<{
        id: string
        name: string
        nameEn: string | null
        slug: string
        description: string | null
        image: string | null
        parentId: string | null
        parent: { id: string; name: string; slug: string } | null
        sortOrder: number
        isActive: boolean
        isVisible: boolean
        productsCount: number
        children: Array<{
          id: string
          name: string
          slug: string
          isActive: boolean
          sortOrder: number
        }>
        products: Array<{
          id: string
          name: string
          slug: string
          price: number
          image: string | null
          isActive: boolean
        }>
        createdAt: string
        updatedAt: string
      }>(`/restaurant/categories/${id}`),

      create: (data: {
        name: string
        nameEn?: string
        description?: string
        image?: string | null
        parentId?: string | null
        isActive?: boolean
        isVisible?: boolean
        restaurantId?: string
      }) => apiClient.post<{
        id: string
        name: string
        nameEn: string | null
        slug: string
        description: string | null
        image: string | null
        parentId: string | null
        sortOrder: number
        isActive: boolean
        isVisible: boolean
        createdAt: string
        updatedAt: string
      }>('/restaurant/categories', data),

      update: (id: string, data: {
        name?: string
        nameEn?: string
        description?: string
        image?: string | null
        parentId?: string | null
        isActive?: boolean
        isVisible?: boolean
        restaurantId?: string
      }) => apiClient.put<{
        id: string
        name: string
        nameEn: string | null
        slug: string
        description: string | null
        image: string | null
        parentId: string | null
        sortOrder: number
        isActive: boolean
        isVisible: boolean
        createdAt: string
        updatedAt: string
      }>(`/restaurant/categories/${id}`, data),

      delete: (id: string) =>
        apiClient.delete<{ success: boolean; message: string }>(`/restaurant/categories/${id}`),

      reorder: (categoryIds: string[]) =>
        apiClient.patch<{ success: boolean; message: string }>('/restaurant/categories/reorder', { categoryIds }),

      toggle: (id: string) =>
        apiClient.patch<{ id: string; isActive: boolean }>(`/restaurant/categories/${id}/toggle`),
    },

    products: {
      list: (params?: {
        restaurantId?: string
        categoryId?: string
        search?: string
        isActive?: boolean
        isFeatured?: boolean
        page?: number
        limit?: number
      }) => {
        const searchParams = new URLSearchParams()
        if (params?.restaurantId) searchParams.append('restaurantId', params.restaurantId)
        if (params?.categoryId) searchParams.append('categoryId', params.categoryId)
        if (params?.search) searchParams.append('search', params.search)
        if (params?.isActive !== undefined) searchParams.append('isActive', String(params.isActive))
        if (params?.isFeatured !== undefined) searchParams.append('isFeatured', String(params.isFeatured))
        if (params?.page) searchParams.append('page', String(params.page))
        if (params?.limit) searchParams.append('limit', String(params.limit))
        const query = searchParams.toString()
        return apiClient.get<Array<{
            id: string
            name: string
            nameEn: string | null
            slug: string
            description: string | null
            price: number
            compareAtPrice: number | null
            categoryId: string
            category: { id: string; name: string; slug: string }
            image: string | null
            trackInventory: boolean
            stockQuantity: number
            isActive: boolean
            isVisible: boolean
            isFeatured: boolean
            sortOrder: number
            variantsCount: number
            modifierGroupsCount: number
            variants: Array<{
              id: string
              name: string
              price: number
              stockQuantity: number
              isActive: boolean
            }>
            createdAt: string
            updatedAt: string
          }>>(`/restaurant/products${query ? `?${query}` : ''}`)
      },

      get: (id: string) => apiClient.get<{
        id: string
        name: string
        nameEn: string | null
        slug: string
        description: string | null
        descriptionEn: string | null
        price: number
        compareAtPrice: number | null
        costPrice: number | null
        categoryId: string
        category: { id: string; name: string; slug: string }
        taxRateId: string | null
        taxRate: { id: string; name: string; rate: number } | null
        taxIncluded: boolean
        image: string | null
        images: string[]
        trackInventory: boolean
        stockQuantity: number
        lowStockAlert: number | null
        sku: string | null
        barcode: string | null
        calories: number | null
        allergens: string[]
        dietaryTags: string[]
        isActive: boolean
        isVisible: boolean
        isFeatured: boolean
        prepTime: number | null
        sortOrder: number
        variants: Array<{
          id: string
          name: string
          nameEn: string | null
          price: number
          compareAtPrice: number | null
          costPrice: number | null
          sku: string | null
          barcode: string | null
          trackInventory: boolean
          stockQuantity: number
          image: string | null
          isActive: boolean
          sortOrder: number
        }>
        modifierGroups: Array<{
          id: string
          name: string
          nameEn: string | null
          type: 'SINGLE' | 'MULTIPLE' | 'OPTIONAL'
          minSelections: number
          maxSelections: number | null
          isRequired: boolean
          isActive: boolean
          sortOrder: number
          modifiers: Array<{
            id: string
            name: string
            nameEn: string | null
            price: number
            isDefault: boolean
            isActive: boolean
            sortOrder: number
          }>
        }>
        createdAt: string
        updatedAt: string
      }>(`/restaurant/products/${id}`),

      create: (data: {
        name: string
        nameEn?: string
        description?: string
        descriptionEn?: string
        price: number
        compareAtPrice?: number | null
        costPrice?: number | null
        categoryId: string
        taxRateId?: string | null
        taxIncluded?: boolean
        image?: string | null
        images?: string[]
        trackInventory?: boolean
        stockQuantity?: number
        lowStockAlert?: number | null
        sku?: string | null
        barcode?: string | null
        calories?: number | null
        allergens?: string[]
        dietaryTags?: string[]
        isActive?: boolean
        isVisible?: boolean
        isFeatured?: boolean
        prepTime?: number | null
        modifierGroupIds?: string[]
        recipeId?: string | null
        restaurantId?: string
      }) => apiClient.post<{
        id: string
        name: string
        slug: string
        price: number
        categoryId: string
        category: { id: string; name: string; slug: string }
        isActive: boolean
        createdAt: string
      }>('/restaurant/products', data),

      update: (id: string, data: {
        name?: string
        nameEn?: string
        description?: string
        descriptionEn?: string
        price?: number
        compareAtPrice?: number | null
        costPrice?: number | null
        categoryId?: string
        taxRateId?: string | null
        taxIncluded?: boolean
        image?: string | null
        images?: string[]
        trackInventory?: boolean
        stockQuantity?: number
        lowStockAlert?: number | null
        sku?: string | null
        barcode?: string | null
        calories?: number | null
        allergens?: string[]
        dietaryTags?: string[]
        isActive?: boolean
        isVisible?: boolean
        isFeatured?: boolean
        prepTime?: number | null
        modifierGroupIds?: string[]
        recipeId?: string | null
        restaurantId?: string
      }) => apiClient.put<{
        id: string
        name: string
        slug: string
        price: number
        categoryId: string
        category: { id: string; name: string; slug: string }
        isActive: boolean
        updatedAt: string
      }>(`/restaurant/products/${id}`, data),

      delete: (id: string) =>
        apiClient.delete<{ success: boolean; message: string }>(`/restaurant/products/${id}`),

      duplicate: (id: string) =>
        apiClient.post<{
          id: string
          name: string
          slug: string
          price: number
          categoryId: string
          category: { id: string; name: string; slug: string }
          isActive: boolean
          createdAt: string
        }>(`/restaurant/products/${id}/duplicate`),

      toggle: (id: string) =>
        apiClient.patch<{ id: string; isActive: boolean }>(`/restaurant/products/${id}/toggle`),

      updateStock: (id: string, stockQuantity: number) =>
        apiClient.patch<{ id: string; stockQuantity: number }>(`/restaurant/products/${id}/stock`, { stockQuantity }),
    },

    variants: {
      create: (productId: string, data: {
        name: string
        nameEn?: string
        price: number
        compareAtPrice?: number | null
        costPrice?: number | null
        sku?: string | null
        barcode?: string | null
        trackInventory?: boolean
        stockQuantity?: number
        image?: string | null
        isActive?: boolean
      }) => apiClient.post<{
        id: string
        name: string
        price: number
        stockQuantity: number
        isActive: boolean
        sortOrder: number
      }>(`/restaurant/products/${productId}/variants`, data),

      update: (productId: string, variantId: string, data: {
        name?: string
        nameEn?: string
        price?: number
        compareAtPrice?: number | null
        costPrice?: number | null
        sku?: string | null
        barcode?: string | null
        trackInventory?: boolean
        stockQuantity?: number
        image?: string | null
        isActive?: boolean
      }) => apiClient.put<{
        id: string
        name: string
        price: number
        stockQuantity: number
        isActive: boolean
      }>(`/restaurant/products/${productId}/variants/${variantId}`, data),

      delete: (productId: string, variantId: string) =>
        apiClient.delete<{ success: boolean; message: string }>(`/restaurant/products/${productId}/variants/${variantId}`),
    },

    modifiers: {
      list: (restaurantId?: string) => apiClient.get<Array<{
        id: string
        name: string
        nameEn: string | null
        type: 'SINGLE' | 'MULTIPLE' | 'OPTIONAL'
        minSelections: number
        maxSelections: number | null
        isRequired: boolean
        isActive: boolean
        productsCount: number
        modifiers: Array<{
          id: string
          name: string
          nameEn: string | null
          price: number
          isDefault: boolean
          isActive: boolean
          sortOrder: number
        }>
        createdAt: string
        updatedAt: string
      }>>(restaurantId ? `/restaurant/modifiers?restaurantId=${restaurantId}` : '/restaurant/modifiers'),

      get: (id: string) => apiClient.get<{
        id: string
        name: string
        nameEn: string | null
        type: 'SINGLE' | 'MULTIPLE' | 'OPTIONAL'
        minSelections: number
        maxSelections: number | null
        isRequired: boolean
        isActive: boolean
        modifiers: Array<{
          id: string
          name: string
          nameEn: string | null
          price: number
          isDefault: boolean
          isActive: boolean
          sortOrder: number
        }>
        products: Array<{
          id: string
          name: string
          slug: string
          image: string | null
        }>
        createdAt: string
        updatedAt: string
      }>(`/restaurant/modifiers/${id}`),

      create: (data: {
        name: string
        nameEn?: string
        type?: 'SINGLE' | 'MULTIPLE' | 'OPTIONAL'
        minSelections?: number
        maxSelections?: number | null
        isRequired?: boolean
        isActive?: boolean
        modifiers?: Array<{
          name: string
          nameEn?: string
          price?: number
          isDefault?: boolean
          isActive?: boolean
        }>
        restaurantId?: string
      }) => apiClient.post<{
        id: string
        name: string
        nameEn: string | null
        type: 'SINGLE' | 'MULTIPLE' | 'OPTIONAL'
        minSelections: number
        maxSelections: number | null
        isRequired: boolean
        isActive: boolean
        modifiers: Array<{
          id: string
          name: string
          nameEn: string | null
          price: number
          isDefault: boolean
          isActive: boolean
          sortOrder: number
        }>
        createdAt: string
      }>('/restaurant/modifiers', data),

      update: (id: string, data: {
        name?: string
        nameEn?: string | null
        type?: 'SINGLE' | 'MULTIPLE' | 'OPTIONAL'
        minSelections?: number
        maxSelections?: number | null
        isRequired?: boolean
        isActive?: boolean
        restaurantId?: string
      }) => apiClient.put<{
        id: string
        name: string
        nameEn: string | null
        type: 'SINGLE' | 'MULTIPLE' | 'OPTIONAL'
        minSelections: number
        maxSelections: number | null
        isRequired: boolean
        isActive: boolean
        modifiers: Array<{
          id: string
          name: string
          nameEn: string | null
          price: number
          isDefault: boolean
          isActive: boolean
          sortOrder: number
        }>
        updatedAt: string
      }>(`/restaurant/modifiers/${id}`, data),

      delete: (id: string) =>
        apiClient.delete<{ success: boolean; message: string }>(`/restaurant/modifiers/${id}`),

      toggle: (id: string) =>
        apiClient.patch<{ id: string; isActive: boolean }>(`/restaurant/modifiers/${id}/toggle`),

      addItem: (groupId: string, data: {
        name: string
        nameEn?: string
        price?: number
        isDefault?: boolean
        isActive?: boolean
      }) => apiClient.post<{
        id: string
        name: string
        nameEn: string | null
        price: number
        isDefault: boolean
        isActive: boolean
        sortOrder: number
      }>(`/restaurant/modifiers/${groupId}/items`, data),

      updateItem: (groupId: string, itemId: string, data: {
        name?: string
        nameEn?: string
        price?: number
        isDefault?: boolean
        isActive?: boolean
      }) => apiClient.put<{
        id: string
        name: string
        nameEn: string | null
        price: number
        isDefault: boolean
        isActive: boolean
        sortOrder: number
      }>(`/restaurant/modifiers/${groupId}/items/${itemId}`, data),

      deleteItem: (groupId: string, itemId: string) =>
        apiClient.delete<{ success: boolean; message: string }>(`/restaurant/modifiers/${groupId}/items/${itemId}`),

      reorderItems: (groupId: string, modifierIds: string[]) =>
        apiClient.patch<{ success: boolean; message: string }>(`/restaurant/modifiers/${groupId}/items/reorder`, { modifierIds }),
    },

    // Customers
    customers: {
      list: (params?: {
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
        restaurantId?: string
      }) => {
        const queryParams = new URLSearchParams()
        if (params?.search) queryParams.append('search', params.search)
        if (params?.status) queryParams.append('status', params.status)
        if (params?.tags) queryParams.append('tags', params.tags)
        if (params?.minOrders !== undefined) queryParams.append('minOrders', String(params.minOrders))
        if (params?.maxOrders !== undefined) queryParams.append('maxOrders', String(params.maxOrders))
        if (params?.minSpent !== undefined) queryParams.append('minSpent', String(params.minSpent))
        if (params?.maxSpent !== undefined) queryParams.append('maxSpent', String(params.maxSpent))
        if (params?.lastOrderAfter) queryParams.append('lastOrderAfter', params.lastOrderAfter)
        if (params?.lastOrderBefore) queryParams.append('lastOrderBefore', params.lastOrderBefore)
        if (params?.createdAfter) queryParams.append('createdAfter', params.createdAfter)
        if (params?.createdBefore) queryParams.append('createdBefore', params.createdBefore)
        if (params?.marketingOptIn !== undefined) queryParams.append('marketingOptIn', String(params.marketingOptIn))
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)
        if (params?.page) queryParams.append('page', String(params.page))
        if (params?.limit) queryParams.append('limit', String(params.limit))
        if (params?.restaurantId) queryParams.append('restaurantId', params.restaurantId)
        const query = queryParams.toString()
        return apiClient.get<Array<{
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
        }>>(`/restaurant/customers${query ? `?${query}` : ''}`)
      },

      get: (id: string, restaurantId?: string) =>
        apiClient.get<{
          id: string
          email: string
          firstName: string
          lastName: string
          phone: string | null
          addresses: Array<{
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
          }>
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
        }>(restaurantId ? `/restaurant/customers/${id}?restaurantId=${restaurantId}` : `/restaurant/customers/${id}`),

      getStats: (restaurantId?: string) =>
        apiClient.get<{
          total: number
          newThisMonth: number
          newLastMonth: number
          growthPercent: number
          activeCustomers: number
          avgOrderValue: number
          uniqueTags: string[]
        }>(restaurantId ? `/restaurant/customers/stats?restaurantId=${restaurantId}` : '/restaurant/customers/stats'),

      getOrders: (id: string, params?: { page?: number; limit?: number; restaurantId?: string }) => {
        const queryParams = new URLSearchParams()
        if (params?.page) queryParams.append('page', String(params.page))
        if (params?.limit) queryParams.append('limit', String(params.limit))
        if (params?.restaurantId) queryParams.append('restaurantId', params.restaurantId)
        const query = queryParams.toString()
        return apiClient.get<Array<{
          id: string
          orderNumber: string
          displayNumber: string
          status: string
          serviceType: string
          paymentStatus: string
          subtotal: number
          total: number
          createdAt: string
        }>>(`/restaurant/customers/${id}/orders${query ? `?${query}` : ''}`)
      },

      create: (data: {
        email: string
        firstName: string
        lastName: string
        phone?: string | null
        marketingOptIn?: boolean
        tags?: string[]
        notes?: string | null
        restaurantId?: string
      }) => apiClient.post<{
        id: string
        email: string
        firstName: string
        lastName: string
        phone: string | null
        marketingOptIn: boolean
        tags: string[]
        isActive: boolean
        createdAt: string
      }>('/restaurant/customers', data),

      update: (id: string, data: {
        email?: string
        firstName?: string
        lastName?: string
        phone?: string | null
        marketingOptIn?: boolean
        tags?: string[]
        notes?: string | null
        restaurantId?: string
      }) => apiClient.put<{
        id: string
        email: string
        firstName: string
        lastName: string
        phone: string | null
        marketingOptIn: boolean
        tags: string[]
        isActive: boolean
        updatedAt: string
      }>(`/restaurant/customers/${id}`, data),

      delete: (id: string) =>
        apiClient.delete<{ success: boolean; message: string }>(`/restaurant/customers/${id}`),

      toggle: (id: string) =>
        apiClient.patch<{ id: string; isActive: boolean }>(`/restaurant/customers/${id}/toggle`),

      addNote: (id: string, content: string, restaurantId?: string) =>
        apiClient.post<{ notes: string }>(
          restaurantId ? `/restaurant/customers/${id}/notes?restaurantId=${restaurantId}` : `/restaurant/customers/${id}/notes`,
          { content }
        ),

      updateTags: (id: string, tags: string[], restaurantId?: string) =>
        apiClient.put<{ id: string; tags: string[] }>(
          restaurantId ? `/restaurant/customers/${id}/tags?restaurantId=${restaurantId}` : `/restaurant/customers/${id}/tags`,
          { tags }
        ),

      addAddress: (customerId: string, data: {
        label?: string | null
        street: string
        streetLine2?: string | null
        city: string
        postalCode: string
        country?: string
        latitude?: number | null
        longitude?: number | null
        instructions?: string | null
        isDefault?: boolean
        restaurantId?: string
      }) => apiClient.post<{
        id: string
        label: string | null
        street: string
        streetLine2: string | null
        city: string
        postalCode: string
        country: string
        isDefault: boolean
      }>(`/restaurant/customers/${customerId}/addresses`, data),

      deleteAddress: (customerId: string, addressId: string) =>
        apiClient.delete<{ success: boolean; message: string }>(`/restaurant/customers/${customerId}/addresses/${addressId}`),

      export: (params?: {
        format?: 'csv' | 'json'
        columns?: string
        restaurantId?: string
      }) => {
        const queryParams = new URLSearchParams()
        if (params?.format) queryParams.append('format', params.format)
        if (params?.columns) queryParams.append('columns', params.columns)
        if (params?.restaurantId) queryParams.append('restaurantId', params.restaurantId)
        const query = queryParams.toString()
        return apiClient.get<any>(`/restaurant/customers/export${query ? `?${query}` : ''}`)
      },
    },

    ingredients: {
      list: (params?: {
        search?: string
        category?: string
        supplierId?: string
        lowStock?: boolean
        isTracked?: boolean
        sortBy?: string
        sortOrder?: 'asc' | 'desc'
        page?: number
        limit?: number
        restaurantId?: string
      }) => {
        const queryParams = new URLSearchParams()
        if (params?.search) queryParams.append('search', params.search)
        if (params?.category) queryParams.append('category', params.category)
        if (params?.supplierId) queryParams.append('supplierId', params.supplierId)
        if (params?.lowStock) queryParams.append('lowStock', 'true')
        if (params?.isTracked !== undefined) queryParams.append('isTracked', String(params.isTracked))
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)
        if (params?.page) queryParams.append('page', String(params.page))
        if (params?.limit) queryParams.append('limit', String(params.limit))
        if (params?.restaurantId) queryParams.append('restaurantId', params.restaurantId)
        const query = queryParams.toString()
        return apiClient.get<any>(`/restaurant/ingredients${query ? `?${query}` : ''}`)
      },

      get: (id: string, restaurantId?: string) =>
        apiClient.get<any>(restaurantId ? `/restaurant/ingredients/${id}?restaurantId=${restaurantId}` : `/restaurant/ingredients/${id}`),

      getCategories: (restaurantId?: string) =>
        apiClient.get<string[]>(restaurantId ? `/restaurant/ingredients/categories?restaurantId=${restaurantId}` : '/restaurant/ingredients/categories'),

      getLowStock: (restaurantId?: string) =>
        apiClient.get<any[]>(restaurantId ? `/restaurant/ingredients/low-stock?restaurantId=${restaurantId}` : '/restaurant/ingredients/low-stock'),

      getStats: (restaurantId?: string) =>
        apiClient.get<any>(restaurantId ? `/restaurant/ingredients/stats?restaurantId=${restaurantId}` : '/restaurant/ingredients/stats'),

      create: (data: any) =>
        apiClient.post<any>('/restaurant/ingredients', data),

      update: (id: string, data: any) =>
        apiClient.put<any>(`/restaurant/ingredients/${id}`, data),

      delete: (id: string) =>
        apiClient.delete<{ success: boolean; message: string }>(`/restaurant/ingredients/${id}`),

      adjustStock: (id: string, data: {
        quantity: number
        type: string
        reason?: string | null
        notes?: string | null
        unitCost?: number | null
        reference?: string | null
        referenceType?: string | null
      }) => apiClient.patch<any>(`/restaurant/ingredients/${id}/stock`, data),

      addSupplier: (id: string, data: {
        supplierId: string
        unitCost: number
        isPreferred?: boolean
        leadTimeDays?: number | null
        minOrderQty?: number | null
      }) => apiClient.post<any>(`/restaurant/ingredients/${id}/suppliers`, data),

      removeSupplier: (ingredientId: string, supplierId: string) =>
        apiClient.delete<{ success: boolean; message: string }>(`/restaurant/ingredients/${ingredientId}/suppliers/${supplierId}`),
    },

    suppliers: {
      list: (params?: {
        search?: string
        isActive?: boolean
        sortBy?: string
        sortOrder?: 'asc' | 'desc'
        page?: number
        limit?: number
        restaurantId?: string
      }) => {
        const queryParams = new URLSearchParams()
        if (params?.search) queryParams.append('search', params.search)
        if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive))
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)
        if (params?.page) queryParams.append('page', String(params.page))
        if (params?.limit) queryParams.append('limit', String(params.limit))
        if (params?.restaurantId) queryParams.append('restaurantId', params.restaurantId)
        const query = queryParams.toString()
        return apiClient.get<any>(`/restaurant/suppliers${query ? `?${query}` : ''}`)
      },

      get: (id: string, restaurantId?: string) =>
        apiClient.get<any>(restaurantId ? `/restaurant/suppliers/${id}?restaurantId=${restaurantId}` : `/restaurant/suppliers/${id}`),

      getStats: (restaurantId?: string) =>
        apiClient.get<any>(restaurantId ? `/restaurant/suppliers/stats?restaurantId=${restaurantId}` : '/restaurant/suppliers/stats'),

      create: (data: any) =>
        apiClient.post<any>('/restaurant/suppliers', data),

      update: (id: string, data: any) =>
        apiClient.put<any>(`/restaurant/suppliers/${id}`, data),

      delete: (id: string) =>
        apiClient.delete<{ success: boolean; message: string }>(`/restaurant/suppliers/${id}`),

      toggle: (id: string) =>
        apiClient.patch<{ id: string; isActive: boolean }>(`/restaurant/suppliers/${id}/toggle`),
    },

    stockMovements: {
      list: (params?: {
        ingredientId?: string
        type?: string
        dateFrom?: string
        dateTo?: string
        search?: string
        sortBy?: string
        sortOrder?: 'asc' | 'desc'
        page?: number
        limit?: number
        restaurantId?: string
      }) => {
        const queryParams = new URLSearchParams()
        if (params?.ingredientId) queryParams.append('ingredientId', params.ingredientId)
        if (params?.type) queryParams.append('type', params.type)
        if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
        if (params?.dateTo) queryParams.append('dateTo', params.dateTo)
        if (params?.search) queryParams.append('search', params.search)
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)
        if (params?.page) queryParams.append('page', String(params.page))
        if (params?.limit) queryParams.append('limit', String(params.limit))
        if (params?.restaurantId) queryParams.append('restaurantId', params.restaurantId)
        const query = queryParams.toString()
        return apiClient.get<any>(`/restaurant/stock-movements${query ? `?${query}` : ''}`)
      },

      get: (id: string, restaurantId?: string) =>
        apiClient.get<any>(restaurantId ? `/restaurant/stock-movements/${id}?restaurantId=${restaurantId}` : `/restaurant/stock-movements/${id}`),

      getSummary: (period?: number, restaurantId?: string) => {
        const queryParams = new URLSearchParams()
        if (period) queryParams.append('period', String(period))
        if (restaurantId) queryParams.append('restaurantId', restaurantId)
        const query = queryParams.toString()
        return apiClient.get<any>(`/restaurant/stock-movements/summary${query ? `?${query}` : ''}`)
      },

      create: (data: any) =>
        apiClient.post<any>('/restaurant/stock-movements', data),

      createBulk: (data: {
        type: string
        reason?: string | null
        notes?: string | null
        items: { ingredientId: string; quantity: number; unitCost?: number | null }[]
      }) => apiClient.post<any>('/restaurant/stock-movements/bulk', data),
    },

    recipes: {
      list: (params?: {
        search?: string
        isActive?: boolean
        hasProduct?: boolean
        sortBy?: string
        sortOrder?: 'asc' | 'desc'
        page?: number
        limit?: number
        restaurantId?: string
      }) => {
        const queryParams = new URLSearchParams()
        if (params?.search) queryParams.append('search', params.search)
        if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive))
        if (params?.hasProduct !== undefined) queryParams.append('hasProduct', String(params.hasProduct))
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)
        if (params?.page) queryParams.append('page', String(params.page))
        if (params?.limit) queryParams.append('limit', String(params.limit))
        if (params?.restaurantId) queryParams.append('restaurantId', params.restaurantId)
        const query = queryParams.toString()
        return apiClient.get<any>(`/restaurant/recipes${query ? `?${query}` : ''}`)
      },

      get: (id: string, restaurantId?: string) =>
        apiClient.get<any>(restaurantId ? `/restaurant/recipes/${id}?restaurantId=${restaurantId}` : `/restaurant/recipes/${id}`),

      getStats: (restaurantId?: string) =>
        apiClient.get<any>(restaurantId ? `/restaurant/recipes/stats?restaurantId=${restaurantId}` : '/restaurant/recipes/stats'),

      create: (data: any) =>
        apiClient.post<any>('/restaurant/recipes', data),

      update: (id: string, data: any) =>
        apiClient.put<any>(`/restaurant/recipes/${id}`, data),

      delete: (id: string) =>
        apiClient.delete<{ success: boolean; message: string }>(`/restaurant/recipes/${id}`),

      toggle: (id: string) =>
        apiClient.patch<{ id: string; isActive: boolean }>(`/restaurant/recipes/${id}/toggle`),

      recalculate: (id: string) =>
        apiClient.post<any>(`/restaurant/recipes/${id}/recalculate`),

      duplicate: (id: string, name?: string) =>
        apiClient.post<any>(`/restaurant/recipes/${id}/duplicate`, { name }),
    },

    receipts: {
      list: (params?: {
        page?: number
        limit?: number
        type?: 'TICKET' | 'INVOICE_SIMPLE' | 'INVOICE_FULL'
        startDate?: string
        endDate?: string
        search?: string
        restaurantId?: string
      }) => {
        const queryParams = new URLSearchParams()
        if (params?.page) queryParams.append('page', String(params.page))
        if (params?.limit) queryParams.append('limit', String(params.limit))
        if (params?.type) queryParams.append('type', params.type)
        if (params?.startDate) queryParams.append('startDate', params.startDate)
        if (params?.endDate) queryParams.append('endDate', params.endDate)
        if (params?.search) queryParams.append('search', params.search)
        if (params?.restaurantId) queryParams.append('restaurantId', params.restaurantId)
        const query = queryParams.toString()
        return apiClient.get<any>(`/restaurant/receipts${query ? `?${query}` : ''}`)
      },

      get: (id: string, restaurantId?: string) =>
        apiClient.get<any>(restaurantId ? `/restaurant/receipts/${id}?restaurantId=${restaurantId}` : `/restaurant/receipts/${id}`),

      getHtml: async (id: string): Promise<string> => {
        const token = apiClient.getAccessToken()
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/restaurant/receipts/${id}/html`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        )
        if (!response.ok) throw new Error('Failed to fetch receipt HTML')
        return response.text()
      },

      getPdfUrl: (id: string) =>
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/restaurant/receipts/${id}/pdf`,

      downloadPdf: async (id: string, filename?: string): Promise<void> => {
        const token = apiClient.getAccessToken()
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/restaurant/receipts/${id}/pdf`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        )
        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: 'Erreur lors du téléchargement' }))
          throw new Error(error.message || 'Erreur lors du téléchargement du PDF')
        }
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename || `recu-${id}.pdf`
        a.click()
        URL.revokeObjectURL(url)
      },

      createForOrder: (orderId: string, data?: { type?: 'TICKET' | 'INVOICE_SIMPLE' | 'INVOICE_FULL'; templateId?: string }) =>
        apiClient.post<any>(`/restaurant/receipts/orders/${orderId}/receipt`, data || {}),

      getForOrder: (orderId: string) =>
        apiClient.get<any>(`/restaurant/receipts/orders/${orderId}/receipt`),

      void: (id: string, reason: string) =>
        apiClient.post<any>(`/restaurant/receipts/${id}/void`, { reason }),

      markAsPrinted: (id: string) =>
        apiClient.post<any>(`/restaurant/receipts/${id}/print`),

      sendByEmail: (id: string, email: string) =>
        apiClient.post<any>(`/restaurant/receipts/${id}/email`, { email }),

      getThermalCommands: (id: string, options?: { printerHost?: string; printerPort?: number; width?: '58mm' | '80mm' }) =>
        apiClient.post<{ commands?: string; width?: string; printed?: boolean; message?: string }>(
          `/restaurant/receipts/${id}/thermal`,
          options || {}
        ),

      getThermalPreview: async (id: string, width?: '58mm' | '80mm'): Promise<string> => {
        const token = apiClient.getAccessToken()
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/restaurant/receipts/${id}/thermal/preview${width ? `?width=${width}` : ''}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        )
        if (!response.ok) throw new Error('Failed to fetch thermal preview')
        return response.text()
      },

      // Templates
      getTemplates: (restaurantId?: string) =>
        apiClient.get<any>(restaurantId ? `/restaurant/receipts/templates?restaurantId=${restaurantId}` : '/restaurant/receipts/templates'),

      getTemplatePreviewUrl: (templateId: string) =>
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/restaurant/receipts/templates/${templateId}/preview`,

      getTemplatePreviewHtml: async (templateId: string): Promise<string> => {
        const token = apiClient.getAccessToken()
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/restaurant/receipts/templates/${templateId}/preview`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        )
        if (!response.ok) throw new Error('Failed to fetch template preview')
        return response.text()
      },

      // Settings
      getSettings: (restaurantId?: string) =>
        apiClient.get<any>(restaurantId ? `/restaurant/receipts/settings?restaurantId=${restaurantId}` : '/restaurant/receipts/settings'),

      updateSettings: (data: {
        ticketTemplateId?: string
        invoiceSimpleTemplateId?: string
        invoiceFullTemplateId?: string
        logo?: string
        thankYouMessage?: string
        footerText?: string
        showQrCode?: boolean
        qrCodeType?: string
        qrCodeCustomUrl?: string
        autoPrintOnOrder?: boolean
        autoEmailOnOrder?: boolean
        defaultReceiptType?: 'TICKET' | 'INVOICE_SIMPLE' | 'INVOICE_FULL'
        receiptPrefix?: string
      }) => apiClient.patch<any>('/restaurant/receipts/settings', data),
    },

    site: {
      getOverview: () =>
        apiClient.get<{
          site: {
            id: string
            subdomain: string
            customDomain: string | null
            status: string
            publishedAt: string | null
            expiresAt: string | null
          } | null
          theme: {
            id: string
            baseTheme: string
            primaryColor: string
          } | null
          stats: {
            banners: number
            pages: number
            messages: number
            unreadMessages: number
          }
        }>('/restaurant/site'),

      banners: {
        list: () =>
          apiClient.get<Array<{
            id: string
            displayType: string
            contentMode: string
            title: string | null
            subtitle: string | null
            image: string | null
            ctaText: string | null
            ctaLink: string | null
            couponId: string | null
            coupon: {
              id: string
              code: string
              description: string | null
              discountType: string
              discountValue: string
              isActive: boolean
            } | null
            isActive: boolean
            sortOrder: number
            pages: string[]
            position: string
            dismissable: boolean
            sticky: boolean
            styles: Record<string, unknown> | null
            startDate: string | null
            endDate: string | null
            createdAt: string
          }>>('/restaurant/site/banners'),

        coupons: () =>
          apiClient.get<Array<{
            id: string
            code: string
            description: string | null
            discountType: string
            discountValue: string
            endDate: string | null
          }>>('/restaurant/site/banners/coupons'),

        create: (data: {
          displayType?: string
          contentMode?: string
          title?: string
          subtitle?: string
          image?: string
          ctaText?: string
          ctaLink?: string
          couponId?: string
          isActive?: boolean
          pages?: string[]
          position?: string
          dismissable?: boolean
          sticky?: boolean
          styles?: Record<string, unknown>
          startDate?: string
          endDate?: string
        }) => apiClient.post<{
          id: string
          displayType: string
          contentMode: string
          title: string | null
          subtitle: string | null
          image: string | null
          isActive: boolean
          sortOrder: number
          pages: string[]
          position: string
        }>('/restaurant/site/banners', data),

        update: (id: string, data: {
          displayType?: string
          contentMode?: string
          title?: string
          subtitle?: string
          image?: string | null
          ctaText?: string
          ctaLink?: string
          couponId?: string | null
          isActive?: boolean
          pages?: string[]
          position?: string
          dismissable?: boolean
          sticky?: boolean
          styles?: Record<string, unknown> | null
          startDate?: string
          endDate?: string
        }) => apiClient.put<{
          id: string
          displayType: string
          contentMode: string
          title: string | null
          subtitle: string | null
          image: string | null
          pages: string[]
          position: string
        }>(`/restaurant/site/banners/${id}`, data),

        delete: (id: string) =>
          apiClient.delete<{ success: boolean }>(`/restaurant/site/banners/${id}`),

        reorder: (orderedIds: string[]) =>
          apiClient.patch<{ success: boolean }>('/restaurant/site/banners/reorder', { orderedIds }),
      },

      pages: {
        list: () =>
          apiClient.get<Array<{
            id: string
            slug: string
            title: string
            content: string
            isDefault: boolean
            pageType: string | null
            isActive: boolean
            sortOrder: number
            showInNav: boolean
            sections: Record<string, Record<string, unknown>> | null
            metaTitle: string | null
            metaDescription: string | null
            views: number
            createdAt: string
            updatedAt: string
          }>>('/restaurant/site/pages'),

        create: (data: {
          slug: string
          title: string
          content: string
          isActive?: boolean
          showInNav?: boolean
          metaTitle?: string
          metaDescription?: string
          sections?: Record<string, Record<string, unknown>>
        }) => apiClient.post<{
          id: string
          slug: string
          title: string
          content: string
          isActive: boolean
        }>('/restaurant/site/pages', data),

        update: (id: string, data: {
          slug?: string
          title?: string
          content?: string
          isActive?: boolean
          showInNav?: boolean
          metaTitle?: string
          metaDescription?: string
          sections?: Record<string, Record<string, unknown>>
        }) => apiClient.put<{
          id: string
          slug: string
          title: string
          content: string
          isActive: boolean
        }>(`/restaurant/site/pages/${id}`, data),

        delete: (id: string) =>
          apiClient.delete<{ success: boolean }>(`/restaurant/site/pages/${id}`),
      },

      seo: {
        get: () =>
          apiClient.get<{
            metaTitle: string | null
            metaDescription: string | null
            metaKeywords: string[]
            termsUrl: string | null
            privacyUrl: string | null
            legalNotice: string | null
          }>('/restaurant/site/seo'),

        update: (data: {
          metaTitle?: string
          metaDescription?: string
          metaKeywords?: string[]
          termsUrl?: string
          privacyUrl?: string
          legalNotice?: string
        }) => apiClient.put<{
          metaTitle: string | null
          metaDescription: string | null
          metaKeywords: string[]
          termsUrl: string | null
          privacyUrl: string | null
          legalNotice: string | null
        }>('/restaurant/site/seo', data),
      },

      domain: {
        get: () =>
          apiClient.get<{
            subdomain: string
            customDomain: string | null
            status: string
          }>('/restaurant/site/domain'),

        update: (data: { customDomain?: string }) =>
          apiClient.put<{
            subdomain: string
            customDomain: string | null
            status: string
          }>('/restaurant/site/domain', data),
      },

      settings: {
        get: () =>
          apiClient.get<{
            general: {
              homePageId: string | null
              aboutPageId: string | null
              language: string
              currency: string
            }
            seo: {
              metaTitle: string | null
              metaDescription: string | null
              metaKeywords: string[]
              favicon: string | null
              ogImage: string | null
            }
            conversion: {
              facebookPixelId: string | null
              googleAnalyticsId: string | null
              googleTagManagerId: string | null
              tiktokPixelId: string | null
              snapPixelId: string | null
              customHeadScript: string | null
            }
            domain: {
              subdomain: string | null
              customDomain: string | null
              status: string | null
            }
            legal: {
              termsUrl: string | null
              privacyUrl: string | null
              legalNotice: string | null
            }
            pages: Array<{
              id: string
              title: string
              slug: string
              pageType: string | null
              isDefault: boolean
            }>
          }>('/restaurant/site/settings'),

        update: (data: {
          homePageId?: string | null
          aboutPageId?: string | null
          metaTitle?: string | null
          metaDescription?: string | null
          metaKeywords?: string[]
          favicon?: string | null
          ogImage?: string | null
          facebookPixelId?: string | null
          googleAnalyticsId?: string | null
          googleTagManagerId?: string | null
          tiktokPixelId?: string | null
          snapPixelId?: string | null
          customHeadScript?: string | null
          termsUrl?: string | null
          privacyUrl?: string | null
          legalNotice?: string | null
          customDomain?: string | null
        }) => apiClient.put<Record<string, unknown>>('/restaurant/site/settings', data),
      },

      messages: {
        list: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
          const searchParams = new URLSearchParams()
          if (params?.page) searchParams.set('page', String(params.page))
          if (params?.limit) searchParams.set('limit', String(params.limit))
          if (params?.unreadOnly) searchParams.set('unreadOnly', 'true')
          const qs = searchParams.toString()
          return apiClient.get<Array<{
            id: string
            name: string
            email: string
            phone: string | null
            subject: string | null
            message: string
            isRead: boolean
            createdAt: string
          }>>(`/restaurant/site/messages${qs ? `?${qs}` : ''}`)
        },

        markAsRead: (id: string) =>
          apiClient.patch<{ success: boolean }>(`/restaurant/site/messages/${id}/read`, {}),

        delete: (id: string) =>
          apiClient.delete<{ success: boolean }>(`/restaurant/site/messages/${id}`),
      },

      themes: {
        catalog: (params?: { category?: string; isPremium?: string; search?: string; page?: number; limit?: number }) => {
          const searchParams = new URLSearchParams()
          if (params?.category) searchParams.set('category', params.category)
          if (params?.isPremium) searchParams.set('isPremium', params.isPremium)
          if (params?.search) searchParams.set('search', params.search)
          if (params?.page) searchParams.set('page', String(params.page))
          if (params?.limit) searchParams.set('limit', String(params.limit))
          const qs = searchParams.toString()
          return apiClient.get<Array<{
            id: string
            slug: string
            name: string
            shortDescription: string | null
            thumbnailUrl: string | null
            category: string
            tags: string[]
            isPremium: boolean
            price: number | null
            isFeatured: boolean
            installCount: number
            rating: number
            ratingCount: number
            features: string[]
          }>>(`/restaurant/site/themes${qs ? `?${qs}` : ''}`)
        },

        getBySlug: (slug: string) =>
          apiClient.get<{
            id: string
            slug: string
            name: string
            description: string
            shortDescription: string | null
            version: string
            author: string
            previewImages: string[]
            thumbnailUrl: string | null
            demoUrl: string | null
            category: string
            tags: string[]
            isPremium: boolean
            price: number | null
            isFeatured: boolean
            installCount: number
            rating: number
            ratingCount: number
            features: string[]
            supportedPages: string[]
            colorPresets: Record<string, unknown> | null
            isInstalled: boolean
            isActive: boolean
          }>(`/restaurant/site/themes/${slug}`),

        install: (slug: string) =>
          apiClient.post<{ id: string }>(`/restaurant/site/themes/${slug}/install`),

        activate: (slug: string) =>
          apiClient.put<{ success: boolean }>(`/restaurant/site/themes/${slug}/activate`),

        uninstall: (slug: string) =>
          apiClient.delete<{ success: boolean }>(`/restaurant/site/themes/${slug}/uninstall`),

        installed: () =>
          apiClient.get<Array<{
            id: string
            isActive: boolean
            installedAt: string
            customizations: Record<string, unknown> | null
            theme: {
              id: string
              slug: string
              name: string
              shortDescription: string | null
              thumbnailUrl: string | null
              category: string
              version: string
            }
          }>>('/restaurant/site/themes/installed/list'),
      },
    },

    marketing: {
      getStats: () =>
        apiClient.get<{
          coupons: { total: number; active: number; totalUsed: number }
          promotions: { total: number; active: number }
          reviews: { total: number; avgRating: number | null; thisMonth: number }
          loyalty: { customersWithPoints: number }
          orders: { withCoupon: number }
        }>('/restaurant/marketing/stats'),

      coupons: {
        list: (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
          const searchParams = new URLSearchParams()
          if (params?.search) searchParams.set('search', params.search)
          if (params?.status) searchParams.set('status', params.status)
          if (params?.page) searchParams.set('page', String(params.page))
          if (params?.limit) searchParams.set('limit', String(params.limit))
          const qs = searchParams.toString()
          return apiClient.get<{
            data: Array<{
              id: string
              code: string
              description: string | null
              discountType: string
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
            }>
            pagination: { total: number; page: number; limit: number; pages: number }
          }>(`/restaurant/marketing/coupons${qs ? `?${qs}` : ''}`)
        },

        get: (id: string) =>
          apiClient.get<{
            id: string
            code: string
            description: string | null
            discountType: string
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
            recentOrders: Array<{
              id: string
              orderNumber: string
              total: number
              discount: number
              createdAt: string
              customer: { id: string; firstName: string; lastName: string } | null
            }>
            createdAt: string
            updatedAt: string
          }>(`/restaurant/marketing/coupons/${id}`),

        create: (data: {
          code: string
          description?: string | null
          discountType: string
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
        }) => apiClient.post<{ id: string; code: string; discountType: string; discountValue: number; isActive: boolean; createdAt: string }>('/restaurant/marketing/coupons', data),

        update: (id: string, data: {
          code?: string
          description?: string | null
          discountType?: string
          discountValue?: number
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
        }) => apiClient.put<{ id: string; code: string; discountType: string; discountValue: number; isActive: boolean; updatedAt: string }>(`/restaurant/marketing/coupons/${id}`, data),

        delete: (id: string) =>
          apiClient.delete<{ success: boolean; message: string }>(`/restaurant/marketing/coupons/${id}`),
      },

      promotions: {
        list: (params?: { search?: string; status?: string; type?: string; page?: number; limit?: number }) => {
          const searchParams = new URLSearchParams()
          if (params?.search) searchParams.set('search', params.search)
          if (params?.status) searchParams.set('status', params.status)
          if (params?.type) searchParams.set('type', params.type)
          if (params?.page) searchParams.set('page', String(params.page))
          if (params?.limit) searchParams.set('limit', String(params.limit))
          const qs = searchParams.toString()
          return apiClient.get<{
            data: Array<{
              id: string
              name: string
              description: string | null
              type: string
              discountType: string
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
            }>
            pagination: { total: number; page: number; limit: number; pages: number }
          }>(`/restaurant/marketing/promotions${qs ? `?${qs}` : ''}`)
        },

        get: (id: string) =>
          apiClient.get<{
            id: string
            name: string
            description: string | null
            type: string
            discountType: string
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
          }>(`/restaurant/marketing/promotions/${id}`),

        create: (data: {
          name: string
          description?: string | null
          type: string
          discountType: string
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
        }) => apiClient.post<{ id: string; name: string; type: string; isActive: boolean; createdAt: string }>('/restaurant/marketing/promotions', data),

        update: (id: string, data: {
          name?: string
          description?: string | null
          type?: string
          discountType?: string
          discountValue?: number
          minOrderAmount?: number | null
          maxDiscount?: number | null
          appliesToAll?: boolean
          productIds?: string[]
          categoryIds?: string[]
          startDate?: string
          endDate?: string | null
          activeDays?: number[]
          activeFrom?: string | null
          activeTo?: string | null
          isActive?: boolean
        }) => apiClient.put<{ id: string; name: string; type: string; isActive: boolean; updatedAt: string }>(`/restaurant/marketing/promotions/${id}`, data),

        delete: (id: string) =>
          apiClient.delete<{ success: boolean; message: string }>(`/restaurant/marketing/promotions/${id}`),
      },

      reviews: {
        list: (params?: { search?: string; rating?: number; status?: string; page?: number; limit?: number }) => {
          const searchParams = new URLSearchParams()
          if (params?.search) searchParams.set('search', params.search)
          if (params?.rating) searchParams.set('rating', String(params.rating))
          if (params?.status) searchParams.set('status', params.status)
          if (params?.page) searchParams.set('page', String(params.page))
          if (params?.limit) searchParams.set('limit', String(params.limit))
          const qs = searchParams.toString()
          return apiClient.get<{
            data: Array<{
              id: string
              rating: number
              title: string | null
              comment: string | null
              foodRating: number | null
              serviceRating: number | null
              deliveryRating: number | null
              response: string | null
              respondedAt: string | null
              isPublished: boolean
              isVerified: boolean
              customer: { id: string; firstName: string; lastName: string; email: string }
              orderId: string | null
              createdAt: string
            }>
            stats: {
              avgRating: number | null
              distribution: Array<{ rating: number; count: number }>
            }
            pagination: { total: number; page: number; limit: number; pages: number }
          }>(`/restaurant/marketing/reviews${qs ? `?${qs}` : ''}`)
        },

        get: (id: string) =>
          apiClient.get<{
            id: string
            rating: number
            title: string | null
            comment: string | null
            foodRating: number | null
            serviceRating: number | null
            deliveryRating: number | null
            response: string | null
            respondedAt: string | null
            respondedBy: string | null
            isPublished: boolean
            isVerified: boolean
            customer: { id: string; firstName: string; lastName: string; email: string; phone: string | null }
            orderId: string | null
            createdAt: string
            updatedAt: string
          }>(`/restaurant/marketing/reviews/${id}`),

        update: (id: string, data: { response?: string | null; isPublished?: boolean }) =>
          apiClient.put<{ id: string; response: string | null; respondedAt: string | null; isPublished: boolean; updatedAt: string }>(`/restaurant/marketing/reviews/${id}`, data),
      },

      loyalty: {
        getStats: () =>
          apiClient.get<{
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
          }>('/restaurant/marketing/loyalty/stats'),
        getSettings: () =>
          apiClient.get<{
            enabled: boolean
            pointsPerCurrency: number
            currencyPerPoint: number
            minPointsToRedeem: number
            welcomeBonus: number
            birthdayBonus: number
            referralBonus: number
          }>('/restaurant/marketing/loyalty/settings'),
        updateSettings: (data: {
          enabled?: boolean
          pointsPerCurrency?: number
          currencyPerPoint?: number
          minPointsToRedeem?: number
          welcomeBonus?: number
          birthdayBonus?: number
          referralBonus?: number
        }) =>
          apiClient.put<{
            enabled: boolean
            pointsPerCurrency: number
            currencyPerPoint: number
            minPointsToRedeem: number
            welcomeBonus: number
            birthdayBonus: number
            referralBonus: number
          }>('/restaurant/marketing/loyalty/settings', data),
      },

      campaigns: {
        list: (params?: { status?: string; type?: string; page?: number; limit?: number }) =>
          apiClient.get<{
            id: string
            name: string
            subject: string
            type: string
            status: string
            recipientCount: number
            sentCount: number
            openCount: number
            clickCount: number
            scheduledAt: string | null
            sentAt: string | null
            createdAt: string
          }[]>(`/restaurant/marketing/campaigns${params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : ''}`),

        get: (id: string, params?: Record<string, string>) => {
          const queryString = params && Object.keys(params).length > 0 ? `?${new URLSearchParams(params).toString()}` : ''
          return apiClient.get<{
            id: string
            name: string
            subject: string
            content: string
            type: string
            status: string
            targetAll: boolean
            targetSegment: string | null
            targetMinPoints: number | null
            targetMaxPoints: number | null
            targetingRules: unknown
            recipientCount: number
            sentCount: number
            openCount: number
            clickCount: number
            scheduledAt: string | null
            sentAt: string | null
            createdAt: string
            updatedAt: string
            recipients: Array<{
              id: string
              email: string
              status: string
              sentAt: string | null
              openedAt: string | null
              clickedAt: string | null
              errorMessage: string | null
              customer: { id: string; firstName: string; lastName: string; email: string; phone: string | null }
            }>
            recipientStats: {
              total: number
              pending: number
              sent: number
              delivered: number
              opened: number
              clicked: number
              bounced: number
              failed: number
              unsubscribed: number
            }
            pagination: {
              page: number
              limit: number
              total: number
              totalPages: number
            }
          }>(`/restaurant/marketing/campaigns/${id}${queryString}`)
        },

        create: (data: {
          name: string
          subject: string
          content: string
          type?: string
          targetAll?: boolean
          targetSegment?: string
          targetMinPoints?: number
          targetMaxPoints?: number
          targetingRules?: unknown
          scheduledAt?: string
        }) =>
          apiClient.post<{ id: string; name: string; status: string }>('/restaurant/marketing/campaigns', data),

        update: (id: string, data: {
          name?: string
          subject?: string
          content?: string
          type?: string
          targetAll?: boolean
          targetSegment?: string
          targetMinPoints?: number
          targetMaxPoints?: number
          targetingRules?: unknown
          scheduledAt?: string
        }) =>
          apiClient.put<{ id: string; name: string; status: string }>(`/restaurant/marketing/campaigns/${id}`, data),

        delete: (id: string) =>
          apiClient.delete<{ message: string }>(`/restaurant/marketing/campaigns/${id}`),

        send: (id: string) =>
          apiClient.post<{ message: string; recipientCount: number }>(`/restaurant/marketing/campaigns/${id}/send`, {}),

        getStats: (id: string) =>
          apiClient.get<{
            id: string
            name: string
            status: string
            recipientCount: number
            sentCount: number
            openCount: number
            clickCount: number
            openRate: number
            clickRate: number
            sentAt: string | null
          }>(`/restaurant/marketing/campaigns/${id}/stats`),
      },

      emailTemplates: {
        list: () =>
          apiClient.get<Array<{
            type: string
            template: {
              id: string
              subject: string
              content: string
              isActive: boolean
            } | null
            hasCustomTemplate: boolean
          }>>('/restaurant/marketing/email-templates'),

        get: (type: string) =>
          apiClient.get<{
            id: string
            type: string
            subject: string
            content: string
            isActive: boolean
          } | null>(`/restaurant/marketing/email-templates/${type}`),

        update: (type: string, data: { subject: string; content: string; isActive?: boolean }) =>
          apiClient.put<{ id: string; type: string; subject: string; content: string; isActive: boolean }>(`/restaurant/marketing/email-templates/${type}`, data),

        delete: (type: string) =>
          apiClient.delete<{ message: string }>(`/restaurant/marketing/email-templates/${type}`),
      },

      tagRules: {
        list: () =>
          apiClient.get<Array<{
            id: string
            name: string
            tag: string
            description: string | null
            conditions: unknown
            triggerOnOrder: boolean
            isActive: boolean
            customersMatched: number
            lastEvaluatedAt: string | null
            createdAt: string
          }>>('/restaurant/marketing/tag-rules'),

        get: (id: string) =>
          apiClient.get<{
            id: string
            name: string
            tag: string
            description: string | null
            conditions: unknown
            triggerOnOrder: boolean
            isActive: boolean
            customersMatched: number
            lastEvaluatedAt: string | null
            createdAt: string
          }>(`/restaurant/marketing/tag-rules/${id}`),

        create: (data: {
          name: string
          tag: string
          description?: string
          conditions: { operator: 'AND' | 'OR'; conditions: Array<{ field: string; operator: string; value: unknown }> }
          triggerOnOrder?: boolean
        }) =>
          apiClient.post<{ id: string; name: string; tag: string }>('/restaurant/marketing/tag-rules', data),

        update: (id: string, data: {
          name?: string
          tag?: string
          description?: string
          conditions?: { operator: 'AND' | 'OR'; conditions: Array<{ field: string; operator: string; value: unknown }> }
          triggerOnOrder?: boolean
          isActive?: boolean
        }) =>
          apiClient.put<{ id: string; name: string; tag: string }>(`/restaurant/marketing/tag-rules/${id}`, data),

        delete: (id: string) =>
          apiClient.delete<{ message: string }>(`/restaurant/marketing/tag-rules/${id}`),

        evaluate: (id: string) =>
          apiClient.post<{ matched: number; total: number }>(`/restaurant/marketing/tag-rules/${id}/evaluate`, {}),

        preview: (conditions: { operator: 'AND' | 'OR'; conditions: Array<{ field: string; operator: string; value: unknown }> }) =>
          apiClient.post<{ count: number; sample: Array<{ id: string; firstName: string; lastName: string; email: string }> }>('/restaurant/marketing/tag-rules/preview', { conditions }),
      },

      previewTargeting: (targetingRules: unknown) =>
        apiClient.post<{ count: number; sample: Array<{ id: string; firstName: string; lastName: string; email: string }> }>('/restaurant/marketing/campaigns/preview-targeting', { targetingRules }),
    },
  },

  store: {
    getData: (subdomain: string) =>
      apiClient.get<any>(`/store/${subdomain}`),

    getMenu: (subdomain: string) =>
      apiClient.get<any>(`/store/${subdomain}/menu`),

    getBranding: (subdomain: string) =>
      apiClient.get<any>(`/store/${subdomain}/branding`),

    getPages: (subdomain: string) =>
      apiClient.get<Array<{ slug: string; title: string; pageType: string | null; sections: Record<string, Record<string, unknown>> | null }>>(`/store/${subdomain}/pages`),

    getPage: (subdomain: string, slug: string) =>
      apiClient.get<{ id: string; slug: string; title: string; content: string; pageType: string | null; sections: Record<string, Record<string, unknown>> | null; metaTitle: string | null; metaDescription: string | null }>(`/store/${subdomain}/pages/${slug}`),

    trackPageView: (subdomain: string, slug: string) =>
      apiClient.post<{ success: boolean }>(`/store/${subdomain}/pages/${slug}/view`, {}),

    getTeam: (subdomain: string) =>
      apiClient.get<Array<{ id: string; name: string; position: string; role: string; avatar: string | null }>>(`/store/${subdomain}/team`),

    createOrder: (subdomain: string, data: {
      serviceType: string
      customerName: string
      customerPhone: string
      customerEmail?: string
      customerNotes?: string
      deliveryAddress?: string
      paymentMethod: string
      customerId?: string
      items: {
        productId: string
        variantId?: string | null
        quantity: number
        modifiers?: { id: string; name: string; price: number }[]
        notes?: string
      }[]
    }) => apiClient.post<{ orderId: string; orderNumber: string; status: string; total: number; estimatedTime: number; paymentUrl?: string; requiresPayment?: boolean; paymentError?: string }>(`/store/${subdomain}/orders`, data),

    getOrder: (subdomain: string, orderId: string) =>
      apiClient.get<{
        id: string
        orderNumber: string
        displayNumber: string
        status: string
        serviceType: string
        paymentStatus: string
        subtotal: number
        taxAmount: number
        total: number
        estimatedTime: number
        createdAt: string
        items: {
          id: string
          productName: string
          variantName: string | null
          quantity: number
          unitPrice: number
          totalPrice: number
          modifiers: unknown
        }[]
      }>(`/store/${subdomain}/orders/${orderId}`),

    getCustomerOrders: (subdomain: string, page = 1, limit = 10) =>
      apiClient.get<{
        orders: {
          id: string
          orderNumber: string
          status: string
          serviceType: string
          total: number
          createdAt: string
          itemCount: number
        }[]
        pagination: { page: number; limit: number; total: number; totalPages: number }
      }>(`/store/${subdomain}/account/orders?page=${page}&limit=${limit}`),

    requestPasswordReset: (subdomain: string, email: string) =>
      apiClient.post<{ success: boolean; message?: string }>(`/store/${subdomain}/auth/forgot-password`, { email }),

    resetPassword: (subdomain: string, token: string, password: string) =>
      apiClient.post<{ success: boolean; message?: string }>(`/store/${subdomain}/auth/reset-password`, { token, password }),

    verifyEmail: (subdomain: string, token: string) =>
      apiClient.post<{ success: boolean; message?: string }>(`/store/${subdomain}/auth/verify-email`, { token }),

    // Loyalty
    account: {
      getLoyalty: (subdomain: string, token: string) => {
        apiClient.setAccessToken(token)
        return apiClient.get<{
          currentPoints: number
          totalEarned: number
          totalRedeemed: number
          transactions: {
            id: string
            type: string
            points: number
            balanceAfter: number
            description: string | null
            orderId: string | null
            createdAt: string
          }[]
        }>(`/store/${subdomain}/account/loyalty`)
      },
      getLoyaltyHistory: (subdomain: string, token: string, page = 1, limit = 20) => {
        apiClient.setAccessToken(token)
        return apiClient.get<{
          id: string
          type: string
          points: number
          balanceAfter: number
          description: string | null
          orderId: string | null
          createdAt: string
        }[]>(`/store/${subdomain}/account/loyalty/history?page=${page}&limit=${limit}`)
      },
      calculateDiscount: (subdomain: string, token: string, pointsToUse: number, subtotal: number) => {
        apiClient.setAccessToken(token)
        return apiClient.post<{
          availablePoints: number
          pointsToUse: number
          discount: number
          newTotal: number
          pointsToMoneyRate: number
        }>(`/store/${subdomain}/account/loyalty/calculate`, { pointsToUse, subtotal })
      },
    },
  },

  driver: {
    getMe: () => apiClient.get<{
      id: string
      user: {
        id: string
        email: string
        firstName: string
        lastName: string
        phone: string | null
        avatar: string | null
      }
      restaurant: {
        id: string
        name: string
        address: string | null
        phone: string | null
        logo: string | null
      }
      vehicleType: 'BIKE' | 'SCOOTER' | 'CAR' | 'WALK'
      vehiclePlate: string | null
      licenseNumber: string | null
      isActive: boolean
      isOnline: boolean
      isAvailable: boolean
      totalDeliveries: number
      avgRating: number | null
      currentDeliveryId: string | null
    }>('/driver/me'),

    updateStatus: (data: { isOnline?: boolean; isAvailable?: boolean }) =>
      apiClient.put<{ id: string; isOnline: boolean; isAvailable: boolean }>('/driver/status', data),

    updateLocation: (data: { latitude: number; longitude: number }) =>
      apiClient.put<{ currentLatitude: number; currentLongitude: number; lastLocationUpdate: string }>('/driver/location', data),

    getDeliveries: (status?: 'active' | 'completed') =>
      apiClient.get<Array<{
        id: string
        status: string
        order: {
          id: string
          orderNumber: string
          subtotal: number
          customer: {
            firstName: string
            lastName: string
            phone: string | null
          }
        }
        address: unknown
        latitude: number | null
        longitude: number | null
        estimatedTime: number | null
        pickedUpAt: string | null
        deliveredAt: string | null
        customerRating: number | null
        customerFeedback: string | null
        createdAt: string
      }>>(`/driver/deliveries${status ? `?status=${status}` : ''}`),

    getCurrentDelivery: () =>
      apiClient.get<{
        id: string
        status: string
        order: {
          id: string
          orderNumber: string
          subtotal: number
          customer: {
            firstName: string
            lastName: string
            phone: string | null
          }
          items: Array<{
            id: string
            quantity: number
            product: { name: string }
          }>
          restaurant: {
            name: string
            address: string | null
            phone: string | null
          }
        }
        address: unknown
        latitude: number | null
        longitude: number | null
        estimatedTime: number | null
      } | null>('/driver/deliveries/current'),

    updateDeliveryStatus: (id: string, status: string) =>
      apiClient.put<{ id: string; status: string }>(`/driver/deliveries/${id}/status`, { status }),

    getStats: () =>
      apiClient.get<{
        totalDeliveries: number
        avgRating: number | null
        todayDeliveries: number
        weekDeliveries: number
      }>('/driver/stats'),
  },
}
