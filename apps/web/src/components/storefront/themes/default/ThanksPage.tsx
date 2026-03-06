'use client'

import type { ThanksPageProps } from '../_types'
import { ThanksHeaderSection } from './sections/thanks/ThanksHeaderSection'
import { ThanksConfirmationSection } from './sections/thanks/ThanksConfirmationSection'

export function ThanksPage({
  restaurant,
  theme,
  settings,
  sections,
  subdomain,
  order,
}: ThanksPageProps) {
  return (
    <div style={{ backgroundColor: theme.backgroundColor }}>
      <ThanksHeaderSection
        restaurant={restaurant}
        theme={theme}
        sectionData={sections?.header}
      />
      <ThanksConfirmationSection
        theme={theme}
        settings={settings}
        subdomain={subdomain}
        order={order}
        sectionData={sections?.confirmation}
      />
    </div>
  )
}
