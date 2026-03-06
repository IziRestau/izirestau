export interface ProductConfig {
  // Carte produit
  cardStyle: string          // 'standard' | 'minimal' | 'horizontal' | 'detailed'
  cardRadius: string         // 'sm' | 'md' | 'lg' | 'full'
  cardShadow: string         // 'none' | 'sm' | 'md' | 'lg'
  cardBorder: boolean
  // Image
  showImages: boolean
  imageRatio: string         // '1:1' | '4:3' | '16:9' | '3:2'
  imageFit: string           // 'cover' | 'contain'
  hoverEffect: string        // 'none' | 'zoom' | 'shadow' | 'scale'
  // Contenu
  showDescription: boolean
  descriptionLines: number   // 1, 2, 3
  pricePosition: string      // 'below' | 'right' | 'badge'
  priceColor: string         // hex ou vide = primaryColor
  showBadges: boolean
  // Bouton ajouter
  addButtonStyle: string     // 'icon' | 'text' | 'both'
  // Grille menu
  listImagePosition: string  // 'left' | 'right'
  menuLayout: string         // 'grid' | 'list' | 'compact'
  gridColumns: string        // '2' | '3' | '4'
  gridGap: string            // 'sm' | 'md' | 'lg'
  categoryStyle: string      // 'pills' | 'underline' | 'buttons'
  // Produits en vedette
  featuredLayout: string     // 'grid' | 'carousel'
  featuredColumns: string    // '2' | '3' | '4'
  featuredCardStyle: string  // 'vertical' | 'horizontal' | 'overlay' | 'minimal'
  featuredMaxItems: number   // 4, 6, 8
  featuredImageRatio: string // '1:1' | '4:3' | '16:9' | '16:10'
  featuredShowBadge: boolean
}

export const DEFAULT_PRODUCT_CONFIG: ProductConfig = {
  cardStyle: 'standard',
  cardRadius: 'lg',
  cardShadow: 'none',
  cardBorder: true,
  showImages: true,
  imageRatio: '4:3',
  imageFit: 'cover',
  hoverEffect: 'zoom',
  showDescription: true,
  descriptionLines: 2,
  pricePosition: 'below',
  priceColor: '',
  showBadges: true,
  addButtonStyle: 'icon',
  listImagePosition: 'left',
  menuLayout: 'grid',
  gridColumns: '3',
  gridGap: 'md',
  categoryStyle: 'pills',
  featuredLayout: 'grid',
  featuredColumns: '3',
  featuredCardStyle: 'vertical',
  featuredMaxItems: 6,
  featuredImageRatio: '16:10',
  featuredShowBadge: true,
}

export interface CartConfig {
  cartType: string
  drawerPosition: string
  drawerWidth: string
  itemLayout: string
  showItemImages: boolean
  imageSize: string
  showVariants: boolean
  showModifiers: boolean
  showUnitPrice: boolean
  quantityControlStyle: string
  allowRemoveFromCart: boolean
  showClearCartButton: boolean
  showSubtotal: boolean
  showItemCount: boolean
  checkoutButtonText: string
  showCheckoutButtonPrice: boolean
  emptyCartTitle: string
  emptyCartMessage: string
  showContinueShoppingButton: boolean
  enableAnimations: boolean
  animationSpeed: string
  showBackdrop: boolean
  backdropBlur: boolean
  closeOnBackdropClick: boolean
}

export const DEFAULT_CART_CONFIG: CartConfig = {
  cartType: 'drawer',
  drawerPosition: 'right',
  drawerWidth: 'md',
  itemLayout: 'detailed',
  showItemImages: true,
  imageSize: 'md',
  showVariants: true,
  showModifiers: true,
  showUnitPrice: false,
  quantityControlStyle: 'inline',
  allowRemoveFromCart: true,
  showClearCartButton: true,
  showSubtotal: true,
  showItemCount: true,
  checkoutButtonText: 'Commander',
  showCheckoutButtonPrice: true,
  emptyCartTitle: 'Votre panier est vide',
  emptyCartMessage: 'Ajoutez des articles depuis le menu',
  showContinueShoppingButton: false,
  enableAnimations: true,
  animationSpeed: 'normal',
  showBackdrop: true,
  backdropBlur: true,
  closeOnBackdropClick: true,
}

export interface ThemeFormData {
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
  heroTitle: string
  heroSubtitle: string
  heroCtaText: string
  aboutTitle: string
  aboutText: string
  footerText: string
  announcementText: string
  announcementActive: boolean
  announcementBgColor: string
  logoPosition: string
  showRatings: boolean
  showPrepTime: boolean
  showAllergens: boolean
  showCuisineTypes: boolean
  heroStyle: string
  heroOverlayOpacity: number
  heroImageUrl: string
  heroImages: string[]
  heroVideoUrl: string
  heroCtaLink: string
  announcementLink: string
  menuStyle: string
  productCardStyle: string
  showProductImages: boolean
  productConfig: ProductConfig
  buttonStyle: string
  buttonSize: string
  customCss: string
  socialLinks: Record<string, string>
  showAboutPage: boolean
  showContactPage: boolean
  showGallery: boolean
  showTestimonials: boolean
  showMap: boolean
  legalText: string
  privacyText: string
  headerDesign: string
  headerSticky: boolean
  headerTransparent: boolean
  headerBgOpacity: number
  headerTextColor: string
  footerDesign: string
  navigationConfig: Record<string, unknown> | null
  cartConfig: CartConfig
}

export interface ThemeTabProps {
  formData: ThemeFormData
  onChange: (partial: Partial<ThemeFormData>) => void
  primaryColor: string
  isSaving: boolean
  onSave: () => void
}

export const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Merriweather', label: 'Merriweather' },
  { value: 'Raleway', label: 'Raleway' },
  { value: 'Nunito', label: 'Nunito' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro' },
  { value: 'DM Sans', label: 'DM Sans' },
]
