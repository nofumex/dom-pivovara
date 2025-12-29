'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { CallbackModal } from '@/components/molecules/CallbackModal/CallbackModal'
import { PhoneIcon } from '@/components/atoms/Icons/PhoneIcon'
import { MenuIcon } from '@/components/atoms/Icons/MenuIcon'
import { ChevronDownIcon } from '@/components/atoms/Icons/ChevronDownIcon'
import { BarChartIcon } from '@/components/atoms/Icons/BarChartIcon'
import { HeartIcon } from '@/components/atoms/Icons/HeartIcon'
import { CartIcon } from '@/components/atoms/Icons/CartIcon'
import { UserIcon } from '@/components/atoms/Icons/UserIcon'
import styles from './Header.module.scss'

// Интерфейс для категории
interface Category {
  id: string
  name: string
  slug: string
}

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
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileCatalogOpen, setIsMobileCatalogOpen] = useState(false)
  const [isMobileSalesOpen, setIsMobileSalesOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0, width: 0 })
  const [phoneNumbers, setPhoneNumbers] = useState<{ contactPhone?: string; contactPhone2?: string }>({})
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

  useEffect(() => {
    if (isMobileSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isMobileSearchOpen])

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

  // Загружаем категории из API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        const data = await response.json()
        if (data.success && data.data) {
          // Берем только родительские категории (parentId === null)
          const parentCategories = data.data.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
          }))
          setCategories(parentCategories)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }

    fetchCategories()
  }, [])

  // Загружаем номера телефонов из настроек
  useEffect(() => {
    const fetchPhoneNumbers = async () => {
      try {
        const response = await fetch('/api/public-settings')
        const data = await response.json()
        if (data.success && data.data) {
          setPhoneNumbers({
            contactPhone: data.data.contactPhone,
            contactPhone2: data.data.contactPhone2,
          })
        }
      } catch (error) {
        console.error('Error fetching phone numbers:', error)
      }
    }

    fetchPhoneNumbers()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setIsAutocompleteOpen(false)
    if (searchQuery.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleProductClick = (slug: string) => {
    setIsAutocompleteOpen(false)
    setIsMobileSearchOpen(false)
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
        <div className={styles.mobileTopBar}>
          <Link href="/profile" aria-label="Профиль" className={styles.mobileIcon}>
            <UserIcon />
          </Link>
          <Link href="/compare" aria-label="Сравнение" className={styles.mobileIcon}>
            <BarChartIcon />
          </Link>
          <Link href="/favorites" aria-label="Избранное" className={styles.mobileIcon}>
            <HeartIcon />
          </Link>
          <Link href="/cart" aria-label="Корзина" className={styles.mobileIcon}>
            <CartIcon />
          </Link>
        </div>

        <div className={styles.mobileMenuBar}>
          <button
            type="button"
            className={styles.mobileMenuButton}
            aria-label="Меню"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            <MenuIcon />
            <span>Меню</span>
          </button>
          <button
            className={styles.mobileSearchButton}
            aria-label="Поиск"
            onClick={() => setIsMobileSearchOpen(true)}
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
              <path d="m20 20-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className={styles.top}>
          <Link href="/" className={styles.logo}>
            <div className={styles.logoIcon}>
              <img 
                src="/images/logoPivovar.png" 
                alt="Дом Пивовара" 
                className={styles.logoImage}
              />
            </div>
            <h1 className={styles.logoText}>Дом Пивовара</h1>
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
              {(phoneNumbers.contactPhone || phoneNumbers.contactPhone2) && (
                <div className={styles.phoneNumbers}>
                  {phoneNumbers.contactPhone && <div>{phoneNumbers.contactPhone}</div>}
                  {phoneNumbers.contactPhone2 && <div>{phoneNumbers.contactPhone2}</div>}
                </div>
              )}
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

        {isMobileMenuOpen && (
          <div className={styles.mobileNav}>
            <button
              className={styles.mobileNavSection}
              onClick={() => setIsMobileCatalogOpen((prev) => !prev)}
              type="button"
            >
              <span>Каталог</span>
              <span className={styles.mobileNavArrow}>{isMobileCatalogOpen ? '▾' : '▸'}</span>
            </button>
            {isMobileCatalogOpen && (
              <div className={styles.mobileNavSublist}>
                {categories.length === 0 ? (
                  <div className={styles.mobileNavSubitem}>Загрузка...</div>
                ) : (
                  categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/catalog/${cat.slug}`}
                      className={styles.mobileNavSubitem}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {cat.name}
                    </Link>
                  ))
                )}
              </div>
            )}

            <Link href="/about" className={styles.mobileNavItem} onClick={() => setIsMobileMenuOpen(false)}>О компании</Link>

            <button
              className={styles.mobileNavSection}
              onClick={() => setIsMobileSalesOpen((prev) => !prev)}
              type="button"
            >
              <span>Акции</span>
              <span className={styles.mobileNavArrow}>{isMobileSalesOpen ? '▾' : '▸'}</span>
            </button>
            {isMobileSalesOpen && (
              <div className={styles.mobileNavSublist}>
                <Link href="/sales" className={styles.mobileNavSubitem} onClick={() => setIsMobileMenuOpen(false)}>Все акции</Link>
                <Link href="/sales/monthly" className={styles.mobileNavSubitem} onClick={() => setIsMobileMenuOpen(false)}>Акции месяца</Link>
                <Link href="/sales/discounts" className={styles.mobileNavSubitem} onClick={() => setIsMobileMenuOpen(false)}>Скидки</Link>
                <Link href="/sales/certificates" className={styles.mobileNavSubitem} onClick={() => setIsMobileMenuOpen(false)}>Подарочные сертификаты</Link>
              </div>
            )}

            <Link href="/stores" className={styles.mobileNavItem} onClick={() => setIsMobileMenuOpen(false)}>Магазины</Link>
            <Link href="/articles" className={styles.mobileNavItem} onClick={() => setIsMobileMenuOpen(false)}>Статьи</Link>
            <Link href="/delivery" className={styles.mobileNavItem} onClick={() => setIsMobileMenuOpen(false)}>Доставка и оплата</Link>
            <Link href="/contacts" className={styles.mobileNavItem} onClick={() => setIsMobileMenuOpen(false)}>Контакты</Link>
          </div>
        )}
        {isMobileSearchOpen && (
          <div className={styles.mobileSearchOverlay}>
            <div className={styles.mobileSearchContent}>
              <div className={styles.mobileSearchHeader}>
                <span>Поиск</span>
                <button
                  type="button"
                  className={styles.mobileSearchClose}
                  aria-label="Закрыть поиск"
                  onClick={() => {
                    setIsMobileSearchOpen(false)
                    setIsAutocompleteOpen(false)
                  }}
                >
                  ×
                </button>
              </div>
              <form className={styles.mobileSearchForm} onSubmit={handleSearch}>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Поиск по товарам"
                  className={styles.mobileSearchInput}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    if (e.target.value.trim().length >= 2) {
                      setIsAutocompleteOpen(true)
                    }
                  }}
                />
                <button type="submit" className={styles.mobileSearchSubmit} aria-label="Поиск">
                  Найти
                </button>
              </form>
              {isAutocompleteOpen && autocompleteProducts.length > 0 && (
                <div className={styles.mobileAutocomplete}>
                  {autocompleteProducts.map((product) => (
                    <div
                      key={product.id}
                      className={styles.mobileAutocompleteItem}
                      onClick={() => handleProductClick(product.slug)}
                    >
                      <div className={styles.mobileAutocompleteTitle}>{product.title}</div>
                      <div className={styles.mobileAutocompletePrice}>
                        {product.oldPrice && (
                          <span className={styles.mobileAutocompleteOldPrice}>
                            {formatPrice(product.oldPrice, product.currency)}
                          </span>
                        )}
                        <span className={styles.mobileAutocompleteCurrentPrice}>
                          {formatPrice(product.price, product.currency)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div
                    className={styles.mobileAutocompleteAll}
                    onClick={handleShowAllResults}
                  >
                    Все результаты
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
    </header>

    <CallbackModal
      isOpen={isCallbackModalOpen}
      onClose={() => setIsCallbackModalOpen(false)}
    />
    </>
  )
}

