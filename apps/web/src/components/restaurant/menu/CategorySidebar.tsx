'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  FolderTree,
  Plus,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import type { Category } from '@/types/menu'

interface CategorySidebarProps {
  categories: Category[]
  selectedCategoryId: string | null
  onSelectCategory: (categoryId: string | null) => void
  onAddCategory?: () => void
  primaryColor: string
  isLoading?: boolean
}

export function CategorySidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  primaryColor,
  isLoading,
}: CategorySidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const rootCategories = categories.filter(c => !c.parentId)

  const renderCategory = (category: Category, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0
    const isExpanded = expandedCategories.has(category.id)
    const isSelected = selectedCategoryId === category.id

    return (
      <div key={category.id}>
        <button
          onClick={() => onSelectCategory(category.id)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
            isSelected
              ? 'font-medium'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          style={{
            paddingLeft: `${12 + level * 16}px`,
            backgroundColor: isSelected ? `${primaryColor}15` : undefined,
            color: isSelected ? primaryColor : undefined,
          }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(category.id)
              }}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              <ChevronRight
                size={14}
                className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              />
            </button>
          )}
          {!hasChildren && <span className="w-5" />}
          <span className="flex-1 truncate">{category.name}</span>
          <span className="text-xs text-gray-400">{category.productsCount}</span>
        </button>

        {hasChildren && isExpanded && (
          <div>
            {category.children?.map(child => {
              const fullChild = categories.find(c => c.id === child.id)
              if (fullChild) {
                return renderCategory(fullChild, level + 1)
              }
              return (
                <button
                  key={child.id}
                  onClick={() => onSelectCategory(child.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                    selectedCategoryId === child.id
                      ? 'font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  style={{
                    paddingLeft: `${12 + (level + 1) * 16}px`,
                    backgroundColor: selectedCategoryId === child.id ? `${primaryColor}15` : undefined,
                    color: selectedCategoryId === child.id ? primaryColor : undefined,
                  }}
                >
                  <span className="w-5" />
                  <span className="flex-1 truncate">{child.name}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderTree size={18} className="text-gray-500" />
            <span className="font-medium text-gray-900">Categories</span>
          </div>
          {onAddCategory && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddCategory}
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <Plus size={16} />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-320px)]">
        <div className="p-2">
          <button
            onClick={() => onSelectCategory(null)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
              selectedCategoryId === null
                ? 'font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            style={{
              backgroundColor: selectedCategoryId === null ? `${primaryColor}15` : undefined,
              color: selectedCategoryId === null ? primaryColor : undefined,
            }}
          >
            <span className="w-5" />
            <span className="flex-1">Tous les produits</span>
            <span className="text-xs text-gray-400">
              {categories.reduce((acc, c) => acc + (c.productsCount || 0), 0)}
            </span>
          </button>

          {rootCategories.map(category => renderCategory(category))}
        </div>
      </ScrollArea>
    </div>
  )
}
