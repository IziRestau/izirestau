'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface EditBrandingModalProps {
  isOpen: boolean
  onClose: () => void
  resellerId: string
  resellerName: string
  currentColor: string
}

const defaultColors = [
  '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'
]

export function EditBrandingModal({ isOpen, onClose, resellerId, resellerName, currentColor }: EditBrandingModalProps) {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const [primaryColor, setPrimaryColor] = useState(currentColor || '#10b981')

  useEffect(() => {
    if (isOpen) {
      setPrimaryColor(currentColor || '#10b981')
    }
  }, [isOpen, currentColor])

  const updateMutation = useMutation({
    mutationFn: async (data: { primaryColor: string }) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return apiClient.patch(`/platform/resellers/${resellerId}`, data)
    },
    onSuccess: () => {
      toast.success('Branding mis a jour')
      queryClient.invalidateQueries({ queryKey: ['platform-reseller', resellerId] })
      onClose()
    },
    onError: () => toast.error('Erreur lors de la mise a jour'),
  })

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier le branding</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Couleur primaire</Label>
            <div className="flex items-center gap-3">
              <Input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 font-mono"
                placeholder="#000000"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {defaultColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setPrimaryColor(color)}
                  className="w-8 h-8 rounded-lg border-2 transition-all"
                  style={{ 
                    backgroundColor: color,
                    borderColor: primaryColor === color ? '#1f2937' : 'transparent'
                  }}
                />
              ))}
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-2">Apercu</p>
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg"
                style={{ backgroundColor: primaryColor }}
              />
              <div>
                <p className="font-medium" style={{ color: primaryColor }}>{resellerName}</p>
                <p className="text-xs text-gray-500">Couleur appliquee aux boutons et accents</p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={updateMutation.isPending}>
            Annuler
          </Button>
          <Button 
            onClick={() => updateMutation.mutate({ primaryColor })}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Enregistrer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
