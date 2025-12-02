'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface TokenRefresherProps {
  needsRefresh: boolean
}

export function TokenRefresher({ needsRefresh }: TokenRefresherProps) {
  const router = useRouter()

  useEffect(() => {
    if (needsRefresh) {
      // Вызываем API route для обновления токенов
      fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            // Обновляем страницу после успешного обновления токенов
            router.refresh()
          } else {
            // Если обновление не удалось, редиректим на логин
            router.push('/login')
          }
        })
        .catch((error) => {
          console.error('Error refreshing token:', error)
          router.push('/login')
        })
    }
  }, [needsRefresh, router])

  return null
}




