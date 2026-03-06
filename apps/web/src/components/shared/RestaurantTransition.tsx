'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RestaurantTransitionProps {
  isTransitioning: boolean
  restaurantName?: string
  primaryColor?: string
}

export function RestaurantTransition({ 
  isTransitioning, 
  restaurantName,
  primaryColor = '#10b981' 
}: RestaurantTransitionProps) {
  const [show, setShow] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isTransitioning) {
      setShow(true)
      requestAnimationFrame(() => {
        setVisible(true)
      })
    } else {
      setVisible(false)
      const timer = setTimeout(() => {
        setShow(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isTransitioning])

  if (!show) return null

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-white/95 backdrop-blur-sm transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0"
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <Loader2 
            size={32} 
            className="animate-spin"
            style={{ color: primaryColor }}
          />
        </div>
        {restaurantName && (
          <div className="text-center">
            <p className="text-sm text-gray-500">Chargement de</p>
            <p className="text-lg font-semibold text-gray-900">{restaurantName}</p>
          </div>
        )}
      </div>
    </div>
  )
}
