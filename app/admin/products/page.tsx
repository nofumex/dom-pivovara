'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { Select } from '@/components/atoms/Select/Select'
import styles from './page.module.scss'

interface Product {
  id: string
  sku: string
  title: string
  slug: string
  price: any
  stock: number
  isActive: boolean
  visibility: string
  category: string
  categoryObj: {
    name: string
    slug: string
  }
  createdAt: Date
}

interface Category {
  id: string
  name: string
  slug: string
}

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    visibility: '',
    isActive: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  })

  useEffect(() => {
    fetchCategories()
    fetchProducts()
  }, [filters, pagination.page])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories')
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.category && { category: filters.category }),
        ...(filters.visibility && { visibility: filters.visibility }),
        ...(filters.isActive && { isActive: filters.isActive }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      })

      const response = await fetch(`/api/admin/products?${params}`)
      const data = await response.json()
      if (data.success) {
        setProducts(data.data)
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages,
        }))
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value })
    setPagination({ ...pagination, page: 1 })
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Управление товарами</h1>
          <p className={styles.subtitle}>Список всех товаров магазина</p>
        </div>
        <Link href="/admin/products/create">
          <Button variant="primary">+ Создать товар</Button>
        </Link>
      </div>

      <div className={styles.filters}>
        <div className={styles.search}>
          <Input
            placeholder="Поиск по названию, SKU, описанию..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
        <Select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
        >
          <option value="">Все категории</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Select>
        <Select
          value={filters.visibility}
          onChange={(e) => handleFilterChange('visibility', e.target.value)}
        >
          <option value="">Все видимости</option>
          <option value="VISIBLE">Видимый</option>
          <option value="HIDDEN">Скрытый</option>
          <option value="DRAFT">Черновик</option>
        </Select>
        <Select
          value={filters.isActive}
          onChange={(e) => handleFilterChange('isActive', e.target.value)}
        >
          <option value="">Все статусы</option>
          <option value="true">Активные</option>
          <option value="false">Неактивные</option>
        </Select>
        <Select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split('-')
            setFilters({ ...filters, sortBy, sortOrder })
          }}
        >
          <option value="createdAt-desc">Новые сначала</option>
          <option value="createdAt-asc">Старые сначала</option>
          <option value="price-desc">Цена: по убыванию</option>
          <option value="price-asc">Цена: по возрастанию</option>
          <option value="title-asc">Название: А-Я</option>
          <option value="title-desc">Название: Я-А</option>
        </Select>
      </div>

      {loading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Название</th>
                  <th>Категория</th>
                  <th>Класс</th>
                  <th>Цена</th>
                  <th>Остаток</th>
                  <th>Статус</th>
                  <th>Видимость</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={9} className={styles.empty}>
                      Товары не найдены
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id}>
                      <td className={styles.sku}>{product.sku}</td>
                      <td>
                        <Link
                          href={`/admin/products/${product.slug}/edit`}
                          className={styles.productLink}
                        >
                          {product.title}
                        </Link>
                      </td>
                      <td>{product.categoryObj.name}</td>
                      <td>
                        <span className={styles.categoryBadge}>
                          {product.category === 'ECONOMY' && 'Эконом'}
                          {product.category === 'MIDDLE' && 'Средний'}
                          {product.category === 'LUXURY' && 'Премиум'}
                        </span>
                      </td>
                      <td className={styles.price}>
                        {new Intl.NumberFormat('ru-RU').format(Number(product.price))} ₽
                      </td>
                      <td className={styles.stock}>{product.stock}</td>
                      <td>
                        <span
                          className={`${styles.status} ${
                            product.isActive ? styles.active : styles.inactive
                          }`}
                        >
                          {product.isActive ? 'Активен' : 'Неактивен'}
                        </span>
                      </td>
                      <td>
                        <span className={styles.visibility}>
                          {product.visibility === 'VISIBLE' && 'Видимый'}
                          {product.visibility === 'HIDDEN' && 'Скрытый'}
                          {product.visibility === 'DRAFT' && 'Черновик'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <Link
                            href={`/admin/products/${product.slug}/edit`}
                            className={styles.editLink}
                          >
                            Редактировать
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() =>
                  setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })
                }
                disabled={pagination.page === 1}
                className={styles.paginationButton}
              >
                Назад
              </button>
              <span className={styles.paginationInfo}>
                Страница {pagination.page} из {pagination.pages}
              </span>
              <button
                onClick={() =>
                  setPagination({
                    ...pagination,
                    page: Math.min(pagination.pages, pagination.page + 1),
                  })
                }
                disabled={pagination.page === pagination.pages}
                className={styles.paginationButton}
              >
                Вперед
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
