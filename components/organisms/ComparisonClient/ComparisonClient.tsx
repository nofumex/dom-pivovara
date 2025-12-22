'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useComparisonStore } from '@/store/comparison-store'
import { formatPrice } from '@/lib/utils'
import styles from './ComparisonClient.module.scss'

interface ComparisonProduct {
  id: string
  title: string
  slug: string
  price: number | string
  images?: string[]
  badges?: string[]
  stockStatus?: string
  rating?: number | null
  weight?: number | null
  dimensions?: string | null
  material?: string | null
}

export function ComparisonClient() {
  const productIds = useComparisonStore((state) => state.productIds)
  const remove = useComparisonStore((state) => state.remove)
  const clear = useComparisonStore((state) => state.clear)
  const [products, setProducts] = useState<ComparisonProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      if (productIds.length === 0) {
        setProducts([])
        return
      }
      setLoading(true)
      setError(null)
      try {
        // Используем POST endpoint для получения товаров по ID
        const response = await fetch('/api/products/by-ids', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ids: productIds }),
        })
        const data = await response.json()
        if (data.success) {
          setProducts(data.data || [])
        } else {
          setError(data.error || 'Не удалось загрузить товары')
        }
      } catch (err) {
        console.error('Comparison fetch error', err)
        setError('Ошибка загрузки товаров')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [productIds])

  const specsKeys = useMemo(() => {
    return [
      { key: 'price', label: 'Цена' },
      { key: 'stockStatus', label: 'Наличие' },
      { key: 'rating', label: 'Рейтинг' },
      { key: 'weight', label: 'Вес' },
      { key: 'dimensions', label: 'Размеры' },
      { key: 'material', label: 'Материал' },
    ] as const
  }, [])

  if (loading) {
    return <p>Загрузка сравнения...</p>
  }

  if (productIds.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Добавьте товары для сравнения.</p>
        <Link href="/catalog" className={styles.link}>
          Перейти в каталог
        </Link>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.title}>Сравнение товаров</h1>
        <button className={styles.clearButton} onClick={clear}>
          Очистить список
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.table}>
        <div className={styles.row}>
          <div className={styles.cellTitle}>Товар</div>
          {products.map((product) => (
            <div key={product.id} className={styles.cell}>
              <Link href={`/product/${product.slug}`} className={styles.productTitle}>
                {product.title}
              </Link>
              <div className={styles.actions}>
                <button onClick={() => remove(product.id)} className={styles.removeButton}>
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>

        {specsKeys.map((spec) => (
          <div key={spec.key} className={styles.row}>
            <div className={styles.cellTitle}>{spec.label}</div>
            {products.map((product) => {
              let value: React.ReactNode = '-'
              switch (spec.key) {
                case 'price':
                  value = formatPrice(product.price)
                  break
                case 'stockStatus':
                  value = (product.stockStatus || '').toLowerCase()
                  break
                case 'rating':
                  value = product.rating ?? 0
                  break
                case 'weight':
                  value = product.weight ?? '—'
                  break
                case 'dimensions':
                  value = product.dimensions ?? '—'
                  break
                case 'material':
                  value = product.material ?? '—'
                  break
                default:
                  value = '—'
              }
              return (
                <div key={`${product.id}-${spec.key}`} className={styles.cell}>
                  {value}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}







