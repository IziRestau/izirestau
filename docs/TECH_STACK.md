# IziResto - Stack Technique Ultime

## Vue d'ensemble

IziResto est une plateforme SaaS B2B2C multi-tenant. Ce document définit toutes les technologies utilisées et leurs justifications.

---

## Architecture Monorepo

```
iziresto/
├── apps/
│   ├── web/                 # Frontend Next.js (tous les dashboards + storefront)
│   └── api/                 # Backend Express.js
├── packages/
│   ├── database/            # Prisma schema + client
│   ├── shared/              # Types, utils, constants partagés
│   ├── ui/                  # Composants UI réutilisables
│   └── config/              # Configs ESLint, TypeScript, Tailwind
├── .windsurf/
│   ├── rules/               # Règles globales
│   ├── skills/              # Skills par domaine
│   └── workflows/           # Workflows de développement
└── docs/                    # Documentation
```

**Pourquoi Monorepo ?**
- Partage de code (types, utils, composants)
- Versioning unifié
- CI/CD simplifié
- Refactoring cross-packages facilité

---

## Frontend

| Technologie | Version | Justification |
|-------------|---------|---------------|
| **Next.js** | 14.x | App Router, RSC, API Routes, optimisations auto |
| **TypeScript** | 5.3+ | Typage strict, autocomplétion, refactoring safe |
| **Tailwind CSS** | 3.4+ | Utility-first, design system cohérent, purge auto |
| **shadcn/ui** | latest | Composants accessibles, personnalisables, copy-paste |
| **Radix UI** | latest | Primitives headless accessibles (base de shadcn) |
| **Lucide React** | latest | Icones cohérentes, tree-shakeable |
| **Zustand** | 4.x | State management léger, simple, performant |
| **TanStack Query** | 5.x | Cache, mutations, invalidation, optimistic updates |
| **React Hook Form** | 7.x | Formulaires performants, validation intégrée |
| **Zod** | 3.x | Validation schema, inférence TypeScript |
| **TanStack Table** | 8.x | Tables headless, tri, pagination, filtres |
| **Recharts** | 2.x | Charts React, responsive, personnalisables |
| **date-fns** | 3.x | Manipulation dates, léger, tree-shakeable |
| **next-intl** | 3.x | i18n pour Next.js App Router |
| **Framer Motion** | 10.x | Animations fluides, gestures |
| **Socket.io-client** | 4.x | WebSocket pour real-time |
| **Mapbox GL JS** | 3.x | Cartes interactives (livraison, zones) |
| **@react-pdf/renderer** | 3.x | Génération PDF (factures) |
| **qrcode.react** | 3.x | QR codes pour menus/tables |

### Pourquoi ces choix ?

**Next.js 14** vs autres frameworks:
- Server Components = moins de JS client
- App Router = layouts imbriqués, loading states natifs
- Streaming SSR = TTFB optimisé
- Image optimization intégrée

**shadcn/ui** vs autres UI libs:
- Pas de dépendance npm = contrôle total
- Composants copiés dans le projet = personnalisation facile
- Accessible par défaut (Radix)
- Tailwind natif

**Zustand** vs Redux/Jotai:
- API minimale, pas de boilerplate
- Pas de Provider wrapper
- Devtools intégrés
- Parfait pour state UI simple

**TanStack Query** vs SWR:
- Mutations plus puissantes
- Invalidation granulaire
- Optimistic updates natifs
- Devtools excellents

---

## Backend

| Technologie | Version | Justification |
|-------------|---------|---------------|
| **Node.js** | 20 LTS | Performance, écosystème, LTS stable |
| **Express.js** | 4.x | Léger, flexible, middleware ecosystem |
| **TypeScript** | 5.3+ | Même langage que frontend, types partagés |
| **Prisma** | 5.x | ORM type-safe, migrations, studio |
| **Zod** | 3.x | Validation request/response |
| **JWT** | - | Stateless auth, scalable |
| **bcryptjs** | - | Hash passwords |
| **Socket.io** | 4.x | WebSocket bidirectionnel |
| **BullMQ** | 4.x | Job queue (emails, notifications) |
| **node-cron** | 3.x | Tâches planifiées |
| **Multer** | 1.x | Upload fichiers |
| **Helmet** | 7.x | Sécurité headers HTTP |
| **cors** | 2.x | CORS configuration |
| **morgan** | 1.x | Logging HTTP |
| **compression** | 1.x | Gzip responses |

