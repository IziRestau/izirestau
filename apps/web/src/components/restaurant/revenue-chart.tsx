'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { BarChart3 } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface ChartDataPoint {
  month: string
  value: number
}

interface RevenueChartProps {
  totalRevenue?: number
  formattedRevenue?: string
  chartData?: ChartDataPoint[]
  formatValue?: (value: number) => string
  primaryColor?: string
}

const defaultData: ChartDataPoint[] = [
  { month: 'Jan', value: 0 },
  { month: 'Fev', value: 0 },
  { month: 'Mar', value: 0 },
]

export function RevenueChart({ 
  totalRevenue = 0, 
  formattedRevenue,
  chartData = defaultData,
  formatValue,
  primaryColor = '#f87171',
}: RevenueChartProps) {
  const data = chartData.length > 0 ? chartData : defaultData
  const displayRevenue = formattedRevenue || `${totalRevenue.toLocaleString()}`
  const [activeTab, setActiveTab] = useState<'monthly' | 'weekly' | 'today'>('monthly')
  const [activeCategory, setActiveCategory] = useState<'all' | 'food' | 'beverages'>('all')

  const tabs = [
    { key: 'monthly', label: 'Mois' },
    { key: 'weekly', label: 'Semaine' },
    { key: 'today', label: 'Jour' },
  ] as const

  const categories = [
    { key: 'all', label: 'Tout' },
    { key: 'food', label: 'Plats' },
    { key: 'beverages', label: 'Boissons' },
  ] as const

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Revenus</h3>
          <p className="text-xs text-gray-400 mt-0.5">Evolution des ventes</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                activeTab === tab.key
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-700"
              )}
              style={activeTab === tab.key ? { backgroundColor: primaryColor } : undefined}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5" style={{ color: primaryColor }} />
        <span className="text-2xl font-bold text-gray-900">
          {displayRevenue}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-full transition-all",
              activeCategory === cat.key
                ? "text-white"
                : "bg-gray-100 text-gray-500 hover:text-gray-700"
            )}
            style={activeCategory === cat.key ? { backgroundColor: primaryColor } : undefined}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#9ca3af' }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e2128', 
                border: 'none', 
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px'
              }}
              formatter={(value: number) => [formatValue ? formatValue(value) : value.toLocaleString(), 'Revenus']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={primaryColor}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
