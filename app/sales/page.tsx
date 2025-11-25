'use client'

import { useState, useEffect } from 'react'
import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import { ProductGrid } from '@/components/organisms/ProductGrid/ProductGrid'
import styles from './page.module.scss'

export default function SalesPage() {
  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Акции', href: '/sales' },
  ]

  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products?badges=SALE&limit=50')
        const data = await response.json()
        if (data.success) {
          const productsWithBadges = (data.data || []).map((p: any) => ({
            ...p,
            badges: p.tags || [],
            stockStatus: p.stockStatus || (p.isInStock ? (p.stock > 10 ? 'MANY' : p.stock > 0 ? 'ENOUGH' : 'FEW') : 'NONE'),
            rating: p.rating ? Number(p.rating) : 0,
          }))
          setProducts(productsWithBadges)
        }
      } catch (error) {
        console.error('Error fetching products:', error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return (
    <main>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className={styles.title}>Акции</h1>
        {loading ? (
          <div>Загрузка...</div>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </main>
  )
}

