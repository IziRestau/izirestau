import { 
  LayoutDashboard, 
  ShoppingBag, 
  UtensilsCrossed,
  Users,
  BarChart3,
  Settings,
  MessageSquare,
  Calculator,
  Image,
  Package,
  Truck,
  ArrowUpDown,
  ChefHat,
  Globe,
  Megaphone,
  Bike,
  LucideIcon,
} from 'lucide-react'
import { useRestaurantPermissions } from './use-restaurant-permissions'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  children?: { label: string; href: string }[]
}

interface NavGroup {
  title: string
  items: NavItem[]
}

/**
 * Hook qui retourne la navigation restaurant filtree selon les permissions de l'utilisateur
 */
export function useRestaurantNavigation(): NavGroup[] {
  const { 
    canManageMenu, 
    canViewCustomers, 
    canViewRevenue,
    isDriver,
  } = useRestaurantPermissions()

  // Navigation spécifique pour les livreurs
  if (isDriver) {
    return [
      {
        title: 'Principal',
        items: [
          { label: 'Tableau de bord', href: '/restaurant', icon: LayoutDashboard },
          { label: 'Mes livraisons', href: '/restaurant/delivery', icon: Bike },
        ],
      },
      {
        title: 'Outils',
        items: [
          { label: 'Support', href: '/restaurant/support', icon: MessageSquare },
          { label: 'Mon profil', href: '/restaurant/settings', icon: Settings },
        ],
      },
    ]
  }

  const navigation: NavGroup[] = [
    {
      title: 'Principal',
      items: [
        { label: 'Tableau de bord', href: '/restaurant', icon: LayoutDashboard },
        { label: 'Caisse', href: '/restaurant/pos', icon: Calculator },
        { label: 'Commandes', href: '/restaurant/orders', icon: ShoppingBag },
        // Menu visible seulement pour OWNER et MANAGER
        ...(canManageMenu ? [{ label: 'Menu', href: '/restaurant/menu', icon: UtensilsCrossed }] : []),
        // Inventaire visible seulement pour OWNER et MANAGER
        ...(canManageMenu ? [{ 
          label: 'Inventaire', 
          href: '/restaurant/inventory', 
          icon: Package,
          children: [
            { label: 'Tableau de bord', href: '/restaurant/inventory' },
            { label: 'Ingrédients', href: '/restaurant/inventory/ingredients' },
            { label: 'Fournisseurs', href: '/restaurant/inventory/suppliers' },
            { label: 'Mouvements', href: '/restaurant/inventory/movements' },
            { label: 'Recettes', href: '/restaurant/inventory/recipes' },
          ]
        }] : []),
        // Clients visible pour OWNER, MANAGER et STAFF
        ...(canViewCustomers ? [{ label: 'Clients', href: '/restaurant/customers', icon: Users }] : []),
        // Mon Site visible pour OWNER et MANAGER
        ...(canManageMenu ? [{
          label: 'Mon Site',
          href: '/restaurant/site',
          icon: Globe,
          children: [
            { label: 'Vue d\'ensemble', href: '/restaurant/site' },
            { label: 'Apparence', href: '/restaurant/site/theme' },
            { label: 'Bannières', href: '/restaurant/site/banners' },
            { label: 'Pages', href: '/restaurant/site/pages' },
            { label: 'Réglages', href: '/restaurant/site/settings' },
          ]
        }] : []),
        // Marketing visible pour OWNER et MANAGER
        ...(canManageMenu ? [{
          label: 'Marketing',
          href: '/restaurant/marketing',
          icon: Megaphone,
          children: [
            { label: 'Vue d\'ensemble', href: '/restaurant/marketing' },
            { label: 'Campagnes email', href: '/restaurant/marketing/campaigns' },
            { label: 'Coupons', href: '/restaurant/marketing/coupons' },
            { label: 'Promotions', href: '/restaurant/marketing/promotions' },
            { label: 'Avis clients', href: '/restaurant/marketing/reviews' },
            { label: 'Fidélité', href: '/restaurant/marketing/loyalty' },
            { label: 'Réglages', href: '/restaurant/marketing/settings' },
          ]
        }] : []),
        // Livraison visible pour OWNER et MANAGER
        ...(canManageMenu ? [{
          label: 'Livraison',
          href: '/restaurant/delivery',
          icon: Truck,
          children: [
            { label: 'Livraisons', href: '/restaurant/delivery' },
            { label: 'Livreurs', href: '/restaurant/delivery/drivers' },
            { label: 'Zones', href: '/restaurant/delivery/zones' },
          ]
        }] : []),
      ],
    },
    {
      title: 'Outils',
      items: [
        // Statistiques visible seulement pour OWNER et MANAGER
        ...(canViewRevenue ? [{ label: 'Statistiques', href: '/restaurant/analytics', icon: BarChart3 }] : []),
        // Médiathèque visible pour OWNER et MANAGER
        ...(canManageMenu ? [{ label: 'Médiathèque', href: '/restaurant/media', icon: Image }] : []),
        { label: 'Support', href: '/restaurant/support', icon: MessageSquare },
        { label: 'Paramètres', href: '/restaurant/settings', icon: Settings },
      ],
    },
  ]

  // Filtrer les groupes vides
  return navigation.filter(group => group.items.length > 0)
}

