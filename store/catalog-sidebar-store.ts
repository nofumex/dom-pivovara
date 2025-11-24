import { create } from 'zustand'

interface CatalogSidebarStore {
  isOpen: boolean
  toggle: () => void
  setOpen: (open: boolean) => void
}

export const useCatalogSidebarStore = create<CatalogSidebarStore>((set) => ({
  isOpen: true, // По умолчанию открыт
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpen: (open: boolean) => set({ isOpen: open }),
}))

