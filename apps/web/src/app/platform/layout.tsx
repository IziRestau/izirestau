'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { Loader2 } from 'lucide-react'

const AUTH_ROUTES = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/platform/login',
  '/platform/forgot-password',
  '/platform/reset-password',
]

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, _hasHydrated, checkAuth, user } = useAuthStore()
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
      } else if (!user?.isSuperAdmin) {
        router.replace('/login')
      } else {
        setIsReady(true)
      }
    }
  }, [_hasHydrated, isAuthenticated, user, router, isAuthRoute])

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
