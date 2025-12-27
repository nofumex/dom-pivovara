'use client'

import { useState } from 'react'
import { Modal } from '@/components/molecules/Modal/Modal'
import { Input } from '@/components/atoms/Input/Input'
import { Button } from '@/components/atoms/Button/Button'
import styles from './QuestionModal.module.scss'

interface QuestionModalProps {
  isOpen: boolean
  onClose: () => void
}

export function QuestionModal({ isOpen, onClose }: QuestionModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    question: '',
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
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          message: formData.question,
          source: 'QUESTION',
        }),
      })

      if (response.ok) {
        alert('Ваш вопрос отправлен!')
        setFormData({ name: '', phone: '', email: '', question: '', agree: false })
        onClose()
      } else {
        alert('Ошибка при отправке вопроса')
      }
    } catch (error) {
      console.error('Error submitting question:', error)
      alert('Ошибка при отправке вопроса')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Задать вопрос">
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Ваше имя *"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="Введите ваше имя"
        />
        <Input
          label="Телефон *"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
          placeholder="+7 (___) ___-__-__"
        />
        <Input
          label="E-mail"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="mail@domen.com"
        />
        <div>
          <label className={styles.label}>Вопрос *</label>
          <textarea
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            className={styles.textarea}
            rows={4}
            required
            placeholder="Введите ваш вопрос..."
          />
        </div>
        <div className={styles.requiredNote}>* обязательные поля</div>
        <div className={styles.actions}>
          <Button type="submit" variant="primary" disabled={isSubmitting || !formData.agree}>
            {isSubmitting ? 'Отправка...' : 'Отправить'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Закрыть
          </Button>
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
      </form>
    </Modal>
  )
}
















