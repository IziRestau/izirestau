# Skill: Frontend Next.js

## Quand utiliser ce skill
- Création de pages/routes
- Composants React
- State management
- Data fetching
- Formulaires

---

## Structure App Router

### Layout de base
```tsx
// app/layout.tsx
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### Layout Dashboard
```tsx
// app/reseller/layout.tsx
import { Sidebar } from '@/components/reseller/Sidebar'
import { TopNav } from '@/components/shared/TopNav'

export default function ResellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <TopNav />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### Page avec metadata
```tsx
// app/reseller/sites/page.tsx
import { Metadata } from 'next'
import { SitesPage } from '@/components/reseller/SitesPage'

export const metadata: Metadata = {
  title: 'Mes Sites | IziResto',
  description: 'Gérez vos sites restaurants',
}

export default function Page() {
  return <SitesPage />
}
```

---

## Data Fetching

### TanStack Query Setup
```tsx
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
```

### Provider
```tsx
// components/providers.tsx
'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/query-client'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

### Hook de fetch
```tsx
// hooks/useSites.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type { Site, CreateSiteInput } from '@/types'

export function useSites() {
  return useQuery({
    queryKey: ['sites'],
    queryFn: () => api.reseller.getSites(),
  })
}

export function useSite(id: string) {
  return useQuery({
    queryKey: ['sites', id],
    queryFn: () => api.reseller.getSite(id),
    enabled: !!id,
  })
}

export function useCreateSite() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateSiteInput) => api.reseller.createSite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
    },
  })
}
```

---

## API Client

```tsx
// lib/api-client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('accessToken')
  
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Une erreur est survenue')
  }

  return res.json()
}

export const api = {
  reseller: {
    getSites: () => request<{ data: Site[] }>('/api/reseller/sites'),
    getSite: (id: string) => request<{ data: Site }>(`/api/reseller/sites/${id}`),
    createSite: (data: CreateSiteInput) => 
      request<{ data: Site }>('/api/reseller/sites', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateSite: (id: string, data: Partial<Site>) =>
      request<{ data: Site }>(`/api/reseller/sites/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteSite: (id: string) =>
      request<void>(`/api/reseller/sites/${id}`, { method: 'DELETE' }),
  },
  // Autres domaines...
}
```

---

## Formulaires

### Setup avec React Hook Form + Zod
```tsx
// components/reseller/SiteForm.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateSite } from '@/hooks/useSites'
import { toast } from 'sonner'

const siteSchema = z.object({
  subdomain: z.string()
    .min(3, 'Minimum 3 caractères')
    .max(50, 'Maximum 50 caractères')
    .regex(/^[a-z0-9-]+$/, 'Lettres minuscules, chiffres et tirets uniquement'),
  clientId: z.string().optional(),
})

type SiteFormData = z.infer<typeof siteSchema>

interface SiteFormProps {
  onSuccess?: () => void
}

export function SiteForm({ onSuccess }: SiteFormProps) {
  const createSite = useCreateSite()
  
  const form = useForm<SiteFormData>({
    resolver: zodResolver(siteSchema),
    defaultValues: {
      subdomain: '',
    },
  })

  const onSubmit = async (data: SiteFormData) => {
    try {
      await createSite.mutateAsync(data)
      toast.success('Site créé avec succès')
      form.reset()
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="subdomain">Sous-domaine</Label>
        <div className="flex items-center">
          <Input
            id="subdomain"
            {...form.register('subdomain')}
            placeholder="mon-restaurant"
          />
          <span className="ml-2 text-muted-foreground">.iziresto.com</span>
        </div>
        {form.formState.errors.subdomain && (
          <p className="text-sm text-destructive">
            {form.formState.errors.subdomain.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={createSite.isPending}>
        {createSite.isPending ? 'Création...' : 'Créer le site'}
      </Button>
    </form>
  )
}
```

---

## State Management (Zustand)

```tsx
// stores/auth.store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  userType: 'SUPER_ADMIN' | 'RESELLER' | 'RESTAURANT' | 'DRIVER'
}

interface AuthState {
  user: User | null
  accessToken: string | null
  setAuth: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => set({ user, accessToken }),
      logout: () => set({ user: null, accessToken: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
```

```tsx
// stores/ui.store.ts
import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
```

---

## Loading & Error States

### Loading
```tsx
// components/shared/LoadingState.tsx
import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = 'Chargement...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">{message}</p>
    </div>
  )
}
```

### Error
```tsx
// components/shared/ErrorState.tsx
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ 
  message = 'Une erreur est survenue', 
  onRetry 
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <p className="mt-4 text-muted-foreground">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="mt-4">
          Réessayer
        </Button>
      )}
    </div>
  )
}
```

### Empty
```tsx
// components/shared/EmptyState.tsx
import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
    <div className="flex flex-col items-center justify-center py-12">
      <div className="rounded-full bg-muted p-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-center text-muted-foreground">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  )
}
```

---

## Pattern Page Complète

```tsx
// components/reseller/SitesPage.tsx
'use client'

import { useState } from 'react'
import { Plus, Globe } from 'lucide-react'
import { useSites } from '@/hooks/useSites'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { SiteCard } from './SiteCard'
import { SiteForm } from './SiteForm'

export function SitesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data, isLoading, error, refetch } = useSites()

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const sites = data?.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes Sites"
        description="Gérez les sites restaurants de vos clients"
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau site
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouveau site</DialogTitle>
              </DialogHeader>
              <SiteForm onSuccess={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        }
      />

      {sites.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="Aucun site"
          description="Créez votre premier site restaurant"
          action={{
            label: 'Créer un site',
            onClick: () => setDialogOpen(true),
          }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <SiteCard key={site.id} site={site} />
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## Optimisations

### Lazy Loading
```tsx
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false,
})
```

### Images
```tsx
import Image from 'next/image'

<Image
  src={product.image}
  alt={product.name}
  width={200}
  height={200}
  className="rounded-lg object-cover"
  placeholder="blur"
  blurDataURL="/placeholder.png"
/>
```

### Debounce Search
```tsx
import { useDebouncedCallback } from 'use-debounce'

const debouncedSearch = useDebouncedCallback((value: string) => {
  setSearchQuery(value)
}, 300)

<Input onChange={(e) => debouncedSearch(e.target.value)} />
```
