import { ReactNode } from 'react'

// ============================================
// THEME DATA (from API)
// ============================================

export interface StoreThemeData {
  baseTheme: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  headingFont: string
  bodyFont: string
  layoutStyle: string
  headerStyle: string
  heroTitle: string | null
  heroSubtitle: string | null
  heroCtaText: string | null
  aboutTitle: string | null
  aboutText: string | null
  footerText: string | null
  announcementText: string | null
  announcementActive: boolean
  announcementBgColor: string | null
  logoPosition: string
  showRatings: boolean
  showPrepTime: boolean
  showAllergens: boolean
  showCuisineTypes: boolean
  heroStyle: string
  heroOverlayOpacity: number
  menuStyle: string
  productCardStyle: string
  showProductImages: boolean
  productConfig: Record<string, unknown> | null
  buttonStyle: string
  buttonSize: string
  customCss: string | null
  socialLinks: Record<string, string> | null
  headerDesign: string
  headerSticky: boolean
  headerTransparent: boolean
  headerBgOpacity: number
  headerTextColor: string
  footerDesign: string
  globalComponents?: {
    cart?: Record<string, unknown>
    header?: Record<string, unknown>
    footer?: Record<string, unknown>
  }
}

export interface StoreRestaurantData {
  id: string
  name: string
  description: string | null
  shortDescription: string | null
  logo: string | null
  coverImage: string | null
  images: string[]
  address: string
  addressLine2: string | null
  city: string
  postalCode: string
  country: string
  latitude: number | null
  longitude: number | null
  phone: string
  email: string
  website: string | null
  businessType: string
  cuisineTypes: string[]
}

export interface StoreSettingsData {
  currency: string
  language: string
  acceptCash: boolean
  acceptCard: boolean
  acceptOnlinePayment: boolean
  tipsEnabled: boolean
  suggestedTips: number[]
  avgPrepTime: number
  metaTitle: string | null
  metaDescription: string | null
  metaKeywords: string[]
  deliveryEnabled?: boolean
  pickupEnabled?: boolean
  dineInEnabled?: boolean
  deliveryFee?: number
  subdomain?: string
  favicon?: string | null
  ogImage?: string | null
  facebookPixelId?: string | null
  googleAnalyticsId?: string | null
  googleTagManagerId?: string | null
  tiktokPixelId?: string | null
  snapPixelId?: string | null
  customHeadScript?: string | null
  termsUrl?: string | null
  privacyUrl?: string | null
  homePageId?: string | null
}

export interface StoreOpeningHour {
  dayOfWeek: number
  isOpen: boolean
  slots: {
    openTime: string
    closeTime: string
    serviceTypes: string[]
  }[]
}

export interface StoreDeliveryData {
  isEnabled: boolean
  minOrderAmount: number | null
  baseFee: number | null
  freeDeliveryMin: number | null
  avgDeliveryTime: number
}

export interface StoreBannerStyles {
  bgType?: 'solid' | 'gradient' | 'image'
  bgColor?: string
  bgGradientFrom?: string
  bgGradientTo?: string
  bgGradientDirection?: string
  textColor?: string
  overlayOpacity?: number
  objectFit?: 'cover' | 'contain' | 'fill'
  blur?: number
  ctaBgColor?: string
  ctaTextColor?: string
  ctaIcon?: string
}

export interface StoreBannerCoupon {
  id: string
  code: string
  discountType: string
  discountValue: string | number
}

export interface StoreBannerData {
  id: string
  displayType: string
  contentMode: string
  title: string | null
  subtitle: string | null
  image: string | null
  ctaText: string | null
  ctaLink: string | null
  couponId: string | null
  coupon: StoreBannerCoupon | null
  pages: string[]
  position: string
  dismissable: boolean
  sticky: boolean
  styles: StoreBannerStyles | null
  startDate: string | null
  endDate: string | null
}

export interface StoreData {
  restaurant: StoreRestaurantData
  theme: StoreThemeData | null
  settings: StoreSettingsData | null
  openingHours: StoreOpeningHour[]
  delivery: StoreDeliveryData | null
  banners: StoreBannerData[]
}

