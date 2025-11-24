'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/atoms/Button/Button'
import { Select } from '@/components/atoms/Select/Select'
import styles from './CustomerDetails.module.scss'

interface CustomerDetailsProps {
  customer: any
}

export function CustomerDetails({ customer }: CustomerDetailsProps) {
  const router = useRouter()
  const [role, setRole] = useState(customer.role)
  const [isBlocked, setIsBlocked] = useState(customer.isBlocked)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleUpdate = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          isBlocked,
        }),
      })

      const data = await response.json()
      if (data.success) {
        alert('Клиент обновлен')
        router.refresh()
      } else {
        alert(data.error || 'Ошибка при обновлении клиента')
      }
    } catch (error) {
      console.error('Error updating customer:', error)
      alert('Ошибка при обновлении клиента')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <h1>
        {customer.firstName} {customer.lastName}
      </h1>

      <div className={styles.sections}>
        <div className={styles.section}>
          <h2>Личная информация</h2>
          <div className={styles.info}>
            <p>
              <strong>Email:</strong> {customer.email}
            </p>
            <p>
              <strong>Телефон:</strong> {customer.phone || '-'}
            </p>
            {customer.company && (
              <p>
                <strong>Компания:</strong> {customer.company}
              </p>
            )}
            <p>
              <strong>Дата регистрации:</strong>{' '}
              {new Date(customer.createdAt).toLocaleDateString('ru-RU')}
            </p>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Управление</h2>
          <div className={styles.form}>
            <Select label="Роль" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="CUSTOMER">Клиент</option>
              <option value="ADMIN">Администратор</option>
            </Select>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isBlocked}
                onChange={(e) => setIsBlocked(e.target.checked)}
              />
              <span>Заблокирован</span>
            </label>
            <Button variant="primary" onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          </div>
        </div>

        {customer.orders && customer.orders.length > 0 && (
          <div className={styles.section}>
            <h2>Заказы ({customer.orders.length})</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Номер</th>
                  <th>Сумма</th>
                  <th>Статус</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                {customer.orders.map((order: any) => (
                  <tr key={order.id}>
                    <td>{order.orderNumber}</td>
                    <td>
                      {new Intl.NumberFormat('ru-RU').format(Number(order.total))} ₽
                    </td>
                    <td>{order.status}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString('ru-RU')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

