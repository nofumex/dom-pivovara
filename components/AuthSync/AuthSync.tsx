'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'

export function AuthSync() {
  const setAuth = useAuthStore((state) => state.setAuth)
  const user = useAuthStore((state) => state.user)
  const setAuthChecked = useAuthStore((state) => state.setAuthChecked)
  const hydrated = useAuthStore((state) => state.hydrated)

  useEffect(() => {
    if (!hydrated) return

    // Проверяем авторизацию при монтировании компонента
    const checkAuth = async () => {
      try {
        let response = await fetch('/api/auth/me', {
          credentials: 'include',
        })
        let data = await response.json()

        // Если accessToken истёк или не найден, пытаемся обновить по refreshToken
        if (!data.success) {
          const refreshResponse = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
          })

          const refreshData = await refreshResponse.json()

          if (refreshData.success && refreshData.data?.accessToken) {
            const currentState = useAuthStore.getState()
            // Обновляем только токены в стораже
            useAuthStore
              .getState()
              .setTokens(refreshData.data.accessToken, currentState.refreshToken || '')

            // После успешного refresh ещё раз запрашиваем /me
            response = await fetch('/api/auth/me', {
              credentials: 'include',
            })
            data = await response.json()
          }
        }

        if (data.success && data.data) {
          const currentState = useAuthStore.getState()
          // Обновляем состояние только если пользователь изменился или не был установлен
          if (!currentState.user || currentState.user.id !== data.data.id) {
            setAuth(
              data.data,
              currentState.accessToken || '',
              currentState.refreshToken || ''
            )
          }
        } else {
          // Если пользователь не авторизован даже после refresh, очищаем состояние
          if (user) {
            useAuthStore.getState().clearAuth()
          }
        }
      } catch (error) {
        console.error('Error syncing auth:', error)
      } finally {
        setAuthChecked(true)
      }
    }

    checkAuth()

    // Проверяем авторизацию каждые 5 минут (достаточно редко)
    const interval = setInterval(checkAuth, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [setAuth, setAuthChecked, hydrated, user])

  return null
}


