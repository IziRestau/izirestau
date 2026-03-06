'use client'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  User,
  Mail,
  Phone,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { CustomerListItem } from '@/types/customer'

interface CustomerListProps {
  customers: CustomerListItem[]
  isLoading: boolean
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  onView: (customer: CustomerListItem) => void
  onEdit: (customer: CustomerListItem) => void
  onDelete: (customer: CustomerListItem) => void
  onToggle: (customer: CustomerListItem) => void
  formatCurrency: (value: number) => string
  primaryColor?: string
  canEdit?: boolean
  canDelete?: boolean
}

export function CustomerList({
  customers,
  isLoading,
  pagination,
  onPageChange,
  onLimitChange,
  onView,
  onEdit,
  onDelete,
  onToggle,
  formatCurrency,
  primaryColor = '#10b981',
  canEdit = true,
  canDelete = true,
}: CustomerListProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commandes</th>
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total dépensé</th>
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dernière commande</th>
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                <th className="px-5 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                    </div>
                  </td>
                  <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-40 animate-pulse" /></td>
                  <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-12 animate-pulse" /></td>
                  <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-20 animate-pulse" /></td>
                  <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-24 animate-pulse" /></td>
                  <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-16 animate-pulse" /></td>
                  <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-8 ml-auto animate-pulse" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const primaryBgLight = hexToRgba(primaryColor, 0.1)

  if (customers.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: primaryBgLight }}
        >
          <User size={28} style={{ color: primaryColor }} />
        </div>
        <p className="text-gray-900 font-medium mb-1">Aucun client</p>
        <p className="text-sm text-gray-500">Les clients apparaîtront ici une fois qu'ils auront passé commande.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      {/* Table Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
              <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-5 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Commandes</th>
              <th className="px-5 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total dépensé</th>
              <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dernière commande</th>
              <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
              <th className="px-5 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer, index) => (
              <tr
                key={customer.id}
                className={cn(
                  "hover:bg-gray-50/50 transition-colors cursor-pointer",
                  index !== customers.length - 1 && "border-b border-gray-50"
                )}
                onClick={() => onView(customer)}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm',
                        !customer.isActive && 'opacity-50'
                      )}
                      style={{ backgroundColor: primaryColor }}
                    >
                      {customer.firstName[0]}{customer.lastName[0]}
                    </div>
                    <div>
                      <p className={cn('font-semibold text-gray-900', !customer.isActive && 'text-gray-400')}>
                        {customer.firstName} {customer.lastName}
                      </p>
                      {!customer.isActive && (
                        <span className="text-xs text-gray-400">Inactif</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-gray-900">{customer.email}</p>
                    {customer.phone && (
                      <p className="text-xs text-gray-500">{customer.phone}</p>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4 text-center">
                  <span className="font-medium text-gray-900">{customer.totalOrders}</span>
                </td>
                <td className="px-5 py-4 text-right">
                  <span className="font-semibold text-gray-900">{formatCurrency(customer.totalSpent)}</span>
                </td>
                <td className="px-5 py-4">
                  {customer.lastOrderAt ? (
                    <p className="text-sm text-gray-900">
                      {format(new Date(customer.lastOrderAt), 'dd MMM yyyy', { locale: fr })}
                    </p>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  {customer.tags.length > 0 ? (
                    <div className="flex items-center gap-1">
                      {customer.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                        >
                          {tag}
                        </span>
                      ))}
                      {customer.tags.length > 2 && (
                        <span className="text-xs text-gray-400">+{customer.tags.length - 2}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg transition-colors"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = `${primaryColor}15`
                          e.currentTarget.style.color = primaryColor
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = ''
                          e.currentTarget.style.color = ''
                        }}
                      >
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50">
                      <DropdownMenuItem 
                        onClick={() => onView(customer)}
                        className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                      >
                        <Eye size={16} className="mr-3 text-gray-400" />
                        <span className="text-[13px] text-gray-700">Voir les détails</span>
                      </DropdownMenuItem>
                      {canEdit && (
                        <DropdownMenuItem 
                          onClick={() => onEdit(customer)}
                          className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                        >
                          <Edit size={16} className="mr-3 text-gray-400" />
                          <span className="text-[13px] text-gray-700">Modifier</span>
                        </DropdownMenuItem>
                      )}
                      {canEdit && (
                        <>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem 
                            onClick={() => onToggle(customer)}
                            className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                          >
                            {customer.isActive ? (
                              <>
                                <ToggleLeft size={16} className="mr-3 text-gray-400" />
                                <span className="text-[13px] text-gray-700">Désactiver</span>
                              </>
                            ) : (
                              <>
                                <ToggleRight size={16} className="mr-3 text-gray-400" />
                                <span className="text-[13px] text-gray-700">Activer</span>
                              </>
                            )}
                          </DropdownMenuItem>
                        </>
                      )}
                      {canDelete && (
                        <>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem
                            onClick={() => onDelete(customer)}
                            className="rounded-lg px-3 py-2.5 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 size={16} className="mr-3" />
                            <span className="text-[13px]">Supprimer</span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards Mobile */}
      <div className="md:hidden divide-y divide-gray-100">
        {customers.map((customer) => (
          <div
            key={customer.id}
            className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => onView(customer)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm',
                    !customer.isActive && 'opacity-50'
                  )}
                  style={{ backgroundColor: primaryColor }}
                >
                  {customer.firstName[0]}{customer.lastName[0]}
                </div>
                <div>
                  <p className={cn('font-medium text-gray-900', !customer.isActive && 'text-gray-400')}>
                    {customer.firstName} {customer.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{customer.email}</p>
                </div>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(customer)}>
                      <Eye size={14} className="mr-2" />
                      Voir
                    </DropdownMenuItem>
                    {canEdit && (
                      <DropdownMenuItem onClick={() => onEdit(customer)}>
                        <Edit size={14} className="mr-2" />
                        Modifier
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(customer)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 size={14} className="mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-gray-500">
                  <span className="font-medium text-gray-900">{customer.totalOrders}</span> commandes
                </span>
                <span className="font-semibold text-gray-900">{formatCurrency(customer.totalSpent)}</span>
              </div>
              {customer.tags.length > 0 && (
                <div className="flex items-center gap-1">
                  <Tag size={12} className="text-gray-400" />
                  <span className="text-xs text-gray-500">{customer.tags.length}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="p-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Afficher</span>
            <Select 
              value={pagination.limit.toString()} 
              onValueChange={(v) => onLimitChange(parseInt(v))}
            >
              <SelectTrigger 
                className="w-20 h-9 rounded-lg focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent accentColor={primaryColor}>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-500">par page</span>
          </div>
          <p className="text-sm text-gray-500">
            Page {pagination.page} sur {pagination.totalPages} ({pagination.total} clients)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-lg transition-colors"
              style={{ 
                borderColor: pagination.page === 1 ? undefined : primaryColor, 
                color: pagination.page === 1 ? undefined : primaryColor 
              }}
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              onMouseEnter={(e) => {
                if (pagination.page > 1) {
                  e.currentTarget.style.backgroundColor = `${primaryColor}15`
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = ''
              }}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-lg transition-colors"
              style={{ 
                borderColor: pagination.page === pagination.totalPages ? undefined : primaryColor, 
                color: pagination.page === pagination.totalPages ? undefined : primaryColor 
              }}
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              onMouseEnter={(e) => {
                if (pagination.page < pagination.totalPages) {
                  e.currentTarget.style.backgroundColor = `${primaryColor}15`
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = ''
              }}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
