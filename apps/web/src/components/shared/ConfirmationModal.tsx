'use client'

import { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Info, CheckCircle, XCircle, Loader2 } from 'lucide-react'

type ModalVariant = 'warning' | 'danger' | 'info' | 'success'

interface ConfirmationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel?: () => void
  variant?: ModalVariant
  isLoading?: boolean
  primaryColor?: string
}

const variantConfig: Record<ModalVariant, { icon: typeof AlertTriangle; iconColor: string; buttonColor: string }> = {
  warning: { icon: AlertTriangle, iconColor: 'text-amber-500', buttonColor: 'bg-amber-500 hover:bg-amber-600' },
  danger: { icon: XCircle, iconColor: 'text-red-500', buttonColor: 'bg-red-500 hover:bg-red-600' },
  info: { icon: Info, iconColor: 'text-blue-500', buttonColor: 'bg-blue-500 hover:bg-blue-600' },
  success: { icon: CheckCircle, iconColor: 'text-green-500', buttonColor: 'bg-green-500 hover:bg-green-600' },
}

export function ConfirmationModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
  variant = 'warning',
  isLoading = false,
  primaryColor,
}: ConfirmationModalProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  const handleConfirm = () => {
    onConfirm()
  }

  const buttonStyle = primaryColor && variant === 'info' 
    ? { backgroundColor: primaryColor } 
    : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              variant === 'warning' ? 'bg-amber-50' :
              variant === 'danger' ? 'bg-red-50' :
              variant === 'info' ? 'bg-blue-50' : 'bg-green-50'
            }`}>
              <Icon size={20} className={config.iconColor} />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {title}
            </DialogTitle>
          </div>
          {description && (
            <DialogDescription className="text-sm text-gray-500 mt-2 ml-[52px]">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {children && (
          <div className="ml-[52px] mt-2">
            {children}
          </div>
        )}

        <DialogFooter className="mt-6 gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="rounded-xl"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`rounded-xl text-white ${!buttonStyle ? config.buttonColor : ''}`}
            style={buttonStyle}
          >
            {isLoading && <Loader2 size={16} className="mr-2 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
