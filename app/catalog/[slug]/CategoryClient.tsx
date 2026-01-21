'use client'

import Link from 'next/link'
import Image from 'next/image'
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
    children?: Array<{ id: string; name: string; slug: string; image?: string | null; count?: number }>
  }
  initialProducts: any[]
}

export function CategoryClient({ category, initialProducts }: CategoryClientProps) {
  const LIMIT = 20
  const [products, setProducts] = useState(initialProducts)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({
    priceMin: 0,
    priceMax: 100000,
    onSale: false,
  })
  const [sortBy, setSortBy] = useState<'popularity' | 'name' | 'price' | 'createdAt'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      setPage(1) // Сбрасываем страницу при изменении фильтров
      try {
        const params = new URLSearchParams({
          category: category.slug,
          page: '1',
          limit: LIMIT.toString(), // Уменьшили лимит с 50 до 20
          sortBy,
          sortOrder,
        })

        if (filters.priceMin > 0) {
          params.append('priceMin', filters.priceMin.toString())
        }
        if (filters.priceMax < 100000) {
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
            stockStatus: p.stockStatus || (p.isInStock ? (p.stock === 0 ? 'NONE' : p.stock >= 1 && p.stock <= 2 ? 'FEW' : p.stock >= 3 && p.stock <= 10 ? 'ENOUGH' : 'MANY') : 'NONE'),
            rating: p.rating ? Number(p.rating) : 0,
          }))

          // Отладка
          console.log('API Response:', {
            pagination: data.pagination,
            dataLength: productsWithBadges.length,
            total: data.total,
            fullData: data
          })

          const totalItems = data.pagination?.total ?? data.total ?? 0
          const totalPages = data.pagination?.pages ?? (totalItems > 0 ? Math.ceil(totalItems / LIMIT) : 1)
          
          // Упрощенная логика: показываем кнопку если:
          // 1. Есть pagination.total и он больше загруженных товаров
          // 2. ИЛИ есть pagination.pages и страниц больше 1
          // 3. ИЛИ загружено ровно LIMIT товаров (значит могут быть еще)
          const hasMoreProducts = 
            (totalItems > 0 && totalItems > productsWithBadges.length) ||
            (totalPages > 1) ||
            (productsWithBadges.length === LIMIT)

          console.log('hasMore calculation:', {
            totalItems,
            loaded: productsWithBadges.length,
            totalPages,
            hasMoreProducts
          })

          setProducts(productsWithBadges)
          setTotal(totalItems)
          setHasMore(hasMoreProducts)
          setPage(1)
        }
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [category.slug, filters, sortBy, sortOrder])

  const loadMore = async () => {
    if (loading || !hasMore) return
    
    setLoading(true)
    try {
      const nextPage = page + 1
      const params = new URLSearchParams({
        category: category.slug,
        page: nextPage.toString(),
        limit: LIMIT.toString(),
        sortBy,
        sortOrder,
      })

      if (filters.priceMin > 0) {
        params.append('priceMin', filters.priceMin.toString())
      }
      if (filters.priceMax < 100000) {
        params.append('priceMax', filters.priceMax.toString())
      }
      if (filters.onSale) {
        params.append('tags', 'SALE')
      }

      const response = await fetch(`/api/products?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        const newProducts = (data.data || []).map((p: any) => ({
          ...p,
          badges: p.tags || [],
          stockStatus: p.stockStatus || (p.isInStock ? (p.stock === 0 ? 'NONE' : p.stock >= 1 && p.stock <= 2 ? 'FEW' : p.stock >= 3 && p.stock <= 10 ? 'ENOUGH' : 'MANY') : 'NONE'),
          rating: p.rating ? Number(p.rating) : 0,
        }))

        const totalItems = data.pagination?.total ?? data.total ?? 0
        const totalPages = data.pagination?.pages ?? (totalItems > 0 ? Math.ceil(totalItems / LIMIT) : nextPage)

        setProducts((prev) => {
          const updated = [...prev, ...newProducts]
          // Если API вернул пусто — больше грузить нечего
          if (newProducts.length === 0) {
            setHasMore(false)
            return updated
          }

          const hasMoreCalculated = 
            (totalItems > 0 && totalItems > updated.length) ||
            (nextPage < totalPages) ||
            (newProducts.length === LIMIT)
          
          setHasMore(hasMoreCalculated)
          return updated
        })
        
        if (totalItems > 0) {
          setTotal(totalItems)
        }
        setPage(nextPage)
      }
    } catch (error) {
      console.error('Error loading more products:', error)
    } finally {
      setLoading(false)
    }
  }

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
                  <Image
                    src={child.image || getPlaceholderImage(child.name, 200)}
                    alt={child.name}
                    width={200}
                    height={200}
                    className={styles.subcategoryImage}
                    loading="lazy"
                    onError={(e) => {
                      // Если изображение не загрузилось, используем placeholder
                      const target = e.target as HTMLImageElement
                      const placeholderUrl = getPlaceholderImage(child.name, 200)
                      if (target.src !== placeholderUrl) {
                        target.src = placeholderUrl
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
          onFilterChange={(newFilters) => {
            setFilters(newFilters)
          }}
        />
        <SortBar
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={(newSortBy, newSortOrder) => {
            setSortBy(newSortBy)
            setSortOrder(newSortOrder)
          }}
        />

        <div className={styles.toolbar}>
          <span className={styles.countInfo}>
            Показано {products.length}{total ? ` из ${total}` : ''} товаров
          </span>
          {products.length > 0 && (
            <button
              onClick={loadMore}
              disabled={loading || (!hasMore && products.length < LIMIT)}
              className={styles.loadMoreButtonInline}
            >
              {loading ? 'Загрузка...' : hasMore || products.length >= LIMIT ? 'Показать еще' : 'Обновить'}
            </button>
          )}
        </div>
        {loading && page === 1 ? (
          <div className={styles.loading}>Загрузка...</div>
        ) : (
          <>
            <ProductGrid products={products} />
            {products.length > 0 && (
              <div className={styles.loadMoreWrapper}>
                {hasMore || products.length >= LIMIT ? (
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className={styles.loadMoreButton}
                  >
                    {loading ? 'Загрузка...' : 'Показать еще'}
                  </button>
                ) : (
                  <p style={{ textAlign: 'center', color: 'var(--color-muted)' }}>
                    Показано {products.length} {total > 0 ? `из ${total}` : ''} товаров
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

