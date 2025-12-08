'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { CallbackModal } from '@/components/molecules/CallbackModal/CallbackModal'
import { PhoneIcon } from '@/components/atoms/Icons/PhoneIcon'
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

interface AutocompleteProduct {
  id: string
  title: string
  slug: string
  price: number
  oldPrice: number | null
  image: string | null
  currency: string
}

export function Header() {
  const [searchQuery, setSearchQuery] = useState('')
  const [autocompleteProducts, setAutocompleteProducts] = useState<AutocompleteProduct[]>([])
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCallbackModalOpen, setIsCallbackModalOpen] = useState(false)
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0, width: 0 })
  const router = useRouter()
  const pathname = usePathname()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchWrapperRef = useRef<HTMLDivElement>(null)
  const autocompleteRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Функция для поиска товаров с debounce
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (searchQuery.trim().length < 2) {
      setAutocompleteProducts([])
      setIsAutocompleteOpen(false)
      return
    }

    setIsLoading(true)
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(searchQuery.trim())}`)
        const data = await response.json()
        setAutocompleteProducts(data.products || [])
        setIsAutocompleteOpen(data.products && data.products.length > 0)
      } catch (error) {
        console.error('Error fetching autocomplete:', error)
        setAutocompleteProducts([])
        setIsAutocompleteOpen(false)
      } finally {
        setIsLoading(false)
      }
    }, 300) // Debounce 300ms

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchQuery])

  // Обновляем позицию выпадающего списка
  useEffect(() => {
    const updatePosition = () => {
      if (searchWrapperRef.current) {
        const rect = searchWrapperRef.current.getBoundingClientRect()
        setAutocompletePosition({
          top: rect.bottom,
          left: rect.left,
          width: rect.width,
        })
      }
    }

    if (isAutocompleteOpen) {
      updatePosition()
      const handleScroll = () => updatePosition()
      const handleResize = () => updatePosition()
      
      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleResize)
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true)
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [isAutocompleteOpen])

  // Закрываем автодополнение при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node) &&
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(event.target as Node)
      ) {
        setIsAutocompleteOpen(false)
      }
    }

    if (isAutocompleteOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isAutocompleteOpen])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setIsAutocompleteOpen(false)
    if (searchQuery.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleProductClick = (slug: string) => {
    setIsAutocompleteOpen(false)
    setSearchQuery('')
    router.push(`/product/${slug}`)
  }

  const handleShowAllResults = () => {
    setIsAutocompleteOpen(false)
    if (searchQuery.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const formatPrice = (price: number, currency: string = 'RUB') => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(price)
      .replace(/\s/g, ' ')
  }

  const isActivePath = (href: string, exact = false) => {
    if (href === '/') return false
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <>
      <header className={styles.header}>
        <div className={styles.top}>
          <Link href="/" className={styles.logo}>
            <div className={styles.logoIcon}>
              <img 
                src="/images/logoPivovar.png" 
                alt="ДомПивовар" 
                className={styles.logoImage}
              />
            </div>
            <h1 className={styles.logoText}>ДомПивовар</h1>
          </Link>
          <div ref={searchWrapperRef} className={styles.searchWrapper}>
            <form className={styles.search} onSubmit={handleSearch}>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Поиск по товарам"
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  if (e.target.value.trim().length >= 2) {
                    setIsAutocompleteOpen(true)
                  }
                }}
                onFocus={() => {
                  if (autocompleteProducts.length > 0) {
                    setIsAutocompleteOpen(true)
                  }
                }}
              />
              <button type="submit" className={styles.searchButton} aria-label="Поиск">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
                  <path d="m20 20-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </form>
          </div>
          {isAutocompleteOpen && (
            <div
              ref={autocompleteRef}
              className={styles.autocomplete}
              style={{
                top: `${autocompletePosition.top}px`,
                left: `${autocompletePosition.left}px`,
                width: `${autocompletePosition.width}px`,
              }}
            >
              {isLoading ? (
                <div className={styles.autocompleteLoading}>Загрузка...</div>
              ) : autocompleteProducts.length > 0 ? (
                <>
                  {autocompleteProducts.map((product) => (
                    <div
                      key={product.id}
                      className={styles.autocompleteItem}
                      onClick={() => handleProductClick(product.slug)}
                    >
                      {product.image && (
                        <div className={styles.autocompleteImage}>
                          <img
                            src={product.image}
                            alt={product.title}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = `https://picsum.photos/seed/${product.id}/60/60`
                            }}
                          />
                        </div>
                      )}
                      <div className={styles.autocompleteContent}>
                        <div className={styles.autocompleteTitle}>{product.title}</div>
                        <div className={styles.autocompletePrice}>
                          {product.oldPrice && (
                            <span className={styles.autocompleteOldPrice}>
                              {formatPrice(product.oldPrice, product.currency)}
                            </span>
                          )}
                          <span className={styles.autocompleteCurrentPrice}>
                            {formatPrice(product.price, product.currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div
                    className={styles.autocompleteAllResults}
                    onClick={handleShowAllResults}
                  >
                    Все результаты
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </>
              ) : null}
            </div>
          )}
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
          <Link
            href="/about"
            className={`${styles.navItem} ${isActivePath('/about') ? styles.navItemActive : ''}`}
          >
            О КОМПАНИИ
          </Link>
          <div className={styles.navDropdown}>
            <Link
              href="/sales"
              className={`${styles.navItem} ${isActivePath('/sales') ? styles.navItemActive : ''}`}
            >
              АКЦИИ
              <ChevronDownIcon />
            </Link>
            <div className={styles.navDropdownMenu}>
              <Link href="/sales/monthly" className={styles.navDropdownItem}>
                Акции месяца
              </Link>
              <Link href="/sales/discounts" className={styles.navDropdownItem}>
                Скидки
              </Link>
              <Link href="/sales/certificates" className={styles.navDropdownItem}>
                Подарочные сертификаты
              </Link>
            </div>
          </div>
          <Link
            href="/stores"
            className={`${styles.navItem} ${isActivePath('/stores') ? styles.navItemActive : ''}`}
          >
            МАГАЗИНЫ
          </Link>
          <Link
            href="/articles"
            className={`${styles.navItem} ${isActivePath('/articles') ? styles.navItemActive : ''}`}
          >
            СТАТЬИ
          </Link>
          <Link
            href="/delivery"
            className={`${styles.navItem} ${isActivePath('/delivery') ? styles.navItemActive : ''}`}
          >
            ДОСТАВКА И ОПЛАТА
          </Link>
          <Link
            href="/contacts"
            className={`${styles.navItem} ${isActivePath('/contacts') ? styles.navItemActive : ''}`}
          >
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

