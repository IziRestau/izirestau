'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { useQuery } from '@tanstack/react-query'
import { api, apiClient } from '@/lib/api-client'
import { Loader2 } from 'lucide-react'

const AUTH_ROUTES = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/reseller/login',
  '/reseller/forgot-password',
  '/reseller/reset-password',
]

export default function ResellerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, _hasHydrated, checkAuth, user, accessToken, setUser } = useAuthStore()
  const [isReady, setIsReady] = useState(false)

  const isAuthRoute = AUTH_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))

  useEffect(() => {
    if (_hasHydrated) {
      checkAuth()
    }
  }, [_hasHydrated, checkAuth])

  useEffect(() => {
    if (_hasHydrated && !isAuthRoute) {
      if (!isAuthenticated) {
        router.replace('/login')
      } else if (user?.userType !== 'RESELLER') {
        router.replace('/login')
      } else {
        setIsReady(true)
      }
    }
  }, [_hasHydrated, isAuthenticated, user, router, isAuthRoute])

  const { data: settingsData } = useQuery({
    queryKey: ['reseller-settings'],
    queryFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      const res = await api.reseller.getSettings()
      return res.data
    },
    enabled: isReady && !!accessToken,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (settingsData?.user && user && settingsData.user.avatar !== user.avatar) {
      setUser({
        ...user,
        avatar: settingsData.user.avatar || undefined,
      })
    }
  }, [settingsData, user, setUser])

  useQuery({
    queryKey: ['reseller-dashboard'],
    queryFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      const res = await api.reseller.getDashboard()
      return res.data
    },
    enabled: isReady && !!accessToken,
    staleTime: 2 * 60 * 1000,
  })

  useQuery({
    queryKey: ['reseller-sites'],
    queryFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      const res = await api.reseller.getSites()
      return res.data
    },
    enabled: isReady && !!accessToken,
    staleTime: 2 * 60 * 1000,
  })

  useQuery({
    queryKey: ['reseller-clients'],
    queryFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      const res = await api.reseller.getClients()
      return res.data
    },
    enabled: isReady && !!accessToken,
    staleTime: 2 * 60 * 1000,
  })

  useQuery({
    queryKey: ['reseller-moneroo'],
    queryFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      const res = await api.reseller.moneroo.get()
      return res.data
    },
    enabled: isReady && !!accessToken,
    staleTime: 5 * 60 * 1000,
  })

  if (isAuthRoute) {
    return <>{children}</>
  }

  if (!_hasHydrated || !isReady) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
