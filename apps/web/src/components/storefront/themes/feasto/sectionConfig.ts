import type { ThemePageSections } from '../_types'
import { homeSections } from './sections-config/home'
import { menuSections } from './sections-config/menu'
import { contactSections } from './sections-config/contact'
import { aboutSections } from './sections-config/about'
import { customSections } from './sections-config/custom'
import { checkoutSections } from './sections-config/checkout'
import { thanksSections } from './sections-config/thanks'
import { loginSections } from './sections-config/login'
import { registerSections } from './sections-config/register'
import { accountSections } from './sections-config/account'
import { forgotPasswordSections } from './sections-config/forgot-password'
import { trackSections } from './sections-config/track'

export const feastoSectionConfig: ThemePageSections = {
  home: homeSections,
  menu: menuSections,
  contact: contactSections,
  about: aboutSections,
  custom: customSections,
  checkout: checkoutSections,
  thanks: thanksSections,
  login: loginSections,
  register: registerSections,
  account: accountSections,
  'forgot-password': forgotPasswordSections,
  track: trackSections,
}
