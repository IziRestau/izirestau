import type { ThemeSectionDef } from '../../../_types'
import { trackHeaderSection } from './header'
import { trackProgressSection } from './progress'
import { trackInfoSection } from './info'
import { trackDetailsSection } from './details'
import { trackRestaurantSection } from './restaurant'
import { trackActionsSection } from './actions'

export const trackSections: ThemeSectionDef[] = [
  trackHeaderSection,
  trackProgressSection,
  trackInfoSection,
  trackDetailsSection,
  trackRestaurantSection,
  trackActionsSection,
]
