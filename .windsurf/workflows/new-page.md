---
description: Workflow pour créer une nouvelle page dans un dashboard
---

# Nouvelle Page

## 1. Identifier le dashboard
- `platform/` - Super Admin IziResto
- `reseller/` - Dashboard Revendeur
- `restaurant/` - Dashboard Restaurant
- `driver/` - App Livreur
- `store/[subdomain]/` - Storefront

## 2. Créer la structure de fichiers

### Page simple
```
apps/web/src/app/<dashboard>/<page>/
└── page.tsx
```

### Page avec sous-pages
```
apps/web/src/app/<dashboard>/<page>/
├── page.tsx              # Liste
├── new/
│   └── page.tsx          # Création
└── [id]/
    ├── page.tsx          # Détail
    └── edit/
        └── page.tsx      # Édition
```

## 3. Créer la page

### Template page liste
```tsx
// app/<dashboard>/<page>/page.tsx
import { Metadata } from 'next'
import { XxxPage } from '@/components/<domain>/XxxPage'

export const metadata: Metadata = {
  title: 'Titre | IziResto',
}

export default function Page() {
  return <XxxPage />
}
```

### Template composant page
```tsx
// components/<domain>/XxxPage.tsx
'use client'

import { useState } from 'react'
import { Plus, Icon } from 'lucide-react'
import { useXxx } from '@/hooks/useXxx'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '@iziresto/ui'
import { XxxList } from './XxxList'
import { XxxForm } from './XxxForm'

export function XxxPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data, isLoading, error, refetch } = useXxx()

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const items = data?.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Titre"
        description="Description"
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer</DialogTitle>
              </DialogHeader>
              <XxxForm onSuccess={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Icon}
          title="Aucun élément"
          description="Créez votre premier élément"
          action={{ label: 'Créer', onClick: () => setDialogOpen(true) }}
        />
      ) : (
        <XxxList items={items} />
      )}
    </div>
  )
}
```

## 4. Ajouter à la navigation

### Sidebar
Modifier `apps/web/src/components/<domain>/Sidebar.tsx`:
```tsx
const navItems = [
  // ...
  { href: '/<dashboard>/<page>', label: 'Titre', icon: Icon },
]
```

## 5. Vérifier
// turbo
```bash
pnpm dev
```
Ouvrir http://localhost:3000/<dashboard>/<page>

## 6. Commit
```bash
git commit -m "feat(<scope>): add <page> page"
```
