'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import { FiltersPanel } from '@/components/organisms/FiltersPanel/FiltersPanel'
import { SortBar } from '@/components/molecules/SortBar/SortBar'
import { ProductGrid } from '@/components/organisms/ProductGrid/ProductGrid'
import { getPlaceholderImage } from '@/lib/catalogData'
import styles from './page.module.scss'

interface CategoryClientProps {
  category: {
    id: string
    name: string
    slug: string
    parent?: { name: string; slug: string } | null
    children?: Array<{ id: string; name: string; slug: string; count?: number; image?: string | null }>
  }
  initialProducts: any[]
}

export function CategoryClient({ category, initialProducts }: CategoryClientProps) {
  const [products, setProducts] = useState(initialProducts)
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Вычисляем максимальную цену из товаров на странице
  const calculateMaxPrice = (productsList: any[]) => {
    if (!productsList || productsList.length === 0) return 1000
    const prices = productsList
      .map((p) => parseFloat(p.price) || 0)
      .filter((price) => price > 0)
    return prices.length > 0 ? Math.max(...prices) : 1000
  }
  
  // Вычисляем начальную максимальную цену
  const initialMaxPrice = calculateMaxPrice(initialProducts)
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice)
  
  const [filters, setFilters] = useState({
    priceMin: 0,
    priceMax: initialMaxPrice,
    onSale: false,
  })
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Обновляем максимальную цену при изменении списка товаров
  useEffect(() => {
    const newMaxPrice = calculateMaxPrice(products)
    if (newMaxPrice > 0) {
      setMaxPrice((prevMaxPrice) => {
        if (newMaxPrice !== prevMaxPrice) {
          // Обновляем фильтр, если текущий максимум больше новой максимальной цены
          setFilters((prevFilters) => {
            if (prevFilters.priceMax > newMaxPrice) {
              return { ...prevFilters, priceMax: newMaxPrice }
            }
            return prevFilters
          })
          return newMaxPrice
        }
        return prevMaxPrice
      })
    }
  }, [products])

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          category: category.slug,
          page: '1',
          limit: '50',
          sortBy,
          sortOrder,
        })

        if (filters.priceMin > 0) {
          params.append('priceMin', filters.priceMin.toString())
        }
        if (filters.priceMax < maxPrice) {
          params.append('priceMax', filters.priceMax.toString())
        }
        if (filters.onSale) {
          params.append('tags', 'SALE')
        }

        const response = await fetch(`/api/products?${params.toString()}`)
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
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [category.slug, filters, sortBy, sortOrder])

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Каталог', href: '/catalog' },
    ...(category.parent ? [{ label: category.parent.name, href: `/catalog/${category.parent.slug}` }] : []),
    { label: category.name, href: `/catalog/${category.slug}` },
  ]

  return (
    <main>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className={styles.title}>{category.name}</h1>

        {category.children && category.children.length > 0 && (
          <div className={styles.subcategoriesGrid}>
            {category.children.map((child) => (
              <Link
                key={child.id}
                href={`/catalog/${category.slug}/${child.slug}`}
                className={styles.subcategoryCard}
              >
                <div className={styles.subcategoryImageWrapper}>
                  <img
                    src={child.image || getPlaceholderImage(child.name, 200)}
                    alt={child.name}
                    className={styles.subcategoryImage}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      // Если изображение не загрузилось, используем placeholder
                      const target = e.target as HTMLImageElement
                      if (child.image && target.src !== getPlaceholderImage(child.name, 200)) {
                        target.src = getPlaceholderImage(child.name, 200)
                      }
                    }}
                  />
                </div>
                <div className={styles.subcategoryContent}>
                  <h3 className={styles.subcategoryTitle}>{child.name}</h3>
                  {child.count !== undefined && (
                    <span className={styles.subcategoryCount}>{child.count} товаров</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        <FiltersPanel
          maxPrice={maxPrice}
          onFilterChange={(newFilters) => {
            setFilters(newFilters)
          }}
        />
        <SortBar
          sortBy={sortBy}
          sortOrder={sortOrder}
          viewMode={viewMode}
          onSortChange={(newSortBy, newSortOrder) => {
            setSortBy(newSortBy)
            setSortOrder(newSortOrder)
          }}
          onViewModeChange={(newViewMode) => {
            setViewMode(newViewMode)
          }}
        />
        {loading ? (
          <div className={styles.loading}>Загрузка...</div>
        ) : (
          <ProductGrid products={products} viewMode={viewMode} />
        )}
      </div>
    </main>
  )
}

