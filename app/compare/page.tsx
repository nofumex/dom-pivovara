'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import { Button } from '@/components/atoms/Button/Button'
import { useComparisonStore } from '@/store/comparison-store'
import { formatPrice } from '@/lib/utils'
import { RatingStars } from '@/components/atoms/RatingStars/RatingStars'
import { StockLabel } from '@/components/atoms/StockLabel/StockLabel'
import styles from './page.module.scss'

interface Product {
  id: string
  title: string
  slug: string
  price: number | string
  oldPrice?: number | string | null
  images?: string[]
  badges?: string[]
  stockStatus?: string
  rating?: number | null
  description?: string
  content?: string
  sku?: string
  weight?: number
  dimensions?: string
  material?: string
  stock?: number
}

export default function ComparePage() {
  const comparisonIds = useComparisonStore((state) => state.getAll())
  const removeFromComparison = useComparisonStore((state) => state.remove)
  const clearComparison = useComparisonStore((state) => state.clear)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (comparisonIds.length === 0) {
      setProducts([])
      setLoading(false)
      return
    }

    const fetchProducts = async () => {
      setLoading(true)
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
          const productsWithBadges = (data.data || []).map((p: any) => ({
            ...p,
            badges: p.badges || p.tags || [],
            stockStatus: p.stockStatus || (p.isInStock ? (p.stock === 0 ? 'NONE' : p.stock >= 1 && p.stock <= 2 ? 'FEW' : p.stock >= 3 && p.stock <= 10 ? 'ENOUGH' : 'MANY') : 'NONE'),
            rating: p.rating ? Number(p.rating) : 0,
            price: Number(p.price),
            oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
            images: p.images || [],
            weight: p.weight || null,
            dimensions: p.dimensions || null,
            material: p.material || null,
            sku: p.sku || null,
            stock: p.stock || 0,
          }))
          setProducts(productsWithBadges)
        } else {
          console.error('API error:', data.error)
        }
      } catch (error) {
        console.error('Error fetching comparison products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [comparisonIds])

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Сравнение товаров', href: '/compare' },
  ]

  if (loading) {
    return (
      <main>
        <div className="container">
          <Breadcrumbs items={breadcrumbs} />
          <div className={styles.loading}>Загрузка...</div>
        </div>
      </main>
    )
  }

  if (products.length === 0) {
    return (
      <main>
        <div className="container">
          <Breadcrumbs items={breadcrumbs} />
          <div className={styles.empty}>
            <h1 className={styles.emptyTitle}>Сравнение товаров</h1>
            <p className={styles.emptyText}>Выберите товары для сравнения</p>
            <Link href="/catalog">
              <Button variant="primary">Перейти в каталог</Button>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // Получаем все уникальные характеристики для сравнения
  const allSpecs = new Set<string>()
  products.forEach((product) => {
    if (product.sku) allSpecs.add('Артикул')
    if (product.weight) allSpecs.add('Вес')
    if (product.dimensions) allSpecs.add('Размеры')
    if (product.material) allSpecs.add('Материал')
    if (product.stock !== undefined) allSpecs.add('Остаток')
  })

  const specsArray = Array.from(allSpecs)

  return (
    <main>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <div className={styles.header}>
          <h1 className={styles.title}>Сравнение товаров</h1>
          <div className={styles.headerActions}>
            <Button variant="outline" onClick={clearComparison}>
              Очистить все
            </Button>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.comparisonTable}>
            <thead>
              <tr>
                <th className={styles.specColumn}>Характеристика</th>
                {products.map((product) => (
                  <th key={product.id} className={styles.productColumn}>
                    <div className={styles.productHeader}>
                      <button
                        className={styles.removeButton}
                        onClick={() => removeFromComparison(product.id)}
                        aria-label="Удалить из сравнения"
                      >
                        ×
                      </button>
                      {product.images && product.images.length > 0 && (
                        <Link href={`/product/${product.slug}`} className={styles.productImage}>
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        </Link>
                      )}
                      <Link href={`/product/${product.slug}`} className={styles.productTitle}>
                        {product.title}
                      </Link>
                      <div className={styles.productPrice}>
                        {product.oldPrice && (
                          <span className={styles.oldPrice}>{formatPrice(product.oldPrice)}</span>
                        )}
                        <span className={styles.currentPrice}>{formatPrice(product.price)}</span>
                      </div>
                      <RatingStars rating={product.rating || 0} size="sm" />
                      <StockLabel 
                        stock={(product.stockStatus || 'ENOUGH').toLowerCase() as 'many' | 'enough' | 'few' | 'none'} 
                        size="sm" 
                      />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={styles.specName}>Цена</td>
                {products.map((product) => (
                  <td key={product.id} className={styles.specValue}>
                    <div className={styles.priceCell}>
                      {product.oldPrice && (
                        <span className={styles.oldPrice}>{formatPrice(product.oldPrice)}</span>
                      )}
                      <span className={styles.currentPrice}>{formatPrice(product.price)}</span>
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className={styles.specName}>Рейтинг</td>
                {products.map((product) => (
                  <td key={product.id} className={styles.specValue}>
                    <RatingStars rating={product.rating || 0} size="sm" />
                  </td>
                ))}
              </tr>
              <tr>
                <td className={styles.specName}>Наличие</td>
                {products.map((product) => (
                  <td key={product.id} className={styles.specValue}>
                    <StockLabel 
                      stock={(product.stockStatus || 'ENOUGH').toLowerCase() as 'many' | 'enough' | 'few' | 'none'} 
                      size="sm" 
                    />
                  </td>
                ))}
              </tr>
              {specsArray.map((spec) => (
                <tr key={spec}>
                  <td className={styles.specName}>{spec}</td>
                  {products.map((product) => (
                    <td key={product.id} className={styles.specValue}>
                      {spec === 'Артикул' && product.sku}
                      {spec === 'Вес' && product.weight && `${product.weight} кг`}
                      {spec === 'Размеры' && product.dimensions}
                      {spec === 'Материал' && product.material}
                      {spec === 'Остаток' && product.stock !== undefined && `${product.stock} шт.`}
                      {!product[spec.toLowerCase() as keyof Product] && spec !== 'Артикул' && spec !== 'Остаток' && '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}

