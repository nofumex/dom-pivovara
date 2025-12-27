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
        let url = ''
        
        if (activeTab === 'hits') {
          // Хиты продаж: товары в наличии, отсортированные по рейтингу (топ товаров)
          url = '/api/products?inStock=true&sortBy=rating&sortOrder=desc&limit=8'
        } else if (activeTab === 'new') {
          // Новинки: товары с badge NEW, в наличии, отсортированные по дате создания (новые сначала)
          url = '/api/products?badges=NEW&inStock=true&sortBy=createdAt&sortOrder=desc&limit=8'
        } else if (activeTab === 'sale') {
          // По акции: товары с badge SALE, в наличии, отсортированные по рейтингу
          url = '/api/products?badges=SALE&inStock=true&sortBy=rating&sortOrder=desc&limit=8'
        }
        
        console.log(`[ProductTabs] Fetching products for tab "${activeTab}": ${url}`)
        const response = await fetch(url)
        
        if (!response.ok) {
          console.error(`[ProductTabs] API request failed:`, response.status, response.statusText)
          setProducts([])
          return
        }
        
        const data = await response.json()
        if (data.success && Array.isArray(data.data)) {
          let productsList = data.data || []
          
          // Fallback: если товаров с нужным badge нет, загружаем без фильтра по badge
          if (productsList.length === 0 && (activeTab === 'new' || activeTab === 'sale')) {
            console.log(`[ProductTabs] No products with badge found for "${activeTab}", using fallback`)
            let fallbackUrl = ''
            
            if (activeTab === 'new') {
              // Новинки: товары отсортированные по дате создания (новые сначала)
              fallbackUrl = '/api/products?inStock=true&sortBy=createdAt&sortOrder=desc&limit=8'
            } else if (activeTab === 'sale') {
              // По акции: товары отсортированные по рейтингу
              fallbackUrl = '/api/products?inStock=true&sortBy=rating&sortOrder=desc&limit=8'
            }
            
            if (fallbackUrl) {
              try {
                const fallbackResponse = await fetch(fallbackUrl)
                if (fallbackResponse.ok) {
                  const fallbackData = await fallbackResponse.json()
                  if (fallbackData.success && Array.isArray(fallbackData.data)) {
                    productsList = fallbackData.data
                    console.log(`[ProductTabs] Loaded ${productsList.length} products using fallback for "${activeTab}"`)
                  }
                }
              } catch (fallbackError) {
                console.error(`[ProductTabs] Fallback request failed for "${activeTab}":`, fallbackError)
              }
            }
          }
          
          console.log(`[ProductTabs] Loaded ${productsList.length} products for tab "${activeTab}"`)
          const productsWithBadges = productsList.map((p: any) => ({
            ...p,
            badges: p.badges || [], // Используем badges из API, а не tags
            stockStatus: p.stockStatus || (p.isInStock ? (p.stock > 10 ? 'MANY' : p.stock > 0 ? 'ENOUGH' : 'FEW') : 'NONE'),
            rating: p.rating ? Number(p.rating) : 0,
          }))
          setProducts(productsWithBadges)
        } else {
          console.warn(`[ProductTabs] Unexpected API response format for tab "${activeTab}":`, data)
          setProducts([])
        }
      } catch (error) {
        console.error(`[ProductTabs] Error fetching products for tab "${activeTab}":`, error)
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

