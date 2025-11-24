'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CallbackModal } from '@/components/molecules/CallbackModal/CallbackModal'
import { PhoneIcon } from '@/components/atoms/Icons/PhoneIcon'
import { SearchIcon } from '@/components/atoms/Icons/SearchIcon'
import { MenuIcon } from '@/components/atoms/Icons/MenuIcon'
import { ChevronDownIcon } from '@/components/atoms/Icons/ChevronDownIcon'
import styles from './Header.module.scss'

// Список всех категорий
const allCategories = [
  { name: 'Пивоварение', slug: 'pivovareniye' },
  { name: 'Самогоноварение', slug: 'samogonovarenie' },
  { name: 'Виноделие', slug: 'vinodeliye' },
  { name: 'Шланги, соединения', slug: 'shlangi-soedineniya' },
  { name: 'Тара и ёмкости', slug: 'tara-emkosti' },
  { name: 'Бондарные изделия', slug: 'bondarnye-izdeliya' },
  { name: 'Казаны, тандыры, мангалы, печи, посуда', slug: 'kazany-tandyry-mangaly-pechi-posuda' },
  { name: 'Всё для изготовления колбас', slug: 'vse-dlya-izgotovleniya-kolbas' },
  { name: 'Сыроделие', slug: 'syrodelie' },
  { name: 'Измерительное оборудование', slug: 'izmeritelnoe-oborudovanie' },
  { name: 'Автоклавы и коптильни', slug: 'avtoklavy-koptilni' },
  { name: 'Хлеб и квас', slug: 'hleb-kvas' },
  { name: 'Травы и специи', slug: 'travy-specii' },
  { name: 'Литература', slug: 'literatura' },
]

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
        <div className={styles.top}>
          <Link href="/" className={styles.logo}>
            <div className={styles.logoIcon}>
              <div className={styles.logoBarrel}></div>
            </div>
            <h1 className={styles.logoText}>ДомПивовар</h1>
          </Link>
          <form className={styles.search} onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Поиск по товарам"
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className={styles.searchButton} aria-label="Поиск">
              <SearchIcon />
            </button>
          </form>
          <div className={styles.phone}>
            <div className={styles.phoneIcon}>
              <PhoneIcon />
            </div>
            <div>
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
        </div>
        <nav className={styles.nav}>
          <Link
            href="/catalog"
            className={styles.navItem}
            data-catalog-button
          >
            <span className={styles.catalogIcon}>
              <MenuIcon />
            </span>
            КАТАЛОГ
            <span className={styles.catalogArrow}>
              <ChevronDownIcon />
            </span>
          </Link>
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
    </header>

    <CallbackModal
      isOpen={isCallbackModalOpen}
      onClose={() => setIsCallbackModalOpen(false)}
    />
    </>
  )
}

