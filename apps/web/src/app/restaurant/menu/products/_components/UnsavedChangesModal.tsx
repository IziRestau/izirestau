'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface UnsavedChangesModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function UnsavedChangesModal({
  isOpen,
  onClose,
  onConfirm,
}: UnsavedChangesModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertTriangle size={20} className="text-amber-600" />
            </div>
            <div>
              <DialogTitle>Modifications non enregistrees</DialogTitle>
              <DialogDescription>
                Vous avez des modifications non enregistrees
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-600">
            Si vous quittez cette page, vos modifications seront perdues. 
            Voulez-vous vraiment quitter sans enregistrer ?
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1 h-10 rounded-xl hover:bg-gray-100"
          >
            Continuer l'edition
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="flex-1 h-10 rounded-xl"
          >
            Quitter sans enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
