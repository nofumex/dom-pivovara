'use client'

import { useState } from 'react'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import styles from './SettingsForm.module.scss'

interface SettingsFormProps {
  settings: Record<string, string>
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const [formData, setFormData] = useState({
    contactEmail: settings.contactEmail || '',
    contactPhone: settings.contactPhone || '',
    address: settings.address || '',
    minOrderTotal: settings.minOrderTotal || '1000',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      if (data.success) {
        alert('Настройки сохранены')
      } else {
        alert(data.error || 'Ошибка при сохранении настроек')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Ошибка при сохранении настроек')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <Input
        label="Email для связи"
        type="email"
        value={formData.contactEmail}
        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
      />
      <Input
        label="Телефон"
        type="tel"
        value={formData.contactPhone}
        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
      />
      <Input
        label="Адрес"
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
      />
      <Input
        label="Минимальная сумма заказа"
        type="number"
        value={formData.minOrderTotal}
        onChange={(e) => setFormData({ ...formData, minOrderTotal: e.target.value })}
      />
      <div className={styles.actions}>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>
    </form>
  )
}


