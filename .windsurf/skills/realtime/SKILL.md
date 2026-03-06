# Skill: Real-time (Socket.io)

## Quand utiliser ce skill
- Notifications en temps réel
- Mise à jour live des commandes
- Tracking livreurs
- Chat/messaging

---

## Architecture Real-time

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │◀───▶│   Socket.io │◀───▶│   Redis     │
│   Client    │     │   Server    │     │   Pub/Sub   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Database   │
                    └─────────────┘
```

---

## Backend Setup

### Configuration Socket.io
```typescript
// src/socket/index.ts
import { Server } from 'socket.io'
import { Server as HttpServer } from 'http'
import { verifyAccessToken } from '@/utils/jwt'
import { prisma } from '@iziresto/database'

let io: Server

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
  })

  // Middleware d'authentification
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) {
        return next(new Error('Authentication required'))
      }

      const payload = verifyAccessToken(token)
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          userType: true,
          resellerProfile: { select: { organizationId: true } },
          restaurantProfile: { select: { restaurantId: true } },
        },
      })

      if (!user) {
        return next(new Error('User not found'))
      }

      socket.data.user = user
      next()
    } catch (error) {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    const { user } = socket.data
    console.log(`User connected: ${user.id}`)

    // Rejoindre les rooms appropriées
    if (user.userType === 'RESELLER' && user.resellerProfile?.organizationId) {
      socket.join(`org:${user.resellerProfile.organizationId}`)
    }

    if (user.userType === 'RESTAURANT' && user.restaurantProfile?.restaurantId) {
      socket.join(`restaurant:${user.restaurantProfile.restaurantId}`)
    }

    if (user.userType === 'DRIVER') {
      socket.join(`driver:${user.id}`)
    }

    // Handlers
    socket.on('join:order', (orderId: string) => {
      socket.join(`order:${orderId}`)
    })

    socket.on('leave:order', (orderId: string) => {
      socket.leave(`order:${orderId}`)
    })

    socket.on('driver:location', async (data: { lat: number; lng: number }) => {
      if (user.userType !== 'DRIVER') return

      // Mettre à jour la position en BDD
      await prisma.driver.update({
        where: { userId: user.id },
        data: {
          currentLatitude: data.lat,
          currentLongitude: data.lng,
          lastLocationUpdate: new Date(),
        },
      })

      // Émettre aux restaurants concernés
      const driver = await prisma.driver.findUnique({
        where: { userId: user.id },
        include: {
          deliveries: {
            where: { status: { in: ['ASSIGNED', 'PICKED_UP', 'EN_ROUTE'] } },
            include: { order: true },
          },
        },
      })

      driver?.deliveries.forEach((delivery) => {
        io.to(`restaurant:${delivery.order.restaurantId}`).emit('driver:location', {
          driverId: driver.id,
          orderId: delivery.orderId,
          location: data,
        })

        io.to(`order:${delivery.orderId}`).emit('driver:location', {
          location: data,
        })
      })
    })

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.id}`)
    })
  })

  return io
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized')
  }
  return io
}
```

### Émetteurs d'événements
```typescript
// src/socket/emitters.ts
import { getIO } from './index'

export const socketEmitters = {
  // Nouvelle commande
  newOrder(restaurantId: string, order: any) {
    getIO().to(`restaurant:${restaurantId}`).emit('order:new', order)
  },

  // Mise à jour statut commande
  orderStatusUpdate(orderId: string, status: string, data?: any) {
    getIO().to(`order:${orderId}`).emit('order:status', { status, ...data })
  },

  // Notification revendeur
  resellerNotification(organizationId: string, notification: any) {
    getIO().to(`org:${organizationId}`).emit('notification', notification)
  },

  // Nouvelle livraison disponible
  newDeliveryAvailable(restaurantId: string, delivery: any) {
    getIO().to(`restaurant:${restaurantId}`).emit('delivery:available', delivery)
  },

  // Livraison assignée
  deliveryAssigned(driverId: string, delivery: any) {
    getIO().to(`driver:${driverId}`).emit('delivery:assigned', delivery)
  },

  // Mise à jour stock
  stockAlert(restaurantId: string, ingredient: any) {
    getIO().to(`restaurant:${restaurantId}`).emit('stock:alert', ingredient)
  },
}
```

### Intégration dans les controllers
```typescript
// src/controllers/restaurant/orders.controller.ts
import { socketEmitters } from '@/socket/emitters'

export const ordersController = {
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const { status } = req.body

      const order = await prisma.order.update({
        where: { id },
        data: { status },
        include: { customer: true },
      })

      // Émettre l'événement en temps réel
      socketEmitters.orderStatusUpdate(order.id, status, {
        updatedAt: order.updatedAt,
      })

      // Si livraison, notifier le livreur
      if (status === 'READY' && order.serviceType === 'DELIVERY') {
        const delivery = await prisma.delivery.findUnique({
          where: { orderId: order.id },
        })
        if (delivery?.driverId) {
          socketEmitters.deliveryAssigned(delivery.driverId, {
            orderId: order.id,
            status: 'READY_FOR_PICKUP',
          })
        }
      }

      return success(res, order)
    } catch (error) {
      next(error)
    }
  },
}
```

---

## Frontend Setup

