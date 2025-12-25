'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import { ProductCard } from '@/components/molecules/ProductCard/ProductCard'
import { useFavoritesStore } from '@/store/favorites-store'
import styles from './page.module.scss'

export default function FavoritesPage() {
  const favoriteIds = useFavoritesStore((state) => state.getAll())
  const [products, setProducts] = useState<Array<{
    id: string
    title: string
    slug: string
    price: number | string
    images?: string[]
    badges?: string[]
    stockStatus?: string
    rating?: number
  }>>([])
  const [isLoading, setIsLoading] = useState(true)

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Избранное', href: '/favorites' },
  ]

  useEffect(() => {
    const fetchProducts = async () => {
      if (favoriteIds.length === 0) {
        setProducts([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const response = await fetch(`/api/products?id[]=${favoriteIds.join('&id[]=')}`)
        const data = await response.json()
        if (data.success) {
          setProducts(data.data || [])
        }
      } catch (error) {
        console.error('Error fetching favorites:', error)
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [favoriteIds])

  return (
    <main className={styles.page}>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className={styles.title}>Избранное</h1>

        {isLoading ? (
          <div className={styles.loading}>
            <p>Загрузка...</p>
          </div>
        ) : favoriteIds.length === 0 || products.length === 0 ? (
          <div className={styles.empty}>
            <p>Избранное пусто</p>
            <Link href="/catalog" className={styles.link}>
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <>
            <p className={styles.count}>
              {products.length} {products.length === 1 ? 'товар' : products.length < 5 ? 'товара' : 'товаров'}
            </p>
            <div className={styles.grid}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}