/**
 * Navigation statique pour les cas ou le hook ne peut pas etre utilise
 * (ex: dans les fichiers de config)
 */
export const restaurantNavigationStatic: NavGroup[] = [
  {
    title: 'Principal',
    items: [
      { label: 'Tableau de bord', href: '/restaurant', icon: LayoutDashboard },
      { label: 'Caisse', href: '/restaurant/pos', icon: Calculator },
      { label: 'Commandes', href: '/restaurant/orders', icon: ShoppingBag },
      { label: 'Menu', href: '/restaurant/menu', icon: UtensilsCrossed },
      { 
        label: 'Inventaire', 
        href: '/restaurant/inventory', 
        icon: Package,
        children: [
          { label: 'Tableau de bord', href: '/restaurant/inventory' },
          { label: 'Ingrédients', href: '/restaurant/inventory/ingredients' },
          { label: 'Fournisseurs', href: '/restaurant/inventory/suppliers' },
          { label: 'Mouvements', href: '/restaurant/inventory/movements' },
          { label: 'Recettes', href: '/restaurant/inventory/recipes' },
        ]
      },
      { label: 'Clients', href: '/restaurant/customers', icon: Users },
      {
        label: 'Mon Site',
        href: '/restaurant/site',
        icon: Globe,
        children: [
          { label: 'Vue d\'ensemble', href: '/restaurant/site' },
          { label: 'Apparence', href: '/restaurant/site/theme' },
          { label: 'Bannières', href: '/restaurant/site/banners' },
          { label: 'Pages', href: '/restaurant/site/pages' },
          { label: 'Réglages', href: '/restaurant/site/settings' },
        ]
      },
      {
        label: 'Marketing',
        href: '/restaurant/marketing',
        icon: Megaphone,
        children: [
          { label: 'Vue d\'ensemble', href: '/restaurant/marketing' },
          { label: 'Campagnes email', href: '/restaurant/marketing/campaigns' },
          { label: 'Coupons', href: '/restaurant/marketing/coupons' },
          { label: 'Promotions', href: '/restaurant/marketing/promotions' },
          { label: 'Avis clients', href: '/restaurant/marketing/reviews' },
          { label: 'Fidélité', href: '/restaurant/marketing/loyalty' },
          { label: 'Réglages', href: '/restaurant/marketing/settings' },
        ]
      },
      {
        label: 'Livraison',
        href: '/restaurant/delivery',
        icon: Truck,
        children: [
          { label: 'Livraisons', href: '/restaurant/delivery' },
          { label: 'Livreurs', href: '/restaurant/delivery/drivers' },
          { label: 'Zones', href: '/restaurant/delivery/zones' },
        ]
      },
    ],
  },
  {
    title: 'Outils',
    items: [
      { label: 'Statistiques', href: '/restaurant/analytics', icon: BarChart3 },
      { label: 'Médiathèque', href: '/restaurant/media', icon: Image },
      { label: 'Support', href: '/restaurant/support', icon: MessageSquare },
      { label: 'Paramètres', href: '/restaurant/settings', icon: Settings },
    ],
  },
]
