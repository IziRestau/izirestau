# Skill: Database & Prisma

## Quand utiliser ce skill
- Modifications du schema Prisma
- Migrations
- Requêtes complexes
- Optimisations BDD

---

## Configuration Prisma

```prisma
// packages/database/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Export du client
```typescript
// packages/database/src/index.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export * from '@prisma/client'
```

---

## Commandes Prisma

```bash
# Générer le client après modification du schema
pnpm --filter @iziresto/database prisma generate

# Créer une migration
pnpm --filter @iziresto/database prisma migrate dev --name <nom_migration>

# Appliquer les migrations en prod
pnpm --filter @iziresto/database prisma migrate deploy

# Reset la BDD (dev uniquement)
pnpm --filter @iziresto/database prisma migrate reset

# Ouvrir Prisma Studio
pnpm --filter @iziresto/database prisma studio

# Formater le schema
pnpm --filter @iziresto/database prisma format

# Valider le schema
pnpm --filter @iziresto/database prisma validate
```

---

## Conventions Schema

### Nommage
```prisma
// Models: PascalCase singulier
model User {}
model ResellerOrganization {}

// Champs: camelCase
model User {
  firstName     String
  lastName      String
  createdAt     DateTime
}

// Relations: nom descriptif
model Site {
  organization    ResellerOrganization @relation(fields: [organizationId], references: [id])
  organizationId  String
}

