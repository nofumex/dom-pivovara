'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Input } from '@/components/atoms/Input/Input'
import { Select } from '@/components/atoms/Select/Select'
import styles from './page.module.scss'

interface Order {
  id: string
  orderNumber: string
  total: any
  status: string
  createdAt: Date
  user: {
    firstName: string
    lastName: string
    email: string
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
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
    fetchOrders()
  }, [filters, pagination.page])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      })

      const response = await fetch(`/api/admin/orders?${params}`)
      const data = await response.json()
      if (data.success) {
        setOrders(data.data)
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages,
        }))
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value })
    setPagination({ ...pagination, page: 1 })
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: '#3b82f6',
      PROCESSING: '#f59e0b',
      SHIPPED: '#8b5cf6',
      DELIVERED: '#10b981',
      CANCELLED: '#ef4444',
    }
    return colors[status] || '#64748b'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      NEW: 'Новый',
      PROCESSING: 'В обработке',
      SHIPPED: 'Отгружен',
      DELIVERED: 'Доставлен',
      CANCELLED: 'Отменён',
    }
    return labels[status] || status
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Управление заказами</h1>
          <p className={styles.subtitle}>Список всех заказов магазина</p>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.search}>
          <Input
            placeholder="Поиск по номеру заказа, клиенту, email..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
        <Select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">Все статусы</option>
          <option value="NEW">Новый</option>
          <option value="PROCESSING">В обработке</option>
          <option value="SHIPPED">Отгружен</option>
          <option value="DELIVERED">Доставлен</option>
          <option value="CANCELLED">Отменён</option>
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
          <option value="total-desc">Сумма: по убыванию</option>
          <option value="total-asc">Сумма: по возрастанию</option>
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
              <th>Номер</th>
              <th>Клиент</th>
              <th>Email</th>
              <th>Сумма</th>
              <th>Статус</th>
              <th>Дата</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.empty}>
                      Заказы не найдены
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
              <tr key={order.id}>
                <td>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className={styles.orderLink}
                        >
                          {order.orderNumber}
                        </Link>
                </td>
                <td>
                        <div className={styles.customer}>
                          <span className={styles.customerName}>
                  {order.user.firstName} {order.user.lastName}
                          </span>
                        </div>
                      </td>
                      <td className={styles.email}>{order.user.email}</td>
                      <td className={styles.amount}>
                        {new Intl.NumberFormat('ru-RU').format(Number(order.total))} ₽
                </td>
                      <td>
                        <span
                          className={styles.status}
                          style={{
                            background: `${getStatusColor(order.status)}15`,
                            color: getStatusColor(order.status),
                          }}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className={styles.date}>
                        {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                </td>
                <td>
                  <Link
                    href={`/admin/orders/${order.id}`}
                          className={styles.viewLink}
                  >
                    Просмотр
                  </Link>
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
