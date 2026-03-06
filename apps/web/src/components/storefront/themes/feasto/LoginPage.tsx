'use client'

import { useEffect } from 'react'
import type { LoginPageProps } from '../_types'
import { LoginHeaderSection } from './sections/auth/LoginHeaderSection'
import { LoginFormSection } from './sections/auth/LoginFormSection'
import { useStorefrontAuthStore } from '@/stores/storefront-auth.store'

export function LoginPage({
  restaurant,
  theme,
  sections,
  subdomain,
  redirectTo,
  onSuccess,
}: LoginPageProps) {
  const { setSubdomain } = useStorefrontAuthStore()

  useEffect(() => {
    setSubdomain(subdomain)
  }, [subdomain, setSubdomain])

  return (
    <div style={{ backgroundColor: theme.backgroundColor }}>
      <LoginHeaderSection
        restaurant={restaurant}
        theme={theme}
        subdomain={subdomain}
        sectionData={sections?.header}
      />
      <LoginFormSection
        theme={theme}
        subdomain={subdomain}
        sectionData={sections?.['login-form']}
        redirectTo={redirectTo}
        onSuccess={onSuccess}
      />
    </div>
  )
}
