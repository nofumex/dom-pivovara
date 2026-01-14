'use client'

import { ProductCard } from '@/components/molecules/ProductCard/ProductCard'
import { ProductCardLinear } from '@/components/molecules/ProductCardLinear/ProductCardLinear'
import styles from './ProductGrid.module.scss'

interface Product {
  id: string
  title: string
  slug: string
  price: number | string
  images?: string[]
  badges?: string[]
  stockStatus?: string
  stock?: number
  rating?: number | null
  description?: string
}

type ViewMode = 'grid' | 'list'

interface ProductGridProps {
  products: Product[]
  viewMode?: ViewMode
}

export function ProductGrid({ products, viewMode = 'grid' }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Товары не найдены</p>
      </div>
    )
  }

  if (viewMode === 'list') {
    return (
      <div className={styles.list}>
        {products.map((product) => (
          <ProductCardLinear
            key={product.id}
            product={{
              ...product,
              images: product.images || [],
              badges: product.badges || [],
              stockStatus: product.stockStatus || 'ENOUGH',
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={{
            ...product,
            images: product.images || [],
            badges: product.badges || [],
            stockStatus: product.stockStatus || 'ENOUGH',
          }}
        />
      ))}
    </div>
  )
}

