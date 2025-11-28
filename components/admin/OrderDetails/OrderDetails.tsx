'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/atoms/Button/Button'
import { Select } from '@/components/atoms/Select/Select'
import { Input } from '@/components/atoms/Input/Input'
import styles from './OrderDetails.module.scss'

interface OrderDetailsProps {
  order: any
}

export function OrderDetails({ order }: OrderDetailsProps) {
  const router = useRouter()
  const [status, setStatus] = useState(order.status)
  const [trackNumber, setTrackNumber] = useState(order.trackNumber || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleUpdate = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status,
          trackNumber,
        }),
      })

      const data = await response.json()
      if (data.success) {
        alert('Заказ обновлен')
        router.refresh()
      } else {
        alert(data.error || 'Ошибка при обновлении заказа')
      }
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Ошибка при обновлении заказа')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <h1>Заказ {order.orderNumber}</h1>

      <div className={styles.sections}>
        <div className={styles.section}>
          <h2>Информация о клиенте</h2>
          <div className={styles.info}>
            <p>
              <strong>Имя:</strong> {order.firstName} {order.lastName}
            </p>
            <p>
              <strong>Email:</strong> {order.email}
            </p>
            <p>
              <strong>Телефон:</strong> {order.phone}
            </p>
            {order.company && (
              <p>
                <strong>Компания:</strong> {order.company}
              </p>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <h2>Состав заказа</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Товар</th>
                <th>Количество</th>
                <th>Цена</th>
                <th>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item: any) => (
                <tr key={item.id}>
                  <td>{item.product.title}</td>
                  <td>{item.quantity}</td>
                  <td>{new Intl.NumberFormat('ru-RU').format(Number(item.price))} ₽</td>
                  <td>
                    {new Intl.NumberFormat('ru-RU').format(Number(item.total))} ₽
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>
                  <strong>Итого:</strong>
                </td>
                <td>
                  <strong>
                    {new Intl.NumberFormat('ru-RU').format(Number(order.total))} ₽
                  </strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className={styles.section}>
          <h2>Управление заказом</h2>
          <div className={styles.form}>
            <Select
              label="Статус"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="NEW">Новый</option>
              <option value="PROCESSING">В обработке</option>
              <option value="SHIPPED">Отгружен</option>
              <option value="DELIVERED">Доставлен</option>
              <option value="CANCELLED">Отменён</option>
            </Select>
            <Input
              label="Трек-номер"
              value={trackNumber}
              onChange={(e) => setTrackNumber(e.target.value)}
              placeholder="Введите трек-номер"
            />
            <Button
              variant="primary"
              onClick={handleUpdate}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          </div>
        </div>

        {order.logs && order.logs.length > 0 && (
          <div className={styles.section}>
            <h2>История изменений</h2>
            <div className={styles.logs}>
              {order.logs.map((log: any) => (
                <div key={log.id} className={styles.log}>
                  <span className={styles.logDate}>
                    {new Date(log.createdAt).toLocaleString('ru-RU')}
                  </span>
                  <span className={styles.logStatus}>{log.status}</span>
                  {log.comment && <span className={styles.logComment}>{log.comment}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}




