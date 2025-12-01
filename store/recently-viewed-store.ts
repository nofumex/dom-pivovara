import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface RecentlyViewedStore {
  productIds: string[]
  add: (productId: string) => void
  getAll: () => string[]
  clear: () => void
  getRecent: (limit?: number) => string[]
}

const MAX_RECENT_ITEMS = 20 // Максимум товаров в истории
const DEFAULT_DISPLAY_LIMIT = 6 // Сколько показывать в футере

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      productIds: [],
      add: (productId) => {
        const currentIds = get().productIds
        // Удаляем товар, если он уже есть (чтобы переместить в начало)
        const filteredIds = currentIds.filter((id) => id !== productId)
        // Добавляем в начало
        const newIds = [productId, ...filteredIds].slice(0, MAX_RECENT_ITEMS)
        set({ productIds: newIds })
      },
      getAll: () => {
        return get().productIds
      },
      getRecent: (limit = DEFAULT_DISPLAY_LIMIT) => {
        return get().productIds.slice(0, limit)
      },
      clear: () => {
        set({ productIds: [] })
      },
    }),
    {
      name: 'recently-viewed-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)


