---
description: Workflow pour corriger un bug
---

# Fix Bug

## 1. Reproduire le bug
- Identifier les étapes exactes pour reproduire
- Vérifier les logs (console frontend, logs backend)
- Identifier le composant/route concerné

## 2. Créer une branche
```bash
git checkout -b fix/<scope>/<description>
```

## 3. Localiser le problème

### Frontend
- Ouvrir les DevTools (F12)
- Onglet Console pour les erreurs JS
- Onglet Network pour les requêtes API
- React DevTools pour l'état des composants

### Backend
- Vérifier les logs du serveur
- Tester l'endpoint avec curl/Postman
- Vérifier les données en BDD avec Prisma Studio

## 4. Écrire un test qui échoue (optionnel mais recommandé)
```typescript
// tests/<domain>.test.ts
it('should handle the edge case correctly', async () => {
  // Test qui reproduit le bug
  expect(result).toBe(expected)
})
```

## 5. Corriger le bug
- Fix minimal et ciblé
- Ne pas refactorer en même temps
- Ajouter des logs si nécessaire pour debug

## 6. Vérifier la correction
// turbo
```bash
pnpm test
pnpm dev
# Reproduire les étapes - le bug ne doit plus apparaître
```

## 7. Nettoyer
- Supprimer les console.log de debug
- Supprimer le code commenté

## 8. Commit
```bash
git commit -m "fix(<scope>): <description du fix>"
```

Exemples:
- `fix(auth): handle expired refresh token correctly`
- `fix(orders): update status when payment confirmed`
- `fix(ui): prevent double submit on form`

## 9. Push & PR
```bash
git push origin fix/<scope>/<description>
```
