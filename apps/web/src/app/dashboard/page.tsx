'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (user) {
      switch (user.userType) {
        case 'SUPER_ADMIN':
          router.push('/platform')
          break
        case 'RESELLER':
          router.push('/reseller')
          break
        case 'RESTAURANT':
          router.push('/restaurant')
          break
        case 'DRIVER':
          router.push('/driver')
          break
        default:
          router.push('/login')
      }
    }
  }, [user, isAuthenticated, isLoading, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin h-12 w-12 text-primary mx-auto" />
        <p className="mt-4 text-gray-600">Redirection en cours...</p>
      </div>
    </div>
  )
}
