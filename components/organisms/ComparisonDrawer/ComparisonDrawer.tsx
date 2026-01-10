'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useComparisonStore } from '@/store/comparison-store'
import { Button } from '@/components/atoms/Button/Button'
import styles from './ComparisonDrawer.module.scss'

interface ComparisonDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function ComparisonDrawer({ isOpen, onClose }: ComparisonDrawerProps) {
  const router = useRouter()
  const comparisonIds = useComparisonStore((state) => state.getAll())
  const removeFromComparison = useComparisonStore((state) => state.remove)
  const clearComparison = useComparisonStore((state) => state.clear)
  const [products, setProducts] = useState<
    Array<{
      id: string
      title: string
      slug: string
      price: number | string
      images?: string[]
      stockStatus?: string
    }>
  >([])

  useEffect(() => {
    if (isOpen && comparisonIds.length > 0) {
      const fetchProducts = async () => {
        try {
          // Используем POST endpoint для получения товаров по ID
          const response = await fetch('/api/products/by-ids', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ids: comparisonIds }),
          })
          const data = await response.json()
          if (data.success) {
            setProducts(data.data || [])
          } else {
            console.error('API error:', data.error)
            setProducts([])
          }
        } catch (error) {
          console.error('Error fetching comparison:', error)
          setProducts([])
        }
      }
      fetchProducts()
    } else {
      setProducts([])
    }
  }, [isOpen, comparisonIds])

  if (!isOpen) return null

  const handleCompare = () => {
    router.push('/compare')
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Сравнение товаров</h3>
          <button className={styles.closeButton} onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>

        <div className={styles.content}>
          {comparisonIds.length === 0 ? (
            <div className={styles.empty}>
              <p>Список сравнения пуст</p>
              <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                Добавьте товары для сравнения
              </p>
            </div>
          ) : products.length === 0 && comparisonIds.length > 0 ? (
            <div className={styles.empty}>
              <p>Загрузка товаров...</p>
            </div>
          ) : (
            <>
              <div className={styles.items}>
                {products.map((product) => {
                  const firstImage = product.images && product.images.length > 0 ? product.images[0] : null
                  const hasValidImage = firstImage && 
                    !firstImage.includes('placeholder') &&
                    !firstImage.startsWith('/uploads/placeholder') &&
                    firstImage !== '' &&
                    firstImage.trim() !== '' &&
                    !firstImage.startsWith('http://') &&
                    !firstImage.startsWith('https://')
                  const image = hasValidImage ? firstImage : null

                  const stock = (product.stockStatus || 'ENOUGH').toLowerCase()

                  return (
                    <div key={product.id} className={styles.item}>
                      <button
                        className={styles.removeButton}
                        onClick={() => removeFromComparison(product.id)}
                        aria-label="Удалить"
                      >
                        ×
                      </button>
                      <Link
                        href={`/product/${product.slug}`}
                        className={styles.itemLink}
                        onClick={onClose}
                      >
                        <div className={styles.itemImageWrapper}>
                          {image ? (
                            <img
                              src={image}
                              alt={product.title}
                              className={styles.itemImage}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className={styles.itemImagePlaceholder} />
                          )}
                        </div>
                        <h4 className={styles.itemTitle}>{product.title}</h4>
                        <div className={styles.itemMeta}>
                          <span className={styles.itemPrice}>
                            {typeof product.price === 'string'
                              ? product.price
                              : `${product.price.toLocaleString('ru-RU')} ₽`}
                          </span>
                          <span
                            className={`${styles.itemStock} ${styles[stock as 'many' | 'enough' | 'few' | 'none']}`}
                          >
                            {stock === 'none'
                              ? 'Нет в наличии'
                              : stock === 'few'
                                ? 'Мало'
                                : 'В наличии'}
                          </span>
                        </div>
                      </Link>
                    </div>
                  )
                })}
              </div>

              {products.length > 0 && (
                <div className={styles.actions}>
                  <Button variant="primary" onClick={handleCompare}>
                    Открыть сравнение ({products.length}/4)
                  </Button>
                  <Button variant="link" onClick={clearComparison}>
                    Очистить список
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

