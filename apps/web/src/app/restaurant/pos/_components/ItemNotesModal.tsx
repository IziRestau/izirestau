'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ImageIcon } from 'lucide-react'

interface ItemNotesModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (notes: string) => void
  productName: string
  productImage?: string
  productPrice?: number
  formatPrice?: (price: number) => string
  currentNotes?: string
  primaryColor: string
}

export function ItemNotesModal({
  isOpen,
  onClose,
  onSave,
  productName,
  productImage,
  productPrice,
  formatPrice,
  currentNotes = '',
  primaryColor,
}: ItemNotesModalProps) {
  const [notes, setNotes] = useState(currentNotes)

  useEffect(() => {
    if (isOpen) {
      setNotes(currentNotes)
    }
  }, [isOpen, currentNotes])

  const handleSave = () => {
    onSave(notes)
    onClose()
  }

  const handleClose = () => {
    setNotes(currentNotes)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 rounded-2xl overflow-hidden">
        <DialogHeader className="p-4 pb-3 border-b border-gray-100">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
              {productImage ? (
                <Image
                  src={productImage}
                  alt={productName}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon size={20} className="text-gray-300" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                {productName}
              </DialogTitle>
              {productPrice !== undefined && formatPrice && (
                <p className="text-sm font-medium mt-0.5" style={{ color: primaryColor }}>
                  {formatPrice(productPrice)}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>
        <div className="p-4 space-y-4">
          <div>
            <Label htmlFor="item-notes" className="text-sm font-medium text-gray-900 mb-2 block">
              Instructions speciales
            </Label>
            <Input
              id="item-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Sans oignons, bien cuit..."
              className="h-12 rounded-xl focus:ring-2"
              style={{ 
                '--tw-ring-color': primaryColor,
              } as React.CSSProperties}
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={handleClose}
              className="flex-1 h-11 rounded-xl transition-colors"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${primaryColor}10`
                e.currentTarget.style.color = primaryColor
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = ''
                e.currentTarget.style.color = ''
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 h-11 rounded-xl text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Enregistrer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
