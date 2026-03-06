import type { ThemeSectionDef } from '../../../_types'
import { checkoutHeaderSection } from './header'
import { checkoutFormSection } from './checkout-form'
import { trustBadgesSection } from './trust-badges'

export const checkoutSections: ThemeSectionDef[] = [
  checkoutHeaderSection,
  checkoutFormSection,
  trustBadgesSection,
]
