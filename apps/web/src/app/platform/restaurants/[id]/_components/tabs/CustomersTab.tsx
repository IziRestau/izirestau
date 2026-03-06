'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { RestaurantDetails, Customer } from '../types'

interface CustomersTabProps {
  restaurant: RestaurantDetails
}

interface CustomersData {
  customers: Customer[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
  stats: {
    total: number
    avgSpent: number
  }
}

export function CustomersTab({ restaurant }: CustomersTabProps) {
  const { accessToken } = useAuthStore()
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['platform-restaurant-customers', restaurant.id, page],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', '20')
      const res = await apiClient.get(`/platform/restaurants/${restaurant.id}/customers?${params.toString()}`)
      return res.data as CustomersData
    },
    enabled: !!accessToken,
  })

  const currency = restaurant.settings?.currency || 'XOF'

  const filteredCustomers = data?.customers.filter(customer => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      customer.firstName.toLowerCase().includes(search) ||
      customer.lastName.toLowerCase().includes(search) ||
      customer.email.toLowerCase().includes(search) ||
      customer.phone?.toLowerCase().includes(search)
    )
  }) || []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{data?.stats.total || 0}</p>
              <p className="text-xs text-gray-500">Clients</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency, notation: 'compact' }).format(Number(data?.stats.avgSpent || 0))}
              </p>
              <p className="text-xs text-gray-500">Panier moyen</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <ShoppingBag size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{restaurant._count.orders}</p>
              <p className="text-xs text-gray-500">Commandes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher un client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-8 text-center">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Aucun client trouve</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3 text-center">Commandes</th>
                    <th className="px-4 py-3 text-right">Total depense</th>
                    <th className="px-4 py-3">Derniere commande</th>
                    <th className="px-4 py-3">Inscrit le</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-emerald-700">
                              {customer.firstName[0]}{customer.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {customer.firstName} {customer.lastName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail size={14} className="text-gray-400" />
                            {customer.email}
                          </div>
                          {customer.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone size={14} className="text-gray-400" />
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-medium text-gray-900">{customer.totalOrders}</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-medium text-gray-900">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(Number(customer.totalSpent))}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {customer.lastOrderAt ? (
                          <span className="text-sm text-gray-600">
                            {format(new Date(customer.lastOrderAt), 'dd/MM/yyyy', { locale: fr })}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-600">
                          {format(new Date(customer.createdAt), 'dd/MM/yyyy', { locale: fr })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data?.pagination && data.pagination.pages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {data.pagination.page} sur {data.pagination.pages} ({data.pagination.total} clients)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))}
                    disabled={page === data.pagination.pages}
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
