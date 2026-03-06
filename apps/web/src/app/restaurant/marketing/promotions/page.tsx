'use client'

import { useState, useEffect } from 'react'
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
  Percent,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Calendar,
  Clock,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Promotion, DiscountType, PromotionType } from '@/types/marketing'
import { DISCOUNT_TYPE_LABELS, PROMOTION_TYPE_LABELS, PROMOTION_TYPE_COLORS, DAY_SHORT_LABELS } from '@/types/marketing'
import { PromotionFormModal } from '@/components/restaurant/marketing/PromotionFormModal'

export default function PromotionsPage() {
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()
  const { organization, restaurants, currentRestaurantId, switchRestaurant } = useRestaurantStore()
  const navigation = useRestaurantNavigation()
  const { format: formatCurrency } = useRestaurantCurrency()

  const primaryColor = organization?.primaryColor || '#10b981'

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [page, setPage] = useState(1)

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null)
  const [toggleTarget, setToggleTarget] = useState<Promotion | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, typeFilter, currentRestaurantId])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['marketing-promotions', currentRestaurantId, debouncedSearch, statusFilter, typeFilter, page],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.marketing.promotions.list({
        search: debouncedSearch || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
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
    mutationFn: (id: string) => api.restaurant.marketing.promotions.delete(id),
    onSuccess: () => {
      toast.success('Promotion supprimée')
      queryClient.invalidateQueries({ queryKey: ['marketing-promotions'] })
      queryClient.invalidateQueries({ queryKey: ['marketing-stats'] })
      setDeleteTarget(null)
    },
    onError: () => {
      toast.error('Erreur lors de la suppression')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.restaurant.marketing.promotions.update(id, { isActive }),
    onSuccess: (_, variables) => {
      toast.success(variables.isActive ? 'Promotion activée' : 'Promotion désactivée')
      queryClient.invalidateQueries({ queryKey: ['marketing-promotions'] })
      queryClient.invalidateQueries({ queryKey: ['marketing-stats'] })
      setToggleTarget(null)
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
    },
  })

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion)
    setIsFormModalOpen(true)
  }

  const handleCreate = () => {
    setEditingPromotion(null)
    setIsFormModalOpen(true)
  }

  const handleDuplicate = (promotion: Promotion) => {
    setEditingPromotion({
      ...promotion,
      id: '',
      name: `${promotion.name} (copie)`,
    })
    setIsFormModalOpen(true)
  }

  const handleFormSuccess = () => {
    setIsFormModalOpen(false)
    setEditingPromotion(null)
    queryClient.invalidateQueries({ queryKey: ['marketing-promotions'] })
    queryClient.invalidateQueries({ queryKey: ['marketing-stats'] })
  }

  const promotions: Promotion[] = (data?.data || []) as Promotion[]
  const pagination = (data as any)?.pagination

  const formatDiscount = (promotion: Promotion) => {
    if (promotion.discountType === 'PERCENTAGE') {
      return `${promotion.discountValue}%`
    } else if (promotion.discountType === 'FIXED') {
      return formatCurrency(promotion.discountValue)
    }
    return 'Produit offert'
  }

  const isExpired = (promotion: Promotion) => {
    if (!promotion.endDate) return false
    return new Date(promotion.endDate) < new Date()
  }

  const formatActiveDays = (days: number[]) => {
    if (days.length === 7) return 'Tous les jours'
    if (days.length === 0) return 'Aucun jour'
    return days.map(d => DAY_SHORT_LABELS[d]).join(', ')
  }

  if (isLoading && !data) {
    return (
      <PageSkeleton
        navigation={navigation}
        basePath="/restaurant"
        title="Promotions"
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
        title="Promotions"
        subtitle="Gérez vos offres spéciales et happy hours"
        icon={Percent}
        actions={
          <Button
            onClick={handleCreate}
            style={{ backgroundColor: primaryColor }}
            className="text-white"
          >
            <Plus size={16} className="mr-2" />
            Créer une promotion
          </Button>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Rechercher une promotion..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger 
              className="w-full sm:w-44 h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            >
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent accentColor={primaryColor}>
              <SelectItem value="all">Tous les types</SelectItem>
              {Object.entries(PROMOTION_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger 
              className="w-full sm:w-36 h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            >
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent accentColor={primaryColor}>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="active">Actives</SelectItem>
              <SelectItem value="inactive">Inactives</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden relative">
        {/* Loading overlay - only shows during refetch, keeps content visible */}
        {isFetching && !isLoading && promotions.length > 0 && (
          <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin" style={{ color: primaryColor }} />
          </div>
        )}
        {promotions.length === 0 && !isFetching ? (
          <div className="p-8 text-center">
            <Percent size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">Aucune promotion trouvée</p>
            <Button
              onClick={handleCreate}
              className="rounded-xl text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus size={16} className="mr-2" />
              Créer votre première promotion
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Promotion</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Type</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Réduction</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Période</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Jours</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Statut</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {promotions.map((promotion) => {
                    const expired = isExpired(promotion)
                    const typeColors = PROMOTION_TYPE_COLORS[promotion.type as PromotionType]
                    return (
                      <tr key={promotion.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div>
                            <p className="font-medium text-gray-900">{promotion.name}</p>
                            {promotion.description && (
                              <p className="text-xs text-gray-500 truncate max-w-[200px]">{promotion.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={cn(
                            "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                            typeColors?.bg || 'bg-gray-100',
                            typeColors?.text || 'text-gray-700'
                          )}>
                            {PROMOTION_TYPE_LABELS[promotion.type as PromotionType]}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{formatDiscount(promotion)}</span>
                          </div>
                          {promotion.minOrderAmount && (
                            <p className="text-xs text-gray-500">
                              Min. {formatCurrency(promotion.minOrderAmount)}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar size={14} />
                            <span>
                              {new Date(promotion.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                              {promotion.endDate && (
                                <> - {new Date(promotion.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</>
                              )}
                            </span>
                          </div>
                          {promotion.activeFrom && promotion.activeTo && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <Clock size={12} />
                              <span>{promotion.activeFrom} - {promotion.activeTo}</span>
                            </div>
                          )}
                          {expired && (
                            <span className="text-xs text-red-500">Expirée</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-sm text-gray-600">{formatActiveDays(promotion.activeDays)}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                            promotion.isActive && !expired
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-600"
                          )}>
                            {promotion.isActive && !expired ? (
                              <>
                                <Eye size={12} />
                                Active
                              </>
                            ) : (
                              <>
                                <EyeOff size={12} />
                                Inactive
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
                                onClick={() => handleEdit(promotion)}
                                className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                              >
                                <Pencil size={16} className="mr-3 text-gray-400" />
                                <span className="text-[13px] text-gray-700">Modifier</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDuplicate(promotion)}
                                className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                              >
                                <Copy size={16} className="mr-3 text-gray-400" />
                                <span className="text-[13px] text-gray-700">Dupliquer</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1" />
                              <DropdownMenuItem
                                onClick={() => setToggleTarget(promotion)}
                                className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                              >
                                {promotion.isActive ? (
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
                                onClick={() => setDeleteTarget(promotion)}
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
              {promotions.map((promotion) => {
                const expired = isExpired(promotion)
                const typeColors = PROMOTION_TYPE_COLORS[promotion.type as PromotionType]
                return (
                  <div key={promotion.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${primaryColor}15` }}
                      >
                        <Percent size={18} style={{ color: primaryColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{promotion.name}</p>
                            <span className={cn(
                              "inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0",
                              promotion.isActive && !expired
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-gray-100 text-gray-600"
                            )}>
                              {promotion.isActive && !expired ? 'Active' : 'Inactive'}
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
                                onClick={() => handleEdit(promotion)}
                                className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                              >
                                <Pencil size={16} className="mr-3 text-gray-400" />
                                <span className="text-[13px] text-gray-700">Modifier</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDuplicate(promotion)}
                                className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                              >
                                <Copy size={16} className="mr-3 text-gray-400" />
                                <span className="text-[13px] text-gray-700">Dupliquer</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1" />
                              <DropdownMenuItem
                                onClick={() => setToggleTarget(promotion)}
                                className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                              >
                                {promotion.isActive ? (
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
                                onClick={() => setDeleteTarget(promotion)}
                                className="rounded-lg px-3 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                              >
                                <Trash2 size={16} className="mr-3" />
                                <span className="text-[13px]">Supprimer</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className={cn(
                            "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium",
                            typeColors?.bg || 'bg-gray-100',
                            typeColors?.text || 'text-gray-700'
                          )}>
                            {PROMOTION_TYPE_LABELS[promotion.type as PromotionType]}
                          </span>
                          <span className="font-medium text-xs" style={{ color: primaryColor }}>{formatDiscount(promotion)}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            {new Date(promotion.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                            {promotion.endDate && ` - ${new Date(promotion.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}`}
                          </span>
                          <span>{formatActiveDays(promotion.activeDays)}</span>
                          {expired && <span className="text-red-500">Expirée</span>}
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
                  Page {pagination.page} sur {pagination.pages} ({pagination.total} promotions)
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
      <PromotionFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setEditingPromotion(null)
        }}
        promotion={editingPromotion}
        onSuccess={handleFormSuccess}
        primaryColor={primaryColor}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Supprimer la promotion"
        message={`Êtes-vous sûr de vouloir supprimer la promotion "${deleteTarget?.name}" ? Cette action est irréversible.`}
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
        title={toggleTarget?.isActive ? 'Désactiver la promotion' : 'Activer la promotion'}
        message={
          toggleTarget?.isActive
            ? `La promotion "${toggleTarget?.name}" ne sera plus appliquée.`
            : `La promotion "${toggleTarget?.name}" sera de nouveau appliquée.`
        }
        confirmText={toggleTarget?.isActive ? 'Désactiver' : 'Activer'}
        cancelText="Annuler"
        variant={toggleTarget?.isActive ? 'warning' : 'info'}
        isLoading={toggleMutation.isPending}
      />
    </DashboardLayout>
  )
}
