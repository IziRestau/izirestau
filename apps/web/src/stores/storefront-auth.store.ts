import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface CustomerData {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  emailVerified: boolean
  totalOrders?: number
  totalSpent?: number
  loyaltyPoints?: number
  marketingOptIn?: boolean
}

export interface CustomerAddress {
  id: string
  label: string | null
  street: string
  streetLine2: string | null
  city: string
  postalCode: string
  country: string
  instructions: string | null
  isDefault: boolean
}

interface StorefrontAuthState {
  customer: CustomerData | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  subdomain: string | null

  setSubdomain: (subdomain: string) => void
  setCustomer: (customer: CustomerData, accessToken: string, refreshToken: string) => void
  updateCustomer: (data: Partial<CustomerData>) => void
  logout: () => void
  setLoading: (loading: boolean) => void

  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  refreshAuth: () => Promise<boolean>
  fetchProfile: () => Promise<void>
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  marketingOptIn?: boolean
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export const useStorefrontAuthStore = create<StorefrontAuthState>()(
  persist(
    (set, get) => ({
      customer: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      subdomain: null,

      setSubdomain: (subdomain: string) => {
        set({ subdomain })
      },

      setCustomer: (customer: CustomerData, accessToken: string, refreshToken: string) => {
        set({
          customer,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        })
      },

      updateCustomer: (data: Partial<CustomerData>) => {
        const current = get().customer
        if (current) {
          set({ customer: { ...current, ...data } })
        }
      },

      logout: () => {
        set({
          customer: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      login: async (email: string, password: string) => {
        const subdomain = get().subdomain
        if (!subdomain) {
          return { success: false, error: 'Subdomain non défini' }
        }

        set({ isLoading: true })

        try {
          const response = await fetch(`${API_URL}/store/${subdomain}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })

          const data = await response.json()

          if (!response.ok || !data.success) {
            set({ isLoading: false })
            return { success: false, error: data.message || 'Erreur de connexion' }
          }

          set({
            customer: data.data.customer,
            accessToken: data.data.accessToken,
            refreshToken: data.data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          })

          return { success: true }
        } catch {
          set({ isLoading: false })
          return { success: false, error: 'Erreur de connexion au serveur' }
        }
      },

      register: async (registerData: RegisterData) => {
        const subdomain = get().subdomain
        if (!subdomain) {
          return { success: false, error: 'Subdomain non défini' }
        }

        set({ isLoading: true })

        try {
          const response = await fetch(`${API_URL}/store/${subdomain}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registerData),
          })

          const data = await response.json()

          if (!response.ok || !data.success) {
            set({ isLoading: false })
            return { success: false, error: data.message || 'Erreur d\'inscription' }
          }

          set({
            customer: data.data.customer,
            accessToken: data.data.accessToken,
            refreshToken: data.data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          })

          return { success: true }
        } catch {
          set({ isLoading: false })
          return { success: false, error: 'Erreur de connexion au serveur' }
        }
      },

      refreshAuth: async () => {
        const { subdomain, refreshToken } = get()
        if (!subdomain || !refreshToken) {
          return false
        }

        try {
          const response = await fetch(`${API_URL}/store/${subdomain}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          })

          const data = await response.json()

          if (!response.ok || !data.success) {
            get().logout()
            return false
          }

          set({
            accessToken: data.data.accessToken,
            refreshToken: data.data.refreshToken,
          })

          return true
        } catch {
          get().logout()
          return false
        }
      },

      fetchProfile: async () => {
        const { subdomain, accessToken } = get()
        if (!subdomain || !accessToken) {
          return
        }

        try {
          const response = await fetch(`${API_URL}/store/${subdomain}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          })

          const data = await response.json()

          if (response.ok && data.success) {
            set({ customer: data.data })
          } else if (response.status === 401) {
            const refreshed = await get().refreshAuth()
            if (refreshed) {
              await get().fetchProfile()
            }
          }
        } catch {
          // Silently fail
        }
      },
    }),
    {
      name: 'storefront-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        customer: state.customer,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        subdomain: state.subdomain,
      }),
    }
  )
)

export const useCustomerAuth = () => {
  const store = useStorefrontAuthStore()
  
  return {
    customer: store.customer,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    login: store.login,
    register: store.register,
    logout: store.logout,
    updateCustomer: store.updateCustomer,
  }
}
