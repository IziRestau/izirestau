import { create } from 'zustand'
import { api, apiClient } from '@/lib/api-client'

const STORAGE_KEY = 'iziresto_current_restaurant_id'

interface Restaurant {
  id: string
  name: string
  description: string | null
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
  country: string
  logo: string | null
  coverImage: string | null
  businessType: string
  cuisineTypes: string[]
}

interface Organization {
  id: string
  name: string
  slug: string
  logo: string | null
  primaryColor: string
  currency: string
}

interface Site {
  id: string
  subdomain: string
  customDomain: string | null
  status: string
}

interface Staff {
  id: string
  role: string
  permissions: string[]
  position: string | null
}

interface Settings {
  currency: string
  language: string
  timezone: string
}

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

interface RestaurantState {
  restaurant: Restaurant | null
  organization: Organization | null
  site: Site | null
  staff: Staff | null
  settings: Settings | null
  restaurants: RestaurantSummary[]
  currentRestaurantId: string | null
  isLoading: boolean
  isLoaded: boolean
  isLoadingList: boolean
  isSwitching: boolean
  switchingToName: string | null
  error: string | null
  fetchMyRestaurants: (accessToken: string) => Promise<void>
  fetchRestaurant: (accessToken: string, restaurantId?: string) => Promise<void>
  switchRestaurant: (accessToken: string, restaurantId: string) => Promise<void>
  reset: () => void
}

export const useRestaurantStore = create<RestaurantState>((set, get) => ({
  restaurant: null,
  organization: null,
  site: null,
  staff: null,
  settings: null,
  restaurants: [],
  currentRestaurantId: null,
  isLoading: false,
  isLoaded: false,
  isLoadingList: false,
  isSwitching: false,
  switchingToName: null,
  error: null,

  fetchMyRestaurants: async (accessToken: string) => {
    if (get().isLoadingList) return
    
    set({ isLoadingList: true })
    
    try {
      apiClient.setAccessToken(accessToken)
      const response = await api.restaurant.getMyRestaurants()
      
      if (response.success && response.data) {
        const restaurants = response.data as RestaurantSummary[]
        set({ restaurants, isLoadingList: false })
        
        // Si on a des restaurants et pas de restaurant actuel, sélectionner le bon
        if (restaurants.length > 0 && !get().currentRestaurantId) {
          const savedId = typeof window !== 'undefined' 
            ? localStorage.getItem(STORAGE_KEY) 
            : null
          const targetId = savedId && restaurants.find(r => r.id === savedId)
            ? savedId
            : restaurants[0].id
          
          // Charger le restaurant sélectionné
          await get().fetchRestaurant(accessToken, targetId)
        }
      } else {
        set({ isLoadingList: false })
      }
    } catch (error) {
      set({ isLoadingList: false })
    }
  },

  fetchRestaurant: async (accessToken: string, restaurantId?: string) => {
    if (get().isLoading) return
    
    set({ isLoading: true, error: null })
    
    try {
      apiClient.setAccessToken(accessToken)
      const response = await api.restaurant.getMe(restaurantId)
      
      if (response.success && response.data) {
        const newRestaurantId = response.data.restaurant.id
        
        // Sauvegarder en localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, newRestaurantId)
        }
        
        set({
          restaurant: response.data.restaurant,
          organization: response.data.organization,
          site: response.data.site,
          staff: response.data.staff,
          settings: response.data.settings,
          currentRestaurantId: newRestaurantId,
          isLoading: false,
          isLoaded: true,
        })
      } else {
        set({
          isLoading: false,
          error: response.error || 'Erreur lors du chargement',
        })
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      })
    }
  },

  switchRestaurant: async (accessToken: string, restaurantId: string) => {
    // Trouver le nom du restaurant cible
    const targetRestaurant = get().restaurants.find(r => r.id === restaurantId)
    
    // Afficher l'overlay de transition
    set({
      isSwitching: true,
      switchingToName: targetRestaurant?.name || null,
    })
    
    // Petit délai pour l'animation
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Reset les données actuelles avant de charger le nouveau restaurant
    set({
      restaurant: null,
      organization: null,
      site: null,
      staff: null,
      settings: null,
      isLoaded: false,
    })
    
    await get().fetchRestaurant(accessToken, restaurantId)
    
    // Masquer l'overlay après le chargement
    set({
      isSwitching: false,
      switchingToName: null,
    })
  },

  reset: () => {
    set({
      restaurant: null,
      organization: null,
      site: null,
      staff: null,
      settings: null,
      restaurants: [],
      currentRestaurantId: null,
      isLoading: false,
      isLoaded: false,
      isLoadingList: false,
      error: null,
    })
  },
}))
