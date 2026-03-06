---
description: Workflow pour créer une nouvelle fonctionnalité complète (backend + frontend)
---

# Nouvelle Feature

## 1. Planification
- Définir le scope de la feature
- Identifier les modèles BDD nécessaires
- Lister les endpoints API
- Lister les pages/composants frontend

## 2. Backend

### 2.1 Schema Prisma (si nouveau modèle)
```bash
# Modifier packages/database/prisma/schema.prisma
# Puis créer la migration
pnpm --filter @iziresto/database prisma migrate dev --name <nom_migration>
```

### 2.2 Validators
Créer dans `apps/api/src/validators/`:
```typescript
export const createXxxSchema = z.object({
  // Définir les champs
})
```

### 2.3 Controller
Créer dans `apps/api/src/controllers/<domain>/`:
```typescript
export const xxxController = {
  async list(req, res, next) { /* ... */ },
  async get(req, res, next) { /* ... */ },
  async create(req, res, next) { /* ... */ },
  async update(req, res, next) { /* ... */ },
  async delete(req, res, next) { /* ... */ },
}
```

### 2.4 Routes
Créer dans `apps/api/src/routes/<domain>/`:
```typescript
router.get('/', xxxController.list)
router.get('/:id', xxxController.get)
router.post('/', validate(createXxxSchema), xxxController.create)
router.put('/:id', validate(updateXxxSchema), xxxController.update)
router.delete('/:id', xxxController.delete)
```

### 2.5 Tester avec Postman/Insomnia
// turbo
```bash
curl http://localhost:4000/api/<endpoint>
```

## 3. Frontend

### 3.1 Types
Ajouter dans `apps/web/src/types/`:
```typescript
export interface Xxx {
  id: string
  // ...
}
```

### 3.2 API Client
Ajouter dans `apps/web/src/lib/api-client.ts`:
```typescript
xxx: {
  list: () => request<{ data: Xxx[] }>('/api/xxx'),
  get: (id: string) => request<{ data: Xxx }>(`/api/xxx/${id}`),
  create: (data: CreateXxxInput) => request<{ data: Xxx }>('/api/xxx', { method: 'POST', body: JSON.stringify(data) }),
}
```

### 3.3 Hooks
Créer dans `apps/web/src/hooks/`:
```typescript
export function useXxx() {
  return useQuery({ queryKey: ['xxx'], queryFn: api.xxx.list })
}

export function useCreateXxx() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.xxx.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['xxx'] }),
  })
}
```

### 3.4 Composants
Créer dans `apps/web/src/components/<domain>/`:
- `XxxCard.tsx` - Carte individuelle
- `XxxList.tsx` - Liste
- `XxxForm.tsx` - Formulaire création/édition
- `XxxPage.tsx` - Page complète

### 3.5 Page
Créer dans `apps/web/src/app/<dashboard>/<feature>/page.tsx`

## 4. Tests
```bash
pnpm test
```

## 5. Commit
```bash
git add .
git commit -m "feat(<scope>): add <feature> management"
```
