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
import styles from './ProductCardLinear.module.scss'

interface ProductCardLinearProps {
  product: {
    id: string
    title: string
    slug: string
    price: number | string
    images?: string[]
    badges?: string[]
    stockStatus?: string
    rating?: number
    description?: string
  }
}

export const ProductCardLinear = memo(function ProductCardLinear({ product }: ProductCardLinearProps) {
  const addItem = useCartStore((state) => state.addItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const removeItem = useCartStore((state) => state.removeItem)
  const toggleFavorite = useFavoritesStore((state) => state.toggle)
  const isFavorite = useFavoritesStore((state) => state.has(product.id))
  const [quantity, setQuantity] = useState(1)

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

  const cartItem = useCartStore((state) => state.items.find((item) => item.productId === product.id))

  return (
    <div className={styles.card}>
      <Link href={`/product/${product.slug}`} className={styles.imageLink}>
        {badgeType && <Badge type={badgeType} />}
        <div className={styles.imageWrapper}>
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
      </Link>
      <div className={styles.content}>
        <Link href={`/product/${product.slug}`} className={styles.titleLink}>
          <h3 className={styles.title}>{product.title}</h3>
        </Link>
        <div className={styles.meta}>
          <RatingStars rating={product.rating || 0} size="sm" />
          <StockLabel stock={stockStatus} size="sm" />
        </div>
        <div className={styles.price}>{formatPrice(product.price)}</div>
        {product.description && (
          <p className={styles.description}>{product.description.substring(0, 150)}...</p>
        )}
      </div>
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
        <button
          className={`${styles.favoriteButton} ${isFavorite ? styles.active : ''}`}
          onClick={handleToggleFavorite}
          aria-label="Добавить в избранное"
        >
          ♥
        </button>
      </div>
    </div>
  )
})

