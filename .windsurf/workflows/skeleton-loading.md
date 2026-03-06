---
description: Regles pour les etats de chargement (skeleton) des pages
---

# Skeleton Loading - Regles

## Principe
Toutes les pages du dashboard doivent afficher un **skeleton** pendant le chargement initial des donnees, et non un simple loader centre. Cela evite le "flash" lors de la navigation et offre une meilleure UX.

## Composant a utiliser
Utiliser le composant `PageSkeleton` de `@/components/shared/PageSkeleton.tsx`

```tsx
import { PageSkeleton } from '@/components/shared/PageSkeleton'
```

## Variantes disponibles
- `list` : Pour les pages avec tableau/liste (ex: liste restaurants, clients)
- `detail` : Pour les pages de details (ex: details restaurant, profil client)
- `dashboard` : Pour les pages dashboard avec stats et graphiques

## Implementation

### 1. Importer le composant
```tsx
import { PageSkeleton } from '@/components/shared/PageSkeleton'
```

### 2. Ajouter la condition de chargement AVANT le return principal
```tsx
// Pour une page liste
if (isLoading && data.length === 0) {
  return (
    <PageSkeleton
      navigation={navigation}
      basePath="/reseller"
      title="Titre de la page"
      variant="list"
    />
  )
}

// Pour une page detail
if (!data && isLoading) {
  return (
    <PageSkeleton
      navigation={navigation}
      basePath="/reseller"
      title="Chargement..."
      variant="detail"
    />
  )
}
```

## Regles importantes

1. **Ne jamais afficher un loader plein ecran** (`min-h-screen` avec Loader2 centre) - cela cause un flash
2. **Toujours utiliser le DashboardLayout** dans le skeleton pour conserver la sidebar
3. **Condition de chargement** : `isLoading && !data` ou `isLoading && data.length === 0`
4. **L'auth est geree par le layout parent** - ne pas re-verifier dans chaque page

## Exemple complet

```tsx
'use client'

import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { DashboardLayout } from '@/components/shared/dashboard'
import { resellerNavigation } from '@/config/reseller-navigation'
import { useData } from '@/hooks/use-data'

export default function MyPage() {
  const { data, isLoading } = useData()

  // Skeleton pendant le chargement initial
  if (isLoading && !data) {
    return (
      <PageSkeleton
        navigation={resellerNavigation}
        basePath="/reseller"
        title="Ma Page"
        variant="detail"
      />
    )
  }

  // Contenu normal
  return (
    <DashboardLayout
      navigation={resellerNavigation}
      basePath="/reseller"
      title="Ma Page"
    >
      {/* Contenu */}
    </DashboardLayout>
  )
}
```
