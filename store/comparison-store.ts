import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface ComparisonStore {
  productIds: string[]
  add: (productId: string) => boolean
  remove: (productId: string) => void
  toggle: (productId: string) => boolean
  has: (productId: string) => boolean
  getAll: () => string[]
  clear: () => void
  getCount: () => number
}

const MAX_COMPARISON_ITEMS = 4

export const useComparisonStore = create<ComparisonStore>()(
  persist(
    (set, get) => ({
      productIds: [],
      add: (productId) => {
        if (get().productIds.length >= MAX_COMPARISON_ITEMS) {
          return false
        }
        if (!get().has(productId)) {
          set({ productIds: [...get().productIds, productId] })
        }
        return true
      },
      remove: (productId) => {
        set({ productIds: get().productIds.filter((id) => id !== productId) })
      },
      toggle: (productId) => {
        if (get().has(productId)) {
          get().remove(productId)
          return true
        } else {
          return get().add(productId)
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
      getCount: () => {
        return get().productIds.length
      },
    }),
    {
      name: 'comparison-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)