// Enums: PascalCase
enum UserType {
  SUPER_ADMIN
  RESELLER
  RESTAURANT
}
```

### Index obligatoires
```prisma
model Site {
  id              String @id @default(cuid())
  subdomain       String @unique
  organizationId  String
  clientId        String?
  status          SiteStatus
  createdAt       DateTime @default(now())

  // Index sur les FK et champs de recherche fréquents
  @@index([organizationId])
  @@index([clientId])
  @@index([status])
  @@index([subdomain])
}
```

### Soft Delete
```prisma
model Client {
  id        String    @id @default(cuid())
  isActive  Boolean   @default(true)
  deletedAt DateTime?
  
  // Ou utiliser un status
  status    ClientStatus @default(ACTIVE)
}
```

### Timestamps
```prisma
model Entity {
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## Patterns de Requêtes

### Pagination
```typescript
async function getPaginatedSites(
  organizationId: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit

  const [sites, total] = await Promise.all([
    prisma.site.findMany({
      where: { organizationId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.site.count({ where: { organizationId } }),
  ])

  return {
    data: sites,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  }
}
```

### Filtres dynamiques
```typescript
async function getSites(filters: {
  organizationId: string
  status?: SiteStatus
  search?: string
  clientId?: string
}) {
  const where: Prisma.SiteWhereInput = {
    organizationId: filters.organizationId,
    ...(filters.status && { status: filters.status }),
    ...(filters.clientId && { clientId: filters.clientId }),
    ...(filters.search && {
      OR: [
        { subdomain: { contains: filters.search, mode: 'insensitive' } },
        { restaurant: { name: { contains: filters.search, mode: 'insensitive' } } },
      ],
    }),
  }

  return prisma.site.findMany({ where })
}
```

### Include vs Select
```typescript
// Include: ajoute des relations
const site = await prisma.site.findUnique({
  where: { id },
  include: {
    client: true,
    restaurant: true,
  },
})

// Select: choisit les champs (plus performant)
const site = await prisma.site.findUnique({
  where: { id },
  select: {
    id: true,
    subdomain: true,
    status: true,
    client: {
      select: {
        id: true,
        name: true,
      },
    },
  },
})
```

### Transactions
```typescript
async function createSiteWithRestaurant(data: CreateSiteInput) {
  return prisma.$transaction(async (tx) => {
    // Créer le restaurant
    const restaurant = await tx.restaurant.create({
      data: {
        name: data.restaurantName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
      },
    })

    // Créer le site lié
    const site = await tx.site.create({
      data: {
        subdomain: data.subdomain,
        organizationId: data.organizationId,
        clientId: data.clientId,
        restaurantId: restaurant.id,
      },
    })

    // Créer les settings par défaut
    await tx.restaurantSettings.create({
      data: {
        restaurantId: restaurant.id,
      },
    })

    return site
  })
}
```

### Upsert
```typescript
const settings = await prisma.restaurantSettings.upsert({
  where: { restaurantId },
  update: {
    currency: data.currency,
    timezone: data.timezone,
  },
  create: {
    restaurantId,
    currency: data.currency,
    timezone: data.timezone,
  },
})
```

### Agrégations
```typescript
// Compter
const count = await prisma.site.count({
  where: { organizationId, status: 'ACTIVE' },
})

// Grouper
const sitesByStatus = await prisma.site.groupBy({
  by: ['status'],
  where: { organizationId },
  _count: { id: true },
})

// Somme
const totalRevenue = await prisma.clientPayment.aggregate({
  where: { organizationId },
  _sum: { amount: true },
})
```

### Relations imbriquées
```typescript
// Créer avec relations
const client = await prisma.client.create({
  data: {
    name: 'Restaurant ABC',
    email: 'contact@abc.com',
    organizationId,
    sites: {
      create: [
        { subdomain: 'abc-restaurant', organizationId },
      ],
    },
    subscriptions: {
      create: [
        {
          name: 'Abonnement mensuel',
          amount: 49.99,
          billingCycle: 'MONTHLY',
          startDate: new Date(),
          organizationId,
        },
      ],
    },
  },
  include: {
    sites: true,
    subscriptions: true,
  },
})
```

---

## Migrations

### Bonnes pratiques
1. **Nommer clairement**: `add_custom_domain_to_sites`, `create_client_invoices_table`
2. **Petites migrations**: Une modification logique par migration
3. **Tester en dev**: Toujours tester avant de push
4. **Backup avant prod**: Toujours backup avant migration prod

### Migration avec données
```typescript
// prisma/migrations/XXXXXX_add_status_to_sites/migration.sql
-- AlterTable
ALTER TABLE "Site" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'DRAFT';

-- UpdateData (optionnel, via script séparé)
UPDATE "Site" SET "status" = 'ACTIVE' WHERE "publishedAt" IS NOT NULL;
```

### Script de seed
```typescript
// packages/database/prisma/seed.ts
import { prisma } from '../src'
import { hash } from 'bcryptjs'

async function main() {
  // Créer le super admin
  const adminPassword = await hash('admin123', 12)
  
  await prisma.user.upsert({
    where: { email: 'admin@iziresto.com' },
    update: {},
    create: {
      email: 'admin@iziresto.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'IziResto',
      userType: 'SUPER_ADMIN',
      isSuperAdmin: true,
      emailVerified: true,
    },
  })

  // Créer les plans de licence
  const plans = [
    { name: 'Starter', slug: 'starter', maxSites: 5, priceMonthly: 49, priceYearly: 490 },
    { name: 'Pro', slug: 'pro', maxSites: 20, priceMonthly: 99, priceYearly: 990 },
    { name: 'Business', slug: 'business', maxSites: 50, priceMonthly: 199, priceYearly: 1990 },
  ]

  for (const plan of plans) {
    await prisma.licensePlan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    })
  }

  console.log('Seed completed')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

---

## Optimisations

### Éviter N+1
```typescript
// MAL: N+1 queries
const sites = await prisma.site.findMany()
for (const site of sites) {
  const client = await prisma.client.findUnique({ where: { id: site.clientId } })
}

// BIEN: 1 query avec include
const sites = await prisma.site.findMany({
  include: { client: true },
})
```

### Sélectionner uniquement ce qui est nécessaire
```typescript
// MAL: récupère tout
const users = await prisma.user.findMany()

// BIEN: récupère uniquement les champs nécessaires
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
  },
})
```

### Utiliser les index
```prisma
model Order {
  id           String   @id
  restaurantId String
  status       OrderStatus
  createdAt    DateTime @default(now())

  // Index composé pour les requêtes fréquentes
  @@index([restaurantId, status])
  @@index([restaurantId, createdAt])
}
```

### Limiter les résultats
```typescript
// Toujours limiter les résultats
const recentOrders = await prisma.order.findMany({
  where: { restaurantId },
  take: 50,
  orderBy: { createdAt: 'desc' },
})
```
