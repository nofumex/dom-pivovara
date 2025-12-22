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

  // Разделяем комментарий и адрес самовывоза
  const pickupMatch = order.notes?.match(/Пункт самовывоза:\s*(.+)/)
  const userComment = pickupMatch 
    ? order.notes?.replace(/\n?Пункт самовывоза:.*$/, '').trim() || null
    : order.notes
  const pickupAddress = pickupMatch ? pickupMatch[1] : null

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

        {order.deliveryType && (
          <div className={styles.section}>
            <h2>Доставка</h2>
            <div className={styles.info}>
              <p>
                <strong>Тип доставки:</strong>{' '}
                {order.deliveryType === 'PICKUP'
                  ? 'Самовывоз'
                  : order.deliveryType === 'COURIER'
                  ? 'Курьером'
                  : order.deliveryType === 'TRANSPORT'
                  ? 'Транспортной компанией'
                  : order.deliveryType}
              </p>
              {order.Address && (
                <div>
                  <p>
                    <strong>Адрес доставки:</strong>
                  </p>
                  <p style={{ marginLeft: '20px', marginTop: '5px' }}>
                    {order.Address.name && (
                      <>
                        <strong>Название:</strong> {order.Address.name}
                        <br />
                      </>
                    )}
                    {order.Address.street && (
                      <>
                        <strong>Улица:</strong> {order.Address.street}
                        <br />
                      </>
                    )}
                    {order.Address.city && (
                      <>
                        <strong>Город:</strong> {order.Address.city}
                        <br />
                      </>
                    )}
                    {order.Address.region && (
                      <>
                        <strong>Регион:</strong> {order.Address.region}
                        <br />
                      </>
                    )}
                    {order.Address.zipCode && (
                      <>
                        <strong>Индекс:</strong> {order.Address.zipCode}
                        <br />
                      </>
                    )}
                    {order.Address.phone && (
                      <>
                        <strong>Телефон:</strong> {order.Address.phone}
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {userComment && (
          <div className={styles.section}>
            <h2>Комментарий к заказу</h2>
            <div className={styles.info}>
              <p>{userComment}</p>
            </div>
          </div>
        )}

        {pickupAddress && order.deliveryType === 'PICKUP' && (
          <div className={styles.section}>
            <h2>Пункт самовывоза</h2>
            <div className={styles.info}>
              <p>{pickupAddress}</p>
            </div>
          </div>
        )}

        {order.promoCode && (
          <div className={styles.section}>
            <h2>Промокод</h2>
            <div className={styles.info}>
              <p>
                <strong>Код:</strong> {order.promoCode}
              </p>
            </div>
          </div>
        )}

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
              {(order.OrderItem || order.items || []).map((item: any) => (
                <tr key={item.id}>
                  <td>{(item.Product || item.product)?.title || 'Товар'}</td>
                  <td>{item.quantity}</td>
                  <td>{new Intl.NumberFormat('ru-RU').format(Number(item.price))} ₽</td>
                  <td>
                    {new Intl.NumberFormat('ru-RU').format(Number(item.total))} ₽
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              {Number(order.delivery || 0) > 0 && (
                <tr>
                  <td colSpan={3}>
                    <strong>Доставка:</strong>
                  </td>
                  <td>
                    {new Intl.NumberFormat('ru-RU').format(Number(order.delivery || 0))} ₽
                  </td>
                </tr>
              )}
              {Number(order.discount || 0) > 0 && (
                <tr>
                  <td colSpan={3}>
                    <strong>Скидка:</strong>
                  </td>
                  <td>
                    -{new Intl.NumberFormat('ru-RU').format(Number(order.discount || 0))} ₽
                  </td>
                </tr>
              )}
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

        {(order.OrderLog || order.logs) && (order.OrderLog || order.logs).length > 0 && (
          <div className={styles.section}>
            <h2>История изменений</h2>
            <div className={styles.logs}>
              {(order.OrderLog || order.logs || []).map((log: any) => (
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




