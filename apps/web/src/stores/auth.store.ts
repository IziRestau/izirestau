import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { api, apiClient } from '@/lib/api-client'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  userType: string
  isSuperAdmin?: boolean
  avatar?: string
  phone?: string
}

interface LoginResult {
  success: boolean
  requires2FA?: boolean
  tempToken?: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  _hasHydrated: boolean
  setUser: (user: User | null) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  login: (email: string, password: string) => Promise<LoginResult>
  login2FA: (tempToken: string, code: string) => Promise<void>
  register: (data: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone?: string
    userType?: string
  }) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => void
  setHasHydrated: (state: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setTokens: (accessToken, refreshToken) => {
        apiClient.setAccessToken(accessToken)
        set({ accessToken, refreshToken })
      },

      login: async (email, password) => {
        const response = await api.auth.login({ email, password })
        if (response.success && response.data) {
          if (response.data.requires2FA && response.data.tempToken) {
            return {
              success: true,
              requires2FA: true,
              tempToken: response.data.tempToken,
            }
          }
          
          const { user, accessToken, refreshToken } = response.data
          if (user && accessToken && refreshToken) {
            apiClient.setAccessToken(accessToken)
            set({
              user,
              accessToken,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
            })
          }
          return { success: true }
        }
        return { success: false }
      },

      login2FA: async (tempToken, code) => {
        const response = await api.auth.login2FA({ tempToken, code })
        if (response.success && response.data) {
          const { user, accessToken, refreshToken } = response.data
          apiClient.setAccessToken(accessToken)
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          })
        }
      },

      register: async (data) => {
        const response = await api.auth.register(data)
        if (response.success && response.data) {
          const { user, accessToken, refreshToken } = response.data as {
            user: User
            accessToken: string
            refreshToken: string
          }
          apiClient.setAccessToken(accessToken)
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          })
        }
      },

      logout: async () => {
        const { refreshToken } = get()
        if (refreshToken) {
          try {
            await api.auth.logout(refreshToken)
          } catch {
            // Ignore logout errors
          }
        }
        apiClient.setAccessToken(null)
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },

      checkAuth: () => {
        const { accessToken, user, isAuthenticated } = get()
        
        if (accessToken && user) {
          apiClient.setAccessToken(accessToken)
          if (!isAuthenticated) {
            set({ isAuthenticated: true })
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true)
          if (state.accessToken) {
            apiClient.setAccessToken(state.accessToken)
          }
        }
      },
    }
  )
)
