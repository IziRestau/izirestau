# Skill: Composants Réutilisables

## Quand utiliser ce skill
- Création de nouveaux composants
- Réutilisation de patterns existants
- Éviter la duplication de code

---

## Règle d'Or

**Avant de créer un composant, vérifier s'il existe déjà ou s'il peut être généralisé.**

---

## Hiérarchie des Composants

```
packages/ui/                    # Composants partagés cross-dashboard
├── DataTable.tsx
├── StatCard.tsx
├── PageHeader.tsx
├── EmptyState.tsx
├── LoadingState.tsx
├── ErrorState.tsx
├── ConfirmDialog.tsx
├── SearchInput.tsx
├── DateRangePicker.tsx
├── StatusBadge.tsx
├── CurrencyDisplay.tsx
└── index.ts

apps/web/src/components/
├── ui/                         # shadcn/ui (ne pas modifier)
├── shared/                     # Partagés dans l'app
│   ├── Sidebar.tsx
│   ├── TopNav.tsx
│   ├── UserMenu.tsx
│   ├── NotificationBell.tsx
│   └── Breadcrumbs.tsx
├── platform/                   # Super Admin uniquement
├── reseller/                   # Revendeur uniquement
├── restaurant/                 # Restaurant uniquement
└── storefront/                 # Storefront uniquement
```

---

## Composants packages/ui

### DataTable
```tsx
// packages/ui/src/DataTable.tsx
'use client'

import { useState } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'
import { Button } from './button'
import { Input } from './input'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  pageSize?: number
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Rechercher...',
  pageSize = 10,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, globalFilter },
    initialState: { pagination: { pageSize } },
  })

  return (
    <div className="space-y-4">
      {searchKey && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Aucun résultat
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} sur {table.getPageCount()}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
```

### StatCard
```tsx
// packages/ui/src/StatCard.tsx
import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from './card'
import { cn } from './utils'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description,
  trend, 
  className 
}: StatCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <p className={cn(
                'text-sm font-medium',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </p>
            )}
          </div>
          <div className="rounded-lg bg-primary/10 p-3">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### PageHeader
```tsx
// packages/ui/src/PageHeader.tsx
import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  breadcrumbs?: ReactNode
}

export function PageHeader({ title, description, action, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="space-y-4">
      {breadcrumbs}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  )
}
```

### StatusBadge
```tsx
// packages/ui/src/StatusBadge.tsx
import { Badge } from './badge'
import { cn } from './utils'

type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'default'

interface StatusBadgeProps {
  status: string
  variant?: StatusVariant
  className?: string
}

const variantStyles: Record<StatusVariant, string> = {
  success: 'bg-green-100 text-green-800 hover:bg-green-100',
  warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  error: 'bg-red-100 text-red-800 hover:bg-red-100',
  info: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  default: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
}

const statusVariantMap: Record<string, StatusVariant> = {
  // Sites
  ACTIVE: 'success',
  DRAFT: 'default',
  SUSPENDED: 'error',
  EXPIRED: 'warning',
  // Licences
  TRIALING: 'info',
  PAST_DUE: 'warning',
  CANCELLED: 'error',
  UNPAID: 'error',
  // Commandes
  PENDING: 'warning',
  CONFIRMED: 'info',
  PREPARING: 'info',
  READY: 'success',
  DELIVERED: 'success',
  COMPLETED: 'success',
  // Clients
  LEAD: 'default',
  CHURNED: 'error',
  PAUSED: 'warning',
}

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const resolvedVariant = variant || statusVariantMap[status] || 'default'
  
  return (
    <Badge className={cn(variantStyles[resolvedVariant], className)}>
      {status}
    </Badge>
  )
}
```

### EmptyState
```tsx
// packages/ui/src/EmptyState.tsx
import { LucideIcon } from 'lucide-react'
import { Button } from './button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-muted-foreground">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="mt-6">
          {action.label}
        </Button>
      )}
    </div>
  )
}
```

### LoadingState
```tsx
// packages/ui/src/LoadingState.tsx
import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
}

