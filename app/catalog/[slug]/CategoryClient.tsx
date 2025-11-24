'use client'

import { useState, useEffect } from 'react'
import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import { FiltersPanel } from '@/components/organisms/FiltersPanel/FiltersPanel'
import { SortBar } from '@/components/molecules/SortBar/SortBar'
import { ProductGrid } from '@/components/organisms/ProductGrid/ProductGrid'
import styles from './page.module.scss'

interface CategoryClientProps {
  category: {
    id: string
    name: string
    slug: string
    parent?: { name: string; slug: string } | null
    children?: Array<{ id: string; name: string; slug: string }>
  }
  initialProducts: any[]
}

export function CategoryClient({ category, initialProducts }: CategoryClientProps) {
  const [products, setProducts] = useState(initialProducts)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    priceMin: 0,
    priceMax: 100000,
    onSale: false,
  })
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

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
          <div className={styles.subcategories}>
            <h2>Подкатегории:</h2>
            <div className={styles.subcategoriesList}>
              {category.children.map((child) => (
                <a
                  key={child.id}
                  href={`/catalog/${category.slug}/${child.slug}`}
                  className={styles.subcategoryLink}
                >
                  {child.name}
                </a>
              ))}
            </div>
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
        {loading ? (
          <div className={styles.loading}>Загрузка...</div>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </main>
  )
}

