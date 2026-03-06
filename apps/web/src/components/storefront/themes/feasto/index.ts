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
import { AboutPage } from './AboutPage'
import { LoginPage } from './LoginPage'
import { RegisterPage } from './RegisterPage'
import { ForgotPasswordPage } from './ForgotPasswordPage'
import { ResetPasswordPage } from './ResetPasswordPage'
import { AccountPage } from './AccountPage'
import { CheckoutPage } from './CheckoutPage'
import { ThanksPage } from './ThanksPage'
import { TrackPage } from './TrackPage'
import { feastoSectionConfig } from './sectionConfig'
import { cartSectionsList } from './sections-config/cart'

const feastoTheme: ThemeComponents = {
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
  AboutPage,
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  AccountPage,
  CheckoutPage,
  ThanksPage,
  TrackPage,
  sectionConfig: feastoSectionConfig,
  globalComponentsConfig: {
    cart: cartSectionsList,
  },
  supportedPages: ['home', 'menu', 'contact', 'about', 'custom', 'login', 'register', 'forgot-password', 'reset-password', 'account', 'checkout', 'thanks', 'track'],
}

export default feastoTheme
