'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/atoms/Button/Button'
import { RatingStars } from '@/components/atoms/RatingStars/RatingStars'
import { StockLabel } from '@/components/atoms/StockLabel/StockLabel'
import { formatPrice } from '@/lib/utils'
import { useCartStore } from '@/store/cart-store'
import { useFavoritesStore } from '@/store/favorites-store'
import { useComparisonStore } from '@/store/comparison-store'
import { CheaperModal } from '@/components/molecules/CheaperModal/CheaperModal'
import { QuickBuyModal } from '@/components/molecules/QuickBuyModal/QuickBuyModal'
import { SharePopup } from '@/components/molecules/SharePopup/SharePopup'
import { CartIcon } from '@/components/atoms/Icons/CartIcon'
import styles from './ProductDetails.module.scss'

interface ProductDetailsProps {
  product: {
    id: string
    title: string
    slug: string
    price: number | string
    images?: string[]
    badges?: string[]
    stockStatus?: string
    stock?: number
    reviews?: any[]
    [key: string]: any
  }
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isCheaperModalOpen, setIsCheaperModalOpen] = useState(false)
  const [isQuickBuyModalOpen, setIsQuickBuyModalOpen] = useState(false)
  const [isSharePopupOpen, setIsSharePopupOpen] = useState(false)
  const addItem = useCartStore((state) => state.addItem)
  const toggleFavorite = useFavoritesStore((state) => state.toggle)
  const addToComparison = useComparisonStore((state) => state.add)
  const isFavorite = useFavoritesStore((state) => state.has(product.id))

  const stockStatus = ((product.stockStatus || 'ENOUGH').toLowerCase()) as 'many' | 'enough' | 'few' | 'none'
  
  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      quantity,
      price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
      product: {
        id: product.id,
        title: product.title,
        slug: product.slug,
        images: Array.isArray(product.images) ? product.images : [],
        stock: product.stock || 0,
        stockStatus: stockStatus,
      },
    })
    alert('Товар добавлен в корзину')
  }

  const handleToggleFavorite = () => {
    toggleFavorite(product.id)
  }

  const handleAddToComparison = () => {
    if (addToComparison(product.id)) {
      alert('Товар добавлен в сравнение')
    } else {
      alert('Нельзя добавить более 4 товаров для сравнения')
    }
  }
  const averageRating = product.reviews && product.reviews.length > 0
    ? product.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / product.reviews.length
    : 0

  return (
    <div className={styles.details}>
      <div className={styles.images}>
        <div className={styles.mainImage}>
          {(() => {
            const hasRealImage = product.images && 
              product.images.length > 0 && 
              product.images[selectedImage] && 
              !product.images[selectedImage].includes('placeholder') &&
              !product.images[selectedImage].startsWith('/uploads/placeholder')
            
            const imageUrl = hasRealImage
              ? product.images[selectedImage]
              : `https://picsum.photos/seed/${product.id}/800/800`
            
            return (
              <div
                className={styles.image}
                style={{
                  backgroundImage: `url(${imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            )
          })()}
        </div>
        {Array.isArray(product.images) && product.images.length > 1 && (
          <div className={styles.thumbnails}>
            {product.images.map((image: string, index: number) => (
              <button
                key={index}
                className={`${styles.thumbnail} ${selectedImage === index ? styles.active : ''}`}
                onClick={() => setSelectedImage(index)}
              >
                <div
                  className={styles.thumbImage}
                  style={{
                    backgroundImage: (() => {
                      const hasRealImage = image && 
                        !image.includes('placeholder') &&
                        !image.startsWith('/uploads/placeholder')
                      return hasRealImage
                        ? `url(${image})`
                        : `url(https://picsum.photos/seed/${product.id}-${index}/200/200)`
                    })(),
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              </button>
            ))}
          </div>
        )}
        <button
          className={styles.favoriteButton}
          onClick={handleToggleFavorite}
          aria-label="Добавить в избранное"
        >
          {isFavorite ? '♥' : '♡'}
        </button>
      </div>

      <div className={styles.info}>
        <h1 className={styles.title}>{product.title}</h1>

        <RatingStars rating={averageRating} size="md" />

        <div className={styles.price}>{formatPrice(product.price)}</div>

        <div className={styles.stockRow}>
          <StockLabel stock={stockStatus} size="md" />
          <button
            onClick={() => setIsCheaperModalOpen(true)}
            className={styles.cheaperLink}
          >
            Нашли дешевле?
          </button>
        </div>

        <div className={styles.quantity}>
          <button
            className={styles.quantityButton}
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          >
            −
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 1
              setQuantity(Math.max(1, val))
            }}
            className={styles.quantityInput}
            min="1"
          />
          <button
            className={styles.quantityButton}
            onClick={() => setQuantity(quantity + 1)}
          >
            +
          </button>
        </div>

        <div className={styles.actions}>
          <Button
            variant="primary"
            onClick={handleAddToCart}
            disabled={stockStatus === 'none'}
          >
            <CartIcon /> В корзину
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsQuickBuyModalOpen(true)}
          >
            Купить в 1 клик
          </Button>
        </div>

        <div className={styles.share}>
          <button
            className={styles.shareButton}
            onClick={() => setIsSharePopupOpen(!isSharePopupOpen)}
          >
            Поделиться
          </button>
          {isSharePopupOpen && (
            <SharePopup
              isOpen={isSharePopupOpen}
              onClose={() => setIsSharePopupOpen(false)}
              url={typeof window !== 'undefined' ? window.location.href : ''}
              title={product.title}
            />
          )}
        </div>

        <p className={styles.note}>
          Цена действительна только для интернет‑магазина и может отличаться от цен в
          розничных магазинах.
        </p>
      </div>

      <CheaperModal
        isOpen={isCheaperModalOpen}
        onClose={() => setIsCheaperModalOpen(false)}
        productTitle={product.title}
      />
      <QuickBuyModal
        isOpen={isQuickBuyModalOpen}
        onClose={() => setIsQuickBuyModalOpen(false)}
        product={{
          id: product.id,
          title: product.title,
          price: product.price,
          quantity,
        }}
      />
    </div>
  )
}

