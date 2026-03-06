import { 
  LayoutDashboard, 
  ShoppingBag, 
  UtensilsCrossed,
  Users,
  BarChart3,
  Settings,
  MessageSquare,
  Calculator,
} from 'lucide-react'
import { NavGroup } from '@/components/shared/dashboard/sidebar'

export const restaurantNavigation: NavGroup[] = [
  {
    title: 'Principal',
    items: [
      { label: 'Tableau de bord', href: '/restaurant', icon: LayoutDashboard },
      { label: 'Caisse', href: '/restaurant/pos', icon: Calculator },
      { label: 'Commandes', href: '/restaurant/orders', icon: ShoppingBag },
      { label: 'Menu', href: '/restaurant/menu', icon: UtensilsCrossed },
      { label: 'Clients', href: '/restaurant/customers', icon: Users },
    ],
  },
  {
    title: 'Outils',
    items: [
      { label: 'Statistiques', href: '/restaurant/analytics', icon: BarChart3 },
      { label: 'Support', href: '/restaurant/support', icon: MessageSquare },
      { label: 'Parametres', href: '/restaurant/settings', icon: Settings },
    ],
  },
]
