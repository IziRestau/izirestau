import { 
  LayoutDashboard, 
  Building2,
  Users,
  CreditCard,
  MessageSquare,
  Settings,
  BarChart3,
  Shield,
  Store,
  Package,
} from 'lucide-react'
import { NavGroup } from '@/components/shared/dashboard/sidebar'

export const platformNavigation: NavGroup[] = [
  {
    title: 'Principal',
    items: [
      { label: 'Dashboard', href: '/platform', icon: LayoutDashboard },
      { label: 'Revendeurs', href: '/platform/resellers', icon: Building2 },
      { label: 'Restaurants', href: '/platform/restaurants', icon: Store },
      { label: 'Utilisateurs', href: '/platform/users', icon: Users },
    ],
  },
  {
    title: 'Gestion',
    items: [
      { label: 'Licences', href: '/platform/licenses', icon: CreditCard },
      { label: 'Plans', href: '/platform/licenses/plans', icon: Package },
      { label: 'Support', href: '/platform/support', icon: MessageSquare },
    ],
  },
  {
    title: 'Outils',
    items: [
      { label: 'Analytics', href: '/platform/analytics', icon: BarChart3 },
      { label: 'Parametres', href: '/platform/settings', icon: Settings },
    ],
  },
]