// ============================================
// MENU DATA (from API)
// ============================================

export interface StoreModifier {
  id: string
  name: string
  price: number
  isDefault: boolean
}

export interface StoreModifierGroup {
  id: string
  name: string
  isRequired: boolean
  minSelections: number
  maxSelections: number
  modifiers: StoreModifier[]
}

export interface StoreVariant {
  id: string
  name: string
  price: number
  compareAtPrice: number | null
  isDefault: boolean
}

export interface StoreProduct {
  id: string
  name: string
  nameEn: string | null
  slug: string
  description: string | null
  descriptionEn: string | null
  price: number
  compareAtPrice: number | null
  image: string | null
  images: string[]
  isFeatured: boolean
  prepTime: number | null
  calories: number | null
  allergens: string[]
  dietaryTags: string[]
  taxRate: { id: string; name: string; rate: number } | null
  taxIncluded: boolean
  variants: StoreVariant[]
  modifierGroups: StoreModifierGroup[]
}

export interface StoreCategory {
  id: string
  name: string
  nameEn: string | null
  slug: string
  description: string | null
  image: string | null
  sortOrder: number
  products: StoreProduct[]
}

// ============================================
// THEME COMPONENTS INTERFACE
// ============================================

export interface StorePageLink {
  slug: string
  title: string
  pageType: string | null
  href: string
}

export interface HeaderCustomer {
  id: string
  firstName: string
  lastName: string
  email: string
}

export interface HeaderProps {
  restaurant: StoreRestaurantData
  theme: StoreThemeData
  cartItemCount: number
  onCartClick: () => void
  pages: StorePageLink[]
  currentPath: string
  forceRelative?: boolean
  customer?: HeaderCustomer | null
  subdomain: string
}

export interface HeroProps {
  restaurant: StoreRestaurantData
  theme: StoreThemeData
  openingHours: StoreOpeningHour[]
  settings?: StoreSettingsData | null
  delivery?: StoreDeliveryData | null
  menuHref: string
  sections?: PageSectionsData
}

export interface MenuSectionProps {
  categories: StoreCategory[]
  theme: StoreThemeData
  settings: StoreSettingsData | null
  onProductClick: (product: StoreProduct) => void
  sections?: PageSectionsData
  restaurant?: StoreRestaurantData
  openingHours?: StoreOpeningHour[]
}

export interface ProductCardSectionOverrides {
  cardStyle?: string
  imageRatio?: string
  showImages?: boolean
  showPrices?: boolean
  showDescriptions?: boolean
  showBadges?: boolean
  listImagePosition?: string
}

export interface ProductCardProps {
  product: StoreProduct
  theme: StoreThemeData
  settings: StoreSettingsData | null
  onClick: () => void
  sectionOverrides?: ProductCardSectionOverrides
}

export interface ProductModalProps {
  product: StoreProduct | null
  theme: StoreThemeData
  settings: StoreSettingsData | null
  isOpen: boolean
  onClose: () => void
  onAddToCart: (item: CartItemInput) => void
}

export interface CartDrawerProps {
  theme: StoreThemeData
  settings: StoreSettingsData | null
  isOpen: boolean
  onClose: () => void
  onCheckout: () => void
  sectionData?: Record<string, unknown>
}

export interface FooterProps {
  restaurant: StoreRestaurantData
  theme: StoreThemeData
  openingHours: StoreOpeningHour[]
  pages?: StorePageLink[]
}

export interface RestaurantInfoProps {
  restaurant: StoreRestaurantData
  theme: StoreThemeData
  openingHours: StoreOpeningHour[]
  delivery: StoreDeliveryData | null
  sections?: PageSectionsData
}

export interface AnnouncementBarProps {
  theme: StoreThemeData
}

export interface HomePageProps {
  restaurant: StoreRestaurantData
  theme: StoreThemeData
  openingHours: StoreOpeningHour[]
  categories: StoreCategory[]
  settings: StoreSettingsData | null
  delivery: StoreDeliveryData | null
  banners: StoreBannerData[]
  menuHref: string
  contactHref: string
  onProductClick: (product: StoreProduct) => void
  sections?: PageSectionsData
}

