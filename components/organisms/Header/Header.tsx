'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CallbackModal } from '@/components/molecules/CallbackModal/CallbackModal'
import styles from './Header.module.scss'

export function Header() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isCallbackModalOpen, setIsCallbackModalOpen] = useState(false)
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <>
      <header className={styles.header}>
      <div className="container">
        <div className={styles.top}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}></div>
            <h1 className={styles.logoText}>ДомПивовар</h1>
          </div>
          <form className={styles.search} onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Поиск по товарам"
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className={styles.searchButton} aria-label="Поиск">
              🔍
            </button>
          </form>
          <div className={styles.phone}>
            <div className={styles.phoneIcon}></div>
            <div className={styles.phoneNumbers}>
              <div>+7 913 555-222-6</div>
              <div>+7 913 037-32-47</div>
            </div>
            <button
              onClick={() => setIsCallbackModalOpen(true)}
              className={styles.callbackLink}
            >
              ЗАКАЗАТЬ ЗВОНОК
            </button>
          </div>
        </div>
        <nav className={styles.nav}>
          <button
            className={styles.navItem}
            onClick={() => {
              const event = new CustomEvent('toggle-catalog')
              window.dispatchEvent(event)
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ☰ КАТАЛОГ
          </button>
          <Link href="/about" className={styles.navItem}>
            О КОМПАНИИ
          </Link>
          <Link href="/sales" className={styles.navItem}>
            АКЦИИ
          </Link>
          <Link href="/stores" className={styles.navItem}>
            МАГАЗИНЫ
          </Link>
          <Link href="/articles" className={styles.navItem}>
            СТАТЬИ
          </Link>
          <Link href="/delivery" className={styles.navItem}>
            ДОСТАВКА И ОПЛАТА
          </Link>
          <Link href="/contacts" className={styles.navItem}>
            КОНТАКТЫ
          </Link>
        </nav>
      </div>
    </header>

    <CallbackModal
      isOpen={isCallbackModalOpen}
      onClose={() => setIsCallbackModalOpen(false)}
    />
    </>
  )
}

