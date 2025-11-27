'use client'

import styles from './AdminHeader.module.scss'

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
)

interface AdminHeaderProps {
  user: {
    firstName: string
    lastName: string
  }
}

export function AdminHeader({ user }: AdminHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.search}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Поиск..."
            className={styles.searchInput}
          />
        </div>
        <div className={styles.headerActions}>
          <button className={styles.notificationButton} aria-label="Уведомления">
            <BellIcon />
            <span className={styles.badge}>3</span>
          </button>
          <div className={styles.userMenu}>
            <span className={styles.userGreeting}>
              Привет, {user.firstName}!
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

