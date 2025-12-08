'use client'

import Link from 'next/link'
import styles from './TopProducts.module.scss'

interface Product {
  id: string
  title: string
  slug: string
  price: any
  images: string[]
  totalSold: number
}

interface TopProductsProps {
  products: (Product | null)[]
}

export function TopProducts({ products }: TopProductsProps) {
  const validProducts = products.filter((p): p is Product => p !== null)

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Топ товары</h2>
        <Link href="/admin/products" className={styles.cardLink}>
          Все товары →
        </Link>
      </div>
      <div className={styles.list}>
        {validProducts.length === 0 ? (
          <div className={styles.empty}>Нет данных</div>
        ) : (
          validProducts.map((product, index) => (
            <Link
              key={product.id}
              href={`/admin/products/${product.slug}/edit`}
              className={styles.productItem}
            >
              <div className={styles.productRank}>#{index + 1}</div>
              <div
                className={styles.productImage}
                style={{
                  backgroundImage: product.images[0]
                    ? `url(${product.images[0]})`
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              />
              <div className={styles.productInfo}>
                <h3 className={styles.productTitle}>{product.title}</h3>
                <div className={styles.productMeta}>
                  <span className={styles.productPrice}>
                    {new Intl.NumberFormat('ru-RU').format(Number(product.price))} ₽
                  </span>
                  <span className={styles.productSold}>
                    Продано: {product.totalSold}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}









