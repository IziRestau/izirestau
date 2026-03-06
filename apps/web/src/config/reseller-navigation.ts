import { 
  LayoutDashboard, 
  Store,
  BarChart3,
  CreditCard,
  FileText,
  Settings,
  HelpCircle,
  Sparkles,
} from 'lucide-react'
import { NavGroup } from '@/components/shared/dashboard/sidebar'

export const resellerPromoCard = {
  icon: Sparkles,
  title: 'Passez au niveau superieur',
  description: 'Debloquez plus de fonctionnalites',
  buttonText: 'Voir les plans',
  href: '/reseller/license',
}

export const resellerNavigation: NavGroup[] = [
  {
    title: 'Principal',
    items: [
      { label: 'Dashboard', href: '/reseller', icon: LayoutDashboard },
      { label: 'Restaurants', href: '/reseller/restaurants', icon: Store },
    ],
  },
  {
    title: 'Facturation',
    items: [
      { label: 'Ma Licence', href: '/reseller/license', icon: CreditCard },
      { label: 'Factures', href: '/reseller/invoices', icon: FileText },
    ],
  },
  {
    title: 'Outils',
    items: [
      { label: 'Analytics', href: '/reseller/analytics', icon: BarChart3 },
      { label: 'Parametres', href: '/reseller/settings', icon: Settings },
      { label: 'Support', href: '/reseller/support', icon: HelpCircle },
    ],
  },
]
