'use client'

import { useState, useEffect, memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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

export const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const removeItem = useCartStore((state) => state.removeItem)
  const getCartItem = useCartStore((state) => {
    return state.items.find((item) => item.productId === product.id)
  })
  const toggleFavorite = useFavoritesStore((state) => state.toggle)
  const isFavorite = useFavoritesStore((state) => state.has(product.id))
  const [quantity, setQuantity] = useState(getCartItem?.quantity || 1)

  const stockStatus = (product.stockStatus || 'ENOUGH').toLowerCase() as 'many' | 'enough' | 'few' | 'none'

  useEffect(() => {
    const cartItem = useCartStore.getState().items.find((item) => item.productId === product.id)
    if (cartItem) {
      setQuantity(cartItem.quantity)
    }
  }, [product.id])

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const cartItem = useCartStore.getState().items.find((item) => item.productId === product.id)
    if (cartItem) {
      updateQuantity(cartItem.id, quantity)
    } else {
      addItem({
        productId: product.id,
        quantity: quantity,
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
  }

  const handleQuantityChange = (newQuantity: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (newQuantity < 1) return
    setQuantity(newQuantity)
    const cartItem = useCartStore.getState().items.find((item) => item.productId === product.id)
    if (cartItem) {
      if (newQuantity === 0) {
        removeItem(cartItem.id)
      } else {
        updateQuantity(cartItem.id, newQuantity)
      }
    }
  }

  const cartItem = useCartStore((state) => state.items.find((item) => item.productId === product.id))

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
    <div className={styles.cardWrapper}>
      <Link href={`/product/${product.slug}`} className={styles.card}>
        {badgeType && <Badge type={badgeType} />}
        <div className={styles.imageWrapper}>
          <button
            className={`${styles.favoriteOverlay} ${isFavorite ? styles.active : ''}`}
            onClick={handleToggleFavorite}
            aria-label="Добавить в избранное"
          >
            ♥
          </button>
          <Image
            src={imageUrl}
            alt={product.title}
            width={400}
            height={400}
            className={styles.image}
            loading="lazy"
            style={{
              objectFit: 'contain',
              backgroundColor: '#fff',
            }}
          />
        </div>
        <div className={styles.content}>
          <h3 className={styles.title}>{product.title}</h3>
          <RatingStars rating={product.rating || 0} size="sm" />
          <StockLabel stock={stockStatus} size="sm" />
          <div className={styles.price}>{formatPrice(product.price)}</div>
        </div>
      </Link>
      <div className={styles.actions}>
        <div className={styles.quantityControls}>
          <button
            className={styles.quantityButton}
            onClick={(e) => handleQuantityChange(quantity - 1, e)}
            disabled={quantity <= 1}
          >
            −
          </button>
          <span className={styles.quantity}>{quantity}</span>
          <button
            className={styles.quantityButton}
            onClick={(e) => handleQuantityChange(quantity + 1, e)}
          >
            +
          </button>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleAddToCart}
          disabled={stockStatus === 'none'}
        >
          {cartItem ? 'Обновить' : 'В корзину'}
        </Button>
      </div>
    </div>
  )
})

