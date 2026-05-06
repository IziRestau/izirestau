'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'

export default function HomePage() {
  const router = useRouter()
  const { user, isAuthenticated, _hasHydrated } = useAuthStore()

  useEffect(() => {
    if (!_hasHydrated) return

    if (isAuthenticated && user) {
      if (user.isSuperAdmin || user.userType === 'SUPER_ADMIN') {
        router.replace('/platform')
      } else if (user.userType === 'RESTAURANT' || user.userType === 'DRIVER') {
        router.replace('/restaurant')
      } else {
        router.replace('/reseller')
      }
    } else {
      router.replace('/login')
    }
  }, [_hasHydrated, isAuthenticated, user, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
    </div>
  )
}
