'use client'

interface TrendingItem {
  id: string
  name: string
  description: string
  image?: string
}

interface DailyTrendingProps {
  items?: TrendingItem[]
}

const defaultItems: TrendingItem[] = [
  { id: '1', name: 'Spicy Noodles', description: 'Lorem ipsum dolor' },
  { id: '2', name: 'Grilled Chicken', description: 'Lorem ipsum dolor' },
  { id: '3', name: 'Caesar Salad', description: 'Lorem ipsum dolor' },
]

export function DailyTrending({ items = defaultItems }: DailyTrendingProps) {
  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Produits populaires</h3>
        <p className="text-xs text-gray-400">Les plus commandes</p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-rose-100 to-rose-200" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 text-sm">{item.name}</div>
              <div className="text-xs text-gray-400 truncate">{item.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
