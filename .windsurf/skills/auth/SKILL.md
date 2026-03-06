# Skill: Authentification & Autorisation

## Quand utiliser ce skill
- Implémentation login/register
- Gestion des tokens JWT
- Middleware d'authentification
- Contrôle d'accès par rôle
- Refresh tokens

---

## Architecture Auth

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│  Database   │
│             │     │             │     │             │
│ - Login     │     │ - Validate  │     │ - Users     │
│ - Store JWT │     │ - Generate  │     │ - Tokens    │
│ - Refresh   │     │   tokens    │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## Flow d'Authentification

### 1. Login
```
Client                    Server                    Database
  │                         │                          │
  │── POST /auth/login ────▶│                          │
  │   {email, password}     │                          │
  │                         │── Find user ────────────▶│
  │                         │◀── User data ───────────│
  │                         │                          │
  │                         │── Verify password        │
  │                         │── Generate tokens        │
  │                         │── Store refresh token ──▶│
  │                         │                          │
  │◀── {accessToken,       │                          │
  │     refreshToken,       │                          │
  │     user} ─────────────│                          │
```

### 2. Requête authentifiée
```
Client                    Server
  │                         │
  │── GET /api/resource ───▶│
  │   Authorization: Bearer │
  │                         │── Verify JWT
  │                         │── Extract user
  │                         │── Check permissions
  │◀── Response ───────────│
```

### 3. Refresh Token
```
Client                    Server                    Database
  │                         │                          │
  │── POST /auth/refresh ──▶│                          │
  │   {refreshToken}        │                          │
  │                         │── Verify token           │
  │                         │── Find in DB ───────────▶│
  │                         │◀── Token valid ─────────│
  │                         │                          │
  │                         │── Generate new tokens    │
  │                         │── Rotate refresh token ─▶│
  │                         │                          │
  │◀── {accessToken,       │                          │
  │     refreshToken} ─────│                          │
```

---

## Backend Implementation

### Auth Controller
```typescript
// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { hash, compare } from 'bcryptjs'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@/utils/jwt'
import { AppError } from '@/utils/errors'
import { success } from '@/utils/response'

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName, organizationName } = req.body

      // Vérifier si l'email existe
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        throw new AppError('Cet email est déjà utilisé', 400, 'EMAIL_EXISTS')
      }

      const passwordHash = await hash(password, 12)

      // Transaction: créer user + organization + member
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            passwordHash,
            firstName,
            lastName,
            userType: 'RESELLER',
          },
        })

        const organization = await tx.resellerOrganization.create({
          data: {
            name: organizationName,
            slug: organizationName.toLowerCase().replace(/\s+/g, '-'),
            email,
          },
        })

        await tx.resellerMember.create({
          data: {
            userId: user.id,
            organizationId: organization.id,
            role: 'OWNER',
            joinedAt: new Date(),
          },
        })

        return { user, organization }
      })

      // Générer tokens
      const accessToken = generateAccessToken(result.user.id)
      const refreshToken = generateRefreshToken(result.user.id)

      // Stocker refresh token
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: result.user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
        },
      })

      return success(res, {
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          userType: result.user.userType,
        },
        accessToken,
        refreshToken,
      }, 201)
    } catch (error) {
      next(error)
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body

      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          resellerProfile: { include: { organization: true } },
          restaurantProfile: { include: { restaurant: true } },
        },
      })

      if (!user) {
        throw new AppError('Email ou mot de passe incorrect', 401, 'INVALID_CREDENTIALS')
      }

      const isValid = await compare(password, user.passwordHash)
      if (!isValid) {
        throw new AppError('Email ou mot de passe incorrect', 401, 'INVALID_CREDENTIALS')
      }

      // Générer tokens
      const accessToken = generateAccessToken(user.id)
      const refreshToken = generateRefreshToken(user.id)

      // Stocker refresh token
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      })

      return success(res, {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.userType,
          organization: user.resellerProfile?.organization,
          restaurant: user.restaurantProfile?.restaurant,
        },
        accessToken,
        refreshToken,
      })
    } catch (error) {
      next(error)
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        throw new AppError('Refresh token requis', 400, 'MISSING_TOKEN')
      }

      // Vérifier le token
      const payload = verifyRefreshToken(refreshToken)

      // Vérifier en BDD
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      })

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new AppError('Token invalide ou expiré', 401, 'INVALID_TOKEN')
      }

      // Supprimer l'ancien token (rotation)
      await prisma.refreshToken.delete({ where: { id: storedToken.id } })

      // Générer nouveaux tokens
      const newAccessToken = generateAccessToken(payload.userId)
      const newRefreshToken = generateRefreshToken(payload.userId)

      // Stocker nouveau refresh token
      await prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: payload.userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      })

      return success(res, {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      })
    } catch (error) {
      next(error)
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body

      if (refreshToken) {
        await prisma.refreshToken.deleteMany({
          where: { token: refreshToken },
        })
      }

      return success(res, { message: 'Déconnexion réussie' })
    } catch (error) {
      next(error)
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          userType: true,
          avatar: true,
          resellerProfile: {
            include: {
              organization: {
                include: { license: { include: { plan: true } } },
              },
            },
          },
          restaurantProfile: {
            include: { restaurant: true },
          },
        },
      })

      return success(res, user)
    } catch (error) {
      next(error)
    }
  },
}
```

