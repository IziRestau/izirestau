'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { Loader2 } from 'lucide-react'

const AUTH_ROUTES = ['/restaurant/login', '/restaurant/forgot-password', '/restaurant/reset-password']

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, _hasHydrated, checkAuth, user, accessToken } = useAuthStore()
  const { 
    fetchMyRestaurants, 
    isLoaded, 
    isLoading, 
    isLoadingList,
    restaurants,
    error 
  } = useRestaurantStore()
  const [isReady, setIsReady] = useState(false)

  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))

  useEffect(() => {
    if (_hasHydrated) {
      checkAuth()
    }
  }, [_hasHydrated, checkAuth])

  useEffect(() => {
    if (_hasHydrated && !isAuthRoute) {
      if (!isAuthenticated) {
        router.replace('/restaurant/login')
      } else if (user?.userType !== 'RESTAURANT') {
        router.replace('/restaurant/login')
      } else {
        setIsReady(true)
      }
    }
  }, [_hasHydrated, isAuthenticated, user, router, isAuthRoute])

  useEffect(() => {
    if (isReady && accessToken && restaurants.length === 0 && !isLoadingList && !isLoaded) {
      fetchMyRestaurants(accessToken)
    }
  }, [isReady, accessToken, restaurants.length, isLoadingList, isLoaded, fetchMyRestaurants])

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

  if (isLoading || isLoadingList) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement du restaurant...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.replace('/restaurant/login')}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
          >
            Retour a la connexion
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
