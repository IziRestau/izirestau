'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Loader2,
  Save,
  Home,
  UtensilsCrossed,
  Phone,
  FileText,
  Image,
  Star,
  Info,
  Megaphone,
  LayoutGrid,
  MapPin,
  Mail,
  Map,
  Settings2,
  Search,
  Menu,
  ChevronRight,
  Plus,
  Trash2,
  Columns,
  BarChart3,
  MessageSquareQuote,
  GripVertical,
  ArrowUp,
  ArrowDown,
  ListOrdered,
  Clock,
  Users,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { useRestaurantNavigation } from '@/hooks/use-restaurant-navigation'
import { api, apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { ImageUpload } from '@/components/shared/ImageUpload'
import { IconPicker } from '@/components/shared/IconPicker'
import { loadThemeComponents } from '@/components/storefront/themes/_registry'
import type {
  ThemePageSections,
  ThemeSectionDef,
  SectionFieldDef,
  PageSectionsData,
} from '@/components/storefront/themes/_types'

const PAGE_TYPE_ICONS: Record<string, typeof Home> = {
  home: Home,
  menu: UtensilsCrossed,
  about: Info,
  contact: Phone,
  track: MapPin,
  custom: FileText,
}

const PAGE_TYPE_LABELS: Record<string, string> = {
  home: 'Accueil',
  menu: 'Menu',
  about: 'À propos',
  contact: 'Contact',
  track: 'Suivi de commande',
  custom: 'Personnalisée',
}

const SECTION_ICONS: Record<string, typeof Home> = {
  hero: Image,
  twoColumns: Columns,
  stats: BarChart3,
  featured: Star,
  about: Info,
  gallery: Image,
  testimonials: MessageSquareQuote,
  cta: Megaphone,
  catalog: LayoutGrid,
  info: Info,
  header: Image,
  contactInfo: MapPin,
  form: Mail,
  map: Map,
  content: FileText,
  imageText: Columns,
  locations: MapPin,
  qualityFood: Star,
  latestMenu: UtensilsCrossed,
  socialGallery: Image,
  story: FileText,
  timeline: Clock,
  team: Users,
}

function SectionField({
  field,
  value,
  onChange,
  primaryColor,
  allValues,
  sectionFields,
  menuItems = [],
}: {
  field: SectionFieldDef
  value: unknown
  onChange: (val: unknown) => void
  primaryColor: string
  allValues: Record<string, unknown>
  sectionFields: SectionFieldDef[]
  menuItems?: Array<{ id: string; name: string; image: string | null }>
}) {
  if (field.showWhen) {
    const isFieldVisible = (fieldKey: string, expectedValue: unknown): boolean => {
      const dep = sectionFields.find((f) => f.key === fieldKey)
      if (dep?.showWhen) {
        const parentVisible = isFieldVisible(dep.showWhen.field, dep.showWhen.value)
        if (!parentVisible) return false
      }
      const currentValue = allValues[fieldKey] ?? dep?.defaultValue
      return currentValue === expectedValue
    }
    if (!isFieldVisible(field.showWhen.field, field.showWhen.value)) return null
  }

  switch (field.type) {
    case 'separator':
      return (
        <div className="pt-2 pb-1">
          <div className="flex items-center gap-3">
            <div
              className="w-1.5 h-5 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
            <span className="text-sm font-semibold text-gray-800">{field.label}</span>
          </div>
          {field.description && <p className="text-[11px] text-gray-400 ml-[1.125rem] mt-0.5">{field.description}</p>}
        </div>
      )

    case 'text':
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">{field.label}</Label>
          <Input
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className="h-10 rounded-xl border-gray-200 text-sm focus:ring-2"
            style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
          />
          {field.description && <p className="text-[11px] text-gray-400">{field.description}</p>}
        </div>
      )

    case 'textarea':
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">{field.label}</Label>
          <Textarea
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className="min-h-[100px] rounded-xl border-gray-200 text-sm resize-none focus:ring-2"
            style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
          />
          {field.description && <p className="text-[11px] text-gray-400">{field.description}</p>}
        </div>
      )

    case 'switch':
      return (
        <div className="flex items-center justify-between py-2">
          <div>
            <span className="text-sm font-medium text-gray-900">{field.label}</span>
            {field.description && <p className="text-[11px] text-gray-400 mt-0.5">{field.description}</p>}
          </div>
          <Switch
            checked={value as boolean ?? field.defaultValue ?? false}
            onCheckedChange={(checked) => onChange(checked)}
            style={{ backgroundColor: (value as boolean) ? primaryColor : undefined } as React.CSSProperties}
          />
        </div>
      )

    case 'select':
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">{field.label}</Label>
          <Select
            value={(value as string) || (field.defaultValue as string) || ''}
            onValueChange={(v) => onChange(v)}
          >
            <SelectTrigger className="h-10 rounded-xl text-sm focus:ring-2" style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent accentColor={primaryColor}>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {field.description && <p className="text-[11px] text-gray-400">{field.description}</p>}
        </div>
      )

    case 'multiselect': {
      const selectedValues = Array.isArray(value) ? (value as string[]) : (field.defaultValue as string[]) || []
      
      const toggleValue = (val: string) => {
        if (selectedValues.includes(val)) {
          onChange(selectedValues.filter(v => v !== val))
        } else {
          onChange([...selectedValues, val])
        }
      }

      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">{field.label}</Label>
          <div className="flex flex-wrap gap-2">
            {field.options?.map((opt) => {
              const isSelected = selectedValues.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleValue(opt.value)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-all"
                  style={{
                    backgroundColor: isSelected ? primaryColor : 'transparent',
                    borderColor: isSelected ? primaryColor : 'rgba(0,0,0,0.1)',
                    color: isSelected ? '#fff' : '#374151',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
          {field.description && <p className="text-[11px] text-gray-400">{field.description}</p>}
        </div>
      )
    }

    case 'number':
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">{field.label}</Label>
          <Input
            type="number"
            value={(value as number) ?? field.defaultValue ?? 0}
            onChange={(e) => onChange(Number(e.target.value))}
            min={field.min}
            max={field.max}
            step={field.step}
            className="h-10 rounded-xl border-gray-200 text-sm focus:ring-2"
            style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
          />
          {field.description && <p className="text-[11px] text-gray-400">{field.description}</p>}
        </div>
      )

    case 'slider':
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-gray-700">{field.label}</Label>
            <span className="text-xs text-gray-500">{value as number ?? field.defaultValue ?? 0}</span>
          </div>
          <Slider
            value={[value as number ?? field.defaultValue as number ?? 0]}
            onValueChange={([v]) => onChange(v)}
            min={field.min ?? 0}
            max={field.max ?? 100}
            step={field.step ?? 1}
            className="py-2"
            accentColor={primaryColor}
          />
          {field.description && <p className="text-[11px] text-gray-400">{field.description}</p>}
        </div>
      )

    case 'color':
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">{field.label}</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={(value as string) || (field.defaultValue as string) || '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
            />
            <Input
              value={(value as string) || ''}
              onChange={(e) => onChange(e.target.value)}
              className="h-10 rounded-xl flex-1 text-xs focus:ring-2"
              style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
              maxLength={7}
            />
          </div>
        </div>
      )

    case 'image':
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">{field.label}</Label>
          <ImageUpload
            value={(value as string) || null}
            onChange={(url: string | null) => onChange(url || '')}
            folder="sections"
            placeholder={field.placeholder || 'Ajouter une image'}
            aspectRatio="landscape"
            primaryColor={primaryColor}
            showMediaLibrary
          />
          {field.description && <p className="text-[11px] text-gray-400">{field.description}</p>}
        </div>
      )

    case 'icon':
      return (
        <IconPicker
          value={(value as string) || null}
          onChange={(iconName) => onChange(iconName || '')}
          label={field.label}
          description={field.description}
          primaryColor={primaryColor}
        />
      )

    case 'gallery': {
      const images = Array.isArray(value) ? (value as string[]) : []
      return (
        <ImageUpload
          mode="gallery"
          values={images}
          onChangeMultiple={(urls) => onChange(urls)}
          folder="sections"
          label={field.label}
          placeholder={field.placeholder || 'Ajouter des images'}
          primaryColor={primaryColor}
          showMediaLibrary
          galleryDescription={field.description}
        />
      )
    }

    case 'testimonials': {
      const items = Array.isArray(value) ? (value as { name: string; text: string; rating: number }[]) : []

      const updateItem = (idx: number, partial: Partial<{ name: string; text: string; rating: number }>) => {
        const updated = items.map((item, i) => i === idx ? { ...item, ...partial } : item)
        onChange(updated)
      }

      const addItem = () => {
        onChange([...items, { name: '', text: '', rating: 5 }])
      }

      const removeItem = (idx: number) => {
        onChange(items.filter((_, i) => i !== idx))
      }

      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-gray-700">{field.label}</Label>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors hover:opacity-80 text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus size={14} />
              Ajouter
            </button>
          </div>
          {field.description && <p className="text-[11px] text-gray-400">{field.description}</p>}
          {items.length === 0 && (
            <p className="text-xs text-gray-400 italic py-4 text-center border border-dashed border-gray-200 rounded-xl">
              Aucun témoignage ajouté. Les témoignages par défaut seront utilisés.
            </p>
          )}
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="p-4 border rounded-xl space-y-3 bg-gray-50/50" style={{ borderColor: `${primaryColor}20` }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Témoignage {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="text-red-400 hover:text-red-600 transition-colors p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-gray-500">Nom</Label>
                  <Input
                    value={item.name}
                    onChange={(e) => updateItem(idx, { name: e.target.value })}
                    placeholder="Marie L."
                    className="h-9 rounded-lg border-gray-200 text-sm focus:ring-2"
                    style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-gray-500">Témoignage</Label>
                  <Textarea
                    value={item.text}
                    onChange={(e) => updateItem(idx, { text: e.target.value })}
                    placeholder="Une cuisine exceptionnelle..."
                    className="min-h-[60px] rounded-lg border-gray-200 text-sm resize-none focus:ring-2"
                    style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-gray-500">Note ({item.rating}/5)</Label>
                  <Slider
                    value={[item.rating]}
                    onValueChange={([v]) => updateItem(idx, { rating: v })}
                    min={1}
                    max={5}
                    step={1}
                    className="py-1"
                    accentColor={primaryColor}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    case 'testimonials-with-product': {
      const items = Array.isArray(value) ? (value as { name: string; text: string; rating: number; productId?: string }[]) : []
      const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({})

      const toggleExpand = (idx: number) => {
        setExpandedItems(prev => ({ ...prev, [idx]: !prev[idx] }))
      }

      const updateItem = (idx: number, partial: Partial<{ name: string; text: string; rating: number; productId?: string }>) => {
        const updated = items.map((item, i) => i === idx ? { ...item, ...partial } : item)
        onChange(updated)
      }

      const addItem = () => {
        const newIdx = items.length
        onChange([...items, { name: '', text: '', rating: 5, productId: '' }])
        setExpandedItems(prev => ({ ...prev, [newIdx]: true }))
      }

      const removeItem = (idx: number) => {
        onChange(items.filter((_, i) => i !== idx))
      }

      const getProductImage = (productId: string) => {
        const product = menuItems.find(p => p.id === productId)
        return product?.image || null
      }

      const getProductName = (productId: string) => {
        const product = menuItems.find(p => p.id === productId)
        return product?.name || ''
      }

      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-gray-700">{field.label}</Label>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors hover:opacity-80 text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus size={14} />
              Ajouter
            </button>
          </div>
          {field.description && <p className="text-[11px] text-gray-400">{field.description}</p>}
          {items.length === 0 && (
            <p className="text-xs text-gray-400 italic py-4 text-center border border-dashed border-gray-200 rounded-xl">
              Aucun témoignage ajouté. Les témoignages par défaut seront utilisés.
            </p>
          )}
          <div className="space-y-2">
            {items.map((item, idx) => {
              const selectedProductImage = item.productId ? getProductImage(item.productId) : null
              const selectedProductName = item.productId ? getProductName(item.productId) : ''
              const isExpanded = expandedItems[idx] ?? false
              return (
                <div key={idx} className="border rounded-xl bg-gray-50/50 overflow-hidden" style={{ borderColor: `${primaryColor}20` }}>
                  <div 
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100/50 transition-colors"
                    onClick={() => toggleExpand(idx)}
                  >
                    <div className="flex items-center gap-3">
                      {selectedProductImage && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                          <img src={selectedProductImage} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-semibold text-gray-700">
                          {item.name || `Témoignage ${idx + 1}`}
                        </span>
                        {selectedProductName && (
                          <p className="text-[10px] text-gray-400">{selectedProductName}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={10} fill={i < item.rating ? primaryColor : 'transparent'} stroke={i < item.rating ? primaryColor : '#ccc'} />
                        ))}
                      </div>
                      <ChevronRight size={16} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="p-4 pt-0 space-y-3 border-t" style={{ borderColor: `${primaryColor}10` }}>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeItem(idx) }}
                          className="text-red-400 hover:text-red-600 transition-colors p-1 text-xs flex items-center gap-1"
                        >
                          <Trash2 size={12} />
                          Supprimer
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] text-gray-500">Produit lié</Label>
                        <Select
                          value={item.productId || 'none'}
                          onValueChange={(v) => updateItem(idx, { productId: v === 'none' ? '' : v })}
                        >
                          <SelectTrigger className="h-9 rounded-lg text-sm focus:ring-2" style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}>
                            <SelectValue placeholder="Sélectionner un produit" />
                          </SelectTrigger>
                          <SelectContent accentColor={primaryColor}>
                            <SelectItem value="none">Aucun produit</SelectItem>
                            {menuItems.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] text-gray-500">Nom</Label>
                        <Input
                          value={item.name}
                          onChange={(e) => updateItem(idx, { name: e.target.value })}
                          placeholder="Marie L."
                          className="h-9 rounded-lg border-gray-200 text-sm focus:ring-2"
                          style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] text-gray-500">Témoignage</Label>
                        <Textarea
                          value={item.text}
                          onChange={(e) => updateItem(idx, { text: e.target.value })}
                          placeholder="Une cuisine exceptionnelle..."
                          className="min-h-[60px] rounded-lg border-gray-200 text-sm resize-none focus:ring-2"
                          style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] text-gray-500">Note ({item.rating}/5)</Label>
                        <Slider
                          value={[item.rating]}
                          onValueChange={([v]) => updateItem(idx, { rating: v })}
                          min={1}
                          max={5}
                          step={1}
                          className="py-1"
                          accentColor={primaryColor}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    case 'array': {
      const items = Array.isArray(value) ? (value as Record<string, unknown>[]) : (field.defaultValue as Record<string, unknown>[]) || []
      const itemFields = field.itemFields || []
      const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({})

      const toggleExpand = (idx: number) => {
        setExpandedItems(prev => ({ ...prev, [idx]: !prev[idx] }))
      }

      const updateItem = (idx: number, key: string, val: unknown) => {
        const updated = items.map((item, i) => i === idx ? { ...item, [key]: val } : item)
        onChange(updated)
      }

      const addItem = () => {
        const newIdx = items.length
        const newItem: Record<string, unknown> = {}
        itemFields.forEach(f => {
          newItem[f.key] = f.defaultValue ?? ''
        })
        onChange([...items, newItem])
        setExpandedItems(prev => ({ ...prev, [newIdx]: true }))
      }

      const removeItem = (idx: number) => {
        onChange(items.filter((_, i) => i !== idx))
      }

      const getItemPreview = (item: Record<string, unknown>) => {
        const titleField = itemFields.find(f => f.key === 'title')
        const markerField = itemFields.find(f => f.key === 'marker')
        const title = titleField ? (item[titleField.key] as string) : ''
        const marker = markerField ? (item[markerField.key] as string) : ''
        return title || marker || ''
      }

      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-gray-700">{field.label}</Label>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors hover:opacity-80 text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus size={14} />
              Ajouter
            </button>
          </div>
          {field.description && <p className="text-[11px] text-gray-400">{field.description}</p>}
          {items.length === 0 && (
            <p className="text-xs text-gray-400 italic py-4 text-center border border-dashed border-gray-200 rounded-xl">
              Aucun élément ajouté.
            </p>
          )}
          <div className="space-y-2">
            {items.map((item, idx) => {
              const isExpanded = expandedItems[idx] ?? false
              const preview = getItemPreview(item)
              const markerType = item['markerType'] as string | undefined

              return (
                <div key={idx} className="border rounded-xl bg-gray-50/50 overflow-hidden" style={{ borderColor: `${primaryColor}20` }}>
                  <div 
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100/50 transition-colors"
                    onClick={() => toggleExpand(idx)}
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-xs font-semibold text-gray-700">
                          {preview || `${field.itemLabel || 'Élément'} ${idx + 1}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeItem(idx) }}
                        className="text-red-400 hover:text-red-600 transition-colors p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                      <ChevronRight 
                        size={16} 
                        className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                      />
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="p-4 pt-0 space-y-3 border-t" style={{ borderColor: `${primaryColor}10` }}>
                      {itemFields.map((itemField) => {
                        const itemValue = item[itemField.key]
                        
                        if (itemField.key === 'marker' && markerType === 'icon') {
                          return (
                            <IconPicker
                              key={itemField.key}
                              value={(itemValue as string) || null}
                              onChange={(iconName) => updateItem(idx, itemField.key, iconName || '')}
                              label={itemField.label}
                              description={itemField.description}
                              primaryColor={primaryColor}
                            />
                          )
                        }

                        if (itemField.type === 'image') {
                          return (
                            <div key={itemField.key} className="space-y-1.5">
                              <Label className="text-[11px] text-gray-500">{itemField.label}</Label>
                              <ImageUpload
                                value={(itemValue as string) || null}
                                onChange={(url: string | null) => updateItem(idx, itemField.key, url || '')}
                                folder="team"
                                placeholder={itemField.placeholder || 'Ajouter une photo'}
                                aspectRatio="square"
                                primaryColor={primaryColor}
                                showMediaLibrary
                              />
                            </div>
                          )
                        }
                        
                        if (itemField.type === 'select') {
                          return (
                            <div key={itemField.key} className="space-y-1.5">
                              <Label className="text-[11px] text-gray-500">{itemField.label}</Label>
                              <Select
                                value={(itemValue as string) || (itemField.defaultValue as string) || ''}
                                onValueChange={(v) => updateItem(idx, itemField.key, v)}
                              >
                                <SelectTrigger className="h-9 rounded-lg text-sm focus:ring-2" style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent accentColor={primaryColor}>
                                  {itemField.options?.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )
                        }
                        
                        if (itemField.type === 'textarea') {
                          return (
                            <div key={itemField.key} className="space-y-1.5">
                              <Label className="text-[11px] text-gray-500">{itemField.label}</Label>
                              <Textarea
                                value={(itemValue as string) || ''}
                                onChange={(e) => updateItem(idx, itemField.key, e.target.value)}
                                placeholder={itemField.placeholder}
                                className="min-h-[60px] rounded-lg border-gray-200 text-sm resize-none focus:ring-2"
                                style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                              />
                            </div>
                          )
                        }
                        
                        return (
                          <div key={itemField.key} className="space-y-1.5">
                            <Label className="text-[11px] text-gray-500">{itemField.label}</Label>
                            <Input
                              value={(itemValue as string) || ''}
                              onChange={(e) => updateItem(idx, itemField.key, e.target.value)}
                              placeholder={itemField.placeholder}
                              className="h-9 rounded-lg border-gray-200 text-sm focus:ring-2"
                              style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    default:
      return null
  }
}

function SortableSectionItem({
  section,
  primaryColor,
  index,
  total,
  onMoveUp,
  onMoveDown,
}: {
  section: ThemeSectionDef
  primaryColor: string
  index: number
  total: number
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  }

  const Icon = SECTION_ICONS[section.id] || FileText

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 px-4 py-3 bg-white border rounded-xl transition-shadow',
        isDragging ? 'shadow-lg border-gray-300' : 'border-gray-100 hover:border-gray-200'
      )}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} />
      </button>
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${primaryColor}15` }}
      >
        <Icon size={14} style={{ color: primaryColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{section.label}</p>
        {section.description && (
          <p className="text-[11px] text-gray-400 truncate">{section.description}</p>
        )}
      </div>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
            index === 0 ? 'text-gray-200' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          )}
        >
          <ArrowUp size={14} />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
            index === total - 1 ? 'text-gray-200' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          )}
        >
          <ArrowDown size={14} />
        </button>
      </div>
    </div>
  )
}

export default function PageEditPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()
  const { organization, restaurants, currentRestaurantId, switchRestaurant } = useRestaurantStore()
  const navigation = useRestaurantNavigation()

  const pageId = params.id as string
  const primaryColor = organization?.primaryColor || '#10b981'

  const tabFromUrl = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<string>(tabFromUrl || 'general')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [showInNav, setShowInNav] = useState(true)
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [sectionsData, setSectionsData] = useState<PageSectionsData>({})
  const [sectionOrder, setSectionOrder] = useState<string[]>([])
  const [sectionConfig, setSectionConfig] = useState<ThemePageSections | null>(null)

  useEffect(() => {
    if (tabFromUrl) setActiveTab(tabFromUrl)
  }, [tabFromUrl])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    router.push(`/restaurant/site/pages/${pageId}?tab=${tabId}`, { scroll: false })
    setIsMobileMenuOpen(false)
  }

  const { data: pagesQueryData, isLoading } = useQuery({
    queryKey: ['restaurant-site-pages-all', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.site.pages.list()
      return res.data as Array<{
        id: string
        slug: string
        title: string
        content: string
        isDefault: boolean
        pageType: string | null
        isActive: boolean
        showInNav: boolean
        sections: Record<string, Record<string, unknown>> | null
        metaTitle: string | null
        metaDescription: string | null
      }>
    },
    enabled: !!accessToken && !!currentRestaurantId,
    staleTime: 5 * 60 * 1000,
  })

  const pageData = pagesQueryData?.find((p) => p.id === pageId) || null
  const homePageData = pagesQueryData?.find((p) => p.pageType === 'home') || null

  const { data: settingsData } = useQuery({
    queryKey: ['restaurant-settings', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.getSettings(currentRestaurantId || undefined)
      return res.data
    },
    enabled: !!accessToken && !!currentRestaurantId,
    staleTime: 5 * 60 * 1000,
  })

  const { data: menuItemsData } = useQuery({
    queryKey: ['restaurant-menu-items', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.products.list({ restaurantId: currentRestaurantId || undefined })
      return res.data as Array<{ id: string; name: string; image: string | null }>
    },
    enabled: !!accessToken && !!currentRestaurantId,
    staleTime: 5 * 60 * 1000,
  })

  const menuItems = menuItemsData || []

  const themeId = settingsData?.theme?.baseTheme || 'default'

  useEffect(() => {
    loadThemeComponents(themeId).then((components) => {
      if (components?.sectionConfig) {
        setSectionConfig(components.sectionConfig)
      }
    })
  }, [themeId])

  useEffect(() => {
    if (pageData) {
      setTitle(pageData.title)
      setContent(pageData.content)
      setIsActive(pageData.isActive)
      setShowInNav(pageData.showInNav)
      setMetaTitle(pageData.metaTitle || '')
      setMetaDescription(pageData.metaDescription || '')
      const sections = pageData.sections || {}
      setSectionsData(sections)
      const savedOrder = (sections as Record<string, unknown>)._order as string[] | undefined
      if (savedOrder && Array.isArray(savedOrder)) {
        setSectionOrder(savedOrder)
      }
    }
  }, [pageData])

  const isCustomPage = !pageData?.pageType || pageData?.pageType === 'custom'

  const pageSections: ThemeSectionDef[] = useMemo(() => {
    if (!sectionConfig || !pageData) return []
    const key = pageData.pageType || 'custom'
    return sectionConfig[key] || []
  }, [sectionConfig, pageData])

  useEffect(() => {
    if (isCustomPage && pageSections.length > 0 && sectionOrder.length === 0) {
      setSectionOrder(pageSections.map((s) => s.id))
    }
  }, [isCustomPage, pageSections, sectionOrder.length])

  const orderedSections: ThemeSectionDef[] = useMemo(() => {
    if (!isCustomPage || sectionOrder.length === 0) return pageSections
    const sectionMap: Record<string, ThemeSectionDef> = {}
    for (const s of pageSections) { sectionMap[s.id] = s }
    const ordered: ThemeSectionDef[] = []
    for (const sectionId of sectionOrder) {
      const section = sectionMap[sectionId]
      if (section) ordered.push(section)
    }
    for (const s of pageSections) {
      if (!sectionOrder.includes(s.id)) ordered.push(s)
    }
    return ordered
  }, [isCustomPage, pageSections, sectionOrder])

  const tabs = useMemo(() => {
    const result: { id: string; label: string; icon: typeof Settings2; description: string }[] = [
      { id: 'general', label: 'Général', icon: Settings2, description: 'Titre, contenu, visibilité' },
    ]
    if (isCustomPage) {
      result.push({ id: '_order', label: 'Ordre des sections', icon: ListOrdered, description: 'Réorganiser les sections' })
    }
    const sectionsToShow = isCustomPage ? orderedSections : pageSections
    for (const section of sectionsToShow) {
      const icon = SECTION_ICONS[section.id] || FileText
      result.push({
        id: section.id,
        label: section.label,
        icon,
        description: section.description || 'Personnalisation de la section',
      })
    }
    result.push({ id: 'seo', label: 'SEO', icon: Search, description: 'Référencement et meta' })
    return result
  }, [pageSections, orderedSections, isCustomPage])

  const updateSectionField = (sectionId: string, fieldKey: string, value: unknown) => {
    setSectionsData((prev) => ({
      ...prev,
      [sectionId]: {
        ...(prev[sectionId] || {}),
        [fieldKey]: value,
      },
    }))
  }

  const getSectionFieldValue = (sectionId: string, fieldKey: string, defaultValue?: unknown): unknown => {
    return sectionsData[sectionId]?.[fieldKey] ?? defaultValue
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setSectionOrder((prev) => {
      const oldIndex = prev.indexOf(active.id as string)
      const newIndex = prev.indexOf(over.id as string)
      return arrayMove(prev, oldIndex, newIndex)
    })
  }, [])

  const handleMoveSection = useCallback((index: number, direction: 'up' | 'down') => {
    setSectionOrder((prev) => {
      const newIndex = direction === 'up' ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= prev.length) return prev
      return arrayMove(prev, index, newIndex)
    })
  }, [])

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!pageData) return
      if (accessToken) apiClient.setAccessToken(accessToken)
      const dataToSave = { ...sectionsData }
      if (isCustomPage && sectionOrder.length > 0) {
        (dataToSave as Record<string, unknown>)._order = sectionOrder
      }
      return api.restaurant.site.pages.update(pageData.id, {
        title,
        content,
        isActive,
        showInNav,
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
        sections: dataToSave,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-site-pages'] })
      queryClient.invalidateQueries({ queryKey: ['restaurant-site-page', pageId] })
      toast.success('Page mise à jour')
    },
    onError: (error: Error) => toast.error(error.message || 'Erreur lors de la mise à jour'),
  })

  const handleSave = () => {
    if (!title) {
      toast.error('Le titre est requis')
      return
    }
    updateMutation.mutate()
  }

  if (isLoading || !pageData) {
    return (
      <PageSkeleton
        navigation={navigation}
        basePath="/restaurant"
        title="Modifier la page"
        variant="detail"
      />
    )
  }

  const pageTypeKey = pageData.pageType || 'custom'
  const PageIcon = PAGE_TYPE_ICONS[pageTypeKey] || FileText
  const pageTypeLabel = PAGE_TYPE_LABELS[pageTypeKey] || pageTypeKey

  return (
    <DashboardLayout
      navigation={navigation}
      basePath="/restaurant"
      logoText={organization?.name || 'Restaurant'}
      primaryColor={primaryColor}
      restaurants={restaurants}
      currentRestaurantId={currentRestaurantId}
      onSwitchRestaurant={(id) => accessToken && switchRestaurant(accessToken, id)}
    >
      <PageHeader
        title={pageData.title}
        subtitle={`Personnalisation de la page ${pageTypeLabel}`}
        icon={PageIcon}
        badge={pageData.isActive
          ? { text: 'Publiée', variant: 'default' as const }
          : { text: 'Brouillon', variant: 'warning' as const }
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl gap-1.5 text-xs border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              onClick={() => router.push('/restaurant/site/pages')}
            >
              <ArrowLeft size={14} />
              Retour
            </Button>
            <Button
              size="sm"
              className="text-white h-9 rounded-xl gap-1.5 text-xs hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Enregistrer
            </Button>
          </div>
        }
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Mobile Tab Selector */}
        <div className="lg:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  {(() => {
                    const currentTab = tabs.find(t => t.id === activeTab)
                    const Icon = currentTab?.icon || Settings2
                    return (
                      <>
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Icon size={18} className="text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{currentTab?.label}</p>
                          <p className="text-xs text-gray-500">{currentTab?.description}</p>
                        </div>
                      </>
                    )
                  })()}
                </div>
                <Menu size={18} className="text-gray-400" />
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto rounded-t-2xl">
              <SheetHeader className="pb-4">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 pb-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActiveTab = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        'flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left transition-all w-full',
                        isActiveTab ? 'text-white' : 'text-gray-600 hover:bg-gray-50'
                      )}
                      style={isActiveTab ? { backgroundColor: primaryColor } : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={20} className="flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{tab.label}</p>
                          <p className={cn('text-xs truncate', isActiveTab ? 'opacity-80' : 'text-gray-400')}>
                            {tab.description}
                          </p>
                        </div>
                      </div>
                      {isActiveTab && <ChevronRight size={16} />}
                    </button>
                  )
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-2 sticky top-24">
            <nav className="flex flex-col gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActiveTab = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all w-full',
                      isActiveTab ? 'text-white' : 'text-gray-600 hover:bg-gray-50'
                    )}
                    style={isActiveTab ? { backgroundColor: primaryColor } : undefined}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{tab.label}</p>
                      <p className={cn('text-xs truncate', isActiveTab ? 'opacity-80' : 'text-gray-400')}>
                        {tab.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
            {activeTab === 'general' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Paramètres généraux</h3>
                  <p className="text-sm text-gray-500 mt-1">Titre, contenu et visibilité de la page</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700">Titre de la page</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Titre de la page"
                      className="h-10 rounded-xl border-gray-200 text-sm focus:ring-2"
                      style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700">Contenu</Label>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Contenu de la page"
                      className="min-h-[120px] rounded-xl border-gray-200 text-sm resize-none focus:ring-2"
                      style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Active</p>
                      <p className="text-xs text-gray-500">Publier cette page sur le site</p>
                    </div>
                    <Switch
                      checked={isActive}
                      onCheckedChange={setIsActive}
                      style={{ backgroundColor: isActive ? primaryColor : undefined } as React.CSSProperties}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Afficher dans la navigation</p>
                      <p className="text-xs text-gray-500">Ajouter un lien dans le menu du site</p>
                    </div>
                    <Switch
                      checked={showInNav}
                      onCheckedChange={setShowInNav}
                      style={{ backgroundColor: showInNav ? primaryColor : undefined } as React.CSSProperties}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'seo' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Référencement (SEO)</h3>
                  <p className="text-sm text-gray-500 mt-1">Optimisez la visibilité de cette page</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700">Meta titre</Label>
                    <Input
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      placeholder="Titre pour les moteurs de recherche"
                      className="h-10 rounded-xl border-gray-200 text-sm focus:ring-2"
                      style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                    />
                    <p className="text-[11px] text-gray-400">Laissez vide pour utiliser le titre de la page</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700">Meta description</Label>
                    <Textarea
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      placeholder="Description pour les moteurs de recherche"
                      className="min-h-[80px] rounded-xl border-gray-200 text-sm resize-none focus:ring-2"
                      style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === '_order' && isCustomPage && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Ordre des sections</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Glissez-déposez ou utilisez les flèches pour réorganiser les sections de la page
                  </p>
                </div>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={sectionOrder}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {orderedSections.map((section, idx) => (
                        <SortableSectionItem
                          key={section.id}
                          section={section}
                          primaryColor={primaryColor}
                          index={idx}
                          total={orderedSections.length}
                          onMoveUp={() => handleMoveSection(idx, 'up')}
                          onMoveDown={() => handleMoveSection(idx, 'down')}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                <p className="text-[11px] text-gray-400 text-center">
                  L&apos;ordre sera appliqué sur le storefront après enregistrement
                </p>
              </div>
            )}

            {(isCustomPage ? orderedSections : pageSections).map((section) => {
              if (activeTab !== section.id) return null
              const sectionValues = sectionsData[section.id] || {}
              const showPageContentEditor = section.id === 'content'
                && isCustomPage
                && (sectionValues.contentSource || 'page') === 'page'

              const homeSectionData = homePageData?.sections?.[section.id]
              const syncWithOtherPages = homeSectionData?.syncWithOtherPages ?? true
              const isSyncedFromHome = section.syncFromPage === 'home'
                && pageData?.pageType !== 'home'
                && syncWithOtherPages === true

              const homePageId = homePageData?.id
              const enabledField = section.fields.find(f => f.key === 'enabled')
              const isEnabled = sectionValues.enabled ?? enabledField?.defaultValue ?? false

              return (
                <div key={section.id} className="space-y-5">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{section.label}</h3>
                    {section.description && (
                      <p className="text-sm text-gray-500 mt-1">{section.description}</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    {enabledField && (
                      <SectionField
                        key={enabledField.key}
                        field={enabledField}
                        value={getSectionFieldValue(section.id, enabledField.key, enabledField.defaultValue)}
                        onChange={(val) => updateSectionField(section.id, enabledField.key, val)}
                        primaryColor={primaryColor}
                        allValues={sectionsData[section.id] || {}}
                        sectionFields={section.fields}
                        menuItems={menuItems}
                      />
                    )}

                    {isEnabled && isSyncedFromHome ? (
                      <div 
                        className="rounded-xl border-2 border-dashed p-5 text-center"
                        style={{ borderColor: `${primaryColor}40`, backgroundColor: `${primaryColor}08` }}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${primaryColor}20` }}
                          >
                            <Home size={20} style={{ color: primaryColor }} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              Configuration synchronisée
                            </p>
                            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                              Cette section utilise la configuration de la page d&apos;accueil.
                            </p>
                          </div>
                          {homePageId && (
                            <Button
                              size="sm"
                              className="mt-1 rounded-lg text-white hover:opacity-90"
                              style={{ backgroundColor: primaryColor }}
                              onClick={() => router.push(`/restaurant/site/pages/${homePageId}?tab=${section.id}`)}
                            >
                              Modifier depuis la page d&apos;accueil
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        {section.fields.filter(f => f.key !== 'enabled').map((field) => (
                          <SectionField
                            key={field.key}
                            field={field}
                            value={getSectionFieldValue(section.id, field.key, field.defaultValue)}
                            onChange={(val) => updateSectionField(section.id, field.key, val)}
                            primaryColor={primaryColor}
                            allValues={sectionsData[section.id] || {}}
                            sectionFields={section.fields}
                            menuItems={menuItems}
                          />
                        ))}
                        {showPageContentEditor && (
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-700">Contenu de la page</Label>
                            <Textarea
                              value={content}
                              onChange={(e) => setContent(e.target.value)}
                              placeholder="Contenu de la page"
                              className="min-h-[160px] rounded-xl border-gray-200 text-sm resize-none focus:ring-2"
                              style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                            />
                            <p className="text-[11px] text-gray-400">Ce contenu est le même que dans l&apos;onglet Général</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
