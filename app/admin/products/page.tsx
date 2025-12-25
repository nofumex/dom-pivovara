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
  Category: {
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
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    visibility: '',
    isActive: '',
    stock: '',
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
  }, [])

  useEffect(() => {
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
        ...(filters.stock && { stock: filters.stock }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      })

      const response = await fetch(`/api/admin/products?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Products API HTTP error:', response.status, response.statusText, errorText)
        setProducts([])
        setLoading(false)
        return
      }
      const data = await response.json()
      console.log('Products API response:', data)
      console.log('Products API response keys:', Object.keys(data))
      console.log('Products API data.success:', data.success)
      console.log('Products API data.data:', data.data)
      console.log('Products API data.data type:', typeof data.data)
      console.log('Products API data.data isArray:', Array.isArray(data.data))
      
      if (data.success) {
        const productsData = Array.isArray(data.data) ? data.data : (data.data ? [data.data] : [])
        console.log('Products loaded:', productsData.length, 'products')
        setProducts(productsData)
        if (data.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: data.pagination.total || 0,
            pages: data.pagination.pages || 0,
          }))
        } else {
          console.warn('Products API: No pagination data')
        }
      } else {
        console.error('Products API error:', data.error || data.message || 'Unknown error', data)
        alert(`Ошибка загрузки товаров: ${data.error || data.message || 'Неизвестная ошибка'}`)
        setProducts([])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value })
    setPagination({ ...pagination, page: 1 })
  }

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(products.map((p) => p.id)))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedProducts.size === 0) {
      alert('Выберите товары для удаления')
      return
    }

    if (!confirm(`Вы уверены, что хотите удалить ${selectedProducts.size} товар(ов)?`)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch('/api/admin/products', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: Array.from(selectedProducts),
        }),
      })

      const data = await response.json()
      if (data.success) {
        let message = `Успешно удалено товаров: ${data.data.deleted}`
        if (data.data.cannotDelete > 0) {
          message += `\n\nНе удалось удалить ${data.data.cannotDelete} товар(ов), так как они используются в заказах.`
        }
        if (data.data.notFound > 0) {
          message += `\n\nНе найдено товаров: ${data.data.notFound}`
        }
        alert(message)
        setSelectedProducts(new Set())
        fetchProducts()
      } else {
        alert(`Ошибка при удалении: ${data.error}`)
      }
    } catch (error) {
      console.error('Error deleting products:', error)
      alert('Ошибка при удалении товаров')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteAll = async () => {
    // Первое подтверждение
    if (!confirm('ВНИМАНИЕ! Вы собираетесь удалить ВСЕ товары из базы данных. Это действие нельзя отменить. Продолжить?')) {
      return
    }

    // Второе подтверждение для безопасности
    const confirmText = 'УДАЛИТЬ ВСЕ'
    const userInput = prompt(`Для подтверждения введите "${confirmText}":`)
    
    if (userInput !== confirmText) {
      alert('Операция отменена. Текст подтверждения не совпадает.')
      return
    }

    setIsDeletingAll(true)
    try {
      const response = await fetch('/api/admin/products/delete-all', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      if (data.success) {
        let message = data.message || `Успешно удалено товаров: ${data.data.deleted} из ${data.data.total}`
        if (data.data.cannotDelete > 0) {
          message += `\n\nНе удалось удалить ${data.data.cannotDelete} товар(ов), так как они используются в заказах.`
        }
        alert(message)
        setSelectedProducts(new Set())
        fetchProducts()
      } else {
        alert(`Ошибка при удалении: ${data.error}`)
      }
    } catch (error) {
      console.error('Error deleting all products:', error)
      alert('Ошибка при удалении всех товаров')
    } finally {
      setIsDeletingAll(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Управление товарами</h1>
          <p className={styles.subtitle}>Список всех товаров магазина</p>
        </div>
        <div className={styles.headerActions}>
          <button
            onClick={handleDeleteAll}
            disabled={isDeletingAll || loading || pagination.total === 0}
            className={styles.deleteAllButton}
            title="Удалить все товары"
          >
            {isDeletingAll ? 'Удаление...' : '🗑️ Удалить все'}
          </button>
          <Link href="/admin/products/create">
            <Button variant="primary">+ Создать товар</Button>
          </Link>
        </div>
      </div>

      {selectedProducts.size > 0 && (
        <div className={styles.selectionBar}>
          <div className={styles.selectionInfo}>
            Выбрано товаров: <strong>{selectedProducts.size}</strong>
          </div>
          <button
            onClick={handleDeleteSelected}
            disabled={isDeleting}
            className={styles.deleteButton}
          >
            {isDeleting ? 'Удаление...' : `Удалить выбранные (${selectedProducts.size})`}
          </button>
        </div>
      )}

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
          value={filters.stock}
          onChange={(e) => handleFilterChange('stock', e.target.value)}
        >
          <option value="">Все остатки</option>
          <option value="in_stock">В наличии (stock &gt; 0)</option>
          <option value="out_of_stock">Нет в наличии (stock = 0)</option>
          <option value="low">Мало (1-10)</option>
          <option value="many">Много (&gt; 10)</option>
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
                  <th className={styles.checkboxColumn}>
                    <input
                      type="checkbox"
                      checked={products.length > 0 && selectedProducts.size === products.length}
                      onChange={handleSelectAll}
                      className={styles.checkbox}
                    />
                  </th>
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
                    <td colSpan={10} className={styles.empty}>
                      Товары не найдены
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className={selectedProducts.has(product.id) ? styles.selected : ''}>
                      <td className={styles.checkboxColumn}>
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                          className={styles.checkbox}
                        />
                      </td>
                      <td className={styles.sku}>{product.sku}</td>
                      <td>
                        <Link
                          href={`/admin/products/${product.slug}/edit`}
                          className={styles.productLink}
                        >
                          {product.title}
                        </Link>
                      </td>
                      <td>{product.Category?.name || 'Без категории'}</td>
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
