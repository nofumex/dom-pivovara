'use client'

import Link from 'next/link'
import styles from './RecentOrders.module.scss'

interface Order {
  id: string
  orderNumber: string
  total: any
  status: string
  createdAt: Date
  User: {
    firstName: string
    lastName: string
    email: string
  }
  OrderItem: Array<{
    quantity: number
    Product: {
      title: string
    }
  }>
}

interface RecentOrdersProps {
  orders: Order[]
}

export function RecentOrders({ orders }: RecentOrdersProps) {
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
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Последние заказы</h2>
        <Link href="/admin/orders" className={styles.cardLink}>
          Все заказы →
        </Link>
      </div>
      <div className={styles.table}>
        {orders.length === 0 ? (
          <div className={styles.empty}>Нет заказов</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Номер</th>
                <th>Клиент</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link href={`/admin/orders/${order.id}`} className={styles.orderLink}>
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td>
                    <div className={styles.customer}>
                      <span className={styles.customerName}>
                        {order.User.firstName} {order.User.lastName}
                      </span>
                      <span className={styles.customerEmail}>{order.User.email}</span>
                    </div>
                  </td>
                  <td className={styles.amount}>
                    {new Intl.NumberFormat('ru-RU').format(Number(order.total))} ₽
                  </td>
                  <td>
                    <span
                      className={styles.status}
                      style={{ background: `${getStatusColor(order.status)}15`, color: getStatusColor(order.status) }}
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}



