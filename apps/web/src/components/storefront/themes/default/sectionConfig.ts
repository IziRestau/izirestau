import type { ThemePageSections } from '../_types'
import { homeSections } from './sections-config/home'
import { menuSections } from './sections-config/menu'
import { contactSections } from './sections-config/contact'
import { customSections } from './sections-config/custom'
import { checkoutSections } from './sections-config/checkout'
import { thanksSections } from './sections-config/thanks'
import { trackSections } from './sections-config/track'
import { loginSections } from './sections-config/login'
import { registerSections } from './sections-config/register'
import { accountSections } from './sections-config/account'
import { forgotPasswordSections } from './sections-config/forgot-password'

export const defaultSectionConfig: ThemePageSections = {
  home: homeSections,
  menu: menuSections,
  contact: contactSections,
  custom: customSections,
  checkout: checkoutSections,
  thanks: thanksSections,
  track: trackSections,
  login: loginSections,
  register: registerSections,
  account: accountSections,
  'forgot-password': forgotPasswordSections,
}
