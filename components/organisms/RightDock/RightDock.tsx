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
  
  const cartCount = useCartStore((state) => state.getTotalItems())
  const favoritesCount = useFavoritesStore((state) => state.getAll().length)
  const comparisonCount = useComparisonStore((state) => state.getCount())

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      <div className={styles.dock}>
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