export function LoadingState({ message = 'Chargement...', size = 'md' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className={`${sizes[size]} animate-spin text-primary`} />
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
```

### ConfirmDialog
```tsx
// packages/ui/src/ConfirmDialog.tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  onConfirm: () => void
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'default',
  onConfirm,
  loading,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className={variant === 'destructive' ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {loading ? 'Chargement...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

### CurrencyDisplay
```tsx
// packages/ui/src/CurrencyDisplay.tsx
interface CurrencyDisplayProps {
  amount: number
  currency?: string
  locale?: string
  className?: string
}

export function CurrencyDisplay({
  amount,
  currency = 'EUR',
  locale = 'fr-FR',
  className,
}: CurrencyDisplayProps) {
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)

  return <span className={className}>{formatted}</span>
}
```

### SearchInput
```tsx
// packages/ui/src/SearchInput.tsx
'use client'

import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from './input'
import { Button } from './button'

interface SearchInputProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
  className?: string
}

export function SearchInput({
  value: externalValue,
  onChange,
  placeholder = 'Rechercher...',
  debounceMs = 300,
  className,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(externalValue || '')

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(internalValue)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [internalValue, debounceMs, onChange])

  useEffect(() => {
    if (externalValue !== undefined) {
      setInternalValue(externalValue)
    }
  }, [externalValue])

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9"
      />
      {internalValue && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
          onClick={() => setInternalValue('')}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
```

---

## Patterns d'Utilisation

### Liste avec actions
```tsx
// Exemple: Liste de sites
import { DataTable, StatusBadge, PageHeader, EmptyState } from '@iziresto/ui'
import { ColumnDef } from '@tanstack/react-table'
import { Globe, MoreHorizontal, Edit, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const columns: ColumnDef<Site>[] = [
  {
    accessorKey: 'subdomain',
    header: 'Sous-domaine',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{row.original.subdomain}</span>
        <span className="text-muted-foreground">.iziresto.com</span>
      </div>
    ),
  },
  {
    accessorKey: 'client.name',
    header: 'Client',
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <ExternalLink className="mr-2 h-4 w-4" />
            Voir le site
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export function SitesList({ sites }: { sites: Site[] }) {
  if (sites.length === 0) {
    return (
      <EmptyState
        icon={Globe}
        title="Aucun site"
        description="Créez votre premier site restaurant"
        action={{ label: 'Créer un site', onClick: () => {} }}
      />
    )
  }

  return (
    <DataTable
      columns={columns}
      data={sites}
      searchKey="subdomain"
      searchPlaceholder="Rechercher un site..."
    />
  )
}
```

### Dashboard avec stats
```tsx
import { StatCard } from '@iziresto/ui'
import { Globe, Users, CreditCard, TrendingUp } from 'lucide-react'

export function DashboardStats({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Sites actifs"
        value={stats.activeSites}
        icon={Globe}
        description={`sur ${stats.maxSites} disponibles`}
        trend={{ value: 12, isPositive: true }}
      />
      <StatCard
        title="Clients"
        value={stats.totalClients}
        icon={Users}
      />
      <StatCard
        title="Revenus du mois"
        value={`${stats.monthlyRevenue} €`}
        icon={CreditCard}
        trend={{ value: 8, isPositive: true }}
      />
      <StatCard
        title="Taux de rétention"
        value={`${stats.retentionRate}%`}
        icon={TrendingUp}
      />
    </div>
  )
}
```

---

## Checklist Nouveau Composant

1. [ ] Vérifier si un composant similaire existe
2. [ ] Définir les props avec interface TypeScript
3. [ ] Utiliser les composants shadcn/ui comme base
4. [ ] Supporter className pour personnalisation
5. [ ] Gérer les états (loading, error, empty)
6. [ ] Documenter les props
7. [ ] Exporter depuis index.ts
