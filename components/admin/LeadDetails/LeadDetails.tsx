'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/atoms/Button/Button'
import { Select } from '@/components/atoms/Select/Select'
import styles from './LeadDetails.module.scss'

interface LeadDetailsProps {
  lead: any
}

const sourceLabels: Record<string, string> = {
  CHEAPER: 'Нашли дешевле',
  CONTACT: 'Обратная связь',
  CALLBACK: 'Заказ звонка',
  QUESTION: 'Вопрос',
  OTHER: 'Другое',
}

const statusLabels: Record<string, string> = {
  NEW: 'Новая',
  CONTACTED: 'Связались',
  QUALIFIED: 'Квалифицирована',
  CONVERTED: 'Конвертирована',
  LOST: 'Потеряна',
}

export function LeadDetails({ lead }: LeadDetailsProps) {
  const router = useRouter()
  const [status, setStatus] = useState(lead.status)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleBack = () => {
    // Если пользователь попал на страницу напрямую, у history может не быть шага назад
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/admin/leads')
    }
  }

  const handleUpdate = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status,
        }),
      })

      const data = await response.json()
      if (data.success) {
        alert('Заявка обновлена')
        router.refresh()
      } else {
        alert(data.error || 'Ошибка при обновлении заявки')
      }
    } catch (error) {
      console.error('Error updating lead:', error)
      alert('Ошибка при обновлении заявки')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Заявка #{lead.id.substring(0, 8)}</h1>
        <Button variant="outline" onClick={handleBack}>
          ← Назад к списку
        </Button>
      </div>

      <div className={styles.sections}>
        <div className={styles.section}>
          <h2>Основная информация</h2>
          <div className={styles.info}>
            <div className={styles.infoRow}>
              <strong>Имя:</strong>
              <span>{lead.name || '-'}</span>
            </div>
            {lead.email && (
              <div className={styles.infoRow}>
                <strong>Email:</strong>
                <span>{lead.email}</span>
              </div>
            )}
            {lead.phone && (
              <div className={styles.infoRow}>
                <strong>Телефон:</strong>
                <span>{lead.phone}</span>
              </div>
            )}
            {lead.company && (
              <div className={styles.infoRow}>
                <strong>Компания:</strong>
                <span>{lead.company}</span>
              </div>
            )}
            <div className={styles.infoRow}>
              <strong>Категория:</strong>
              <span>{lead.source ? sourceLabels[lead.source] || lead.source : 'Не указана'}</span>
            </div>
            <div className={styles.infoRow}>
              <strong>Статус:</strong>
              <span className={styles.status}>{statusLabels[lead.status] || lead.status}</span>
            </div>
            <div className={styles.infoRow}>
              <strong>Создана:</strong>
              <span>{formatDate(lead.createdAt)}</span>
            </div>
            {lead.updatedAt && lead.updatedAt !== lead.createdAt && (
              <div className={styles.infoRow}>
                <strong>Обновлена:</strong>
                <span>{formatDate(lead.updatedAt)}</span>
              </div>
            )}
          </div>
        </div>

        {lead.message && (
          <div className={styles.section}>
            <h2>Сообщение</h2>
            <div className={styles.message}>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                {lead.message}
              </pre>
            </div>
          </div>
        )}

        <div className={styles.section}>
          <h2>Управление заявкой</h2>
          <div className={styles.form}>
            <Select
              label="Статус"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="NEW">Новая</option>
              <option value="CONTACTED">Связались</option>
              <option value="QUALIFIED">Квалифицирована</option>
              <option value="CONVERTED">Конвертирована</option>
              <option value="LOST">Потеряна</option>
            </Select>
            <Button
              variant="primary"
              onClick={handleUpdate}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}


