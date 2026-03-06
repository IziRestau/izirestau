# Skill: Internationalisation (i18n)

## Quand utiliser ce skill
- Ajout de traductions
- Formatage dates/devises
- Support multi-langues

---

## Configuration next-intl

### Structure
```
apps/web/
├── messages/
│   ├── fr.json
│   └── en.json
├── src/
│   └── i18n.ts
└── middleware.ts
```

### Configuration
```typescript
// src/i18n.ts
import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`../messages/${locale}.json`)).default,
}))
```

### Middleware
```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
})

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
```

---

## Fichiers de traduction

### Structure
```json
// messages/fr.json
{
  "common": {
    "save": "Enregistrer",
    "cancel": "Annuler",
    "delete": "Supprimer",
    "edit": "Modifier",
    "create": "Créer",
    "search": "Rechercher",
    "loading": "Chargement...",
    "error": "Une erreur est survenue",
    "success": "Opération réussie"
  },
  "auth": {
    "login": "Connexion",
    "logout": "Déconnexion",
    "register": "Inscription",
    "email": "Email",
    "password": "Mot de passe",
    "forgotPassword": "Mot de passe oublié ?",
    "invalidCredentials": "Email ou mot de passe incorrect"
  },
  "reseller": {
    "dashboard": {
      "title": "Tableau de bord",
      "sites": "Sites",
      "clients": "Clients",
      "revenue": "Revenus"
    },
    "sites": {
      "title": "Mes Sites",
      "create": "Nouveau site",
      "subdomain": "Sous-domaine",
      "status": "Statut",
      "empty": "Aucun site",
      "emptyDescription": "Créez votre premier site restaurant"
    }
  },
  "status": {
    "ACTIVE": "Actif",
    "DRAFT": "Brouillon",
    "SUSPENDED": "Suspendu",
    "PENDING": "En attente"
  }
}
```

```json
// messages/en.json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "search": "Search",
    "loading": "Loading...",
    "error": "An error occurred",
    "success": "Operation successful"
  },
  "auth": {
    "login": "Login",
    "logout": "Logout",
    "register": "Register",
    "email": "Email",
    "password": "Password",
    "forgotPassword": "Forgot password?",
    "invalidCredentials": "Invalid email or password"
  },
  "reseller": {
    "dashboard": {
      "title": "Dashboard",
      "sites": "Sites",
      "clients": "Clients",
      "revenue": "Revenue"
    },
    "sites": {
      "title": "My Sites",
      "create": "New site",
      "subdomain": "Subdomain",
      "status": "Status",
      "empty": "No sites",
      "emptyDescription": "Create your first restaurant site"
    }
  },
  "status": {
    "ACTIVE": "Active",
    "DRAFT": "Draft",
    "SUSPENDED": "Suspended",
    "PENDING": "Pending"
  }
}
```

---

## Utilisation

### Dans un composant
```tsx
'use client'

import { useTranslations } from 'next-intl'

export function SitesPage() {
  const t = useTranslations('reseller.sites')
  const tCommon = useTranslations('common')

  return (
    <div>
      <h1>{t('title')}</h1>
      <Button>{t('create')}</Button>
      <Button variant="outline">{tCommon('cancel')}</Button>
    </div>
  )
}
```

### Avec variables
```json
{
  "greeting": "Bonjour {name}",
  "itemCount": "{count, plural, =0 {Aucun élément} one {# élément} other {# éléments}}"
}
```

```tsx
const t = useTranslations()

t('greeting', { name: 'Jean' }) // "Bonjour Jean"
t('itemCount', { count: 0 })    // "Aucun élément"
t('itemCount', { count: 1 })    // "1 élément"
t('itemCount', { count: 5 })    // "5 éléments"
```

### Traduire un status
```tsx
const t = useTranslations('status')

function StatusBadge({ status }: { status: string }) {
  return <Badge>{t(status)}</Badge>
}
```

---

## Formatage

### Dates
```tsx
import { useFormatter } from 'next-intl'

function DateDisplay({ date }: { date: Date }) {
  const format = useFormatter()

  return (
    <span>
      {format.dateTime(date, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
    </span>
  )
}
```

### Devises
```tsx
import { useFormatter } from 'next-intl'

function CurrencyDisplay({ amount }: { amount: number }) {
  const format = useFormatter()

  return (
    <span>
      {format.number(amount, {
        style: 'currency',
        currency: 'EUR',
      })}
    </span>
  )
}
```

### Nombres
```tsx
const format = useFormatter()

format.number(1234567.89) // "1 234 567,89" (fr) / "1,234,567.89" (en)
```

### Dates relatives
```tsx
const format = useFormatter()

format.relativeTime(new Date('2024-01-01')) // "il y a 2 mois"
```

---

## Bonnes pratiques

### 1. Clés hiérarchiques
```json
{
  "reseller": {
    "sites": {
      "title": "...",
      "create": "..."
    }
  }
}
```

### 2. Réutiliser les traductions communes
```tsx
const tCommon = useTranslations('common')
const tPage = useTranslations('reseller.sites')
```

### 3. Éviter les traductions inline
```tsx
// MAL
<Button>Enregistrer</Button>

// BIEN
<Button>{t('save')}</Button>
```

### 4. Utiliser des clés descriptives
```json
{
  "sites": {
    "createButton": "Nouveau site",
    "deleteConfirmTitle": "Supprimer le site ?",
    "deleteConfirmMessage": "Cette action est irréversible."
  }
}
```

---

## Ajouter une nouvelle langue

1. Créer le fichier `messages/<locale>.json`
2. Ajouter la locale dans `middleware.ts`
3. Traduire toutes les clés
