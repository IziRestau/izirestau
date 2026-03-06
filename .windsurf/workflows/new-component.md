---
description: Workflow pour créer un nouveau composant réutilisable
---

# Nouveau Composant

## 1. Vérifier si le composant existe

### shadcn/ui
```bash
# Liste des composants disponibles
npx shadcn-ui@latest add --help
```

### packages/ui
Vérifier dans `packages/ui/src/`

### components/shared
Vérifier dans `apps/web/src/components/shared/`

## 2. Décider où le créer

| Emplacement | Quand l'utiliser |
|-------------|------------------|
| `packages/ui/` | Réutilisable dans tous les dashboards |
| `components/shared/` | Partagé dans l'app mais pas cross-package |
| `components/<domain>/` | Spécifique à un dashboard |

## 3. Créer le composant

### Template
```tsx
import { cn } from '@/lib/utils'

interface MyComponentProps {
  // Props requises
  title: string
  
  // Props optionnelles avec defaults
  variant?: 'default' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  
  // Toujours supporter className
  className?: string
  
  // Children si nécessaire
  children?: React.ReactNode
}

export function MyComponent({
  title,
  variant = 'default',
  size = 'md',
  className,
  children,
}: MyComponentProps) {
  return (
    <div
      className={cn(
        'base-classes',
        variant === 'outline' && 'outline-classes',
        size === 'sm' && 'small-classes',
        size === 'lg' && 'large-classes',
        className
      )}
    >
      <h3>{title}</h3>
      {children}
    </div>
  )
}
```

## 4. Exporter

### packages/ui
```typescript
// packages/ui/src/index.ts
export { MyComponent } from './MyComponent'
```

### components
Pas besoin d'export centralisé, importer directement.

## 5. Utiliser
```tsx
import { MyComponent } from '@iziresto/ui'
// ou
import { MyComponent } from '@/components/shared/MyComponent'
```

## 6. Commit
```bash
git commit -m "feat(ui): add MyComponent"
```
