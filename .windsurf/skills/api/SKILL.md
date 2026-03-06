# Skill: API REST Patterns

## Quand utiliser ce skill
- Design d'endpoints API
- Conventions de nommage
- Gestion des erreurs
- Pagination et filtres

---

## Conventions URL

### Structure
```
/api/<domain>/<resource>
/api/<domain>/<resource>/:id
/api/<domain>/<resource>/:id/<sub-resource>
```

### Exemples
```
GET    /api/reseller/sites              # Liste des sites
POST   /api/reseller/sites              # Créer un site
GET    /api/reseller/sites/:id          # Détail d'un site
PUT    /api/reseller/sites/:id          # Modifier un site
DELETE /api/reseller/sites/:id          # Supprimer un site
GET    /api/reseller/sites/:id/stats    # Stats d'un site

GET    /api/restaurant/orders           # Liste des commandes
POST   /api/restaurant/orders/:id/accept # Action sur commande
```

### Domaines
| Préfixe | Rôle |
|---------|------|
| `/api/auth` | Authentification |
| `/api/platform` | Super Admin |
| `/api/reseller` | Revendeur |
| `/api/restaurant` | Restaurant |
| `/api/driver` | Livreur |
| `/api/public` | Storefront (public) |
| `/api/webhooks` | Webhooks externes |

---

## Format des Réponses

### Succès
```typescript
// 200 OK - Liste
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}

// 200 OK - Détail
{
  "success": true,
  "data": { ... }
}

// 201 Created
{
  "success": true,
  "data": { ... }
}

// 204 No Content (pour DELETE)
// Pas de body
```

### Erreur
```typescript
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Le sous-domaine doit contenir au moins 3 caractères",
  "details": [
    {
      "field": "subdomain",
      "message": "Minimum 3 caractères"
    }
  ]
}
```

### Codes d'erreur standards
| Code | Error | Description |
|------|-------|-------------|
| 400 | `VALIDATION_ERROR` | Données invalides |
| 400 | `BAD_REQUEST` | Requête malformée |
| 401 | `UNAUTHORIZED` | Non authentifié |
| 401 | `INVALID_TOKEN` | Token invalide/expiré |
| 403 | `FORBIDDEN` | Permission refusée |
| 404 | `NOT_FOUND` | Ressource non trouvée |
| 409 | `CONFLICT` | Conflit (ex: email déjà utilisé) |
| 422 | `UNPROCESSABLE` | Logique métier échouée |
| 429 | `RATE_LIMITED` | Trop de requêtes |
| 500 | `INTERNAL_ERROR` | Erreur serveur |

---

## Pagination

### Query params
```
GET /api/reseller/sites?page=1&limit=20&sort=createdAt&order=desc
```

### Réponse
```typescript
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Implementation
```typescript
async function paginate<T>(
  model: any,
  where: any,
  options: {
    page?: number
    limit?: number
    orderBy?: any
    include?: any
  }
) {
  const page = options.page || 1
  const limit = Math.min(options.limit || 20, 100)
  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    model.findMany({
      where,
      skip,
      take: limit,
      orderBy: options.orderBy || { createdAt: 'desc' },
      include: options.include,
    }),
    model.count({ where }),
  ])

  return {
    items,
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

---

## Filtres

### Query params
```
GET /api/reseller/sites?status=ACTIVE&search=resto&clientId=xxx
```

### Implementation
```typescript
function buildFilters(query: any, allowedFilters: string[]) {
  const filters: any = {}

  for (const key of allowedFilters) {
    if (query[key] !== undefined) {
      filters[key] = query[key]
    }
  }

  // Recherche textuelle
  if (query.search) {
    filters.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { subdomain: { contains: query.search, mode: 'insensitive' } },
    ]
  }

  return filters
}

// Usage
const filters = buildFilters(req.query, ['status', 'clientId'])
const where = { organizationId, ...filters }
```

---

## Validation

### Schema Zod
```typescript
// validators/sites.validator.ts
import { z } from 'zod'

export const createSiteSchema = z.object({
  subdomain: z
    .string()
    .min(3, 'Minimum 3 caractères')
    .max(50, 'Maximum 50 caractères')
    .regex(/^[a-z0-9-]+$/, 'Uniquement lettres minuscules, chiffres et tirets'),
  clientId: z.string().cuid().optional(),
})

export const updateSiteSchema = createSiteSchema.partial()

export const siteIdSchema = z.object({
  id: z.string().cuid(),
})

export const listSitesSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'SUSPENDED']).optional(),
  search: z.string().optional(),
})
```

### Middleware validation
```typescript
// middlewares/validate.middleware.ts
import { ZodSchema } from 'zod'
import { Request, Response, NextFunction } from 'express'
import { AppError } from '@/utils/errors'

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source])

    if (!result.success) {
      const details = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))

      return next(new AppError(
        details[0].message,
        400,
        'VALIDATION_ERROR',
        details
      ))
    }

    req[source] = result.data
    next()
  }
}
```

---

## Rate Limiting

```typescript
// middlewares/rateLimit.middleware.ts
import rateLimit from 'express-rate-limit'

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    error: 'RATE_LIMITED',
    message: 'Trop de requêtes, réessayez plus tard',
  },
})

export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 5,
  message: {
    success: false,
    error: 'RATE_LIMITED',
    message: 'Trop de tentatives, réessayez dans 1 heure',
  },
})

// Usage
app.use('/api', apiLimiter)
app.use('/api/auth/login', authLimiter)
```

---

## Versioning (optionnel)

```typescript
// Si besoin de versionner l'API
app.use('/api/v1', v1Routes)
app.use('/api/v2', v2Routes)

// Ou via header
app.use((req, res, next) => {
  req.apiVersion = req.headers['api-version'] || 'v1'
  next()
})
```

---

## Documentation OpenAPI

```typescript
// Utiliser swagger-jsdoc
/**
 * @openapi
 * /api/reseller/sites:
 *   get:
 *     summary: Liste des sites
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des sites
 */
router.get('/', sitesController.list)
```
