'use client'

import { useState } from 'react'
import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import styles from './page.module.scss'

interface Store {
  id: string
  address: string
  mapUrl: string
}

interface ContactsContentProps {
  stores: Store[]
  contactEmail?: string
  contactPhone?: string
  contactPhone2?: string
  workingHours?: string
}

export function ContactsContent({ 
  stores, 
  contactEmail, 
  contactPhone, 
  contactPhone2,
  workingHours 
}: ContactsContentProps) {
  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Контакты', href: '/contacts' },
  ]

  const [formData, setFormData] = useState({
    message: '',
    name: '',
    phone: '',
    email: '',
    privacyConsent: false,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Проверка согласия с политикой
    if (!formData.privacyConsent) {
      alert('Для отправки формы необходимо согласиться с Политикой обработки персональных данных')
      return
    }
    
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
          message: formData.message,
          source: 'CONTACT',
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Сообщение отправлено успешно!')
        handleReset()
      } else {
        alert(data.error || 'Ошибка при отправке сообщения')
      }
    } catch (error) {
      console.error('Error submitting contact form:', error)
      alert('Ошибка при отправке сообщения')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setFormData({
      message: '',
      name: '',
      phone: '',
      email: '',
      privacyConsent: false,
    })
  }

  // Форматируем режим работы для отображения
  const formatHours = (hours?: string) => {
    if (!hours) return null
    return hours.split('\n').map((line, i) => (
      <p key={i} className={styles.contactValue}>{line}</p>
    ))
  }

  const isSingleStore = stores.length === 1

  return (
    <main>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className={styles.title}>Контакты</h1>
        
        <div className={styles.topSection}>
          <div className={styles.contactInfo}>
            {stores.length > 0 && (
              <div className={styles.contactBlock}>
                <h2 className={styles.contactLabel}>Адреса магазинов</h2>
                {stores.map((store) => (
                  <p key={store.id} className={styles.contactValue}>
                    {store.address}
                  </p>
                ))}
              </div>
            )}
            
            {(contactPhone || contactPhone2) && (
              <div className={styles.contactBlock}>
                <h2 className={styles.contactLabel}>Телефон</h2>
                {contactPhone && (
                  <p className={styles.contactValuePrimary}>{contactPhone}</p>
                )}
                {contactPhone2 && (
                  <p className={styles.contactValuePrimary}>{contactPhone2}</p>
                )}
              </div>
            )}
            
            {contactEmail && (
              <div className={styles.contactBlock}>
                <h2 className={styles.contactLabel}>Email</h2>
                <p className={styles.contactValuePrimary}>{contactEmail}</p>
              </div>
            )}
            
            {workingHours && (
              <div className={styles.contactBlock}>
                <h2 className={styles.contactLabel}>Режим работы</h2>
                {formatHours(workingHours)}
              </div>
            )}
          </div>

          <div className={styles.formContainer}>
            <h2 className={styles.formTitle}>Обратная связь</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formField}>
                <label htmlFor="message" className={styles.label}>
                  Сообщение <span className={styles.required}>*</span>
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className={styles.textarea}
                  required
                  rows={6}
                />
              </div>

              <div className={styles.formField}>
                <label htmlFor="name" className={styles.label}>
                  Ваше имя <span className={styles.required}>*</span>
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formField}>
                <label htmlFor="phone" className={styles.label}>
                  Телефон <span className={styles.required}>*</span>
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formField}>
                <label htmlFor="email" className={styles.label}>E-mail</label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.privacyConsent}
                    onChange={(e) => setFormData({ ...formData, privacyConsent: e.target.checked })}
                    required
                    className={styles.checkbox}
                  />
                  <span>
                    Я согласен с{' '}
                    <a href="/privaci" target="_blank" rel="noopener noreferrer" className={styles.privacyLink}>
                      Политикой обработки персональных данных
                    </a>
                    {' '}и использованием cookie <span className={styles.required}>*</span>
                  </span>
                </label>
              </div>

              <div className={styles.formActions}>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Отправка...' : 'Отправить'}
                </Button>
                <Button type="button" variant="outline" onClick={handleReset} disabled={isSubmitting}>
                  Сбросить
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div className={`${styles.mapsSection} ${isSingleStore ? styles.mapsSectionFull : ''}`}>
          {stores.map((store) => (
            <div key={store.id} className={styles.mapContainer}>
              <h3 className={styles.mapTitle}>{store.address}</h3>
              <iframe
                src={store.mapUrl}
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className={styles.map}
              />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

