'use client'

import { useState } from 'react'
import { Modal } from '@/components/molecules/Modal/Modal'
import { Input } from '@/components/atoms/Input/Input'
import { Button } from '@/components/atoms/Button/Button'
import styles from './CheaperModal.module.scss'

interface CheaperModalProps {
  isOpen: boolean
  onClose: () => void
  productTitle?: string
}

export function CheaperModal({ isOpen, onClose, productTitle }: CheaperModalProps) {
  const [formData, setFormData] = useState({
    url: '',
    price: '',
    comment: '',
    agree: false,
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
          name: 'Нашли дешевле',
          message: `Товар: ${productTitle || ''}\nСсылка: ${formData.url}\nЦена: ${formData.price}\nКомментарий: ${formData.comment}`,
          source: 'cheaper',
        }),
      })

      if (response.ok) {
        alert('Заявка отправлена!')
        setFormData({ url: '', price: '', comment: '', agree: false })
        onClose()
      }
    } catch (error) {
      console.error('Error submitting cheaper:', error)
      alert('Ошибка при отправке заявки')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Нашли дешевле?">
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Ссылка на товар конкурента"
          type="url"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          required
          placeholder="https://..."
        />
        <Input
          label="Цена"
          type="number"
          step="0.01"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          required
          placeholder="0"
        />
        <div>
          <label className={styles.label}>Комментарий</label>
          <textarea
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            className={styles.textarea}
            rows={4}
            placeholder="Ваш комментарий..."
          />
        </div>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={formData.agree}
            onChange={(e) => setFormData({ ...formData, agree: e.target.checked })}
            required
          />
          <span>Согласен на обработку персональных данных</span>
        </label>
        <div className={styles.actions}>
          <Button type="submit" variant="primary" disabled={isSubmitting || !formData.agree}>
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




