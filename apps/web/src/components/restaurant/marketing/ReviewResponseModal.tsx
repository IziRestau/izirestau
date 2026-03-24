'use client'

import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api-client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Loader2, MessageSquare, Star, User } from 'lucide-react'
import type { Review } from '@/types/marketing'

interface ReviewResponseModalProps {
  isOpen: boolean
  onClose: () => void
  review: Review | null
  onSuccess: () => void
  primaryColor?: string
}

export function ReviewResponseModal({
  isOpen,
  onClose,
  review,
  onSuccess,
  primaryColor = '#10b981',
}: ReviewResponseModalProps) {
  const [response, setResponse] = useState('')
  const [isPublished, setIsPublished] = useState(true)

  useEffect(() => {
    if (review) {
      setResponse(review.response || '')
      setIsPublished(review.isPublished)
    } else {
      setResponse('')
      setIsPublished(true)
    }
  }, [review, isOpen])

  const updateMutation = useMutation({
    mutationFn: () => api.restaurant.marketing.reviews.update(review!.id, {
      response: response.trim() || null,
      isPublished,
    }),
    onSuccess: () => {
      toast.success('Avis mis à jour')
      onSuccess()
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate()
  }

  if (!review) return null

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
          />
        ))}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare size={20} style={{ color: primaryColor }} />
            Répondre à l'avis
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Review Info */}
          <div className="p-4 bg-gray-50 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User size={16} className="text-gray-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {review.customer.firstName} {review.customer.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{review.customer.email}</p>
                </div>
              </div>
              {renderStars(review.rating)}
            </div>

            {review.title && (
              <p className="font-medium text-gray-900">{review.title}</p>
            )}

            {review.comment && (
              <p className="text-sm text-gray-600">{review.comment}</p>
            )}

            <p className="text-xs text-gray-400">
              {new Date(review.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          {/* Response Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="response">Votre réponse</Label>
              <Textarea
                id="response"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Rédigez votre réponse au client..."
                rows={4}
                className="rounded-xl resize-none border-gray-200 focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
              />
              <p className="text-xs text-gray-500">
                Votre réponse sera visible publiquement sur votre site
              </p>
            </div>

            {/* Publish Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-900">Publier l'avis</p>
                <p className="text-sm text-gray-500">L'avis sera visible sur votre site</p>
              </div>
              <Switch
                checked={isPublished}
                onCheckedChange={setIsPublished}
                style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
                className="data-[state=checked]:bg-[--switch-checked-bg]"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={updateMutation.isPending}
                className="h-11 rounded-xl"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                style={{ backgroundColor: primaryColor }}
                className="h-11 text-white rounded-xl"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
