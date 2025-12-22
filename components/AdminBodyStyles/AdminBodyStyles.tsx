'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export function AdminBodyStyles() {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin') ?? false

  useEffect(() => {
    if (isAdminRoute) {
      // Применяем стили для админ-панели
      document.body.style.margin = '0'
      document.body.style.padding = '0'
      // Не блокируем overflow, чтобы прокрутка работала
      document.body.style.width = '100%'
      document.body.style.height = '100%'
      document.documentElement.style.margin = '0'
      document.documentElement.style.padding = '0'
      document.documentElement.style.height = '100%'
    } else {
      // Сбрасываем стили для обычных страниц
      document.body.style.margin = ''
      document.body.style.padding = ''
      document.body.style.width = ''
      document.body.style.height = ''
      document.documentElement.style.margin = ''
      document.documentElement.style.padding = ''
      document.documentElement.style.height = ''
    }
  }, [isAdminRoute])

  return null
}

