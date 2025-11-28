'use client'

import { useState } from 'react'
import { Modal } from '@/components/molecules/Modal/Modal'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { Select } from '@/components/atoms/Select/Select'
import styles from './CallbackModal.module.scss'

interface CallbackModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CallbackModal({ isOpen, onClose }: CallbackModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    time: '',
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
          source: 'callback',
          message: `Время для связи: ${formData.time}`,
        }),
      })

      if (response.ok) {
        alert('Заявка на звонок отправлена!')
        setFormData({ name: '', phone: '', time: '' })
        onClose()
      }
    } catch (error) {
      console.error('Error submitting callback:', error)
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
    <Modal isOpen={isOpen} onClose={onClose} title="Заказать звонок">
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Имя"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="Введите ваше имя"
        />

        <Input
          label="Телефон"
          type="tel"
          value={formData.phone}
          onChange={handlePhoneChange}
          required
          placeholder="+7 (___) ___-__-__"
        />

        <Select
          label="Время для связи"
          value={formData.time}
          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          required
        >
          <option value="">Выберите время</option>
          <option value="soon">В ближайшее время</option>
          <option value="9-13">С 9:00 до 13:00</option>
          <option value="13-18">С 13:00 до 18:00</option>
        </Select>

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




