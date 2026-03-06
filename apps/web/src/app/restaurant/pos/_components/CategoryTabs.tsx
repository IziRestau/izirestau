'use client'

import { cn } from '@/lib/utils'
import type { Category } from '@/types/menu'

interface CategoryTabsProps {
  categories: Category[]
  selectedCategoryId: string | null
  onSelectCategory: (categoryId: string | null) => void
  primaryColor: string
}

export function CategoryTabs({
  categories,
  selectedCategoryId,
  onSelectCategory,
  primaryColor,
}: CategoryTabsProps) {
  return (
    <div className="relative">
      <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-hide max-w-[calc(100vw-2rem)]">
        <button
          onClick={() => onSelectCategory(null)}
          className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
            selectedCategoryId === null
              ? 'text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          style={{
            backgroundColor: selectedCategoryId === null ? primaryColor : undefined,
          }}
        >
          Tous
        </button>
        
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              selectedCategoryId === category.id
                ? 'text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={{
              backgroundColor: selectedCategoryId === category.id ? primaryColor : undefined,
            }}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  )
}
