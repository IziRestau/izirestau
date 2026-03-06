'use client'

import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { api, apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  FolderTree,
  Package,
  GripVertical,
} from 'lucide-react'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import type { Category } from '@/types/menu'

interface CategoryListProps {
  categories: Category[]
  onEditCategory?: (category: Category) => void
  primaryColor: string
  canManage: boolean
  searchQuery?: string
}

export function CategoryList({
  categories,
  onEditCategory,
  primaryColor,
  canManage,
  searchQuery = '',
}: CategoryListProps) {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null)
  const [toggleConfirm, setToggleConfirm] = useState<Category | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const dragCounter = useRef(0)

  const toggleMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.categories.toggle(categoryId)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-categories'] })
      toast.success(data.data?.isActive ? 'Categorie activee' : 'Categorie desactivee')
      setToggleConfirm(null)
    },
    onError: () => {
      toast.error('Erreur lors de la modification')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.categories.delete(categoryId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-categories'] })
      toast.success('Categorie supprimee')
      setDeleteConfirm(null)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la suppression')
    },
  })

  const reorderMutation = useMutation({
    mutationFn: async (categoryIds: string[]) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.categories.reorder(categoryIds)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-categories'] })
      toast.success('Ordre mis a jour')
    },
    onError: () => {
      toast.error('Erreur lors du reordonnancement')
    },
  })

  const filteredCategories = searchQuery
    ? categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : categories
  const rootCategories = filteredCategories.filter(c => !c.parentId)

  const handleDragStart = (e: React.DragEvent, categoryId: string) => {
    setDraggedId(categoryId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', categoryId)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverId(null)
    dragCounter.current = 0
  }

  const handleDragEnter = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault()
    dragCounter.current++
    if (categoryId !== draggedId) {
      setDragOverId(categoryId)
    }
  }

  const handleDragLeave = () => {
    dragCounter.current--
    if (dragCounter.current === 0) {
      setDragOverId(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    setDragOverId(null)
    dragCounter.current = 0

    if (!draggedId || draggedId === targetId) return

    const currentOrder = rootCategories.map(c => c.id)
    const draggedIndex = currentOrder.indexOf(draggedId)
    const targetIndex = currentOrder.indexOf(targetId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newOrder = [...currentOrder]
    newOrder.splice(draggedIndex, 1)
    newOrder.splice(targetIndex, 0, draggedId)

    reorderMutation.mutate(newOrder)
    setDraggedId(null)
  }

  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <FolderTree size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune categorie</h3>
        <p className="text-sm text-gray-500 mb-4">
          Commencez par creer votre premiere categorie pour organiser vos produits.
        </p>
      </div>
    )
  }

  const renderCategory = (category: Category, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0
    const isDragging = draggedId === category.id
    const isDragOver = dragOverId === category.id

    return (
      <div key={category.id}>
        <div
          draggable={canManage && level === 0}
          onDragStart={(e) => handleDragStart(e, category.id)}
          onDragEnd={handleDragEnd}
          onDragEnter={(e) => handleDragEnter(e, category.id)}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, category.id)}
          className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white rounded-xl border transition-all ${
            !category.isActive ? 'opacity-60' : ''
          } ${isDragging ? 'opacity-50 scale-[0.98]' : ''} ${
            isDragOver ? 'border-2' : 'border-gray-100 hover:border-gray-200'
          }`}
          style={{ 
            marginLeft: level > 0 ? `${Math.min(level * 16, 32)}px` : 0,
            borderColor: isDragOver ? primaryColor : undefined,
          }}
        >
          {canManage && level === 0 && (
            <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400 hidden sm:block">
              <GripVertical size={18} />
            </div>
          )}

          <div
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden"
          >
            {category.image ? (
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <FolderTree size={20} className="text-gray-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-gray-900 truncate">{category.name}</h3>
              {!category.isActive && (
                <Badge variant="secondary" className="text-xs">
                  <EyeOff size={10} className="mr-1" />
                  Masquee
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1 flex-shrink-0">
                <Package size={14} />
                <span className="hidden sm:inline">{category.productsCount || 0} produit{(category.productsCount || 0) > 1 ? 's' : ''}</span>
                <span className="sm:hidden">{category.productsCount || 0}</span>
              </span>
              {category.description && (
                <span className="truncate max-w-[150px] sm:max-w-xs hidden sm:inline">{category.description}</span>
              )}
            </div>
          </div>

          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50">
                {onEditCategory && (
                  <DropdownMenuItem 
                    onClick={() => onEditCategory(category)}
                    className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                  >
                    <Edit size={14} className="mr-3 text-gray-400" />
                    <span className="text-[13px] text-gray-700">Modifier</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => setToggleConfirm(category)}
                  className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                >
                  {category.isActive ? (
                    <>
                      <EyeOff size={14} className="mr-3 text-gray-400" />
                      <span className="text-[13px] text-gray-700">Masquer</span>
                    </>
                  ) : (
                    <>
                      <Eye size={14} className="mr-3 text-gray-400" />
                      <span className="text-[13px] text-gray-700">Afficher</span>
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={() => setDeleteConfirm(category)}
                  className="rounded-lg px-3 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                  disabled={(category.productsCount || 0) > 0 || hasChildren}
                >
                  <Trash2 size={14} className="mr-3" />
                  <span className="text-[13px]">Supprimer</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {hasChildren && (
          <div className="mt-2 space-y-2">
            {category.children?.map(child => {
              const fullChild = categories.find(c => c.id === child.id)
              if (fullChild) {
                return renderCategory(fullChild, level + 1)
              }
              return null
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {rootCategories.map(category => renderCategory(category))}
      </div>

      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
        title="Supprimer la categorie"
        message={`Etes-vous sur de vouloir supprimer "${deleteConfirm?.name}" ? Cette action est irreversible.`}
        confirmText="Supprimer"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      <ConfirmModal
        isOpen={!!toggleConfirm}
        onClose={() => setToggleConfirm(null)}
        onConfirm={() => toggleConfirm && toggleMutation.mutate(toggleConfirm.id)}
        title={toggleConfirm?.isActive ? 'Masquer la categorie' : 'Afficher la categorie'}
        message={toggleConfirm?.isActive 
          ? `Etes-vous sur de vouloir masquer "${toggleConfirm?.name}" ? Elle ne sera plus visible sur le menu client.`
          : `Etes-vous sur de vouloir afficher "${toggleConfirm?.name}" ? Elle sera visible sur le menu client.`
        }
        confirmText={toggleConfirm?.isActive ? 'Masquer' : 'Afficher'}
        variant={toggleConfirm?.isActive ? 'warning' : 'info'}
        icon={toggleConfirm?.isActive ? 'pause' : 'play'}
        isLoading={toggleMutation.isPending}
      />
    </>
  )
}