### Pourquoi ces choix ?

**Express** vs Fastify/Hono:
- Écosystème middleware mature
- Documentation abondante
- Facile à débugger
- Performance suffisante pour notre scale

**Prisma** vs TypeORM/Drizzle:
- Typage automatique depuis schema
- Migrations versionnées
- Prisma Studio pour debug
- Relations intuitives

**BullMQ** vs Agenda/node-cron:
- Redis-backed = persistant
- Retry automatique
- Concurrency control
- Dashboard UI disponible

---

## Base de Données

| Technologie | Justification |
|-------------|---------------|
| **PostgreSQL** (Neon) | ACID, JSON support, full-text search, scalable |
| **Redis** (Upstash) | Cache, sessions, rate limiting, pub/sub |

### Pourquoi Neon ?
- Serverless PostgreSQL
- Branching pour preview environments
- Auto-scaling
- Pricing usage-based

### Pourquoi Upstash Redis ?
- Serverless Redis
- REST API (edge compatible)
- Pricing per-request
- Global replication

---

## Paiements

| Provider | Région | Usage |
|----------|--------|-------|
| **Stripe** | International | Licences revendeurs, paiements restaurants |
| **Paytech** | Afrique (Sénégal) | Alternative mobile money |

### Intégrations
- Stripe Connect pour les restaurants (paiements directs)
- Webhooks pour synchronisation
- Stripe Billing pour abonnements licences

---

## Infrastructure

| Service | Usage |
|---------|-------|
| **Vercel** | Hosting frontend Next.js |
| **Railway** | Hosting backend Express |
| **Neon** | PostgreSQL serverless |
| **Upstash** | Redis serverless |
| **Cloudflare R2** | Object storage (images, PDFs) |
| **Cloudflare** | CDN, DNS, wildcard subdomains |
| **Resend** | Emails transactionnels |

### Pourquoi cette stack infra ?

**Vercel** pour frontend:
- Optimisé pour Next.js
- Edge functions
- Preview deployments
- Analytics intégrés

**Railway** pour backend:
- Deploy simple depuis Git
- Scaling horizontal
- Logs centralisés
- Variables d'env sécurisées

**Cloudflare R2** vs S3:
- Pas de frais egress
- Compatible S3 API
- Edge caching intégré

---

## Outils de Développement

| Outil | Usage |
|-------|-------|
| **pnpm** | Package manager (workspaces, fast) |
| **Turborepo** | Build system monorepo |
| **ESLint** | Linting code |
| **Prettier** | Formatage code |
| **Husky** | Git hooks |
| **lint-staged** | Lint fichiers staged |
| **Commitlint** | Convention commits |

---

## Testing

| Outil | Usage |
|-------|-------|
| **Vitest** | Unit tests (fast, ESM native) |
| **Playwright** | E2E tests |
| **MSW** | Mock API pour tests frontend |

---

## Monitoring

| Service | Usage |
|---------|-------|
| **Sentry** | Error tracking |
| **Vercel Analytics** | Web vitals frontend |
| **Axiom** | Logs centralisés |

---

## Versions Exactes (package.json)

```json
{
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.3.3",
    "tailwindcss": "^3.4.1",
    "@tanstack/react-query": "^5.17.0",
    "zustand": "^4.4.7",
    "react-hook-form": "^7.49.3",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.4",
    "@tanstack/react-table": "^8.11.6",
    "recharts": "^2.10.4",
    "date-fns": "^3.2.0",
    "next-intl": "^3.4.5",
    "framer-motion": "^10.18.0",
    "socket.io-client": "^4.7.4",
    "lucide-react": "^0.312.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  }
}
```

---

## Règles d'Or

1. **Jamais de code dupliqué** - Créer un composant/util réutilisable
2. **Types stricts** - Pas de `any`, toujours typer
3. **Composants atomiques** - Un composant = une responsabilité
4. **API cohérente** - Mêmes patterns partout
5. **Tests critiques** - Auth, paiements, commandes
6. **Performance first** - Lazy loading, code splitting, caching
