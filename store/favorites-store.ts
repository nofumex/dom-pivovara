import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface FavoritesStore {
  productIds: string[]
  add: (productId: string) => void
  remove: (productId: string) => void
  toggle: (productId: string) => void
  has: (productId: string) => boolean
  getAll: () => string[]
  clear: () => void
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      productIds: [],
      add: (productId) => {
        if (!get().has(productId)) {
          set({ productIds: [...get().productIds, productId] })
        }
      },
      remove: (productId) => {
        set({ productIds: get().productIds.filter((id) => id !== productId) })
      },
      toggle: (productId) => {
        if (get().has(productId)) {
          get().remove(productId)
        } else {
          get().add(productId)
        }
      },
      has: (productId) => {
        return get().productIds.includes(productId)
      },
      getAll: () => {
        return get().productIds
      },
      clear: () => {
        set({ productIds: [] })
      },
    }),
    {
      name: 'favorites-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

