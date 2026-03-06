'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { Layers, Plus, Trash2, Edit, Check, X } from 'lucide-react'
import type { ProductVariantLocal } from './ProductForm'

interface VariantsSectionProps {
  variants: ProductVariantLocal[]
  setVariants: React.Dispatch<React.SetStateAction<ProductVariantLocal[]>>
  trackInventory: boolean
  primaryColor: string
}

export function VariantsSection({
  variants,
  setVariants,
  trackInventory,
  primaryColor,
}: VariantsSectionProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingVariant, setEditingVariant] = useState<ProductVariantLocal | null>(null)
  const [newVariant, setNewVariant] = useState<ProductVariantLocal | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ index: number; variant: ProductVariantLocal } | null>(null)

  const handleAddVariant = () => {
    if (!newVariant || !newVariant.name.trim()) {
      toast.error('Nom requis')
      return
    }

    setVariants(prev => [...prev, { ...newVariant, id: `temp-${Date.now()}` }])
    setNewVariant(null)
  }

  const handleUpdateVariant = (index: number) => {
    if (!editingVariant || !editingVariant.name.trim()) {
      toast.error('Nom requis')
      return
    }

    setVariants(prev => prev.map((v, i) => i === index ? editingVariant : v))
    setEditingIndex(null)
    setEditingVariant(null)
  }

  const handleDeleteVariant = () => {
    if (!deleteConfirm) return

    const { index } = deleteConfirm
    setVariants(prev => prev.filter((_, i) => i !== index))
    setDeleteConfirm(null)
  }

  const startEditing = (index: number) => {
    setEditingIndex(index)
    setEditingVariant({ ...variants[index] })
  }

  const cancelEditing = () => {
    setEditingIndex(null)
    setEditingVariant(null)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <Layers size={20} style={{ color: primaryColor }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Variantes</h2>
            <p className="text-sm text-gray-500">Declinaisons du produit (taille, couleur...)</p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setNewVariant({ name: '', price: 0, stockQuantity: 0, isActive: true })}
          className="h-9 rounded-lg border-gray-200 hover:text-white hover:border-transparent"
          style={{ '--hover-bg': primaryColor, '--tw-ring-color': primaryColor } as React.CSSProperties}
          disabled={!!newVariant}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = primaryColor; e.currentTarget.style.borderColor = primaryColor }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = '' }}
        >
          <Plus size={16} className="mr-1" />
          Ajouter
        </Button>
      </div>

      <div className="space-y-3">
        {variants.map((variant, index) => (
          <div
            key={variant.id || `new-${index}`}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
          >
            {editingIndex === index && editingVariant ? (
              <>
                <Input
                  value={editingVariant.name}
                  onChange={(e) => setEditingVariant({ ...editingVariant, name: e.target.value })}
                  placeholder="Nom"
                  className="h-9 rounded-lg flex-1"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingVariant.price}
                  onChange={(e) => setEditingVariant({ ...editingVariant, price: parseFloat(e.target.value) || 0 })}
                  placeholder="Prix"
                  className="h-9 rounded-lg w-24"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
                {trackInventory && (
                  <Input
                    type="number"
                    min="0"
                    value={editingVariant.stockQuantity}
                    onChange={(e) => setEditingVariant({ ...editingVariant, stockQuantity: parseInt(e.target.value) || 0 })}
                    placeholder="Stock"
                    className="h-9 rounded-lg w-20"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  />
                )}
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleUpdateVariant(index)}
                  className="h-9 w-9 p-0 text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Check size={16} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={cancelEditing}
                  className="h-9 w-9 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X size={16} />
                </Button>
              </>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{variant.name}</p>
                  <p className="text-sm text-gray-500">
                    {variant.price.toFixed(2)} EUR
                    {trackInventory && ` • Stock: ${variant.stockQuantity}`}
                    {variant.sku && ` • ${variant.sku}`}
                  </p>
                </div>
                <Switch
                  checked={variant.isActive}
                  onCheckedChange={(checked) => {
                    const updated = { ...variant, isActive: checked }
                    setVariants(prev => prev.map((v, i) => i === index ? updated : v))
                  }}
                  style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
                  className="data-[state=checked]:bg-[--switch-checked-bg]"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditing(index)}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Edit size={14} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteConfirm({ index, variant })}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={14} />
                </Button>
              </>
            )}
          </div>
        ))}

        {newVariant && (
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border-2 border-dashed" style={{ borderColor: primaryColor }}>
            <Input
              value={newVariant.name}
              onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
              placeholder="Nom de la variante"
              className="h-9 rounded-lg flex-1"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              autoFocus
            />
            <Input
              type="number"
              step="0.01"
              min="0"
              value={newVariant.price}
              onChange={(e) => setNewVariant({ ...newVariant, price: parseFloat(e.target.value) || 0 })}
              placeholder="Prix"
              className="h-9 rounded-lg w-24"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
            {trackInventory && (
              <Input
                type="number"
                min="0"
                value={newVariant.stockQuantity}
                onChange={(e) => setNewVariant({ ...newVariant, stockQuantity: parseInt(e.target.value) || 0 })}
                placeholder="Stock"
                className="h-9 rounded-lg w-20"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            )}
            <Button
              type="button"
              size="sm"
              onClick={handleAddVariant}
              className="h-9 px-3 text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Ajouter
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setNewVariant(null)}
              className="h-9 px-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              Annuler
            </Button>
          </div>
        )}

        {variants.length === 0 && !newVariant && (
          <div className="text-center py-8 text-gray-500">
            <Layers size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Aucune variante</p>
            <p className="text-xs text-gray-400 mt-1">
              Ajoutez des variantes pour proposer differentes options
            </p>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteVariant}
        title="Supprimer la variante"
        message={`Etes-vous sur de vouloir supprimer "${deleteConfirm?.variant.name}" ?`}
        confirmText="Supprimer"
        variant="danger"
      />
    </div>
  )
}
