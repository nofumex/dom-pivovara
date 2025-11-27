'use client'

import { useState } from 'react'
import { Modal } from '@/components/molecules/Modal/Modal'
import { Input } from '@/components/atoms/Input/Input'
import { Select } from '@/components/atoms/Select/Select'
import { Button } from '@/components/atoms/Button/Button'
import { useCartStore } from '@/store/cart-store'
import { useAuthStore } from '@/store/auth-store'
import styles from './CheckoutModal.module.scss'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (orderNumber: string) => void
}

export function CheckoutModal({ isOpen, onClose, onSuccess }: CheckoutModalProps) {
  const items = useCartStore((state) => state.items)
  const getTotalPrice = useCartStore((state) => state.getTotalPrice)
  const clearCart = useCartStore((state) => state.clearCart)
  const user = useAuthStore((state) => state.user)

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    email: user?.email || '',
    company: user?.company || '',
    deliveryType: 'PICKUP' as 'PICKUP' | 'COURIER' | 'TRANSPORT',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
          ...formData,
        }),
      })

      const data = await response.json()
      if (data.success) {
        clearCart()
        if (onSuccess) {
          onSuccess(data.data.orderNumber)
        } else {
          alert(`Заказ оформлен! Номер заказа: ${data.data.orderNumber}`)
        }
        onClose()
      } else {
        alert(data.error || 'Ошибка при оформлении заказа')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Ошибка при оформлении заказа')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Оформление заказа">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.items}>
          <h3>Товары в заказе:</h3>
          {items.map((item) => (
            <div key={item.id} className={styles.item}>
              <span>{item.product.title}</span>
              <span>
                {item.quantity} × {item.price} ₽
              </span>
            </div>
          ))}
          <div className={styles.total}>
            <strong>Итого: {getTotalPrice()} ₽</strong>
          </div>
        </div>

        <Input
          label="Имя"
          value={formData.firstName}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          required
        />
        <Input
          label="Фамилия"
          value={formData.lastName}
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          required
        />
        <Input
          label="Телефон"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
        />
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <Input
          label="Компания"
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
        />
        <Select
          label="Способ доставки"
          value={formData.deliveryType}
          onChange={(e) =>
            setFormData({ ...formData, deliveryType: e.target.value as any })
          }
          required
        >
          <option value="PICKUP">Самовывоз</option>
          <option value="COURIER">Курьер</option>
          <option value="TRANSPORT">Транспортная компания</option>
        </Select>
        <Input
          label="Комментарий к заказу"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />

        <div className={styles.actions}>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Оформление...' : 'Оформить заказ'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Отмена
          </Button>
        </div>
      </form>
    </Modal>
  )
}


