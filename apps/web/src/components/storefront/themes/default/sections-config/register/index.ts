import type { ThemeSectionDef } from '../../../_types'
import { registerHeaderSection } from './header'
import { registerFormSection } from './register-form'

export const registerSections: ThemeSectionDef[] = [
  registerHeaderSection,
  registerFormSection,
]
