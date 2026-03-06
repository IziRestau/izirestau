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
  Star,
  Search,
  MoreHorizontal,
  MessageSquare,
  Eye,
  EyeOff,
  User,
  Calendar,
  TrendingUp,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Review } from '@/types/marketing'
import { ReviewResponseModal } from '@/components/restaurant/marketing/ReviewResponseModal'

export default function ReviewsPage() {
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()
  const { organization, restaurants, currentRestaurantId, switchRestaurant } = useRestaurantStore()
  const navigation = useRestaurantNavigation()

  const primaryColor = organization?.primaryColor || '#10b981'

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [page, setPage] = useState(1)

  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false)
  const [toggleTarget, setToggleTarget] = useState<Review | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, ratingFilter, currentRestaurantId])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['marketing-reviews', currentRestaurantId, debouncedSearch, statusFilter, ratingFilter, page],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.marketing.reviews.list({
        search: debouncedSearch || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        rating: ratingFilter !== 'all' ? parseInt(ratingFilter) : undefined,
        page,
        limit: 20,
      })
      return res
    },
    enabled: !!accessToken && !!currentRestaurantId,
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      api.restaurant.marketing.reviews.update(id, { isPublished }),
    onSuccess: (_, variables) => {
      toast.success(variables.isPublished ? 'Avis publié' : 'Avis masqué')
      queryClient.invalidateQueries({ queryKey: ['marketing-reviews'] })
      queryClient.invalidateQueries({ queryKey: ['marketing-stats'] })
      setToggleTarget(null)
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
    },
  })

  const handleRespond = (review: Review) => {
    setSelectedReview(review)
    setIsResponseModalOpen(true)
  }

  const handleResponseSuccess = () => {
    setIsResponseModalOpen(false)
    setSelectedReview(null)
    queryClient.invalidateQueries({ queryKey: ['marketing-reviews'] })
  }

  const reviews: Review[] = (data?.data || []) as Review[]
  const stats = (data as any)?.stats
  const pagination = (data as any)?.pagination

  const renderStars = (rating: number, size: number = 14) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
          />
        ))}
      </div>
    )
  }

  if (isLoading && !data) {
    return (
      <PageSkeleton
        navigation={navigation}
        basePath="/restaurant"
        title="Avis clients"
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
        title="Avis clients"
        subtitle="Gérez et répondez aux avis de vos clients"
        icon={Star}
      />

      {/* Stats - Single Row */}
      {stats && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            {/* Average Rating */}
            <div className="flex items-center gap-4 sm:pr-6 sm:border-r border-gray-100">
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <Star size={24} style={{ color: primaryColor }} className="fill-current" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.avgRating ? stats.avgRating.toFixed(1) : '-'}
                </p>
                <p className="text-sm text-gray-500">Note moyenne</p>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="flex-1 flex items-center gap-3 sm:gap-4 overflow-x-auto pb-1">
              {[...stats.distribution].reverse().map((item: { rating: number; count: number }) => (
                <div key={item.rating} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl flex-shrink-0">
                  <div className="flex items-center gap-0.5">
                    {renderStars(item.rating, 12)}
                  </div>
                  <span className="font-semibold text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center gap-3 sm:pl-6 sm:border-l border-gray-100">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100">
                <MessageSquare size={20} className="text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
                <p className="text-sm text-gray-500">Total avis</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Rechercher un avis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger 
              className="w-full sm:w-36 h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            >
              <SelectValue placeholder="Note" />
            </SelectTrigger>
            <SelectContent accentColor={primaryColor}>
              <SelectItem value="all">Toutes les notes</SelectItem>
              <SelectItem value="5">5 étoiles</SelectItem>
              <SelectItem value="4">4 étoiles</SelectItem>
              <SelectItem value="3">3 étoiles</SelectItem>
              <SelectItem value="2">2 étoiles</SelectItem>
              <SelectItem value="1">1 étoile</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger 
              className="w-full sm:w-40 h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            >
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent accentColor={primaryColor}>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="published">Publiés</SelectItem>
              <SelectItem value="hidden">Masqués</SelectItem>
              <SelectItem value="pending">Sans réponse</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4 relative">
        {/* Loading overlay - only shows during refetch, keeps content visible */}
        {isFetching && !isLoading && reviews.length > 0 && (
          <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center rounded-2xl">
            <Loader2 size={24} className="animate-spin" style={{ color: primaryColor }} />
          </div>
        )}
        {reviews.length === 0 && !isFetching ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <Star size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Aucun avis trouvé</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Customer Info */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <User size={18} className="text-gray-500" />
                  </div>
                  <div className="sm:hidden">
                    <p className="font-medium text-gray-900">
                      {review.customer.firstName} {review.customer.lastName}
                    </p>
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="hidden sm:flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-gray-900">
                        {review.customer.firstName} {review.customer.lastName}
                      </p>
                      {renderStars(review.rating)}
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                        review.isPublished
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      )}>
                        {review.isPublished ? 'Publié' : 'Masqué'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar size={12} />
                      {new Date(review.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>

                  {review.title && (
                    <p className="font-medium text-gray-900 mb-1">{review.title}</p>
                  )}

                  {review.comment && (
                    <p className="text-gray-600 text-sm mb-3">{review.comment}</p>
                  )}

                  {/* Sub-ratings */}
                  {(review.foodRating || review.serviceRating || review.deliveryRating) && (
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-3">
                      {review.foodRating && (
                        <span>Cuisine: {review.foodRating}/5</span>
                      )}
                      {review.serviceRating && (
                        <span>Service: {review.serviceRating}/5</span>
                      )}
                      {review.deliveryRating && (
                        <span>Livraison: {review.deliveryRating}/5</span>
                      )}
                    </div>
                  )}

                  {/* Response */}
                  {review.response && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs font-medium text-gray-500 mb-1">Votre réponse</p>
                      <p className="text-sm text-gray-700">{review.response}</p>
                      {review.respondedAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(review.respondedAt).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Mobile date & status */}
                  <div className="flex sm:hidden items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                      review.isPublished
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-600"
                    )}>
                      {review.isPublished ? 'Publié' : 'Masqué'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0">
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
                        onClick={() => handleRespond(review)}
                        className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                      >
                        <MessageSquare size={16} className="mr-3 text-gray-400" />
                        <span className="text-[13px] text-gray-700">
                          {review.response ? 'Modifier la réponse' : 'Répondre'}
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-1" />
                      <DropdownMenuItem
                        onClick={() => setToggleTarget(review)}
                        className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                      >
                        {review.isPublished ? (
                          <>
                            <EyeOff size={16} className="mr-3 text-gray-400" />
                            <span className="text-[13px] text-gray-700">Masquer</span>
                          </>
                        ) : (
                          <>
                            <Eye size={16} className="mr-3 text-gray-400" />
                            <span className="text-[13px] text-gray-700">Publier</span>
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6 bg-white rounded-2xl border border-gray-100 px-4 py-3">
          <p className="text-sm text-gray-500">
            Page {pagination.page} sur {pagination.pages} ({pagination.total} avis)
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

      {/* Response Modal */}
      <ReviewResponseModal
        isOpen={isResponseModalOpen}
        onClose={() => {
          setIsResponseModalOpen(false)
          setSelectedReview(null)
        }}
        review={selectedReview}
        onSuccess={handleResponseSuccess}
        primaryColor={primaryColor}
      />

      {/* Toggle Confirmation */}
      <ConfirmModal
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={() => toggleTarget && toggleMutation.mutate({ id: toggleTarget.id, isPublished: !toggleTarget.isPublished })}
        title={toggleTarget?.isPublished ? 'Masquer l\'avis' : 'Publier l\'avis'}
        message={
          toggleTarget?.isPublished
            ? 'Cet avis ne sera plus visible sur votre site.'
            : 'Cet avis sera visible sur votre site.'
        }
        confirmText={toggleTarget?.isPublished ? 'Masquer' : 'Publier'}
        cancelText="Annuler"
        variant={toggleTarget?.isPublished ? 'warning' : 'info'}
        isLoading={toggleMutation.isPending}
      />
    </DashboardLayout>
  )
}
