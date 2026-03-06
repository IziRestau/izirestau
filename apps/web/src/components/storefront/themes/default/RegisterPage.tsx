'use client'

import { useEffect } from 'react'
import type { RegisterPageProps } from '../_types'
import { RegisterHeaderSection } from './sections/auth/RegisterHeaderSection'
import { RegisterFormSection } from './sections/auth/RegisterFormSection'
import { useStorefrontAuthStore } from '@/stores/storefront-auth.store'

export function RegisterPage({
  restaurant,
  theme,
  sections,
  subdomain,
  redirectTo,
  onSuccess,
}: RegisterPageProps) {
  const { setSubdomain } = useStorefrontAuthStore()

  useEffect(() => {
    setSubdomain(subdomain)
  }, [subdomain, setSubdomain])

  return (
    <div style={{ backgroundColor: theme.backgroundColor }}>
      <RegisterHeaderSection
        restaurant={restaurant}
        theme={theme}
        sectionData={sections?.header}
      />
      <RegisterFormSection
        theme={theme}
        subdomain={subdomain}
        sectionData={sections?.['register-form']}
        redirectTo={redirectTo}
        onSuccess={onSuccess}
      />
    </div>
  )
}
