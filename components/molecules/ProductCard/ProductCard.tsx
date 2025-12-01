'use client'

import Link from 'next/link'
import { Badge } from '@/components/atoms/Badge/Badge'
import { Button } from '@/components/atoms/Button/Button'
import { RatingStars } from '@/components/atoms/RatingStars/RatingStars'
import { StockLabel } from '@/components/atoms/StockLabel/StockLabel'
import { formatPrice } from '@/lib/utils'
import { useCartStore } from '@/store/cart-store'
import { useFavoritesStore } from '@/store/favorites-store'
import styles from './ProductCard.module.scss'

interface ProductCardProps {
  product: {
    id: string
    title: string
    slug: string
    price: number | string
    images?: string[]
    badges?: string[]
    stockStatus?: string
    rating?: number
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const toggleFavorite = useFavoritesStore((state) => state.toggle)
  const isFavorite = useFavoritesStore((state) => state.has(product.id))

  const stockStatus = (product.stockStatus || 'ENOUGH').toLowerCase() as 'many' | 'enough' | 'few' | 'none'

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem({
      productId: product.id,
      quantity: 1,
      price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
      product: {
        id: product.id,
        title: product.title,
        slug: product.slug,
        images: Array.isArray(product.images) ? product.images : [],
        stock: 0,
        stockStatus: stockStatus,
      },
    })
  }

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(product.id)
  }

  const badges = Array.isArray(product.badges) ? product.badges : []
  const badgeType = badges.includes('HIT')
    ? 'hit'
    : badges.includes('NEW')
    ? 'new'
    : badges.includes('SALE')
    ? 'sale'
    : null

  // Используем реальные изображения из product.images, если есть и это не placeholder, иначе fallback
  const firstImage = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null
  const isPlaceholder = firstImage && (
    firstImage.includes('placeholder') || 
    firstImage.startsWith('/uploads/placeholder') ||
    firstImage === '' ||
    firstImage.trim() === ''
  )
  
  const imageUrl = firstImage && !isPlaceholder
    ? firstImage
    : `https://picsum.photos/seed/${product.id}/400/400`

  return (
    <Link href={`/product/${product.slug}`} className={styles.card}>
      {badgeType && <Badge type={badgeType} />}
      <div className={styles.imageWrapper}>
        <div
          className={styles.image}
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{product.title}</h3>
        <RatingStars rating={product.rating || 0} size="sm" />
        <StockLabel stock={stockStatus} size="sm" />
        <div className={styles.price}>{formatPrice(product.price)}</div>
      </div>
      <div className={styles.actions}>
        <Button
          variant="primary"
          size="sm"
          onClick={handleAddToCart}
          disabled={stockStatus === 'none'}
        >
          В корзину
        </Button>
        <button
          className={`${styles.favoriteButton} ${isFavorite ? styles.active : ''}`}
          onClick={handleToggleFavorite}
          aria-label="Добавить в избранное"
        >
          ♥
        </button>
      </div>
    </Link>
  )
}

