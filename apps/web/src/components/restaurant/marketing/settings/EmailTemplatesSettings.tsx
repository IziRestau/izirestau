'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { api, apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Mail,
  Edit,
  RotateCcw,
  Check,
  Loader2,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'

interface EmailTemplatesSettingsProps {
  primaryColor: string
}

type EmailTemplateType = 
  | 'ORDER_CONFIRMATION'
  | 'ORDER_READY'
  | 'ORDER_DELIVERED'
  | 'LOYALTY_POINTS_EARNED'
  | 'LOYALTY_POINTS_REDEEMED'
  | 'WELCOME'
  | 'BIRTHDAY'
  | 'RECEIPT'

const templateTypeLabels: Record<EmailTemplateType, { label: string; description: string }> = {
  ORDER_CONFIRMATION: { label: 'Confirmation de commande', description: 'Envoyé quand une commande est passée' },
  ORDER_READY: { label: 'Commande prête', description: 'Envoyé quand la commande est prête' },
  ORDER_DELIVERED: { label: 'Commande livrée', description: 'Envoyé après la livraison' },
  LOYALTY_POINTS_EARNED: { label: 'Points gagnés', description: 'Envoyé quand le client gagne des points' },
  LOYALTY_POINTS_REDEEMED: { label: 'Points utilisés', description: 'Envoyé quand le client utilise ses points' },
  WELCOME: { label: 'Bienvenue', description: 'Envoyé à l\'inscription d\'un nouveau client' },
  BIRTHDAY: { label: 'Anniversaire', description: 'Envoyé le jour de l\'anniversaire' },
  RECEIPT: { label: 'Reçu/Facture', description: 'Envoyé avec le reçu de commande' },
}

const availableVariables: Record<EmailTemplateType, string[]> = {
  ORDER_CONFIRMATION: ['{{firstName}}', '{{lastName}}', '{{orderNumber}}', '{{total}}', '{{restaurantName}}'],
  ORDER_READY: ['{{firstName}}', '{{orderNumber}}', '{{restaurantName}}'],
  ORDER_DELIVERED: ['{{firstName}}', '{{orderNumber}}', '{{restaurantName}}'],
  LOYALTY_POINTS_EARNED: ['{{firstName}}', '{{pointsEarned}}', '{{totalPoints}}', '{{orderNumber}}', '{{restaurantName}}'],
  LOYALTY_POINTS_REDEEMED: ['{{firstName}}', '{{pointsUsed}}', '{{discount}}', '{{remainingPoints}}', '{{restaurantName}}'],
  WELCOME: ['{{firstName}}', '{{restaurantName}}'],
  BIRTHDAY: ['{{firstName}}', '{{restaurantName}}', '{{bonusPoints}}'],
  RECEIPT: ['{{firstName}}', '{{orderNumber}}', '{{total}}', '{{restaurantName}}'],
}

export function EmailTemplatesSettings({ primaryColor }: EmailTemplatesSettingsProps) {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  
  const [editingType, setEditingType] = useState<EmailTemplateType | null>(null)
  const [editSubject, setEditSubject] = useState('')
  const [editContent, setEditContent] = useState('')

  const { data: templates, isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.marketing.emailTemplates.list()
      return res.data
    },
    enabled: !!accessToken,
  })

  const updateMutation = useMutation({
    mutationFn: async ({ type, subject, content }: { type: string; subject: string; content: string }) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.marketing.emailTemplates.update(type, { subject, content })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
      toast.success('Template enregistré')
      setEditingType(null)
    },
    onError: () => {
      toast.error('Erreur lors de l\'enregistrement')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (type: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.marketing.emailTemplates.delete(type)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
      toast.success('Template réinitialisé')
    },
    onError: () => {
      toast.error('Erreur lors de la réinitialisation')
    },
  })

  const handleEdit = (type: EmailTemplateType, template: { subject: string; content: string } | null) => {
    setEditingType(type)
    setEditSubject(template?.subject || '')
    setEditContent(template?.content || '')
  }

  const handleSave = () => {
    if (!editingType) return
    updateMutation.mutate({
      type: editingType,
      subject: editSubject,
      content: editContent,
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Templates email</h3>
        <p className="text-sm text-gray-500">
          Personnalisez les emails envoyés à vos clients.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-1">Branding personnalisé</p>
          <p>
            Tous les emails envoyés à vos clients afficheront uniquement le nom et le logo de votre restaurant.
            Si vous êtes affilié à un revendeur, son organisation sera mentionnée comme partenaire.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {templates?.map((item) => {
          const typeInfo = templateTypeLabels[item.type as EmailTemplateType]
          if (!typeInfo) return null

          return (
            <div
              key={item.type}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <Mail className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{typeInfo.label}</span>
                    {item.hasCustomTemplate && (
                      <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                        <Check className="w-3 h-3 mr-1" />
                        Personnalisé
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{typeInfo.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.hasCustomTemplate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(item.type)}
                    disabled={deleteMutation.isPending}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(item.type as EmailTemplateType, item.template)}
                  className="rounded-lg"
                >
                  <Edit size={16} className="mr-2" />
                  {item.hasCustomTemplate ? 'Modifier' : 'Personnaliser'}
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal d'édition */}
      <Dialog open={!!editingType} onOpenChange={(o) => !o && setEditingType(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingType && templateTypeLabels[editingType]?.label}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Sujet de l'email</Label>
              <Input
                id="subject"
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                placeholder="Ex: Votre commande est confirmée !"
                className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Contenu de l'email</Label>
              <Textarea
                id="content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Rédigez le contenu de votre email..."
                rows={10}
                className="rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            </div>

            {editingType && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-500 mb-2">Variables disponibles :</p>
                <div className="flex flex-wrap gap-2">
                  {availableVariables[editingType]?.map((v) => (
                    <code
                      key={v}
                      className="text-xs bg-white px-2 py-1 rounded border cursor-pointer hover:bg-gray-100"
                      onClick={() => setEditContent((prev) => prev + ' ' + v)}
                    >
                      {v}
                    </code>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setEditingType(null)}
                className="h-10 px-4 rounded-xl"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending || !editSubject || !editContent}
                className="h-10 px-4 rounded-xl text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {updateMutation.isPending && <Loader2 size={18} className="mr-2 animate-spin" />}
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
