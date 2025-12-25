'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import styles from './AdminMobileHeader.module.scss'

interface AdminMobileHeaderProps {
  user?: {
    firstName?: string
    lastName?: string
    email?: string
  } | null
}

export function AdminMobileHeader({ user }: AdminMobileHeaderProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const menuItems = [
    { href: '/admin', label: 'Панель управления' },
    { href: '/admin/products', label: 'Товары' },
    { href: '/admin/orders', label: 'Заказы' },
    { href: '/admin/categories', label: 'Категории' },
    { href: '/admin/customers', label: 'Клиенты' },
    { href: '/admin/leads', label: 'Заявки' },
    { href: '/admin/newsletter', label: 'Email рассылка' },
    { href: '/admin/analytics', label: 'Аналитика' },
    { href: '/admin/import-export', label: 'Импорт/Экспорт' },
    { href: '/admin/settings', label: 'Настройки' },
  ]

  const initialsRaw = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.trim()
  const initials = initialsRaw || 'АС'

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      document.cookie = 'accessToken=; path=/; max-age=0'
      document.cookie = 'refreshToken=; path=/; max-age=0'
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/login')
    }
  }

  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <button
          type="button"
          className={styles.burger}
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Открыть меню"
          aria-expanded={open}
        >
          ☰
        </button>
        <div className={styles.title}>Админ-панель</div>
      </div>
      <div className={styles.right}>Дом Пивовара</div>

      {open && (
        <div className={styles.dropdown}>
          <nav className={styles.menu}>
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href} className={styles.dropdownItem}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className={styles.userSection}>
            <div className={styles.userRow}>
              <div className={styles.avatar}>{initials}</div>
              <div className={styles.userText}>
                <div className={styles.userName}>
                  {user?.firstName} {user?.lastName}
                </div>
                <div className={styles.userEmail}>{user?.email}</div>
              </div>
            </div>

            <div className={styles.actions}>
              <Link href="/" className={styles.actionLink}>
                На сайт
              </Link>
              <button type="button" onClick={handleLogout} className={styles.logoutButton}>
                Выйти
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

