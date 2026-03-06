'use client'

import { useState } from 'react'
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
  Settings2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { MODIFIER_TYPE_LABELS } from '@/types/menu'
import type { ModifierGroup } from '@/types/menu'

interface ModifierGroupListProps {
  modifierGroups: ModifierGroup[]
  onEditGroup: (group: ModifierGroup) => void
  formatPrice: (value: number) => string
  primaryColor: string
  searchQuery?: string
}

export function ModifierGroupList({
  modifierGroups,
  onEditGroup,
  formatPrice,
  primaryColor,
  searchQuery = '',
}: ModifierGroupListProps) {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const [deleteConfirm, setDeleteConfirm] = useState<ModifierGroup | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const toggleExpanded = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  const toggleMutation = useMutation({
    mutationFn: async (groupId: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.modifiers.toggle(groupId)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-modifiers'] })
      toast.success(data.data?.isActive ? 'Groupe active' : 'Groupe desactive')
    },
    onError: () => {
      toast.error('Erreur lors de la modification')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (groupId: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.modifiers.delete(groupId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-modifiers'] })
      toast.success('Groupe supprime')
      setDeleteConfirm(null)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la suppression')
    },
  })

  const filteredGroups = searchQuery
    ? modifierGroups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : modifierGroups

  if (filteredGroups.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <Settings2 size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {searchQuery ? 'Aucun resultat' : "Aucun groupe d'options"}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {searchQuery 
            ? `Aucun groupe d'options ne correspond a "${searchQuery}".`
            : "Les groupes d'options permettent d'ajouter des supplements ou des choix a vos produits."
          }
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {filteredGroups.map(group => {
          const isExpanded = expandedGroups.has(group.id)

          return (
            <div
              key={group.id}
              className={`bg-white rounded-xl border border-gray-100 overflow-hidden ${
                !group.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4">
                <button
                  onClick={() => toggleExpanded(group.id)}
                  className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
                >
                  {isExpanded ? (
                    <ChevronUp size={18} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-400" />
                  )}
                </button>

                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <Settings2 size={16} className="sm:hidden" style={{ color: primaryColor }} />
                  <Settings2 size={18} className="hidden sm:block" style={{ color: primaryColor }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-gray-900 truncate">{group.name}</h3>
                    <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                      {MODIFIER_TYPE_LABELS[group.type]}
                    </Badge>
                    {group.isRequired && (
                      <Badge className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-100">
                        Oblig.
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {group.modifiers.length} option{group.modifiers.length > 1 ? 's' : ''}
                    {group.productsCount !== undefined && group.productsCount > 0 && (
                      <span className="ml-2 hidden sm:inline">
                        • {group.productsCount} produit{group.productsCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50">
                    <DropdownMenuItem 
                      onClick={() => onEditGroup(group)}
                      className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                    >
                      <Edit size={14} className="mr-3 text-gray-400" />
                      <span className="text-[13px] text-gray-700">Modifier</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => toggleMutation.mutate(group.id)}
                      className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                    >
                      {group.isActive ? (
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
                      onClick={() => setDeleteConfirm(group)}
                      className="rounded-lg px-3 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                      disabled={(group.productsCount || 0) > 0}
                    >
                      <Trash2 size={14} className="mr-3" />
                      <span className="text-[13px]">Supprimer</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {isExpanded && group.modifiers.length > 0 && (
                <div className="border-t border-gray-100 bg-gray-50 p-3 sm:p-4">
                  <div className="space-y-2">
                    {group.modifiers.map(modifier => (
                      <div
                        key={modifier.id}
                        className={`flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg sm:rounded-xl border border-gray-100 ${
                          !modifier.isActive ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium text-gray-900 truncate">{modifier.name}</span>
                          {modifier.isDefault && (
                            <Badge variant="outline" className="text-xs flex-shrink-0 hidden sm:inline-flex">
                              Defaut
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm font-medium flex-shrink-0 ml-2" style={{ color: primaryColor }}>
                          {modifier.price > 0 ? `+${formatPrice(modifier.price)}` : 'Gratuit'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
        title="Supprimer le groupe"
        message={`Etes-vous sur de vouloir supprimer "${deleteConfirm?.name}" ? Cette action est irreversible.`}
        confirmText="Supprimer"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}
