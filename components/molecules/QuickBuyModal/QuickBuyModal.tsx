'use client'

import { useState } from 'react'
import { Modal } from '@/components/molecules/Modal/Modal'
import { Input } from '@/components/atoms/Input/Input'
import { Button } from '@/components/atoms/Button/Button'
import { formatPrice } from '@/lib/utils'
import styles from './QuickBuyModal.module.scss'

interface QuickBuyModalProps {
  isOpen: boolean
  onClose: () => void
  product: {
    id: string
    title: string
    price: number | string
    quantity: number
  }
}

export function QuickBuyModal({ isOpen, onClose, product }: QuickBuyModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          message: `Быстрая покупка: ${product.title}, количество: ${product.quantity}, цена: ${formatPrice(product.price)}`,
          source: 'quick-buy',
        }),
      })

      if (response.ok) {
        alert('Заявка отправлена! Мы свяжемся с вами в ближайшее время.')
        setFormData({ name: '', phone: '' })
        onClose()
      }
    } catch (error) {
      console.error('Error submitting quick buy:', error)
      alert('Ошибка при отправке заявки')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.startsWith('7')) {
      return `+7 (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7, 9)}-${cleaned.substring(9, 11)}`
    }
    return value
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setFormData({ ...formData, phone: formatted })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Купить в 1 клик">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.productInfo}>
          <p>
            <strong>Товар:</strong> {product.title}
          </p>
          <p>
            <strong>Количество:</strong> {product.quantity}
          </p>
          <p>
            <strong>Цена:</strong> {formatPrice(product.price)}
          </p>
        </div>

        <Input
          label="Имя"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <Input
          label="Телефон"
          type="tel"
          value={formData.phone}
          onChange={handlePhoneChange}
          required
          placeholder="+7 (___) ___-__-__"
        />

        <div className={styles.actions}>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Отправка...' : 'Отправить'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Отмена
          </Button>
        </div>
      </form>
    </Modal>
  )
}


