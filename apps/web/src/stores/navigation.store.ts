import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface NavigationState {
  history: string[]
  maxHistory: number
  push: (path: string) => void
  goBack: () => string | null
  canGoBack: () => boolean
  clear: () => void
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set, get) => ({
      history: [],
      maxHistory: 50,

      push: (path: string) => {
        const { history, maxHistory } = get()
        const lastPath = history[history.length - 1]
        
        if (lastPath === path) return
        
        const newHistory = [...history, path].slice(-maxHistory)
        set({ history: newHistory })
      },

      goBack: () => {
        const { history } = get()
        if (history.length < 2) return null
        
        const newHistory = history.slice(0, -1)
        const previousPath = newHistory[newHistory.length - 1]
        set({ history: newHistory })
        
        return previousPath
      },

      canGoBack: () => {
        return get().history.length > 1
      },

      clear: () => {
        set({ history: [] })
      },
    }),
    {
      name: 'navigation-history',
    }
  )
)
