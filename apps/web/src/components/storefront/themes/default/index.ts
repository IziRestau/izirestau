import type { ThemeComponents } from '../_types'
import { Header } from './Header'
import { Hero } from './Hero'
import { MenuSection } from './MenuSection'
import { ProductCard } from './ProductCard'
import { ProductModal } from './ProductModal'
import { CartDrawer } from './CartDrawer'
import { Footer } from './Footer'
import { RestaurantInfo } from './RestaurantInfo'
import { AnnouncementBar } from './AnnouncementBar'
import { HomePage } from './HomePage'
import { ContactPage } from './ContactPage'
import { CustomPage } from './CustomPage'
import { CheckoutPage } from './CheckoutPage'
import { ThanksPage } from './ThanksPage'
import { TrackPage } from './TrackPage'
import { LoginPage } from './LoginPage'
import { RegisterPage } from './RegisterPage'
import { AccountPage } from './AccountPage'
import { ForgotPasswordPage } from './ForgotPasswordPage'
import { ResetPasswordPage } from './ResetPasswordPage'
import { defaultSectionConfig } from './sectionConfig'
import { cartSectionsList } from './sections-config/cart'

const defaultTheme: ThemeComponents = {
  Header,
  Hero,
  MenuSection,
  ProductCard,
  ProductModal,
  CartDrawer,
  Footer,
  RestaurantInfo,
  AnnouncementBar,
  HomePage,
  ContactPage,
  CustomPage,
  CheckoutPage,
  ThanksPage,
  TrackPage,
  LoginPage,
  RegisterPage,
  AccountPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  sectionConfig: defaultSectionConfig,
  globalComponentsConfig: {
    cart: cartSectionsList,
  },
  supportedPages: ['home', 'menu', 'contact', 'custom', 'checkout', 'thanks', 'track', 'login', 'register', 'account', 'forgot-password', 'reset-password'],
}

export default defaultTheme
