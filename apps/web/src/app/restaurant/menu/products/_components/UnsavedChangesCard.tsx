'use client'

import { AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChangedField {
  label: string
  from?: string
  to?: string
}

interface UnsavedChangesCardProps {
  changedFields: ChangedField[]
  onDiscard: () => void
  primaryColor: string
}

export function UnsavedChangesCard({
  changedFields,
  onDiscard,
  primaryColor,
}: UnsavedChangesCardProps) {
  if (changedFields.length === 0) return null

  return (
    <div 
      className="bg-white rounded-2xl border-2 p-4 mt-4"
      style={{ borderColor: `${primaryColor}40` }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <AlertCircle size={16} style={{ color: primaryColor }} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            Modifications non sauvegardees
          </p>
          <p className="text-xs text-gray-500">
            {changedFields.length} champ{changedFields.length > 1 ? 's' : ''} modifie{changedFields.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
        {changedFields.slice(0, 5).map((field, index) => (
          <div key={index} className="text-xs">
            <span className="font-medium text-gray-700">{field.label}</span>
            {field.from && field.to && (
              <span className="text-gray-500">
                {' : '}{field.from.length > 15 ? field.from.slice(0, 15) + '...' : field.from}
                {' → '}
                <span style={{ color: primaryColor }}>
                  {field.to.length > 15 ? field.to.slice(0, 15) + '...' : field.to}
                </span>
              </span>
            )}
          </div>
        ))}
        {changedFields.length > 5 && (
          <p className="text-xs text-gray-400">
            +{changedFields.length - 5} autre{changedFields.length - 5 > 1 ? 's' : ''} modification{changedFields.length - 5 > 1 ? 's' : ''}
          </p>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onDiscard}
        className="w-full rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      >
        <RotateCcw size={14} className="mr-2" />
        Annuler les modifications
      </Button>
    </div>
  )
}
