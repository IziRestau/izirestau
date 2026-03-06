'use client'

import { useState } from 'react'
import { LogOut, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface LogoutModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 rounded-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <LogOut className="w-6 h-6 text-red-600" />
          </div>
          <DialogTitle className="text-center text-lg font-semibold text-gray-900">
            Confirmer la deconnexion
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-4">
          <p className="text-center text-sm text-gray-500">
            Etes-vous sur de vouloir vous deconnecter ? Vous devrez vous reconnecter pour acceder a votre compte.
          </p>
        </div>

        <div className="flex gap-3 p-6 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-11 rounded-xl"
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deconnexion...
              </>
            ) : (
              'Se deconnecter'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
