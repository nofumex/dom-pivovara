'use client'

import { useEffect, useState } from 'react'
import { ProductGrid } from '@/components/organisms/ProductGrid/ProductGrid'
import styles from './page.module.scss'

interface SearchClientProps {
  query: string
}

export function SearchClient({ query }: SearchClientProps) {
  const LIMIT = 20
  const [products, setProducts] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const mapProducts = (items: any[]) =>
    (items || []).map((p: any) => ({
      ...p,
      badges: p.tags || [],
      stockStatus: p.stockStatus || (p.isInStock
        ? (p.stock === 0
          ? 'NONE'
          : p.stock >= 1 && p.stock <= 2
            ? 'FEW'
            : p.stock >= 3 && p.stock <= 10
              ? 'ENOUGH'
              : 'MANY')
        : 'NONE'),
      rating: p.rating ? Number(p.rating) : 0,
    }))

  useEffect(() => {
    const fetchProducts = async () => {
      if (!query) {
        setProducts([])
        setTotal(0)
        setHasMore(false)
        setPage(1)
        return
      }

      setLoading(true)
      try {
        const params = new URLSearchParams({
          search: query,
          page: '1',
          limit: LIMIT.toString(),
          sortBy: 'createdAt',
          sortOrder: 'desc',
        })

        const response = await fetch(`/api/products?${params.toString()}`)
        const data = await response.json()

        if (data.success) {
          const mapped = mapProducts(data.data || [])
          const totalItems = data.pagination?.total ?? data.total ?? mapped.length
          const totalPages = data.pagination?.pages ?? (Math.ceil(totalItems / LIMIT) || 1)
          const nextHasMore =
            (typeof totalItems === 'number' && totalItems > mapped.length) ||
            totalPages > 1 ||
            mapped.length === LIMIT

          setProducts(mapped)
          setTotal(totalItems)
          setHasMore(nextHasMore)
          setPage(1)
        } else {
          setProducts([])
          setTotal(0)
          setHasMore(false)
          setPage(1)
        }
      } catch (error) {
        console.error('Search fetch error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [query])

  const loadMore = async () => {
    if (loading || !hasMore) return

    const nextPage = page + 1
    setLoading(true)
    try {
      const params = new URLSearchParams({
        search: query,
        page: nextPage.toString(),
        limit: LIMIT.toString(),
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })

      const response = await fetch(`/api/products?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        const mapped = mapProducts(data.data || [])
        const totalItems = data.pagination?.total ?? data.total
        const totalPages = data.pagination?.pages ?? (Math.ceil((totalItems ?? 0) / LIMIT) || nextPage)

        setProducts((prev) => [...prev, ...mapped])
        if (typeof totalItems === 'number') {
          setTotal(totalItems)
        }
        setPage(nextPage)
        const currentTotal = typeof totalItems === 'number' ? totalItems : undefined
        const loadedCount = products.length + mapped.length
        const hasMoreCalculated =
          (typeof currentTotal === 'number' && currentTotal > loadedCount) ||
          nextPage < totalPages ||
          mapped.length === LIMIT
        setHasMore(hasMoreCalculated)
      }
    } catch (error) {
      console.error('Search load more error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1 className={styles.title}>
        {query ? `Результаты поиска по "${query}"` : 'Поиск'}
      </h1>
      {query && (
        <p className={styles.count}>Найдено: {total} товаров</p>
      )}

      {query && products.length > 0 && (
        <>
          <ProductGrid products={products} />
          {hasMore && (
            <div className={styles.loadMoreWrapper}>
              <button
                onClick={loadMore}
                disabled={loading}
                className={styles.loadMoreButton}
              >
                {loading ? 'Загрузка...' : 'Показать еще'}
              </button>
            </div>
          )}
        </>
      )}

      {query && products.length === 0 && !loading && (
        <div className={styles.empty}>
          <p>Ничего не найдено</p>
          <p className={styles.suggestion}>
            Попробуйте изменить запрос или зайдите в{' '}
            <a href="/catalog">каталог</a>
          </p>
        </div>
      )}

      {!query && (
        <div className={styles.empty}>
          <p>Введите запрос для поиска</p>
        </div>
      )}
    </>
  )
}
