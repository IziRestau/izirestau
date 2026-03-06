'use client'

import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RestaurantSummary {
  id: string
  name: string
  logo: string | null
  address: string
  city: string
  role: string
  organization: {
    id: string
    name: string
    primaryColor: string
  } | null
}

interface RestaurantSwitcherProps {
  restaurants: RestaurantSummary[]
  currentRestaurantId: string | null
  onSwitch: (restaurantId: string) => void
  isCollapsed?: boolean
  primaryColor?: string
}

export function RestaurantSwitcher({
  restaurants,
  currentRestaurantId,
  onSwitch,
  isCollapsed = false,
  primaryColor = '#10b981',
}: RestaurantSwitcherProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const currentRestaurant = restaurants.find(r => r.id === currentRestaurantId)
  const hasMultipleRestaurants = restaurants.length > 1
  const otherRestaurants = restaurants.filter(r => r.id !== currentRestaurantId)

  if (!currentRestaurant) {
    return null
  }

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase()
  }

  const handleSwitch = (restaurantId: string) => {
    onSwitch(restaurantId)
    setIsExpanded(false)
  }

  // Sidebar collapsed
  if (isCollapsed) {
    return currentRestaurant.logo ? (
      <img 
        src={currentRestaurant.logo} 
        alt={currentRestaurant.name}
        className="w-10 h-10 rounded-lg object-cover"
      />
    ) : (
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: primaryColor }}
      >
        <span className="text-white font-bold text-sm">
          {getInitials(currentRestaurant.name)}
        </span>
      </div>
    )
  }

  // Sidebar expanded - carte inline qui s'étend en bas
  return (
    <div className="w-full bg-white/5 rounded-xl overflow-hidden">
      <button 
        onClick={() => hasMultipleRestaurants && setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center gap-3 w-full text-left p-3",
          hasMultipleRestaurants && "cursor-pointer hover:bg-white/5"
        )}
      >
        {currentRestaurant.logo ? (
          <img 
            src={currentRestaurant.logo} 
            alt={currentRestaurant.name}
            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
            <span className="text-white font-bold text-sm">
              {getInitials(currentRestaurant.name)}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">
            {currentRestaurant.name}
          </p>
          <p className="text-white/50 text-xs truncate">
            {currentRestaurant.city}
          </p>
        </div>
        {hasMultipleRestaurants && (
          <ChevronDown 
            size={16} 
            className={cn(
              "text-white/40 transition-transform flex-shrink-0",
              isExpanded && "rotate-180"
            )}
          />
        )}
      </button>

      <div 
        className={cn(
          "grid transition-all duration-200 ease-out",
          hasMultipleRestaurants && isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-white/10 p-2 space-y-1">
            {otherRestaurants.map((restaurant) => (
              <button
                key={restaurant.id}
                onClick={() => handleSwitch(restaurant.id)}
                className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-colors text-left"
              >
                {restaurant.logo ? (
                  <img 
                    src={restaurant.logo} 
                    alt={restaurant.name}
                    className="w-8 h-8 rounded-md object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 bg-white/10">
                    <span className="font-semibold text-xs text-white/60">
                      {getInitials(restaurant.name)}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">
                    {restaurant.name}
                  </p>
                  <p className="text-xs text-white/40 truncate">
                    {restaurant.city}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
