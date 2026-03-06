# Workflow: Développement

## Démarrage du Projet

### 1. Installation initiale
```bash
# Cloner le repo
git clone <repo-url>
cd iziresto

# Installer les dépendances
pnpm install

# Copier les variables d'environnement
cp .env.example .env.local
cp apps/api/.env.example apps/api/.env

# Générer le client Prisma
pnpm --filter @iziresto/database prisma generate

# Appliquer les migrations
pnpm --filter @iziresto/database prisma migrate dev

# Seed la base de données
pnpm --filter @iziresto/database prisma db seed
```

### 2. Lancer le développement
```bash
# Tout lancer (frontend + backend)
pnpm dev

# Ou séparément
pnpm --filter web dev      # Frontend sur :3000
pnpm --filter api dev      # Backend sur :4000

# Prisma Studio
pnpm --filter @iziresto/database prisma studio
```

---

## Workflow Feature

### 1. Créer une branche
```bash
git checkout -b feat/reseller-sites-management
```

### 2. Développer
1. **Backend d'abord** (si nouvelle feature)
   - Schema Prisma si nouveau modèle
   - Migration
   - Routes + Controller
   - Validators

2. **Frontend ensuite**
   - Types
   - API client
   - Hooks
   - Composants
   - Pages

### 3. Tester
```bash
# Tests unitaires
pnpm test

# Tests E2E
pnpm test:e2e

# Lint
pnpm lint
```

### 4. Commit
```bash
# Format conventionnel
git commit -m "feat(reseller): add sites management"
git commit -m "fix(auth): handle token refresh edge case"
git commit -m "refactor(ui): extract DataTable component"
```

### 5. Push & PR
```bash
git push origin feat/reseller-sites-management
# Créer PR sur GitHub
```

---

## Workflow Bug Fix

### 1. Reproduire le bug
- Identifier les étapes exactes
- Vérifier les logs (frontend + backend)
- Isoler le composant/route concerné

### 2. Créer une branche
```bash
git checkout -b fix/order-status-not-updating
```

### 3. Écrire un test qui échoue
```typescript
// tests/orders.test.ts
it('should update order status correctly', async () => {
  // Test qui reproduit le bug
})
```

### 4. Corriger le bug
- Fix minimal et ciblé
- Ne pas refactorer en même temps

### 5. Vérifier que le test passe
```bash
pnpm test
```

### 6. Commit & PR
```bash
git commit -m "fix(orders): update status correctly when payment confirmed"
```

---

## Workflow Nouveau Composant

### 1. Vérifier s'il existe
- Chercher dans `packages/ui`
- Chercher dans `apps/web/src/components`
- Chercher dans shadcn/ui

### 2. Décider où le créer
- **packages/ui**: Si réutilisable cross-dashboard
- **apps/web/src/components/shared**: Si partagé dans l'app
- **apps/web/src/components/[domain]**: Si spécifique à un dashboard

### 3. Créer le composant
```tsx
// 1. Interface des props
interface MyComponentProps {
  title: string
  variant?: 'default' | 'outline'
  className?: string
}

// 2. Composant
export function MyComponent({ title, variant = 'default', className }: MyComponentProps) {
  return (
    <div className={cn('base-classes', className)}>
      {title}
    </div>
  )
}
```

### 4. Exporter
```typescript
// packages/ui/src/index.ts
export { MyComponent } from './MyComponent'
```

---

## Workflow Nouvelle Route API

### 1. Définir le schema Zod
```typescript
// src/validators/reseller.validator.ts
export const createSiteSchema = z.object({
  subdomain: z.string().min(3).max(50),
  clientId: z.string().cuid().optional(),
})
```

### 2. Créer le controller
```typescript
// src/controllers/reseller/sites.controller.ts
export const sitesController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      // Logique
      return created(res, site)
    } catch (error) {
      next(error)
    }
  },
}
```

### 3. Créer la route
```typescript
// src/routes/reseller/sites.routes.ts
router.post('/', validate(createSiteSchema), sitesController.create)
```

### 4. Mettre à jour l'API client frontend
```typescript
// lib/api-client.ts
export const api = {
  reseller: {
    createSite: (data: CreateSiteInput) =>
      request<{ data: Site }>('/api/reseller/sites', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
}
```

### 5. Créer le hook
```typescript
// hooks/useSites.ts
export function useCreateSite() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.reseller.createSite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
    },
  })
}
```

---

## Workflow Migration BDD

### 1. Modifier le schema
```prisma
// packages/database/prisma/schema.prisma
model Site {
  // Ajouter un nouveau champ
  customDomain String? @unique
}
```

### 2. Créer la migration
```bash
pnpm --filter @iziresto/database prisma migrate dev --name add_custom_domain_to_sites
```

### 3. Vérifier la migration
- Ouvrir le fichier SQL généré
- Vérifier qu'il n'y a pas de perte de données

### 4. Régénérer le client
```bash
pnpm --filter @iziresto/database prisma generate
```

### 5. Mettre à jour les types frontend
- Les types sont auto-générés depuis Prisma
- Vérifier que le frontend compile

---

## Commandes Utiles

### Monorepo
```bash
# Installer une dépendance dans un package
pnpm --filter web add lodash
pnpm --filter api add -D @types/lodash

# Lancer un script dans un package
pnpm --filter web build
pnpm --filter api test

# Lancer partout
pnpm -r build
```

### Prisma
```bash
# Générer le client
pnpm --filter @iziresto/database prisma generate

# Créer une migration
pnpm --filter @iziresto/database prisma migrate dev --name <nom>

# Reset la BDD
pnpm --filter @iziresto/database prisma migrate reset

# Ouvrir Studio
pnpm --filter @iziresto/database prisma studio

# Formater le schema
pnpm --filter @iziresto/database prisma format
```

### Git
```bash
# Nouvelle feature
git checkout -b feat/<scope>/<description>

# Bug fix
git checkout -b fix/<scope>/<description>

# Refactor
git checkout -b refactor/<scope>/<description>
```

### shadcn/ui
```bash
# Ajouter un composant
cd apps/web
npx shadcn-ui@latest add <component>
```

---

## Structure des Commits

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `refactor`: Refactoring sans changement de comportement
- `docs`: Documentation
- `style`: Formatage, pas de changement de code
- `test`: Ajout/modification de tests
- `chore`: Maintenance, dépendances

### Scopes
- `auth`: Authentification
- `reseller`: Dashboard revendeur
- `restaurant`: Dashboard restaurant
- `platform`: Dashboard super admin
- `storefront`: Boutique client
- `driver`: App livreur
- `ui`: Composants UI
- `api`: Backend
- `db`: Base de données

### Exemples
```
feat(reseller): add sites management page
fix(auth): handle expired refresh token
refactor(ui): extract DataTable to packages/ui
docs(api): add swagger documentation
chore(deps): update dependencies
```
