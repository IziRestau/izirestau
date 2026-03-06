---
description: Workflow pour créer une migration de base de données
---

# Migration Database

## 1. Modifier le schema Prisma

```prisma
// packages/database/prisma/schema.prisma

// Ajouter un nouveau modèle
model NewModel {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([name])
}

// Ou modifier un modèle existant
model ExistingModel {
  // Ajouter un champ
  newField String?
  
  // Ajouter une relation
  relationId String?
  relation   OtherModel? @relation(fields: [relationId], references: [id])
}
```

## 2. Valider le schema
// turbo
```bash
pnpm --filter @iziresto/database prisma validate
```

## 3. Formater le schema
// turbo
```bash
pnpm --filter @iziresto/database prisma format
```

## 4. Créer la migration
```bash
pnpm --filter @iziresto/database prisma migrate dev --name <nom_descriptif>
```

Exemples de noms:
- `add_custom_domain_to_sites`
- `create_client_invoices_table`
- `add_index_on_orders_status`
- `rename_field_x_to_y`

## 5. Vérifier la migration générée
Ouvrir `packages/database/prisma/migrations/<timestamp>_<nom>/migration.sql`

Vérifier:
- Pas de perte de données
- Index créés si nécessaire
- Contraintes correctes

## 6. Régénérer le client Prisma
// turbo
```bash
pnpm --filter @iziresto/database prisma generate
```

## 7. Mettre à jour le code
- Types TypeScript mis à jour automatiquement
- Vérifier que le code compile

## 8. Tester
// turbo
```bash
pnpm --filter @iziresto/database prisma studio
```

## 9. Commit
```bash
git add packages/database/prisma/
git commit -m "db: <description de la migration>"
```

---

## Commandes utiles

### Reset complet (dev uniquement)
```bash
pnpm --filter @iziresto/database prisma migrate reset
```

### Voir le statut des migrations
```bash
pnpm --filter @iziresto/database prisma migrate status
```

### Appliquer en production
```bash
DATABASE_URL=<prod-url> pnpm --filter @iziresto/database prisma migrate deploy
```

### Seed
```bash
pnpm --filter @iziresto/database prisma db seed
```
