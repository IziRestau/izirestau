# Skill: Testing

## Quand utiliser ce skill
- Écriture de tests unitaires
- Tests d'intégration API
- Tests E2E
- Mocking

---

## Stack Testing

| Outil | Usage |
|-------|-------|
| **Vitest** | Tests unitaires (fast, ESM native) |
| **Playwright** | Tests E2E |
| **MSW** | Mock API pour tests frontend |
| **Supertest** | Tests API backend |

---

## Configuration

### Vitest
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Setup
```typescript
// tests/setup.ts
import '@testing-library/jest-dom'
import { beforeAll, afterAll, afterEach } from 'vitest'
import { server } from './mocks/server'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

---

## Tests Unitaires Frontend

### Composant
```typescript
// components/__tests__/StatCard.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StatCard } from '../StatCard'
import { Users } from 'lucide-react'

describe('StatCard', () => {
  it('renders title and value', () => {
    render(<StatCard title="Users" value={42} icon={Users} />)
    
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('shows positive trend', () => {
    render(
      <StatCard 
        title="Users" 
        value={42} 
        icon={Users} 
        trend={{ value: 12, isPositive: true }}
      />
    )
    
    expect(screen.getByText('+12%')).toBeInTheDocument()
  })
})
```

### Hook
```typescript
// hooks/__tests__/useSites.test.tsx
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect } from 'vitest'
import { useSites } from '../useSites'

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('useSites', () => {
  it('fetches sites', async () => {
    const { result } = renderHook(() => useSites(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.data).toHaveLength(2)
  })
})
```

### Utility
```typescript
// utils/__tests__/formatCurrency.test.ts
import { describe, it, expect } from 'vitest'
import { formatCurrency } from '../formatCurrency'

describe('formatCurrency', () => {
  it('formats EUR correctly', () => {
    expect(formatCurrency(1234.56, 'EUR')).toBe('1 234,56 €')
  })

  it('formats USD correctly', () => {
    expect(formatCurrency(1234.56, 'USD', 'en-US')).toBe('$1,234.56')
  })

  it('handles zero', () => {
    expect(formatCurrency(0, 'EUR')).toBe('0,00 €')
  })
})
```

---

## MSW (Mock Service Worker)

### Handlers
```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/reseller/sites', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: '1', subdomain: 'resto-1', status: 'ACTIVE' },
        { id: '2', subdomain: 'resto-2', status: 'DRAFT' },
      ],
    })
  }),

  http.post('/api/reseller/sites', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      success: true,
      data: { id: '3', ...body, status: 'DRAFT' },
    }, { status: 201 })
  }),

  http.get('/api/reseller/sites/:id', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: { id: params.id, subdomain: 'resto-1', status: 'ACTIVE' },
    })
  }),
]
```

### Server
```typescript
// tests/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

---

## Tests API Backend

### Setup
```typescript
// apps/api/tests/setup.ts
import { prisma } from '@iziresto/database'
import { beforeEach, afterAll } from 'vitest'

beforeEach(async () => {
  // Clean database
  await prisma.$transaction([
    prisma.site.deleteMany(),
    prisma.client.deleteMany(),
    // ...
  ])
})

afterAll(async () => {
  await prisma.$disconnect()
})
```

### Test Controller
```typescript
// apps/api/tests/sites.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'
import { prisma } from '@iziresto/database'
import { generateAccessToken } from '../src/utils/jwt'

describe('Sites API', () => {
  let token: string
  let organizationId: string

  beforeEach(async () => {
    // Créer un user et organization de test
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: 'hash',
        firstName: 'Test',
        lastName: 'User',
        userType: 'RESELLER',
      },
    })

    const org = await prisma.resellerOrganization.create({
      data: {
        name: 'Test Org',
        slug: 'test-org',
        email: 'test@example.com',
      },
    })

    await prisma.resellerMember.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        role: 'OWNER',
      },
    })

    organizationId = org.id
    token = generateAccessToken(user.id)
  })

  describe('GET /api/reseller/sites', () => {
    it('returns empty list initially', async () => {
      const res = await request(app)
        .get('/api/reseller/sites')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.sites).toHaveLength(0)
    })

    it('returns sites for organization', async () => {
      await prisma.site.create({
        data: {
          subdomain: 'test-site',
          organizationId,
        },
      })

      const res = await request(app)
        .get('/api/reseller/sites')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.data.sites).toHaveLength(1)
      expect(res.body.data.sites[0].subdomain).toBe('test-site')
    })
  })

  describe('POST /api/reseller/sites', () => {
    it('creates a new site', async () => {
      const res = await request(app)
        .post('/api/reseller/sites')
        .set('Authorization', `Bearer ${token}`)
        .send({ subdomain: 'new-site' })

      expect(res.status).toBe(201)
      expect(res.body.data.subdomain).toBe('new-site')
    })

    it('rejects invalid subdomain', async () => {
      const res = await request(app)
        .post('/api/reseller/sites')
        .set('Authorization', `Bearer ${token}`)
        .send({ subdomain: 'AB' }) // Too short

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('VALIDATION_ERROR')
    })

    it('rejects duplicate subdomain', async () => {
      await prisma.site.create({
        data: { subdomain: 'existing', organizationId },
      })

      const res = await request(app)
        .post('/api/reseller/sites')
        .set('Authorization', `Bearer ${token}`)
        .send({ subdomain: 'existing' })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('SUBDOMAIN_TAKEN')
    })
  })
})
```

---

## Tests E2E (Playwright)

### Configuration
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Test E2E
```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('user can login', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/reseller')
    await expect(page.locator('h1')).toContainText('Dashboard')
  })

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[name="email"]', 'wrong@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    await expect(page.locator('[role="alert"]')).toContainText('incorrect')
  })
})
```

```typescript
// e2e/sites.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Sites Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/reseller')
  })

  test('can create a new site', async ({ page }) => {
    await page.goto('/reseller/sites')
    
    await page.click('button:has-text("Nouveau site")')
    await page.fill('input[name="subdomain"]', 'mon-nouveau-site')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=Site créé')).toBeVisible()
    await expect(page.locator('text=mon-nouveau-site')).toBeVisible()
  })
})
```

---

## Commandes

```bash
# Tests unitaires
pnpm test

# Tests avec watch
pnpm test:watch

# Tests avec coverage
pnpm test:coverage

# Tests E2E
pnpm test:e2e

# Tests E2E avec UI
pnpm test:e2e:ui
```
