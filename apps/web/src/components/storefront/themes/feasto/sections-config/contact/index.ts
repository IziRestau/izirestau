import type { ThemeSectionDef } from '../../../_types'
import { headerSection } from './header'
import { formSection } from './form'
import { contactInfoSection } from './contact-info'
import { mapSection } from './map'

export const contactSections: ThemeSectionDef[] = [
  headerSection,
  contactInfoSection,
  formSection,
  mapSection,
]
