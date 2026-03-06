'use client'

import { AlertTriangle, Loader2, Trash2, Pause, Play, Mail, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info' | 'success'
  isLoading?: boolean
  icon?: 'trash' | 'pause' | 'play' | 'mail' | 'alert' | 'check'
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'danger',
  isLoading = false,
  icon = 'alert',
}: ConfirmModalProps) {
  const variantStyles = {
    danger: {
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      buttonBg: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      buttonBg: 'bg-amber-600 hover:bg-amber-700',
    },
    info: {
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      buttonBg: 'bg-blue-600 hover:bg-blue-700',
    },
    success: {
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      buttonBg: 'bg-green-600 hover:bg-green-700',
    },
  }

  const styles = variantStyles[variant]

  const IconComponent = {
    trash: Trash2,
    pause: Pause,
    play: Play,
    mail: Mail,
    alert: AlertTriangle,
    check: Check,
  }[icon]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 rounded-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <div className={`w-12 h-12 ${styles.iconBg} rounded-xl flex items-center justify-center mx-auto mb-4`}>
            <IconComponent className={`w-6 h-6 ${styles.iconColor}`} />
          </div>
          <DialogTitle className="text-center text-lg font-semibold text-gray-900">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-4">
          <p className="text-center text-sm text-gray-500">
            {message}
          </p>
        </div>

        <div className="flex gap-3 p-6 pt-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-11 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 h-11 rounded-xl ${styles.buttonBg} text-white`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Chargement...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