export interface ContactPageProps {
  restaurant: StoreRestaurantData
  theme: StoreThemeData
  openingHours: StoreOpeningHour[]
  delivery: StoreDeliveryData | null
  banners: StoreBannerData[]
  subdomain: string
  sections?: PageSectionsData
}

export interface CustomPageProps {
  page: { title: string; content: string; slug: string }
  restaurant: StoreRestaurantData
  theme: StoreThemeData
  banners: StoreBannerData[]
  sections?: PageSectionsData
  sectionOrder?: string[]
}

export interface AboutPageProps {
  restaurant: StoreRestaurantData
  theme: StoreThemeData
  openingHours: StoreOpeningHour[]
  delivery: StoreDeliveryData | null
  banners: StoreBannerData[]
  menuHref: string
  contactHref: string
  sections?: PageSectionsData
}

// ============================================
// THEME SECTION CONFIG (theme-driven customization)
// ============================================

export type SectionFieldType = 'text' | 'textarea' | 'color' | 'switch' | 'select' | 'multiselect' | 'number' | 'slider' | 'image' | 'gallery' | 'icon' | 'testimonials' | 'testimonials-with-product' | 'separator' | 'array'

export interface SectionFieldOption {
  value: string
  label: string
}

export interface SectionFieldDef {
  key: string
  label: string
  type: SectionFieldType
  placeholder?: string
  description?: string
  defaultValue?: string | number | boolean | string[] | Record<string, unknown>[]
  options?: SectionFieldOption[]
  min?: number
  max?: number
  step?: number
  showWhen?: { field: string; value: unknown }
  itemLabel?: string
  itemFields?: Omit<SectionFieldDef, 'itemLabel' | 'itemFields' | 'showWhen'>[]
}

export interface ThemeSectionDef {
  id: string
  label: string
  description?: string
  fields: SectionFieldDef[]
  syncFromPage?: string
}

export interface ThemePageSections {
  [pageType: string]: ThemeSectionDef[]
}

export interface ThemeGlobalComponentsConfig {
  cart?: ThemeSectionDef[]
  header?: ThemeSectionDef[]
  footer?: ThemeSectionDef[]
}

export type PageSectionsData = Record<string, Record<string, unknown>>

// ============================================
// THEME COMPONENTS MAP
// ============================================

export interface ThemeComponents {
  Header: React.ComponentType<HeaderProps>
  Hero: React.ComponentType<HeroProps>
  MenuSection: React.ComponentType<MenuSectionProps>
  ProductCard: React.ComponentType<ProductCardProps>
  ProductModal: React.ComponentType<ProductModalProps>
  CartDrawer: React.ComponentType<CartDrawerProps>
  Footer: React.ComponentType<FooterProps>
  RestaurantInfo: React.ComponentType<RestaurantInfoProps>
  AnnouncementBar: React.ComponentType<AnnouncementBarProps>
  HomePage: React.ComponentType<HomePageProps>
  ContactPage: React.ComponentType<ContactPageProps>
  CustomPage: React.ComponentType<CustomPageProps>
  AboutPage?: React.ComponentType<AboutPageProps>
  CheckoutPage?: React.ComponentType<CheckoutPageProps>
  ThanksPage?: React.ComponentType<ThanksPageProps>
  TrackPage?: React.ComponentType<TrackPageProps>
  LoginPage?: React.ComponentType<LoginPageProps>
  RegisterPage?: React.ComponentType<RegisterPageProps>
  AccountPage?: React.ComponentType<AccountPageProps>
  ForgotPasswordPage?: React.ComponentType<ForgotPasswordPageProps>
  ResetPasswordPage?: React.ComponentType<ResetPasswordPageProps>
  sectionConfig: ThemePageSections
  globalComponentsConfig?: ThemeGlobalComponentsConfig
  supportedPages: string[]
}

// ============================================
// CUSTOMER PAGE PROPS
// ============================================

