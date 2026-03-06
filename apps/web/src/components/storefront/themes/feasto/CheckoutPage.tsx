'use client'

import type { CheckoutPageProps } from '../_types'
import { CheckoutHeaderSection } from './sections/checkout/CheckoutHeaderSection'
import { CheckoutFormSection } from './sections/checkout/CheckoutFormSection'

export function CheckoutPage({
  restaurant,
  theme,
  settings,
  sections,
  subdomain,
  onSubmit,
}: CheckoutPageProps) {
  return (
    <div style={{ backgroundColor: theme.backgroundColor, minHeight: '100vh' }}>
      <CheckoutHeaderSection
        restaurant={restaurant}
        theme={theme}
        subdomain={subdomain}
        sectionData={sections?.header}
      />
      <CheckoutFormSection
        theme={theme}
        settings={settings}
        subdomain={subdomain}
        sectionData={sections?.['checkout-form']}
        onSubmit={onSubmit}
      />
    </div>
  )
}
