'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  ShoppingBag,
  Users,
  CreditCard,
  Check,
  Trash2,
} from 'lucide-react'

interface Notification {
  id: string
  type: 'success' | 'warning' | 'info' | 'order' | 'client' | 'payment'
  title: string
  message: string
  read: boolean
  createdAt: Date
}

interface NotificationsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'order',
    title: 'Nouvelle commande',
    message: 'Restaurant Le Gourmet a recu une nouvelle commande #1234',
    read: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: '2',
    type: 'client',
    title: 'Nouveau client',
    message: 'Marie Dupont vient de creer un compte',
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: '3',
    type: 'payment',
    title: 'Paiement recu',
    message: 'Paiement de 299 EUR recu pour la licence Pro',
    read: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '4',
    type: 'success',
    title: 'Site publie',
    message: 'Le site pizza-mario.iziresto.com est maintenant en ligne',
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: '5',
    type: 'warning',
    title: 'Licence expire bientot',
    message: 'La licence du Restaurant Thai expire dans 7 jours',
    read: true,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
  },
]

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return <CheckCircle size={18} className="text-emerald-500" />
    case 'warning':
      return <AlertCircle size={18} className="text-amber-500" />
    case 'info':
      return <Info size={18} className="text-blue-500" />
    case 'order':
      return <ShoppingBag size={18} className="text-purple-500" />
    case 'client':
      return <Users size={18} className="text-cyan-500" />
    case 'payment':
      return <CreditCard size={18} className="text-emerald-500" />
    default:
      return <Bell size={18} className="text-gray-500" />
  }
}

export function NotificationsPanel({ open, onOpenChange }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState(mockNotifications)

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-600 rounded-full">
                  {unreadCount} nouvelles
                </span>
              )}
            </SheetTitle>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-emerald-500 hover:text-emerald-600 font-medium"
                >
                  Tout marquer lu
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-gray-500 hover:text-gray-600"
                >
                  Effacer tout
                </button>
              )}
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Bell size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Aucune notification</p>
              <p className="text-sm text-gray-400 mt-1">
                Vous etes a jour !
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'px-6 py-4 hover:bg-gray-50 transition-colors group',
                    !notification.read && 'bg-emerald-50/50'
                  )}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          'text-sm',
                          !notification.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                        )}>
                          {notification.title}
                        </p>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 hover:bg-gray-200 rounded"
                              title="Marquer comme lu"
                            >
                              <Check size={14} className="text-gray-500" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 hover:bg-gray-200 rounded"
                            title="Supprimer"
                          >
                            <Trash2 size={14} className="text-gray-500" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(notification.createdAt, {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
