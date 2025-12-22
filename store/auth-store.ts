import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  phone?: string | null
  company?: string | null
}

interface AuthStore {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  hydrated: boolean
  authChecked: boolean
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  setHydrated: (value: boolean) => void
  setAuthChecked: (value: boolean) => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      hydrated: false,
      authChecked: false,
      setAuth: (user, accessToken, refreshToken) => {
        set({ user, accessToken, refreshToken })
      },
      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken })
      },
      clearAuth: () => {
        set({ user: null, accessToken: null, refreshToken: null })
      },
      setHydrated: (value) => {
        set({ hydrated: value })
      },
      setAuthChecked: (value) => {
        set({ authChecked: value })
      },
      isAuthenticated: () => {
        return get().user !== null && get().accessToken !== null
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)











