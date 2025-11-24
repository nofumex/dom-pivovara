'use client'

import { useState, useEffect } from 'react'
import { ProductCard } from '@/components/molecules/ProductCard/ProductCard'
import styles from './ProductTabs.module.scss'

type TabType = 'hits' | 'new' | 'sale'

interface Product {
  id: string
  title: string
  slug: string
  price: number | string
  images?: string[]
  badges?: string[]
  stockStatus?: string
  rating?: number
}

export function ProductTabs() {
  const [activeTab, setActiveTab] = useState<TabType>('hits')
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    // Fetch products based on active tab
    const fetchProducts = async () => {
      try {
        let tag = 'HIT'
        if (activeTab === 'new') tag = 'NEW'
        if (activeTab === 'sale') tag = 'SALE'
        
        const response = await fetch(`/api/products?badges=${tag}&limit=8`)
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
        // Set empty array on error
        setProducts([])
      }
    }

    fetchProducts()
  }, [activeTab])

  return (
    <div className={styles.tabs}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          {activeTab === 'hits' ? 'Хиты продаж' : activeTab === 'new' ? 'Новинки' : 'По акции'}
        </h2>
        <div className={styles.tabButtons}>
          <button
            className={`${styles.tab} ${activeTab === 'hits' ? styles.active : ''}`}
            onClick={() => setActiveTab('hits')}
          >
            Хиты продаж
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'new' ? styles.active : ''}`}
            onClick={() => setActiveTab('new')}
          >
            Новинки
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'sale' ? styles.active : ''}`}
            onClick={() => setActiveTab('sale')}
          >
            По акции
          </button>
        </div>
      </div>

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

      {products.length === 0 && (
        <div className={styles.empty}>
          <p>Товары загружаются...</p>
        </div>
      )}
    </div>
  )
}

