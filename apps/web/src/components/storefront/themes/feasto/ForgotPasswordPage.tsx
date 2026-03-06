'use client'

import type { ForgotPasswordPageProps } from '../_types'
import { ForgotPasswordHeaderSection } from './sections/auth/ForgotPasswordHeaderSection'
import { ForgotPasswordFormSection } from './sections/auth/ForgotPasswordFormSection'

export function ForgotPasswordPage({
  restaurant,
  theme,
  sections,
  subdomain,
}: ForgotPasswordPageProps) {
  return (
    <div style={{ backgroundColor: theme.backgroundColor }}>
      <ForgotPasswordHeaderSection
        restaurant={restaurant}
        theme={theme}
        subdomain={subdomain}
        sectionData={sections?.header}
      />
      <ForgotPasswordFormSection
        theme={theme}
        subdomain={subdomain}
        sectionData={sections?.['forgot-password-form']}
      />
    </div>
  )
}
