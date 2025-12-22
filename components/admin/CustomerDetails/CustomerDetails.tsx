'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { Select } from '@/components/atoms/Select/Select'
import styles from './CustomerDetails.module.scss'

interface CustomerDetailsProps {
  customer: any
}

export function CustomerDetails({ customer }: CustomerDetailsProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: customer.firstName || '',
    lastName: customer.lastName || '',
    email: customer.email || '',
    phone: customer.phone || '',
    company: customer.company || '',
    role: customer.role,
    isBlocked: customer.isBlocked,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleUpdate = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
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
          <h2>Редактирование пользователя</h2>
          <div className={styles.form}>
            <div className={styles.field}>
              <Input
                label="Имя *"
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div className={styles.field}>
              <Input
                label="Фамилия *"
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
            <div className={styles.field}>
              <Input
                label="Email *"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className={styles.field}>
              <Input
                label="Телефон"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <Input
                label="Компания"
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <Select
                label="Роль *"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              >
                <option value="CUSTOMER">Клиент</option>
                <option value="ADMIN">Администратор</option>
              </Select>
            </div>
            <div className={styles.field}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.isBlocked}
                  onChange={(e) => setFormData({ ...formData, isBlocked: e.target.checked })}
                />
                <span>Заблокирован</span>
              </label>
            </div>
            <div className={styles.field}>
              <p className={styles.info}>
                <strong>Дата регистрации:</strong>{' '}
                {new Date(customer.createdAt).toLocaleDateString('ru-RU')}
              </p>
            </div>
            <div className={styles.actions}>
              <Button variant="primary" onClick={handleUpdate} disabled={isSubmitting}>
                {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
              <Button variant="secondary" onClick={() => router.back()}>
                Отмена
              </Button>
            </div>
          </div>
        </div>

        {(customer.Order || customer.orders) && (customer.Order || customer.orders).length > 0 && (
          <div className={styles.section}>
            <h2>Заказы ({(customer.Order || customer.orders).length})</h2>
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
                {(customer.Order || customer.orders || []).map((order: any) => (
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




