'use client'

import { useState } from 'react'
import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import styles from './page.module.scss'

export default function ContactsPage() {
  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Контакты', href: '/contacts' },
  ]

  const [formData, setFormData] = useState({
    message: '',
    name: '',
    phone: '',
    email: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement form submission
    console.log('Form submitted:', formData)
  }

  const handleReset = () => {
    setFormData({
      message: '',
      name: '',
      phone: '',
      email: '',
    })
  }

  return (
    <main>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className={styles.title}>Контакты</h1>
        
        <div className={styles.layout}>
          <div className={styles.contactInfo}>
            <div className={styles.contactBlock}>
              <h2 className={styles.contactLabel}>Адрес</h2>
              <p className={styles.contactValue}>Красноярск, ул. Молокова 17</p>
              <p className={styles.contactValue}>Красноярск, ул. Семафорная 271 стр.7</p>
            </div>
            
            <div className={styles.contactBlock}>
              <h2 className={styles.contactLabel}>Телефон</h2>
              <p className={styles.contactValuePrimary}>+7 (913) 555-222-6</p>
              <p className={styles.contactValuePrimary}>+7 (913) 037-32-47</p>
            </div>
            
            <div className={styles.contactBlock}>
              <h2 className={styles.contactLabel}>Email</h2>
              <p className={styles.contactValuePrimary}>info@dompivovar.ru</p>
            </div>
            
            <div className={styles.contactBlock}>
              <h2 className={styles.contactLabel}>Режим работы</h2>
              <p className={styles.contactValue}>Пн-Пт – с 10:00 до 20:00</p>
              <p className={styles.contactValue}>Сб – с 10:00 до 18:00</p>
              <p className={styles.contactValue}>Вс - с 10:00 до 16:00</p>
            </div>

            <div className={styles.maps}>
              <div className={styles.mapContainer}>
                <h3 className={styles.mapTitle}>ул. Молокова 17</h3>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2222.1234567890123!2d92.8525729!3d56.010569!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTbCsDAwJzM4LjAiTiA5MsKwNTEnMDkuMyJF!5e0!3m2!1sru!2sru!4v1234567890123!5m2!1sru!2sru"
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className={styles.map}
                />
              </div>
              
              <div className={styles.mapContainer}>
                <h3 className={styles.mapTitle}>ул. Семафорная 271 стр.7</h3>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2222.1234567890124!2d92.8600000!3d56.0200000!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTbCsDAxJzEyLjAiTiA5MsKwNTEnMzYuMCJF!5e0!3m2!1sru!2sru!4v1234567890124!5m2!1sru!2sru"
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className={styles.map}
                />
              </div>
            </div>
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

              <p className={styles.requiredNote}>* обязательные поля</p>

              <div className={styles.formActions}>
                <Button type="submit" variant="primary">Отправить</Button>
                <Button type="button" variant="outline" onClick={handleReset}>Сбросить</Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
