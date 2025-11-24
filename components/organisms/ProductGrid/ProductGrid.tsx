import { ProductCard } from '@/components/molecules/ProductCard/ProductCard'
import styles from './ProductGrid.module.scss'

interface Product {
  id: string
  title: string
  slug: string
  price: number | string
  images?: string[]
  badges?: string[]
  stockStatus?: string
  rating?: number | null
}

interface ProductGridProps {
  products: Product[]
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Товары не найдены</p>
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

