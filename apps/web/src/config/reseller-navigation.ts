import { 
  LayoutDashboard, 
  Store,
  BarChart3,
  CreditCard,
  FileText,
  Settings,
  HelpCircle,
  Sparkles,
  Package,
  Globe,
  Receipt,
} from 'lucide-react'
import { NavGroup } from '@/components/shared/dashboard/sidebar'

export const resellerPromoCard = {
  icon: Sparkles,
  title: 'Passez au niveau supérieur',
  description: 'Débloquez plus de fonctionnalités',
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
    title: 'Vitrine',
    items: [
      { label: 'Plans tarifaires', href: '/reseller/plans', icon: Package },
      { label: 'Ma vitrine', href: '/reseller/showcase', icon: Globe },
    ],
  },
  {
    title: 'Facturation',
    items: [
      { label: 'Ma Licence', href: '/reseller/license', icon: CreditCard },
      { label: 'Transactions', href: '/reseller/transactions', icon: Receipt },
      { label: 'Factures', href: '/reseller/invoices', icon: FileText },
    ],
  },
  {
    title: 'Outils',
    items: [
      { label: 'Analytics', href: '/reseller/analytics', icon: BarChart3 },
      { label: 'Paramètres', href: '/reseller/settings', icon: Settings },
      { label: 'Support', href: '/reseller/support', icon: HelpCircle },
    ],
  },
]
