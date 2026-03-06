'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { useRestaurantNavigation } from '@/hooks/use-restaurant-navigation'
import { useRestaurantCurrency } from '@/hooks/use-restaurant-currency'
import { api, apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Ticket,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Calendar,
  Percent,
  Hash,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Coupon, DiscountType } from '@/types/marketing'
import { DISCOUNT_TYPE_LABELS } from '@/types/marketing'
import { CouponFormModal } from '@/components/restaurant/marketing/CouponFormModal'

export default function CouponsPage() {
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()
  const { organization, restaurants, currentRestaurantId, switchRestaurant } = useRestaurantStore()
  const navigation = useRestaurantNavigation()
  const { format: formatCurrency } = useRestaurantCurrency()

  const primaryColor = organization?.primaryColor || '#10b981'

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null)
  const [toggleTarget, setToggleTarget] = useState<Coupon | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, currentRestaurantId])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['marketing-coupons', currentRestaurantId, debouncedSearch, statusFilter, page],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.marketing.coupons.list({
        search: debouncedSearch || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        limit: 20,
      })
      return res
    },
    enabled: !!accessToken && !!currentRestaurantId,
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.restaurant.marketing.coupons.delete(id),
    onSuccess: () => {
      toast.success('Coupon supprimé')
      queryClient.invalidateQueries({ queryKey: ['marketing-coupons'] })
      queryClient.invalidateQueries({ queryKey: ['marketing-stats'] })
      setDeleteTarget(null)
    },
    onError: () => {
      toast.error('Erreur lors de la suppression')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.restaurant.marketing.coupons.update(id, { isActive }),
    onSuccess: (_, variables) => {
      toast.success(variables.isActive ? 'Coupon activé' : 'Coupon désactivé')
      queryClient.invalidateQueries({ queryKey: ['marketing-coupons'] })
      queryClient.invalidateQueries({ queryKey: ['marketing-stats'] })
      setToggleTarget(null)
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
    },
  })

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setIsFormModalOpen(true)
  }

  const handleCreate = () => {
    setEditingCoupon(null)
    setIsFormModalOpen(true)
  }

  const handleDuplicate = (coupon: Coupon) => {
    setEditingCoupon({
      ...coupon,
      id: '',
      code: `${coupon.code}_COPY`,
      usedCount: 0,
      ordersCount: 0,
    })
    setIsFormModalOpen(true)
  }

  const handleFormSuccess = () => {
    setIsFormModalOpen(false)
    setEditingCoupon(null)
    queryClient.invalidateQueries({ queryKey: ['marketing-coupons'] })
    queryClient.invalidateQueries({ queryKey: ['marketing-stats'] })
  }

  const coupons: Coupon[] = (data?.data || []) as Coupon[]
  const pagination = (data as any)?.pagination

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === 'PERCENTAGE') {
      return `${coupon.discountValue}%`
    } else if (coupon.discountType === 'FIXED') {
      return formatCurrency(coupon.discountValue)
    }
    return 'Produit offert'
  }

  const isExpired = (coupon: Coupon) => {
    if (!coupon.endDate) return false
    return new Date(coupon.endDate) < new Date()
  }

  if (isLoading && !data) {
    return (
      <PageSkeleton
        navigation={navigation}
        basePath="/restaurant"
        title="Coupons"
        variant="list"
      />
    )
  }

  return (
    <DashboardLayout
      navigation={navigation}
      basePath="/restaurant"
      logoText={organization?.name || 'Restaurant'}
      primaryColor={primaryColor}
      restaurants={restaurants}
      currentRestaurantId={currentRestaurantId}
      onSwitchRestaurant={(id) => accessToken && switchRestaurant(accessToken, id)}
    >
      <PageHeader
        title="Coupons"
        subtitle="Gérez vos codes promotionnels"
        icon={Ticket}
        actions={
          <Button
            onClick={handleCreate}
            style={{ backgroundColor: primaryColor }}
            className="text-white"
          >
            <Plus size={16} className="mr-2" />
            Créer un coupon
          </Button>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Rechercher un code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger 
              className="w-full sm:w-40 h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            >
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent accentColor={primaryColor}>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="inactive">Inactifs</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden relative">
        {/* Loading overlay - only shows during refetch, keeps content visible */}
        {isFetching && !isLoading && coupons.length > 0 && (
          <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin" style={{ color: primaryColor }} />
          </div>
        )}
        {coupons.length === 0 && !isFetching ? (
          <div className="p-8 text-center">
            <Ticket size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">Aucun coupon trouvé</p>
            <Button
              onClick={handleCreate}
              className="rounded-xl text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus size={16} className="mr-2" />
              Créer votre premier coupon
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Code</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Réduction</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Utilisations</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Validité</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Statut</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {coupons.map((coupon) => {
                    const expired = isExpired(coupon)
                    return (
                      <tr key={coupon.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${primaryColor}15` }}
                            >
                              <Hash size={18} style={{ color: primaryColor }} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-mono font-semibold text-gray-900">{coupon.code}</p>
                              {coupon.description && (
                                <p className="text-xs text-gray-500 truncate max-w-[200px]">{coupon.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{formatDiscount(coupon)}</span>
                            <span className="text-xs text-gray-500">
                              ({DISCOUNT_TYPE_LABELS[coupon.discountType as DiscountType]})
                            </span>
                          </div>
                          {coupon.minOrderAmount && (
                            <p className="text-xs text-gray-500">
                              Min. {formatCurrency(coupon.minOrderAmount)}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-gray-900">
                            {coupon.usedCount}
                            {coupon.maxUses && <span className="text-gray-500"> / {coupon.maxUses}</span>}
                          </p>
                          <p className="text-xs text-gray-500">{coupon.ordersCount} commandes</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar size={14} />
                            <span>
                              {new Date(coupon.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                              {coupon.endDate && (
                                <> - {new Date(coupon.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</>
                              )}
                            </span>
                          </div>
                          {expired && (
                            <span className="text-xs text-red-500">Expiré</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                            coupon.isActive && !expired
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-600"
                          )}>
                            {coupon.isActive && !expired ? (
                              <>
                                <Eye size={12} />
                                Actif
                              </>
                            ) : (
                              <>
                                <EyeOff size={12} />
                                Inactif
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
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
                                onClick={() => handleEdit(coupon)}
                                className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                              >
                                <Pencil size={16} className="mr-3 text-gray-400" />
                                <span className="text-[13px] text-gray-700">Modifier</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDuplicate(coupon)}
                                className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                              >
                                <Copy size={16} className="mr-3 text-gray-400" />
                                <span className="text-[13px] text-gray-700">Dupliquer</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1" />
                              <DropdownMenuItem
                                onClick={() => setToggleTarget(coupon)}
                                className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                              >
                                {coupon.isActive ? (
                                  <>
                                    <EyeOff size={16} className="mr-3 text-gray-400" />
                                    <span className="text-[13px] text-gray-700">Désactiver</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye size={16} className="mr-3 text-gray-400" />
                                    <span className="text-[13px] text-gray-700">Activer</span>
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1" />
                              <DropdownMenuItem
                                onClick={() => setDeleteTarget(coupon)}
                                className="rounded-lg px-3 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                              >
                                <Trash2 size={16} className="mr-3" />
                                <span className="text-[13px]">Supprimer</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Cards */}
            <div className="lg:hidden divide-y divide-gray-50">
              {coupons.map((coupon) => {
                const expired = isExpired(coupon)
                return (
                  <div key={coupon.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${primaryColor}15` }}
                      >
                        <Hash size={18} style={{ color: primaryColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="font-mono font-semibold text-gray-900 truncate">{coupon.code}</p>
                            <span className={cn(
                              "inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0",
                              coupon.isActive && !expired
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-gray-100 text-gray-600"
                            )}>
                              {coupon.isActive && !expired ? 'Actif' : 'Inactif'}
                            </span>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg transition-colors flex-shrink-0"
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
                                onClick={() => handleEdit(coupon)}
                                className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                              >
                                <Pencil size={16} className="mr-3 text-gray-400" />
                                <span className="text-[13px] text-gray-700">Modifier</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDuplicate(coupon)}
                                className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                              >
                                <Copy size={16} className="mr-3 text-gray-400" />
                                <span className="text-[13px] text-gray-700">Dupliquer</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1" />
                              <DropdownMenuItem
                                onClick={() => setToggleTarget(coupon)}
                                className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                              >
                                {coupon.isActive ? (
                                  <>
                                    <EyeOff size={16} className="mr-3 text-gray-400" />
                                    <span className="text-[13px] text-gray-700">Désactiver</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye size={16} className="mr-3 text-gray-400" />
                                    <span className="text-[13px] text-gray-700">Activer</span>
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1" />
                              <DropdownMenuItem
                                onClick={() => setDeleteTarget(coupon)}
                                className="rounded-lg px-3 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                              >
                                <Trash2 size={16} className="mr-3" />
                                <span className="text-[13px]">Supprimer</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500">
                          <span className="font-medium" style={{ color: primaryColor }}>{formatDiscount(coupon)}</span>
                          <span>{coupon.usedCount}{coupon.maxUses ? `/${coupon.maxUses}` : ''} utilisations</span>
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            {new Date(coupon.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                            {coupon.endDate && ` - ${new Date(coupon.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}`}
                          </span>
                          {expired && <span className="text-red-500">Expiré</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Page {pagination.page} sur {pagination.pages} ({pagination.total} coupons)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg"
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                    disabled={page === pagination.pages}
                    className="rounded-lg"
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Form Modal */}
      <CouponFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setEditingCoupon(null)
        }}
        coupon={editingCoupon}
        onSuccess={handleFormSuccess}
        primaryColor={primaryColor}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Supprimer le coupon"
        message={`Êtes-vous sûr de vouloir supprimer le coupon "${deleteTarget?.code}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* Toggle Confirmation */}
      <ConfirmModal
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={() => toggleTarget && toggleMutation.mutate({ id: toggleTarget.id, isActive: !toggleTarget.isActive })}
        title={toggleTarget?.isActive ? 'Désactiver le coupon' : 'Activer le coupon'}
        message={
          toggleTarget?.isActive
            ? `Le coupon "${toggleTarget?.code}" ne sera plus utilisable par les clients.`
            : `Le coupon "${toggleTarget?.code}" sera de nouveau utilisable par les clients.`
        }
        confirmText={toggleTarget?.isActive ? 'Désactiver' : 'Activer'}
        cancelText="Annuler"
        variant={toggleTarget?.isActive ? 'warning' : 'info'}
        isLoading={toggleMutation.isPending}
      />
    </DashboardLayout>
  )
}
