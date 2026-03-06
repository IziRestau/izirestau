# Skill: Design System & Composants

## Quand utiliser ce skill
- Création de nouveaux composants UI
- Modification du design system
- Questions sur les couleurs, typo, espacements
- Ajout de nouveaux patterns visuels

---

## Design Tokens

### Couleurs
```css
/* Primaires */
--primary: #FF6B00;        /* Orange IziResto */
--primary-foreground: #FFFFFF;

/* Secondaires */
--secondary: #1A1A1A;
--secondary-foreground: #FFFFFF;

/* Accent */
--accent: #FFB800;

/* Sémantiques */
--success: #22C55E;
--warning: #F59E0B;
--error: #EF4444;
--info: #3B82F6;

/* Neutres */
--background: #FFFFFF;
--foreground: #1A1A1A;
--muted: #F4F4F5;
--muted-foreground: #71717A;
--border: #E4E4E7;
```

### Espacements (Tailwind)
```
4px  = p-1, m-1
8px  = p-2, m-2
12px = p-3, m-3
16px = p-4, m-4
24px = p-6, m-6
32px = p-8, m-8
48px = p-12, m-12
64px = p-16, m-16
```

### Typographie
```
Heading 1: text-3xl font-bold (30px)
Heading 2: text-2xl font-semibold (24px)
Heading 3: text-xl font-semibold (20px)
Heading 4: text-lg font-medium (18px)
Body: text-base (16px)
Small: text-sm (14px)
Tiny: text-xs (12px)
```

### Border Radius
```
Petit: rounded (4px)
Medium: rounded-md (6px)
Large: rounded-lg (8px)
XL: rounded-xl (12px)
Full: rounded-full
```

### Shadows
```
Petit: shadow-sm
Medium: shadow
Large: shadow-lg
```

---

## Composants shadcn/ui Disponibles

### Déjà installés (à utiliser en priorité)
- `Button` - Boutons avec variants
- `Card` - Conteneurs avec header/content/footer
- `Input` - Champs texte
- `Label` - Labels formulaires
- `Select` - Sélecteurs dropdown
- `Dialog` - Modales
- `Sheet` - Panneaux latéraux
- `DropdownMenu` - Menus contextuels
- `Table` - Tableaux
- `Badge` - Badges/tags
- `Avatar` - Avatars utilisateurs
- `Skeleton` - Loading states
- `Separator` - Séparateurs
- `Tabs` - Onglets
- `Toast` - Notifications

### À installer si besoin
```bash
npx shadcn-ui@latest add [component]
```
- `Accordion` - Accordéons
- `AlertDialog` - Confirmations
- `Calendar` - Calendrier
- `Checkbox` - Cases à cocher
- `Command` - Palette commandes
- `DatePicker` - Sélecteur date
- `Form` - Wrapper formulaires
- `Popover` - Popovers
- `Progress` - Barres progression
- `RadioGroup` - Boutons radio
- `ScrollArea` - Zone scrollable
- `Slider` - Curseurs
- `Switch` - Toggles
- `Textarea` - Zones texte
- `Tooltip` - Infobulles

---

## Composants Custom à Créer

### packages/ui (réutilisables cross-dashboard)
```
DataTable.tsx       - Table avec tri, pagination, filtres
StatCard.tsx        - Carte statistique avec icone
PageHeader.tsx      - Header de page avec titre, actions
EmptyState.tsx      - État vide avec illustration
LoadingState.tsx    - État chargement
ErrorState.tsx      - État erreur avec retry
ConfirmDialog.tsx   - Dialog de confirmation
SearchInput.tsx     - Input recherche avec debounce
DateRangePicker.tsx - Sélecteur période
StatusBadge.tsx     - Badge avec couleur selon status
CurrencyDisplay.tsx - Affichage montant formaté
```

### apps/web/src/components/shared
```
Sidebar.tsx         - Navigation latérale
TopNav.tsx          - Barre navigation top
UserMenu.tsx        - Menu utilisateur
NotificationBell.tsx - Notifications
Breadcrumbs.tsx     - Fil d'ariane
```

---

## Patterns de Composants

### Structure d'un composant
```tsx
// components/ui/StatCard.tsx
import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function StatCard({ title, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <p className={cn(
                'text-sm',
                trend.isPositive ? 'text-success' : 'text-error'
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </p>
            )}
          </div>
          <div className="rounded-full bg-primary/10 p-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### Utilisation de cn() pour classes conditionnelles
```tsx
import { cn } from '@/lib/utils'

<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  variant === 'primary' && 'primary-classes',
  className
)} />
```

### Variants avec CVA
```tsx
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline: 'border border-input bg-background hover:bg-accent',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)
```

---

## Icones (Lucide)

### Import
```tsx
import { Home, Settings, Users, ShoppingBag } from 'lucide-react'
```

### Tailles standards
```tsx
<Icon className="h-4 w-4" />  // Petit (boutons, badges)
<Icon className="h-5 w-5" />  // Medium (navigation)
<Icon className="h-6 w-6" />  // Large (cards)
<Icon className="h-8 w-8" />  // XL (empty states)
```

### Icones par domaine
```
Navigation: Home, LayoutDashboard, Settings, LogOut
Users: User, Users, UserPlus, UserCheck
Commerce: ShoppingBag, ShoppingCart, Package, Receipt
Finance: CreditCard, Wallet, DollarSign, TrendingUp
Restaurant: UtensilsCrossed, ChefHat, Soup, Pizza
Livraison: Truck, MapPin, Navigation, Clock
Actions: Plus, Edit, Trash2, Download, Upload, Search
Status: Check, X, AlertCircle, Info, AlertTriangle
```

---

## Responsive Design

### Breakpoints Tailwind
```
sm: 640px   - Mobile landscape
md: 768px   - Tablette
lg: 1024px  - Desktop
xl: 1280px  - Large desktop
2xl: 1536px - Extra large
```

### Pattern mobile-first
```tsx
<div className="
  grid grid-cols-1      // Mobile: 1 colonne
  sm:grid-cols-2        // Tablette: 2 colonnes
  lg:grid-cols-4        // Desktop: 4 colonnes
  gap-4
">
```

### Sidebar responsive
```tsx
// Mobile: Sheet (drawer)
// Desktop: Sidebar fixe
<Sheet>
  <SheetTrigger className="lg:hidden">
    <Menu />
  </SheetTrigger>
  <SheetContent side="left">
    <Navigation />
  </SheetContent>
</Sheet>

<aside className="hidden lg:flex lg:w-64">
  <Navigation />
</aside>
```

---

## Dark Mode

### Configuration
```tsx
// tailwind.config.js
module.exports = {
  darkMode: 'class',
}
```

### Classes
```tsx
<div className="bg-white dark:bg-gray-900">
  <p className="text-gray-900 dark:text-gray-100">
    Texte adaptatif
  </p>
</div>
```

### Toggle
```tsx
import { useTheme } from 'next-themes'

const { theme, setTheme } = useTheme()

<Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
  {theme === 'dark' ? <Sun /> : <Moon />}
</Button>
```
