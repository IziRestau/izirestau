'use client'

import { ReactNode } from 'react'

interface Column<T> {
  key: string
  header: string
  render: (item: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  emptyState?: ReactNode
  isLoading?: boolean
}

export function DataTable<T>({ 
  columns, 
  data, 
  keyExtractor,
  emptyState,
  isLoading 
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  if (data.length === 0 && emptyState) {
    return (
      <div className="bg-white rounded-2xl">
        {emptyState}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {columns.map((col) => (
                <th 
                  key={col.key}
                  className={`text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr 
                key={keyExtractor(item)} 
                className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className={`py-4 px-6 ${col.className || ''}`}>
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
