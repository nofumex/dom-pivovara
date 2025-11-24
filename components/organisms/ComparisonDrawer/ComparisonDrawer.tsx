'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useComparisonStore } from '@/store/comparison-store'
import { Button } from '@/components/atoms/Button/Button'
import styles from './ComparisonDrawer.module.scss'

interface ComparisonDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function ComparisonDrawer({ isOpen, onClose }: ComparisonDrawerProps) {
  const comparisonIds = useComparisonStore((state) => state.getAll())
  const removeFromComparison = useComparisonStore((state) => state.remove)
  const clearComparison = useComparisonStore((state) => state.clear)
  const [products, setProducts] = useState<Array<{
    id: string
    title: string
    slug: string
  }>>([])

  useEffect(() => {
    if (isOpen && comparisonIds.length > 0) {
      const fetchProducts = async () => {
        try {
          const response = await fetch(`/api/products?id[]=${comparisonIds.join('&id[]=')}`)
          const data = await response.json()
          if (data.success) {
            setProducts(data.data || [])
          }
        } catch (error) {
          console.error('Error fetching comparison:', error)
        }
      }
      fetchProducts()
    } else {
      setProducts([])
    }
  }, [isOpen, comparisonIds])

  if (!isOpen) return null

  const handleCompare = () => {
    // Navigate to comparison page
    alert('Сравнение товаров (заглушка)')
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Сравнение ({products.length}/4)</h3>
          <button className={styles.closeButton} onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>

        <div className={styles.content}>
          {products.length === 0 ? (
            <div className={styles.empty}>
              <p>Список сравнения пуст</p>
            </div>
          ) : (
            <>
              <div className={styles.items}>
                {products.map((product) => (
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
                      <div
                        className={styles.itemImage}
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        }}
                      />
                      <h4 className={styles.itemTitle}>{product.title}</h4>
                    </Link>
                  </div>
                ))}
              </div>

              {products.length > 0 && (
                <div className={styles.actions}>
                  <Button variant="primary" onClick={handleCompare}>
                    Сравнить
                  </Button>
                  <Button variant="link" onClick={clearComparison}>
                    Очистить
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

