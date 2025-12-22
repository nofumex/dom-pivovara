'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useFavoritesStore } from '@/store/favorites-store'
import { formatPrice } from '@/lib/utils'
import styles from './FavoritesDrawer.module.scss'

interface FavoritesDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function FavoritesDrawer({ isOpen, onClose }: FavoritesDrawerProps) {
  const favoriteIds = useFavoritesStore((state) => state.getAll())
  const [products, setProducts] = useState<Array<{
    id: string
    title: string
    slug: string
    price: number | string
    images?: string[]
  }>>([])

  useEffect(() => {
    if (isOpen && favoriteIds.length > 0) {
      const fetchProducts = async () => {
        try {
          const response = await fetch(`/api/products?id[]=${favoriteIds.join('&id[]=')}`)
          const data = await response.json()
          if (data.success) {
            setProducts(data.data || [])
          }
        } catch (error) {
          console.error('Error fetching favorites:', error)
        }
      }
      fetchProducts()
    } else {
      setProducts([])
    }
  }, [isOpen, favoriteIds])

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Избранное</h3>
          <button className={styles.closeButton} onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>

        <div className={styles.content}>
          {products.length === 0 ? (
            <div className={styles.empty}>
              <p>Избранное пусто</p>
            </div>
          ) : (
            <div className={styles.items}>
              {products.map((product) => {
                const firstImage = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null
                const isPlaceholder = firstImage && (
                  firstImage.includes('placeholder') || 
                  firstImage.startsWith('/uploads/placeholder') ||
                  firstImage === '' ||
                  firstImage.trim() === ''
                )
                
                const imageUrl = firstImage && !isPlaceholder
                  ? firstImage
                  : `https://picsum.photos/seed/${product.id}/200/200`

                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className={styles.item}
                    onClick={onClose}
                  >
                    <div
                      className={styles.itemImage}
                      style={{
                        backgroundImage: `url(${imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                    <div className={styles.itemInfo}>
                      <h4 className={styles.itemTitle}>{product.title}</h4>
                      <p className={styles.itemPrice}>{formatPrice(product.price)}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

