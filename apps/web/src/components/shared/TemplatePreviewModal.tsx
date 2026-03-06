'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Download, Printer, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

interface TemplatePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  previewUrl?: string
  htmlContent?: string
  fetchHtml?: () => Promise<string>
  title?: string
  primaryColor?: string
  showActions?: boolean
  onDownload?: () => void
  onPrint?: () => void
}

export function TemplatePreviewModal({
  isOpen,
  onClose,
  previewUrl,
  htmlContent,
  fetchHtml,
  title = 'Aperçu du template',
  primaryColor = '#10b981',
  showActions = false,
  onDownload,
  onPrint,
}: TemplatePreviewModalProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [html, setHtml] = useState<string | null>(htmlContent || null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      setError(null)
      
      if (htmlContent) {
        setHtml(htmlContent)
        setIsLoading(false)
      } else if (fetchHtml) {
        fetchHtml()
          .then((content) => {
            setHtml(content)
            setIsLoading(false)
          })
          .catch((err) => {
            setError('Impossible de charger l\'aperçu')
            setIsLoading(false)
          })
      } else if (previewUrl) {
        setIsLoading(true)
      }
    }
  }, [isOpen, htmlContent, fetchHtml, previewUrl])

  const content = (
    <div className="flex flex-col h-full">
      {/* Preview iframe */}
      <div className="flex-1 relative bg-gray-50 rounded-lg overflow-hidden min-h-[500px] flex items-center justify-center">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <Loader2 size={32} className="animate-spin" style={{ color: primaryColor }} />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white text-gray-500">
            <AlertCircle size={32} className="mb-2 text-red-400" />
            <p>{error}</p>
          </div>
        )}
        {!error && (html ? (
          <iframe
            srcDoc={html}
            className="w-full h-full border-0 bg-white"
            style={{ minHeight: '500px' }}
            title={title}
            sandbox="allow-same-origin"
          />
        ) : previewUrl ? (
          <iframe
            src={previewUrl}
            className="w-full h-full border-0 bg-white"
            style={{ minHeight: '500px' }}
            onLoad={() => setIsLoading(false)}
            title={title}
          />
        ) : null)}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
          {onPrint && (
            <Button
              variant="outline"
              onClick={onPrint}
              className="flex-1 h-11 rounded-xl"
            >
              <Printer size={16} className="mr-2" />
              Imprimer
            </Button>
          )}
          {onDownload && (
            <Button
              onClick={onDownload}
              className="flex-1 h-11 rounded-xl text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <Download size={16} className="mr-2" />
              Télécharger PDF
            </Button>
          )}
        </div>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="pb-2">
            <div className="flex items-center justify-between">
              <DrawerTitle>{title}</DrawerTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X size={20} />
              </Button>
            </div>
          </DrawerHeader>
          <div className="px-4 pb-6 flex-1 overflow-hidden">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  )
}
