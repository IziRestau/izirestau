'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { usePOSStore, POSCustomer } from '@/stores/pos.store'
import { api, apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-media-query'
import {
  Search,
  User,
  Phone,
  Mail,
  ShoppingBag,
  Check,
  Plus,
  X,
  Loader2,
  UserX,
  ArrowLeft,
} from 'lucide-react'

interface CustomerSelectModalProps {
  isOpen: boolean
  onClose: () => void
  primaryColor: string
}

export function CustomerSelectModal({
  isOpen,
  onClose,
  primaryColor,
}: CustomerSelectModalProps) {
  const { accessToken } = useAuthStore()
  const { currentRestaurantId } = useRestaurantStore()
  const { customer, setCustomer } = usePOSStore()
  const queryClient = useQueryClient()
  const isMobile = useIsMobile()

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [mode, setMode] = useState<'search' | 'create'>('search')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      setDebouncedSearch('')
      setMode('search')
      setFormData({ firstName: '', lastName: '', email: '', phone: '' })
    }
  }, [isOpen])

  const { data: customersResponse, isLoading } = useQuery({
    queryKey: ['pos-customers-search', currentRestaurantId, debouncedSearch],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.customers.list({
        search: debouncedSearch || undefined,
        restaurantId: currentRestaurantId || undefined,
        limit: 10,
        sortBy: 'lastName',
        sortOrder: 'asc',
      })
    },
    enabled: !!accessToken && !!currentRestaurantId && isOpen,
    staleTime: 30 * 1000,
  })

  const customers = customersResponse?.data || []

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.customers.create({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        restaurantId: currentRestaurantId || undefined,
      })
    },
    onSuccess: (res) => {
      const newCustomer = res.data
      if (newCustomer) {
        setCustomer({
          id: newCustomer.id,
          name: `${newCustomer.firstName} ${newCustomer.lastName}`,
          phone: newCustomer.phone || undefined,
          email: newCustomer.email,
        })
        queryClient.invalidateQueries({ queryKey: ['pos-customers-search'] })
        queryClient.invalidateQueries({ queryKey: ['restaurant-customers'] })
        toast.success(`Client ${newCustomer.firstName} ${newCustomer.lastName} créé et sélectionné`)
        onClose()
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la création du client')
    },
  })

  const handleSelectCustomer = (c: {
    id: string
    firstName: string
    lastName: string
    phone: string | null
    email: string
  }) => {
    setCustomer({
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      phone: c.phone || undefined,
      email: c.email,
    })
    toast.success(`Client ${c.firstName} ${c.lastName} sélectionné`)
    onClose()
  }

  const handleRemoveCustomer = () => {
    setCustomer(null)
    toast.success('Client retiré de la commande')
  }

  const handleSwitchToCreate = () => {
    const parts = searchQuery.trim().split(' ')
    setFormData({
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
      email: searchQuery.includes('@') ? searchQuery : '',
      phone: /^\d/.test(searchQuery) ? searchQuery : '',
    })
    setMode('create')
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error('Prénom, nom et email sont requis')
      return
    }
    createMutation.mutate(formData)
  }

  const searchContent = (
    <div className="flex flex-col h-full min-h-0">
      {customer && (
        <div className="mx-4 mt-3 mb-2 p-3 rounded-xl border-2 flex items-center justify-between flex-shrink-0" style={{ borderColor: primaryColor, backgroundColor: `${primaryColor}08` }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
              <User size={16} style={{ color: primaryColor }} />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">{customer.name}</p>
              {customer.email && <p className="text-xs text-gray-500 truncate">{customer.email}</p>}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveCustomer}
            className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
          >
            <UserX size={16} className="mr-1" />
            Retirer
          </Button>
        </div>
      )}

      <div className="px-4 py-3 flex-shrink-0">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, email ou téléphone..."
            className="pl-9 h-10 rounded-xl border-gray-200 focus:ring-2 text-sm"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            autoFocus
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: primaryColor }} />
          </div>
        ) : customers.length > 0 ? (
          <div className="space-y-1.5">
            {customers.map((c) => {
              const isSelected = customer?.id === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => handleSelectCustomer(c)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                    isSelected
                      ? 'border-2'
                      : 'border border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                  style={isSelected ? { borderColor: primaryColor, backgroundColor: `${primaryColor}05` } : undefined}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold"
                    style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                  >
                    {c.firstName[0]}{c.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {c.firstName} {c.lastName}
                      </p>
                      {isSelected && <Check size={14} style={{ color: primaryColor }} />}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      {c.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={10} />
                          {c.phone}
                        </span>
                      )}
                      {c.email && (
                        <span className="flex items-center gap-1 truncate">
                          <Mail size={10} />
                          {c.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500">{c.totalOrders} cmd</p>
                  </div>
                </button>
              )
            })}
          </div>
        ) : debouncedSearch ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <UserX size={40} className="mb-3 opacity-50" />
            <p className="text-sm font-medium text-gray-600">Aucun client trouvé</p>
            <p className="text-xs text-gray-400 mt-1">pour "{debouncedSearch}"</p>
            <Button
              onClick={handleSwitchToCreate}
              className="mt-4 rounded-xl text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus size={16} className="mr-2" />
              Créer ce client
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <Search size={40} className="mb-3 opacity-50" />
            <p className="text-sm">Recherchez un client</p>
            <p className="text-xs mt-1">par nom, email ou téléphone</p>
          </div>
        )}
      </div>

      {!debouncedSearch && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleSwitchToCreate}
            className="w-full h-10 rounded-xl transition-colors"
            style={{ borderColor: primaryColor, color: primaryColor }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${primaryColor}10` }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <Plus size={16} className="mr-2" />
            Nouveau client
          </Button>
        </div>
      )}
    </div>
  )

  const createContent = (
    <form onSubmit={handleCreateSubmit} className="flex flex-col h-full">
      <div className="px-4 pt-2 pb-3">
        <button
          type="button"
          onClick={() => setMode('search')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={14} />
          Retour à la recherche
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="pos-customer-firstName" className="text-xs font-medium text-gray-700">Prénom *</Label>
            <Input
              id="pos-customer-firstName"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              placeholder="Jean"
              className="h-10 rounded-xl border-gray-200 focus:ring-2 text-sm"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pos-customer-lastName" className="text-xs font-medium text-gray-700">Nom *</Label>
            <Input
              id="pos-customer-lastName"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              placeholder="Dupont"
              className="h-10 rounded-xl border-gray-200 focus:ring-2 text-sm"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pos-customer-email" className="text-xs font-medium text-gray-700">Email *</Label>
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              id="pos-customer-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="jean@email.com"
              className="pl-9 h-10 rounded-xl border-gray-200 focus:ring-2 text-sm"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pos-customer-phone" className="text-xs font-medium text-gray-700">Téléphone</Label>
          <div className="relative">
            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              id="pos-customer-phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+33 6 12 34 56 78"
              className="pl-9 h-10 rounded-xl border-gray-200 focus:ring-2 text-sm"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 pt-3 border-t border-gray-100 flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setMode('search')}
          className="flex-1 h-10 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={createMutation.isPending || !formData.firstName || !formData.lastName || !formData.email}
          className="flex-1 h-10 rounded-xl text-white disabled:opacity-50"
          style={{ backgroundColor: primaryColor }}
        >
          {createMutation.isPending ? (
            <Loader2 size={16} className="mr-2 animate-spin" />
          ) : (
            <Plus size={16} className="mr-2" />
          )}
          Créer et sélectionner
        </Button>
      </div>
    </form>
  )

  const modalContent = mode === 'search' ? searchContent : createContent

  const title = mode === 'search' ? 'Sélectionner un client' : 'Nouveau client'
  const description = mode === 'search'
    ? 'Recherchez ou créez un client pour cette commande'
    : 'Remplissez les informations du nouveau client'

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[85vh] flex flex-col">
          <DrawerHeader className="text-left flex-shrink-0">
            <DrawerTitle className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <User size={18} style={{ color: primaryColor }} />
              </div>
              <span>{title}</span>
            </DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {modalContent}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden rounded-2xl max-h-[80vh] flex flex-col">
        <DialogHeader className="p-4 pb-0 flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <User size={18} style={{ color: primaryColor }} />
            </div>
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {modalContent}
        </div>
      </DialogContent>
    </Dialog>
  )
}
