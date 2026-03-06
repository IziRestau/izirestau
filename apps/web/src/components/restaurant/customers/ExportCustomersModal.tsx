'use client'

import { useState } from 'react'
import { Download, Loader2, FileSpreadsheet, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { api, apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

interface ExportCustomersModalProps {
  isOpen: boolean
  onClose: () => void
  primaryColor?: string
}

const exportColumns = [
  { id: 'firstName', label: 'Prénom', default: true },
  { id: 'lastName', label: 'Nom', default: true },
  { id: 'email', label: 'Email', default: true },
  { id: 'phone', label: 'Téléphone', default: true },
  { id: 'totalOrders', label: 'Nombre de commandes', default: true },
  { id: 'totalSpent', label: 'Total dépensé', default: true },
  { id: 'avgOrderValue', label: 'Panier moyen', default: false },
  { id: 'lastOrderAt', label: 'Dernière commande', default: true },
  { id: 'createdAt', label: 'Date d\'inscription', default: true },
  { id: 'tags', label: 'Tags', default: false },
  { id: 'marketingOptIn', label: 'Consentement marketing', default: false },
  { id: 'addresses', label: 'Adresses', default: false },
]

export function ExportCustomersModal({
  isOpen,
  onClose,
  primaryColor = '#10b981',
}: ExportCustomersModalProps) {
  const { accessToken } = useAuthStore()
  const { currentRestaurantId } = useRestaurantStore()
  const isMobile = useIsMobile()

  const [format, setFormat] = useState<'csv' | 'json'>('csv')
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    exportColumns.filter(c => c.default).map(c => c.id)
  )
  const [isExporting, setIsExporting] = useState(false)

  const handleToggleColumn = (columnId: string) => {
    setSelectedColumns(prev =>
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    )
  }

  const handleSelectAll = () => {
    if (selectedColumns.length === exportColumns.length) {
      setSelectedColumns(exportColumns.filter(c => c.default).map(c => c.id))
    } else {
      setSelectedColumns(exportColumns.map(c => c.id))
    }
  }

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      toast.error('Sélectionnez au moins une colonne')
      return
    }

    setIsExporting(true)
    try {
      if (accessToken) apiClient.setAccessToken(accessToken)

      if (format === 'csv') {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/restaurant/customers/export?format=csv&columns=${selectedColumns.join(',')}&restaurantId=${currentRestaurantId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error('Erreur lors de l\'export')
        }

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `clients_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const res = await api.restaurant.customers.export({
          format: 'json',
          columns: selectedColumns.join(','),
          restaurantId: currentRestaurantId || undefined,
        })

        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `clients_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }

      toast.success('Export réussi')
      onClose()
    } catch (error) {
      toast.error('Erreur lors de l\'export')
    } finally {
      setIsExporting(false)
    }
  }

  const formContent = (
    <div className="space-y-6 p-4">
          {/* Format */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Format</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className="flex items-center gap-3 p-3 rounded-xl border-2 transition-colors"
                style={
                  format === 'csv'
                    ? { borderColor: primaryColor, backgroundColor: `${primaryColor}10` }
                    : { borderColor: '#e5e7eb' }
                }
              >
                <FileSpreadsheet
                  size={24}
                  style={{ color: format === 'csv' ? primaryColor : '#9ca3af' }}
                />
                <div className="text-left">
                  <p 
                    className="font-medium"
                    style={{ color: format === 'csv' ? primaryColor : '#374151' }}
                  >
                    CSV
                  </p>
                  <p className="text-xs text-gray-500">Excel, Sheets</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormat('json')}
                className="flex items-center gap-3 p-3 rounded-xl border-2 transition-colors"
                style={
                  format === 'json'
                    ? { borderColor: primaryColor, backgroundColor: `${primaryColor}10` }
                    : { borderColor: '#e5e7eb' }
                }
              >
                <FileText
                  size={24}
                  style={{ color: format === 'json' ? primaryColor : '#9ca3af' }}
                />
                <div className="text-left">
                  <p 
                    className="font-medium"
                    style={{ color: format === 'json' ? primaryColor : '#374151' }}
                  >
                    JSON
                  </p>
                  <p className="text-xs text-gray-500">Développeurs</p>
                </div>
              </button>
            </div>
          </div>

          {/* Colonnes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">Colonnes à exporter</Label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {selectedColumns.length === exportColumns.length ? 'Réinitialiser' : 'Tout sélectionner'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-1">
              {exportColumns.map((column) => (
                <label
                  key={column.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedColumns.includes(column.id)}
                    onCheckedChange={() => handleToggleColumn(column.id)}
                    style={{ 
                      '--primary': primaryColor,
                      borderColor: selectedColumns.includes(column.id) ? primaryColor : undefined,
                      backgroundColor: selectedColumns.includes(column.id) ? primaryColor : undefined,
                    } as React.CSSProperties}
                  />
                  <span className="text-sm text-gray-700">{column.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={isExporting} 
              className="h-11 rounded-xl transition-colors"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${primaryColor}15`
                e.currentTarget.style.borderColor = primaryColor
                e.currentTarget.style.color = primaryColor
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = ''
                e.currentTarget.style.borderColor = ''
                e.currentTarget.style.color = ''
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || selectedColumns.length === 0}
              style={{ backgroundColor: primaryColor }}
              className="text-white h-11 rounded-xl"
            >
              {isExporting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Export en cours...
                </>
              ) : (
                <>
                  <Download size={16} className="mr-2" />
                  Exporter ({selectedColumns.length} colonnes)
                </>
              )}
            </Button>
          </div>
    </div>
  )

  return (
    <>
      {isMobile ? (
        <Drawer open={isOpen} onOpenChange={onClose}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <Download size={18} style={{ color: primaryColor }} />
                </div>
                <span>Exporter les clients</span>
              </DrawerTitle>
              <DrawerDescription>
                Sélectionnez le format et les colonnes à exporter
              </DrawerDescription>
            </DrawerHeader>
            <div className="max-h-[70vh] overflow-y-auto">
              {formContent}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden rounded-2xl">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <Download size={18} style={{ color: primaryColor }} />
                </div>
                <span>Exporter les clients</span>
              </DialogTitle>
              <DialogDescription>
                Sélectionnez le format et les colonnes à exporter
              </DialogDescription>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