### Hook useSocket
```typescript
// hooks/useSocket.ts
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth.store'

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)
  const { accessToken, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return

    socketRef.current = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket'],
    })

    socketRef.current.on('connect', () => {
      console.log('Socket connected')
    })

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [isAuthenticated, accessToken])

  const on = useCallback((event: string, callback: (data: any) => void) => {
    socketRef.current?.on(event, callback)
    return () => {
      socketRef.current?.off(event, callback)
    }
  }, [])

  const emit = useCallback((event: string, data?: any) => {
    socketRef.current?.emit(event, data)
  }, [])

  const joinRoom = useCallback((room: string) => {
    socketRef.current?.emit(`join:${room.split(':')[0]}`, room.split(':')[1])
  }, [])

  const leaveRoom = useCallback((room: string) => {
    socketRef.current?.emit(`leave:${room.split(':')[0]}`, room.split(':')[1])
  }, [])

  return { on, emit, joinRoom, leaveRoom, socket: socketRef.current }
}
```

### Hook useOrderUpdates
```typescript
// hooks/useOrderUpdates.ts
'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSocket } from './useSocket'
import { toast } from 'sonner'

export function useOrderUpdates(orderId?: string) {
  const { on, joinRoom, leaveRoom } = useSocket()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!orderId) return

    joinRoom(`order:${orderId}`)

    const unsubscribe = on('order:status', (data) => {
      // Invalider le cache
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] })
      
      // Notification
      toast.info(`Commande mise à jour: ${data.status}`)
    })

    return () => {
      leaveRoom(`order:${orderId}`)
      unsubscribe()
    }
  }, [orderId, on, joinRoom, leaveRoom, queryClient])
}
```

### Hook useNewOrders (Restaurant)
```typescript
// hooks/useNewOrders.ts
'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSocket } from './useSocket'
import { toast } from 'sonner'

export function useNewOrders() {
  const { on } = useSocket()
  const queryClient = useQueryClient()

  useEffect(() => {
    const unsubscribe = on('order:new', (order) => {
      // Invalider le cache des commandes
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      
      // Notification sonore + visuelle
      playNotificationSound()
      toast.success(`Nouvelle commande #${order.displayNumber}`, {
        action: {
          label: 'Voir',
          onClick: () => window.location.href = `/restaurant/orders/${order.id}`,
        },
      })
    })

    return unsubscribe
  }, [on, queryClient])
}

function playNotificationSound() {
  const audio = new Audio('/sounds/new-order.mp3')
  audio.play().catch(() => {})
}
```

### Hook useDriverLocation
```typescript
// hooks/useDriverLocation.ts
'use client'

import { useEffect, useState } from 'react'
import { useSocket } from './useSocket'

interface Location {
  lat: number
  lng: number
}

export function useDriverLocation(orderId: string) {
  const { on, joinRoom, leaveRoom } = useSocket()
  const [location, setLocation] = useState<Location | null>(null)

  useEffect(() => {
    joinRoom(`order:${orderId}`)

    const unsubscribe = on('driver:location', (data) => {
      setLocation(data.location)
    })

    return () => {
      leaveRoom(`order:${orderId}`)
      unsubscribe()
    }
  }, [orderId, on, joinRoom, leaveRoom])

  return location
}
```

---

## Composants Real-time

### OrderTracker
```typescript
// components/storefront/OrderTracker.tsx
'use client'

import { useOrderUpdates, useDriverLocation } from '@/hooks'
import { MapPin, Package, Truck, Check } from 'lucide-react'

interface OrderTrackerProps {
  orderId: string
  initialStatus: string
}

const steps = [
  { status: 'CONFIRMED', label: 'Confirmée', icon: Check },
  { status: 'PREPARING', label: 'En préparation', icon: Package },
  { status: 'OUT_FOR_DELIVERY', label: 'En livraison', icon: Truck },
  { status: 'DELIVERED', label: 'Livrée', icon: MapPin },
]

export function OrderTracker({ orderId, initialStatus }: OrderTrackerProps) {
  useOrderUpdates(orderId)
  const driverLocation = useDriverLocation(orderId)

  const currentStepIndex = steps.findIndex((s) => s.status === initialStatus)

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isCompleted = index <= currentStepIndex
          const isCurrent = index === currentStepIndex

          return (
            <div key={step.status} className="flex flex-col items-center">
              <div
                className={`rounded-full p-3 ${
                  isCompleted
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                } ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="mt-2 text-sm">{step.label}</span>
            </div>
          )
        })}
      </div>

      {/* Map avec position livreur */}
      {driverLocation && (
        <div className="h-64 rounded-lg bg-muted">
          {/* Intégrer Mapbox ici */}
          <p className="p-4 text-center text-muted-foreground">
            Livreur en route: {driverLocation.lat.toFixed(4)}, {driverLocation.lng.toFixed(4)}
          </p>
        </div>
      )}
    </div>
  )
}
```

### LiveOrdersPanel
```typescript
// components/restaurant/LiveOrdersPanel.tsx
'use client'

import { useNewOrders } from '@/hooks/useNewOrders'
import { useOrders } from '@/hooks/useOrders'
import { OrderCard } from './OrderCard'
import { LoadingState } from '@iziresto/ui'

export function LiveOrdersPanel() {
  useNewOrders() // Écoute les nouvelles commandes
  
  const { data, isLoading } = useOrders({
    status: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'],
  })

  if (isLoading) return <LoadingState />

  const orders = data?.data ?? []

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  )
}
```

---

## Événements Socket

| Événement | Direction | Description |
|-----------|-----------|-------------|
| `order:new` | Server → Client | Nouvelle commande |
| `order:status` | Server → Client | Changement statut commande |
| `driver:location` | Client → Server | Position livreur |
| `driver:location` | Server → Client | Position livreur (broadcast) |
| `delivery:available` | Server → Client | Nouvelle livraison dispo |
| `delivery:assigned` | Server → Client | Livraison assignée |
| `notification` | Server → Client | Notification générique |
| `stock:alert` | Server → Client | Alerte stock bas |