---

## Frontend Implementation

### Auth Store
```typescript
// stores/auth.store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/api-client'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  userType: 'SUPER_ADMIN' | 'RESELLER' | 'RESTAURANT' | 'DRIVER'
  organization?: { id: string; name: string }
  restaurant?: { id: string; name: string }
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  refreshTokens: () => Promise<void>
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await api.auth.login({ email, password })
          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
          })
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (data) => {
        set({ isLoading: true })
        try {
          const { data: result } = await api.auth.register(data)
          set({
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            isAuthenticated: true,
          })
        } finally {
          set({ isLoading: false })
        }
      },

      logout: async () => {
        const { refreshToken } = get()
        try {
          await api.auth.logout({ refreshToken })
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          })
        }
      },

      refreshTokens: async () => {
        const { refreshToken } = get()
        if (!refreshToken) throw new Error('No refresh token')

        const { data } = await api.auth.refresh({ refreshToken })
        set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        })
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
```

### API Client avec Refresh
```typescript
// lib/api-client.ts
import { useAuthStore } from '@/stores/auth.store'

const API_URL = process.env.NEXT_PUBLIC_API_URL

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const { accessToken, refreshTokens, logout } = useAuthStore.getState()

  const makeRequest = async (token: string | null) => {
    return fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
    })
  }

  let res = await makeRequest(accessToken)

  // Si 401, tenter un refresh
  if (res.status === 401 && accessToken) {
    try {
      await refreshTokens()
      const { accessToken: newToken } = useAuthStore.getState()
      res = await makeRequest(newToken)
    } catch {
      logout()
      throw new Error('Session expirée')
    }
  }

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Une erreur est survenue')
  }

  return res.json()
}
```

### Protected Route
```typescript
// components/auth/ProtectedRoute.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { LoadingState } from '@/components/shared/LoadingState'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter()
  const { isAuthenticated, user, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }

    if (!isLoading && isAuthenticated && allowedRoles && user) {
      if (!allowedRoles.includes(user.userType)) {
        router.push('/unauthorized')
      }
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, router])

  if (isLoading) {
    return <LoadingState />
  }

  if (!isAuthenticated) {
    return null
  }

  if (allowedRoles && user && !allowedRoles.includes(user.userType)) {
    return null
  }

  return <>{children}</>
}
```

### Usage dans Layout
```typescript
// app/reseller/layout.tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function ResellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['RESELLER']}>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </ProtectedRoute>
  )
}
```

---

## Permissions par Rôle

### Matrice des permissions
```typescript
// lib/permissions.ts
export const PERMISSIONS = {
  SUPER_ADMIN: [
    'platform:read',
    'platform:write',
    'resellers:read',
    'resellers:write',
    'licenses:read',
    'licenses:write',
  ],
  RESELLER: {
    OWNER: [
      'organization:read',
      'organization:write',
      'organization:delete',
      'sites:read',
      'sites:write',
      'sites:delete',
      'clients:read',
      'clients:write',
      'billing:read',
      'billing:write',
      'team:read',
      'team:write',
      'team:delete',
    ],
    ADMIN: [
      'organization:read',
      'sites:read',
      'sites:write',
      'clients:read',
      'clients:write',
      'billing:read',
      'team:read',
    ],
    SALES: [
      'sites:read',
      'clients:read',
      'clients:write',
    ],
  },
  RESTAURANT: {
    OWNER: ['restaurant:*'],
    MANAGER: ['restaurant:read', 'restaurant:write', 'orders:*', 'products:*'],
    STAFF: ['orders:read', 'orders:write'],
    KITCHEN: ['orders:read', 'orders:update_status'],
  },
}

export function hasPermission(
  userType: string,
  role: string,
  permission: string
): boolean {
  const permissions = PERMISSIONS[userType]?.[role] || []
  
  return permissions.some((p) => {
    if (p.endsWith(':*')) {
      return permission.startsWith(p.replace(':*', ''))
    }
    return p === permission
  })
}
```

### Middleware de permission
```typescript
// middlewares/permission.middleware.ts
export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req
    
    if (!user) {
      return next(new AppError('Non authentifié', 401, 'UNAUTHORIZED'))
    }

    // Super admin a tous les droits
    if (user.userType === 'SUPER_ADMIN') {
      return next()
    }

    // Récupérer le rôle de l'utilisateur
    let role = 'MEMBER'
    if (user.userType === 'RESELLER') {
      const member = await prisma.resellerMember.findUnique({
        where: { userId: user.id },
      })
      role = member?.role || 'MEMBER'
    }

    if (!hasPermission(user.userType, role, permission)) {
      return next(new AppError('Permission refusée', 403, 'FORBIDDEN'))
    }

    next()
  }
}

// Usage
router.delete('/:id', 
  auth, 
  requirePermission('sites:delete'), 
  sitesController.delete
)
```
