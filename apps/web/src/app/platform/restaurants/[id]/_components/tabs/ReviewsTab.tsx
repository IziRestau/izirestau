'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Star,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { RestaurantDetails, Review } from '../types'

interface ReviewsTabProps {
  restaurant: RestaurantDetails
}

interface ReviewsData {
  reviews: Review[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
  stats: {
    avgRating: number
    total: number
    distribution: Record<number, number>
  }
}

export function ReviewsTab({ restaurant }: ReviewsTabProps) {
  const { accessToken } = useAuthStore()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['platform-restaurant-reviews', restaurant.id, page],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', '10')
      const res = await apiClient.get(`/platform/restaurants/${restaurant.id}/reviews?${params.toString()}`)
      return res.data as ReviewsData
    },
    enabled: !!accessToken,
  })

  const distribution = data?.stats.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  const totalReviews = data?.stats.total || 0
  const avgRating = data?.stats.avgRating || 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="text-center">
            <p className="text-5xl font-bold text-gray-900 mb-2">
              {avgRating ? avgRating.toFixed(1) : '-'}
            </p>
            <div className="flex items-center justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={24}
                  className={star <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
                />
              ))}
            </div>
            <p className="text-sm text-gray-500">{totalReviews} avis</p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-medium text-gray-900 mb-4">Distribution des notes</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = distribution[rating] || 0
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm font-medium text-gray-700">{rating}</span>
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                  </div>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-12 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-medium text-gray-900">Tous les avis</h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : !data?.reviews || data.reviews.length === 0 ? (
          <div className="p-8 text-center">
            <Star size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Aucun avis pour le moment</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-50">
              {data.reviews.map((review) => (
                <div key={review.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-emerald-700">
                          {review.customer.firstName[0]}{review.customer.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {review.customer.firstName} {review.customer.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(review.createdAt), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          className={star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
                        />
                      ))}
                    </div>
                  </div>

                  {review.title && (
                    <h4 className="font-medium text-gray-900 mb-1">{review.title}</h4>
                  )}

                  {review.comment && (
                    <p className="text-sm text-gray-600 mb-3">{review.comment}</p>
                  )}

                  {review.response && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border-l-4 border-emerald-500">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare size={14} className="text-emerald-600" />
                        <span className="text-xs font-medium text-emerald-700">Reponse du restaurant</span>
                        {review.respondedAt && (
                          <span className="text-xs text-gray-400">
                            {format(new Date(review.respondedAt), 'dd/MM/yyyy')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{review.response}</p>
                    </div>
                  )}

                  <div className="mt-2 flex items-center gap-2">
                    <span className={cn(
                      'px-2 py-0.5 rounded text-xs font-medium',
                      review.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    )}>
                      {review.isPublished ? 'Publie' : 'Non publie'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {data.pagination && data.pagination.pages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {data.pagination.page} sur {data.pagination.pages} ({data.pagination.total} avis)
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
