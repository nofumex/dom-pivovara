'use client'

import { useState, useEffect } from 'react'
import { useCartStore } from '@/store/cart-store'
import { useFavoritesStore } from '@/store/favorites-store'
import { useComparisonStore } from '@/store/comparison-store'
import { CartDrawer } from '@/components/organisms/CartDrawer/CartDrawer'
import { FavoritesDrawer } from '@/components/organisms/FavoritesDrawer/FavoritesDrawer'
import { ComparisonDrawer } from '@/components/organisms/ComparisonDrawer/ComparisonDrawer'
import { ProfileModal } from '@/components/molecules/ProfileModal/ProfileModal'
import { CartIcon } from '@/components/atoms/Icons/CartIcon'
import { HeartIcon } from '@/components/atoms/Icons/HeartIcon'
import { BarChartIcon } from '@/components/atoms/Icons/BarChartIcon'
import { UserIcon } from '@/components/atoms/Icons/UserIcon'
import styles from './RightDock.module.scss'

export function RightDock() {
  const [activeDrawer, setActiveDrawer] = useState<'cart' | 'favorites' | 'comparison' | 'profile' | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  
  const cartCount = useCartStore((state) => state.getTotalItems())
  const favoritesCount = useFavoritesStore((state) => state.getAll().length)
  const comparisonCount = useComparisonStore((state) => state.getCount())

  useEffect(() => {
    setMounted(true)
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 600)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <>
      <div className={styles.dock}>
        {isScrolled && (
          <button
            className={styles.scrollToTopButton}
            onClick={scrollToTop}
            aria-label="Наверх"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 4L4 10L5.41 11.41L10 6.83L14.59 11.41L16 10L10 4Z" fill="white"/>
            </svg>
          </button>
        )}
        <button
          className={styles.dockButton}
          onClick={() => setActiveDrawer(activeDrawer === 'cart' ? null : 'cart')}
          aria-label="Корзина"
        >
          <CartIcon />
          {mounted && cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
        </button>
        <button
          className={styles.dockButton}
          onClick={() => setActiveDrawer(activeDrawer === 'favorites' ? null : 'favorites')}
          aria-label="Избранное"
        >
          <HeartIcon />
          {mounted && favoritesCount > 0 && <span className={styles.badge}>{favoritesCount}</span>}
        </button>
        <button
          className={styles.dockButton}
          onClick={() => setActiveDrawer(activeDrawer === 'comparison' ? null : 'comparison')}
          aria-label="Сравнение"
        >
          <BarChartIcon />
          {mounted && comparisonCount > 0 && <span className={styles.badge}>{comparisonCount}</span>}
        </button>
        <button
          className={styles.dockButton}
          onClick={() => setActiveDrawer(activeDrawer === 'profile' ? null : 'profile')}
          aria-label="Профиль"
        >
          <UserIcon />
        </button>
      </div>

      <CartDrawer
        isOpen={activeDrawer === 'cart'}
        onClose={() => setActiveDrawer(null)}
      />
      <FavoritesDrawer
        isOpen={activeDrawer === 'favorites'}
        onClose={() => setActiveDrawer(null)}
      />
      <ComparisonDrawer
        isOpen={activeDrawer === 'comparison'}
        onClose={() => setActiveDrawer(null)}
      />
      <ProfileModal
        isOpen={activeDrawer === 'profile'}
        onClose={() => setActiveDrawer(null)}
      />
    </>
  )
}