export interface CheckoutPageProps {
  restaurant: StoreRestaurantData
  settings: StoreSettingsData
  theme: StoreThemeData
  sections?: PageSectionsData
  subdomain: string
  onSubmit: (data: CheckoutSubmitData) => Promise<void>
}

export interface CheckoutSubmitData {
  serviceType: 'DELIVERY' | 'PICKUP' | 'DINE_IN'
  paymentMethod: 'CASH' | 'CARD' | 'MOBILE_MONEY'
  customerName: string
  customerEmail: string
  customerPhone: string
  deliveryAddress?: string
  notes?: string
  tip?: number
  loyaltyPointsToUse?: number
}

export interface ThanksPageProps {
  restaurant: StoreRestaurantData
  settings: StoreSettingsData
  theme: StoreThemeData
  sections?: PageSectionsData
  subdomain: string
  order: ThanksOrderData
}

export interface ThanksOrderData {
  id: string
  orderNumber: string
  status: string
  serviceType: string
  estimatedTime?: number
  total: number
  items: { productName: string; quantity: number; totalPrice: number }[]
}

export interface TrackOrderDeliveryDriver {
  firstName: string
  lastName: string
  phone: string | null
  avatar: string | null
  vehicleType: string | null
}

export interface TrackOrderDelivery {
  id: string
  status: string
  estimatedTime: number | null
  assignedAt: string | null
  pickedUpAt: string | null
  deliveredAt: string | null
  driver: TrackOrderDeliveryDriver | null
}

export interface TrackOrderData {
  id: string
  orderNumber: string
  displayNumber: string
  status: string
  serviceType: string
  paymentStatus: string
  paymentMethod?: string
  subtotal: number
  taxAmount: number
  total: number
  estimatedTime: number
  createdAt: string
  items: {
    id: string
    productId: string
    productName: string
    variantId?: string | null
    variantName: string | null
    quantity: number
    unitPrice: number
    totalPrice: number
  }[]
  delivery?: TrackOrderDelivery | null
}

export interface TrackPageProps {
  restaurant: StoreRestaurantData
  settings: StoreSettingsData
  theme: StoreThemeData
  sections?: PageSectionsData
  subdomain: string
  order: TrackOrderData
  onRefresh: () => void
  isRefreshing: boolean
  dataUpdatedAt?: number
  onMarkPickedUp?: () => Promise<void>
}

export interface LoginPageProps {
  restaurant: StoreRestaurantData
  settings: StoreSettingsData
  theme: StoreThemeData
  sections?: PageSectionsData
  subdomain: string
  redirectTo?: string
  onSuccess?: () => void
}

export interface RegisterPageProps {
  restaurant: StoreRestaurantData
  settings: StoreSettingsData
  theme: StoreThemeData
  sections?: PageSectionsData
  subdomain: string
  redirectTo?: string
  onSuccess?: () => void
}

export interface AccountPageProps {
  restaurant: StoreRestaurantData
  settings: StoreSettingsData
  theme: StoreThemeData
  sections?: PageSectionsData
  subdomain: string
  initialTab?: string
}

export interface AccountRecentOrder {
  id: string
  orderNumber: string
  createdAt: string
  status: string
  total: number
}

export interface ForgotPasswordPageProps {
  restaurant: StoreRestaurantData
  theme: StoreThemeData
  sections?: PageSectionsData
  subdomain: string
}

export interface ResetPasswordPageProps {
  restaurant: StoreRestaurantData
  theme: StoreThemeData
  sections?: PageSectionsData
  subdomain: string
  token: string | null
}

// ============================================
// THEME METADATA
// ============================================

export interface ThemeMeta {
  id: string
  name: string
  description: string
  preview: string
  tags: string[]
}

// ============================================
// CART TYPES
// ============================================

export interface CartItemInput {
  productId: string
  productName: string
  variantId: string | null
  variantName: string | null
  quantity: number
  unitPrice: number
  modifiers: { id: string; name: string; price: number }[]
  notes: string | null
  image: string | null
}

export interface CartItem extends CartItemInput {
  cartId: string
  totalPrice: number
}
